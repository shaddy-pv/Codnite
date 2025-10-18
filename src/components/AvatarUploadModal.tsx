import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Trash2, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import Button from './ui/Button';
import Loading from './ui/Loading';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  maxFileSizeMB: number;
  storageType: string;
  s3Configured: boolean;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  // Load upload configuration
  React.useEffect(() => {
    if (isOpen) {
      loadUploadConfig();
    }
  }, [isOpen]);

  const loadUploadConfig = async () => {
    try {
      const config = await api.getUploadConfig();
      setUploadConfig(config.config);
    } catch (error) {
      console.error('Failed to load upload config:', error);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    
    if (!uploadConfig) {
      setError('Upload configuration not loaded');
      return;
    }

    // Validate file type
    if (!uploadConfig.allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed types: ${uploadConfig.allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > uploadConfig.maxFileSize) {
      setError(`File too large. Maximum size: ${uploadConfig.maxFileSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [uploadConfig]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.uploadAvatar(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        success('Avatar uploaded successfully!');
        onAvatarUpdate(response.avatarUrl);
        
        // Reset state
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
      showError('Failed to upload avatar');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl || currentAvatarUrl.includes('default-avatar')) {
      return;
    }

    try {
      const response = await api.deleteAvatar();
      
      if (response.success) {
        success('Avatar deleted successfully!');
        onAvatarUpdate(response.avatarUrl);
        onClose();
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      showError('Failed to delete avatar');
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Update Avatar
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Current Avatar */}
          {currentAvatarUrl && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Avatar
              </h3>
              <div className="flex items-center space-x-4">
                <img
                  src={currentAvatarUrl}
                  alt="Current avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                {!currentAvatarUrl.includes('default-avatar') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload New Avatar
            </h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gray-200 dark:border-gray-600"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetSelection}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? (
                        <>
                          <Loading size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop an image here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      browse files
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {uploadConfig && (
                      <>
                        Max size: {uploadConfig.maxFileSizeMB}MB • 
                        Supported: {uploadConfig.allowedTypes.map(t => t.split('/')[1]).join(', ')}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Config Info */}
          {uploadConfig && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Storage: {uploadConfig.storageType}</p>
              <p>S3 Configured: {uploadConfig.s3Configured ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;
