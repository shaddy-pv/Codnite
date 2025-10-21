import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SimpleLogin from './components/SimpleLogin';
import { ThemeProvider } from './context/ThemeContext';

// Simple Home component for authenticated users
const SimpleHome: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              🎉 Authentication Success!
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Welcome back, {user?.name}!
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Authentication Working
            </h2>
            <p className="text-green-700 dark:text-green-300">
              The authentication system is now working correctly. You are successfully logged in.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📊 User Information
            </h2>
            <div className="text-blue-700 dark:text-blue-300">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Points:</strong> {user?.points}</p>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App component
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🏠 APP RENDER:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl h-16 w-16 flex items-center justify-center shadow-lg mx-auto mb-4 animate-bounce">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route path="/*" element={<SimpleHome />} />
        ) : (
          <Route path="/*" element={<SimpleLogin />} />
        )}
      </Routes>
    </Router>
  );
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
