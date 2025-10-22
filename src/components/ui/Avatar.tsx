import React, { useState, memo } from 'react';
import { Camera, User } from 'lucide-react';
import AvatarUploadModal from '../AvatarUploadModal';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  editable?: boolean;
  onAvatarChange?: (newAvatarUrl: string) => void;
  className?: string;
}

const AvatarComponent: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  status,
  editable = false,
  onAvatarChange,
  className = ''
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(src);
  const [imageError, setImageError] = useState(false);

  // Reset image error when src changes
  React.useEffect(() => {
    setCurrentAvatarUrl(src);
    setImageError(false);
  }, [src]);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setCurrentAvatarUrl(newAvatarUrl);
    onAvatarChange?.(newAvatarUrl);
  };

  // Debug logging for avatar issues
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Avatar component debug:', {
        src,
        currentAvatarUrl,
        imageError,
        alt,
        size
      });
    }
  }, [src, currentAvatarUrl, imageError, alt, size]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUploadModalOpen(true);
  };

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
          {currentAvatarUrl && !imageError && currentAvatarUrl !== '/default-avatar.svg' && currentAvatarUrl !== 'null' && currentAvatarUrl !== 'undefined' ? (
            <img
              src={currentAvatarUrl}
              alt={alt}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                console.log('Avatar image failed to load:', {
                  url: currentAvatarUrl,
                  error: e,
                  alt
                });
                setImageError(true);
              }}
              onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Avatar image loaded successfully:', currentAvatarUrl);
                }
              }}
            />
          ) : (
            <User className={`${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} text-ember-text-muted`} />
          )}
        </div>

        {/* Status indicator */}
        {status && (
          <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-white dark:border-gray-800`} />
        )}

        {/* Edit button */}
        {editable && (
          <button
            onClick={handleEditClick}
            className="avatar-edit-button absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 group"
            title="Change avatar"
          >
            <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {editable && (
        <AvatarUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          currentAvatarUrl={currentAvatarUrl}
          onAvatarUpdate={handleAvatarChange}
        />
      )}
    </>
  );
};

const areEqual = (prev: AvatarProps, next: AvatarProps) => (
  prev.src === next.src &&
  prev.alt === next.alt &&
  prev.size === next.size &&
  prev.status === next.status &&
  prev.editable === next.editable &&
  prev.className === next.className
);

const Avatar = memo(AvatarComponent, areEqual);

export default Avatar;