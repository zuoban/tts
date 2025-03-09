package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

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
	userId               = "0f04d16a175c411e"
	homeGeographicRegion = "zh-Hans-CN"
	clientTraceId        = "aab069b9-70a7-4844-a734-96cd78d94be9"
	voiceDecodeKey       = "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw=="
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
