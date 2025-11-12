import React from 'react';

export interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  valueDisplay?: string;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({
    className = '',
    label,
    helperText,
    valueDisplay,
    min = -100,
    max = 100,
    step = 1,
    value = 0,
    onChange,
    ...props
  }, ref) => {
    const baseClasses = 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    const isSliderNoLabel = className.includes('slider-no-label');

    // 计算填充百分比
    const percentage = ((Number(value) - min) / (max - min)) * 100;

    const sliderStyle = {
      background: `linear-gradient(to right, rgb(59 130 246 / 0.3) 0%, rgb(59 130 246 / 0.3) ${percentage}%, rgb(229 231 235) ${percentage}%, rgb(229 231 235) 100%)`,
    };

    if (isSliderNoLabel) {
      return (
        <input
          type="range"
          className={`${baseClasses} ${className}`}
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          style={sliderStyle}
          {...props}
        />
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {valueDisplay || `${value}%`}
            </span>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500 w-8 text-left">{min}%</span>
          <input
            type="range"
            className={`${baseClasses} ${className}`}
            ref={ref}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            style={sliderStyle}
            {...props}
          />
          <span className="text-xs text-gray-500 w-8 text-right">{max}%</span>
        </div>
        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };