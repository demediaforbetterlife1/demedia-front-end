/**
 * Core types and interfaces for the photo storage system
 */

/**
 * Metadata associated with each stored photo
 */
export interface PhotoMetadata {
  id: string;              // UUID v4
  filename: string;        // Original filename
  mimeType: string;        // e.g., 'image/jpeg'
  size: number;            // Size in bytes
  width: number;           // Image width in pixels
  height: number;          // Image height in pixels
  createdAt: number;       // Unix timestamp
  lastAccessed: number;    // Unix timestamp
  postIds: string[];       // Array of post IDs referencing this photo
  compressed: boolean;     // Whether the photo was compressed
  originalSize?: number;   // Original size before compression
}

/**
 * Storage statistics
 */
export interface StorageStats {
  used: number;            // Bytes used
  available: number;       // Bytes available
  photoCount: number;      // Number of photos stored
  oldestPhoto: number;     // Timestamp of oldest photo
  newestPhoto: number;     // Timestamp of newest photo
}

/**
 * Storage adapter interface - implemented by IndexedDB and localStorage adapters
 */
export interface StorageAdapter {
  // Core operations
  store(id: string, data: Blob | string, metadata: PhotoMetadata): Promise<void>;
  retrieve(id: string): Promise<{ data: Blob | string; metadata: PhotoMetadata } | null>;
  delete(id: string): Promise<void>;
  
  // Metadata operations
  getMetadata(id: string): Promise<PhotoMetadata | null>;
  updateMetadata(id: string, metadata: Partial<PhotoMetadata>): Promise<void>;
  listAll(): Promise<PhotoMetadata[]>;
  
  // Storage info
  getStats(): Promise<StorageStats>;
  isAvailable(): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Storage type enum
 */
export type StorageType = 'indexeddb' | 'localstorage' | 'none';

/**
 * Compression options
 */
export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Default compression options
 */
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'image/jpeg',
};

/**
 * Storage configuration constants
 */
export const STORAGE_CONFIG = {
  // Database names
  INDEXEDDB_NAME: 'demedia-photos',
  INDEXEDDB_VERSION: 1,
  
  // Object store names
  PHOTO_STORE: 'photos',
  METADATA_STORE: 'metadata',
  
  // localStorage prefixes
  LOCALSTORAGE_PHOTO_PREFIX: 'demedia_photo_',
  LOCALSTORAGE_META_PREFIX: 'demedia_meta_',
  LOCALSTORAGE_INDEX_KEY: 'demedia_photo_index',
  
  // Size limits
  MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TOTAL_STORAGE: 100 * 1024 * 1024, // 100MB recommended
  
  // Compression thresholds
  COMPRESS_THRESHOLD: 1 * 1024 * 1024, // Compress if > 1MB
  
  // Timeouts
  OPERATION_TIMEOUT: 30000, // 30 seconds
} as const;
