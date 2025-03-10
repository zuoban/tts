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
