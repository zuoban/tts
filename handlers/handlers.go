package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"tts/utils"
)

func GetVoiceList(c *gin.Context) {
	locale := c.Query("locale")
	voices, err := utils.VoiceList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if locale != "" {
		filteredVoices := make([]interface{}, 0)
		for _, voice := range voices {
			if voice.(map[string]interface{})["Locale"].(string) == locale {
				filteredVoices = append(filteredVoices, voice)
			}
		}
		voices = filteredVoices
	}

	c.JSON(http.StatusOK, gin.H{"voices": voices})
}

func SynthesizeVoice(c *gin.Context) {
	text := c.Query("t")
	voiceName := c.DefaultQuery("v", "zh-CN-XiaoxiaoMultilingualNeural")
	rate := c.DefaultQuery("r", "0")
	pitch := c.DefaultQuery("p", "0")
	outputFormat := c.DefaultQuery("o", "audio-24khz-48kbitrate-mono-mp3")

	voice, err := utils.GetVoice(text, voiceName, rate, pitch, outputFormat)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "audio/mpeg", voice)
}

func Index(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title": "TTS",
	})
}

type SynthesizeVoiceRequest struct {
	Text         string `json:"t"`
	VoiceName    string `json:"v"`
	Rate         string `json:"r"`
	Pitch        string `json:"p"`
	OutputFormat string `json:"o"`
}

func SynthesizeVoicePost(c *gin.Context) {
	var request SynthesizeVoiceRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	voice, err := utils.GetVoice(request.Text, request.VoiceName, request.Rate, request.Pitch, request.OutputFormat)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "audio/mpeg", voice)
}
