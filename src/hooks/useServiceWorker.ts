import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export const useServiceWorker = (): ServiceWorkerState => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    error: null,
  });

  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                console.log('New content is available. Please refresh.');
                // You could show a notification to the user here
              }
            });
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Registration failed',
        }));
      }
    };

    registerServiceWorker();

    // Handle online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isSupported]);

  return state;
};

// Hook for managing offline actions
export const useOfflineActions = () => {
  const [offlineActions, setOfflineActions] = useState<any[]>([]);

  const addOfflineAction = (action: any) => {
    const actionWithId = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setOfflineActions(prev => [...prev, actionWithId]);
    
    // Store in localStorage as fallback
    try {
      const stored = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      stored.push(actionWithId);
      localStorage.setItem('offlineActions', JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store offline action:', error);
    }
  };

  const removeOfflineAction = (actionId: string) => {
    setOfflineActions(prev => prev.filter(action => action.id !== actionId));
    
    // Update localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      const updated = stored.filter((action: any) => action.id !== actionId);
      localStorage.setItem('offlineActions', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove offline action:', error);
    }
  };

  const clearOfflineActions = () => {
    setOfflineActions([]);
    localStorage.removeItem('offlineActions');
  };

  // Load offline actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      setOfflineActions(stored);
    } catch (error) {
      console.error('Failed to load offline actions:', error);
    }
  }, []);

  return {
    offlineActions,
    addOfflineAction,
    removeOfflineAction,
    clearOfflineActions,
  };
};

// Hook for cache management
export const useCacheManagement = () => {
  const [cacheSize, setCacheSize] = useState<number>(0);

  const getCacheSize = async () => {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      setCacheSize(totalSize);
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  };

  const clearCache = async () => {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      setCacheSize(0);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const clearOldCache = async () => {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('codnite') && 
        !name.includes('v1') // Keep current version
      );

      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );

      console.log('Old caches cleared successfully');
      await getCacheSize(); // Update cache size
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  };

  useEffect(() => {
    getCacheSize();
  }, []);

  return {
    cacheSize,
    getCacheSize,
    clearCache,
    clearOldCache,
  };
};

export default useServiceWorker;
