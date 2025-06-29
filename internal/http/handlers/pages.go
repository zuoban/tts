package handlers

import (
	"html/template"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"tts/internal/config"
)

// PagesHandler 处理页面请求
type PagesHandler struct {
	templates *template.Template
	config    *config.Config
}

// NewPagesHandler 创建一个新的页面处理器
func NewPagesHandler(templatesDir string, cfg *config.Config) (*PagesHandler, error) {
	// 解析所有模板文件
	templates, err := template.ParseGlob(filepath.Join(templatesDir, "*.html"))
	if err != nil {
		return nil, err
	}

	return &PagesHandler{
		templates: templates,
		config:    cfg,
	}, nil
}

// HandleIndex 处理首页请求
func (h *PagesHandler) HandleIndex(c *gin.Context) {
	// 准备模板数据
	data := map[string]interface{}{
		"BasePath":     h.config.Server.BasePath,
		"DefaultVoice": h.config.TTS.DefaultVoice,
		"DefaultRate":  h.config.TTS.DefaultRate,
		"DefaultPitch": h.config.TTS.DefaultPitch,
	}

	// 设置内容类型
	c.Header("Content-Type", "text/html; charset=utf-8")

	// 渲染模板
	if err := h.templates.ExecuteTemplate(c.Writer, "index.html", data); err != nil {
		c.AbortWithStatusJSON(500, gin.H{"error": "模板渲染失败: " + err.Error()})
		return
	}
}
