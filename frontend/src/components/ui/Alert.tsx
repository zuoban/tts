import React from 'react';

/**
 * Alert 组件的属性
 */
export interface AlertProps {
  /**
   * 警告类型
   */
  type: 'error' | 'warning' | 'success' | 'info';

  /**
   * 显示的消息
   */
  message: string;

  /**
   * 关闭回调
   */
  onClose?: () => void;

  /**
   * 自动关闭时间（毫秒），0 表示不自动关闭
   */
  autoClose?: number;

  /**
   * 额外的 CSS 类名
   */
  className?: string;
}

/**
 * Alert 组件
 *
 * 用于显示统一的警告和提示信息
 *
 * @example
 * ```tsx
 * <Alert type="error" message="操作失败" onClose={() => setError(null)} />
 * <Alert type="success" message="保存成功" autoClose={3000} />
 * ```
 */
export const Alert: React.FC<AlertProps> = React.memo(
  ({ type, message, onClose, autoClose = 0, className = '' }) => {
    React.useEffect(() => {
      if (autoClose > 0 && onClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoClose);

        return () => clearTimeout(timer);
      }
    }, [autoClose, onClose]);

    const styles = {
      error: 'bg-red-50 border-red-400 text-red-700',
      warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
      success: 'bg-green-50 border-green-400 text-green-700',
      info: 'bg-blue-50 border-blue-400 text-blue-700',
    };

    const icons = {
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    return (
      <div
        className={`${styles[type]} border-l-4 p-4 rounded-lg shadow-sm ${className}`}
        role="alert"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'error'
                    ? 'hover:bg-red-100 focus:ring-red-600 text-red-500'
                    : type === 'warning'
                    ? 'hover:bg-yellow-100 focus:ring-yellow-600 text-yellow-500'
                    : type === 'success'
                    ? 'hover:bg-green-100 focus:ring-green-600 text-green-500'
                    : 'hover:bg-blue-100 focus:ring-blue-600 text-blue-500'
                }`}
              >
                <span className="sr-only">关闭</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

/**
 * 预设的 Alert 组件变体
 */
export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="error" {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="warning" {...props} />
);

export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="success" {...props} />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="info" {...props} />
);
