package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"

	"tts/internal/config"
)

// Server 封装HTTP服务器
type Server struct {
	router     *gin.Engine
	basePath   string
	port       int
	httpServer *http.Server
	switcher   *handlerSwitcher
}

// New 创建新的HTTP服务器
func New(cfg *config.Config, router *gin.Engine) *Server {
	switcher := &handlerSwitcher{}
	switcher.Set(router)

	server := &Server{
		router:   router,
		basePath: cfg.Server.BasePath,
		port:     cfg.Server.Port,
		switcher: switcher,
	}

	server.httpServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      switcher,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	return server
}

// Start 启动HTTP服务器
func (s *Server) Start() error {
	if s.httpServer == nil {
		return errors.New("http server not initialized")
	}

	if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// Shutdown 优雅关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	fmt.Println("正在关闭HTTP服务器...")
	if s.httpServer == nil {
		return nil
	}

	return s.httpServer.Shutdown(ctx)
}

// UpdateRouter 在运行中替换路由处理器
func (s *Server) UpdateRouter(router *gin.Engine) {
	if s.switcher != nil {
		s.switcher.Set(router)
	}
	s.router = router
}

type handlerSwitcher struct {
	handler atomic.Value
}

func (h *handlerSwitcher) Set(next http.Handler) {
	h.handler.Store(next)
}

func (h *handlerSwitcher) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	value := h.handler.Load()
	if value == nil {
		http.Error(w, "handler not initialized", http.StatusServiceUnavailable)
		return
	}
	value.(http.Handler).ServeHTTP(w, r)
}
