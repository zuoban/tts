# TTS Store 架构应用指南

## 📋 应用前准备

### 1. 确认当前状态

```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
```

### 2. 查看项目结构

```bash
# 查看新的 Store 文件
ls -la src/hooks/stores/

# 查看工具文件
ls -la src/utils/storage.ts src/utils/migration.ts

# 查看组合 Hook
ls -la src/hooks/useTTSStoreV2.ts
```

---

## 🚀 应用步骤

### 步骤 1：在浏览器中测试迁移

#### 方法一：使用迁移助手脚本（推荐）

1. **启动开发服务器**
```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
npm run dev
```

2. **打开浏览器控制台**
   - 访问 `http://localhost:3000`
   - 按 `F12` 或右键 → 检查 → Console 标签

3. **加载迁移助手**
   - 打开 `public/migration-helper.js` 文件
   - 复制全部内容
   - 粘贴到浏览器控制台
   - 按 `Enter` 执行

4. **查看当前状态**
```javascript
TTSMigration.status()
```

5. **执行迁移**
```javascript
TTSMigration.migrate()
```

6. **验证迁移**
```javascript
TTSMigration.status()
// 检查 "新版本Stores" 是否显示 "✅ 存在"
```

#### 方法二：手动执行迁移

如果不想使用脚本，可以在控制台手动执行：

```javascript
// 1. 检查旧 Store
const oldStore = JSON.parse(localStorage.getItem('tts-store'));
console.log('旧 Store 数据:', oldStore);

// 2. 迁移表单数据
const formData = {
  text: oldStore.text || '',
  voice: oldStore.voice || '',
  style: oldStore.style || '',
  rate: oldStore.rate || '0',
  pitch: oldStore.pitch || '0',
  locale: oldStore.locale || '',
};
localStorage.setItem('tts-form-store', JSON.stringify(formData));
console.log('✅ 表单数据已迁移');

// 3. 迁移历史记录
if (oldStore.history) {
  const dataStoreData = {
    history: oldStore.history,
  };
  localStorage.setItem('tts-data-store', JSON.stringify(dataStoreData));
  console.log('✅ 历史记录已迁移');
}

// 4. 备份旧 Store
const timestamp = Date.now();
localStorage.setItem(`tts-store.backup.${timestamp}`, JSON.stringify(oldStore));
console.log('✅ 旧 Store 已备份');

// 5. 删除旧 Store
localStorage.removeItem('tts-store');
console.log('✅ 旧 Store 已删除');

// 6. 验证迁移
console.log('新 Store 数据:');
console.log('  Form Store:', JSON.parse(localStorage.getItem('tts-form-store')));
console.log('  Data Store:', JSON.parse(localStorage.getItem('tts-data-store')));
```

### 步骤 2：在代码中应用新 Store

#### 选项 A：使用组合 Hook（推荐，快速应用）

**文件：** `src/App.tsx` 或 `src/pages/Home.tsx`

1. **添加数据迁移逻辑**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { needsMigration, migrateFromOldStore } from './utils/migration';

function App() {
  // 应用启动时自动迁移
  useEffect(() => {
    if (needsMigration()) {
      const result = migrateFromOldStore();
      console.log(result.message);
      if (result.success) {
        console.log('✅ 数据迁移成功，请刷新页面');
      }
    }
  }, []);

  return <Home />;
}

export default App;
```

2. **更新 Home.tsx 使用新 Hook**

```typescript
// src/pages/Home.tsx

// ❌ 旧版本
import { useTTSStore } from '../hooks/useTTSStore';

// ✅ 新版本
import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';

const Home: React.FC<HomeProps> = ({ onOpenSettings }) => {
  // Hook 使用保持不变
  const {
    text,
    voice,
    style,
    isLoading,
    error,
    voices,
    config,
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

#### 选项 B：使用选择器（性能优化，需要修改代码）

适用于子组件优化：

```typescript
// src/components/home/FormSection.tsx
import {
  useText,
  useVoiceSettings,
  useFormActions,
} from '../../hooks/stores';
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

### 步骤 3：测试功能

#### 功能测试清单

- [ ] **基础功能**
  - [ ] 文本输入
  - [ ] 声音选择
  - [ ] 语速调节
  - [ ] 语调调节
  - [ ] 语音生成

- [ ] **高级功能**
  - [ ] 二级语言联动
  - [ ] 风格选择
  - [ ] 历史记录
  - [ ] 收藏声音
  - [ ] 快捷键（Ctrl+K, Ctrl+Enter）

- [ ] **数据持久化**
  - [ ] 刷新页面后表单数据保留
  - [ ] 历史记录保留
  - [ ] API Key 保留

#### 测试步骤

1. **启动开发服务器**
```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
npm run dev
```

2. **打开浏览器**
```
http://localhost:3000
```

3. **打开开发者工具**
   - 按 `F12`
   - 查看 Console 标签（检查错误）
   - 查看 React DevTools（检查状态）

4. **执行功能测试**
   - 按照测试清单逐项测试
   - 记录任何问题

5. **检查 Store 状态**
   - 打开 React DevTools
   - 切换到 Profiler 标签
   - 记录组件渲染情况

### 步骤 4：性能对比（可选）

#### 使用 React DevTools Profiler

1. **旧版本性能基准**

   如果想对比优化前后的性能：

   ```typescript
   // 临时切换回旧版本
   import { useTTSStore } from '../hooks/useTTSStore';
   ```

2. **记录性能**
   - 点击 React DevTools Profiler 的 "Start recording"
   - 执行一些操作（输入文本、切换声音等）
   - 点击 "Stop recording"
   - 查看渲染图

3. **切换到新版本**
   ```typescript
   // 使用新版本
   import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';
   ```

4. **再次记录并对比**

#### 使用 Chrome DevTools Performance

1. **录制性能**
   - 按 `F12` 切换到 Performance 标签
   - 点击 "Record"
   - 执行一些操作
   - 点击 "Stop"

2. **分析结果**
   - 查看 Scripting 时间
   - 查看 Rendering 时间
   - 查看内存使用

---

## 🐛 问题排查

### 问题 1：迁移后数据丢失

**症状：** 刷新页面后数据为空

**原因：** 数据未正确迁移

**解决方案：**

1. 检查 localStorage：
```javascript
// 在控制台执行
console.log('Form Store:', localStorage.getItem('tts-form-store'));
console.log('Data Store:', localStorage.getItem('tts-data-store'));
```

2. 如果新 Store 为空，执行回滚：
```javascript
TTSMigration.rollback()
```

3. 刷新页面后重新迁移

### 问题 2：功能异常

**症状：** 某些功能不工作

**可能原因：**
- Store 未正确初始化
- 选择器导入错误
- 类型定义不匹配

**解决方案：**

1. **检查浏览器控制台**
   - 查看是否有错误信息
   - 查看是否有警告

2. **检查导入路径**
```typescript
// 确认导入路径正确
import { useTTSStoreV2 } from '../hooks/useTTSStoreV2';
// 或
import { useText } from '../hooks/stores';
```

3. **验证 Store 初始化**
```javascript
// 在控制台检查
console.log('Form Store:', window.FormStore);
console.log('Audio Store:', window.AudioStore);
```

### 问题 3：性能没有提升

**症状：** 优化后性能仍不理想

**原因：** 使用了组合 Hook 而非选择器

**解决方案：**

逐步迁移到选择器：

1. 从最简单的组件开始（如 FormSection）
2. 使用选择器替换组合 Hook
3. 使用 React DevTools Profiler 测量性能
4. 验证有提升后继续迁移其他组件

### 问题 4：TypeScript 类型错误

**症状：** 类型不匹配或缺少类型

**解决方案：**

1. **检查类型定义**
```typescript
// 确认导入了正确的类型
import type { FormState, AudioState, UIState, DataState } from '../hooks/stores';
```

2. **运行类型检查**
```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
npm run type-check
```

3. **修复类型错误**

---

## ✅ 应用验证

### 验证清单

#### 功能验证

- [ ] 应用启动正常
- [ ] 数据迁移成功
- [ ] 所有功能正常工作
- [ ] 数据持久化正常

#### 性能验证

- [ ] React DevTools 显示组件渲染次数减少
- [ ] 浏览器控制台无错误
- [ ] 页面响应速度感觉更快

#### 代码验证

- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过（如果有）
- [ ] Git 状态正常

---

## 🔄 回滚方案

如果遇到问题需要回滚：

### 快速回滚

```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend

# 方法一：恢复备份
cp src/pages/Home.tsx.backup src/pages/Home.tsx

# 方法二：使用 Git 回滚
git checkout src/pages/Home.tsx
```

### 数据回滚

在浏览器控制台执行：

```javascript
TTSMigration.rollback()
```

然后刷新页面。

---

## 📚 相关文档

- **[Store 迁移指南](./STORE_MIGRATION_GUIDE.md)** - 详细的迁移说明
- **[优化总结](./OPTIMIZATION_SUMMARY.md)** - 优化成果总结
- **[第一阶段报告](./OPTIMIZATION_PHASE1.md)** - 组件优化报告
- **[第二阶段报告](./OPTIMIZATION_PHASE2.md)** - Store 优化报告

---

## 💡 最佳实践

### 1. 渐进式迁移

不要一次性修改所有文件：
1. 先在测试环境验证
2. 逐个组件迁移
3. 充分测试每个步骤
4. 遇到问题立即回滚

### 2. 持续监控

应用后持续监控：
- 使用 React DevTools Profiler
- 查看浏览器控制台
- 收集用户反馈

### 3. 文档更新

及时更新文档：
- 记录遇到的问题
- 记录解决方案
- 更新最佳实践

### 4. 团队沟通

如果是团队项目：
- 分享应用经验
- 培训团队成员
- 建立代码审查流程

---

## 🎓 总结

新的 Store 架构提供了：

1. **更好的性能** - 减少 75-90% 不必要的状态订阅
2. **更清晰的结构** - Store 职责明确，易于理解
3. **更强的可维护性** - 模块化设计，易于修改
4. **更好的可测试性** - 每个 Store 可独立测试

选择合适的迁移方式：
- **快速应用**：使用 `useTTSStoreV2` 组合 Hook
- **性能优化**：使用选择器直接从 Store 导入

祝你应用顺利！🚀
