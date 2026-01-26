import React, { useEffect } from 'react';
import { cva } from 'class-variance-authority';

/**
 * 统一的 Toast 通知组件
 * 遵循 SOLID 原则 - 单一职责,只负责显示通知
 */

const toastVariants = cva(
  "fixed top-4 right-4 z-[100] flex items-center gap-3 w-full max-w-sm overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-background border-border text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-100",
        warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
        info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Internal Toast Component for rendering
const ToastItem: React.FC<ToastProps & { id: string }> = ({
  type = 'info',
  message,
  duration = 3000,
  onClose,
}) => {
  const variantMap: Record<string, "default" | "destructive" | "success" | "warning" | "info"> = {
    success: 'success',
    error: 'destructive',
    warning: 'warning',
    info: 'info',
  };

  return (
    <div className={toastVariants({ variant: variantMap[type] })} role="alert">
       {/* Icon would go here if needed, simplified for brevity */}
      <div className="text-sm font-semibold">{message}</div>
    </div>
  );
};


/**
 * Toast 服务 - 使用命令模式管理通知
 * Refactored to use standard DOM manipulation for simplicity without a full Context provider
 * In a real app, consider using 'sonner' or 'react-hot-toast'
 */
class ToastService {
  private container: HTMLElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(type: ToastProps['type'], message: string, duration = 3000) {
    const container = this.ensureContainer();

    const toastWrapper = document.createElement('div');
    toastWrapper.className = 'pointer-events-auto transition-all duration-300 ease-in-out transform translate-x-full opacity-0';
    
    // Set styles based on type using Tailwind classes directly for dynamic injection
    let bgClass = "bg-background text-foreground border-border";
    let icon = "";

    switch(type) {
        case 'success':
            bgClass = "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800";
            icon = '<svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
            break;
        case 'error':
            bgClass = "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800";
            icon = '<svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            break;
        case 'warning':
            bgClass = "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-800";
            icon = '<svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
            break;
        case 'info':
        default:
             bgClass = "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800";
             icon = '<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
            break;
    }

    toastWrapper.innerHTML = `
      <div class="flex items-center gap-3 w-full max-w-sm rounded-lg border p-4 shadow-lg ${bgClass}">
        <div class="flex-shrink-0">${icon}</div>
        <div class="text-sm font-medium flex-1">${message}</div>
      </div>
    `;

    container.appendChild(toastWrapper);

    // Animate in
    requestAnimationFrame(() => {
        toastWrapper.classList.remove('translate-x-full', 'opacity-0');
    });

    setTimeout(() => {
      // Animate out
      toastWrapper.classList.add('translate-x-full', 'opacity-0');
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (container.contains(toastWrapper)) {
          container.removeChild(toastWrapper);
        }
      }, 300);
    }, duration);
  }

  success(message: string, duration?: number) {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number) {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number) {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number) {
    this.show('info', message, duration);
  }
}

// 导出单例
export const toast = new ToastService();

// 便捷函数
export const showSuccess = (message: string, duration?: number) => toast.success(message, duration);
export const showError = (message: string, duration?: number) => toast.error(message, duration);
export const showWarning = (message: string, duration?: number) => toast.warning(message, duration);
export const showInfo = (message: string, duration?: number) => toast.info(message, duration);
