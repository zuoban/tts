package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"tts/internal/config"
	"tts/internal/models"
	"tts/internal/tts"
	"tts/internal/utils"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
)

var cfg = config.Get()

// truncateForLog 截断文本用于日志显示，同时显示开头和结尾
func truncateForLog(text string, maxLength int) string {
	// 先去除换行符
	text = strings.ReplaceAll(text, "\n", " ")
	text = strings.ReplaceAll(text, "\r", " ")

	runes := []rune(text)
	if len(runes) <= maxLength {
		return text
	}
	// 计算开头和结尾各显示多少字符
	halfLength := maxLength / 2
	return string(runes[:halfLength]) + "..." + string(runes[len(runes)-halfLength:])
}

// audioMerge 音频合并
func audioMerge(audioSegments [][]byte) ([]byte, error) {
	if len(audioSegments) == 0 {
		return nil, fmt.Errorf("没有音频片段可合并")
	}

	// 使用 ffmpeg 合并音频
	tempDir, err := os.MkdirTemp("", "audio_merge_")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)

	listFile := filepath.Join(tempDir, "concat.txt")
	lf, err := os.Create(listFile)
	if err != nil {
		return nil, err
	}

	for i, seg := range audioSegments {
		segFile := filepath.Join(tempDir, fmt.Sprintf("seg_%d.mp3", i))
		if err := os.WriteFile(segFile, seg, 0644); err != nil {
			return nil, err
		}
		if _, err := lf.WriteString(fmt.Sprintf("file '%s'\n", segFile)); err != nil {
			return nil, err
		}
	}
	lf.Close()

	outputFile := filepath.Join(tempDir, "output.mp3")

	cmd := exec.Command("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outputFile)
	if err := cmd.Run(); err != nil {
		return nil, err
	}

	mergedData, err := os.ReadFile(outputFile)
	if err != nil {
		return nil, err
	}
	log.Printf("使用ffmpeg合并完成，总大小: %s", formatFileSize(len(mergedData)))
	return mergedData, nil
}

// formatFileSize 格式化文件大小
func formatFileSize(size int) string {
	switch {
	case size < 1024:
		return fmt.Sprintf("%d B", size)
	case size < 1024*1024:
		return fmt.Sprintf("%.2f KB", float64(size)/1024.0)
	case size < 1024*1024*1024:
		return fmt.Sprintf("%.2f MB", float64(size)/(1024.0*1024.0))
	default:
		return fmt.Sprintf("%.2f GB", float64(size)/(1024.0*1024.0*1024.0))
	}
}

// TTSHandler 处理TTS请求
type TTSHandler struct {
	ttsService tts.Service
	config     *config.Config
}

// NewTTSHandler 创建一个新的TTS处理器
func NewTTSHandler(service tts.Service, cfg *config.Config) *TTSHandler {
	return &TTSHandler{
		ttsService: service,
		config:     cfg,
	}
}

// processTTSRequest 处理TTS请求的核心逻辑
func (h *TTSHandler) processTTSRequest(c *gin.Context, req models.TTSRequest, startTime time.Time, parseTime time.Duration, requestType string) {
	// 验证必要参数
	if req.Text == "" {
		log.Print("错误: 未提供文本参数")
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "必须提供文本参数"})
		return
	}

	// 使用默认值填充空白参数
	h.fillDefaultValues(&req)

	// 检查文本长度
	reqTextLength := utf8.RuneCountInString(req.Text)
	if reqTextLength > h.config.TTS.MaxTextLength {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "文本长度超过限制"})
		return
	}

	// 检查是否需要分段处理
	segmentThreshold := h.config.TTS.SegmentThreshold
	if reqTextLength > segmentThreshold && reqTextLength <= h.config.TTS.MaxTextLength {
		log.Printf("文本长度 %d 超过阈值 %d，使用分段处理", reqTextLength, segmentThreshold)
		h.handleSegmentedTTS(c, req)
		return
	}

	synthStart := time.Now()
	resp, err := h.ttsService.SynthesizeSpeech(c.Request.Context(), req)
	synthTime := time.Since(synthStart)
	log.Printf("TTS合成耗时: %v, 文本长度: %d", synthTime, reqTextLength)

	if err != nil {
		log.Printf("TTS合成失败: %v", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "语音合成失败: " + err.Error()})
		return
	}

	// 设置响应
	c.Header("Content-Type", "audio/mpeg")
	writeStart := time.Now()
	if _, err := c.Writer.Write(resp.AudioContent); err != nil {
		log.Printf("写入响应失败: %v", err)
		return
	}
	writeTime := time.Since(writeStart)

	// 记录总耗时
	totalTime := time.Since(startTime)
	log.Printf("%s请求总耗时: %v (解析: %v, 合成: %v, 写入: %v), 音频大小: %s",
		requestType, totalTime, parseTime, synthTime, writeTime, formatFileSize(len(resp.AudioContent)))
}

// fillDefaultValues 填充默认值
func (h *TTSHandler) fillDefaultValues(req *models.TTSRequest) {
	if req.Voice == "" {
		req.Voice = h.config.TTS.DefaultVoice
	}
	if req.Rate == "" {
		req.Rate = h.config.TTS.DefaultRate
	}
	if req.Pitch == "" {
		req.Pitch = h.config.TTS.DefaultPitch
	}
}

// HandleTTS 处理TTS请求
func (h *TTSHandler) HandleTTS(c *gin.Context) {
	switch c.Request.Method {
	case http.MethodGet:
		h.HandleTTSGet(c)
	case http.MethodPost:
		h.HandleTTSPost(c)
	default:
		c.AbortWithStatusJSON(http.StatusMethodNotAllowed, gin.H{"error": "仅支持GET和POST请求"})
	}
}

// HandleTTSGet 处理GET方式的TTS请求
func (h *TTSHandler) HandleTTSGet(c *gin.Context) {
	startTime := time.Now()

	var req models.TTSRequest

	if c.Query("t") != "" {
		req = models.TTSRequest{
			Text:  c.Query("t"),
			Voice: c.Query("v"),
			Rate:  c.Query("r"),
			Pitch: c.Query("p"),
			Style: c.Query("s"),
		}
	} else if c.Query("text") != "" {
		req = models.TTSRequest{
			Text:  c.Query("text"),
			Voice: c.Query("voice"),
			Rate:  c.Query("rate"),
			Pitch: c.Query("pitch"),
			Style: c.Query("style"),
		}
	} else {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "必须提供文本参数"})
		return
	}

	parseTime := time.Since(startTime)
	h.processTTSRequest(c, req, startTime, parseTime, "TTS GET")
}

// HandleTTSPost 处理POST方式的TTS请求
func (h *TTSHandler) HandleTTSPost(c *gin.Context) {
	startTime := time.Now()

	// 从POST JSON体或表单数据获取
	var req models.TTSRequest
	var err error

	if c.ContentType() == "application/json" {
		err = c.ShouldBindJSON(&req)
		if err != nil {
			log.Printf("JSON解析错误: %v", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "无效的JSON请求"})
			return
		}
	} else {
		err = c.ShouldBind(&req)
		if err != nil {
			log.Printf("表单解析错误: %v", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "无法解析表单数据"})
			return
		}
	}

	parseTime := time.Since(startTime)
	h.processTTSRequest(c, req, startTime, parseTime, "TTS POST")
}

// HandleOpenAITTS 处理OpenAI兼容的TTS请求
func (h *TTSHandler) HandleOpenAITTS(c *gin.Context) {
	startTime := time.Now()

	// 只支持POST请求
	if c.Request.Method != http.MethodPost {
		c.AbortWithStatusJSON(http.StatusMethodNotAllowed, gin.H{"error": "仅支持POST请求"})
		return
	}

	// 解析请求
	var openaiReq models.OpenAIRequest
	if err := c.ShouldBindJSON(&openaiReq); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "无效的JSON请求: " + err.Error()})
		return
	}

	parseTime := time.Since(startTime)

	// 检查必需字段
	if openaiReq.Input == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "input字段不能为空"})
		return
	}

	// 创建内部TTS请求
	req := h.convertOpenAIRequest(openaiReq)

	log.Printf("OpenAI TTS请求: model=%s, voice=%s → %s, speed=%.2f → %s, 文本长度=%d",
		openaiReq.Model, openaiReq.Voice, req.Voice, openaiReq.Speed, req.Rate, utf8.RuneCountInString(req.Text))

	h.processTTSRequest(c, req, startTime, parseTime, "OpenAI TTS")
}

// convertOpenAIRequest 将OpenAI请求转换为内部请求格式
func (h *TTSHandler) convertOpenAIRequest(openaiReq models.OpenAIRequest) models.TTSRequest {
	// 映射OpenAI声音到Microsoft声音
	msVoice := openaiReq.Voice
	if openaiReq.Voice != "" && h.config.TTS.VoiceMapping[openaiReq.Voice] != "" {
		msVoice = h.config.TTS.VoiceMapping[openaiReq.Voice]
	}

	// 转换速度参数到微软格式
	msRate := h.config.TTS.DefaultRate
	if openaiReq.Speed != 0 {
		speedPercentage := (openaiReq.Speed - 1.0) * 100
		if speedPercentage >= 0 {
			msRate = fmt.Sprintf("+%.0f", speedPercentage)
		} else {
			msRate = fmt.Sprintf("%.0f", speedPercentage)
		}
	}

	return models.TTSRequest{
		Text:  openaiReq.Input,
		Voice: msVoice,
		Rate:  msRate,
		Pitch: h.config.TTS.DefaultPitch,
		Style: openaiReq.Model,
	}
}

// Add this struct to store synthesis results
type sentenceSynthesisResult struct {
	index     int
	length    int
	audioSize int
	content   string
	duration  time.Duration
}

// Modify the handleSegmentedTTS function to collect and display results in a table
func (h *TTSHandler) handleSegmentedTTS(c *gin.Context, req models.TTSRequest) {
	segmentStart := time.Now()
	text := req.Text

	// 开始计时：分割文本
	splitStart := time.Now()
	sentences := splitTextBySentences(text)
	segmentCount := len(sentences)
	splitTime := time.Since(splitStart)

	log.Printf("分割文本耗时: %v, 文本总长度: %d, 分段数: %d, 平均句子长度: %.2f",
		splitTime, utf8.RuneCountInString(text), segmentCount, float64(utf8.RuneCountInString(text))/float64(segmentCount))

	// 创建用于存储每段音频的切片
	results := make([][]byte, segmentCount)
	// 创建用于收集合成结果信息的切片
	synthResults := make([]sentenceSynthesisResult, segmentCount)

	errChan := make(chan error, 1)
	var wg sync.WaitGroup
	var synthMutex sync.Mutex

	// 限制并发数量
	maxConcurrent := h.config.TTS.MaxConcurrent
	semaphore := make(chan struct{}, maxConcurrent)

	// 合成阶段开始时间
	synthesisStart := time.Now()

	// 并发处理每一个句子
	for i := 0; i < segmentCount; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()

			select {
			case semaphore <- struct{}{}: // 获取信号量
				defer func() { <-semaphore }() // 释放信号量
			case <-c.Request.Context().Done():
				select {
				case errChan <- c.Request.Context().Err():
				default:
				}
				return
			}

			// 创建该句的请求
			segReq := models.TTSRequest{
				Text:  sentences[index],
				Voice: req.Voice,
				Rate:  req.Rate,
				Pitch: req.Pitch,
				Style: req.Style,
			}

			startTime := time.Now()
			// 合成该段音频
			resp, err := h.ttsService.SynthesizeSpeech(c.Request.Context(), segReq)
			synthDuration := time.Since(startTime)

			if err != nil {
				select {
				case errChan <- fmt.Errorf("句子 %d 合成失败: %w", index+1, err):
				default:
				}
				return
			}

			// 收集合成结果信息，而不是立即打印
			result := sentenceSynthesisResult{
				index:     index,
				length:    utf8.RuneCountInString(sentences[index]),
				audioSize: len(resp.AudioContent),
				content:   truncateForLog(sentences[index], 20),
				duration:  synthDuration,
			}

			synthMutex.Lock()
			synthResults[index] = result
			results[index] = resp.AudioContent
			synthMutex.Unlock()
		}(i)
	}

	// 等待所有goroutine完成或出错
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// 所有goroutine正常完成
	case err := <-errChan:
		// 发生错误
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	case <-c.Request.Context().Done():
		// 请求被取消
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "请求被取消"})
		return
	}

	// 打印表格格式的合成结果
	log.Println("句子合成结果表:")
	log.Println("-------------------------------------------------------------")
	log.Println("序号 | 长度  |    音频大小   |    耗时    | 内容")
	log.Println("-------------------------------------------------------------")
	for i := 0; i < segmentCount; i++ {
		result := synthResults[i]
		log.Printf("#%-3d | %4d | %12s | %10v | %s",
			i+1,
			result.length,
			formatFileSize(result.audioSize),
			result.duration.Round(time.Millisecond),
			result.content)
	}
	log.Println("-------------------------------------------------------------")

	// 记录合成总耗时
	synthesisTime := time.Since(synthesisStart)
	log.Printf("所有分段合成总耗时: %v, 平均每段耗时: %v",
		synthesisTime, synthesisTime/time.Duration(segmentCount))

	// 合并音频
	writeStart := time.Now()
	audioData, err := audioMerge(results)
	if err != nil {
		log.Printf("合并音频失败: %v", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "音频合并失败: " + err.Error()})
		return
	}

	// 设置响应内容类型并写入数据
	c.Header("Content-Type", "audio/mpeg")
	if _, err := c.Writer.Write(audioData); err != nil {
		log.Printf("写入响应失败: %v", err)
		return
	}

	// 记录写入耗时和总耗时
	writeTime := time.Since(writeStart)
	totalTime := time.Since(segmentStart)
	log.Printf("分段TTS请求总耗时: %v (分割: %v, 合成: %v, 写入: %v), 总音频大小: %s",
		totalTime, splitTime, synthesisTime, writeTime, formatFileSize(len(audioData)))
}

// HandleReader 返回 reader 可导入的格式
func (h *TTSHandler) HandleReader(context *gin.Context) {
	// 从URL参数获取 - 支持完整参数名和简短参数名
	text := context.Query("text")
	if text == "" {
		text = context.Query("t")
	}
	voice := context.Query("voice")
	if voice == "" {
		voice = context.Query("v")
	}
	rate := context.Query("rate")
	if rate == "" {
		rate = context.Query("r")
	}
	pitch := context.Query("pitch")
	if pitch == "" {
		pitch = context.Query("p")
	}
	style := context.Query("style")
	if style == "" {
		style = context.Query("s")
	}

	req := models.TTSRequest{
		Text:  text,
		Voice: voice,
		Rate:  rate,
		Pitch: pitch,
		Style: style,
	}
	displayName := context.Query("n")
	api_key := context.Query("api_key")

	baseUrl := utils.GetBaseURL(context)
	basePath, err := utils.JoinURL(baseUrl, cfg.Server.BasePath)
	if err != nil {
		context.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 构建基本URL
	urlParams := []string{"t={{java.encodeURI(speakText)}}", "r={{speakSpeed*4}}"}

	// 只有有值的参数才添加
	if req.Voice != "" {
		urlParams = append(urlParams, fmt.Sprintf("v=%s", req.Voice))
	}

	if req.Pitch != "" {
		urlParams = append(urlParams, fmt.Sprintf("p=%s", req.Pitch))
	}

	if req.Style != "" {
		urlParams = append(urlParams, fmt.Sprintf("s=%s", req.Style))
	}

	// 只有配置了API密钥且请求提供了api_key参数时才添加
	if cfg.TTS.ApiKey != "" && api_key != "" {
		urlParams = append(urlParams, fmt.Sprintf("api_key=%s", api_key))
	}

	url := fmt.Sprintf("%s/tts?%s", basePath, strings.Join(urlParams, "&"))

	encoder := json.NewEncoder(context.Writer)
	encoder.SetEscapeHTML(false)
	context.Status(http.StatusOK)
	encoder.Encode(models.ReaderResponse{
		Id:   time.Now().Unix(),
		Name: displayName,
		Url:  url,
	})
}

// HandleIFreeTime 处理IFreeTime应用请求
func (h *TTSHandler) HandleIFreeTime(context *gin.Context) {
	// 从URL参数获取 - 支持完整参数名和简短参数名
	voice := context.Query("voice")
	if voice == "" {
		voice = context.Query("v")
	}
	rate := context.Query("rate")
	if rate == "" {
		rate = context.Query("r")
	}
	pitch := context.Query("pitch")
	if pitch == "" {
		pitch = context.Query("p")
	}
	style := context.Query("style")
	if style == "" {
		style = context.Query("s")
	}

	req := models.TTSRequest{
		Voice: voice,
		Rate:  rate,
		Pitch: pitch,
		Style: style,
	}
	displayName := context.Query("n")
	api_key := context.Query("api_key")

	// 获取基础URL
	baseUrl := utils.GetBaseURL(context)
	basePath, err := utils.JoinURL(baseUrl, cfg.Server.BasePath)
	if err != nil {
		context.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 构建URL
	url := fmt.Sprintf("%s/tts", basePath)

	// 生成随机的唯一ID
	ttsConfigID := uuid.New().String()

	// 构建声音列表
	var voiceList []models.IFreeTimeVoice

	// 构建请求参数
	params := map[string]string{
		"t": "%@", // %@ 是 IFreeTime 中的文本占位符
		"v": req.Voice,
		"r": req.Rate,
		"p": req.Pitch,
		"s": req.Style,
	}

	// 只有配置了API密钥且请求提供了api_key参数时才添加
	if h.config.TTS.ApiKey != "" && api_key != "" {
		params["api_key"] = api_key
	}

	// 构建响应
	response := models.IFreeTimeResponse{
		LoginUrl:       "",
		MaxWordCount:   "",
		CustomRules:    map[string]interface{}{},
		TtsConfigGroup: "Azure",
		TTSName:        displayName,
		ClassName:      "JxdAdvCustomTTS",
		TTSConfigID:    ttsConfigID,
		HttpConfigs: models.IFreeTimeHttpConfig{
			UseCookies: 1,
			Headers:    map[string]interface{}{},
		},
		VoiceList: voiceList,
		TtsHandles: []models.IFreeTimeTtsHandle{
			{
				ParamsEx:         "",
				ProcessType:      1,
				MaxPageCount:     1,
				NextPageMethod:   1,
				Method:           1,
				RequestByWebView: 0,
				Parser:           map[string]interface{}{},
				NextPageParams:   map[string]interface{}{},
				Url:              url,
				Params:           params,
				HttpConfigs: models.IFreeTimeHttpConfig{
					UseCookies: 1,
					Headers:    map[string]interface{}{},
				},
			},
		},
	}

	// 设置响应类型
	context.Header("Content-Type", "application/json")
	context.JSON(http.StatusOK, response)
}

// splitTextBySentences 将文本按句子分割
func splitTextBySentences(text string) []string {
	// 如果文本过短，直接作为一个句子返回
	if utf8.RuneCountInString(text) < 100 {
		return []string{text}
	}

	maxLen := cfg.TTS.MaxSentenceLength
	minLen := cfg.TTS.MinSentenceLength

	// 第一次分割：按标点和长度限制分割
	sentences := utils.SplitAndFilterEmptyLines(text)
	// 第二次处理：合并过短的句子
	shortSentences := utils.MergeStringsWithLimit(sentences, minLen, maxLen)
	log.Printf("分割后的句子数: %d → %d", len(sentences), len(shortSentences))
	return shortSentences
}
