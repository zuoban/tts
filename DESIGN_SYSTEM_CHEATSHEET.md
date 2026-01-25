# TTS Studio 设计系统速查表

> 快速参考指南 - 常用样式类和使用方法

## 🎨 快速查找

### 页面结构
```tsx
<div className="page-bg">
  <Navbar />
  <div className="page-container">
    {/* 内容 */}
  </div>
</div>
```

### 卡片组件
```tsx
<div className="card">
  <div className="card-header-primary">
    <h2>标题</h2>
  </div>
  <div className="card-body">
    内容
  </div>
  <div className="card-footer">
    底部操作
  </div>
</div>
```

---

## 📦 组件类名

### 页面容器
| 类名 | 用途 |
|------|------|
| `page-bg` | 页面背景(含装饰) |
| `page-container` | 页面容器 |

### 卡片
| 类名 | 用途 |
|------|------|
| `card` | 基础卡片 |
| `card-hover` | 卡片悬停效果 |
| `card-body` | 卡片内容区 |
| `card-footer` | 卡片底部 |

### 卡片头部
| 类名 | 颜色 | 用途 |
|------|------|------|
| `card-header-primary` | 蓝色 | 主页、默认 |
| `card-header-secondary` | 紫蓝 | 设置、浏览 |
| `card-header-accent` | 橙红 | 历史、警告 |
| `card-header-success` | 绿色 | 成功、播放 |
| `card-header-warning` | 黄橙 | 收藏、注意 |

### 按钮
| 类名 | 用途 |
|------|------|
| `btn-primary` | 主按钮 |
| `btn-secondary` | 次要按钮 |
| `btn-danger` | 危险操作 |
| `btn-ghost` | 幽灵按钮 |
| `btn-icon` | 图标按钮 |
| `btn-icon-danger` | 危险图标按钮 |

### 输入框
| 类名 | 用途 |
|------|------|
| `input-base` | 文本输入 |
| `select-base` | 下拉选择 |
| `slider-base` | 滑块 |

### 徽章
| 类名 | 用途 |
|------|------|
| `badge-primary` | 主要标签 |
| `badge-success` | 成功标签 |
| `badge-warning` | 警告标签 |
| `badge-danger` | 危险标签 |
| `badge-male` | 男声标签 |
| `badge-female` | 女声标签 |

---

## 🔔 Toast 通知

### 导入
```tsx
import { showSuccess, showError, showWarning, showInfo } from '../components/ui/Toast';
```

### 使用
```tsx
showSuccess('操作成功');
showError('操作失败');
showWarning('请注意');
showInfo('提示信息');

// 自定义持续时间
showSuccess('操作成功', 3000);
```

### 类型对照

| 函数 | 颜色 | 图标 | 用途 |
|------|------|------|------|
| `showSuccess()` | 绿色 | ✓ | 成功操作 |
| `showError()` | 红色 | ⚠ | 错误提示 |
| `showWarning()` | 黄色 | ⚠ | 警告信息 |
| `showInfo()` | 蓝色 | ℹ | 一般信息 |

---

## 🎯 设计令牌

### 颜色
```css
/* 主色 */
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* 功能色 */
--success-500: #10b981;
--warning-500: #f59e0b;
--danger-500: #ef4444;
--info-500: #3b82f6;
```

### 间距
```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

### 圆角
```css
--radius-sm: 0.375rem;  /* 小圆角 */
--radius-md: 0.5rem;    /* 中圆角 */
--radius-lg: 0.75rem;   /* 大圆角 */
--radius-xl: 1rem;      /* 超大圆角 */
--radius-2xl: 1.5rem;   /* 卡片圆角 */
```

### 阴影
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## 📋 常见模式

### 模式 1: 标准页面
```tsx
export default function MyPage() {
  return (
    <div className="page-bg">
      <Navbar />
      <div className="page-container">
        <div className="card">
          <div className="card-header-primary">
            <h1>页面标题</h1>
          </div>
          <div className="card-body">
            {/* 内容 */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 模式 2: 表单页面
```tsx
<div className="card">
  <div className="card-header-secondary">
    <h2>表单标题</h2>
  </div>
  <div className="card-body space-y-4">
    <input className="input-base" placeholder="输入..." />
    <select className="select-base">
      <option>选项</option>
    </select>
    <button className="btn-primary">提交</button>
    <button className="btn-secondary">取消</button>
  </div>
</div>
```

### 模式 3: 列表页面
```tsx
<div className="card">
  <div className="card-header-secondary">
    <div className="flex items-center justify-between">
      <h2>列表标题</h2>
      <button className="btn-primary">添加</button>
    </div>
  </div>
  <div className="card-body">
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="p-4 border border-gray-200 rounded-xl">
          {item.name}
        </div>
      ))}
    </div>
  </div>
</div>
```

### 模式 4: 操作确认
```tsx
const handleDelete = () => {
  showInfo('已删除项目');
  // 执行删除逻辑
};

<button
  onClick={handleDelete}
  className="btn-danger"
>
  删除
</button>
```

---

## 🚫 反模式 (不要这样做)

### ❌ 硬编码颜色
```tsx
// 错误
<div style={{ backgroundColor: '#3b82f6' }}>

// 正确
<div className="bg-primary-500">
```

### ❌ 重复样式
```tsx
// 错误
<div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30">

// 正确
<div className="card">
```

### ❌ 手动创建 Toast
```tsx
// 错误
const toast = document.createElement('div');
toast.className = 'fixed top-4 right-4...';
document.body.appendChild(toast);

// 正确
showSuccess('操作成功');
```

### ❌ 自定义背景
```tsx
// 错误
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

// 正确
<div className="page-bg">
```

---

## 🎨 页面类型配色指南

| 页面类型 | 推荐头部 | 说明 |
|---------|---------|-----|
| 主页 | `card-header-primary` | 默认蓝色 |
| 设置 | `card-header-secondary` | 配置页面 |
| 浏览 | `card-header-secondary` | 列表、库 |
| 编辑 | `card-header-primary` | 表单编辑 |
| 历史 | `card-header-accent` | 历史记录 |
| 播放 | `card-header-success` | 播放器 |
| 收藏 | `card-header-warning` | 收藏夹 |
| 危险 | `card-header-accent` | 删除、警告 |

---

## 🔧 工具类

### 过渡效果
```tsx
<div className="hover-lift">  {/* 悬停升起 */}
<div className="transition-all duration-200">  {/* 标准过渡 */}
```

### 滚动条
```tsx
<div className="scrollbar-thin">  {/* 细滚动条 */}
<div className="scrollbar-hide">  {/* 隐藏滚动条 */}
```

### 动画
```tsx
<div className="fade-in">  {/* 淡入 */}
<div className="pulse-subtle">  {/* 微妙脉冲 */}
```

---

## 📱 响应式

### 容器
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* 响应式内边距 */}
</div>
```

### 网格
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 响应式网格 */}
</div>
```

### 显示/隐藏
```tsx
<div className="hidden sm:block">  {/* 小屏隐藏 */}
<div className="block sm:hidden">  {/* 小屏显示 */}
```

---

## ✅ 检查清单

新组件创建时,确保:

- [ ] 使用 `page-bg` 和 `page-container`
- [ ] 使用 `card` 系列类
- [ ] 使用 `btn-*` 系列按钮
- [ ] 使用 `input-base` / `select-base`
- [ ] 使用 Toast 函数替代手动 DOM
- [ ] 删除硬编码颜色
- [ ] 删除重复样式代码
- [ ] 测试响应式布局
- [ ] 测试无障碍功能

---

## 📚 相关文档

- [完整设计系统](./DESIGN_SYSTEM.md)
- [重构总结](./REFACTORING_SUMMARY.md)
- [重构对比](./REFACTORING_COMPARISON.md)

---

**最后更新**: 2026-01-24
**版本**: 1.0.0
