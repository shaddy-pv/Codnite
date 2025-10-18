import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  };
  
  const style = {
    width: width,
    height: height
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index}
        variant="text" 
        width={index === lines - 1 ? '75%' : '100%'}
        className="h-4"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-neutral-200 dark:border-neutral-700 rounded-xl ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={16} className="mb-2" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <SkeletonText lines={3} className="mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton variant="rectangular" width={80} height={32} />
      <Skeleton variant="rectangular" width={60} height={24} />
    </div>
  </div>
);

export const SkeletonPost: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 ${className}`}>
    <div className="flex items-center space-x-3 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="30%" height={16} className="mb-1" />
        <Skeleton variant="text" width="20%" height={12} />
      </div>
      <Skeleton variant="rectangular" width={24} height={24} />
    </div>
    <SkeletonText lines={4} className="mb-4" />
    <div className="flex items-center space-x-4">
      <Skeleton variant="rectangular" width={60} height={32} />
      <Skeleton variant="rectangular" width={60} height={32} />
      <Skeleton variant="rectangular" width={60} height={32} />
    </div>
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  return (
    <Skeleton 
      variant="circular" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton 
    variant="rectangular" 
    width={100} 
    height={40} 
    className={`rounded-xl ${className}`}
  />
);

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton 
    variant="rectangular" 
    width="100%" 
    height={44} 
    className={`rounded-xl ${className}`}
  />
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" height={16} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height={14} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
