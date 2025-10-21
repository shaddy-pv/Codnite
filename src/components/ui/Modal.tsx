import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
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

export const Modal: React.FC<ModalProps> = ({
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
    ? `fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-50'}`
    : 'fixed inset-0 bg-black bg-opacity-50';

  const modalClasses = animated
    ? `fixed left-1/2 top-[10vh] -translate-x-1/2 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full transition-all duration-300 transform ${
        isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      } ${sizeClasses[size]} ${className} max-h-[80vh] overflow-hidden`
    : `fixed left-1/2 top-[10vh] -translate-x-1/2 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full ${sizeClasses[size]} ${className} max-h-[80vh] overflow-hidden`;

  return (
    <div className="fixed inset-0 z-40">
      <div className="min-h-screen p-4">
        {/* Backdrop */}
        <div 
          className={backdropClasses}
          onClick={handleBackdropClick}
        />
        
        {/* Modal */}
        <div className={modalClasses}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  animated?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
  animated = true
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-success-500" />;
      default:
        return <Info className="w-6 h-6 text-primary-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size="sm"
      animated={animated}
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Loading Modal
interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  animated?: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  title = 'Loading...',
  message = 'Please wait while we process your request.',
  animated = true
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      title={title} 
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      animated={animated}
    >
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default Modal;
