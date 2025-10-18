import React from 'react';
import { Skeleton, SkeletonCard, SkeletonPost, SkeletonText } from './Skeleton';
import { ErrorFallback } from './ErrorBoundary';
import { Button } from './Button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingWrapperProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: 'card' | 'post' | 'text' | 'custom';
  skeletonProps?: any;
  customSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  error,
  onRetry,
  children,
  skeleton = 'card',
  skeletonProps = {},
  customSkeleton,
  emptyState,
  isEmpty = false,
  className = ''
}) => {
  // Show error state
  if (error) {
    return (
      <div className={className}>
        <ErrorFallback 
          error={error} 
          resetError={onRetry}
          level="section"
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    if (customSkeleton) {
      return <div className={className}>{customSkeleton}</div>;
    }

    const skeletonComponents = {
      card: <SkeletonCard {...skeletonProps} />,
      post: <SkeletonPost {...skeletonProps} />,
      text: <SkeletonText {...skeletonProps} />
    };

    return (
      <div className={className}>
        {skeletonComponents[skeleton]}
      </div>
    );
  }

  // Show empty state
  if (isEmpty && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  // Show content
  return <div className={className}>{children}</div>;
};

// Specialized loading wrappers for common use cases
export const PostLoadingWrapper: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}> = ({ isLoading, error, onRetry, children, count = 3, className = '' }) => {
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonPost key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorFallback error={error} resetError={onRetry} level="section" />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export const CardLoadingWrapper: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}> = ({ isLoading, error, onRetry, children, count = 4, className = '' }) => {
  if (isLoading) {
    return (
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorFallback error={error} resetError={onRetry} level="section" />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Loading state for forms
export const FormLoadingWrapper: React.FC<{
  isSubmitting: boolean;
  isValidating: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isSubmitting, isValidating, error, onRetry, children, className = '' }) => {
  if (error) {
    return (
      <div className={className}>
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-error-800 dark:text-error-200">
                Form Error
              </h3>
              <p className="text-sm text-error-700 dark:text-error-300 mt-1">
                {error.message}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                  className="mt-3"
                >
                  Try again
                </Button>
              )}
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {(isSubmitting || isValidating) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {isSubmitting ? 'Submitting...' : 'Validating...'}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

// Loading state for buttons
export const ButtonLoadingWrapper: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, loadingText = 'Loading...', children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">{loadingText}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default LoadingWrapper;
