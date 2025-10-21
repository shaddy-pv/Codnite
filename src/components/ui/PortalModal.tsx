import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  animated?: boolean;
}

export const PortalModal: React.FC<PortalModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  animated = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      
      if (animated) {
        setIsAnimating(true);
        // Trigger animation after a small delay
        setTimeout(() => setIsAnimating(false), 10);
      }
    } else {
      if (animated) {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
        }, 200);
      } else {
        setIsVisible(false);
      }
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, animated]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const backdropClasses = animated 
    ? `fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-60'}`
    : 'fixed inset-0 bg-black bg-opacity-60';

  const modalClasses = animated
    ? `relative bg-[#18181b] rounded-xl p-4 shadow-lg border border-[#ff6a00]/20 w-full transition-all duration-300 transform ${
        isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      } ${sizeClasses[size]} ${className} max-h-[90vh] overflow-hidden`
    : `relative bg-[#18181b] rounded-xl p-4 shadow-lg border border-[#ff6a00]/20 w-full ${sizeClasses[size]} ${className} max-h-[90vh] overflow-hidden`;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" role="dialog" aria-modal="true">
      <div 
        className={backdropClasses}
        onClick={handleBackdropClick}
      />
      
      <div className={modalClasses}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-700">
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PortalModal;
