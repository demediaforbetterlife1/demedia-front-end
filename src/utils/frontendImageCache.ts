/**
 * Frontend Image Cache for immediate image display
 * Stores images as base64 in localStorage for display purposes
 * While backend handles database storage when available
 */

interface CachedImage {
  id: string;
  dataUrl: string; // base64 data URL
  filename: string;
  size: number;
  type: string;
  createdAt: string;
  postId?: string;
}

interface PostImageMapping {
  postId: string;
  imageIds: string[];
  createdAt: string;
}

class FrontendImageCache {
  private readonly CACHE_KEY = 'frontend_image_cache';
  private readonly POST_MAPPING_KEY = 'post_image_mapping';
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of images to cache
  private readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB per image

  /**
   * Store an image in the cache for immediate display
   */
  storeImage(file: File, postId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check file size
      if (file.size > this.MAX_IMAGE_SIZE) {
        reject(new Error('Image too large for cache'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const imageId = this.generateImageId();

          const cachedImage: CachedImage = {
            id: imageId,
            dataUrl,
            filename: file.name,
            size: file.size,
            type: file.type,
            createdAt: new Date().toISOString(),
            postId
          };

          this.addImageToCache(cachedImage);

          if (postId) {
            this.addPostImageMapping(postId, imageId);
          }

          console.log('✅ Image cached for frontend display:', {
            id: imageId,
            filename: file.name,
            postId
          });

          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get an image from the cache
   */
  getImage(imageId: string): string | null {
    try {
      const cache = this.getImageCache();
      const image = cache.find(img => img.id === imageId);
      return image?.dataUrl || null;
    } catch (error) {
      console.error('Failed to get image from cache:', error);
      return null;
    }
  }

  /**
   * Get all images for a specific post
   */
  getPostImages(postId: string): string[] {
    try {
      const mappings = this.getPostMappings();
      const mapping = mappings.find(m => m.postId === postId);

      if (!mapping) return [];

      const cache = this.getImageCache();
      return mapping.imageIds
        .map(id => cache.find(img => img.id === id)?.dataUrl)
        .filter(Boolean) as string[];
    } catch (error) {
      console.error('Failed to get post images:', error);
      return [];
    }
  }

  /**
   * Store multiple images for a post
   */
  async storePostImages(files: File[], postId: string): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const file of files) {
      try {
        const dataUrl = await this.storeImage(file, postId);
        imageUrls.push(dataUrl);
      } catch (error) {
        console.error('Failed to store image:', error);
      }
    }

    return imageUrls;
  }

  /**
   * Check if an image is in the cache
   */
  hasImage(imageId: string): boolean {
    try {
      const cache = this.getImageCache();
      return cache.some(img => img.id === imageId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the display URL for an image (cache first, then original URL)
   */
  getDisplayUrl(originalUrl: string, imageId?: string): string {
    // If it's already a base64 data URL, return as is
    if (originalUrl && originalUrl.startsWith('data:')) {
      return originalUrl;
    }

    // Try to get from cache first
    if (imageId) {
      const cachedUrl = this.getImage(imageId);
      if (cachedUrl) {
        return cachedUrl;
      }
    }

    // Return original URL as fallback
    return originalUrl || '/images/default-post.svg';
  }

  /**
   * Clean up old images to prevent storage overflow
   */
  cleanup(): void {
    try {
      const cache = this.getImageCache();

      if (cache.length <= this.MAX_CACHE_SIZE) return;

      // Sort by creation date (oldest first)
      cache.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Keep only the most recent images
      const trimmedCache = cache.slice(-this.MAX_CACHE_SIZE);

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(trimmedCache));

      console.log(`🧹 Cleaned up image cache: ${cache.length} → ${trimmedCache.length} images`);
    } catch (error) {
      console.error('Failed to cleanup image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalImages: number;
    totalSize: number;
    oldestImage?: string;
    newestImage?: string;
  } {
    try {
      const cache = this.getImageCache();
      const totalSize = cache.reduce((sum, img) => sum + img.size, 0);

      const sorted = [...cache].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        totalImages: cache.length,
        totalSize,
        oldestImage: sorted[0]?.createdAt,
        newestImage: sorted[sorted.length - 1]?.createdAt
      };
    } catch (error) {
      return {
        totalImages: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.POST_MAPPING_KEY);
      console.log('✅ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Export cached images for debugging
   */
  exportCache(): string {
    try {
      const cache = this.getImageCache();
      const mappings = this.getPostMappings();

      return JSON.stringify({
        images: cache.map(img => ({
          ...img,
          dataUrl: img.dataUrl.substring(0, 100) + '...' // Truncate for readability
        })),
        mappings,
        stats: this.getStats(),
        exportedAt: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Failed to export cache:', error);
      return '{}';
    }
  }

  // Private methods

  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getImageCache(): CachedImage[] {
    try {
      const cache = localStorage.getItem(this.CACHE_KEY);
      return cache ? JSON.parse(cache) : [];
    } catch (error) {
      console.error('Failed to get image cache:', error);
      return [];
    }
  }

  private addImageToCache(image: CachedImage): void {
    try {
      const cache = this.getImageCache();
      cache.push(image);

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

      // Run cleanup if needed
      this.cleanup();
    } catch (error) {
      console.error('Failed to add image to cache:', error);
    }
  }

  private getPostMappings(): PostImageMapping[] {
    try {
      const mappings = localStorage.getItem(this.POST_MAPPING_KEY);
      return mappings ? JSON.parse(mappings) : [];
    } catch (error) {
      console.error('Failed to get post mappings:', error);
      return [];
    }
  }

  private addPostImageMapping(postId: string, imageId: string): void {
    try {
      const mappings = this.getPostMappings();
      let mapping = mappings.find(m => m.postId === postId);

      if (!mapping) {
        mapping = {
          postId,
          imageIds: [],
          createdAt: new Date().toISOString()
        };
        mappings.push(mapping);
      }

      if (!mapping.imageIds.includes(imageId)) {
        mapping.imageIds.push(imageId);
      }

      localStorage.setItem(this.POST_MAPPING_KEY, JSON.stringify(mappings));
    } catch (error) {
      console.error('Failed to add post image mapping:', error);
    }
  }
}

// Utility functions for easy access

/**
 * Process uploaded files for immediate display
 */
export async function processUploadedFiles(files: File[], postId?: string): Promise<string[]> {
  const cache = frontendImageCache;
  const imageUrls: string[] = [];

  for (const file of files) {
    try {
      const dataUrl = await cache.storeImage(file, postId);
      imageUrls.push(dataUrl);
    } catch (error) {
      console.error('Failed to process uploaded file:', error);
      // Still add the file, but as a fallback URL
      imageUrls.push(URL.createObjectURL(file));
    }
  }

  return imageUrls;
}

/**
 * Get the best display URL for an image
 */
export function getImageDisplayUrl(originalUrl?: string, imageId?: string): string {
  if (!originalUrl) return '/images/default-post.svg';

  return frontendImageCache.getDisplayUrl(originalUrl, imageId);
}

/**
 * Check if an image URL is a cached base64 image
 */
export function isCachedImage(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * Get images for a specific post
 */
export function getPostDisplayImages(postId: string, fallbackUrls: string[] = []): string[] {
  const cachedImages = frontendImageCache.getPostImages(postId);

  if (cachedImages.length > 0) {
    return cachedImages;
  }

  // Return fallback URLs if no cached images
  return fallbackUrls.filter(Boolean);
}

// Export singleton instance
export const frontendImageCache = new FrontendImageCache();

// Type exports
export type { CachedImage, PostImageMapping };
