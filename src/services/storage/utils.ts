/**
 * Utility functions for photo storage
 */

import { PhotoStorageError, PhotoStorageErrorCode } from './errors';

/**
 * Generate a unique ID for a photo (UUID v4)
 */
export function generatePhotoId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback to manual UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate if a file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  // Check if it's a File object
  if (!(file instanceof File)) {
    return false;
  }

  // Check MIME type
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  return validMimeTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): void {
  if (file.size > maxSize) {
    throw new PhotoStorageError(
      PhotoStorageErrorCode.INVALID_FILE,
      `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(maxSize)})`,
      { fileSize: file.size, maxSize }
    );
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert Blob to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 string to Blob
 */
export function base64ToBlob(base64: string): Blob {
  try {
    // Extract the base64 data and mime type
    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = parts[1];

    // Decode base64
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    throw new PhotoStorageError(
      PhotoStorageErrorCode.INVALID_FILE,
      'Failed to convert base64 to blob',
      error
    );
  }
}

/**
 * Create a Blob URL from a Blob
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke a Blob URL
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Check if storage is available
 */
export async function isStorageAvailable(type: 'indexeddb' | 'localstorage'): Promise<boolean> {
  try {
    if (type === 'indexeddb') {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        return false;
      }

      // Try to open a test database
      return new Promise((resolve) => {
        const testDb = 'test-db';
        const request = indexedDB.open(testDb);

        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase(testDb);
          resolve(true);
        };

        request.onerror = () => {
          resolve(false);
        };

        request.onblocked = () => {
          resolve(false);
        };
      });
    } else {
      // Check if localStorage is available
      if (!('localStorage' in window)) {
        return false;
      }

      // Try to use localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Get estimated storage quota
 */
export async function getStorageQuota(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch {
      // Fallback if estimate fails
      return { usage: 0, quota: 0 };
    }
  }

  // Fallback for browsers without storage API
  return { usage: 0, quota: 0 };
}

/**
 * Check if there's enough storage space
 */
export async function hasEnoughSpace(requiredBytes: number): Promise<boolean> {
  const { usage, quota } = await getStorageQuota();

  // If quota is 0, we can't determine - assume there's space
  if (quota === 0) {
    return true;
  }

  const available = quota - usage;
  return available >= requiredBytes;
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new PhotoStorageError(
              PhotoStorageErrorCode.OPERATION_TIMEOUT,
              errorMessage,
              { timeout: timeoutMs }
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, waitMs);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}
