package models

// TTSRequest 表示一个语音合成请求
type TTSRequest struct {
	Text  string `json:"text"`  // 要转换的文本
	Voice string `json:"voice"` // 语音ID
	Rate  string `json:"rate"`  // 语速 (-100% 到 +100%)
	Pitch string `json:"pitch"` // 语调 (-100% 到 +100%)
	Style string `json:"style"` // 说话风格
}

// TTSResponse 表示一个语音合成响应
type TTSResponse struct {
	AudioContent []byte `json:"audio_content"` // 音频数据
	ContentType  string `json:"content_type"`  // MIME类型
	CacheHit     bool   `json:"cache_hit"`     // 是否命中缓存
}

// OpenAIRequest OpenAI TTS请求结构体
type OpenAIRequest struct {
	Model string  `json:"model"`
	Input string  `json:"input"`
	Voice string  `json:"voice"`
	Speed float64 `json:"speed"`
}

// ReaderResponse reader 响应结构体
type ReaderResponse struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
	Url  string `json:"url"`
}
