import React, { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  success?: boolean;
  animated?: boolean;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  success = false,
  animated = true,
  showPasswordToggle = false,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const baseClasses = 'w-full px-3 py-2.5 border rounded-xl focus:outline-none transition-all duration-300 text-sm placeholder:text-neutral-400 relative';
  
  const variantClasses = {
    default: 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
    filled: 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
    outlined: 'border-2 border-neutral-300 dark:border-neutral-600 bg-transparent text-neutral-900 dark:text-neutral-100'
  };

  const stateClasses = error 
    ? 'border-error-500 focus:ring-error-500 focus:border-error-500 shadow-error-100 dark:shadow-error-900' 
    : success 
    ? 'border-success-500 focus:ring-success-500 focus:border-success-500 shadow-success-100 dark:shadow-success-900'
    : isFocused
    ? 'border-primary-500 focus:ring-primary-500 focus:border-primary-500 shadow-primary-100 dark:shadow-primary-900'
    : 'focus:ring-primary-500 focus:border-primary-500';

  const iconClasses = leftIcon ? 'pl-10' : rightIcon || showPasswordToggle ? 'pr-10' : '';
  const animationClass = animated ? 'transform transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02]' : '';

  const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className={`block text-sm font-medium transition-colors duration-200 ${
          isFocused ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'
        }`}>
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
            <div className={`text-neutral-400 ${
              error ? 'text-error-500' : 
              success ? 'text-success-500' : 
              isFocused ? 'text-primary-500' : ''
            }`}>
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${stateClasses}
            ${iconClasses}
            ${animationClass}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
          {/* Password toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200 p-1"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          
          {/* Custom right icon */}
          {rightIcon && !showPasswordToggle && (
            <div className={`text-neutral-400 transition-colors duration-200 ${
              error ? 'text-error-500' : 
              success ? 'text-success-500' : 
              isFocused ? 'text-primary-500' : ''
            }`}>
              {rightIcon}
            </div>
          )}
          
          {/* Status icons */}
          {error && (
            <AlertCircle className="h-4 w-4 text-error-500" />
          )}
          {success && !error && (
            <CheckCircle className="h-4 w-4 text-success-500" />
          )}
        </div>
        
        {/* Focus ring */}
        {isFocused && animated && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-20 pointer-events-none animate-pulse" />
        )}
      </div>
      
      {/* Helper text and error messages */}
      <div className="min-h-[20px]">
        {error && (
          <p className="text-sm text-error-600 dark:text-error-400 flex items-center animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-in slide-in-from-top-1 duration-200">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

// Enhanced Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  success?: boolean;
  animated?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  minRows?: number;
  maxRows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  success = false,
  animated = true,
  resize = 'vertical',
  minRows = 3,
  maxRows = 10,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const baseClasses = 'w-full px-3 py-2.5 border rounded-xl focus:outline-none transition-all duration-300 text-sm placeholder:text-neutral-400';
  
  const variantClasses = {
    default: 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
    filled: 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
    outlined: 'border-2 border-neutral-300 dark:border-neutral-600 bg-transparent text-neutral-900 dark:text-neutral-100'
  };

  const stateClasses = error 
    ? 'border-error-500 focus:ring-error-500 focus:border-error-500 shadow-error-100 dark:shadow-error-900' 
    : success 
    ? 'border-success-500 focus:ring-success-500 focus:border-success-500 shadow-success-100 dark:shadow-success-900'
    : isFocused
    ? 'border-primary-500 focus:ring-primary-500 focus:border-primary-500 shadow-primary-100 dark:shadow-primary-900'
    : 'focus:ring-primary-500 focus:border-primary-500';

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const animationClass = animated ? 'transform transition-transform duration-200 hover:scale-[1.01] focus:scale-[1.01]' : '';

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className={`block text-sm font-medium transition-colors duration-200 ${
          isFocused ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'
        }`}>
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <textarea
          ref={ref}
          rows={minRows}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${stateClasses}
            ${resizeClasses[resize]}
            ${animationClass}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {/* Focus ring */}
        {isFocused && animated && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-20 pointer-events-none animate-pulse" />
        )}
      </div>
      
      {/* Helper text and error messages */}
      <div className="min-h-[20px]">
        {error && (
          <p className="text-sm text-error-600 dark:text-error-400 flex items-center animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-in slide-in-from-top-1 duration-200">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';