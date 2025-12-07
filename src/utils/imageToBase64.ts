/**
 * Utility functions for converting images to Base64 data URLs
 * This enables 100% frontend-based photo storage and display
 */

/**
 * Convert a File object to a Base64 data URL
 * @param file - The image file to convert
 * @param maxWidth - Maximum width for compression (default: 1200px)
 * @param quality - JPEG quality for compression (default: 0.8)
 * @returns Promise<string> - Base64 data URL
 */
export async function fileToBase64(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 data URL
        // Use JPEG for photos (better compression), PNG for images with transparency
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        console.log(`📸 Converted image to Base64: ${file.name} (${Math.round(dataUrl.length / 1024)}KB)`);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple files to Base64 data URLs in parallel
 * @param files - Array of image files
 * @param maxWidth - Maximum width for compression
 * @param quality - JPEG quality for compression
 * @returns Promise<string[]> - Array of Base64 data URLs
 */
export async function filesToBase64(
  files: File[],
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string[]> {
  const promises = files.map(file => fileToBase64(file, maxWidth, quality));
  return Promise.all(promises);
}

/**
 * Check if a string is a valid Base64 data URL
 * @param str - String to check
 * @returns boolean
 */
export function isBase64DataUrl(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.startsWith('data:image/');
}

/**
 * Get the size of a Base64 data URL in bytes
 * @param dataUrl - Base64 data URL
 * @returns number - Size in bytes
 */
export function getBase64Size(dataUrl: string): number {
  // Remove the data URL prefix to get just the Base64 string
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Calculate the size: Base64 encodes 3 bytes into 4 characters
  // Account for padding characters (=)
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Compress a Base64 data URL if it exceeds a size limit
 * @param dataUrl - Original Base64 data URL
 * @param maxSizeKB - Maximum size in KB (default: 500KB)
 * @param minQuality - Minimum quality to use (default: 0.3)
 * @returns Promise<string> - Compressed Base64 data URL
 */
export async function compressBase64IfNeeded(
  dataUrl: string,
  maxSizeKB: number = 500,
  minQuality: number = 0.3
): Promise<string> {
  const currentSize = getBase64Size(dataUrl);
  const maxSize = maxSizeKB * 1024;
  
  if (currentSize <= maxSize) {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Try progressively lower quality until we're under the limit
      let quality = 0.7;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      while (getBase64Size(result) > maxSize && quality > minQuality) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      console.log(`📦 Compressed image from ${Math.round(currentSize / 1024)}KB to ${Math.round(getBase64Size(result) / 1024)}KB (quality: ${quality.toFixed(1)})`);
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
}
