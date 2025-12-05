/**
 * Image compression utility
 * Compresses images using canvas API before storage
 */

import { CompressionOptions, DEFAULT_COMPRESSION_OPTIONS } from './types';
import { PhotoStorageError, PhotoStorageErrorCode } from './errors';

export class ImageCompressor {
  /**
   * Compress an image file
   */
  async compress(
    file: File,
    options: Partial<CompressionOptions> = {}
  ): Promise<Blob> {
    const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

    try {
      // Load image
      const img = await this.loadImage(file);

      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth,
        opts.maxHeight
      );

      // Create canvas and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw image with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          opts.format,
          opts.quality
        );
      });
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.COMPRESSION_FAILED,
        'Failed to compress image',
        error
      );
    }
  }

  /**
   * Compress an image to Base64
   */
  async compressToBase64(
    file: File,
    options: Partial<CompressionOptions> = {}
  ): Promise<string> {
    const blob = await this.compress(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get image dimensions without loading full image
   */
  async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    try {
      const img = await this.loadImage(file);
      return {
        width: img.width,
        height: img.height,
      };
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.INVALID_FILE,
        'Failed to get image dimensions',
        error
      );
    }
  }

  /**
   * Estimate compressed size
   */
  estimateCompressedSize(file: File, quality: number): number {
    // Rough estimation: JPEG compression typically achieves 10:1 to 20:1 ratio
    // at quality 0.85, we estimate about 15:1 ratio
    const compressionRatio = 15 * quality;
    return Math.ceil(file.size / compressionRatio);
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  private calculateDimensions(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // If image is smaller than max dimensions, keep original size
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Calculate new dimensions
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Check if compression is needed
   */
  shouldCompress(file: File, threshold: number): boolean {
    return file.size > threshold;
  }

  /**
   * Get optimal quality based on file size
   */
  getOptimalQuality(fileSize: number): number {
    // Larger files get more aggressive compression
    if (fileSize > 5 * 1024 * 1024) return 0.7; // 5MB+
    if (fileSize > 2 * 1024 * 1024) return 0.8; // 2-5MB
    if (fileSize > 1 * 1024 * 1024) return 0.85; // 1-2MB
    return 0.9; // < 1MB
  }
}
