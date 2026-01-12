# AGENTS.md

此文件为在此代码库中运行的代理编码工具提供指南。

## 构建和测试命令

### Go 后端

```bash
# 构建应用
go build -o tts ./cmd/api

# 运行应用
./tts
./tts -config ./configs/config.yaml
./tts -port 9000

# 依赖管理
go mod download
go mod tidy
go mod verify

# 运行单个测试（当前项目无测试文件）
# 如需添加测试，运行：
go test -v ./internal/... -run TestFunctionName

# 运行所有测试
go test ./internal/...

# 使用测试覆盖率
go test -cover ./internal/...
```

### React 前端

```bash
cd frontend

# 开发服务器
npm run dev

# 构建生产版本
npm run build
npm run build:check  # 构建 + 类型检查

# 预览构建
npm run preview

# 代码检查
npm run lint
npm run lint:fix

# TypeScript 类型检查
npm run type-check

# 清理构建文件
npm run clean
```

### Cloudflare Worker

```bash
cd workers

# 开发模式
npm run dev

# 部署
npm run deploy

# 依赖安装
npm install
```

## 代码风格指南

### Go 代码风格

#### 导入组织
- 使用 `goimports` 自动组织导入（标准库 → 第三方库 → 项目内部包）
- 示例：
  ```go
  import (
      "encoding/json"
      "fmt"
      "log"

      "github.com/gin-gonic/gin"
      "github.com/google/uuid"

      "tts/internal/config"
      "tts/internal/models"
  )
  ```

#### 命名约定
- **包名**：小写单词，无下划线或大写字母
- **导出函数**：PascalCase（`GetConfig`, `LoadConfig`）
- **私有函数**：camelCase（`truncateForLog`, `audioMerge`）
- **常量**：PascalCase（`userAgent`, `voicesEndpoint`）
- **接口**：以行为描述的命名（`Service`, `Handler`）
- **结构体**：PascalCase（`Config`, `Client`, `Voice`）

#### 错误处理
- 函数返回时使用 `fmt.Errorf` 包装错误，添加上下文信息：
  ```go
  return nil, fmt.Errorf("加载配置文件失败: %w", err)
  return nil, fmt.Errorf("编译正则表达式'%s'失败: %w", name, err)
  ```
- 使用 `log.Fatalf` 在初始化失败时终止程序
- 避免吞没错误，总是检查返回的错误

#### 格式化
- 使用 `gofmt` 或 `go fmt ./...`
- 缩进使用 tab
- 行长度建议不超过 120 字符
- 结构体标签使用 `mapstructure` 和 `json`：
  ```go
  type Config struct {
      Port int    `mapstructure:"port"`
      Name string `json:"name"`
  }
  ```

#### 并发安全
- 使用 `sync.RWMutex` 保护共享数据：
  ```go
  type Client struct {
      voicesCache   []Voice
      voicesCacheMu sync.RWMutex
  }

  c.voicesCacheMu.RLock()
  defer c.voicesCacheMu.RUnlock()
  ```

#### 注释
- 导出的类型、函数、常量必须有注释
- 注释以导出名称开头，并以句号结尾：
  ```go
  // Config 包含应用程序的所有配置
  type Config struct { ... }

  // Load 从指定路径加载配置文件
  func Load(path string) (*Config, error) { ... }
  ```

### TypeScript/React 代码风格

#### 导入组织
```typescript
// 1. React 和核心库
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// 2. 第三方库
import axios from 'axios';
import { cva, type VariantProps } from 'class-variance-authority';

// 3. 内部类型和组件
import { Button } from './components/ui/Button';
import { useTTSStore } from './hooks/useTTSStore';
import type { Voice, TTSParams } from '../types/index';
```

#### 组件定义
```typescript
// 函数组件使用 PascalCase
interface Props {
  title: string;
  onOpen?: () => void;
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, title, onOpen, ...props }, ref) => {
    return <button ref={ref} {...props}>{title}</button>;
  }
);
```

#### 类型定义
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型和工具类型
- 导出类型定义供外部使用：
  ```typescript
  export interface Voice {
    name: string;
    locale: string;
    gender: string;
  }

  export type VoiceStatus = 'available' | 'unavailable';
  ```

#### 钩子命名
- 自定义 Hooks 以 `use` 开头：
  ```typescript
  export const useTTSStore = create<TTSState>((set) => ({ ... }));
  export const useVoices = () => { ... };
  ```

#### 样式处理
- 优先使用 TailwindCSS 类名
- 使用 `class-variance-authority` 管理组件变体
- 避免内联样式，除非动态值需要：
  ```typescript
  <button className="bg-blue-600 text-white hover:bg-blue-700">
  ```

#### 错误处理
- 使用 `try-catch` 包裹异步操作
- 提供有意义的错误日志：
  ```typescript
  try {
    const data = await api.getConfig();
    return data;
  } catch (error) {
    console.error('获取配置失败:', error);
    return null;
  }
  ```

#### API 调用
- 使用 axios 实例配置基础设置
- 实现请求拦截器和响应拦截器
- 添加请求去重和缓存机制

### 通用原则

1. **配置管理**：使用 `internal/config` 包统一管理配置，支持环境变量覆盖
2. **依赖注入**：通过函数参数传递依赖，避免全局变量
3. **接口优先**：定义接口（如 `tts.Service`）以支持不同的实现
4. **日志记录**：使用 `log.Printf` 或 `fmt.Printf` 记录关键操作和错误
5. **注释规范**：只注释"为什么"，不注释"是什么"
6. **简洁性**：避免不必要的抽象，保持代码直接和可读

### 提交前检查

在提交代码前，运行以下命令确保代码质量：

```bash
# Go
go fmt ./...
go vet ./...
go mod tidy

# 前端
cd frontend
npm run lint
npm run type-check
npm run build:check
```

### 测试约定

- 测试文件命名为 `*_test.go`，与被测试文件在同一包中
- 测试函数以 `Test` 开头
- 使用 `t.Run()` 组织测试用例
- 为核心业务逻辑编写单元测试
- 使用表驱动测试处理多种情况
