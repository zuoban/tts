package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// OpenAIAuth 中间件验证 OpenAI API 请求的令牌
func OpenAIAuth(apiToken string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 如果没有配置令牌，跳过验证
		if apiToken == "" {
			c.Next()
			return
		}

		// 获取请求头中的 Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "未提供授权令牌"})
			return
		}

		// 验证格式是否为 "Bearer {token}"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(401, gin.H{"error": "授权格式无效"})
			return
		}

		// 验证令牌是否正确
		if parts[1] != apiToken {
			c.AbortWithStatusJSON(401, gin.H{"error": "令牌无效"})
			return
		}

		// 令牌验证通过，继续处理请求
		c.Next()
	}
}

// TTSAuth 是用于验证 TTS API 接口的中间件
func TTSAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从查询参数中获取 api_key
		queryKey := c.Query("api_key")

		// 如果 apiKey 配置为空字符串，表示不需要验证
		if apiKey != "" && queryKey != apiKey {
			c.AbortWithStatusJSON(401, gin.H{"error": "未授权访问: 无效的 API 密钥"})
			return
		}

		// 验证通过，继续处理请求
		c.Next()
	}
}
