import React from 'react';

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const FormCard: React.FC<FormCardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-soft',
    elevated: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-medium',
    outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-600 shadow-none'
  };

  return (
    <div className={`rounded-2xl p-8 w-full max-w-md mx-auto ${variantClasses[variant]} ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

// Export Card as alias for FormCard
export const Card = FormCard;
export default FormCard;