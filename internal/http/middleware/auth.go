package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"strings"

	"github.com/gin-gonic/gin"
)

// TTSAuth Auth 中间件
func TTSAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从查询参数中获取 api_key

		if apiKey == "" {
			// 如果没有配置 API 密钥，跳过验证
			c.Next()
			return
		}

		extractApiKey, _ := ExtractAPIKey(c)
		if extractApiKey == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "未提供授权令牌"})
			return
		}

		if extractApiKey != apiKey {
			c.AbortWithStatusJSON(401, gin.H{"error": "未授权访问: 无效的 API 密钥"})
			return
		}

		// 验证通过，继续处理请求
		c.Next()
	}
}

// ExtractAPIKey 从 gin.Context 中提取 api_key
// 优先级：Authorization header > query parameter > form > JSON body
func ExtractAPIKey(c *gin.Context) (string, string) {
	// 1. 优先从 Authorization 请求头中获取
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// 支持 "Bearer <token>" 和直接 "api_key" 两种格式
		if strings.HasPrefix(authHeader, "Bearer ") {
			apiKey := strings.TrimPrefix(authHeader, "Bearer ")
			if apiKey != "" {
				return apiKey, "header"
			}
		} else {
			// 直接使用 Authorization 头的值作为 api_key
			return authHeader, "header"
		}
	}

	// 1.1 支持 X-API-Key 请求头
	if apiKey := c.GetHeader("X-API-Key"); apiKey != "" {
		return apiKey, "header"
	}

	// 2. 从查询参数中获取 api_key
	if apiKey := c.Query("api_key"); apiKey != "" {
		return apiKey, "query"
	}

	// 3. 从表单中获取 api_key
	if apiKey := c.PostForm("api_key"); apiKey != "" {
		return apiKey, "form"
	}

	// 4. 从请求体的 JSON 对象中获取 api_key
	// 注意：不能使用 ShouldBindJSON，避免消费掉 request body
	if c.ContentType() == "application/json" {
		raw, err := io.ReadAll(c.Request.Body)
		if err == nil && len(raw) > 0 {
			// 还原 body，避免影响后续处理器的绑定
			c.Request.Body = io.NopCloser(bytes.NewBuffer(raw))

			var jsonBody map[string]interface{}
			if err := json.Unmarshal(raw, &jsonBody); err == nil {
				if apiKey, exists := jsonBody["api_key"]; exists {
					if keyStr, ok := apiKey.(string); ok && keyStr != "" {
						return keyStr, "json"
					}
				}
			}
		} else {
			// 即使读取失败，也要尽量恢复 body，避免后续 handler 出现 EOF
			if raw != nil {
				c.Request.Body = io.NopCloser(bytes.NewBuffer(raw))
			}
		}
	}

	// 如果都没有找到，返回空字符串
	return "", ""
}
