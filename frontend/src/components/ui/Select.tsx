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
    const baseClasses = 'flex h-10 w-full rounded-md border border-gray-300 bg-white/90 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-colors appearance-none pr-10';
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
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

Select.displayName = 'Select';

export { Select };