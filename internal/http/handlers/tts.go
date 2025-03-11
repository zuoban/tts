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
	"unicode/utf8"
)

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

// HandleOpenAITTS 处理OpenAI兼容的TTS请求
func (h *TTSHandler) HandleOpenAITTS(w http.ResponseWriter, r *http.Request) {
	// 记录请求开始时间
	startTime := time.Now()

	// 只支持POST请求
	if r.Method != http.MethodPost {
		http.Error(w, "仅支持POST请求", http.StatusMethodNotAllowed)
		return
	}

	// 解析请求
	var openaiReq struct {
		Model string  `json:"model"`
		Input string  `json:"input"`
		Voice string  `json:"voice"`
		Speed float64 `json:"speed"`
	}

	if err := json.NewDecoder(r.Body).Decode(&openaiReq); err != nil {
		http.Error(w, "无效的JSON请求: "+err.Error(), http.StatusBadRequest)
		return
	}

	// 记录解析时间
	parseTime := time.Since(startTime)

	// 检查必需字段
	if openaiReq.Input == "" {
		http.Error(w, "input字段不能为空", http.StatusBadRequest)
		return
	}

	// 映射OpenAI声音到Microsoft声音
	msVoice := openaiReq.Voice
	if openaiReq.Voice != "" && h.config.TTS.VoiceMapping[openaiReq.Voice] != "" {
		msVoice = h.config.TTS.VoiceMapping[openaiReq.Voice]
	}

	// 转换速度参数到微软格式
	msRate := h.config.TTS.DefaultRate
	if openaiReq.Speed != 0 {
		// OpenAI速度转换为微软速度格式
		// OpenAI: 0.5(慢速), 1.0(正常), 2.0(快速)
		// 微软: "-50%"(慢), "+0%"(中), "+100%"(快)
		speedPercentage := (openaiReq.Speed - 1.0) * 100
		if speedPercentage >= 0 {
			msRate = fmt.Sprintf("+%.0f", speedPercentage)
		} else {
			msRate = fmt.Sprintf("%.0f", speedPercentage)
		}
	}

	// 创建内部TTS请求
	req := models.TTSRequest{
		Text:  openaiReq.Input,
		Voice: msVoice,
		Rate:  msRate,
		Pitch: h.config.TTS.DefaultPitch,
		Style: openaiReq.Model,
	}

	log.Printf("OpenAI TTS请求: model=%s, voice=%s → %s, speed=%.2f → %s, 文本长度=%d",
		openaiReq.Model, openaiReq.Voice, msVoice, openaiReq.Speed, msRate, len(req.Text))

	// 检查文本长度
	if len(req.Text) > h.config.TTS.MaxTextLength {
		http.Error(w, "文本长度超过限制", http.StatusBadRequest)
		return
	}

	// 检查是否需要分段处理
	segmentThreshold := h.config.TTS.SegmentThreshold
	if len(req.Text) > segmentThreshold && len(req.Text) <= h.config.TTS.MaxTextLength {
		log.Printf("文本长度 %d 超过阈值 %d，使用分段处理", len(req.Text), segmentThreshold)
		// 使用分段处理
		h.handleSegmentedTTS(w, r, req)
		return
	}

	// 非流式模式处理
	synthStart := time.Now()
	resp, err := h.ttsService.SynthesizeSpeech(r.Context(), req)
	synthTime := time.Since(synthStart)
	log.Printf("TTS合成耗时: %v, 文本长度: %d", synthTime, len(req.Text))

	if err != nil {
		http.Error(w, "语音合成失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 设置响应
	w.Header().Set("Content-Type", "audio/mpeg")
	writeStart := time.Now()
	w.Write(resp.AudioContent)
	writeTime := time.Since(writeStart)

	// 记录总耗时
	totalTime := time.Since(startTime)
	log.Printf("OpenAI TTS请求总耗时: %v (解析: %v, 合成: %v, 写入: %v), 音频大小: %s",
		totalTime, parseTime, synthTime, writeTime, formatFileSize(len(resp.AudioContent)))
}

// HandleTTS 处理TTS请求
func (h *TTSHandler) HandleTTS(w http.ResponseWriter, r *http.Request) {
	// 记录请求开始时间
	startTime := time.Now()

	// 解析请求参数
	var req models.TTSRequest

	switch r.Method {
	case http.MethodGet:
		// 从URL参数获取
		q := r.URL.Query()
		req = models.TTSRequest{
			Text:  q.Get("t"),
			Voice: q.Get("v"),
			Rate:  q.Get("r"),
			Pitch: q.Get("p"),
			Style: q.Get("s"),
		}
	case http.MethodPost:
		// 从POST JSON体获取
		if r.Header.Get("Content-Type") == "application/json" {
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				log.Printf("JSON解析错误: %v", err)
				http.Error(w, "无效的JSON请求", http.StatusBadRequest)
				return
			}
		} else {
			// 表单数据
			if err := r.ParseForm(); err != nil {
				log.Printf("表单解析错误: %v", err)
				http.Error(w, "无法解析表单数据", http.StatusBadRequest)
				return
			}
			req = models.TTSRequest{
				Text:  r.FormValue("text"),
				Voice: r.FormValue("voice"),
				Rate:  r.FormValue("rate"),
				Pitch: r.FormValue("pitch"),
				Style: r.FormValue("style"),
			}
		}
	default:
		log.Printf("不支持的HTTP方法: %s", r.Method)
		http.Error(w, "仅支持GET和POST请求", http.StatusMethodNotAllowed)
		return
	}

	// 记录参数解析耗时
	parseTime := time.Since(startTime)
	log.Printf("请求参数解析耗时: %v", parseTime)

	// 验证必要参数
	if req.Text == "" {
		log.Print("错误: 未提供文本参数")
		http.Error(w, "必须提供文本参数", http.StatusBadRequest)
		return
	}

	// 使用默认值填充空白参数
	if req.Voice == "" {
		req.Voice = h.config.TTS.DefaultVoice
	}
	if req.Rate == "" {
		req.Rate = h.config.TTS.DefaultRate
	}
	if req.Pitch == "" {
		req.Pitch = h.config.TTS.DefaultPitch
	}

	// 检查文本长度
	if len(req.Text) > h.config.TTS.MaxTextLength {
		http.Error(w, "文本长度超过限制", http.StatusBadRequest)
		return
	}

	// 检查是否需要分段处理
	segmentThreshold := h.config.TTS.SegmentThreshold
	if len(req.Text) > segmentThreshold && len(req.Text) <= h.config.TTS.MaxTextLength {
		log.Printf("文本长度 %d 超过阈值 %d，使用分段处理", len(req.Text), segmentThreshold)
		// 如果文本长度超过阈值但小于最大限制，使用分段处理
		h.handleSegmentedTTS(w, r, req)
		return
	}

	synthStart := time.Now()
	resp, err := h.ttsService.SynthesizeSpeech(r.Context(), req)
	synthTime := time.Since(synthStart)
	log.Printf("TTS合成耗时: %v, 文本长度: %d", synthTime, len(req.Text))

	if err != nil {
		http.Error(w, "语音合成失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 设置响应
	w.Header().Set("Content-Type", "audio/mpeg")
	writeStart := time.Now()
	w.Write(resp.AudioContent)
	writeTime := time.Since(writeStart)

	// 记录总耗时
	totalTime := time.Since(startTime)
	log.Printf("TTS请求总耗时: %v (解析: %v, 合成: %v, 写入: %v), 音频大小: %s",
		totalTime, parseTime, synthTime, writeTime, formatFileSize(len(resp.AudioContent)))
}

// handleSegmentedTTS 处理长文本的分段TTS请求
func (h *TTSHandler) handleSegmentedTTS(w http.ResponseWriter, r *http.Request, req models.TTSRequest) {
	segmentStart := time.Now() // 分段处理开始时间
	text := req.Text

	// 开始计时：分割文本
	splitStart := time.Now()
	// 按句子分段处理
	sentences := splitTextBySentences(text)
	segmentCount := len(sentences)
	splitTime := time.Since(splitStart)

	log.Printf("分割文本耗时: %v, 文本总长度: %d, 分段数: %d, 平均句子长度: %.2f",
		splitTime, len(text), segmentCount, float64(len(text))/float64(segmentCount))

	// 创建用于存储每段音频的切片
	results := make([][]byte, segmentCount)
	errChan := make(chan error, segmentCount)
	var wg sync.WaitGroup

	// 限制并发数量，避免创建过多goroutine
	maxConcurrent := h.config.TTS.MaxConcurrent
	semaphore := make(chan struct{}, maxConcurrent)

	// 用于记录每个分段处理的时间
	segmentTimes := make([]time.Duration, segmentCount)

	// 合成阶段开始时间
	synthesisStart := time.Now()

	// 并发处理每一个句子
	for i := 0; i < segmentCount; i++ {
		wg.Add(1)
		semaphore <- struct{}{} // 获取信号量
		go func(index int) {
			defer wg.Done()
			defer func() { <-semaphore }() // 释放信号量

			// 创建该句的请求
			segReq := models.TTSRequest{
				Text:  sentences[index],
				Voice: req.Voice,
				Rate:  req.Rate,
				Pitch: req.Pitch,
			}

			log.Printf("开始处理句子 #%d: 长度=%d, 内容='%s'",
				index+1,
				utf8.RuneCountInString(sentences[index]),
				truncateForLog(sentences[index], 20))

			// 记录该段合成开始时间
			segStart := time.Now()

			// 合成该段音频
			resp, err := h.ttsService.SynthesizeSpeech(r.Context(), segReq)

			// 记录该段合成耗时
			segTime := time.Since(segStart)
			segmentTimes[index] = segTime

			if err != nil {
				log.Printf("句子 #%d 合成失败，耗时: %v, 错误: %v", index+1, segTime, err)
				select {
				case errChan <- fmt.Errorf("句子 %d 合成失败: %w", index+1, err):
				default:
					// 已经有错误了，忽略
				}
				return
			}

			log.Printf("句子 #%d 合成成功:长度=%d, 耗时=%v, 音频大小=%s",
				index+1, utf8.RuneCountInString(sentences[index]), segTime, formatFileSize(len(resp.AudioContent)))

			// 存储该段结果
			results[index] = resp.AudioContent
		}(i)
	}

	// 等待所有goroutine完成
	wg.Wait()
	close(errChan)

	// 记录所有分段合成总耗时
	synthesisTime := time.Since(synthesisStart)
	log.Printf("所有分段合成总耗时: %v, 平均每段耗时: %v",
		synthesisTime, synthesisTime/time.Duration(segmentCount))

	// 检查是否有错误发生
	if err := <-errChan; err != nil {
		http.Error(w, "语音合成失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 记录写入开始时间
	writeStart := time.Now()

	var audioData []byte
	var err error

	audioData, err = audioMerge(results)

	if err != nil {
		log.Printf("合并音频失败: %v", err)
		http.Error(w, "音频合并失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 设置响应内容类型
	w.Header().Set("Content-Type", "audio/mpeg")

	// 写入合并后的音频数据
	totalSize := len(audioData)
	if _, writeErr := w.Write(audioData); writeErr != nil {
		log.Printf("写入响应失败: %v", writeErr)
	}

	// 记录写入耗时
	writeTime := time.Since(writeStart)

	// 记录总耗时
	totalTime := time.Since(segmentStart)
	log.Printf("分段TTS请求总耗时: %v (分割: %v, 合成: %v, 写入: %v), 总音频大小: %s",
		totalTime, splitTime, synthesisTime, writeTime, formatFileSize(totalSize))
}

// splitTextBySentences 将文本按句子分割
func splitTextBySentences(text string) []string {
	// 定义句子结束的标点符号
	sentenceEnders := []string{"。", "！", "？", "…", ".", "!", "?", "…", "\n"}

	// 如果文本过短，直接作为一个句子返回
	if utf8.RuneCountInString(text) < 100 {
		return []string{text}
	}

	var sentences []string
	var currentSentence strings.Builder
	maxSentenceLength := config.Get().TTS.MaxSentenceLength // 设置单个句子的最大长度，避免过长句子
	runeCount := 0                                          // 当前句子的实际字符数量

	for _, char := range text {
		currentSentence.WriteRune(char)
		runeCount++

		// 检查是否到达句子结束标点
		lastChar := string(char)
		isSentenceEnder := false
		for _, ender := range sentenceEnders {
			if lastChar == ender {
				isSentenceEnder = true
				break
			}
		}

		// 判断是否结束一个句子 - 使用字符数量而非字节长度
		if isSentenceEnder || runeCount >= maxSentenceLength {
			// 添加当前句子到结果中
			sentence := currentSentence.String()
			if len(sentence) > 0 {
				sentences = append(sentences, sentence)
			}
			currentSentence.Reset() // 重置构建器
			runeCount = 0           // 重置字符计数器
		}
	}

	// 处理可能的最后一个句子
	if currentSentence.Len() > 0 {
		lastSentence := currentSentence.String()
		sentences = append(sentences, lastSentence)
	}

	// 合并过短的句子
	minSentenceLength := config.Get().TTS.MinSentenceLength // 设置最小句子长度阈值

	if len(sentences) > 1 {
		mergedSentences := []string{}
		var currentMerged strings.Builder
		currentMergedLength := 0

		for i, sentence := range sentences {
			sentenceLength := utf8.RuneCountInString(sentence)

			// 如果当前句子太短，且不是最后一个，考虑合并
			if sentenceLength < minSentenceLength && i < len(sentences)-1 {
				// 检查合并后是否会超过最大长度
				if currentMergedLength+sentenceLength > maxSentenceLength {
					// 合并后会超长，先保存当前内容
					if currentMerged.Len() > 0 {
						mergedSentences = append(mergedSentences, currentMerged.String())
						currentMerged.Reset()
						currentMergedLength = 0
					}
				}

				// 当前句子过短，添加到合并缓冲区
				currentMerged.WriteString(sentence)
				currentMergedLength += sentenceLength
			} else {
				// 句子足够长或是最后一句
				if currentMerged.Len() > 0 {
					// 检查合并后是否会超过最大长度
					if currentMergedLength+sentenceLength <= maxSentenceLength {
						// 有待合并的内容，将当前句子也合并进去
						currentMerged.WriteString(sentence)
						mergedSentence := currentMerged.String()
						mergedSentences = append(mergedSentences, mergedSentence)
					} else {
						// 合并后会超长，分别添加
						mergedSentence := currentMerged.String()
						mergedSentences = append(mergedSentences, mergedSentence)
						mergedSentences = append(mergedSentences, sentence)
					}
					currentMerged.Reset()
					currentMergedLength = 0
				} else {
					// 没有待合并内容，直接添加当前句子
					mergedSentences = append(mergedSentences, sentence)
				}
			}
		}

		// 处理可能剩余的合并内容
		if currentMerged.Len() > 0 {
			mergedSentence := currentMerged.String()
			mergedSentences = append(mergedSentences, mergedSentence)
			log.Printf("添加最后剩余的合并句子，长度=%d", utf8.RuneCountInString(mergedSentence))
		}

		return mergedSentences
	}

	return sentences
}

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
