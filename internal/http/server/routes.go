package server

import (
	"net/http"
	"tts/internal/config"
	"tts/internal/http/handlers"
	"tts/internal/http/middleware"
	"tts/internal/tts"
	"tts/internal/tts/microsoft"
)

// SetupRoutes 配置所有API路由
func SetupRoutes(cfg *config.Config, ttsService tts.Service) (http.Handler, error) {
	// 创建一个新的路由多路复用器
	mux := http.NewServeMux()

	// 创建处理器
	ttsHandler := handlers.NewTTSHandler(ttsService, cfg)
	voicesHandler := handlers.NewVoicesHandler(ttsService)

	// 创建页面处理器
	pagesHandler, err := handlers.NewPagesHandler("./web/templates", cfg)
	if err != nil {
		return nil, err
	}

	// 设置主页路由
	mux.HandleFunc("/", pagesHandler.HandleIndex)

	// 设置API文档路由
	mux.HandleFunc("/api-doc", pagesHandler.HandleAPIDoc)

	// 设置TTS API路由
	mux.HandleFunc("/tts", ttsHandler.HandleTTS)

	// 设置语音列表API路由
	mux.HandleFunc("/voices", voicesHandler.HandleVoices)

	mux.HandleFunc("/v1/audio/speech", ttsHandler.HandleOpenAITTS)
	mux.HandleFunc("/audio/speech", ttsHandler.HandleOpenAITTS)

	// 设置静态文件服务
	fs := http.FileServer(http.Dir("./web/static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	// 应用基础路径前缀
	var handler http.Handler = mux
	if cfg.Server.BasePath != "" {
		handler = http.StripPrefix(cfg.Server.BasePath, mux)
	}

	// 应用中间件
	handler = middleware.Logger(handler) // 日志中间件
	handler = middleware.CORS(handler)   // CORS中间件

	return handler, nil
}

// InitializeServices 初始化所有服务
func InitializeServices(cfg *config.Config) (tts.Service, error) {
	// 创建Microsoft TTS客户端
	ttsClient := microsoft.NewClient(cfg)

	return ttsClient, nil
}
