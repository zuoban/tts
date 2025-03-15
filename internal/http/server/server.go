package server

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"tts/internal/config"
)

// Server 封装HTTP服务器
type Server struct {
	router   *gin.Engine
	basePath string
	port     int
}

// New 创建新的HTTP服务器
func New(cfg *config.Config, router *gin.Engine) *Server {
	return &Server{
		router:   router,
		basePath: cfg.Server.BasePath,
		port:     cfg.Server.Port,
	}
}

// Start 启动HTTP服务器
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.port)
	return s.router.Run(addr)
}

// Shutdown 优雅关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	fmt.Println("正在关闭HTTP服务器...")
	// Gin 本身没有提供 Shutdown 方法，需要手动实现
	// 这里可以添加自定义的关闭逻辑
	return nil
}
