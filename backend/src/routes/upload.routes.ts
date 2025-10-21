import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../utils/database';
import logger from '../utils/logger';
import fileUploadService from '../services/file-upload.service';
import fs from 'fs';
import path from 'path';

const router = Router();

// Upload avatar
router.post('/avatar', authenticate, fileUploadService.getMulterConfig().single('avatar'), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    // Upload and process the image
    const result = await fileUploadService.uploadAvatar(file, userId, {
      width: 200,
      height: 200,
      quality: 85,
      format: 'webp',
      fit: 'cover'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Update user's avatar URL in database
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [result.url, userId]
    );

    logger.info('User avatar updated', { userId, avatarUrl: result.url });

    res.json({
      success: true,
      avatarUrl: result.url,
      filename: result.filename,
      size: result.size
    });

  } catch (error) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

// Upload cover photo
router.post('/cover-photo', authenticate, fileUploadService.getMulterConfig().single('coverPhoto'), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    // Upload and process the image
    const result = await fileUploadService.uploadAvatar(file, userId, {
      width: 1200,
      height: 300,
      quality: 85,
      format: 'webp',
      fit: 'cover',
      prefix: 'cover'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Update user's cover photo URL in database
    await query(
      'UPDATE users SET cover_photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [result.url, userId]
    );

    logger.info('User cover photo updated', { userId, coverPhotoUrl: result.url });

    res.json({
      success: true,
      coverPhotoUrl: result.url,
      filename: result.filename,
      size: result.size
    });

  } catch (error) {
    logger.error('Cover photo upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload cover photo'
    });
  }
});

// Upload general image (for posts, etc.)
router.post('/image', authenticate, fileUploadService.getMulterConfig().single('file'), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    // Upload and process the image
    const result = await fileUploadService.uploadAvatar(file, userId, {
      width: 800,
      height: 600,
      quality: 85,
      format: 'webp',
      fit: 'inside'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    logger.info('Image uploaded', { userId, imageUrl: result.url });

    res.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType
    });

  } catch (error) {
    logger.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// Delete avatar
router.delete('/avatar', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get current avatar URL
    const userResult = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentAvatarUrl = userResult.rows[0].avatar_url;

    // Don't delete default avatars
    if (fileUploadService.isDefaultAvatar(currentAvatarUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default avatar'
      });
    }

    // Delete the file
    const deleted = await fileUploadService.deleteAvatar(currentAvatarUrl);
    
    if (!deleted) {
      logger.warn('Failed to delete avatar file, but continuing with database update', { userId });
    }

    // Reset to default avatar
    const defaultAvatarUrl = fileUploadService.getDefaultAvatarUrl();
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [defaultAvatarUrl, userId]
    );

    logger.info('User avatar deleted and reset to default', { userId });

    res.json({
      success: true,
      avatarUrl: defaultAvatarUrl,
      message: 'Avatar deleted successfully'
    });

  } catch (error) {
    logger.error('Avatar deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar'
    });
  }
});

// Get upload configuration
router.get('/config', authenticate, async (req: any, res) => {
  try {
    const storageInfo = fileUploadService.getStorageInfo();
    
    res.json({
      success: true,
      config: {
        maxFileSize: storageInfo.maxFileSize,
        allowedTypes: storageInfo.allowedTypes,
        maxFileSizeMB: Math.round(storageInfo.maxFileSize / 1024 / 1024),
        storageType: storageInfo.type,
        s3Configured: storageInfo.s3Configured
      }
    });
  } catch (error) {
    logger.error('Upload config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload configuration'
    });
  }
});

// Get user's current avatar info
router.get('/avatar', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const avatarUrl = userResult.rows[0].avatar_url;
    const isDefault = fileUploadService.isDefaultAvatar(avatarUrl);

    res.json({
      success: true,
      avatarUrl,
      isDefault,
      canDelete: !isDefault
    });

  } catch (error) {
    logger.error('Get avatar info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get avatar information'
    });
  }
});

// Bulk upload (for admin use)
router.post('/bulk', authenticate, fileUploadService.getMulterConfig().array('files', 10), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const results = [];
    
    for (const file of files) {
      const result = await fileUploadService.uploadAvatar(file, userId);
      results.push({
        originalName: file.originalname,
        ...result
      });
    }

    res.json({
      success: true,
      results,
      uploaded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    logger.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk upload'
    });
  }
});

// Health check for upload service
router.get('/health', async (req, res) => {
  try {
    const storageInfo = fileUploadService.getStorageInfo();
    
    // Test local directory access
    if (storageInfo.type === 'local') {
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      
      try {
        // Check if directory exists and is writable
        fs.accessSync(uploadDir, fs.constants.W_OK);
        
        // Test write access
        const testFile = path.join(uploadDir, '.health-check');
        fs.writeFileSync(testFile, 'health-check');
        fs.unlinkSync(testFile);
        
      } catch (error: any) {
        return res.status(503).json({
          success: false,
          error: 'Upload directory not writable',
          details: error.message,
          storage: storageInfo
        });
      }
    }

    res.json({
      success: true,
      status: 'healthy',
      storage: storageInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Upload health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Upload service unhealthy',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
