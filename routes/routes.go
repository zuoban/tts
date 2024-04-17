package routes

import (
	"github.com/gin-gonic/gin"
	"tts/handlers"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// 加载模板文件
	router.LoadHTMLGlob("templates/*")

	router.GET("/voices", handlers.GetVoiceList)
	router.POST("/tts", handlers.SynthesizeVoicePost)
	router.GET("/tts", handlers.SynthesizeVoice)
	router.GET("/", handlers.Index)

	return router
}
