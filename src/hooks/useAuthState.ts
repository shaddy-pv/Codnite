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
        user: userData ? 'exists' : 'none',
        currentUrl: window.location.href
      });

      if (token && userData) {
        try {
          // Parse stored user data first
          const parsedUser = JSON.parse(userData);
          console.log('📦 Parsed user data:', parsedUser);

          // ALWAYS set authenticated state immediately with stored data
          // This prevents the logout redirect on refresh
          updateGlobalAuthState({
            user: parsedUser,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('✅ User authenticated from localStorage, skipping backend verification for now');

          // Optional: Verify token with backend in background (but don't logout on failure)
          setTimeout(async () => {
            try {
              const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
              console.log('🔍 Background token verification to:', apiUrl);

              const response = await fetch(`${apiUrl}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(3000), // 3 second timeout
              });

              if (response.ok) {
                const freshUser = await response.json();
                console.log('🔄 Token verified, updating with fresh user data');
                updateGlobalAuthState({
                  user: freshUser,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                console.log('⚠️ Token verification failed, but keeping user logged in');
                // Don't logout on verification failure - keep using stored data
              }
            } catch (error: any) {
              console.log('⚠️ Background token verification failed, but keeping user logged in:', error.message);
              // Don't logout on network errors - keep using stored data
            }
          }, 1000); // Delay verification by 1 second

        } catch (error: any) {
          console.error('💥 Error parsing stored user data:', error);
          // Only clear if the stored data is corrupted
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
