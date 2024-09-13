package utils

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"html"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var (
	log            = logrus.New()
	client         = &http.Client{}
	voiceListCache []interface{}
	cacheDuration  = 1 * time.Hour // 缓存持续时间
)

func init() {
	ticker := time.NewTicker(cacheDuration)
	go func() {
		for range ticker.C {
			voiceListCache = nil
		}
	}()
}

const (
	endpointURL          = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0"
	voicesListURL        = "https://eastus.api.speech.microsoft.com/cognitiveservices/voices/list"
	userAgent            = "okhttp/4.5.0"
	clientVersion        = "4.0.530a 5fe1dc6c"
	userId               = "0f04d16a175c411e"
	homeGeographicRegion = "zh-Hans-CN"
	clientTraceId        = "aab069b9-70a7-4844-a734-96cd78d94be9"
	voiceDecodeKey       = "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw=="
	defaultVoiceName     = "zh-CN-XiaoxiaoMultilingualNeural"
	defaultRate          = "0"
	defaultPitch         = "0"
	defaultOutputFormat  = "audio-24khz-48kbitrate-mono-mp3"
)

var (
	errEndpoint = errors.New("failed to get endpoint")
)

// GetEndpoint 获取语音合成服务的端点信息
func GetEndpoint() (map[string]interface{}, error) {
	signature := Sign(endpointURL)
	headers := map[string]string{
		"Accept-Language":        "zh-Hans",
		"X-ClientVersion":        clientVersion,
		"X-UserId":               userId,
		"X-HomeGeographicRegion": homeGeographicRegion,
		"X-ClientTraceId":        clientTraceId,
		"X-MT-Signature":         signature,
		"User-Agent":             userAgent,
		"Content-Type":           "application/json; charset=utf-8",
		"Content-Length":         "0",
		"Accept-Encoding":        "gzip",
	}
	req, err := http.NewRequest("POST", endpointURL, nil)
	if err != nil {
		return nil, err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Error("failed to do request: ", err)
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// Sign 生成签名
func Sign(urlStr string) string {
	u := strings.Split(urlStr, "://")[1]
	encodedUrl := url.QueryEscape(u)
	uuidStr := strings.ReplaceAll(uuid.New().String(), "-", "")
	formattedDate := strings.ToLower(time.Now().UTC().Format("Mon, 02 Jan 2006 15:04:05")) + "gmt"
	bytesToSign := fmt.Sprintf("MSTranslatorAndroidApp%s%s%s", encodedUrl, formattedDate, uuidStr)
	bytesToSign = strings.ToLower(bytesToSign)
	decode, _ := base64.StdEncoding.DecodeString(voiceDecodeKey)
	hash := hmac.New(sha256.New, decode)
	hash.Write([]byte(bytesToSign))
	secretKey := hash.Sum(nil)
	signBase64 := base64.StdEncoding.EncodeToString(secretKey)
	return fmt.Sprintf("MSTranslatorAndroidApp::%s::%s::%s", signBase64, formattedDate, uuidStr)
}

// GetVoice 获取语音合成结果
// GetVoice 获取语音合成结果
func GetVoice(text, voiceName, rate, pitch, outputFormat string) ([]byte, error) {
	if voiceName == "" {
		voiceName = defaultVoiceName
	}
	if rate == "" {
		rate = defaultRate
	}
	if pitch == "" {
		pitch = defaultPitch
	}
	if outputFormat == "" {
		outputFormat = defaultOutputFormat
	}

	endpoint, err := GetEndpoint()
	if err != nil {
		return nil, err
	}

	u := fmt.Sprintf("https://%s.tts.speech.microsoft.com/cognitiveservices/v1", endpoint["r"])
	headers := map[string]string{
		"Authorization":            endpoint["t"].(string),
		"Content-Type":             "application/ssml+xml",
		"X-Microsoft-OutputFormat": outputFormat,
	}

	ssml := GetSsml(text, voiceName, rate, pitch)

	req, err := http.NewRequest("POST", u, bytes.NewBufferString(ssml))
	if err != nil {
		return nil, err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Error("failed to do request: ", err)
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

// GetSsml 生成 SSML 格式的文本
func GetSsml(text, voiceName, rate, pitch string) string {
	// 对文本进行转义
	text = html.EscapeString(text)
	return fmt.Sprintf(`
   <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN">
     <voice name="%s">
       <mstts:express-as style="general" styledegree="1.0" role="default">
         <prosody rate="%s%%" pitch="%s%%" volume="50">%s</prosody>
       </mstts:express-as>
     </voice>
   </speak>
 `, voiceName, rate, pitch, text)
}

// VoiceList 获取可用的语音列表
func VoiceList() ([]interface{}, error) {
	// 如果缓存中有值，直接返回缓存的结果
	if voiceListCache != nil {
		return voiceListCache, nil
	}

	headers := map[string]string{
		"User-Agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.26",
		"X-Ms-Useragent": "SpeechStudio/2021.05.001",
		"Content-Type":   "application/json",
		"Origin":         "https://azure.microsoft.com",
		"Referer":        "https://azure.microsoft.com",
	}

	req, err := http.NewRequest("GET", voicesListURL, nil)
	if err != nil {
		return nil, err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Error("failed to do request: ", err)
		return nil, err
	}
	defer resp.Body.Close()

	var result []interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	// 将结果存储到缓存中
	voiceListCache = result

	return result, nil
}

func ByteCountIEC(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %ciB", float64(b)/float64(div), "KMGTPE"[exp])
}
