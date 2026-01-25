# TTS Studio 统一设计系统

## 📐 设计原则

基于 **SOLID** 原则构建的设计系统,确保全站样式和谐统一。

### 核心原则

1. **单一职责 (SRP)**: 每个组件只负责一个功能
2. **开闭原则 (OCP)**: 通过 CSS 变量扩展,无需修改基础样式
3. **里氏替换 (LSP)**: 统一的组件接口可互换使用
4. **接口隔离 (ISP)**: 细分的 CSS 类,按需引入
5. **依赖倒置 (DIP)**: 依赖抽象的设计令牌,而非具体颜色值

---

## 🎨 设计令牌

### 颜色系统

```css
/* 品牌色 */
--primary-500: #3b82f6;  /* 主品牌色 */
--primary-600: #2563eb;  /* 主品牌色(深) */

/* 功能色 */
--success-500: #10b981;  /* 成功 */
--warning-500: #f59e0b;  /* 警告 */
--danger-500: #ef4444;   /* 危险 */
--info-500: #3b82f6;     /* 信息 */
```

### 间距系统

```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

### 圆角系统

```css
--radius-sm: 0.375rem;  /* 小圆角 */
--radius-md: 0.5rem;    /* 中圆角 */
--radius-lg: 0.75rem;   /* 大圆角 */
--radius-xl: 1rem;      /* 超大圆角 */
--radius-2xl: 1.5rem;   /* 特大圆角(卡片) */
```

---

## 🧩 组件库

### 1. 页面容器

```tsx
// ✅ 正确: 使用统一样式
<div className="page-bg">
  <Navbar />
  <div className="page-container">
    {/* 内容 */}
  </div>
</div>

// ❌ 错误: 自定义背景
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
```

### 2. 卡片组件

```tsx
// ✅ 基础卡片
<div className="card">
  <div className="card-body">
    {/* 内容 */}
  </div>
</div>

// ✅ 带头部的卡片
<div className="card">
  <div className="card-header-primary">
    <h2>标题</h2>
  </div>
  <div className="card-body">
    {/* 内容 */}
  </div>
  <div className="card-footer">
    {/* 底部操作 */}
  </div>
</div>

// 可用的头部样式:
// - card-header-primary: 蓝色渐变 (默认)
// - card-header-secondary: 紫蓝渐变
// - card-header-accent: 橙红渐变
// - card-header-success: 绿色渐变
// - card-header-warning: 黄橙渐变
```

### 3. 按钮组件

```tsx
// ✅ 主按钮
<button className="btn-primary">保存</button>

// ✅ 次要按钮
<button className="btn-secondary">取消</button>

// ✅ 危险按钮
<button className="btn-danger">删除</button>

// ✅ 幽灵按钮
<button className="btn-ghost">关闭</button>

// ✅ 图标按钮
<button className="btn-icon">
  <svg>...</svg>
</button>

// ✅ 危险图标按钮
<button className="btn-icon-danger">
  <svg>...</svg>
</button>
```

### 4. 输入组件

```tsx
// ✅ 文本输入
<input className="input-base" />

// ✅ 选择框
<select className="select-base">...</select>

// ✅ 滑块
<input type="range" className="slider-base" />
```

### 5. 徽章组件

```tsx
// ✅ 功能徽章
<span className="badge-primary">主要</span>
<span className="badge-success">成功</span>
<span className="badge-warning">警告</span>
<span className="badge-danger">危险</span>

// ✅ 性别徽章
<span className="badge-male">男声</span>
<span className="badge-female">女声</span>
```

### 6. Toast 通知

```tsx
import { showSuccess, showError, showWarning, showInfo } from '../components/ui/Toast';

// ✅ 使用统一 Toast
showSuccess('操作成功');
showError('操作失败');
showWarning('请注意');
showInfo('提示信息');

// ❌ 错误: 手动创建 DOM
const toast = document.createElement('div');
toast.className = 'fixed top-4 right-4...';
// 不要这样做!
```

---

## 📋 页面头部配色指南

不同功能页面使用不同的头部渐变色:

| 页面类型 | 头部样式 | 用途 |
|---------|---------|-----|
| 主页 | `card-header-primary` | 默认蓝色 |
| 设置 | `card-header-secondary` | 配置页面 |
| 声音库 | `card-header-secondary` | 浏览选择 |
| 收藏 | `card-header-warning` | 收藏管理 |
| 历史记录 | `card-header-accent` | 历史回溯 |
| 播放器 | `card-header-success` | 播放控制 |

---

## 🎯 代码规范

### DO - 推荐做法

```tsx
// ✅ 使用设计系统类名
<div className="card">
  <div className="card-header-primary">
    <h2>标题</h2>
  </div>
  <div className="card-body">
    <button className="btn-primary">确认</button>
  </div>
</div>

// ✅ 使用 Toast 服务
import { showSuccess } from '../components/ui/Toast';
showSuccess('操作成功');

// ✅ 使用统一背景
<div className="page-bg">
  <div className="page-container">...</div>
</div>
```

### DON'T - 避免的做法

```tsx
// ❌ 不要硬编码颜色
<div style={{ background: '#3b82f6' }}>

// ❌ 不要重复定义样式
<div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30">
  {/* 使用 .card 代替 */}
</div>

// ❌ 不要手动创建 Toast
const toast = document.createElement('div');
toast.className = 'fixed top-4 right-4...';

// ❌ 不要自定义背景渐变
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  {/* 使用 .page-bg 代替 */}
</div>
```

---

## 🔄 迁移检查清单

迁移现有页面到统一设计系统时,确保:

- [ ] 背景使用 `page-bg` 类
- [ ] 容器使用 `page-container` 类
- [ ] 卡片使用 `card` 相关类
- [ ] 按钮使用 `btn-*` 类
- [ ] 输入框使用 `input-base` / `select-base` 类
- [ ] 徽章使用 `badge-*` 类
- [ ] Toast 使用 `showSuccess` 等函数
- [ ] 删除所有手动创建 DOM 的 Toast 代码
- [ ] 删除所有硬编码的颜色值

---

## 📚 扩展指南

### 添加新的卡片头部样式

```css
/* design-system.css */
.card-header-custom {
  @apply bg-gradient-to-r from-color-500 to-color-600 px-6 py-4 rounded-t-2xl;
}
```

### 添加新的按钮样式

```css
.btn-custom {
  @apply px-6 py-2.5 bg-color-500 hover:bg-color-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200;
}
```

### 添加新的 Toast 类型

```tsx
// Toast.tsx
export const showCustom = (message: string, duration?: number) => {
  toast.show('custom', message, duration);
};
```

---

## 🧪 测试清单

设计系统变更后的测试要点:

- [ ] 所有页面背景一致
- [ ] 所有卡片圆角统一 (rounded-2xl)
- [ ] 所有按钮过渡一致 (200ms)
- [ ] 所有 Toast 样式一致
- [ ] 响应式布局正常
- [ ] 深色模式兼容(如需要)
- [ ] 无障碍功能正常(focus 状态)
- [ ] 动画性能良好

---

## 📖 参考资料

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [SOLID 原则](https://en.wikipedia.org/wiki/SOLID)
- [设计令牌最佳实践](https://css-tricks.com/what-are-design-tokens/)

---

**最后更新**: 2026-01-24
**维护者**: TTS Studio 团队
