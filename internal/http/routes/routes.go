package routes

import (
	"context"
	"log"
	"net/http"
	"time"

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
	configHandler := handlers.NewConfigHandler(ttsService, cfg)

	// 应用中间件
	router.Use(middleware.Logger()) // 日志中间件
	router.Use(middleware.CORS())   // CORS中间件

	// 应用基础路径前缀
	var baseRouter *gin.RouterGroup
	if cfg.Server.BasePath != "" {
		baseRouter = router.Group(cfg.Server.BasePath)
	} else {
		baseRouter = router.Group("")
	}

	// API 版本组
	apiV1 := baseRouter.Group("/api/v1")

	authHandler := middleware.TTSAuth(cfg.TTS.ApiKey)

	// 设置TTS API路由 - 添加认证中间件
	apiV1.POST("/tts", authHandler, ttsHandler.HandleTTS)
	apiV1.GET("/tts", authHandler, ttsHandler.HandleTTS)

	// 设置语音列表API路由
	apiV1.GET("/voices", voicesHandler.HandleVoices)

	// 设置配置API路由（无需认证）
	apiV1.GET("/config", configHandler.HandleConfig)

	// 兼容性路由 - 保持现有第三方集成接口不变
	baseRouter.POST("/tts", authHandler, ttsHandler.HandleTTS)
	baseRouter.GET("/tts", authHandler, ttsHandler.HandleTTS)
	apiV1.GET("/reader.json", authHandler, ttsHandler.HandleReader)
	apiV1.GET("/ifreetime.json", authHandler, ttsHandler.HandleIFreeTime)
	baseRouter.GET("/voices", voicesHandler.HandleVoices)

	// 设置OpenAI兼容接口的处理器，添加验证中间件
	baseRouter.POST("/v1/audio/speech", authHandler, ttsHandler.HandleOpenAITTS)
	baseRouter.POST("/audio/speech", authHandler, ttsHandler.HandleOpenAITTS)

	// 健康检查接口
	apiV1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "tts-api",
			"version": "v1",
		})
	})

	// 静态文件服务 - 服务前端应用
	// 静态文件服务
	router.Static("/assets", "./frontend/dist/assets")
	router.StaticFile("/favicon.svg", "./frontend/dist/favicon.svg")
	router.StaticFile("/site.webmanifest", "./frontend/dist/site.webmanifest")
	router.StaticFile("/vite.svg", "./frontend/dist/vite.svg")

	// SPA 路由支持 - 对于所有非API请求，返回 index.html
	router.NoRoute(func(c *gin.Context) {
		// 如果是API路径，返回404
		path := c.Request.URL.Path
		if len(path) >= 4 && (path[:4] == "/api" || path[:4] == "/tts" || path[:4] == "/v1/" || path == "/v1") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}

		// 对于其他所有路径，返回 index.html (SPA 支持)
		c.File("./frontend/dist/index.html")
	})

	return router, nil
}

// InitializeServices 初始化所有服务
func InitializeServices(cfg *config.Config) (tts.Service, error) {
	// 创建Microsoft TTS客户端
	ttsClient := microsoft.NewClient(cfg)

	// 预热声音列表缓存
	log.Println("正在初始化声音列表缓存...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := ttsClient.WarmupVoicesCache(ctx); err != nil {
		log.Printf("预热声音列表缓存失败，但不影响服务启动: %v", err)
		// 注意：预热失败不应该阻止服务启动，因为用户请求时还可以重新尝试
	} else {
		log.Println("声音列表缓存预热完成")
	}

	return ttsClient, nil
}
