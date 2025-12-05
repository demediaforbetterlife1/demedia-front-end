/**
 * Error handling for photo storage system
 */

/**
 * Error codes for photo storage operations
 */
export enum PhotoStorageErrorCode {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PHOTO_NOT_FOUND = 'PHOTO_NOT_FOUND',
  INVALID_FILE = 'INVALID_FILE',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  METADATA_ERROR = 'METADATA_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for photo storage operations
 */
export class PhotoStorageError extends Error {
  public readonly code: PhotoStorageErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: number;

  constructor(
    code: PhotoStorageErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'PhotoStorageError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PhotoStorageError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case PhotoStorageErrorCode.STORAGE_UNAVAILABLE:
        return 'Photo storage is not available in your browser. Please enable storage or try a different browser.';
      
      case PhotoStorageErrorCode.QUOTA_EXCEEDED:
        return 'Storage space is full. Please delete some photos to free up space.';
      
      case PhotoStorageErrorCode.PHOTO_NOT_FOUND:
        return 'Photo not found. It may have been deleted.';
      
      case PhotoStorageErrorCode.INVALID_FILE:
        return 'Invalid file. Please select a valid image file (JPG, PNG, GIF, WebP).';
      
      case PhotoStorageErrorCode.COMPRESSION_FAILED:
        return 'Failed to compress image. The file may be corrupted or too large.';
      
      case PhotoStorageErrorCode.STORAGE_CORRUPTED:
        return 'Storage data is corrupted. Some photos may be unavailable.';
      
      case PhotoStorageErrorCode.OPERATION_TIMEOUT:
        return 'Operation timed out. Please try again.';
      
      case PhotoStorageErrorCode.INITIALIZATION_FAILED:
        return 'Failed to initialize storage. Please refresh the page.';
      
      case PhotoStorageErrorCode.METADATA_ERROR:
        return 'Failed to read photo information. The photo may be corrupted.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return [
      PhotoStorageErrorCode.OPERATION_TIMEOUT,
      PhotoStorageErrorCode.COMPRESSION_FAILED,
    ].includes(this.code);
  }

  /**
   * Check if error requires user action
   */
  requiresUserAction(): boolean {
    return [
      PhotoStorageErrorCode.QUOTA_EXCEEDED,
      PhotoStorageErrorCode.STORAGE_UNAVAILABLE,
      PhotoStorageErrorCode.INVALID_FILE,
    ].includes(this.code);
  }
}

/**
 * Helper function to create PhotoStorageError from unknown error
 */
export function toPhotoStorageError(error: unknown): PhotoStorageError {
  if (error instanceof PhotoStorageError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for quota exceeded errors
    if (
      error.name === 'QuotaExceededError' ||
      error.message.includes('quota') ||
      error.message.includes('storage')
    ) {
      return new PhotoStorageError(
        PhotoStorageErrorCode.QUOTA_EXCEEDED,
        'Storage quota exceeded',
        error
      );
    }

    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return new PhotoStorageError(
        PhotoStorageErrorCode.OPERATION_TIMEOUT,
        'Operation timed out',
        error
      );
    }

    // Generic error conversion
    return new PhotoStorageError(
      PhotoStorageErrorCode.UNKNOWN_ERROR,
      error.message,
      error
    );
  }

  // Unknown error type
  return new PhotoStorageError(
    PhotoStorageErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    error
  );
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a recoverable error
      if (error instanceof PhotoStorageError && !error.isRecoverable()) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}
