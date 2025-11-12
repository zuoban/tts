package handlers

import (
	"net/http"
	"tts/internal/config"
	"tts/internal/tts"

	"github.com/gin-gonic/gin"
)

// ConfigHandler 处理配置相关请求
type ConfigHandler struct {
	ttsService tts.Service
	config     *config.Config
}

// NewConfigHandler 创建一个新的配置处理器
func NewConfigHandler(service tts.Service, cfg *config.Config) *ConfigHandler {
	return &ConfigHandler{
		ttsService: service,
		config:     cfg,
	}
}

// HandleConfig 处理获取前端配置的请求
func (h *ConfigHandler) HandleConfig(c *gin.Context) {
	// 获取语音列表以提取可用的语音和风格
	voices, err := h.ttsService.ListVoices(c.Request.Context(), "")
	if err != nil {
		// 如果获取语音列表失败，返回基本配置
		c.JSON(http.StatusOK, gin.H{
			"defaultVoice":  h.config.TTS.DefaultVoice,
			"defaultRate":   h.config.TTS.DefaultRate,
			"defaultPitch":  h.config.TTS.DefaultPitch,
			"defaultFormat": h.config.TTS.DefaultFormat,
			"basePath":      h.config.Server.BasePath,
			"voices":        []interface{}{},
			"styles":        []string{},
		})
		return
	}

	// 提取可用的语音和风格信息
	voiceList := make([]map[string]interface{}, 0)
	styleSet := make(map[string]bool)

	for _, voice := range voices {
		voiceInfo := map[string]interface{}{
			"id":       voice.ShortName,   // 使用 ShortName 作为 ID
			"name":     voice.DisplayName,
			"locale":   voice.Locale,
			"gender":   voice.Gender,
			"styles":   voice.StyleList,
		}
		voiceList = append(voiceList, voiceInfo)

		// 收集所有可用的风格
		for _, style := range voice.StyleList {
			styleSet[style] = true
		}
	}

	// 转换风格集合为切片
	styles := make([]string, 0, len(styleSet))
	for style := range styleSet {
		styles = append(styles, style)
	}

	// 返回配置信息
	c.JSON(http.StatusOK, gin.H{
		"defaultVoice":  h.config.TTS.DefaultVoice,
		"defaultRate":   h.config.TTS.DefaultRate,
		"defaultPitch":  h.config.TTS.DefaultPitch,
		"defaultFormat": h.config.TTS.DefaultFormat,
		"basePath":      h.config.Server.BasePath,
		"voices":        voiceList,
		"styles":        styles,
	})
}