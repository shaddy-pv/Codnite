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
    
    if (!validateAllFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await authAPI.login({
        email: fields.email.value,
        password: fields.password.value
      });

      localStorage.setItem('token', data.token);
      success('Welcome back!', 'You have been successfully logged in.');
      onLogin(data.user, data.token);
    } catch (error: any) {
      handleApiError(error, 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-700 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-dark-100 mb-2">Welcome Back</h1>
          <p className="text-dark-300">Sign in to your Codnite account</p>
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
            icon={<Mail className="h-5 w-5 text-dark-400" />}
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
            icon={<Lock className="h-5 w-5 text-dark-400" />}
          />

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            isLoading={isLoading}
            fullWidth
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-dark-300">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:text-blue-300 font-medium"
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
