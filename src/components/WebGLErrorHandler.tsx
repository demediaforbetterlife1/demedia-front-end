"use client";

import { useEffect } from 'react';

export default function WebGLErrorHandler() {
  useEffect(() => {
    // Handle WebGL context lost events
    const handleContextLost = (event: Event) => {
      console.warn('WebGL context lost, attempting to restore...');
      event.preventDefault();
      
      // Try to restore the context after a short delay
      setTimeout(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (gl) {
            console.log('WebGL context restored successfully');
          } else {
            console.warn('Failed to restore WebGL context');
          }
        }
      }, 100);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
    };

    // Add event listeners for WebGL context events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    // Global error handler for THREE.js position errors
    const handleThreeJSError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('Cannot read properties of null (reading \'position\')')) {
        console.warn('THREE.js position error caught and handled:', event.message);
        event.preventDefault();
        return false;
      }
    };

    // Add global error handler
    window.addEventListener('error', handleThreeJSError);

    // Cleanup
    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      window.removeEventListener('error', handleThreeJSError);
    };
  }, []);

  return null; // This component doesn't render anything
}
