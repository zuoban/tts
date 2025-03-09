package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"tts/internal/config"
)

// Server 封装HTTP服务器
type Server struct {
	server   *http.Server
	basePath string
}

// New 创建新的HTTP服务器
func New(cfg *config.Config, handler http.Handler) *Server {
	// 创建HTTP服务器
	httpServer := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      handler,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	return &Server{
		server:   httpServer,
		basePath: cfg.Server.BasePath,
	}
}

// Start 启动HTTP服务器
func (s *Server) Start() error {
	fmt.Printf("服务启动在 %s\n", s.server.Addr)
	return s.server.ListenAndServe()
}

// Shutdown 优雅关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	fmt.Println("正在关闭HTTP服务器...")
	return s.server.Shutdown(ctx)
}
