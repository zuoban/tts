package utils

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

var (
	client = &http.Client{
		Timeout: 10 * time.Second,
	}
)

const (
	endpointURL          = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0"
	userAgent            = "okhttp/4.5.0"
	clientVersion        = "4.0.530a 5fe1dc6c"
	homeGeographicRegion = "zh-Hans-CN"
	voiceDecodeKey       = "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw=="
)

func generateUserID() string {
	chars := "abcdef0123456789"
	result := make([]byte, 16)
	for i := 0; i < 16; i++ {
		randIndex := make([]byte, 1)
		if _, err := rand.Read(randIndex); err != nil {
			return ""
		}
		result[i] = chars[randIndex[0]%uint8(len(chars))]
	}
	return string(result)
}

// GetEndpoint 获取语音合成服务的端点信息
func GetEndpoint() (map[string]interface{}, error) {
	signature := Sign(endpointURL)
	userId := generateUserID()
	traceId := uuid.New().String()
	headers := map[string]string{
		"Accept-Language":        "zh-Hans",
		"X-ClientVersion":        clientVersion,
		"X-UserId":               userId,
		"X-HomeGeographicRegion": homeGeographicRegion,
		"X-ClientTraceId":        traceId,
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

	logHeaders := make(map[string]string, len(headers))
	for k, v := range headers {
		if k == "X-MT-Signature" {
			logHeaders[k] = "REDACTED"
			continue
		}
		logHeaders[k] = v
	}
	headerJson, err := json.Marshal(&logHeaders)
	log.Printf("GetEndpoint -> url: %s, headers: %v\n", endpointURL, string(headerJson))

	var resp *http.Response
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		resp, lastErr = client.Do(req)
		if lastErr != nil {
			log.Printf("GetEndpoint 请求失败 (attempt %d/3): %v\n", attempt, lastErr)
			time.Sleep(time.Duration(attempt) * 200 * time.Millisecond)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			status := resp.StatusCode
			resp.Body.Close()

			// 5xx 或 429 视为可重试
			if status >= 500 || status == http.StatusTooManyRequests {
				log.Printf("GetEndpoint 响应异常 (status %d, attempt %d/3), retrying...\n", status, attempt)
				time.Sleep(time.Duration(attempt) * 200 * time.Millisecond)
				continue
			}

			log.Println("failed to get endpoint, status code: ", status)
			return nil, fmt.Errorf("failed to get endpoint, status code: %d", status)
		}

		break
	}

	if lastErr != nil {
		return nil, lastErr
	}

	if resp == nil {
		return nil, fmt.Errorf("failed to get endpoint: empty response")
	}

	defer resp.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	if region, ok := result["r"]; ok {
		log.Printf("GetEndpoint <- success, region: %v\n", region)
	} else {
		log.Println("GetEndpoint <- success")
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

// SplitAndFilterEmptyLines 拆分文本并过滤掉空行
func SplitAndFilterEmptyLines(text string) []string {
	// 按换行符拆分
	lines := strings.Split(text, "\n")
	var result []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// MergeStringsWithLimit 会将字符串切片依次累加，直到总长度 ≥ minLen。
// 但如果再合并下一段后会超过 maxLen，则提前结束本段合并，放入结果。
// 然后继续新的一段合并。
func MergeStringsWithLimit(strs []string, minLen int, maxLen int) []string {
	var result []string

	for i := 0; i < len(strs); {
		// 如果已经没有更多段落，直接退出
		if i >= len(strs) {
			break
		}

		// 从当前段开始合并
		currentBuilder := strings.Builder{}
		currentBuilder.WriteString(strs[i])
		i++

		for i < len(strs) {
			currentLen := utf8.RuneCountInString(currentBuilder.String())

			// 检查添加下一个段落后是否会超过 maxLen
			nextLen := utf8.RuneCountInString(strs[i])
			if currentLen+nextLen > maxLen {
				// 加上下一个会超过硬上限 maxLen，结束本段合并
				break
			}

			// 如果当前长度已经达到 minLen，且添加下一个会接近 maxLen，也结束合并
			if currentLen >= minLen {
				break
			}

			// 如果未超标，则继续合并这个段
			currentBuilder.WriteString("\n")
			currentBuilder.WriteString(strs[i])
			i++
		}

		// 本段合并结束，加入结果
		result = append(result, currentBuilder.String())
	}

	return result
}

// GetBaseURL 返回基础 URL，包括方案和主机，但不包括路径和查询参数
func GetBaseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}

	return fmt.Sprintf("%s://%s", scheme, c.Request.Host)
}

// JoinURL 安全地拼接基础 URL 和相对路径
func JoinURL(baseURL, relativePath string) (string, error) {
	base, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}

	rel, err := url.Parse(relativePath)
	if err != nil {
		return "", err
	}

	return base.ResolveReference(rel).String(), nil
}

func GetExp(s string) int64 {
	// 解析 JWT
	parts := strings.Split(s, ".")
	if len(parts) != 3 {
		return 0
	}

	// 解码负载部分
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return 0
	}

	// 解析 JSON
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return 0
	}

	exp, ok := data["exp"].(float64)
	if !ok {
		return 0
	}

	return int64(exp)
}
