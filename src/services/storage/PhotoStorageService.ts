/**
 * Main photo storage service
 * Provides a clean API for photo operations with automatic fallback
 */

import { StorageAdapter, PhotoMetadata, StorageStats, StorageType, STORAGE_CONFIG } from './types';
import { PhotoStorageError, PhotoStorageErrorCode } from './errors';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { ImageCompressor } from './ImageCompressor';
import {
  generatePhotoId,
  isValidImageFile,
  validateFileSize,
  createBlobUrl,
  base64ToBlob,
  getCurrentTimestamp,
  hasEnoughSpace,
} from './utils';

export class PhotoStorageService {
  private adapter: StorageAdapter | null = null;
  private storageType: StorageType = 'none';
  private compressor: ImageCompressor;
  private initPromise: Promise<void> | null = null;
  private blobUrlCache: Map<string, string> = new Map();

  constructor() {
    this.compressor = new ImageCompressor();
  }

  /**
   * Initialize the storage service
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.adapter) {
      return Promise.resolve();
    }

    this.initPromise = (async () => {
      // Try IndexedDB first
      const indexedDBAdapter = new IndexedDBAdapter();
      const indexedDBAvailable = await indexedDBAdapter.isAvailable();

      if (indexedDBAvailable) {
        await indexedDBAdapter.initialize();
        this.adapter = indexedDBAdapter;
        this.storageType = 'indexeddb';
        console.log('✅ PhotoStorageService: Using IndexedDB');
        return;
      }

      // Fall back to localStorage
      const localStorageAdapter = new LocalStorageAdapter();
      const localStorageAvailable = await localStorageAdapter.isAvailable();

      if (localStorageAvailable) {
        this.adapter = localStorageAdapter;
        this.storageType = 'localstorage';
        console.log('⚠️ PhotoStorageService: Using localStorage fallback');
        return;
      }

      // No storage available
      this.storageType = 'none';
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'No storage mechanism available'
      );
    })();

    return this.initPromise;
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.adapter) {
      await this.initialize();
    }

    if (!this.adapter) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'Storage service not initialized'
      );
    }
  }

  /**
   * Store a photo
   */
  async storePhoto(file: File): Promise<string> {
    await this.ensureInitialized();

    // Validate file
    if (!isValidImageFile(file)) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.INVALID_FILE,
        'Invalid image file'
      );
    }

    // Check storage space
    const hasSpace = await hasEnoughSpace(file.size);
    if (!hasSpace) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.QUOTA_EXCEEDED,
        'Insufficient storage space'
      );
    }

    // Generate unique ID
    const id = generatePhotoId();

    try {
      // Get image dimensions
      const { width, height } = await this.compressor.getImageDimensions(file);

      // Determine if compression is needed
      const shouldCompress = this.compressor.shouldCompress(
        file,
        STORAGE_CONFIG.COMPRESS_THRESHOLD
      );

      let dataToStore: Blob | string;
      let finalSize: number;
      let compressed = false;

      if (shouldCompress) {
        console.log(`📦 Compressing image ${file.name}...`);
        const quality = this.compressor.getOptimalQuality(file.size);
        const compressedBlob = await this.compressor.compress(file, { quality });
        dataToStore = compressedBlob;
        finalSize = compressedBlob.size;
        compressed = true;
        console.log(
          `✅ Compressed ${file.name}: ${file.size} → ${finalSize} bytes (${Math.round((1 - finalSize / file.size) * 100)}% reduction)`
        );
      } else {
        dataToStore = file;
        finalSize = file.size;
      }

      // Validate final size
      validateFileSize(
        new File([dataToStore], file.name),
        STORAGE_CONFIG.MAX_PHOTO_SIZE
      );

      // Create metadata
      const metadata: PhotoMetadata = {
        id,
        filename: file.name,
        mimeType: file.type,
        size: finalSize,
        width,
        height,
        createdAt: getCurrentTimestamp(),
        lastAccessed: getCurrentTimestamp(),
        postIds: [],
        compressed,
        originalSize: compressed ? file.size : undefined,
      };

      // Store photo
      await this.adapter!.store(id, dataToStore, metadata);

      console.log(`✅ Stored photo ${id} (${file.name})`);
      return id;
    } catch (error) {
      console.error(`❌ Failed to store photo:`, error);
      throw error;
    }
  }

  /**
   * Store multiple photos in parallel
   */
  async storePhotos(files: File[]): Promise<string[]> {
    const results = await Promise.allSettled(
      files.map((file) => this.storePhoto(file))
    );

    const photoIds: string[] = [];
    const errors: Error[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        photoIds.push(result.value);
      } else {
        console.error(`Failed to store photo ${index}:`, result.reason);
        errors.push(result.reason);
      }
    });

    if (errors.length > 0 && photoIds.length === 0) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.UNKNOWN_ERROR,
        `Failed to store all photos: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    return photoIds;
  }

  /**
   * Get a displayable URL for a photo
   */
  async getPhotoUrl(photoId: string): Promise<string> {
    await this.ensureInitialized();

    // Check cache first
    if (this.blobUrlCache.has(photoId)) {
      return this.blobUrlCache.get(photoId)!;
    }

    try {
      const result = await this.adapter!.retrieve(photoId);

      if (!result) {
        throw new PhotoStorageError(
          PhotoStorageErrorCode.PHOTO_NOT_FOUND,
          `Photo ${photoId} not found`
        );
      }

      // Convert to Blob URL
      let blobUrl: string;
      if (typeof result.data === 'string') {
        // Base64 string from localStorage
        const blob = base64ToBlob(result.data);
        blobUrl = createBlobUrl(blob);
      } else {
        // Blob from IndexedDB
        blobUrl = createBlobUrl(result.data);
      }

      // Cache the URL
      this.blobUrlCache.set(photoId, blobUrl);

      return blobUrl;
    } catch (error) {
      console.error(`❌ Failed to get photo URL for ${photoId}:`, error);
      throw error;
    }
  }

  /**
   * Get photo metadata
   */
  async getPhotoMetadata(photoId: string): Promise<PhotoMetadata | null> {
    await this.ensureInitialized();
    return this.adapter!.getMetadata(photoId);
  }

  /**
   * Get all photos
   */
  async getAllPhotos(): Promise<PhotoMetadata[]> {
    await this.ensureInitialized();
    return this.adapter!.listAll();
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    await this.ensureInitialized();

    // Revoke blob URL if cached
    if (this.blobUrlCache.has(photoId)) {
      const url = this.blobUrlCache.get(photoId)!;
      URL.revokeObjectURL(url);
      this.blobUrlCache.delete(photoId);
    }

    await this.adapter!.delete(photoId);
    console.log(`🗑️ Deleted photo ${photoId}`);
  }

  /**
   * Delete multiple photos
   */
  async deletePhotos(photoIds: string[]): Promise<void> {
    await Promise.all(photoIds.map((id) => this.deletePhoto(id)));
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    await this.ensureInitialized();
    return this.adapter!.getStats();
  }

  /**
   * Clean up orphaned photos (photos with no post references)
   */
  async cleanupOrphanedPhotos(): Promise<number> {
    await this.ensureInitialized();

    const allPhotos = await this.getAllPhotos();
    const orphanedPhotos = allPhotos.filter(
      (photo) => photo.postIds.length === 0
    );

    console.log(
      `🧹 Cleaning up ${orphanedPhotos.length} orphaned photos...`
    );

    await this.deletePhotos(orphanedPhotos.map((p) => p.id));

    return orphanedPhotos.length;
  }

  /**
   * Add post reference to a photo
   */
  async addPostReference(photoId: string, postId: string): Promise<void> {
    await this.ensureInitialized();

    const metadata = await this.getPhotoMetadata(photoId);
    if (!metadata) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.PHOTO_NOT_FOUND,
        `Photo ${photoId} not found`
      );
    }

    if (!metadata.postIds.includes(postId)) {
      metadata.postIds.push(postId);
      await this.adapter!.updateMetadata(photoId, { postIds: metadata.postIds });
    }
  }

  /**
   * Remove post reference from a photo
   */
  async removePostReference(photoId: string, postId: string): Promise<void> {
    await this.ensureInitialized();

    const metadata = await this.getPhotoMetadata(photoId);
    if (!metadata) {
      return; // Photo already deleted
    }

    const updatedPostIds = metadata.postIds.filter((id) => id !== postId);
    await this.adapter!.updateMetadata(photoId, { postIds: updatedPostIds });

    // If no more references, mark for cleanup
    if (updatedPostIds.length === 0) {
      console.log(`📌 Photo ${photoId} has no more references`);
    }
  }

  /**
   * Check if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return this.adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current storage type
   */
  getStorageType(): StorageType {
    return this.storageType;
  }

  /**
   * Clear blob URL cache
   */
  clearBlobUrlCache(): void {
    this.blobUrlCache.forEach((url) => URL.revokeObjectURL(url));
    this.blobUrlCache.clear();
  }
}

// Export singleton instance
export const photoStorageService = new PhotoStorageService();
