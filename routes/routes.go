package routes

import (
	"tts/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// 加载模板文件
	router.LoadHTMLGlob("templates/*")

	router.GET("/voices", handlers.GetVoiceList)
	router.POST("/tts", handlers.SynthesizeVoicePost)
	router.GET("/tts", handlers.SynthesizeVoice)
	router.GET("/v1/audio/speech", handlers.SynthesizeVoiceOpenAI)
	router.GET("/", handlers.Index)
	router.GET("/doc", handlers.ApiDoc)

	return router
}
