import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className = '',
    label,
    error,
    helperText,
    showCharCount = false,
    maxLength,
    value = '',
    onChange,
    ...props
  }, ref) => {
    const baseClasses = 'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white/90 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-colors resize-none';
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

    const charCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxLength && charCount > maxLength;

    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {(showCharCount || maxLength) && (
              <span className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                {charCount}{maxLength ? `/${maxLength}` : ''}
              </span>
            )}
          </div>
        )}
        <textarea
          className={`${baseClasses} ${errorClasses} ${className}`}
          ref={ref}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };