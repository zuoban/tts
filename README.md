# TTS 服务

一个现代化的文本转语音 (TTS) 服务，基于 Microsoft Azure 语音服务，采用前后端分离架构，提供高质量的语音合成能力。

## ✨ 功能特点

- 🌍 **多语言支持** - 支持多种语言和声音
- ⚡ **高性能** - 异步处理，支持高并发
- 🎛️ **可调节** - 支持语速、语调和情感风格调节
- 🎵 **多格式** - 支持多种输出音频格式
- 🔌 **兼容性** - 完全兼容 OpenAI TTS API
- ✂️ **智能分割** - 支持长文本自动分割与合并
- 🖥️ **现代界面** - 基于 React 的现代化 Web UI
- 🔧 **RESTful API** - 提供完整的 REST API 接口
- 📦 **多部署方式** - 支持 Docker、Cloudflare Worker 等多种部署方式
- ⭐ **收藏功能** - 支持收藏喜欢的声音，快速选择和管理
- 🎯 **声音库** - 完整的声音浏览和试听功能

## 🏗️ 架构概览

项目采用前后端分离的现代化架构：

### 后端服务 (Go)
- **技术栈**: Go + Gin 框架
- **功能**: 提供 TTS 核心功能和 RESTful API
- **特点**: 高性能、低延迟、易于扩展

### 前端应用 (React)
- **技术栈**: React 19 + TypeScript + Vite + Tailwind CSS
- **功能**: 提供现代化的 Web 用户界面
- **特点**: 响应式设计、组件化开发、类型安全

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```shell
# 拉取并运行完整服务（前端 + 后端）
docker run -d -p 8080:8080 --name=tts zuoban/zb-tts
```

部署完成后：
- **前端界面**: 访问 `http://localhost:8080`
- **API 接口**: `http://localhost:8080/api/v1/*`

### 方式二：本地开发

#### 后端开发

```shell
# 构建应用程序
go build -o tts ./cmd/api

# 运行应用程序
./tts

# 或使用配置文件运行
./tts -config ./configs/config.yaml
```

#### 前端开发

```shell
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器（默认端口 3000）
npm run dev

# 构建生产版本
npm run build
```

#### Docker Compose 开发

```shell
# 启动完整开发环境（前端 + 后端）
docker-compose -f docker-compose.dev.yml up --build
```

### 方式三：Cloudflare Worker 部署

适用于轻量级无服务器部署：

1. 创建一个新的 Cloudflare Worker
2. 复制以下脚本内容到 Worker
   [worker.js](https://github.com/zuoban/tts/blob/main/workers/src/index.js)
3. 添加环境变量 `API_KEY`
   - Workers & Pages -> Your Worker -> Settings -> Variables and Secrets -> Add
   - Type: `Secret`,  Name: `API_KEY`, Value: `YOUR_API_KEY`

## 📚 API 文档

### v1 API（推荐使用）

#### 健康检查
```shell
curl "http://localhost:8080/api/v1/health"
```

#### 获取配置信息
```shell
curl "http://localhost:8080/api/v1/config"
```

#### 获取语音列表

```shell
# 方式 1：Bearer Token 认证（推荐）
curl -H "Authorization: Bearer YOUR_TTS_API_KEY" \
  "http://localhost:8080/api/v1/voices"

# 方式 2：Query 参数认证
curl "http://localhost:8080/api/v1/voices?api_key=YOUR_TTS_API_KEY"
```

#### 文本转语音

```shell
# 方式 1：GET 请求 + Query 参数认证
curl "http://localhost:8080/api/v1/tts?text=你好，世界&voice=zh-CN-XiaoxiaoNeural&api_key=YOUR_TTS_API_KEY" \
  -o output.mp3

# 方式 2：POST 请求 + Bearer Token 认证（推荐）
curl -X POST "http://localhost:8080/api/v1/tts" \
  -H "Authorization: Bearer YOUR_TTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，世界",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": 20,
    "pitch": 10,
    "style": "cheerful"
  }' -o output.mp3

# 方式 3：POST 请求 + 请求体中的 api_key
curl -X POST "http://localhost:8080/api/v1/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，世界",
    "voice": "zh-CN-XiaoxiaoNeural",
    "rate": 20,
    "pitch": 10,
    "style": "cheerful",
    "api_key": "YOUR_TTS_API_KEY"
  }' -o output.mp3
```

**参数说明：**
- `text`: 文本内容
- `voice`: 语音风格
- `rate`: 语速，范围 -100 到 100
- `pitch`: 语调，范围 -100 到 100
- `style`: 情感风格，可选值为 `sad`, `angry`, `cheerful`, `neutral`

**认证说明：** 所有 TTS 相关接口支持以下三种认证方式：

1. **Bearer Token** (推荐): `Authorization: Bearer YOUR_TTS_API_KEY`
2. **Query 参数**: `?api_key=YOUR_TTS_API_KEY`
3. **请求体参数**: JSON 中包含 `"api_key": "YOUR_TTS_API_KEY"`

### 兼容性 API

#### 原版 TTS API

```shell
# 无认证（如果配置了 API Key 则需要认证）
curl "http://localhost:8080/tts?t=你好，世界&v=zh-CN-XiaoxiaoNeural" -o output.mp3

# 使用 Query 参数认证
curl "http://localhost:8080/tts?t=你好，世界&v=zh-CN-XiaoxiaoNeural&api_key=YOUR_TTS_API_KEY" -o output.mp3
```

#### OpenAI 兼容 API

```shell
# 方式 1：Bearer Token 认证（推荐）
curl -X POST "http://localhost:8080/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TTS_API_KEY" \
  -d '{
    "model": "tts-1",
    "input": "你好，世界！",
    "voice": "zh-CN-XiaoxiaoNeural",
    "speed": 0.5
  }' -o output.mp3

# 方式 2：请求体中包含 api_key
curl -X POST "http://localhost:8080/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "你好，世界！",
    "voice": "zh-CN-XiaoxiaoNeural",
    "speed": 0.5,
    "api_key": "YOUR_TTS_API_KEY"
  }' -o output.mp3
```

**参数说明：**
- `model`: 模型名称，对应情感风格
- `input`: 文本内容
- `voice`: 语音风格
- `speed`: 语速，0.0 到 2.0
- `api_key`: API 密钥（可选，也可通过 Bearer Token 或 Query 参数提供）

**认证说明：** 支持 Bearer Token、Query 参数或请求体中的 `api_key` 参数进行认证

## ⚙️ 配置选项

### 环境变量配置

**优先级：** 环境变量 > 配置文件 > 默认值

#### 后端环境变量
```shell
# 服务配置
SERVER_PORT=8080                      # 服务端口
CORS_ALLOWED_ORIGINS=*                # 允许的 CORS 源

# TTS 服务配置
TTS_API_KEY=your_api_key              # 统一的 API 密钥（TTS 和 OpenAI 兼容接口）
TTS_REGION=eastasia                   # Azure 区域
TTS_MAX_CONCURRENT=20                 # 最大并发数
```

#### 前端环境变量
```shell
# 在 frontend 目录下设置
VITE_API_BASE_URL=http://localhost:8080  # API 基础 URL
VITE_APP_TITLE="TTS 服务"                # 应用标题
VITE_NODE_ENV=development                # 环境标识
```

### 配置文件详解

后端服务使用 YAML 格式的配置文件，默认查找位置：
- `./configs/config.yaml`
- `./config.yaml`
- `/etc/tts/config.yaml`

**示例配置文件 (configs/config.yaml):**

```yaml
server:
  port: 8080                # 服务监听端口
  read_timeout: 60          # HTTP 读取超时时间（秒）
  write_timeout: 60         # HTTP 写入超时时间（秒）
  base_path: ""             # API 基础路径前缀

tts:
  region: "eastasia"        # Azure 语音服务区域
  default_voice: "zh-CN-XiaoxiaoNeural"  # 默认语音
  default_rate: "0"         # 默认语速，范围 -100 到 100
  default_pitch: "0"        # 默认语调，范围 -100 到 100
  default_format: "audio-24khz-48kbitrate-mono-mp3"  # 默认音频格式
  max_text_length: 65535    # 最大文本长度
  request_timeout: 30       # 请求 Azure 服务的超时时间（秒）
  max_concurrent: 20        # 最大并发请求数
  segment_threshold: 300    # 文本分段阈值
  min_sentence_length: 200  # 最小句子长度
  max_sentence_length: 300  # 最大句子长度
  api_key: 'your_api_key'   # TTS API 密钥

  # OpenAI 到微软 TTS 中文语音的映射
  voice_mapping:
    alloy: "zh-CN-XiaoyiNeural"       # 中性女声
    echo: "zh-CN-YunxiNeural"         # 年轻男声
    fable: "zh-CN-XiaochenNeural"     # 儿童声
    onyx: "zh-CN-YunjianNeural"       # 成熟男声
    nova: "zh-CN-XiaohanNeural"       # 活力女声
    shimmer: "zh-CN-XiaomoNeural"     # 温柔女声

# 注意：OpenAI 兼容接口使用 tts.api_key，不需要单独配置

ssml:
  preserve_tags:                      # SSML 标签保留配置
    - name: break
      pattern: <break\s+[^>]*/>
    - name: speak
      pattern: <speak>|</speak>
    - name: prosody
      pattern: <prosody\s+[^>]*>|</prosody>
    # ... 更多 SSML 标签配置
```

### Docker 配置示例

```shell
# 使用自定义端口
docker run -d -p 9000:9000 -e SERVER_PORT=9000 --name=tts zuoban/zb-tts

# 使用配置文件
docker run -d -p 8080:8080 \
  -v /path/to/config.yaml:/configs/config.yaml \
  --name=tts zuoban/zb-tts

# 设置环境变量
docker run -d -p 8080:8080 \
  -e TTS_API_KEY=your_key \
  -e TTS_REGION=eastasia \
  --name=tts zuoban/zb-tts
```


## 🛠️ 本地构建与运行

### 系统要求

- **Go**: 1.19 或更高版本
- **Node.js**: 18.0 或更高版本（前端开发）
- **Docker**: 20.0 或更高版本（可选）

### 从源码构建

```shell
# 克隆仓库
git clone https://github.com/zuoban/tts.git
cd tts

# 后端构建
go mod download
go build -o tts ./cmd/api

# 前端构建
cd frontend
npm install
npm run build
cd ..

# 运行后端服务
./tts
```

### 开发脚本

#### 后端开发
```shell
# 运行测试
go test ./...

# 整理依赖
go mod tidy

# 验证依赖
go mod verify

# 多平台构建（需要 Docker Buildx）
./script/build.sh
```

#### 前端开发
```shell
cd frontend

# 启动开发服务器（默认端口 3000）
npm run dev

# 代码检查
npm run lint

# 自动修复 linting 问题
npm run lint:fix

# TypeScript 类型检查
npm run type-check

# 清理构建文件
npm run clean

# 预览构建结果
npm run preview
```

## 🧪 故障排除

### 常见问题

#### 1. CORS 错误
- 检查后端 CORS 配置：`CORS_ALLOWED_ORIGINS=*`
- 确认前端 API 基础 URL 正确：`VITE_API_BASE_URL`

#### 2. API 请求失败
- 验证 API Key 设置：`TTS_API_KEY`（统一用于所有接口）
- 检查后端服务是否正常运行
- 查看后端日志输出：`./tts -v`

#### 3. 前端构建失败
```shell
cd frontend
npm install  # 更新依赖
# 检查 Node.js 版本（需要 18+）
node --version
```

#### 4. 配置文件找不到
- 检查配置文件路径：`./configs/config.yaml`
- 使用绝对路径：`./tts -config /absolute/path/config.yaml`
- 查看启动日志中的配置文件路径

### 调试工具

- **前端调试**: 浏览器开发者工具 + React DevTools
- **后端调试**: 日志输出 + 健康检查接口 `GET /api/v1/health`
- **API 测试**: 使用 curl 或 Postman 测试 API 接口

## 📄 项目结构

```
tts/
├── cmd/api/                 # 后端应用程序入口点
├── internal/                # 私有应用程序代码
│   ├── config/             # 配置管理
│   ├── http/               # HTTP 层
│   │   ├── handlers/       # HTTP 请求处理器
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由配置
│   │   └── server/         # HTTP 服务器实现
│   ├── models/             # 数据模型定义
│   ├── tts/                # TTS 服务层
│   └── utils/              # 工具函数
├── frontend/               # React 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── ui/         # 通用 UI 组件
│   │   │   ├── audio/      # 音频相关组件
│   │   │   │   ├── FavoriteVoices.tsx    # 收藏声音组件
│   │   │   │   ├── HistoryList.tsx      # 历史记录组件
│   │   │   │   └── AudioPlayer.tsx      # 音频播放器组件
│   │   │   └── layout/     # 布局组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Home.tsx    # 首页（包含收藏功能）
│   │   │   └── VoiceLibrary.tsx   # 声音库页面
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务层
│   │   │   ├── api.ts      # TTS API 服务
│   │   │   └── favorites.ts # 收藏功能服务
│   │   ├── types/          # TypeScript 类型定义
│   │   │   ├── index.ts    # 核心类型（包含收藏相关类型）
│   │   └── utils/          # 工具函数
│   └── dist/               # 构建输出目录
├── configs/                # 配置文件
├── script/                 # 构建脚本
├── workers/                # Cloudflare Worker 代码
└── docs/                   # 文档
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
