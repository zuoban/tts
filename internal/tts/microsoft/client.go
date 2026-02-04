package microsoft

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"unicode/utf8"

	"tts/internal/config"
	"tts/internal/models"
	"tts/internal/utils"
)

const (
	userAgent      = "okhttp/4.5.0"
	voicesEndpoint = "https://%s.tts.speech.microsoft.com/cognitiveservices/voices/list"
	ttsEndpoint    = "https://%s.tts.speech.microsoft.com/cognitiveservices/v1"
	ssmlTemplate   = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang='%s'>
    <voice name='%s'>
        <mstts:express-as style="%s" styledegree="1.0" role="default">
            <prosody rate='%s%%' pitch='%s%%' volume="medium">
                %s
            </prosody>
        </mstts:express-as>
    </voice>
</speak>`
)

// Client 是Microsoft TTS API的客户端实现
type Client struct {
	defaultVoice      string
	defaultRate       string
	defaultPitch      string
	defaultFormat     string
	maxTextLength     int
	httpClient        *http.Client
	voicesCache       []models.Voice
	voicesCacheMu     sync.RWMutex
	voicesCacheExpiry time.Time
	localeCache       map[string]cachedVoices

	voicesCacheHit   uint64
	voicesCacheMiss  uint64
	localeCacheHit   uint64
	localeCacheMiss  uint64

	// 端点和认证信息
	endpoint       map[string]interface{}
	endpointMu     sync.RWMutex
	endpointExpiry time.Time
	ssmProcessor   *config.SSMLProcessor
}

type cachedVoices struct {
	voices []models.Voice
	expiry time.Time
}

// NewClient 创建一个新的Microsoft TTS客户端
func NewClient(cfg *config.Config) *Client {
	// 从Viper配置中创建SSML处理器
	ssmProcessor, err := config.NewSSMLProcessor(&cfg.SSML)
	if err != nil {
		log.Fatalf("创建SSML处理器失败: %v", err)
	}
	transport := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	client := &Client{
		defaultVoice:  cfg.TTS.DefaultVoice,
		defaultRate:   cfg.TTS.DefaultRate,
		defaultPitch:  cfg.TTS.DefaultPitch,
		defaultFormat: cfg.TTS.DefaultFormat,
		maxTextLength: cfg.TTS.MaxTextLength,
		httpClient: &http.Client{
			Timeout:   time.Duration(cfg.TTS.RequestTimeout) * time.Second,
			Transport: transport,
		},
		voicesCacheExpiry: time.Time{}, // 初始时缓存为空
		localeCache:       make(map[string]cachedVoices),
		endpointExpiry:    time.Time{}, // 初始时端点为空
		ssmProcessor:      ssmProcessor,
	}

	return client
}

// getEndpoint 获取或刷新认证端点
func (c *Client) getEndpoint(ctx context.Context) (map[string]interface{}, error) {
	c.endpointMu.RLock()
	if !c.endpointExpiry.IsZero() && time.Now().Before(c.endpointExpiry) && c.endpoint != nil {
		endpoint := c.endpoint
		c.endpointMu.RUnlock()
		return endpoint, nil
	}
	c.endpointMu.RUnlock()

	// 获取新的端点信息
	endpoint, err := utils.GetEndpoint()
	if err != nil {
		log.Printf("获取认证信息失败: %v\n", err)
		return nil, err
	}
	if region, ok := endpoint["r"]; ok {
		log.Printf("获取认证信息成功，region: %v\n", region)
	} else {
		log.Printf("获取认证信息成功\n")
	}

	// 从 jwt 中解析出到期时间 exp
	jwt := endpoint["t"].(string)
	exp := utils.GetExp(jwt)
	if exp == 0 {
		return nil, errors.New("jwt 中缺少 exp 字段")
	}
	expTime := time.Unix(exp, 0)
	log.Println("jwt  距到期时间:", expTime.Sub(time.Now()))

	// 更新缓存
	c.endpointMu.Lock()
	c.endpoint = endpoint
	c.endpointExpiry = expTime.Add(-5 * time.Minute) // 提前5分钟过期
	c.endpointMu.Unlock()

	return endpoint, nil
}

// invalidateEndpoint 清空端点缓存，触发下次请求刷新
func (c *Client) invalidateEndpoint() {
	c.endpointMu.Lock()
	c.endpoint = nil
	c.endpointExpiry = time.Time{}
	c.endpointMu.Unlock()
}

// ListVoices 获取可用的语音列表
func (c *Client) ListVoices(ctx context.Context, locale string) ([]models.Voice, error) {
	// locale 级缓存命中（仅在有 locale 时）
	if locale != "" {
		c.voicesCacheMu.RLock()
		if cached, ok := c.localeCache[locale]; ok && !cached.expiry.IsZero() && time.Now().Before(cached.expiry) && len(cached.voices) > 0 {
			c.voicesCacheMu.RUnlock()
			atomic.AddUint64(&c.localeCacheHit, 1)
			return cached.voices, nil
		}
		c.voicesCacheMu.RUnlock()
		atomic.AddUint64(&c.localeCacheMiss, 1)
	}

	// 检查缓存是否有效
	c.voicesCacheMu.RLock()
	if !c.voicesCacheExpiry.IsZero() && time.Now().Before(c.voicesCacheExpiry) && len(c.voicesCache) > 0 {
		// 从缓存中获取
		log.Println("ListVoices 从缓存中获取语音列表: ", len(c.voicesCache), "个", "剩余时间:", c.voicesCacheExpiry.Sub(time.Now()))
		voices := c.voicesCache
		c.voicesCacheMu.RUnlock()
		atomic.AddUint64(&c.voicesCacheHit, 1)

		// 如果指定了locale，则过滤结果
		if locale != "" {
			var filtered []models.Voice
			for _, voice := range voices {
				// 精确匹配或前缀匹配
				if voice.Locale == locale || strings.HasPrefix(voice.Locale, locale+"-") {
					filtered = append(filtered, voice)
				}
			}

			c.voicesCacheMu.Lock()
			c.localeCache[locale] = cachedVoices{
				voices: filtered,
				expiry: c.voicesCacheExpiry,
			}
			c.voicesCacheMu.Unlock()

			return filtered, nil
		}
		return voices, nil
	}
	c.voicesCacheMu.RUnlock()
	atomic.AddUint64(&c.voicesCacheMiss, 1)

	// 缓存无效，需要从API获取
	log.Println("ListVoices, 缓存未命中，从API获取语音列表")
	endpoint, err := c.getEndpoint(ctx)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf(voicesEndpoint, endpoint["r"])
	if region, ok := endpoint["r"]; ok {
		log.Printf("ListVoices, region: %v\n", region)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	// 使用新的认证方式
	req.Header.Set("Authorization", endpoint["t"].(string))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error: %s, status: %d", string(body), resp.StatusCode)
	}

	var msVoices []MicrosoftVoice
	if err := json.NewDecoder(resp.Body).Decode(&msVoices); err != nil {
		return nil, err
	}

	// 转换为通用模型
	voices := make([]models.Voice, len(msVoices))
	for i, v := range msVoices {
		voices[i] = models.Voice{
			Name:            v.Name,
			DisplayName:     v.DisplayName,
			LocalName:       v.LocalName,
			ShortName:       v.ShortName,
			Gender:          v.Gender,
			Locale:          v.Locale,
			LocaleName:      v.LocaleName,
			StyleList:       v.StyleList,
			SampleRateHertz: v.SampleRateHertz, // 直接使用字符串，无需转换
		}
	}

	// 更新缓存
	c.voicesCacheMu.Lock()
	c.voicesCache = voices
	c.voicesCacheExpiry = time.Now().Add(8 * time.Hour) // 缓存 8 小时
	c.localeCache = make(map[string]cachedVoices)       // 语音列表更新后清空 locale 缓存
	c.voicesCacheMu.Unlock()

	// 如果指定了locale，则过滤结果
	if locale != "" {
		var filtered []models.Voice
		for _, voice := range voices {
			// 精确匹配或前缀匹配
			if voice.Locale == locale || strings.HasPrefix(voice.Locale, locale+"-") {
				filtered = append(filtered, voice)
			}
		}

		c.voicesCacheMu.Lock()
		c.localeCache[locale] = cachedVoices{
			voices: filtered,
			expiry: c.voicesCacheExpiry,
		}
		c.voicesCacheMu.Unlock()

		return filtered, nil
	}

	return voices, nil
}

// WarmupVoicesCache 预热声音列表缓存
func (c *Client) WarmupVoicesCache(ctx context.Context) error {
	// 检查缓存是否已经有效
	c.voicesCacheMu.RLock()
	if !c.voicesCacheExpiry.IsZero() && time.Now().Before(c.voicesCacheExpiry) && len(c.voicesCache) > 0 {
		c.voicesCacheMu.RUnlock()
		log.Printf("声音列表缓存已有效，跳过预热，当前缓存 %d 个语音，剩余时间: %v",
			len(c.voicesCache), c.voicesCacheExpiry.Sub(time.Now()))
		return nil
	}
	c.voicesCacheMu.RUnlock()

	log.Println("开始预热声音列表缓存...")

	// 调用 ListVoices 来填充缓存
	voices, err := c.ListVoices(ctx, "")
	if err != nil {
		log.Printf("预热声音列表缓存失败: %v", err)
		return err
	}

	log.Printf("声音列表缓存预热成功，缓存了 %d 个语音", len(voices))
	return nil
}

// SynthesizeSpeech 将文本转换为语音
func (c *Client) SynthesizeSpeech(ctx context.Context, req models.TTSRequest) (*models.TTSResponse, error) {
	resp, err := c.createTTSRequest(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// 读取音频数据
	audio, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return &models.TTSResponse{
		AudioContent: audio,
		ContentType:  contentTypeFromFormat(c.defaultFormat),
		CacheHit:     false,
	}, nil
}

func contentTypeFromFormat(format string) string {
	if ct, ok := FormatContentTypeMap[format]; ok {
		return ct
	}
	return "audio/mpeg"
}

// createTTSRequest 创建并执行TTS请求，返回HTTP响应
func (c *Client) createTTSRequest(ctx context.Context, req models.TTSRequest) (*http.Response, error) {
	return c.createTTSRequestWithRetry(ctx, req, false)
}

// createTTSRequestWithRetry 在认证失效时尝试刷新并重试一次
func (c *Client) createTTSRequestWithRetry(ctx context.Context, req models.TTSRequest, retried bool) (*http.Response, error) {
	// 参数验证
	if req.Text == "" {
		return nil, errors.New("文本不能为空")
	}

	textLen := utf8.RuneCountInString(req.Text)
	if textLen > c.maxTextLength {
		return nil, fmt.Errorf("文本长度超过限制 (%d > %d)", textLen, c.maxTextLength)
	}

	// 使用默认值填充空白参数
	voice := req.Voice
	if voice == "" {
		voice = c.defaultVoice
	}

	style := req.Style
	if req.Style == "" {
		style = "general"
	}

	rate := req.Rate
	if rate == "" {
		rate = c.defaultRate
	}

	pitch := req.Pitch
	if pitch == "" {
		pitch = c.defaultPitch
	}

	// 提取语言
	locale := "zh-CN" // 默认
	parts := strings.Split(voice, "-")
	if len(parts) >= 2 {
		locale = parts[0] + "-" + parts[1]
	}

	// 对文本进行HTML转义，防止XML解析错误
	escapedText := c.ssmProcessor.EscapeSSML(req.Text)

	// 准备SSML内容
	ssml := fmt.Sprintf(ssmlTemplate, locale, voice, style, rate, pitch, escapedText)

	// 获取端点信息
	endpoint, err := c.getEndpoint(ctx)
	if err != nil {
		return nil, err
	}

	// 准备请求
	url := fmt.Sprintf(ttsEndpoint, endpoint["r"])
	reqBody := bytes.NewBufferString(ssml)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, reqBody)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", endpoint["t"].(string))
	httpReq.Header.Set("Content-Type", "application/ssml+xml")
	httpReq.Header.Set("X-Microsoft-OutputFormat", c.defaultFormat)
	httpReq.Header.Set("User-Agent", userAgent)

	// 发送请求
	resp, err := c.httpClient.Do(httpReq)

	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		// 获取响应体以便调试
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		requestID := resp.Header.Get("x-ms-request-id")
		errText := string(body)
		log.Printf("TTS API错误: %s, 状态码: %d, x-ms-request-id: %s", errText, resp.StatusCode, requestID)

		if !retried && (resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden) {
			log.Printf("TTS API返回 %d，刷新认证信息后重试一次", resp.StatusCode)
			c.invalidateEndpoint()
			return c.createTTSRequestWithRetry(ctx, req, true)
		}

		if requestID != "" {
			return nil, fmt.Errorf("TTS API错误: %s, 状态码: %d, x-ms-request-id: %s", errText, resp.StatusCode, requestID)
		}
		return nil, fmt.Errorf("TTS API错误: %s, 状态码: %d", errText, resp.StatusCode)
	}

	return resp, nil
}
