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

// IFreeTimeResponse IFreeTime应用配置响应
type IFreeTimeResponse struct {
	LoginUrl       string                 `json:"loginUrl"`
	MaxWordCount   string                 `json:"maxWordCount"`
	CustomRules    map[string]interface{} `json:"customRules"`
	TtsConfigGroup string                 `json:"ttsConfigGroup"`
	TTSName        string                 `json:"_TTSName"`
	ClassName      string                 `json:"_ClassName"`
	TTSConfigID    string                 `json:"_TTSConfigID"`
	HttpConfigs    IFreeTimeHttpConfig    `json:"httpConfigs"`
	VoiceList      []IFreeTimeVoice       `json:"voiceList"`
	TtsHandles     []IFreeTimeTtsHandle   `json:"ttsHandles"`
}

// IFreeTimeHttpConfig HTTP配置
type IFreeTimeHttpConfig struct {
	UseCookies int                    `json:"useCookies"`
	Headers    map[string]interface{} `json:"headers"`
}

// IFreeTimeVoice 语音配置
type IFreeTimeVoice struct {
	Name    string `json:"name"`
	Display string `json:"display"`
}

// IFreeTimeTtsHandle TTS处理配置
type IFreeTimeTtsHandle struct {
	ParamsEx         string                 `json:"paramsEx"`
	ProcessType      int                    `json:"processType"`
	MaxPageCount     int                    `json:"maxPageCount"`
	NextPageMethod   int                    `json:"nextPageMethod"`
	Method           int                    `json:"method"`
	RequestByWebView int                    `json:"requestByWebView"`
	Parser           map[string]interface{} `json:"parser"`
	NextPageParams   map[string]interface{} `json:"nextPageParams"`
	Url              string                 `json:"url"`
	Params           map[string]string      `json:"params"`
	HttpConfigs      IFreeTimeHttpConfig    `json:"httpConfigs"`
}
