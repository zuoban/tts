package routes

import (
	"tts/internal/config"
	"tts/internal/http/handlers"
	"tts/internal/http/middleware"
	"tts/internal/tts"
	"tts/internal/tts/microsoft"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 配置所有API路由
func SetupRoutes(cfg *config.Config, ttsService tts.Service) (*gin.Engine, error) {
	// 创建Gin路由
	router := gin.New()

	// 创建处理器
	ttsHandler := handlers.NewTTSHandler(ttsService, cfg)
	voicesHandler := handlers.NewVoicesHandler(ttsService)

	// 创建页面处理器
	pagesHandler, err := handlers.NewPagesHandler("./web/templates", cfg)
	if err != nil {
		return nil, err
	}

	// 应用中间件
	router.Use(middleware.Logger()) // 日志中间件
	router.Use(middleware.CORS())   // CORS中间件

	// 应用基础路径前缀
	var baseRouter gin.IRoutes
	if cfg.Server.BasePath != "" {
		baseRouter = router.Group(cfg.Server.BasePath)
	} else {
		baseRouter = router
	}

	// 设置静态文件服务
	baseRouter.Static("/static", "./web/static")

	// 设置主页路由
	baseRouter.GET("/", pagesHandler.HandleIndex)

	// 设置TTS API路由 - 添加认证中间件

	baseRouter.POST("/tts", middleware.TTSAuth(cfg.TTS.ApiKey), ttsHandler.HandleTTS)
	baseRouter.GET("/tts", middleware.TTSAuth(cfg.TTS.ApiKey), ttsHandler.HandleTTS)
	baseRouter.GET("/reader.json", middleware.TTSAuth(cfg.TTS.ApiKey), ttsHandler.HandleReader)
	baseRouter.GET("ifreetime.json", middleware.TTSAuth(cfg.TTS.ApiKey), ttsHandler.HandleIFreeTime)

	// 设置语音列表API路由
	baseRouter.GET("/voices", voicesHandler.HandleVoices)

	// 设置OpenAI兼容接口的处理器，添加验证中间件
	openAIHandler := middleware.OpenAIAuth(cfg.OpenAI.ApiKey)
	baseRouter.POST("/v1/audio/speech", openAIHandler, ttsHandler.HandleOpenAITTS)
	baseRouter.POST("/audio/speech", openAIHandler, ttsHandler.HandleOpenAITTS)

	return router, nil
}

// InitializeServices 初始化所有服务
func InitializeServices(cfg *config.Config) (tts.Service, error) {
	// 创建Microsoft TTS客户端
	ttsClient := microsoft.NewClient(cfg)

	return ttsClient, nil
}
