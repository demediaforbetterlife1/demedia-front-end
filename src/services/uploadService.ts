/**
 * Upload Service - Handles all media uploads to backend
 */

import { getUploadEndpoint, validateMediaFile } from '@/utils/mediaUtils';
import { getAuthHeaders } from '@/lib/api';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  filename?: string;
  size?: number;
  duration?: number;
  message?: string;
  error?: string;
  details?: string;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
  type?: string; // For profile uploads: 'profile' or 'cover'
  duration?: number; // For video uploads
  visibility?: string; // For video uploads
}

class UploadService {
  /**
   * Upload a profile photo (avatar or cover)
   */
  async uploadProfile(
    file: File, 
    type: 'profile' | 'cover' = 'profile',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    const validation = validateMediaFile(file, 'image', 10); // 10MB limit
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.uploadWithProgress(
      getUploadEndpoint('profile'),
      formData,
      options
    );
  }

  /**
   * Upload a post image
   */
  async uploadPostImage(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    const validation = validateMediaFile(file, 'image', 10); // 10MB limit
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const formData = new FormData();
    formData.append('image', file);

    return this.uploadWithProgress(
      getUploadEndpoint('post'),
      formData,
      options
    );
  }

  /**
   * Upload a video (for DeSnaps, posts, stories)
   */
  async uploadVideo(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    const validation = validateMediaFile(file, 'video', 100); // 100MB limit
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const formData = new FormData();
    formData.append('video', file);
    
    if (options.duration) {
      formData.append('duration', options.duration.toString());
    }
    
    if (options.visibility) {
      formData.append('visibility', options.visibility);
    }

    return this.uploadWithProgress(
      getUploadEndpoint('video'),
      formData,
      { ...options, timeout: 120000 } // 2 minute timeout for videos
    );
  }

  /**
   * Generic upload method with progress tracking
   */
  private async uploadWithProgress(
    endpoint: string,
    formData: FormData,
    options: UploadOptions & { timeout?: number } = {}
  ): Promise<UploadResult> {
    try {
      const headers = await getAuthHeaders();
      
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              };
              options.onProgress!(progress);
            }
          });
        }

        // Set up completion handler
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                success: true,
                ...response
              });
            } else {
              resolve({
                success: false,
                error: response.error || 'Upload failed',
                details: response.details
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid response from server',
              details: xhr.responseText
            });
          }
        });

        // Set up error handler
        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Network error during upload',
            details: 'Please check your internet connection and try again'
          });
        });

        // Set up timeout handler
        xhr.addEventListener('timeout', () => {
          resolve({
            success: false,
            error: 'Upload timeout',
            details: 'The upload took too long to complete. Please try with a smaller file.'
          });
        });

        // Set up abort handler
        xhr.addEventListener('abort', () => {
          resolve({
            success: false,
            error: 'Upload cancelled',
            details: 'The upload was cancelled by the user'
          });
        });

        // Handle abort signal
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }

        // Configure request
        xhr.open('POST', endpoint);
        xhr.timeout = options.timeout || 60000; // Default 60 second timeout
        
        // Set headers (don't set Content-Type, let browser set it with boundary)
        if (headers.Authorization) {
          xhr.setRequestHeader('Authorization', headers.Authorization);
        }

        // Send request
        xhr.send(formData);
      });
      
    } catch (error) {
      return {
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload multiple files (for posts with multiple images)
   */
  async uploadMultipleImages(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Create progress handler for this specific file
      const fileProgress = options.onProgress ? (progress: UploadProgress) => {
        // Calculate overall progress across all files
        const overallProgress: UploadProgress = {
          loaded: (i * 100) + progress.percentage,
          total: files.length * 100,
          percentage: Math.round(((i * 100) + progress.percentage) / files.length)
        };
        options.onProgress!(overallProgress);
      } : undefined;

      const result = await this.uploadPostImage(file, {
        ...options,
        onProgress: fileProgress
      });
      
      results.push(result);
      
      // If any upload fails, stop the process
      if (!result.success) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Cancel all ongoing uploads (if using AbortController)
   */
  cancelUploads(controller: AbortController) {
    controller.abort();
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;