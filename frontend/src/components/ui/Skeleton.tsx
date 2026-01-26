import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SkeletonProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  loading?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = React.memo(
  ({ className, variant, loading, ...props }) => {
    return (
      <div
        className={skeletonVariants({ variant, className })}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

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

export const CardSkeleton: React.FC<{ className?: string }> = React.memo(
  ({ className = '' }) => {
    return (
      <div className={`border border-border rounded-lg p-4 space-y-3 ${className}`}>
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }
);

CardSkeleton.displayName = 'CardSkeleton';

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

export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = React.memo(({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 flex-1" />
        ))}
      </div>
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

export const WithSkeleton: React.FC<
  SkeletonProps & { showSkeleton?: boolean }
> = React.memo(({ loading = false, children, className = '', ...props }) => {
  if (loading) {
    return <Skeleton className={className} {...props} />;
  }
  return <>{children}</>;
});

WithSkeleton.displayName = 'WithSkeleton';

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
