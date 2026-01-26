import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: 
          "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400 bg-green-50 dark:bg-green-900/10",
        warning:
          "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
        info:
          "border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400 bg-blue-50 dark:bg-blue-900/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void;
  autoClose?: number;
  message?: string;
  type?: 'error' | 'warning' | 'success' | 'info';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, type, message, children, onClose, autoClose = 0, ...props }, ref) => {
    
    // Compatibility adapter for old 'type' prop
    const computedVariant = variant || (type === 'error' ? 'destructive' : type || 'default');

    React.useEffect(() => {
      if (autoClose > 0 && onClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoClose);

        return () => clearTimeout(timer);
      }
    }, [autoClose, onClose]);

    const IconMap = {
      default: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      destructive: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      success: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      info: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    const icon = IconMap[computedVariant as keyof typeof IconMap] || IconMap.default;

    return (
      <div
        ref={ref}
        role="alert"
        className={alertVariants({ variant: computedVariant, className })}
        {...props}
      >
        {icon}
        <div>
          {message && <div className="font-medium">{message}</div>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
        {onClose && (
            <button
              onClick={onClose}
              className="absolute right-2 top-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

// Compatibility Wrappers
export const ErrorAlert: React.FC<AlertProps> = (props) => (
  <Alert variant="destructive" {...props} />
);

export const WarningAlert: React.FC<AlertProps> = (props) => (
  <Alert variant="warning" {...props} />
);

export const SuccessAlert: React.FC<AlertProps> = (props) => (
  <Alert variant="success" {...props} />
);

export const InfoAlert: React.FC<AlertProps> = (props) => (
  <Alert variant="info" {...props} />
);

export { Alert, alertVariants };
