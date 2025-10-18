import React from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showWhenOnline = false, 
  className = '' 
}) => {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        title: 'You\'re offline',
        message: 'Check your internet connection and try again.',
        variant: 'error' as const
      };
    }

    if (isSlowConnection) {
      return {
        icon: AlertTriangle,
        title: 'Slow connection detected',
        message: `Your connection is ${effectiveType}. Some features may load slowly.`,
        variant: 'warning' as const
      };
    }

    return {
      icon: CheckCircle,
      title: 'Connection restored',
      message: 'You\'re back online!',
      variant: 'success' as const
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  const variantClasses = {
    error: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-700 text-error-800 dark:text-error-200',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700 text-warning-800 dark:text-warning-200',
    success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700 text-success-800 dark:text-success-200'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <div className={`
        ${variantClasses[statusInfo.variant]}
        border rounded-xl p-4 shadow-lg backdrop-blur-sm
        animate-slide-down
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">
              {statusInfo.title}
            </h3>
            <p className="text-sm opacity-90 mt-1">
              {statusInfo.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Offline Banner Component
export const OfflineBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className={`bg-error-600 text-white py-2 px-4 text-center text-sm font-medium ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not be available.</span>
      </div>
    </div>
  );
};

// Connection Quality Indicator
export const ConnectionQuality: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className={`flex items-center space-x-1 text-error-600 ${className}`}>
        <WifiOff className="h-4 w-4" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className={`flex items-center space-x-1 text-warning-600 ${className}`}>
        <Wifi className="h-4 w-4" />
        <span className="text-xs">{effectiveType?.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 text-success-600 ${className}`}>
      <Wifi className="h-4 w-4" />
      <span className="text-xs">Good</span>
    </div>
  );
};

export default NetworkStatus;
