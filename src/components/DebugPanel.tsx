import React, { useState } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { api } from '../services/api';

const DebugPanel: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthState();
  const [testResult, setTestResult] = useState<string>('');

  const testAPI = async () => {
    try {
      setTestResult('Testing API...');
      const response = await api.getMe();
      setTestResult(`✅ API Test Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ API Test Failed: ${error.message}`);
    }
  };

  const testDeleteAPI = async () => {
    try {
      setTestResult('Testing Delete API (will fail - no post ID)...');
      await api.deletePost('test-id');
      setTestResult('✅ Delete API called (unexpected success)');
    } catch (error: any) {
      setTestResult(`❌ Delete API Test: ${error.message} (Expected failure)`);
    }
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setTestResult(`📦 LocalStorage:\nToken: ${token ? 'exists' : 'none'}\nUser: ${userData || 'none'}`);
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="text-lg font-bold mb-2">🐛 Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Auth State:</strong>
          <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>User ID: {user?.id || 'None'}</div>
          <div>User Name: {user?.name || 'None'}</div>
        </div>
        
        <div className="space-x-2">
          <button 
            onClick={testAPI}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Test API
          </button>
          <button 
            onClick={testDeleteAPI}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            Test Delete
          </button>
          <button 
            onClick={checkLocalStorage}
            className="px-2 py-1 bg-green-500 text-white rounded text-xs"
          >
            Check Storage
          </button>
        </div>
        
        {testResult && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs whitespace-pre-wrap">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;