/**
 * Lazy-loaded Feature Components
 * 
 * This file exports lazy-loaded versions of all complex feature components
 * to improve initial page load performance.
 * 
 * Validates: Requirements 2.1, 2.2, 5.1-5.3
 */

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './LoadingSkeleton';

// Loading fallback component for features
const FeatureLoadingFallback = () => (
  <div className="p-6">
    <LoadingSkeleton height="h-10" width="w-1/2" className="mb-6" />
    <div className="space-y-4">
      <LoadingSkeleton height="h-32" width="w-full" />
      <LoadingSkeleton height="h-32" width="w-full" />
    </div>
  </div>
);

// ============================================
// Complex Feature Components
// ============================================

/**
 * Lazy-loaded GamificationSystem
 * Validates: Requirements 5.1.1
 */
export const LazyGamificationSystem = dynamic(
  () => import('./GamificationSystem'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded LiveSpaces
 * Validates: Requirements 5.1.2
 */
export const LazyLiveSpaces = dynamic(
  () => import('./LiveSpaces'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded TimeCapsules
 * Validates: Requirements 5.1.3
 */
export const LazyTimeCapsules = dynamic(
  () => import('./TimeCapsules'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded CollaborativeFeatures
 * Validates: Requirements 5.1.4
 */
export const LazyCollaborativeFeatures = dynamic(
  () => import('./CollaborativeFeatures'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AIFeatures
 * Validates: Requirements 5.1.5
 */
export const LazyAIFeatures = dynamic(
  () => import('./AIFeatures'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AISuggestions
 * Validates: Requirements 5.1.6
 */
export const LazyAISuggestions = dynamic(
  () => import('./AISuggestions'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Search and Filter Components
// ============================================

/**
 * Lazy-loaded EnhancedSearchModal
 * Validates: Requirements 5.2.1
 */
export const LazyEnhancedSearchModal = dynamic(
  () => import('./EnhancedSearchModal'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ImprovedSearchModal
 * Validates: Requirements 5.2.2
 */
export const LazyImprovedSearchModal = dynamic(
  () => import('./ImprovedSearchModal'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded MoodFilter
 * Validates: Requirements 5.2.3
 */
export const LazyMoodFilter = dynamic(
  () => import('./MoodFilter'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Analytics Components
// ============================================

/**
 * Lazy-loaded ProfileAnalytics
 * Validates: Requirements 5.3.1
 */
export const LazyProfileAnalytics = dynamic(
  () => import('./ProfileAnalytics'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ReactionAnalytics
 * Validates: Requirements 5.3.2
 */
export const LazyReactionAnalytics = dynamic(
  () => import('./ReactionAnalytics'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded AnonymousInsights
 * Validates: Requirements 5.3.3
 */
export const LazyAnonymousInsights = dynamic(
  () => import('./AnonymousInsights'),
  {
    loading: () => <FeatureLoadingFallback />,
    ssr: false,
  }
);

export default {
  // Complex Features
  LazyGamificationSystem,
  LazyLiveSpaces,
  LazyTimeCapsules,
  LazyCollaborativeFeatures,
  LazyAIFeatures,
  LazyAISuggestions,
  // Search & Filter
  LazyEnhancedSearchModal,
  LazyImprovedSearchModal,
  LazyMoodFilter,
  // Analytics
  LazyProfileAnalytics,
  LazyReactionAnalytics,
  LazyAnonymousInsights,
};
