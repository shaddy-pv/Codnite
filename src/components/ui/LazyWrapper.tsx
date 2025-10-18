import React, { Suspense, ComponentType } from 'react';
import { SkeletonCard, SkeletonPost, SkeletonText } from './Skeleton';
import { ErrorBoundary } from './ErrorBoundary';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  skeleton?: 'card' | 'post' | 'text' | 'page';
  className?: string;
}

// Default loading fallbacks
const LoadingFallbacks = {
  card: <SkeletonCard />,
  post: <SkeletonPost />,
  text: <SkeletonText lines={3} />,
  page: (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/4" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-4/6" />
      </div>
    </div>
  )
};

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  skeleton = 'page',
  className = ''
}) => {
  const defaultFallback = fallback || LoadingFallbacks[skeleton];

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={defaultFallback}>
        <div className={className}>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
  skeleton: 'card' | 'post' | 'text' | 'page' = 'page'
) => {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  );

  return React.forwardRef<any, P>((props, ref) => (
    <LazyWrapper fallback={fallback} skeleton={skeleton}>
      <LazyComponent {...props} ref={ref} />
    </LazyWrapper>
  ));
};

// Route-specific lazy loading wrapper
export const RouteLazyWrapper: React.FC<{
  children: React.ReactNode;
  routeName: string;
}> = ({ children, routeName }) => {
  return (
    <LazyWrapper 
      skeleton="page"
      errorFallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Failed to load {routeName}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              There was an error loading this page. Please try refreshing.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      {children}
    </LazyWrapper>
  );
};

// Component-specific lazy loading wrapper
export const ComponentLazyWrapper: React.FC<{
  children: React.ReactNode;
  componentName: string;
  skeleton?: 'card' | 'post' | 'text';
}> = ({ children, componentName, skeleton = 'card' }) => {
  return (
    <LazyWrapper 
      skeleton={skeleton}
      errorFallback={
        <div className="p-4 border border-error-200 dark:border-error-700 rounded-lg bg-error-50 dark:bg-error-900/20">
          <p className="text-sm text-error-700 dark:text-error-300">
            Failed to load {componentName}
          </p>
        </div>
      }
    >
      {children}
    </LazyWrapper>
  );
};

export default LazyWrapper;
