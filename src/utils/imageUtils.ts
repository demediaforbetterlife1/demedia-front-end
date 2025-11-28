/**
 * Utility functions for handling image display, including local base64 images
 */

export interface ImageDisplayOptions {
  fallbackSrc?: string;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  onError?: (error: Event) => void;
  onLoad?: (event: Event) => void;
}

/**
 * Determines if an image URL is a base64 data URL
 */
export function isBase64Image(src: string): boolean {
  return src.startsWith('data:image/');
}

/**
 * Determines if an image URL is a local file
 */
export function isLocalImage(src: string): boolean {
  return isBase64Image(src) || src.startsWith('/local-uploads') || src.startsWith('local-uploads');
}

/**
 * Optimizes base64 image for display
 */
export function optimizeBase64Image(base64Url: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64Url); // Return original if canvas not supported
        return;
      }

      // Calculate new dimensions
      const { width, height } = img;
      let newWidth = width;
      let newHeight = height;

      if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (height * maxWidth) / width;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      try {
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimizedUrl);
      } catch (error) {
        console.warn('Failed to optimize base64 image:', error);
        resolve(base64Url); // Return original on error
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load base64 image'));
    };

    img.src = base64Url;
  });
}

/**
 * Creates a responsive image component props
 */
export function createImageProps(
  src: string | null | undefined,
  options: ImageDisplayOptions = {}
): {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (error: Event) => void;
  onLoad?: (event: Event) => void;
} {
  const {
    fallbackSrc = '/images/default-post.svg',
    className,
    alt = 'Image',
    loading = 'lazy',
    onError,
    onLoad
  } = options;

  // Handle null/undefined/empty sources
  if (!src || src.trim() === '' || src === 'null' || src === 'undefined') {
    return {
      src: fallbackSrc,
      alt,
      className,
      loading,
      onError,
      onLoad
    };
  }

  return {
    src: src.trim(),
    alt,
    className,
    loading,
    onError,
    onLoad
  };
}

/**
 * Preloads an image and returns a promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });
}

/**
 * Gets image dimensions without loading the full image
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (error) => {
      reject(new Error('Failed to load image for dimensions'));
    };
    img.src = src;
  });
}

/**
 * Creates a lazy loading image observer
 */
export function createImageObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions = {
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Handles image loading with error fallback
 */
export class ImageLoader {
  private static cache = new Map<string, Promise<string>>();

  static async load(src: string, fallbackSrc?: string): Promise<string> {
    // Return base64 images immediately
    if (isBase64Image(src)) {
      return src;
    }

    // Check cache first
    if (this.cache.has(src)) {
      try {
        return await this.cache.get(src)!;
      } catch {
        // Remove failed promise from cache
        this.cache.delete(src);
      }
    }

    // Create loading promise
    const loadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        resolve(src);
      };

      img.onerror = () => {
        if (fallbackSrc && fallbackSrc !== src) {
          // Try fallback
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackSrc);
          fallbackImg.onerror = () => reject(new Error('Both primary and fallback images failed'));
          fallbackImg.src = fallbackSrc;
        } else {
          reject(new Error('Image failed to load'));
        }
      };

      img.src = src;
    });

    // Cache the promise
    this.cache.set(src, loadPromise);

    try {
      return await loadPromise;
    } catch (error) {
      // Remove failed promise from cache
      this.cache.delete(src);
      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Utility for handling multiple image sources with fallbacks
 */
export class MultiSourceImage {
  private sources: string[];
  private fallbackSrc: string;
  private currentIndex: number = 0;

  constructor(sources: (string | null | undefined)[], fallbackSrc: string = '/images/default-post.svg') {
    this.sources = sources.filter((src): src is string =>
      Boolean(src && src.trim() && src !== 'null' && src !== 'undefined')
    );
    this.fallbackSrc = fallbackSrc;
  }

  async getCurrentSrc(): Promise<string> {
    if (this.sources.length === 0) {
      return this.fallbackSrc;
    }

    while (this.currentIndex < this.sources.length) {
      const src = this.sources[this.currentIndex];

      try {
        // For base64 images, return immediately
        if (isBase64Image(src)) {
          return src;
        }

        // Try to load the image
        await ImageLoader.load(src);
        return src;
      } catch {
        // Move to next source
        this.currentIndex++;
      }
    }

    // All sources failed, return fallback
    return this.fallbackSrc;
  }

  reset(): void {
    this.currentIndex = 0;
  }

  hasMoreSources(): boolean {
    return this.currentIndex < this.sources.length;
  }
}

/**
 * Converts file to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a string is a valid image data URL
 */
export function isValidImageDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith('data:image/')) {
    return false;
  }

  try {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) return false;

    // Check if it's base64 encoded
    if (!header.includes('base64')) return false;

    // Basic base64 validation
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Pattern.test(data.replace(/\s/g, ''));
  } catch {
    return false;
  }
}

/**
 * Gets the MIME type from a data URL
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string | null {
  if (!isValidImageDataUrl(dataUrl)) return null;

  const match = dataUrl.match(/data:([^;]+);/);
  return match ? match[1] : null;
}

/**
 * Estimates the size of a base64 image in bytes
 */
export function estimateBase64Size(dataUrl: string): number {
  if (!isValidImageDataUrl(dataUrl)) return 0;

  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return 0;

  // Base64 encoding increases size by ~33%
  // Each character represents 6 bits, so 4 chars = 3 bytes
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Compresses a base64 image
 */
export function compressBase64Image(
  dataUrl: string,
  quality: number = 0.8,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl); // Return original if canvas not supported
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedUrl);
      } catch (error) {
        console.warn('Failed to compress base64 image:', error);
        resolve(dataUrl); // Return original on error
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
}
