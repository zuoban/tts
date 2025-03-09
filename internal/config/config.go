package config

import (
	"fmt"
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

// Config 包含应用程序的所有配置
type Config struct {
	Server ServerConfig `yaml:"server"`
	TTS    TTSConfig    `yaml:"tts"`
}

// ServerConfig 包含HTTP服务器配置
type ServerConfig struct {
	Port         int    `yaml:"port"`
	ReadTimeout  int    `yaml:"read_timeout"`  // 单位：秒
	WriteTimeout int    `yaml:"write_timeout"` // 单位：秒
	BasePath     string `yaml:"base_path"`
}

// TTSConfig 包含Microsoft TTS API配置
type TTSConfig struct {
	APIKey            string            `yaml:"api_key"`
	Region            string            `yaml:"region"`
	DefaultVoice      string            `yaml:"default_voice"`
	DefaultRate       string            `yaml:"default_rate"`
	DefaultPitch      string            `yaml:"default_pitch"`
	DefaultFormat     string            `yaml:"default_format"`
	MaxTextLength     int               `yaml:"max_text_length"`
	RequestTimeout    int               `yaml:"request_timeout"` // 单位：秒
	MaxConcurrent     int               `yaml:"max_concurrent"`
	SegmentThreshold  int               `yaml:"segment_threshold"`
	MinSentenceLength int               `yaml:"min_sentence_length"`
	MaxSentenceLength int               `yaml:"max_sentence_length"`
	VoiceMapping      map[string]string `yaml:"voice_mapping"` // OpenAI声音到Azure声音的映射
}

var (
	config Config
	once   sync.Once
)

// Load 从指定路径加载配置文件
func Load(configPath string) (*Config, error) {
	var err error
	once.Do(func() {
		// 设置默认配置
		setDefaults()

		// 从配置文件加载
		if configPath != "" {
			err = loadFromFile(configPath)
			if err != nil {
				err = fmt.Errorf("加载配置文件失败: %w", err)
				return
			}
		}

		// 从环境变量覆盖
		overrideFromEnv()
	})

	if err != nil {
		return nil, err
	}

	return &config, nil
}

// 设置默认配置值
func setDefaults() {
	config = Config{
		Server: ServerConfig{
			Port:         8080,
			ReadTimeout:  30,
			WriteTimeout: 30,
			BasePath:     "",
		},
		TTS: TTSConfig{
			DefaultVoice:      "zh-CN-XiaoxiaoNeural",
			DefaultRate:       "0%",
			DefaultPitch:      "0%",
			DefaultFormat:     "audio-24khz-48kbitrate-mono-mp3",
			MaxTextLength:     5000,
			RequestTimeout:    30,
			MaxConcurrent:     10,
			SegmentThreshold:  500,
			MinSentenceLength: 200,
			MaxSentenceLength: 300,
			VoiceMapping:      make(map[string]string),
		},
	}
}

// 从配置文件加载配置
func loadFromFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	return yaml.Unmarshal(data, &config)
}

// 从环境变量中覆盖配置
func overrideFromEnv() {
	if port := os.Getenv("TTS_SERVER_PORT"); port != "" {
		fmt.Sscanf(port, "%d", &config.Server.Port)
	}

	if apiKey := os.Getenv("TTS_API_KEY"); apiKey != "" {
		config.TTS.APIKey = apiKey
	}

	if region := os.Getenv("TTS_API_REGION"); region != "" {
		config.TTS.Region = region
	}

	// 可以添加更多环境变量覆盖
}

// Get 返回已加载的配置
func Get() *Config {
	return &config
}
