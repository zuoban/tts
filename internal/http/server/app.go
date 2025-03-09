package server

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
	"tts/internal/config"
)

// App 表示整个TTS应用程序
type App struct {
	server *Server
	cfg    *config.Config
}

// NewApp 创建一个新的应用程序实例
func NewApp(configPath string) (*App, error) {
	// 加载配置
	cfg, err := config.Load(configPath)
	if err != nil {
		return nil, fmt.Errorf("加载配置失败: %w", err)
	}

	// 初始化服务
	ttsService, err := InitializeServices(cfg)
	if err != nil {
		return nil, fmt.Errorf("初始化服务失败: %w", err)
	}

	// 设置路由
	handler, err := SetupRoutes(cfg, ttsService)
	if err != nil {
		return nil, fmt.Errorf("设置路由失败: %w", err)
	}

	// 创建HTTP服务器
	server := New(cfg, handler)

	return &App{
		server: server,
		cfg:    cfg,
	}, nil
}

// Start 启动应用程序
func (a *App) Start() error {
	// 创建一个错误通道
	errChan := make(chan error, 1)

	// 创建一个退出信号通道
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 在一个goroutine中启动服务器
	go func() {
		log.Printf("启动TTS服务，监听端口 %d...\n", a.cfg.Server.Port)
		errChan <- a.server.Start()
	}()

	// 等待退出信号或错误
	select {
	case err := <-errChan:
		return err
	case <-quit:
		// 创建一个超时上下文用于优雅关闭
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// 尝试优雅关闭服务器
		if err := a.server.Shutdown(ctx); err != nil {
			return fmt.Errorf("服务器关闭出错: %w", err)
		}

		log.Println("服务器已优雅关闭")
		return nil
	}
}
