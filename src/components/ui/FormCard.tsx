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
    default: 'bg-ember-bg-secondary border border-ember-border shadow-soft',
    elevated: 'bg-ember-bg-secondary border border-ember-border shadow-medium',
    outlined: 'bg-transparent border-2 border-ember-border shadow-none'
  };

  return (
    <div className={`rounded-2xl p-8 w-full max-w-md mx-auto ${variantClasses[variant]} ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-2xl font-bold text-ember-text-primary mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-ember-text-secondary text-sm leading-relaxed">
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