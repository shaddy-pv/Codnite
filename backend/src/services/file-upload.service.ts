import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from '../utils/logger.js';
import config from '../config/env.js';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

class FileUploadService {
  private s3Client: S3Client | null = null;
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];

    // Initialize S3 client if AWS credentials are provided
    if (config.upload.aws.accessKeyId && config.upload.aws.secretAccessKey && config.upload.aws.region) {
      this.s3Client = new S3Client({
        region: config.upload.aws.region,
        credentials: {
          accessKeyId: config.upload.aws.accessKeyId,
          secretAccessKey: config.upload.aws.secretAccessKey,
        },
      });
    }

    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      
      // Skip write test for now to avoid permission issues in Docker
      // const testFile = path.join(this.uploadDir, '.test-write');
      // await fs.writeFile(testFile, 'test');
      // await fs.unlink(testFile);
      
      logger.info('Upload directory ensured (write test skipped)', { path: this.uploadDir });
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
      // Don't throw error, just log it
      logger.warn('Continuing without upload directory access');
    }
  }

  // Configure Multer for file uploads
  public getMulterConfig() {
    const storage = multer.memoryStorage();

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 1, // Only one file at a time
      },
      fileFilter: (_req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`));
        }
      },
    });
  }

  // Validate uploaded file
  private validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.maxFileSize) {
      return { valid: false, error: `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB` };
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: `Invalid file type. Allowed: ${this.allowedMimeTypes.join(', ')}` };
    }

    return { valid: true };
  }

  // Generate secure filename
  private generateFilename(originalName: string, userId: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    return `avatar_${userId}_${timestamp}_${randomId}${ext}`;
  }

  // Process and optimize image
  private async processImage(
    buffer: Buffer, 
    options: ImageProcessingOptions = {}
  ): Promise<Buffer> {
    const {
      width = 200,
      height = 200,
      quality = 85,
      format = 'webp',
      fit = 'cover'
    } = options;

    try {
      let processor = sharp(buffer);

      // Resize and crop to square
      processor = processor.resize(width, height, {
        fit,
        position: 'center'
      });

      // Convert to specified format with quality settings
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality, progressive: true });
          break;
        case 'png':
          processor = processor.png({ quality, progressive: true });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
      }

      // Optimize and strip metadata
      processor = processor.withMetadata({});

      return await processor.toBuffer();
    } catch (error: any) {
      logger.error('Image processing failed:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        bufferLength: buffer.length,
        options
      });
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Upload to local filesystem
  private async uploadToLocal(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      
      // Return URL path (not absolute path)
      return `/uploads/avatars/${filename}`;
    } catch (error: any) {
      logger.error('Local upload failed:', error);
      throw new Error('Failed to save file locally');
    }
  }

  // Upload to AWS S3
  private async uploadToS3(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    if (!this.s3Client || !config.upload.aws.s3Bucket) {
      throw new Error('S3 configuration missing');
    }

    try {
      const key = `avatars/${filename}`;
      
      const command = new PutObjectCommand({
        Bucket: config.upload.aws.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache
      });

      await this.s3Client.send(command);
      
      // Return S3 URL
      return `https://${config.upload.aws.s3Bucket}.s3.${config.upload.aws.region}.amazonaws.com/${key}`;
    } catch (error: any) {
      logger.error('S3 upload failed:', error);
      throw new Error('Failed to upload to S3');
    }
  }

  // Delete file from local storage
  private async deleteFromLocal(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      logger.info('Local file deleted', { filename });
    } catch (error: any) {
      logger.error('Failed to delete local file:', error);
    }
  }

  // Delete file from S3
  private async deleteFromS3(filename: string): Promise<void> {
    if (!this.s3Client || !config.upload.aws.s3Bucket) {
      return;
    }

    try {
      const key = `avatars/${filename}`;
      
      const command = new DeleteObjectCommand({
        Bucket: config.upload.aws.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info('S3 file deleted', { filename });
    } catch (error: any) {
      logger.error('Failed to delete S3 file:', error);
    }
  }

  // Main upload method
  public async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
    options: ImageProcessingOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Validation failed'
        };
      }

      // Generate secure filename
      const filename = this.generateFilename(file.originalname, userId);
      
      // Process image
      const processedBuffer = await this.processImage(file.buffer, options);
      
      // Upload to storage
      let url: string;
      if (config.nodeEnv === 'production' && this.s3Client) {
        url = await this.uploadToS3(processedBuffer, filename);
      } else {
        url = await this.uploadToLocal(processedBuffer, filename);
      }

      logger.info('Avatar uploaded successfully', {
        userId,
        filename,
        size: processedBuffer.length,
        url
      });

      return {
        success: true,
        url,
        filename,
        size: processedBuffer.length
      };

    } catch (error) {
      logger.error('Avatar upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Delete avatar
  public async deleteAvatar(avatarUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const filename = path.basename(avatarUrl);
      
      if (avatarUrl.includes('amazonaws.com')) {
        // S3 URL
        await this.deleteFromS3(filename);
      } else {
        // Local URL
        await this.deleteFromLocal(filename);
      }

      return true;
    } catch (error) {
      logger.error('Avatar deletion failed:', error);
      return false;
    }
  }

  // Get default avatar URL
  public getDefaultAvatarUrl(): string {
    return '/default-avatar.svg';
  }

  // Check if URL is a default avatar
  public isDefaultAvatar(url: string): boolean {
    return url === this.getDefaultAvatarUrl() || url.includes('default-avatar');
  }

  // Get storage info
  public getStorageInfo() {
    return {
      type: config.nodeEnv === 'production' && this.s3Client ? 's3' : 'local',
      uploadDir: this.uploadDir,
      maxFileSize: this.maxFileSize,
      allowedTypes: this.allowedMimeTypes,
      s3Configured: !!this.s3Client
    };
  }
}

// Create singleton instance
const fileUploadService = new FileUploadService();

export default fileUploadService;
