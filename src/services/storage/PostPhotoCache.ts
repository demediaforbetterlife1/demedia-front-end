/**
 * Post Photo Cache Service
 * Stores photos by post ID for reliable retrieval
 * This ensures photos always display even if backend storage fails
 */

const DB_NAME = 'demedia-post-photos';
const DB_VERSION = 1;
const STORE_NAME = 'post_photos';

interface CachedPostPhoto {
  postId: string;
  photoIndex: number;
  base64Data: string;
  createdAt: number;
}

class PostPhotoCacheService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        console.warn('IndexedDB not available');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open PostPhotoCache DB:', request.error);
        resolve(); // Don't reject, just continue without cache
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ PostPhotoCache: IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: ['postId', 'photoIndex'] 
          });
          store.createIndex('postId', 'postId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store photos for a post
   */
  async storePhotosForPost(postId: string | number, photos: string[]): Promise<void> {
    await this.initialize();
    if (!this.db || !photos.length) return;

    const postIdStr = String(postId);
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        console.log(`✅ PostPhotoCache: Stored ${photos.length} photos for post ${postIdStr}`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to store photos:', transaction.error);
        resolve(); // Don't reject, continue without cache
      };

      photos.forEach((base64Data, index) => {
        if (base64Data && base64Data.startsWith('data:image/')) {
          const record: CachedPostPhoto = {
            postId: postIdStr,
            photoIndex: index,
            base64Data,
            createdAt: now,
          };
          store.put(record);
        }
      });
    });
  }

  /**
   * Get photos for a post
   */
  async getPhotosForPost(postId: string | number): Promise<string[]> {
    await this.initialize();
    if (!this.db) return [];

    const postIdStr = String(postId);

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('postId');
      const request = index.getAll(postIdStr);

      request.onsuccess = () => {
        const results = request.result as CachedPostPhoto[];
        // Sort by photoIndex and extract base64Data
        const photos = results
          .sort((a, b) => a.photoIndex - b.photoIndex)
          .map(r => r.base64Data);
        
        if (photos.length > 0) {
          console.log(`✅ PostPhotoCache: Retrieved ${photos.length} photos for post ${postIdStr}`);
        }
        resolve(photos);
      };

      request.onerror = () => {
        console.error('Failed to get photos:', request.error);
        resolve([]);
      };
    });
  }

  /**
   * Get a single photo for a post by index
   */
  async getPhotoForPost(postId: string | number, photoIndex: number): Promise<string | null> {
    await this.initialize();
    if (!this.db) return null;

    const postIdStr = String(postId);

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get([postIdStr, photoIndex]);

      request.onsuccess = () => {
        const result = request.result as CachedPostPhoto | undefined;
        resolve(result?.base64Data || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Delete photos for a post
   */
  async deletePhotosForPost(postId: string | number): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    const postIdStr = String(postId);

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('postId');
      const request = index.openCursor(postIdStr);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log(`🗑️ PostPhotoCache: Deleted photos for post ${postIdStr}`);
        resolve();
      };

      transaction.onerror = () => {
        resolve();
      };
    });
  }

  /**
   * Clean up old photos (older than 7 days)
   */
  async cleanupOldPhotos(): Promise<number> {
    await this.initialize();
    if (!this.db) return 0;

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    let deletedCount = 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        if (deletedCount > 0) {
          console.log(`🧹 PostPhotoCache: Cleaned up ${deletedCount} old photos`);
        }
        resolve(deletedCount);
      };

      transaction.onerror = () => {
        resolve(deletedCount);
      };
    });
  }
}

// Export singleton instance
export const postPhotoCache = new PostPhotoCacheService();
