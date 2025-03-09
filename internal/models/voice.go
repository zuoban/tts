package models

// Voice 表示一个语音合成声音
type Voice struct {
	Name            string   `json:"name"`                 // 语音唯一标识符
	DisplayName     string   `json:"display_name"`         // 语音显示名称
	LocalName       string   `json:"local_name"`           // 本地化名称
	ShortName       string   `json:"short_name"`           // 简称，例如 zh-CN-XiaoxiaoNeural
	Gender          string   `json:"gender"`               // 性别: Female, Male
	Locale          string   `json:"locale"`               // 语言区域, 如 zh-CN
	LocaleName      string   `json:"locale_name"`          // 语言区域显示名称，如 中文(中国)
	StyleList       []string `json:"style_list,omitempty"` // 支持的说话风格列表
	SampleRateHertz string   `json:"sample_rate_hertz"`    // 采样率
}
