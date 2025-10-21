import React from 'react';
interface BadgeProps {
  text?: string;
  children?: React.ReactNode;
  color?: 'blue' | 'purple' | 'cyan' | 'gray';
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}
const Badge: React.FC<BadgeProps> = ({
  text,
  children,
  color = 'blue',
  variant,
  size = 'sm',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-neutral-600 bg-opacity-20 text-neutral-300',
    purple: 'bg-neutral-600 bg-opacity-20 text-neutral-300',
    cyan: 'bg-neutral-600 bg-opacity-20 text-neutral-300',
    gray: 'bg-dark-400 bg-opacity-20 text-dark-300'
  };

  const variantClasses = {
    primary: 'bg-neutral-600 text-white',
    secondary: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
    outline: 'border border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5'
  };
  return <span className={`
        inline-flex items-center rounded-full font-medium
        ${variant ? variantClasses[variant] : colorClasses[color]}
        ${sizeClasses[size]}
        ${className}
      `}>
      {children || (text ? (text.startsWith('#') ? text : `#${text}`) : '')}
    </span>;
};
export { Badge };
export default Badge;