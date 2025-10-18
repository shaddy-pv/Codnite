import React from 'react';
import { Spinner } from './Loading';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  loadingText?: string;
  tooltip?: string;
  animated?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  loadingText,
  tooltip,
  animated = true
}) => {
  const baseClasses = 'font-medium rounded-xl inline-flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden group transform';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 shadow-sm hover:shadow-lg active:shadow-md',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white focus:ring-secondary-500 shadow-sm hover:shadow-lg active:shadow-md',
    outline: 'border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-700 focus:ring-primary-500 bg-transparent hover:border-primary-500',
    ghost: 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 focus:ring-primary-500 bg-transparent',
    danger: 'bg-error-600 hover:bg-error-700 active:bg-error-800 text-white focus:ring-error-500 shadow-sm hover:shadow-lg active:shadow-md',
    success: 'bg-success-600 hover:bg-success-700 active:bg-success-800 text-white focus:ring-success-500 shadow-sm hover:shadow-lg active:shadow-md',
    gradient: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 text-white focus:ring-primary-500 shadow-sm hover:shadow-lg active:shadow-md'
  };
  
  const sizeClasses = {
    xs: 'text-xs py-1.5 px-2.5 min-h-[28px]',
    sm: 'text-sm py-2 px-3 min-h-[32px]',
    md: 'text-sm py-2.5 px-4 min-h-[40px]',
    lg: 'text-base py-3 px-6 min-h-[48px]',
    xl: 'text-lg py-4 px-8 min-h-[56px]'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const animationClass = animated ? 'hover:scale-105 active:scale-95' : '';
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || isLoading} 
      title={tooltip}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${animationClass}
        ${className}
      `}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
          <Spinner size="sm" className="mr-2" />
          {loadingText && <span className="text-sm font-medium">{loadingText}</span>}
        </div>
      )}
      
      {/* Button content */}
      <div className={`flex items-center transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {leftIcon && <span className="mr-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {rightIcon && <span className="ml-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{rightIcon}</span>}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none rounded-xl" />
      
      {/* Ripple effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150" />
      </div>
    </button>
  );
};

export default Button;
export { Button };