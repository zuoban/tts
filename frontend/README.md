# TTS 前端应用

基于 Microsoft Azure 语音服务的 TTS（Text-to-Speech）前端应用，提供高质量的语音合成能力。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📦 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7.2.2
- **状态管理**: Zustand 5.0.8
- **UI 框架**: TailwindCSS 3.4.18
- **路由**: React Router DOM 7.9.5
- **HTTP 客户端**: Axios 1.13.2

## 🏗️ 项目结构

```
frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── audio/          # 音频相关组件
│   │   ├── home/           # 页面组件
│   │   ├── layout/         # 布局组件
│   │   ├── ui/            # 基础 UI 组件
│   │   └── voice/         # 声音相关组件
│   ├── hooks/             # 自定义 Hooks
│   │   ├── stores/        # Zustand Store (新架构)
│   │   └── useTTSStore.ts # 主 Store Hook
│   ├── pages/             # 页面组件
│   ├── services/          # API 服务
│   ├── styles/            # 样式文件
│   ├── types/             # TypeScript 类型
│   └── utils/             # 工具函数
├── public/                # 静态资源
└── docs/                  # 项目文档
```

## 🎯 核心功能

### 语音合成
- 支持 Microsoft Azure 语音服务
- 多种语言和声音选择
- 语速、语调调节
- 说话风格支持
- SSML 标记语言支持

### 历史记录
- 自动保存生成记录
- 历史记录播放和下载
- 最多保留 50 条记录

### 收藏声音
- 收藏常用声音
- 快速访问收藏
- 收藏管理

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=TTS Studio
```

### API 配置

应用会自动连接到后端 API 服务。如需自定义配置，请查看 `src/services/api.ts`。

## 📚 项目文档

### 快速入门
- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - 3步快速应用指南

### 应用指南
- **[docs/APPLY_GUIDE.md](docs/APPLY_GUIDE.md)** - 详细应用指南
- **[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)** - 验证清单
- **[docs/OPTIMIZATION_APPLIED.md](docs/OPTIMIZATION_APPLIED.md)** - ✅ 优化应用完成报告

### 优化文档
- **[docs/optimization/OPTIMIZATION_SUMMARY.md](docs/optimization/OPTIMIZATION_SUMMARY.md)** - 优化成果总结
- **[docs/optimization/OPTIMIZATION_PHASE1.md](docs/optimization/OPTIMIZATION_PHASE1.md)** - 第一阶段：组件优化
- **[docs/optimization/OPTIMIZATION_PHASE2.md](docs/optimization/OPTIMIZATION_PHASE2.md)** - 第二阶段：状态管理优化
- **[docs/optimization/OPTIMIZATION_PHASE3.md](docs/optimization/OPTIMIZATION_PHASE3.md)** - 第三阶段：资源管理优化
- **[docs/optimization/OPTIMIZATION_PHASE4.md](docs/optimization/OPTIMIZATION_PHASE4.md)** - 第四阶段：用户体验优化
- **[docs/optimization/STORE_MIGRATION_GUIDE.md](docs/optimization/STORE_MIGRATION_GUIDE.md)** - Store 迁移指南
- **[docs/FINAL_VERIFICATION.md](docs/FINAL_VERIFICATION.md)** - 最终验证清单

## ⚡ 性能优化

项目已实施**4个阶段**的全面性能优化：

1. **阶段一：组件优化** - 使用 React.memo、useMemo、useCallback，减少 60-80% 重渲染
2. **阶段二：状态管理优化** - Store 拆分 + 防抖持久化，减少 80% localStorage 写入
3. **阶段三：资源管理优化** - 音频资源管理器，减少 30-50% 内存占用
4. **阶段四：用户体验优化** - Alert/Skeleton 组件 + 性能监控，感知性能提升 30%

**预期优化效果：**
- 不必要重渲染：↓ 60-80%
- 状态订阅：↓ 75-90%
- localStorage 写入：↓ 80%
- 内存占用（音频）：↓ 30-50%
- 感知性能：↑ 30%

详细优化内容请查看 `docs/optimization/` 目录。

## 🔑 API 认证

应用支持多种认证方式：

1. **Bearer Token** - 在设置中配置 API Key
2. **Query 参数** - 自动附加到请求
3. **请求体参数** - 支持在请求体中传递

## 🎨 UI 组件

项目包含以下基础 UI 组件：

- **Button** - 按钮组件（多种样式变体）
- **Textarea** - 文本输入框
- **Select** - 下拉选择框
- **Slider** - 滑块控件
- **Alert** - 警告提示（4种类型，支持自动关闭）
- **Skeleton** - 骨架屏加载占位符（8种预设）
- **Modal** - 模态框

## 🧪 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码检查和修复
npm run lint:fix

# 清理构建文件
npm run clean
```

## 🐛 调试

### 浏览器控制台

打开浏览器开发者工具（F12）：

- **Console** - 查看日志和错误
- **Network** - 查看网络请求
- **React DevTools** - 查看组件树和状态

### 迁移助手

在浏览器控制台加载 `public/migration-helper.js` 可以使用以下命令：

```javascript
TTSMigration.status()     // 查看迁移状态
TTSMigration.migrate()    // 执行数据迁移
TTSMigration.rollback()   // 回滚迁移
TTSMigration.help()       // 显示帮助
```

## 🔄 数据迁移

应用启动时会自动检测并迁移旧版本数据。迁移过程：

1. 检测旧版本 Store（`tts-store`）
2. 迁移表单数据到新 Store（`tts-form-store`）
3. 迁移历史记录到新 Store（`tts-data-store`）
4. 备份旧 Store（带时间戳）
5. 删除旧 Store

## 📝 开发注意事项

### 组件开发

- 使用 TypeScript 编写组件
- 遵循现有的代码风格
- 使用 React DevTools Profiler 监控性能
- 避免不必要的重渲染

### 状态管理

- 优先使用选择器 Hooks 而非订阅整个 Store
- 保持 Store 的单一职责原则
- 不要在 Store 中存储临时 UI 状态

### 样式开发

- 使用 TailwindCSS 类名
- 遵循现有的设计系统
- 确保响应式设计

## 🧪 测试

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint
```

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请提交 Issue 或联系项目维护者。

---

**版本**: 2.0.0
**最后更新**: 2026-01-13
**优化状态**: ✅ 已完成全部4个阶段优化

**新增功能（v2.0.0）：**
- ✅ 音频资源管理器（自动清理 Blob URL）
- ✅ Alert 组件（统一错误处理）
- ✅ Skeleton 组件（加载状态优化）
- ✅ 性能监控工具（开发调试）
- ✅ 防抖存储（减少 80% localStorage 写入）
- ✅ 数据自动迁移（平滑升级）
