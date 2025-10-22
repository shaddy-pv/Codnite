import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/FormCard';
import { useToast } from '../components/ui/Toast';
import { useFormValidation, FormField, validationRules } from '../hooks/useFormValidation';
import { authAPI } from '../services/api';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const { success, handleApiError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    fields,
    isValid,
    updateField,
    validateAllFields,
    getFieldError,
    resetForm
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: validationRules.email,
      password: { required: true }
    }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Login form submitted');
    console.log('📝 Form fields:', { email: fields.email.value, password: fields.password.value ? '***' : 'empty' });
    
    // Skip validation for now to test
    console.log('⏭️ Skipping validation for testing...');
    setIsLoading(true);

    try {
      console.log('Making API call to login endpoint...');
      const data = await authAPI.login({
        email: fields.email.value,
        password: fields.password.value
      });

      console.log('Login API response received:', data);
      
      if (data.token && data.user) {
        console.log('✅ Valid response, storing token and calling onLogin...');
        console.log('💾 Storing token:', data.token.substring(0, 30) + '...');
        console.log('👤 Storing user:', data.user.name, data.user.email);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('🎉 Calling onLogin callback...');
        success('Welcome back!', 'You have been successfully logged in.');
        onLogin(data.user, data.token);
        
        console.log('✅ onLogin called successfully');
        console.log('🎯 App should now redirect to main dashboard');
      } else {
        console.error('❌ Invalid response structure:', data);
        console.error('🔍 Expected: { token: string, user: object }');
        console.error('🔍 Received:', Object.keys(data));
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response,
        status: error.status,
        stack: error.stack
      });
      handleApiError(error, 'Login Failed');
    } finally {
      console.log('Login process completed, setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ember-bg-primary p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-ember-text-primary mb-2">Welcome Back</h1>
          <p className="text-ember-text-secondary">Sign in to your Codnite account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <FormField
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={fields.email.value}
            error={getFieldError('email')}
            onChange={(value) => updateField('email', value)}
            required
            icon={<Mail className="h-5 w-5 text-ember-text-muted" />}
          />

          <FormField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={fields.password.value}
            error={getFieldError('password')}
            onChange={(value) => updateField('password', value)}
            required
            icon={<Lock className="h-5 w-5 text-ember-text-muted" />}
          />

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            isLoading={isLoading}
            fullWidth
            className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-ember-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
