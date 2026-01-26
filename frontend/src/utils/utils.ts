/**
 * 合并类名的工具函数
 * 简单的替代 clsx + tailwind-merge，用于减少依赖
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
