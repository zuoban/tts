package handlers

import (
	"html/template"
	"net/http"
	"path/filepath"

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
func (h *PagesHandler) HandleIndex(w http.ResponseWriter, r *http.Request) {
	// 如果不是根路径，返回404
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}

	// 准备模板数据
	data := map[string]interface{}{
		"BasePath":     h.config.Server.BasePath,
		"DefaultVoice": h.config.TTS.DefaultVoice,
		"DefaultRate":  h.config.TTS.DefaultRate,
		"DefaultPitch": h.config.TTS.DefaultPitch,
	}

	// 设置内容类型
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// 渲染模板
	if err := h.templates.ExecuteTemplate(w, "index.html", data); err != nil {
		http.Error(w, "模板渲染失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// HandleAPIDoc 处理API文档请求
func (h *PagesHandler) HandleAPIDoc(w http.ResponseWriter, r *http.Request) {
	// 准备模板数据
	data := map[string]interface{}{
		"BasePath":      h.config.Server.BasePath,
		"DefaultVoice":  h.config.TTS.DefaultVoice,
		"DefaultRate":   h.config.TTS.DefaultRate,
		"DefaultPitch":  h.config.TTS.DefaultPitch,
		"DefaultFormat": h.config.TTS.DefaultFormat,
	}

	// 设置内容类型
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// 渲染模板
	if err := h.templates.ExecuteTemplate(w, "api-doc.html", data); err != nil {
		http.Error(w, "模板渲染失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
