import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

interface UseAsyncOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export const useAsync = <T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) => {
  const { immediate = true, retryCount = 3, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: immediate,
    error: null,
    data: null
  });

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const execute = useCallback(async (...args: any[]) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await asyncFunction(...args);
      
      setState({
        isLoading: false,
        error: null,
        data: result
      });
      
      retryCountRef.current = 0;
      return result;
    } catch (error) {
      const err = error as Error;
      
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        
        timeoutRef.current = setTimeout(() => {
          execute(...args);
        }, retryDelay * Math.pow(2, retryCountRef.current - 1)); // Exponential backoff
        
        return;
      }
      
      setState({
        isLoading: false,
        error: err,
        data: null
      });
      
      retryCountRef.current = 0;
      throw err;
    }
  }, [asyncFunction, retryCount, retryDelay]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null
    });
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Hook for managing multiple loading states
export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    clearAllLoading
  };
};

// Hook for form loading states
export const useFormLoading = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const stopSubmitting = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  const startValidating = useCallback(() => {
    setIsValidating(true);
  }, []);

  const stopValidating = useCallback(() => {
    setIsValidating(false);
  }, []);

  return {
    isSubmitting,
    isValidating,
    startSubmitting,
    stopSubmitting,
    startValidating,
    stopValidating
  };
};

// Hook for file upload progress
export const useUploadProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);

  const startUpload = useCallback(() => {
    setIsUploading(true);
    setProgress(0);
    setUploadError(null);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const completeUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(100);
    setTimeout(() => {
      setProgress(0);
    }, 1000);
  }, []);

  const failUpload = useCallback((error: Error) => {
    setIsUploading(false);
    setUploadError(error);
    setProgress(0);
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setUploadError(null);
  }, []);

  return {
    progress,
    isUploading,
    uploadError,
    startUpload,
    updateProgress,
    completeUpload,
    failUpload,
    resetUpload
  };
};
