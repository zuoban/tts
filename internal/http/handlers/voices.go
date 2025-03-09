package handlers

import (
	"encoding/json"
	"net/http"
	"tts/internal/tts"
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
func (h *VoicesHandler) HandleVoices(w http.ResponseWriter, r *http.Request) {
	// 从查询参数中获取语言筛选
	locale := r.URL.Query().Get("locale")

	// 获取语音列表
	voices, err := h.ttsService.ListVoices(r.Context(), locale)
	if err != nil {
		http.Error(w, "获取语音列表失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 设置内容类型
	w.Header().Set("Content-Type", "application/json")

	// 编码为JSON并返回
	if err := json.NewEncoder(w).Encode(voices); err != nil {
		http.Error(w, "JSON编码失败", http.StatusInternalServerError)
		return
	}
}
