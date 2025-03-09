# TTS 服务

一个简单易用的文本转语音 (TTS) 服务，基于 Microsoft Azure 语音服务，提供高质量的语音合成能力。

## 功能特点

- 支持多种语言和声音
- 可调节语速和语调
- 支持多种输出音频格式
- 兼容 OpenAI TTS API
- 支持长文本自动分割与合并
- 提供 Web UI 和 RESTful API

## 快速开始

### Docker 部署

```shell
docker run -d -p 8080:8080 --name=tts zuoban/zb-tts
```

部署完成后，访问 `http://localhost:8080` 使用 Web 界面，或通过 `http://localhost:8080/api-doc` 查看 API 文档。

### Cloudflare Worker 部署

1. 创建一个新的 Cloudflare Worker
2. 复制以下脚本内容到 Worker
   [worker.js](https://raw.githubusercontent.com/zuoban/tts/main/web/templates/worker.js)

## API 使用示例

### 基础 API

```shell
# 基础文本转语音
curl "http://localhost:8080/tts?t=你好，世界&v=zh-CN-XiaoxiaoNeural"

# 调整语速和语调
curl "http://localhost:8080/tts?t=你好，世界&v=zh-CN-XiaoxiaoNeural&r=20&p=10"

# 使用情感风格
curl "http://localhost:8080/tts?t=今天天气真好&v=zh-CN-XiaoxiaoNeural&s=cheerful"
```

### OpenAI 兼容 API

```shell
curl -X POST "http://localhost:8080/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "你好，世界！",
    "voice": "zh-CN-XiaoxiaoNeural"
  }'
```

## 配置选项

您可以通过环境变量或配置文件自定义 TTS 服务：

```shell
# 使用自定义端口
docker run -d -p 9000:9000 -e PORT=9000 --name=tts zuoban/zb-tts

# 使用配置文件
docker run -d -p 8080:8080 -v /path/to/config.yaml:/app/config.yaml --name=tts zuoban/zb-tts
```

## 本地构建与运行

要从源码构建和运行：

```shell
# 克隆仓库
git clone https://github.com/zuoban/tts.git
cd tts

# 构建
go build -o tts ./cmd/api

# 运行
./tts
```

## 支持的音频格式

- MP3: `audio-24khz-48kbitrate-mono-mp3`（默认）
- MP3: `audio-24khz-96kbitrate-mono-mp3`
- MP3: `audio-24khz-160kbitrate-mono-mp3`
- WAV: `riff-24khz-16bit-mono-pcm`
- OGG: `ogg-24khz-16bit-mono-opus`

更多格式请参考 API 文档。

## 许可证

MIT