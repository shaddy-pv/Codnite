import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // SIMPLE LOGIN - NO COMPLEX CHECKS
  const login = async (email, password) => {
    console.log('🔐 SIMPLE LOGIN CALLED:', email);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      console.log('📡 LOGIN RESPONSE STATUS:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ LOGIN SUCCESS DATA:', data);
        
        // FORCE SET AUTH STATE
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('🎯 AUTH STATE FORCE UPDATED');
        return { success: true };
      } else {
        const error = await response.json();
        console.log('❌ LOGIN FAILED:', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.log('💥 LOGIN ERROR:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // SIMPLE LOGOUT
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // CHECK AUTH ON MOUNT ONLY
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      console.log('🔍 AUTO-LOGIN FROM LOCALSTORAGE');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout,
      isLoading: false 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
