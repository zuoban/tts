package handlers

import (
	"net/http"
	"tts/internal/tts"

	"github.com/gin-gonic/gin"
)

// VoicesHandler 处理语音列表请求
type VoicesHandler struct {
	ttsService tts.Service
}

// NewVoicesHandler 创建一个新的语音列表处理器
func NewVoicesHandler(service tts.Service) *VoicesHandler {
	return &VoicesHandler{
		ttsService: service,
	}
}

// HandleVoices 处理语音列表请求
func (h *VoicesHandler) HandleVoices(c *gin.Context) {
	// 获取所有语音列表
	voices, err := h.ttsService.ListVoices(c.Request.Context(), "")
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "获取语音列表失败: " + err.Error()})
		return
	}

	// 返回JSON响应
	c.JSON(http.StatusOK, voices)
}
