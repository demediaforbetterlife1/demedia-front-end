/**
 * Video Processing Service
 * Client-side video manipulation without external dependencies
 */

export interface VideoSegment {
  start: number;
  end: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface TrimData {
  start: number;
  end: number;
}

class VideoProcessingService {
  /**
   * Load video from file
   */
  async loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video metadata
   */
  async getMetadata(video: HTMLVideoElement): Promise<VideoMetadata> {
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      aspectRatio: video.videoWidth / video.videoHeight
    };
  }

  /**
   * Extract frame at specific time
   */
  async extractFrame(video: HTMLVideoElement, time: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.currentTime = time;
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      video.onerror = () => {
        reject(new Error('Failed to seek video'));
      };
    });
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(
    video: HTMLVideoElement, 
    time?: number,
    maxWidth: number = 640
  ): Promise<string> {
    const seekTime = time !== undefined ? time : Math.min(1, video.duration * 0.1);
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = video.videoHeight / video.videoWidth;
      const thumbnailWidth = Math.min(maxWidth, video.videoWidth);
      const thumbnailHeight = thumbnailWidth * aspectRatio;
      
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.currentTime = seekTime;
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      video.onerror = () => {
        reject(new Error('Failed to generate thumbnail'));
      };
    });
  }

  /**
   * Generate multiple thumbnails for timeline
   */
  async generateTimelineThumbnails(
    video: HTMLVideoElement,
    count: number = 10
  ): Promise<string[]> {
    const thumbnails: string[] = [];
    const interval = video.duration / count;

    for (let i = 0; i < count; i++) {
      const time = i * interval;
      try {
        const thumbnail = await this.extractFrame(video, time);
        thumbnails.push(thumbnail);
      } catch (error) {
        console.error(`Failed to generate thumbnail at ${time}s:`, error);
        thumbnails.push(''); // Placeholder for failed thumbnail
      }
    }

    return thumbnails;
  }

  /**
   * Trim video (client-side metadata only)
   * Actual trimming happens during export
   */
  getTrimmedDuration(originalDuration: number, trimData: TrimData): number {
    return trimData.end - trimData.start;
  }

  /**
   * Calculate new duration with speed adjustment
   */
  getAdjustedDuration(originalDuration: number, speed: number): number {
    return originalDuration / speed;
  }

  /**
   * Apply aspect ratio crop
   */
  async applyAspectRatio(
    video: HTMLVideoElement,
    aspectRatio: number
  ): Promise<{ width: number; height: number; x: number; y: number }> {
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let width = video.videoWidth;
    let height = video.videoHeight;
    let x = 0;
    let y = 0;

    if (aspectRatio > videoAspectRatio) {
      // Crop height
      height = video.videoWidth / aspectRatio;
      y = (video.videoHeight - height) / 2;
    } else if (aspectRatio < videoAspectRatio) {
      // Crop width
      width = video.videoHeight * aspectRatio;
      x = (video.videoWidth - width) / 2;
    }

    return { width, height, x, y };
  }

  /**
   * Get aspect ratio presets
   */
  getAspectRatioPresets(): Record<string, number> {
    return {
      '9:16': 9 / 16,   // Vertical (Stories, Reels)
      '1:1': 1,         // Square
      '4:5': 4 / 5,     // Portrait
      '16:9': 16 / 9,   // Landscape
      '4:3': 4 / 3,     // Classic
      'original': 0     // Keep original
    };
  }

  /**
   * Validate video file
   */
  async validateVideo(file: File, maxDuration?: number, maxSize?: number): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return { valid: false, error: 'File must be a video' };
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      return { valid: false, error: `Video must be smaller than ${sizeMB}MB` };
    }

    // Check duration
    if (maxDuration) {
      try {
        const video = await this.loadVideo(file);
        if (video.duration > maxDuration) {
          return { 
            valid: false, 
            error: `Video must be shorter than ${Math.round(maxDuration)}s` 
          };
        }
      } catch (error) {
        return { valid: false, error: 'Failed to load video' };
      }
    }

    return { valid: true };
  }

  /**
   * Format time for display (MM:SS)
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format time with milliseconds (MM:SS.mmm)
   */
  formatTimeDetailed(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Create video blob URL
   */
  createVideoUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke video blob URL
   */
  revokeVideoUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get supported video formats
   */
  getSupportedFormats(): string[] {
    return ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(mimeType: string): boolean {
    return this.getSupportedFormats().includes(mimeType);
  }

  /**
   * Estimate export file size
   * This is a rough estimate based on duration and quality
   */
  estimateFileSize(duration: number, quality: 'low' | 'medium' | 'high'): number {
    const bitrateMap = {
      low: 1000000,      // 1 Mbps
      medium: 2500000,   // 2.5 Mbps
      high: 5000000      // 5 Mbps
    };

    const bitrate = bitrateMap[quality];
    return (duration * bitrate) / 8; // Convert bits to bytes
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Cleanup resources
   */
  cleanup(video: HTMLVideoElement): void {
    if (video.src) {
      URL.revokeObjectURL(video.src);
    }
    video.src = '';
    video.load();
  }
}

// Export singleton instance
export const videoProcessingService = new VideoProcessingService();
export default videoProcessingService;