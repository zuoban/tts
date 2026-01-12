# 快速开始 - 3步应用新 Store 架构

## 🚀 快速应用（3步法）

### 第 1 步：数据迁移（2分钟）

#### 在浏览器控制台执行：

1. **启动开发服务器**
```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
npm run dev
```

2. **打开浏览器控制台**
   - 访问 `http://localhost:3000`
   - 按 `F12` 打开开发者工具
   - 切换到 Console 标签

3. **复制并粘贴以下脚本**

打开 `public/migration-helper.js` 文件，复制全部内容，粘贴到控制台，按 Enter。

4. **执行迁移命令**
```javascript
TTSMigration.migrate()
```

5. **验证迁移成功**
```javascript
TTSMigration.status()
```
应该看到 "新版本Stores: ✅ 存在"

### 第 2 步：更新代码（1分钟）

#### 编辑 `src/App.tsx`:

在文件顶部添加数据迁移逻辑：

```typescript
import { useEffect } from 'react';
import { needsMigration, migrateFromOldStore } from './utils/migration';

function App() {
  // 添加这段代码
  useEffect(() => {
    if (needsMigration()) {
      const result = migrateFromOldStore();
      console.log(result.message);
      if (result.success) {
        // 迁移成功，提示用户刷新
        console.log('✅ 数据迁移成功，建议刷新页面');
      }
    }
  }, []);

  return <Home />;
}

export default App;
```

#### 编辑 `src/pages/Home.tsx`:

修改导入语句（只需改一行）：

```typescript
// ❌ 旧版本（注释掉）
// import { useTTSStore } from '../hooks/useTTSStore';

// ✅ 新版本（添加这一行）
import { useTTSStoreV2 as useTTSStore } from '../hooks/useTTSStoreV2';
```

**就这么简单！** 其他代码保持不变。

### 第 3 步：测试验证（2分钟）

1. **刷新浏览器页面**
   - 按 `Ctrl+R` 或 `Cmd+R`

2. **测试基本功能**
   - ✅ 输入文本
   - ✅ 选择声音
   - ✅ 生成语音
   - ✅ 查看历史记录

3. **检查数据持久化**
   - 刷新页面
   - ✅ 表单数据保留
   - ✅ 历史记录保留

4. **完成！**

---

## 🎯 性能优化（可选）

如果想进一步提升性能，可以迁移子组件使用选择器：

### 示例：优化 FormSection 组件

```typescript
// src/components/home/FormSection.tsx

// ❌ 旧方式
import { useTTSStore } from '../../hooks/useTTSStore';

const FormSection = () => {
  const { text, isLoading, setText } = useTTSStore();  // 订阅所有状态
  // ...
};

// ✅ 新方式
import {
  useText,
  useFormActions,
} from '../../hooks/stores';
import { useIsLoading } from '../../hooks/stores';

const FormSection = () => {
  const text = useText();                    // 只订阅 text
  const isLoading = useIsLoading();          // 只订阅 isLoading
  const { setText } = useFormActions();      // 只订阅 actions

  // ... 组件代码
};
```

---

## 🐛 遇到问题？

### 问题：迁移后数据丢失

**解决：** 在控制台执行
```javascript
TTSMigration.rollback()
```
然后刷新页面，重新执行迁移。

### 问题：功能不正常

**解决：** 检查浏览器控制台是否有错误

1. 按 `F12` 打开开发者工具
2. 切换到 Console 标签
3. 查看是否有红色错误信息
4. 根据错误信息修复

### 问题：想回滚到旧版本

**解决：** 执行以下命令
```bash
cd /Users/wangjinqiang/GolandProjects/tts/frontend
cp src/pages/Home.tsx.backup src/pages/Home.tsx
```

---

## 📊 验证优化效果

### 查看状态订阅

在 React DevTools 中：
1. 点击 Components 标签
2. 选中一个组件
3. 查看 hooks 面板
4. 对比优化前后的状态订阅数量

### 查看渲染性能

在 React DevTools Profiler 中：
1. 切换到 Profiler 标签
2. 点击 "Start recording"
3. 执行一些操作
4. 点击 "Stop recording"
5. 查看渲染图

---

## 📚 需要更多信息？

- **详细应用指南：** [APPLY_GUIDE.md](./APPLY_GUIDE.md)
- **迁移详细说明：** [STORE_MIGRATION_GUIDE.md](./STORE_MIGRATION_GUIDE.md)
- **优化总结报告：** [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)

---

## ✅ 完成检查清单

- [ ] 数据迁移成功
- [ ] App.tsx 已添加迁移逻辑
- [ ] Home.tsx 已更新导入
- [ ] 基本功能测试通过
- [ ] 数据持久化正常
- [ ] 浏览器控制台无错误

**全部完成后，恭喜您成功应用了新的 Store 架构！** 🎉
