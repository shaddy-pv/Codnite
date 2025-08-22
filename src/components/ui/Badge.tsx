import React from 'react';
interface BadgeProps {
  text: string;
  color?: 'blue' | 'purple' | 'cyan' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}
const Badge: React.FC<BadgeProps> = ({
  text,
  color = 'blue',
  size = 'sm',
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-primary-blue bg-opacity-20 text-primary-blue',
    purple: 'bg-primary-purple bg-opacity-20 text-primary-purple',
    cyan: 'bg-primary-cyan bg-opacity-20 text-primary-cyan',
    gray: 'bg-dark-400 bg-opacity-20 text-dark-300'
  };
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5'
  };
  return <span className={`
        inline-flex items-center rounded-full font-medium
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${className}
      `}>
      {text.startsWith('#') ? text : `#${text}`}
    </span>;
};
export default Badge;