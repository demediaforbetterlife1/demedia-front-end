import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './LoadingSkeleton';

// Loading fallback component for modals
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md">
      <LoadingSkeleton height="h-8" width="w-3/4" className="mb-4" />
      <LoadingSkeleton height="h-4" width="w-full" className="mb-2" />
      <LoadingSkeleton height="h-4" width="w-5/6" />
    </div>
  </div>
);

/**
 * Lazy-loaded CreateContentModal
 * Validates: Requirements 3.1
 */
export const LazyCreateContentModal = dynamic(
  () => import('./CreateContentModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded CommentModal
 * Validates: Requirements 3.2
 */
export const LazyCommentModal = dynamic(
  () => import('./CommentModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded EditPostModal
 * Validates: Requirements 3.3
 */
export const LazyEditPostModal = dynamic(
  () => import('./EditPostModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ReportModal
 * Validates: Requirements 3.4
 */
export const LazyReportModal = dynamic(
  () => import('./ReportModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded PhotoUploadModal
 * Validates: Requirements 3.5
 */
export const LazyPhotoUploadModal = dynamic(
  () => import('./PhotoUploadModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ThemeModal
 * Validates: Requirements 3.6
 */
export const LazyThemeModal = dynamic(
  () => import('./ThemeModal').then(mod => ({ default: mod.ThemeModal })),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

export default {
  LazyCreateContentModal,
  LazyCommentModal,
  LazyEditPostModal,
  LazyReportModal,
  LazyPhotoUploadModal,
  LazyThemeModal,
};