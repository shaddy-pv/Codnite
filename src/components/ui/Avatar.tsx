import React from 'react';
interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'away' | 'offline';
}
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  status
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };
  return <div className="relative">
      <img src={src} alt={alt} className={`${sizeClasses[size]} rounded-full object-cover border-2 border-dark-600`} />
      {status && <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-dark-700 ${statusColors[status]}`}></span>}
    </div>;
};
export default Avatar;