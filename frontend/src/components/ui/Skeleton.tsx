import React from 'react';

/**
 * Skeleton 组件的属性
 */
export interface SkeletonProps {
  /**
   * 额外的 CSS 类名
   */
  className?: string;

  /**
   * 是否在加载中
   */
  loading?: boolean;

  /**
   * 加载完成时显示的子元素
   */
  children?: React.ReactNode;
}

/**
 * Skeleton 组件
 *
 * 用于显示加载占位符
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-3/4" />
 * <Skeleton className="h-32 w-full" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = React.memo(
  ({ className = '' }) => {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * 文本骨架屏
 */
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> =
  React.memo(({ lines = 3, className = '' }) => {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${Math.max(60, 100 - i * 10)}%` }}
          />
        ))}
      </div>
    );
  });

TextSkeleton.displayName = 'TextSkeleton';

/**
 * 圆形骨架屏（用于头像）
 */
export const CircleSkeleton: React.FC<{ size?: number; className?: string }> =
  React.memo(({ size = 40, className = '' }) => {
    return (
      <Skeleton
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  });

CircleSkeleton.displayName = 'CircleSkeleton';

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC<{ className?: string }> = React.memo(
  ({ className = '' }) => {
    return (
      <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }
);

CardSkeleton.displayName = 'CardSkeleton';

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = React.memo(({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <CircleSkeleton size={40} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

ListSkeleton.displayName = 'ListSkeleton';

/**
 * 表格骨架屏
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = React.memo(({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* 表头 */}
      <div className="flex space-x-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 flex-1" />
        ))}
      </div>
      {/* 表体 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-10 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

/**
 * 带有加载状态的包装器
 */
export const WithSkeleton: React.FC<
  SkeletonProps & { showSkeleton?: boolean }
> = React.memo(({ loading = false, children, className = '' }) => {
  if (loading) {
    return <Skeleton className={className} />;
  }
  return <>{children}</>;
});

WithSkeleton.displayName = 'WithSkeleton';

/**
 * 语音选择器骨架屏（专门为 TTS 应用设计）
 */
export const VoiceSelectorSkeleton: React.FC<{ className?: string }> =
  React.memo(({ className = '' }) => {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  });

VoiceSelectorSkeleton.displayName = 'VoiceSelectorSkeleton';

/**
 * 参数控制骨架屏
 */
export const ParameterControlsSkeleton: React.FC<{ className?: string }> =
  React.memo(({ className = '' }) => {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  });

ParameterControlsSkeleton.displayName = 'ParameterControlsSkeleton';
