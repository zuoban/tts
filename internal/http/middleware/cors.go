package middleware

import "github.com/gin-gonic/gin"

// CORS 处理跨域资源共享
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置CORS响应头
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// 如果是预检请求，直接返回200
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		// 继续下一个处理器
		c.Next()
	}
}
