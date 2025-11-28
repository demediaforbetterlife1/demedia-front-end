/**
 * Video debugging utility to identify and fix video playback issues
 */

export interface VideoDebugInfo {
  url: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  networkState?: number;
  readyState?: number;
  canPlay: boolean;
  isAccessible: boolean;
  mimeType?: string;
  size?: number;
  duration?: number;
}

export class VideoDebugger {
  private static instance: VideoDebugger;
  private debugLog: VideoDebugInfo[] = [];

  static getInstance(): VideoDebugger {
    if (!VideoDebugger.instance) {
      VideoDebugger.instance = new VideoDebugger();
    }
    return VideoDebugger.instance;
  }

  /**
   * Test video URL accessibility and format
   */
  async testVideoUrl(url: string): Promise<VideoDebugInfo> {
    const debugInfo: VideoDebugInfo = {
      url,
      status: 'loading',
      canPlay: false,
      isAccessible: false,
    };

    console.log(`🔍 Testing video URL: ${url}`);

    try {
      // First, test if URL is accessible via fetch
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
      });

      debugInfo.isAccessible = response.ok;
      debugInfo.mimeType = response.headers.get('content-type') || undefined;
      debugInfo.size = parseInt(response.headers.get('content-length') || '0');

      console.log(`📊 URL accessibility test:`, {
        status: response.status,
        ok: response.ok,
        mimeType: debugInfo.mimeType,
        size: debugInfo.size,
      });

      if (!response.ok) {
        debugInfo.status = 'error';
        debugInfo.error = `HTTP ${response.status}: ${response.statusText}`;
        return debugInfo;
      }

      // Test video element compatibility
      const videoTest = await this.testVideoElement(url);
      Object.assign(debugInfo, videoTest);

    } catch (error) {
      console.error(`❌ URL test failed:`, error);
      debugInfo.status = 'error';
      debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.debugLog.push(debugInfo);
    return debugInfo;
  }

  /**
   * Test video element loading and playback
   */
  private async testVideoElement(url: string): Promise<Partial<VideoDebugInfo>> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.crossOrigin = 'anonymous';

      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);
        video.src = '';
      };

      const onLoadedData = () => {
        console.log(`✅ Video loaded successfully: ${url}`);
        cleanup();
        resolve({
          status: 'success',
          canPlay: true,
          duration: video.duration,
          networkState: video.networkState,
          readyState: video.readyState,
        });
      };

      const onCanPlay = () => {
        console.log(`✅ Video can play: ${url}`);
      };

      const onError = (e: Event) => {
        const videoError = (e.target as HTMLVideoElement).error;
        console.error(`❌ Video element error:`, {
          code: videoError?.code,
          message: videoError?.message,
          networkState: video.networkState,
          readyState: video.readyState,
        });
        cleanup();
        resolve({
          status: 'error',
          canPlay: false,
          error: videoError?.message || 'Video loading failed',
          networkState: video.networkState,
          readyState: video.readyState,
        });
      };

      // Set up listeners
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
      video.addEventListener('canplay', onCanPlay);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (video.readyState < 2) {
          cleanup();
          resolve({
            status: 'error',
            canPlay: false,
            error: 'Timeout loading video',
            networkState: video.networkState,
            readyState: video.readyState,
          });
        }
      }, 10000);

      // Start loading
      video.src = url;
    });
  }

  /**
   * Get suggested fixes based on debug results
   */
  getSuggestedFixes(debugInfo: VideoDebugInfo): string[] {
    const fixes: string[] = [];

    if (!debugInfo.isAccessible) {
      fixes.push('URL is not accessible - check if file exists and server is running');
    }

    if (debugInfo.mimeType && !this.isSupportedVideoFormat(debugInfo.mimeType)) {
      fixes.push(`Unsupported video format: ${debugInfo.mimeType}. Try MP4, WebM, or OGG`);
    }

    if (debugInfo.networkState === 3) {
      fixes.push('Network error - check CORS headers and network connectivity');
    }

    if (debugInfo.readyState === 0) {
      fixes.push('Video metadata not loaded - check video file integrity');
    }

    if (!debugInfo.canPlay) {
      fixes.push('Browser cannot play this video - try different format or codec');
    }

    return fixes;
  }

  /**
   * Check if video format is supported
   */
  private isSupportedVideoFormat(mimeType: string): boolean {
    const supportedFormats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ];

    return supportedFormats.some(format => mimeType.includes(format));
  }

  /**
   * Generate alternative URL formats to try
   */
  getAlternativeUrls(originalUrl: string): string[] {
    const alternatives: string[] = [];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://demedia-backend.fly.dev';

    // Try different URL formats
    if (originalUrl.startsWith('/')) {
      alternatives.push(`${backendUrl}${originalUrl}`);
    }

    if (!originalUrl.startsWith('http')) {
      alternatives.push(`${backendUrl}/${originalUrl}`);
      alternatives.push(`${backendUrl}/uploads/${originalUrl}`);
    }

    // Try with cache buster
    const separator = originalUrl.includes('?') ? '&' : '?';
    alternatives.push(`${originalUrl}${separator}t=${Date.now()}`);

    return alternatives;
  }

  /**
   * Comprehensive video diagnosis
   */
  async diagnoseVideo(url: string): Promise<{
    originalTest: VideoDebugInfo;
    alternativeTests: VideoDebugInfo[];
    suggestedFixes: string[];
    recommendation: string;
  }> {
    console.log(`🔬 Starting comprehensive video diagnosis for: ${url}`);

    // Test original URL
    const originalTest = await this.testVideoUrl(url);

    // If original fails, test alternatives
    const alternativeTests: VideoDebugInfo[] = [];
    if (originalTest.status === 'error') {
      const alternatives = this.getAlternativeUrls(url);
      for (const altUrl of alternatives) {
        if (altUrl !== url) {
          const altTest = await this.testVideoUrl(altUrl);
          alternativeTests.push(altTest);
          if (altTest.status === 'success') break; // Stop at first working alternative
        }
      }
    }

    // Get fixes for the original issue
    const suggestedFixes = this.getSuggestedFixes(originalTest);

    // Generate recommendation
    let recommendation = '';
    const workingAlternative = alternativeTests.find(test => test.status === 'success');

    if (originalTest.status === 'success') {
      recommendation = 'Video should work fine';
    } else if (workingAlternative) {
      recommendation = `Original URL failed, but this alternative works: ${workingAlternative.url}`;
    } else {
      recommendation = 'All URLs failed. Check video file and server configuration.';
    }

    const result = {
      originalTest,
      alternativeTests,
      suggestedFixes,
      recommendation,
    };

    console.log(`📋 Diagnosis complete:`, result);
    return result;
  }

  /**
   * Get debug log
   */
  getDebugLog(): VideoDebugInfo[] {
    return [...this.debugLog];
  }

  /**
   * Clear debug log
   */
  clearDebugLog(): void {
    this.debugLog = [];
  }

  /**
   * Export debug report
   */
  exportDebugReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      debugLog: this.debugLog,
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const videoDebugger = VideoDebugger.getInstance();

// Network state constants for reference
export const VIDEO_NETWORK_STATES = {
  EMPTY: 0,      // No information about the media resource
  IDLE: 1,       // Not actively loading
  LOADING: 2,    // Loading the media resource
  NO_SOURCE: 3   // No suitable source found
};

// Ready state constants for reference
export const VIDEO_READY_STATES = {
  HAVE_NOTHING: 0,       // No information available
  HAVE_METADATA: 1,      // Metadata loaded
  HAVE_CURRENT_DATA: 2,  // Current position data available
  HAVE_FUTURE_DATA: 3,   // Current and future data available
  HAVE_ENOUGH_DATA: 4    // Enough data to start playing
};
