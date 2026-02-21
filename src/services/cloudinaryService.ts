/**
 * Cloudinary Service - Direct upload to Cloudinary
 * Avoids Vercel timeouts by uploading directly from client
 */

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes?: number;
  thumbnailUrl?: string;
  error?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: string;
  onProgress?: (progress: number) => void;
  tags?: string[];
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
    this.apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';

    if (!this.cloudName) {
      console.warn('Cloudinary cloud name not configured');
    }
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return !!(this.cloudName && this.uploadPreset);
  }

  /**
   * Upload file directly to Cloudinary
   */
  async upload(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Cloudinary not configured. Please set environment variables.'
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);

      // Add folder if specified
      if (options.folder) {
        formData.append('folder', `demedia/${options.folder}`);
      }

      // Add tags if specified
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      // Determine resource type
      const resourceType = options.resourceType || this.getResourceType(file);
      
      // Build upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

      // Upload with progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              options.onProgress!(percentage);
            }
          });
        }

        // Handle completion
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);

            if (xhr.status >= 200 && xhr.status < 300) {
              // Generate thumbnail URL for videos
              let thumbnailUrl: string | undefined;
              if (resourceType === 'video') {
                thumbnailUrl = this.getVideoThumbnail(response.public_id);
              }

              resolve({
                success: true,
                url: response.url,
                secureUrl: response.secure_url,
                publicId: response.public_id,
                format: response.format,
                width: response.width,
                height: response.height,
                duration: response.duration,
                bytes: response.bytes,
                thumbnailUrl
              });
            } else {
              resolve({
                success: false,
                error: response.error?.message || 'Upload failed'
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid response from Cloudinary'
            });
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Network error during upload'
          });
        });

        xhr.addEventListener('timeout', () => {
          resolve({
            success: false,
            error: 'Upload timeout'
          });
        });

        // Configure and send request
        xhr.open('POST', uploadUrl);
        xhr.timeout = 300000; // 5 minute timeout for large files
        xhr.send(formData);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload edited image (base64 or blob)
   */
  async uploadEditedImage(
    dataUrl: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Cloudinary not configured'
      };
    }

    try {
      // Convert data URL to blob
      const blob = await this.dataUrlToBlob(dataUrl);
      const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });

      return this.upload(file, {
        ...options,
        folder: options.folder || 'posts/edited'
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload edited image'
      };
    }
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnail(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
  } = {}): string {
    const width = options.width || 640;
    const height = options.height || 360;
    const crop = options.crop || 'fill';

    return `https://res.cloudinary.com/${this.cloudName}/video/upload/` +
           `w_${width},h_${height},c_${crop},f_jpg/${publicId}.jpg`;
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}): string {
    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    const transformStr = transformations.length > 0 ? transformations.join(',') + '/' : '';

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformStr}${publicId}`;
  }

  /**
   * Delete resource from Cloudinary
   */
  async delete(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      // This requires server-side implementation with API secret
      // For now, we'll just return true and handle deletion on backend
      console.log('Delete request for:', publicId, resourceType);
      return true;
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Determine resource type from file
   */
  private getResourceType(file: File): 'image' | 'video' | 'raw' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'raw';
  }

  /**
   * Convert data URL to Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Generate signed upload parameters (requires backend)
   */
  async getSignedUploadParams(folder: string): Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
  } | null> {
    try {
      const response = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      });

      if (!response.ok) return null;

      return response.json();
    } catch (error) {
      console.error('Failed to get signed upload params:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;