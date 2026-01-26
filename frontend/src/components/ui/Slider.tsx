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
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    onChange,
    ...props
  }, ref) => {
    // Percentage for background fill
    const percentage = ((Number(value) - min) / (max - min)) * 100;

    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
              {label}
            </label>
            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
              {valueDisplay || `${value}%`}
            </span>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-muted-foreground w-8 text-left font-mono">{min}</span>
          <div className="relative w-full h-2 rounded-full bg-secondary">
             <input
              type="range"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              ref={ref}
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={onChange}
              {...props}
            />
            <div 
                className="absolute left-0 top-0 h-full bg-primary rounded-full"
                style={{ width: `${percentage}%` }}
            />
             <div 
                className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-background border-2 border-primary rounded-full shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                style={{ left: `calc(${percentage}% - 8px)` }}
             />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right font-mono">{max}</span>
        </div>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
