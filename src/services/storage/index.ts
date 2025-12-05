/**
 * Photo storage service exports
 */

export * from './types';
export * from './errors';
export * from './utils';
export * from './IndexedDBAdapter';
export * from './LocalStorageAdapter';
export * from './ImageCompressor';
export * from './PhotoStorageService';

// Export singleton instance as default
export { photoStorageService as default } from './PhotoStorageService';
