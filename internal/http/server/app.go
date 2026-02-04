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
	"tts/internal/http/routes"
)

// App 表示整个TTS应用程序
type App struct {
	server     *Server
	cfg        *config.Config
	configPath string
}

// NewApp 创建一个新的应用程序实例
func NewApp(configPath string) (*App, error) {
	// 加载配置
	cfg, err := config.Load(configPath)
	if err != nil {
		return nil, fmt.Errorf("加载配置失败: %w", err)
	}

	// 初始化服务
	ttsService, err := routes.InitializeServices(cfg)
	if err != nil {
		return nil, fmt.Errorf("初始化服务失败: %w", err)
	}

	app := &App{
		cfg:        cfg,
		configPath: configPath,
	}

	// 设置Gin路由
	router, err := routes.SetupRoutes(cfg, ttsService, app)
	if err != nil {
		return nil, fmt.Errorf("设置路由失败: %w", err)
	}

	// 创建HTTP服务器
	server := New(cfg, router)
	app.server = server

	return app, nil
}

// Start 启动应用程序
func (a *App) Start() error {
	// 创建一个错误通道
	errChan := make(chan error, 1)

	// 创建一个退出信号通道
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	// 在一个goroutine中启动服务器
	go func() {
		log.Printf("启动TTS服务，监听端口 %d...\n", a.cfg.Server.Port)
		errChan <- a.server.Start()
	}()

	// 等待退出信号或错误
	for {
		select {
		case err := <-errChan:
			return err
		case sig := <-quit:
			if sig == syscall.SIGHUP {
				if err := a.reloadConfig(); err != nil {
					log.Printf("配置重载失败: %v", err)
				} else {
					log.Println("配置已重载（部分组件可能需重启才能完全生效）")
				}
				continue
			}

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
}

func (a *App) reloadConfig() error {
	if a.configPath == "" {
		return fmt.Errorf("配置路径为空，无法重载")
	}

	cfg, err := config.Reload(a.configPath)
	if err != nil {
		return err
	}

	ttsService, err := routes.InitializeServices(cfg)
	if err != nil {
		return fmt.Errorf("初始化服务失败: %w", err)
	}

	router, err := routes.SetupRoutes(cfg, ttsService, a)
	if err != nil {
		return fmt.Errorf("设置路由失败: %w", err)
	}

	a.server.UpdateRouter(router)
	a.cfg = cfg
	return nil
}

// Reload 提供给HTTP热重载接口使用
func (a *App) Reload() error {
	return a.reloadConfig()
}
