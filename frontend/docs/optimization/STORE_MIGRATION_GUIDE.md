# Store 拆分应用指南

## 📋 概述

本文档说明如何将现有的 `useTTSStore` 迁移到新的拆分 Store 架构。

---

## 🎯 迁移方式

### 方式一：使用组合 Hook（推荐）

适用于现有组件的快速迁移，无需大量修改代码。

#### 步骤：

1. **修改导入语句**
```typescript
// ❌ 旧版本
import { useTTSStore } from '../hooks/useTTSStore';

// ✅ 新版本
import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';
```

2. **组件内部代码无需修改**

组合 Hook `useTTSStoreV2` 提供了与旧版本相同的接口，因此组件内部的代码可以保持不变。

#### 示例：

```typescript
// Home.tsx
import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';

const Home = () => {
  const {
    text,
    voice,
    style,
    isLoading,
    error,
    voices,
    history,
    setText,
    setVoice,
    generateSpeech,
    // ... 其他状态和方法
  } = useTTSStore();

  // 组件代码保持不变
  return (
    // JSX
  );
};
```

**优点：**
- ✅ 最小化代码修改
- ✅ 向后兼容
- ✅ 平滑过渡

**缺点：**
- ❌ 仍然订阅了所有状态（性能提升有限）

---

### 方式二：直接使用选择器（性能最优）

适用于新组件或需要优化性能的组件。

#### 步骤：

1. **按需导入选择器**
```typescript
import {
  useText,              // 只订阅 text
  useVoiceSettings,      // 只订阅 voice, style, locale
  useFormActions,        // 只订阅表单 actions
} from '../hooks/stores';

import {
  useVoices,             // 只订阅 voices
  useHistory,            // 只订阅 history
  useHistoryActions,     // 只订阅历史记录 actions
} from '../hooks/stores';
```

2. **使用选择器获取状态**
```typescript
const FormSection = () => {
  // 只订阅需要的部分状态
  const text = useText();
  const { voice, style, locale } = useVoiceSettings();
  const { setText, setVoice } = useFormActions();

  return (
    // JSX
  );
};
```

#### 完整示例：

```typescript
// FormSection.tsx
import { useText, useVoiceSettings, useFormActions } from '../../hooks/stores';
import { useIsLoading, useError } from '../../hooks/stores';

const FormSection = () => {
  // 只订阅需要的部分状态
  const text = useText();
  const { voice } = useVoiceSettings();
  const isLoading = useIsLoading();
  const error = useError();

  // 只订阅需要的 actions
  const { setText, setVoice } = useFormActions();

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      <button onClick={handleGenerate} disabled={isLoading}>
        生成
      </button>
    </div>
  );
};
```

**优点：**
- ✅ 性能最优（只订阅需要的状态）
- ✅ 减少不必要的重渲染
- ✅ 代码更清晰

**缺点：**
- ❌ 需要修改组件代码
- ❌ 需要了解 Store 结构

---

## 📊 迁移对比

### 场景一：大型组件（如 Home.tsx）

**旧版本：**
```typescript
const Home = () => {
  const store = useTTSStore();
  // 订阅了 20+ 个状态，任何状态变化都会重渲染
  return <div>...</div>;
};
```

**方式一（组合 Hook）：**
```typescript
const Home = () => {
  const store = useTTSStoreV2();
  // 仍然订阅了 20+ 个状态，但底层是拆分的 Store
  return <div>...</div>;
};
```

**方式二（选择器）：**
```typescript
const Home = () => {
  // 拆分为多个子组件，每个组件只订阅需要的状态
  return (
    <div>
      <FormSection />        {/* 只订阅 text, isLoading */}
      <VoiceSelection />     {/* 只订阅 voice, locale */}
      <HistorySection />     {/* 只订阅 history */}
    </div>
  );
};
```

**性能对比：**
- 旧版本：任何状态变化 → 整个 Home 组件重渲染
- 方式一：任何状态变化 → 整个 Home 组件重渲染（但底层 Store 更高效）
- 方式二：特定状态变化 → 只有对应的子组件重渲染 ⭐

---

## 🔄 渐进式迁移策略

### 阶段 1：使用组合 Hook（当前）

**目标：** 快速应用新的 Store 架构，无需大量修改代码。

**步骤：**
1. 在 `App.tsx` 或主要组件中替换导入：
```typescript
import { useTTSStoreV2 as useTTSStore } from './hooks/useTTSStoreV2';
```

2. 运行应用，测试功能是否正常

3. 如果有问题，可以快速回滚：
```typescript
import { useTTSStore } from './hooks/useTTSStore';
```

### 阶段 2：优化热点组件

**目标：** 对性能敏感的组件使用选择器。

**候选组件：**
- FormSection
- VoiceSelection
- ParameterControls
- HistorySection
- ActionButtons

**步骤：**
1. 从组合 Hook 迁移到选择器
2. 使用 React DevTools Profiler 测量性能
3. 对比优化前后的渲染次数

### 阶段 3：完全迁移（可选）

**目标：** 所有组件都使用选择器。

**步骤：**
1. 逐个组件迁移
2. 充分测试
3. 删除 `useTTSStoreV2` 组合 Hook

---

## ✅ 迁移检查清单

### 功能测试

- [ ] 文本输入和语音生成
- [ ] 声音切换和二级联动
- [ ] 参数调节（语速、语调、风格）
- [ ] 历史记录管理
- [ ] 收藏声音
- [ ] 快捷键功能
- [ ] 错误处理

### 性能测试

- [ ] 使用 React DevTools Profiler 测量渲染时间
- [ ] 对比优化前后的渲染次数
- [ ] 监控 localStorage 写入次数

### 数据完整性

- [ ] 表单数据正确持久化
- [ ] 历史记录正确保存
- [ ] 刷新页面后数据正确恢复

### 兼容性

- [ ] Chrome/Firefox/Safari
- [ ] 移动端浏览器
- [ ] 不同屏幕尺寸

---

## 🐛 常见问题

### Q1: 迁移后功能异常

**A:** 检查以下几点：
1. 确认所有导入路径正确
2. 确认 Store 已正确初始化
3. 检查浏览器控制台是否有错误
4. 使用 React DevTools 检查状态

### Q2: 性能没有明显提升

**A:** 可能的原因：
1. 使用了组合 Hook 而非选择器 → 建议迁移到选择器
2. 子组件没有使用 React.memo → 建议添加 memo
3. 状态订阅粒度不够细 → 建议细化选择器

### Q3: 数据丢失

**A:** 检查以下几点：
1. 确认运行了数据迁移脚本
2. 检查 localStorage 中是否有新 Store 的数据
3. 确认 `partialize` 配置正确

### Q4: TypeScript 类型错误

**A:** 确认：
1. 导入的类型定义正确
2. Store 的类型定义完整
3. 使用了正确的选择器

---

## 📝 代码示例

### 示例 1：简单迁移（使用组合 Hook）

```typescript
// Before
import { useTTSStore } from '../hooks/useTTSStore';

const Home = () => {
  const {
    text,
    voice,
    isLoading,
    setText,
    setVoice,
    generateSpeech,
  } = useTTSStore();

  return (
    // JSX
  );
};

// After
import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';

const Home = () => {
  const {
    text,
    voice,
    isLoading,
    setText,
    setVoice,
    generateSpeech,
  } = useTTSStore();

  return (
    // JSX - 完全相同
  );
};
```

### 示例 2：性能优化迁移（使用选择器）

```typescript
// Before - 订阅整个 Store
const FormSection = () => {
  const { text, isLoading, error, setText } = useTTSStore();

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      {isLoading && <div>加载中...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

// After - 只订阅需要的部分状态
const FormSection = () => {
  const text = useText();
  const isLoading = useIsLoading();
  const error = useError();
  const { setText } = useFormActions();

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      {isLoading && <div>加载中...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### 示例 3：子组件优化

```typescript
// VoiceSelection.tsx
import { memo } from 'react';
import {
  useVoices,
  useVoiceSettings,
  useFormActions,
} from '../../hooks/stores';

interface VoiceSelectionProps {
  onOpenVoiceLibrary?: () => void;
  disabled?: boolean;
}

const VoiceSelection = memo(({ onOpenVoiceLibrary, disabled }: VoiceSelectionProps) => {
  // 只订阅需要的部分状态
  const voices = useVoices();
  const { voice, locale } = useVoiceSettings();
  const { setVoice, setLocale } = useFormActions();

  // 组件逻辑...
  return <div>...</div>;
});

export default VoiceSelection;
```

---

## 🚀 快速开始

### 第一步：安装依赖

无需安装新依赖，使用现有的 zustand。

### 第二步：运行数据迁移（如果需要）

```typescript
// 在 App.tsx 中添加
import { useEffect } from 'react';
import { needsMigration, migrateFromOldStore } from './utils/migration';

function App() {
  useEffect(() => {
    if (needsMigration()) {
      const result = migrateFromOldStore();
      console.log(result.message);
    }
  }, []);

  return <Home />;
}
```

### 第三步：替换导入

```typescript
// 在主要组件中
import { useTTSStoreV2 as useTTSStore } from './hooks/useTTSStoreV2';
```

### 第四步：测试应用

1. 启动开发服务器
2. 测试所有功能
3. 检查浏览器控制台
4. 监控性能

---

## 📚 相关文档

- [第一阶段优化报告](./OPTIMIZATION_PHASE1.md)
- [第二阶段优化报告](./OPTIMIZATION_PHASE2.md)
- [Store 架构说明](./src/hooks/stores/README.md)
- [数据迁移工具](./src/utils/migration.ts)

---

## 💡 最佳实践

### 1. 渐进式迁移

不要一次性迁移所有组件，而是：
1. 先使用组合 Hook
2. 然后逐步迁移热点组件到选择器
3. 最后迁移剩余组件

### 2. 性能监控

使用工具持续监控性能：
- React DevTools Profiler
- Chrome DevTools Performance
- 自定义性能日志

### 3. 测试覆盖

每次迁移后都要：
1. 功能测试
2. 性能测试
3. 回归测试

### 4. 文档更新

及时更新文档，记录：
1. 迁移过程
2. 遇到的问题
3. 解决方案

---

## 🎓 总结

Store 拆分的核心优势：

1. **性能提升**：减少不必要的状态订阅和重渲染
2. **可维护性**：Store 职责清晰，易于理解和修改
3. **可测试性**：每个 Store 可独立测试
4. **可扩展性**：易于添加新的状态和逻辑

选择合适的迁移方式：
- **快速应用**：使用组合 Hook（`useTTSStoreV2`）
- **性能优化**：使用选择器（直接从 Store 导入）

祝你迁移顺利！🚀
