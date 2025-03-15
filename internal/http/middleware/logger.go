package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger 是一个HTTP中间件，记录请求的详细信息
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// 处理请求
		c.Next()

		// 记录请求信息
		duration := time.Since(start)
		log.Printf("[%s] %s %s %d %s",
			c.Request.Method,
			c.Request.URL.Path,
			c.ClientIP(),
			c.Writer.Status(),
			duration,
		)
	}
}
