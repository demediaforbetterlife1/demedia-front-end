"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry?: () => void) => ReactNode);
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call onError callback if provided
    this.props.onError?.(error);
    
    // Handle specific THREE.js errors
    if (error.message.includes('Cannot read properties of null (reading \'position\')')) {
      console.warn('THREE.js position error handled by ErrorBoundary');
      this.setState({ hasError: false });
      return;
    }

    // Log lazy component loading errors
    if (error.message.includes('Failed to import') || error.message.includes('dynamic')) {
      console.error('[ErrorBoundary] Lazy component loading error:', error.message);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      // If fallback is a function, call it with error and retry
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.handleRetry);
      }

      // If fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-2">
              We're sorry, but something unexpected happened.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {this.state.error.message}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
