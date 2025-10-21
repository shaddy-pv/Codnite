import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Global auth state that persists across HMR reloads
let globalAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Listeners for auth state changes
const authListeners = new Set<(state: AuthState) => void>();

// Notify all listeners of auth state changes
const notifyAuthListeners = () => {
  authListeners.forEach(listener => listener(globalAuthState));
};

// Update global auth state and notify listeners
const updateGlobalAuthState = (updates: Partial<AuthState>) => {
  globalAuthState = { ...globalAuthState, ...updates };
  notifyAuthListeners();
};

// Custom hook for authentication state that persists across HMR
export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>(globalAuthState);

  // Subscribe to global auth state changes
  useEffect(() => {
    const listener = (state: AuthState) => {
      setAuthState(state);
    };
    
    authListeners.add(listener);
    
    // Set initial state
    setAuthState(globalAuthState);
    
    return () => {
      authListeners.delete(listener);
    };
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔄 Initializing auth state from localStorage:', {
        token: token ? 'exists' : 'none',
        user: userData ? 'exists' : 'none'
      });
      
      if (token && userData) {
        try {
          // Verify token with backend
          const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            console.log('✅ Token verified, user authenticated');
            updateGlobalAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.log('❌ Token invalid, clearing auth state');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateGlobalAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('💥 Auth verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          updateGlobalAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        console.log('🚫 No stored auth data, user not authenticated');
        updateGlobalAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    // Only initialize if we haven't already
    if (globalAuthState.isLoading) {
      initializeAuth();
    }
  }, []);

  const login = useCallback((userData: any, token: string) => {
    console.log('🚀 Global login called:', { 
      user: userData?.name, 
      token: token ? 'exists' : 'none' 
    });
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update global state
    updateGlobalAuthState({
      user: userData,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Global logout called');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update global state
    updateGlobalAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
};
