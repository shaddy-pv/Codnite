import AWS from 'aws-sdk';
import config from '../config/env';

interface CDNConfig {
  provider: 'aws' | 'cloudinary' | 'local';
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

class CDNService {
  private config: CDNConfig;
  private s3?: AWS.S3;
  private cloudinary?: any;

  constructor() {
    this.config = {
      provider: config.cdn?.provider || 'local',
      aws: config.cdn?.aws,
      cloudinary: config.cdn?.cloudinary
    };

    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (this.config.provider === 'aws' && this.config.aws) {
      AWS.config.update({
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
        region: this.config.aws.region
      });
      this.s3 = new AWS.S3();
    }

    if (this.config.provider === 'cloudinary' && this.config.cloudinary) {
      // Cloudinary would be initialized here
      // const cloudinary = require('cloudinary').v2;
      // cloudinary.config({
      //   cloud_name: this.config.cloudinary.cloudName,
      //   api_key: this.config.cloudinary.apiKey,
      //   api_secret: this.config.cloudinary.apiSecret
      // });
      // this.cloudinary = cloudinary;
    }
  }

  // Upload file to CDN
  async uploadFile(
    file: Buffer | string,
    fileName: string,
    folder: string = 'uploads',
    options: any = {}
  ): Promise<{ url: string; publicId?: string }> {
    const { optimize = true, quality = 80, format = 'auto' } = options;
    
    switch (this.config.provider) {
      case 'aws':
        return this.uploadToS3(file, fileName, folder, { optimize, quality, format });
      case 'cloudinary':
        return this.uploadToCloudinary(file, fileName, folder, { optimize, quality, format });
      default:
        return this.uploadLocally(file, fileName, folder);
    }
  }

  private async uploadToS3(
    file: Buffer | string,
    fileName: string,
    folder: string,
    options: any
  ): Promise<{ url: string; publicId?: string }> {
    if (!this.s3 || !this.config.aws) {
      throw new Error('AWS S3 not configured');
    }

    const key = `${folder}/${fileName}`;
    const params = {
      Bucket: this.config.aws.bucket,
      Key: key,
      Body: file,
      ContentType: this.getContentType(fileName),
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // 1 year
    };

    try {
      const result = await this.s3.upload(params).promise();
      return { url: result.Location };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  private async uploadToCloudinary(
    file: Buffer | string,
    fileName: string,
    folder: string,
    options: any
  ): Promise<{ url: string; publicId?: string }> {
    if (!this.cloudinary) {
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await this.cloudinary.uploader.upload(file, {
        folder,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        quality: options.quality,
        fetch_format: options.format,
        flags: options.optimize ? 'lossy' : 'lossless'
      });

      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  private async uploadLocally(
    file: Buffer | string,
    fileName: string,
    folder: string
  ): Promise<{ url: string; publicId?: string }> {
    // For local development, we'll just return a placeholder URL
    // In production, you'd want to save the file to a local directory
    const url = `/uploads/${folder}/${fileName}`;
    return { url };
  }

  // Delete file from CDN
  async deleteFile(fileUrl: string, publicId?: string): Promise<boolean> {
    switch (this.config.provider) {
      case 'aws':
        return this.deleteFromS3(fileUrl);
      case 'cloudinary':
        return this.deleteFromCloudinary(publicId || fileUrl);
      default:
        return this.deleteLocally(fileUrl);
    }
  }

  private async deleteFromS3(fileUrl: string): Promise<boolean> {
    if (!this.s3 || !this.config.aws) {
      return false;
    }

    try {
      const key = fileUrl.split('/').slice(-2).join('/'); // Extract key from URL
      await this.s3.deleteObject({
        Bucket: this.config.aws.bucket,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  private async deleteFromCloudinary(publicId: string): Promise<boolean> {
    if (!this.cloudinary) {
      return false;
    }

    try {
      await this.cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  private async deleteLocally(fileUrl: string): Promise<boolean> {
    // For local development, we'll just return true
    // In production, you'd want to delete the actual file
    return true;
  }

  // Generate optimized image URL
  generateImageUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    const { width, height, quality = 80, format = 'auto', crop = 'fill' } = options;

    switch (this.config.provider) {
      case 'cloudinary':
        if (this.cloudinary) {
          return this.cloudinary.url(originalUrl, {
            width,
            height,
            quality,
            fetch_format: format,
            crop
          });
        }
        break;
      case 'aws':
        // For AWS, you might use CloudFront with image optimization
        // or a service like AWS Lambda with Sharp
        return originalUrl;
      default:
        return originalUrl;
    }

    return originalUrl;
  }

  // Batch operations
  async batchUpload(
    files: Array<{ file: Buffer | string; fileName: string; folder: string }>,
    options: any = {}
  ): Promise<Array<{ url: string; publicId?: string }>> {
    const uploadPromises = files.map(({ file, fileName, folder }) =>
      this.uploadFile(file, fileName, folder, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  }

  // Get file info
  async getFileInfo(fileUrl: string): Promise<any> {
    switch (this.config.provider) {
      case 'aws':
        return this.getS3FileInfo(fileUrl);
      case 'cloudinary':
        return this.getCloudinaryFileInfo(fileUrl);
      default:
        return null;
    }
  }

  private async getS3FileInfo(fileUrl: string): Promise<any> {
    if (!this.s3 || !this.config.aws) {
      return null;
    }

    try {
      const key = fileUrl.split('/').slice(-2).join('/');
      const result = await this.s3.headObject({
        Bucket: this.config.aws.bucket,
        Key: key
      }).promise();

      return {
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 file info error:', error);
      return null;
    }
  }

  private async getCloudinaryFileInfo(fileUrl: string): Promise<any> {
    if (!this.cloudinary) {
      return null;
    }

    try {
      const publicId = fileUrl.split('/').pop()?.split('.')[0];
      if (!publicId) return null;

      const result = await this.cloudinary.api.resource(publicId);
      return {
        size: result.bytes,
        contentType: result.format,
        lastModified: result.created_at,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Cloudinary file info error:', error);
      return null;
    }
  }

  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'aws':
          if (this.s3) {
            await this.s3.headBucket({ Bucket: this.config.aws!.bucket }).promise();
          }
          break;
        case 'cloudinary':
          if (this.cloudinary) {
            await this.cloudinary.api.ping();
          }
          break;
        default:
          return true;
      }
      return true;
    } catch (error) {
      console.error('CDN health check failed:', error);
      return false;
    }
  }
}

export const cdnService = new CDNService();
export default cdnService;
