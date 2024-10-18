package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"tts/utils"
)

func GetVoiceList(c *gin.Context) {
	locale := c.Query("l")
	voices, err := utils.VoiceList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if locale != "" {
		filteredVoices := make([]interface{}, 0)
		for _, voice := range voices {
			if strings.Contains(voice.(map[string]interface{})["Locale"].(string), locale) {
				filteredVoices = append(filteredVoices, voice)
			}
		}
		voices = filteredVoices
	}

	_, detail := c.GetQuery("d")
	if detail {
		c.JSON(http.StatusOK, gin.H{"voices": voices})
	} else {
		voiceSimpleList := make([]map[string]string, 0)
		for _, voice := range voices {
			localName := voice.(map[string]interface{})["LocalName"].(string)
			shortName := voice.(map[string]interface{})["ShortName"].(string)
			voiceSimpleList = append(voiceSimpleList, map[string]string{
				"LocalName": localName,
				"ShortName": shortName,
			})
		}
		c.JSON(http.StatusOK, gin.H{"voices": voiceSimpleList})
	}

}

func SynthesizeVoice(c *gin.Context) {
	text := c.Query("t")
	voiceName := c.DefaultQuery("v", "zh-CN-XiaoxiaoMultilingualNeural")
	rate := c.DefaultQuery("r", "0")
	pitch := c.DefaultQuery("p", "0")
	outputFormat := c.DefaultQuery("o", "audio-24khz-48kbitrate-mono-mp3")

	voice, err := utils.GetVoice(text, voiceName, rate, pitch, outputFormat, c.Query("s"))
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

func ApiDoc(c *gin.Context) {
	c.HTML(http.StatusOK, "api-doc.html", gin.H{
		"title": "TTS",
	})
}

type SynthesizeVoiceRequest struct {
	Text         string `json:"t"`
	VoiceName    string `json:"v"`
	Rate         string `json:"r"`
	Pitch        string `json:"p"`
	OutputFormat string `json:"o"`
	Style        string `json:"s"`
}

type SynthesizeVoiceOpenAIRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
	Voice string `json:"voice"`
}

func SynthesizeVoicePost(c *gin.Context) {
	var request SynthesizeVoiceRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	voice, err := utils.GetVoice(request.Text, request.VoiceName, request.Rate, request.Pitch, request.OutputFormat, request.Style)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "audio/mpeg", voice)
}

func SynthesizeVoiceOpenAI(c *gin.Context) {
	var request SynthesizeVoiceOpenAIRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	voice, err := utils.GetVoice(request.Input, request.Voice, c.Query("r"), c.Query("p"), c.Query("o"), c.Query("s"))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, "audio/mpeg", voice)
}
