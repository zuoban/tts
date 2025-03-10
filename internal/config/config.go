package config

import (
	"fmt"
	"strings"
	"sync"

	"github.com/spf13/viper"
)

// Config 包含应用程序的所有配置
type Config struct {
	Server ServerConfig `mapstructure:"server"`
	TTS    TTSConfig    `mapstructure:"tts"`
	OpenAI OpenAIConfig `mapstructure:"openai"`
}

// OpenAIConfig 包含OpenAI API配置
type OpenAIConfig struct {
	ApiKey string `mapstructure:"api_key"`
}

// ServerConfig 包含HTTP服务器配置
type ServerConfig struct {
	Port         int    `mapstructure:"port"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
	BasePath     string `mapstructure:"base_path"`
}

// TTSConfig 包含Microsoft TTS API配置
type TTSConfig struct {
	Region            string            `mapstructure:"region"`
	DefaultVoice      string            `mapstructure:"default_voice"`
	DefaultRate       string            `mapstructure:"default_rate"`
	DefaultPitch      string            `mapstructure:"default_pitch"`
	DefaultFormat     string            `mapstructure:"default_format"`
	MaxTextLength     int               `mapstructure:"max_text_length"`
	RequestTimeout    int               `mapstructure:"request_timeout"`
	MaxConcurrent     int               `mapstructure:"max_concurrent"`
	SegmentThreshold  int               `mapstructure:"segment_threshold"`
	MinSentenceLength int               `mapstructure:"min_sentence_length"`
	MaxSentenceLength int               `mapstructure:"max_sentence_length"`
	VoiceMapping      map[string]string `mapstructure:"voice_mapping"`
}

var (
	config Config
	once   sync.Once
)

// Load 从指定路径加载配置文件
func Load(configPath string) (*Config, error) {
	var err error
	once.Do(func() {
		v := viper.New()

		// 配置 Viper
		v.SetConfigName("config")
		v.SetConfigType("yaml")
		v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
		v.AutomaticEnv() // 自动绑定环境变量

		// 从配置文件加载
		if configPath != "" {
			v.SetConfigFile(configPath)
			if err = v.ReadInConfig(); err != nil {
				err = fmt.Errorf("加载配置文件失败: %w", err)
				return
			}
		}

		// 将配置绑定到结构体
		if err = v.Unmarshal(&config); err != nil {
			err = fmt.Errorf("解析配置失败: %w", err)
			return
		}
	})

	if err != nil {
		return nil, err
	}

	return &config, nil
}

// Get 返回已加载的配置
func Get() *Config {
	return &config
}
