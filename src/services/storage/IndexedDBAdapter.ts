/**
 * IndexedDB adapter for photo storage
 * Provides efficient storage of photos as Blobs with metadata
 */

import {
  StorageAdapter,
  PhotoMetadata,
  StorageStats,
  STORAGE_CONFIG,
} from './types';
import { PhotoStorageError, PhotoStorageErrorCode } from './errors';
import { getCurrentTimestamp } from './utils';

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private readonly dbName = STORAGE_CONFIG.INDEXEDDB_NAME;
  private readonly version = STORAGE_CONFIG.INDEXEDDB_VERSION;
  private readonly photoStore = STORAGE_CONFIG.PHOTO_STORE;
  private readonly metadataStore = STORAGE_CONFIG.METADATA_STORE;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.initPromise = null;
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.INITIALIZATION_FAILED,
            'Failed to open IndexedDB',
            request.error
          )
        );
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create photos object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.photoStore)) {
          db.createObjectStore(this.photoStore, { keyPath: 'id' });
        }

        // Create metadata object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.metadataStore)) {
          const metadataStore = db.createObjectStore(this.metadataStore, {
            keyPath: 'id',
          });

          // Create indexes for efficient queries
          metadataStore.createIndex('createdAt', 'createdAt', { unique: false });
          metadataStore.createIndex('lastAccessed', 'lastAccessed', {
            unique: false,
          });
          metadataStore.createIndex('postIds', 'postIds', {
            unique: false,
            multiEntry: true,
          });
        }
      };

      request.onblocked = () => {
        this.initPromise = null;
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.INITIALIZATION_FAILED,
            'IndexedDB initialization blocked'
          )
        );
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * Store a photo with its metadata
   */
  async store(
    id: string,
    data: Blob | string,
    metadata: PhotoMetadata
  ): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    // Convert string to Blob if necessary
    const blobData = typeof data === 'string' ? new Blob([data]) : data;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.photoStore, this.metadataStore],
        'readwrite'
      );

      transaction.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.UNKNOWN_ERROR,
            'Transaction failed',
            transaction.error
          )
        );
      };

      transaction.oncomplete = () => {
        resolve();
      };

      // Store photo data
      const photoStore = transaction.objectStore(this.photoStore);
      photoStore.put({ id, data: blobData });

      // Store metadata
      const metadataStore = transaction.objectStore(this.metadataStore);
      metadataStore.put(metadata);
    });
  }

  /**
   * Retrieve a photo and its metadata
   */
  async retrieve(
    id: string
  ): Promise<{ data: Blob | string; metadata: PhotoMetadata } | null> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.photoStore, this.metadataStore],
        'readonly'
      );

      let photoData: Blob | null = null;
      let metadata: PhotoMetadata | null = null;

      transaction.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.UNKNOWN_ERROR,
            'Transaction failed',
            transaction.error
          )
        );
      };

      transaction.oncomplete = () => {
        if (photoData && metadata) {
          // Update last accessed time
          this.updateMetadata(id, { lastAccessed: getCurrentTimestamp() }).catch(
            console.error
          );
          resolve({ data: photoData, metadata });
        } else {
          resolve(null);
        }
      };

      // Get photo data
      const photoStore = transaction.objectStore(this.photoStore);
      const photoRequest = photoStore.get(id);
      photoRequest.onsuccess = () => {
        if (photoRequest.result) {
          photoData = photoRequest.result.data;
        }
      };

      // Get metadata
      const metadataStore = transaction.objectStore(this.metadataStore);
      const metadataRequest = metadataStore.get(id);
      metadataRequest.onsuccess = () => {
        if (metadataRequest.result) {
          metadata = metadataRequest.result;
        }
      };
    });
  }

  /**
   * Delete a photo and its metadata
   */
  async delete(id: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.photoStore, this.metadataStore],
        'readwrite'
      );

      transaction.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.UNKNOWN_ERROR,
            'Transaction failed',
            transaction.error
          )
        );
      };

      transaction.oncomplete = () => {
        resolve();
      };

      // Delete photo data
      const photoStore = transaction.objectStore(this.photoStore);
      photoStore.delete(id);

      // Delete metadata
      const metadataStore = transaction.objectStore(this.metadataStore);
      metadataStore.delete(id);
    });
  }

  /**
   * Get metadata for a photo
   */
  async getMetadata(id: string): Promise<PhotoMetadata | null> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStore], 'readonly');
      const store = transaction.objectStore(this.metadataStore);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.METADATA_ERROR,
            'Failed to get metadata',
            request.error
          )
        );
      };
    });
  }

  /**
   * Update metadata for a photo
   */
  async updateMetadata(
    id: string,
    metadata: Partial<PhotoMetadata>
  ): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    const existing = await this.getMetadata(id);
    if (!existing) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.PHOTO_NOT_FOUND,
        `Photo with id ${id} not found`
      );
    }

    const updated = { ...existing, ...metadata };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStore], 'readwrite');
      const store = transaction.objectStore(this.metadataStore);
      const request = store.put(updated);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.METADATA_ERROR,
            'Failed to update metadata',
            request.error
          )
        );
      };
    });
  }

  /**
   * List all photo metadata
   */
  async listAll(): Promise<PhotoMetadata[]> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStore], 'readonly');
      const store = transaction.objectStore(this.metadataStore);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.UNKNOWN_ERROR,
            'Failed to list photos',
            request.error
          )
        );
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    await this.ensureInitialized();

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

    // Try to get available storage from navigator.storage API
    let available = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        available = quota - usage;
      } catch {
        // Fallback if estimate fails
        available = 0;
      }
    }

    return {
      used,
      available,
      photoCount: allMetadata.length,
      oldestPhoto,
      newestPhoto,
    };
  }

  /**
   * Check if IndexedDB is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!('indexedDB' in window)) {
        return false;
      }

      // Try to open a test database
      await this.initialize();
      return this.db !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear all photos and metadata
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new PhotoStorageError(
        PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
        'IndexedDB not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.photoStore, this.metadataStore],
        'readwrite'
      );

      transaction.onerror = () => {
        reject(
          new PhotoStorageError(
            PhotoStorageErrorCode.UNKNOWN_ERROR,
            'Transaction failed',
            transaction.error
          )
        );
      };

      transaction.oncomplete = () => {
        resolve();
      };

      // Clear photos
      const photoStore = transaction.objectStore(this.photoStore);
      photoStore.clear();

      // Clear metadata
      const metadataStore = transaction.objectStore(this.metadataStore);
      metadataStore.clear();
    });
  }
}
