package config

import (
	"fmt"
	"html"
	"regexp"
	"strings"
	"sync"

	"github.com/spf13/viper"
)

// Config 包含应用程序的所有配置
type Config struct {
	Server ServerConfig `mapstructure:"server"`
	TTS    TTSConfig    `mapstructure:"tts"`
	SSML   SSMLConfig   `mapstructure:"ssml"`
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
	ApiKey            string            `mapstructure:"api_key"`
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

// TagPattern 定义标签模式及其名称
type TagPattern struct {
	Name    string `mapstructure:"name"`    // 标签名称，用于日志和调试
	Pattern string `mapstructure:"pattern"` // 标签的正则表达式模式
}

// SSMLConfig 存储SSML标签配置
type SSMLConfig struct {
	// PreserveTags 包含所有需要保留的标签的正则表达式模式
	PreserveTags []TagPattern `mapstructure:"preserve_tags"`
}

// SSMLProcessor 处理SSML内容
type SSMLProcessor struct {
	config       *SSMLConfig
	patternCache map[string]*regexp.Regexp
}

// NewSSMLProcessor 从配置对象创建SSMLProcessor
func NewSSMLProcessor(config *SSMLConfig) (*SSMLProcessor, error) {
	processor := &SSMLProcessor{
		config:       config,
		patternCache: make(map[string]*regexp.Regexp),
	}

	// 预编译正则表达式
	for _, tagPattern := range config.PreserveTags {
		regex, err := regexp.Compile(tagPattern.Pattern)
		if err != nil {
			return nil, fmt.Errorf("编译正则表达式'%s'失败: %w", tagPattern.Name, err)
		}
		processor.patternCache[tagPattern.Name] = regex
	}

	return processor, nil
}

// EscapeSSML 转义SSML内容，但保留配置的标签
func (p *SSMLProcessor) EscapeSSML(ssml string) string {
	// 使用占位符替换标签
	placeholders := make(map[string]string)
	processedSSML := ssml

	counter := 0

	// 处理所有配置的标签
	for name, pattern := range p.patternCache {
		processedSSML = pattern.ReplaceAllStringFunc(processedSSML, func(match string) string {
			placeholder := fmt.Sprintf("__SSML_PLACEHOLDER_%s_%d__", name, counter)
			placeholders[placeholder] = match
			counter++
			return placeholder
		})
	}

	// 对处理后的文本进行HTML转义
	escapedContent := html.EscapeString(processedSSML)

	// 恢复所有标签占位符
	for placeholder, tag := range placeholders {
		escapedContent = strings.Replace(escapedContent, placeholder, tag, 1)
	}

	return escapedContent
}
