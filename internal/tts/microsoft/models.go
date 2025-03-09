package microsoft

// MicrosoftVoice 表示Microsoft TTS服务中的一个语音
type MicrosoftVoice struct {
	Name            string   `json:"Name"`
	DisplayName     string   `json:"DisplayName"`
	LocalName       string   `json:"LocalName"`
	ShortName       string   `json:"ShortName"`
	Gender          string   `json:"Gender"`
	Locale          string   `json:"Locale"`
	LocaleName      string   `json:"LocaleName"`
	StyleList       []string `json:"StyleList,omitempty"`
	SampleRateHertz string   `json:"SampleRateHertz"`
	VoiceType       string   `json:"VoiceType"`
	Status          string   `json:"Status"`
}

// SSMLRequest 表示发送给Microsoft TTS服务的SSML请求
type SSMLRequest struct {
	XMLHeader string
	Voice     string
	Language  string
	Rate      string
	Pitch     string
	Text      string
}

// FormatContentTypeMap 定义音频格式到MIME类型的映射
var FormatContentTypeMap = map[string]string{
	"raw-16khz-16bit-mono-pcm":         "audio/pcm",
	"raw-8khz-8bit-mono-mulaw":         "audio/basic",
	"riff-8khz-8bit-mono-alaw":         "audio/alaw",
	"riff-8khz-8bit-mono-mulaw":        "audio/mulaw",
	"riff-16khz-16bit-mono-pcm":        "audio/wav",
	"audio-16khz-128kbitrate-mono-mp3": "audio/mp3",
	"audio-16khz-64kbitrate-mono-mp3":  "audio/mp3",
	"audio-16khz-32kbitrate-mono-mp3":  "audio/mp3",
	"raw-24khz-16bit-mono-pcm":         "audio/pcm",
	"riff-24khz-16bit-mono-pcm":        "audio/wav",
	"audio-24khz-160kbitrate-mono-mp3": "audio/mp3",
	"audio-24khz-96kbitrate-mono-mp3":  "audio/mp3",
	"audio-24khz-48kbitrate-mono-mp3":  "audio/mp3",
	"ogg-24khz-16bit-mono-opus":        "audio/ogg",
	"webm-24khz-16bit-mono-opus":       "audio/webm",
}
