package middleware

import (
	"net/http"
	"strings"
)

// OpenAIAuth 中间件验证 OpenAI API 请求的令牌
func OpenAIAuth(apiToken string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 如果没有配置令牌，跳过验证
		if apiToken == "" {
			next.ServeHTTP(w, r)
			return
		}

		// 获取请求头中的 Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "未提供授权令牌", http.StatusUnauthorized)
			return
		}

		// 验证格式是否为 "Bearer {token}"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "授权格式无效", http.StatusUnauthorized)
			return
		}

		// 验证令牌是否正确
		if parts[1] != apiToken {
			http.Error(w, "令牌无效", http.StatusUnauthorized)
			return
		}

		// 令牌验证通过，继续处理请求
		next.ServeHTTP(w, r)
	})
}

// TTSAuth 是用于验证 TTS API 接口的中间件
func TTSAuth(apiKey string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 从查询参数中获取 api_key
		queryKey := r.URL.Query().Get("api_key")

		// 如果 apiKey 配置为空字符串，表示不需要验证
		if apiKey != "" && queryKey != apiKey {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("未授权访问: 无效的 API 密钥"))
			return
		}

		// 验证通过，继续处理请求
		next.ServeHTTP(w, r)
	})
}
