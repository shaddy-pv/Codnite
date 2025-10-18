import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-success-600 dark:text-success-400`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-error-600 dark:text-error-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-warning-600 dark:text-warning-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-primary-600 dark:text-primary-400`} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': 
        return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700';
      case 'error': 
        return 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-700';
      case 'warning': 
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700';
      case 'info': 
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': 
        return 'text-success-800 dark:text-success-200';
      case 'error': 
        return 'text-error-800 dark:text-error-200';
      case 'warning': 
        return 'text-warning-800 dark:text-warning-200';
      case 'info': 
        return 'text-primary-800 dark:text-primary-200';
    }
  };

  return (
    <div 
      className={`
        max-w-sm w-full ${getBackgroundColor()} border rounded-xl shadow-medium pointer-events-auto
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-semibold ${getTextColor()}`}>
              {title}
            </p>
            {message && (
              <p className={`mt-1 text-sm ${getTextColor()} opacity-80`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={`inline-flex ${getTextColor()} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-lg p-1 transition-opacity duration-200`}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-current opacity-20 rounded-b-xl overflow-hidden">
        <div 
          className="h-full bg-current transition-all ease-linear"
          style={{
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Toast Container
export const ToastContainer: React.FC<{ toasts: ToastProps[]; onClose: (id: string) => void }> = ({ 
  toasts, 
  onClose 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Enhanced Toast Hook with better error handling
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string) => 
    addToast({ type: 'success', title, message });
  
  const error = (title: string, message?: string) => 
    addToast({ type: 'error', title, message });
  
  const warning = (title: string, message?: string) => 
    addToast({ type: 'warning', title, message });
  
  const info = (title: string, message?: string) => 
    addToast({ type: 'info', title, message });

  // Enhanced error handling for API responses
  const handleApiError = (error: any, defaultTitle: string = 'Error') => {
    let title = defaultTitle;
    let message = '';

    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle different error response formats
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData.error) {
        message = errorData.error;
      } else if (errorData.message) {
        message = errorData.message;
      } else if (errorData.details) {
        message = errorData.details;
      } else if (Array.isArray(errorData.errors)) {
        message = errorData.errors.join(', ');
      }
      
      // Set specific titles based on error type
      if (error.response.status === 400) {
        title = 'Validation Error';
      } else if (error.response.status === 401) {
        title = 'Authentication Error';
      } else if (error.response.status === 403) {
        title = 'Access Denied';
      } else if (error.response.status === 404) {
        title = 'Not Found';
      } else if (error.response.status === 409) {
        title = 'Conflict';
      } else if (error.response.status >= 500) {
        title = 'Server Error';
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred';
    }

    addToast({ type: 'error', title, message });
  };

  // Handle validation errors specifically
  const handleValidationError = (errors: Record<string, string[]>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    addToast({ 
      type: 'error', 
      title: 'Validation Error', 
      message: errorMessages 
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    handleApiError,
    handleValidationError
  };
};
