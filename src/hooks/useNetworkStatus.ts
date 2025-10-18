import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: undefined,
    effectiveType: undefined
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      
      // Check for slow connection
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
      
      let isSlowConnection = false;
      let connectionType = undefined;
      let effectiveType = undefined;

      if (connection) {
        connectionType = connection.type;
        effectiveType = connection.effectiveType;
        
        // Consider 2g and slow-2g as slow connections
        isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g';
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        effectiveType
      });
    };

    // Initial check
    updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};

// Hook for handling API errors with retry logic
export const useApiErrorHandler = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  const handleApiError = async (
    error: any,
    retryFn: () => Promise<any>,
    onMaxRetriesReached?: () => void
  ) => {
    console.error('API Error:', error);

    if (retryCount >= maxRetries) {
      onMaxRetriesReached?.();
      return;
    }

    setIsRetrying(true);
    
    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    
    setTimeout(async () => {
      try {
        await retryFn();
        setRetryCount(0);
        setIsRetrying(false);
      } catch (retryError) {
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
        handleApiError(retryError, retryFn, onMaxRetriesReached);
      }
    }, delay);
  };

  const resetRetryCount = () => {
    setRetryCount(0);
    setIsRetrying(false);
  };

  return {
    retryCount,
    isRetrying,
    maxRetries,
    handleApiError,
    resetRetryCount
  };
};
