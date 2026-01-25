import React from 'react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  loading?: boolean;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className = '',
    label,
    error,
    helperText,
    options = [],
    loading = false,
    placeholder = '请选择...',
    children,
    ...props
  }, ref) => {
    const baseClasses = 'h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none pr-10';
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

    return (
      <div className="space-y-1 isolate">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={`${baseClasses} ${errorClasses} ${className}`}
            ref={ref}
            disabled={loading}
            {...props}
          >
          {placeholder && (
            <option value="" disabled key="placeholder">
              {loading ? '加载中...' : placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option
              key={`${option.value}-${index}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          {children}
          </select>
          {/* 下拉箭头 */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-20">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };