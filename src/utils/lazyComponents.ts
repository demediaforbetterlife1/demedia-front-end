import dynamic from "next/dynamic";
import React from "react";

// Lazy load all major components with loading states

// Modals
export const LazyEditProfileModal = dynamic(
  () => import("@/app/layoutElementsComps/navdir/EditProfileModal"),
  { ssr: false }
);

export const LazyCreateStoryModal = dynamic(
  () => import("@/app/layoutElementsComps/navdir/CreateStoryModal"),
  { ssr: false }
);

export const LazyCreateDeSnapModal = dynamic(
  () => import("@/components/CreateDeSnapModal"),
  { ssr: false }
);

export const LazyAddPostModal = dynamic(
  () => import("@/app/layoutElementsComps/navdir/AddPostModal"),
  { ssr: false }
);

export const LazyCommentModal = dynamic(
  () => import("@/components/CommentModal"),
  { ssr: false }
);

export const LazyEditPostModal = dynamic(
  () => import("@/components/EditPostModal"),
  { ssr: false }
);

export const LazyPhotoUploadModal = dynamic(
  () => import("@/components/PhotoUploadModal"),
  { ssr: false }
);

// Viewers
export const LazyDeSnapsViewer = dynamic(
  () => import("@/components/DeSnapsViewer"),
  { ssr: false }
);

export const LazyMediaEditor = dynamic(
  () => import("@/components/MediaEditor"),
  { ssr: false }
);

// Lists and Feeds
export const LazyStoriesList = dynamic(
  () => import("@/components/StoriesList"),
  { 
    ssr: false, 
    loading: () => React.createElement('div', { 
      className: "animate-pulse h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" 
    })
  }
);

export const LazyFollowersList = dynamic(
  () => import("@/components/FollowersList"),
  { ssr: false }
);

export const LazyFollowersModal = dynamic(
  () => import("@/components/FollowersModal"),
  { ssr: false }
);

// Analytics and Features
export const LazyProfileAnalytics = dynamic(
  () => import("@/components/ProfileAnalytics"),
  { 
    ssr: false, 
    loading: () => React.createElement('div', { 
      className: "animate-pulse h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" 
    })
  }
);

export const LazyProfileCustomization = dynamic(
  () => import("@/components/ProfileCustomization"),
  { ssr: false }
);

export const LazyMoodFilter = dynamic(
  () => import("@/components/MoodFilter"),
  { ssr: false }
);

export const LazyLiveSpaces = dynamic(
  () => import("@/components/LiveSpaces"),
  { ssr: false }
);

export const LazyTimeCapsules = dynamic(
  () => import("@/components/TimeCapsules"),
  { ssr: false }
);

export const LazyEmotionTracker = dynamic(
  () => import("@/components/EmotionTracker"),
  { ssr: false }
);

export const LazyAISuggestions = dynamic(
  () => import("@/components/AISuggestions"),
  { ssr: false }
);

export const LazyAnonymousInsights = dynamic(
  () => import("@/components/AnonymousInsights"),
  { ssr: false }
);

// Premium Features
export const LazyPremiumUserIndicator = dynamic(
  () => import("@/components/PremiumUserIndicator"),
  { ssr: false }
);

// Posts Component
export const LazyPosts = dynamic(
  () => import("@/app/(PagesComps)/homedir/posts"),
  { 
    ssr: false, 
    loading: () => React.createElement('div', { 
      className: "space-y-4" 
    }, [1, 2, 3].map((i) => 
      React.createElement('div', { 
        key: i, 
        className: "animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl h-96" 
      })
    ))
  }
);

// Story Card
export const LazyStoryCard = dynamic(
  () => import("@/components/StoryCard"),
  { ssr: false }
);

// Media Image (already optimized but can be lazy loaded in lists)
export const LazyMediaImage = dynamic(
  () => import("@/components/MediaImage"),
  { ssr: false }
);
