/**
 * localStorage adapter for photo storage
 * Fallback storage using Base64 encoding when IndexedDB is unavailable
 */

import {
  StorageAdapter,
  PhotoMetadata,
  StorageStats,
  STORAGE_CONFIG,
} from './types';
import { PhotoStorageError, PhotoStorageErrorCode } from './errors';
import { blobToBase64, base64ToBlob, safeJsonParse, getCurrentTimestamp } from './utils';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix = STORAGE_CONFIG.LOCALSTORAGE_PHOTO_PREFIX;
  private readonly metadataPrefix = STORAGE_CONFIG.LOCALSTORAGE_META_PREFIX;
  private readonly indexKey = STORAGE_CONFIG.LOCALSTORAGE_INDEX_KEY;
  private readonly maxSize = STORAGE_CONFIG.MAX_PHOTO_SIZE;

  /**
   * Get the photo index (list of all photo IDs)
   */
  private getIndex(): string[] {
    const indexJson = localStorage.getItem(this.indexKey);
    return safeJsonParse(indexJson || '[]', []);
  }

  /**
   * Update the photo index
   */
  private setIndex(ids: string[]): void {
    localStorage.setItem(this.indexKey, JSON.stringify(ids));
  }

  /**
   * Add ID to index
   */
  private addToIndex(id: string): void {
    const index = this.getIndex();
    if (!index.includes(id)) {
      index.push(id);
      this.setIndex(index);
    }
  }

  /**
   * Remove ID from index
   */
  private removeFromIndex(id: string): void {
    const index = this.getIndex();
    const filtered = index.filter((i) => i !== id);
    this.setIndex(filtered);
  }

  /**
   * Store a photo with its metadata
   */
  async store(
    id: string,
    data: Blob | string,
    metadata: PhotoMetadata
  ): Promise<void> {
    try {
      // Convert Blob to Base64 if necessary
      let base64Data: string;
      if (data instanceof Blob) {
        base64Data = await blobToBase64(data);
      } else {
        base64Data = data;
      }

      // Check size
      const sizeInBytes = new Blob([base64Data]).size;
      if (sizeInBytes > this.maxSize) {
        throw new PhotoStorageError(
          PhotoStorageErrorCode.INVALID_FILE,
          `Photo size (${sizeInBytes} bytes) exceeds maximum (${this.maxSize} bytes)`
        );
      }

      // Store photo data
      const photoKey = `${this.prefix}${id}`;
      localStorage.setItem(photoKey, base64Data);

      // Store metadata
      const metadataKey = `${this.metadataPrefix}${id}`;
      localStorage.setItem(metadataKey, JSON.stringify(metadata));

      // Update index
      this.addToIndex(id);
    } catch (error) {
      if (error instanceof PhotoStorageError) {
        throw error;
      }

      // Check for quota exceeded error
      if (
        error instanceof Error &&
        (error.name === 'QuotaExceededError' ||
          error.message.includes('quota'))
      ) {
        throw new PhotoStorageError(
          PhotoStorageErrorCode.QUOTA_EXCEEDED,
          'localStorage quota exceeded',
          error
        );
      }

      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to store photo in localStorage',
        error
      );
    }
  }

  /**
   * Retrieve a photo and its metadata
   */
  async retrieve(
    id: string
  ): Promise<{ data: Blob | string; metadata: PhotoMetadata } | null> {
    try {
      const photoKey = `${this.prefix}${id}`;
      const metadataKey = `${this.metadataPrefix}${id}`;

      const base64Data = localStorage.getItem(photoKey);
      const metadataJson = localStorage.getItem(metadataKey);

      if (!base64Data || !metadataJson) {
        return null;
      }

      const metadata = safeJsonParse<PhotoMetadata | null>(metadataJson, null);
      if (!metadata) {
        return null;
      }

      // Update last accessed time
      await this.updateMetadata(id, { lastAccessed: getCurrentTimestamp() });

      // Return as Base64 string (will be converted to Blob URL when needed)
      return {
        data: base64Data,
        metadata,
      };
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to retrieve photo from localStorage',
        error
      );
    }
  }

  /**
   * Delete a photo and its metadata
   */
  async delete(id: string): Promise<void> {
    try {
      const photoKey = `${this.prefix}${id}`;
      const metadataKey = `${this.metadataPrefix}${id}`;

      localStorage.removeItem(photoKey);
      localStorage.removeItem(metadataKey);

      this.removeFromIndex(id);
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to delete photo from localStorage',
        error
      );
    }
  }

  /**
   * Get metadata for a photo
   */
  async getMetadata(id: string): Promise<PhotoMetadata | null> {
    try {
      const metadataKey = `${this.metadataPrefix}${id}`;
      const metadataJson = localStorage.getItem(metadataKey);

      if (!metadataJson) {
        return null;
      }

      return safeJsonParse<PhotoMetadata | null>(metadataJson, null);
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.METADATA_ERROR,
        'Failed to get metadata from localStorage',
        error
      );
    }
  }

  /**
   * Update metadata for a photo
   */
  async updateMetadata(
    id: string,
    metadata: Partial<PhotoMetadata>
  ): Promise<void> {
    try {
      const existing = await this.getMetadata(id);
      if (!existing) {
        throw new PhotoStorageError(
          PhotoStorageErrorCode.PHOTO_NOT_FOUND,
          `Photo with id ${id} not found`
        );
      }

      const updated = { ...existing, ...metadata };
      const metadataKey = `${this.metadataPrefix}${id}`;
      localStorage.setItem(metadataKey, JSON.stringify(updated));
    } catch (error) {
      if (error instanceof PhotoStorageError) {
        throw error;
      }

      throw new PhotoStorageError(
        PhotoStorageErrorCode.METADATA_ERROR,
        'Failed to update metadata in localStorage',
        error
      );
    }
  }

  /**
   * List all photo metadata
   */
  async listAll(): Promise<PhotoMetadata[]> {
    try {
      const index = this.getIndex();
      const metadataList: PhotoMetadata[] = [];

      for (const id of index) {
        const metadata = await this.getMetadata(id);
        if (metadata) {
          metadataList.push(metadata);
        }
      }

      return metadataList;
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to list photos from localStorage',
        error
      );
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      const allMetadata = await this.listAll();

      if (allMetadata.length === 0) {
        return {
          used: 0,
          available: 0,
          photoCount: 0,
          oldestPhoto: 0,
          newestPhoto: 0,
        };
      }

      const used = allMetadata.reduce((sum, meta) => sum + meta.size, 0);
      const timestamps = allMetadata.map((meta) => meta.createdAt);
      const oldestPhoto = Math.min(...timestamps);
      const newestPhoto = Math.max(...timestamps);

      // Estimate available localStorage space
      // localStorage typically has 5-10MB limit
      const estimatedQuota = 10 * 1024 * 1024; // 10MB
      const available = Math.max(0, estimatedQuota - used);

      return {
        used,
        available,
        photoCount: allMetadata.length,
        oldestPhoto,
        newestPhoto,
      };
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to get storage stats',
        error
      );
    }
  }

  /**
   * Check if localStorage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!('localStorage' in window)) {
        return false;
      }

      // Try to use localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all photos and metadata
   */
  async clear(): Promise<void> {
    try {
      const index = this.getIndex();

      // Remove all photos and metadata
      for (const id of index) {
        const photoKey = `${this.prefix}${id}`;
        const metadataKey = `${this.metadataPrefix}${id}`;
        localStorage.removeItem(photoKey);
        localStorage.removeItem(metadataKey);
      }

      // Clear index
      localStorage.removeItem(this.indexKey);
    } catch (error) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        'Failed to clear localStorage',
        error
      );
    }
  }
}
