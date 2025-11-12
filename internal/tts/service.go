package tts

import (
	"context"
	"tts/internal/models"
)

// Service 定义TTS服务接口
type Service interface {
	// ListVoices 获取可用的语音列表
	ListVoices(ctx context.Context, locale string) ([]models.Voice, error)

	// SynthesizeSpeech 将文本转换为语音
	SynthesizeSpeech(ctx context.Context, req models.TTSRequest) (*models.TTSResponse, error)

	// WarmupVoicesCache 预热声音列表缓存
	WarmupVoicesCache(ctx context.Context) error
}
