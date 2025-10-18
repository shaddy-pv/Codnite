import React, { useState, useRef, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/usePerformance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallback?: string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  fallback = '/default-avatar.svg',
  quality = 80,
  format = 'webp',
  lazy = true,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection observer for lazy loading
  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Update visibility when intersection changes
  React.useEffect(() => {
    if (lazy && isIntersecting) {
      setIsInView(true);
    }
  }, [lazy, isIntersecting]);

  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc || originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return originalSrc;
    }

    // For external images, you might want to use an image optimization service
    // like Cloudinary, ImageKit, or Next.js Image Optimization
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    if (format) params.set('f', format);

    // Example with a hypothetical image optimization service
    // return `https://images.example.com/${encodeURIComponent(originalSrc)}?${params.toString()}`;
    
    return originalSrc; // Return original for now
  }, [width, height, quality, format]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const imageSrc = isInView ? getOptimizedSrc(src) : '';
  const displaySrc = hasError ? fallback : imageSrc;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          {placeholder ? (
            <img 
              src={placeholder} 
              alt="" 
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded" />
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
          style={{ width, height }}
        >
          <img 
            src={fallback} 
            alt={alt}
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      )}
    </div>
  );
};

// Avatar component with optimization
interface OptimizedAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  fallback = '/default-avatar.svg',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <OptimizedImage
        src={src || ''}
        alt={`${name}'s avatar`}
        width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 80}
        height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 80}
        className="rounded-full object-cover"
        fallback={fallback}
        lazy={true}
        quality={90}
        format="webp"
      />
      
      {/* Fallback initials */}
      {!src && (
        <div className="absolute inset-0 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
          {initials}
        </div>
      )}
    </div>
  );
};

// Background image component with optimization
interface OptimizedBackgroundImageProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  fallback?: string;
}

export const OptimizedBackgroundImage: React.FC<OptimizedBackgroundImageProps> = ({
  src,
  alt,
  className = '',
  children,
  fallback = '/default-college-logo.svg',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const backgroundImage = hasError ? fallback : src;

  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Hidden image for loading detection */}
      <img
        src={src}
        alt={alt}
        className="hidden"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading overlay */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default OptimizedImage;
