package utils

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

var (
	log    = logrus.New()
	client = &http.Client{}
)

const (
	endpointURL          = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0"
	userAgent            = "okhttp/4.5.0"
	clientVersion        = "4.0.530a 5fe1dc6c"
	homeGeographicRegion = "zh-Hans-CN"
	voiceDecodeKey       = "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw=="
)

func generateUserID() string {
	// 创建一个字节切片来存储随机数据
	bytes := make([]byte, 8) // 8 字节 = 64 位 = 16 位十六进制字符串
	_, err := rand.Read(bytes)
	if err != nil {
		return ""
	}
	// 将字节切片转换为十六进制字符串
	userID := hex.EncodeToString(bytes)
	return userID
}

// GetEndpoint 获取语音合成服务的端点信息
func GetEndpoint() (map[string]interface{}, error) {
	signature := Sign(endpointURL)
	headers := map[string]string{
		"Accept-Language":        "zh-Hans",
		"X-ClientVersion":        clientVersion,
		"X-UserId":               generateUserID(),
		"X-HomeGeographicRegion": homeGeographicRegion,
		"X-ClientTraceId":        uuid.New().String(),
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
			// 如果当前已达(或超过) minLen，先行结束本段合并
			if currentLen >= minLen {
				break
			}

			// 检查添加下一个段落后是否会超过 1.2 × minLen
			nextLen := utf8.RuneCountInString(strs[i])
			if currentLen+nextLen > int(float64(minLen)*1.2) {
				// 加上下一个会超标，则结束合并
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
