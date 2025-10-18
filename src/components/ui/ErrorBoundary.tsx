import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff, Server, Bug } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
}

type ErrorType = 'network' | 'chunk' | 'component' | 'unknown';

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.categorizeError(error);
    
    // Log error with context
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorType,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error monitoring service (if available)
    this.reportError(error, errorInfo, errorType);
  }

  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading chunk')) {
      return 'chunk';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('component') || message.includes('render')) {
      return 'component';
    }
    
    return 'unknown';
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorType: ErrorType) {
    // In production, this would send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      console.log('Reporting error to monitoring service:', {
        errorId: this.state.errorId,
        errorType,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorId: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined,
      retryCount: 0
    });
  };

  private getErrorIcon = (errorType: ErrorType) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-8 h-8 text-error-600 dark:text-error-400" />;
      case 'chunk':
        return <RefreshCw className="w-8 h-8 text-error-600 dark:text-error-400" />;
      case 'component':
        return <Bug className="w-8 h-8 text-error-600 dark:text-error-400" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-error-600 dark:text-error-400" />;
    }
  };

  private getErrorMessage = (errorType: ErrorType) => {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'It looks like you\'re having trouble connecting to our servers. Please check your internet connection and try again.'
        };
      case 'chunk':
        return {
          title: 'Loading Error',
          description: 'There was a problem loading this part of the application. This usually fixes itself with a refresh.'
        };
      case 'component':
        return {
          title: 'Component Error',
          description: 'Something went wrong with this component. Our team has been notified and we\'re working on a fix.'
        };
      default:
        return {
          title: 'Oops! Something went wrong',
          description: 'We\'re sorry, but something unexpected happened. Don\'t worry, our team has been notified and we\'re working on it.'
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.state.error ? this.categorizeError(this.state.error) : 'unknown';
      const errorMessage = this.getErrorMessage(errorType);
      const canRetry = this.state.retryCount < this.maxRetries;

      if (this.props.level === 'component') {
        return (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {this.getErrorIcon(errorType)}
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-error-800 dark:text-error-200">
                  {errorMessage.title}
                </h3>
                <p className="mt-1 text-sm text-error-700 dark:text-error-300">
                  {errorMessage.description}
                </p>
                {canRetry && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.handleRetry}
                      leftIcon={<RefreshCw className="h-3 w-3" />}
                    >
                      Try again ({this.maxRetries - this.state.retryCount} attempts left)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-medium border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-error-50 dark:bg-error-900/20 rounded-2xl flex items-center justify-center">
              {this.getErrorIcon(errorType)}
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              {errorMessage.title}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              {errorMessage.description}
            </p>
            <div className="space-y-3">
              {canRetry && (
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  fullWidth
                >
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                fullWidth
              >
                Refresh Page
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                leftIcon={<Home className="h-4 w-4" />}
                fullWidth
              >
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                  Error Details (Development)
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-lg">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-lg">
                    <strong>Error Type:</strong> {errorType}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-lg">
                    <strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}
                  </div>
                  <pre className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-lg overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component for specific areas
export const ErrorFallback: React.FC<{ 
  error?: Error; 
  resetError?: () => void;
  level?: 'component' | 'section';
}> = ({ error, resetError, level = 'component' }) => {
  const errorType = error ? categorizeError(error) : 'unknown';
  const errorMessage = getErrorMessage(errorType);

  return (
    <div className={`bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-xl p-${level === 'section' ? '6' : '4'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon(errorType)}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-error-800 dark:text-error-200">
            {errorMessage.title}
          </h3>
          <div className="mt-2 text-sm text-error-700 dark:text-error-300">
            <p>{errorMessage.description}</p>
          </div>
          {resetError && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetError}
                leftIcon={<RefreshCw className="h-3 w-3" />}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for error categorization
const categorizeError = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();
  
  if (message.includes('chunk') || message.includes('loading chunk')) {
    return 'chunk';
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  
  if (message.includes('component') || message.includes('render')) {
    return 'component';
  }
  
  return 'unknown';
};

const getErrorMessage = (errorType: ErrorType) => {
  switch (errorType) {
    case 'network':
      return {
        title: 'Connection Problem',
        description: 'It looks like you\'re having trouble connecting to our servers. Please check your internet connection and try again.'
      };
    case 'chunk':
      return {
        title: 'Loading Error',
        description: 'There was a problem loading this part of the application. This usually fixes itself with a refresh.'
      };
    case 'component':
      return {
        title: 'Component Error',
        description: 'Something went wrong with this component. Our team has been notified and we\'re working on a fix.'
      };
    default:
      return {
        title: 'Error loading content',
        description: 'An unexpected error occurred. Please try again.'
      };
  }
};

const getErrorIcon = (errorType: ErrorType) => {
  switch (errorType) {
    case 'network':
      return <WifiOff className="h-5 w-5 text-error-600 dark:text-error-400" />;
    case 'chunk':
      return <RefreshCw className="h-5 w-5 text-error-600 dark:text-error-400" />;
    case 'component':
      return <Bug className="h-5 w-5 text-error-600 dark:text-error-400" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />;
  }
};
