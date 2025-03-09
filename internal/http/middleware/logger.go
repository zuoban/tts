package middleware

import (
	"log"
	"net/http"
	"time"
)

// Logger 是一个HTTP中间件，记录请求的详细信息
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 包装ResponseWriter以捕获状态码
		wrapper := &responseWriterWrapper{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		// 调用下一个处理器
		next.ServeHTTP(wrapper, r)

		// 记录请求信息
		duration := time.Since(start)
		log.Printf(
			"[%s] %s %s %d %s",
			r.Method,
			r.RequestURI,
			r.RemoteAddr,
			wrapper.statusCode,
			duration,
		)
	})
}

// responseWriterWrapper 包装http.ResponseWriter以捕获状态码
type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader 捕获状态码
func (w *responseWriterWrapper) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}
