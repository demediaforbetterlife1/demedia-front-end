"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Eye,
  Clock,
  Globe,
  Users,
  UserCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";
import { normalizeDeSnap } from "@/utils/desnapUtils";
import { DeSnap } from "@/types/desnap";
import { videoDebugger } from "@/utils/videoDebugger";
import ProfilePhoto from "@/components/ProfilePhoto";

interface DeSnapsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  deSnap: DeSnap;
  onDeSnapUpdated?: (updatedDeSnap: DeSnap) => void;
  // New props for scroll navigation
  allDeSnaps?: DeSnap[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

const visibilityIcons = {
  public: { icon: Globe, color: "text-green-400", label: "Public" },
  followers: { icon: Users, color: "text-blue-400", label: "Followers" },
  close_friends: {
    icon: UserCheck,
    color: "text-purple-400",
    label: "Close Friends",
  },
  premium: { icon: Sparkles, color: "text-yellow-400", label: "Premium" },
};

export default function DeSnapsViewer({
  isOpen,
  onClose,
  deSnap,
  onDeSnapUpdated,
  allDeSnaps = [],
  currentIndex = 0,
  onNavigate,
}: DeSnapsViewerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLiked, setIsLiked] = useState(deSnap.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(
    deSnap.isBookmarked || false,
  );
  const [likes, setLikes] = useState(deSnap.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [errorCount, setErrorCount] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigation helpers
  const hasNext = allDeSnaps.length > 0 && currentIndex < allDeSnaps.length - 1;
  const hasPrev = allDeSnaps.length > 0 && currentIndex > 0;

  const goToNext = useCallback(() => {
    if (hasNext && onNavigate && !isTransitioning) {
      setIsTransitioning(true);
      // Pause current video
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onNavigate(currentIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [hasNext, onNavigate, currentIndex, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (hasPrev && onNavigate && !isTransitioning) {
      setIsTransitioning(true);
      // Pause current video
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onNavigate(currentIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [hasPrev, onNavigate, currentIndex, isTransitioning]);

  // Handle scroll/swipe for navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll
      e.preventDefault();
      
      // Only navigate if not in comments section
      if (showComments) return;
      
      // Scroll down = next, scroll up = prev
      if (e.deltaY > 50) {
        goToNext();
      } else if (e.deltaY < -50) {
        goToPrev();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY === null || showComments) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      // Swipe up = next, swipe down = prev (threshold of 50px)
      if (diff > 50) {
        goToNext();
      } else if (diff < -50) {
        goToPrev();
      }
      
      setTouchStartY(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goToNext, goToPrev, touchStartY, showComments]);

  const mergeAndEmitUpdate = useCallback(
    (partial: Partial<DeSnap>) => {
      const merged = { ...deSnap, ...partial };
      const normalized = normalizeDeSnap(merged) || merged;
      onDeSnapUpdated?.(normalized as DeSnap);
      window.dispatchEvent(
        new CustomEvent("desnap:updated", {
          detail: { deSnap: normalized },
        }),
      );
    },
    [deSnap, onDeSnapUpdated],
  );

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const finalUrl = ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content;

      // Enhanced logging for debugging
      console.log("🎬 DeSnapsViewer - Video element initialized");
      console.log("📹 Raw content URL:", deSnap.content);
      console.log("🔗 Processed URL:", ensureAbsoluteMediaUrl(deSnap.content));
      console.log("🔗 Final video src:", finalUrl);
      console.log("✅ Video element ready state:", video.readyState);
      console.log("🌐 Network state:", video.networkState);

      // Run video diagnosis if there's an error
      if (videoError && !isDebugging) {
        setIsDebugging(true);
        videoDebugger
          .diagnoseVideo(finalUrl)
          .then((diagnosis) => {
            console.log("🔬 Video diagnosis results:", diagnosis);
            if (
              diagnosis.alternativeTests.some(
                (test) => test.status === "success",
              )
            ) {
              const workingUrl = diagnosis.alternativeTests.find(
                (test) => test.status === "success",
              )?.url;
              if (workingUrl && video.src !== workingUrl) {
                console.log(
                  "🔄 Switching to working alternative URL:",
                  workingUrl,
                );
                video.src = workingUrl;
              }
            }
            setIsDebugging(false);
          })
          .catch(() => setIsDebugging(false));
      }

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleLoadedData = () => {
        console.log("✅ Video loaded successfully:", video.src);
        console.log("⏱️ Video duration:", video.duration);
        // Clear any error state when video loads successfully
        setVideoError(null);
        setErrorCount(0);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          setLoadingTimeout(null);
        }
      };

      const handleLoadStart = () => {
        console.log("🔄 Video load started:", video.src);
        // Clear error when video starts loading
        if (videoError) {
          setVideoError(null);
        }
      };

      const handleCanPlay = () => {
        console.log("✅ Video can play:", video.src);
        // Clear error when video becomes playable
        setVideoError(null);
        setErrorCount(0);
      };

      const handleError = (e: Event) => {
        const errorDetails = {
          src: video.src,
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState,
        };
        console.error("❌ Video loading error:", errorDetails);

        // Increment error count but don't immediately show error
        setErrorCount((prev) => prev + 1);

        // Only show error after video has had sufficient time to load
        setTimeout(() => {
          if (video.readyState === 0 && video.networkState === 3) {
            const errorMessage = video.error?.message || "Video failed to load";
            setVideoError(errorMessage);
          }
        }, 8000); // Wait 8 seconds before showing error
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("loadstart", handleLoadStart);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);

      // Auto-play when viewer opens
      if (isOpen) {
        console.log("▶️ Attempting autoplay...");

        // Set a timeout to show loading error if video doesn't load within 15 seconds
        const timeout = setTimeout(() => {
          if (video.readyState === 0) {
            setVideoError("Video is taking too long to load");
          }
        }, 15000);
        setLoadingTimeout(timeout);

        // Wait a bit for video to be ready
        const attemptPlay = () => {
          if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA
            video
              .play()
              .then(() => {
                console.log("✅ Autoplay successful");
                setIsPlaying(true);
              })
              .catch((err) => {
                console.log("⚠️ Autoplay prevented:", err.message);
                setIsPlaying(false);
              });
          } else {
            console.log("⏳ Video not ready yet, waiting...");
            setTimeout(attemptPlay, 100);
          }
        };

        attemptPlay();
      }

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("loadstart", handleLoadStart);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      };
    }
  }, [isOpen, deSnap.content]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * deSnap.duration;

      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleLike = async () => {
    const newLiked = !isLiked;
    const newLikes = newLiked ? likes + 1 : likes - 1;

    setIsLiked(newLiked);
    setLikes(newLikes);

    // Update the DeSnap
    mergeAndEmitUpdate({ isLiked: newLiked, likes: newLikes });

    // Send API request to like/unlike
    try {
      await apiFetch(
        `/api/desnaps/${deSnap.id}/like`,
        {
          method: "POST",
          body: JSON.stringify({ liked: newLiked }),
        },
        user?.id,
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleBookmark = async () => {
    const newBookmarked = !isBookmarked;
    setIsBookmarked(newBookmarked);

    // Update the DeSnap
    mergeAndEmitUpdate({ isBookmarked: newBookmarked });

    // Send API request to bookmark/unbookmark
    try {
      await apiFetch(
        `/api/desnaps/${deSnap.id}/bookmark`,
        {
          method: "POST",
          body: JSON.stringify({ bookmarked: newBookmarked }),
        },
        user?.id,
      );
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Fetch comments for this DeSnap
  const fetchComments = async () => {
    if (isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const response = await apiFetch(
        `/api/desnaps/${deSnap.id}/comments`,
        {
          method: "GET",
        },
        user?.id,
      );
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Submit a comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    const commentContent = newComment.trim();
    
    console.log('📝 Submitting comment:', {
      deSnapId: deSnap.id,
      content: commentContent,
      userId: user?.id
    });

    // Optimistically add the comment to UI immediately
    const optimisticComment = {
      id: Date.now(), // Temporary ID
      content: commentContent,
      userId: user?.id,
      deSnapId: deSnap.id,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name || 'You',
        username: user?.username || 'user',
        profilePicture: user?.profilePicture || null
      }
    };
    
    // Add comment to UI immediately
    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment("");
    // Update comment count immediately
    mergeAndEmitUpdate({ comments: deSnap.comments + 1 });

    setIsSubmittingComment(true);
    try {
      const response = await apiFetch(
        `/api/desnaps/${deSnap.id}/comments`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: commentContent,
            userId: user?.id 
          }),
        },
        user?.id,
      );

      console.log('📡 Comment response:', response.status);

      if (response.ok) {
        const newCommentData = await response.json();
        console.log('✅ Comment created and saved:', newCommentData);
        
        // Replace optimistic comment with real one from server
        setComments((prev) => 
          prev.map(c => c.id === optimisticComment.id ? newCommentData : c)
        );
      } else {
        // API failed - remove the optimistic comment and revert count
        const errorText = await response.text();
        console.error('❌ Comment API failed:', response.status, errorText);
        
        // Remove the optimistic comment
        setComments((prev) => prev.filter(c => c.id !== optimisticComment.id));
        // Revert comment count
        mergeAndEmitUpdate({ comments: deSnap.comments });
        
        // Show error to user
        alert('Failed to save comment. Please try again.');
      }
    } catch (error) {
      // API error - remove the optimistic comment and revert count
      console.error("❌ Comment API error:", error);
      
      // Remove the optimistic comment
      setComments((prev) => prev.filter(c => c.id !== optimisticComment.id));
      // Revert comment count
      mergeAndEmitUpdate({ comments: deSnap.comments });
      
      // Show error to user
      alert('Failed to save comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Share DeSnap
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/desnaps/${deSnap.id}`;

      if (navigator.share) {
        await navigator.share({
          title: "Check out this DeSnap!",
          text: "Watch this DeSnap",
          url: shareUrl,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Download DeSnap
  const handleDownload = async () => {
    try {
      console.log('📥 Starting DeSnap download...');
      
      // Get the video URL
      const videoUrl = ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content;
      console.log('📹 Video URL:', videoUrl);
      
      // Get token for authentication
      const token = localStorage.getItem('token') || 
                    document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      if (!token) {
        alert('Please log in to download DeSnaps');
        return;
      }

      // Fetch the video with authentication headers
      const response = await fetch(videoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': user?.id?.toString() || '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the blob
      const blob = await response.blob();
      console.log('✅ Video blob received:', blob.size, 'bytes');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename
      const filename = `desnap-${deSnap.id}-${Date.now()}.mp4`;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Download started:', filename);
      
      // Show success message
      alert('Download started! Check your downloads folder.');
    } catch (error) {
      console.error('❌ Error downloading DeSnap:', error);
      alert('Failed to download DeSnap. Please try again.');
    }
  };

  // Load comments when comments section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const progress = (currentTime / deSnap.duration) * 100;
  const VisibilityIcon = visibilityIcons[deSnap.visibility].icon;
  const visibilityColor = visibilityIcons[deSnap.visibility].color;
  const visibilityLabel = visibilityIcons[deSnap.visibility].label;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden"
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/90" onClick={onClose} />

        {/* Navigation indicators */}
        {allDeSnaps.length > 1 && (
          <>
            {/* Progress dots */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1">
              {allDeSnaps.slice(0, Math.min(allDeSnaps.length, 10)).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1 bg-white/40'
                  }`}
                />
              ))}
              {allDeSnaps.length > 10 && (
                <span className="text-white/60 text-xs ml-1">+{allDeSnaps.length - 10}</span>
              )}
            </div>

            {/* Scroll hint - shows briefly */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 text-white/60 text-sm flex flex-col items-center gap-2"
            >
              <span>Scroll to see more</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: 3, duration: 1 }}
              >
                <ChevronRight className="w-5 h-5 rotate-90" />
              </motion.div>
            </motion.div>

            {/* Up arrow indicator */}
            {hasPrev && (
              <button
                onClick={goToPrev}
                className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 text-white/60 hover:text-white transition-colors p-2"
              >
                <ChevronLeft className="w-8 h-8 rotate-90" />
              </button>
            )}

            {/* Down arrow indicator */}
            {hasNext && (
              <button
                onClick={goToNext}
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 text-white/60 hover:text-white transition-colors p-2"
              >
                <ChevronRight className="w-8 h-8 rotate-90" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute top-4 right-16 z-20 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {allDeSnaps.length}
            </div>
          </>
        )}

        {/* DeSnap content */}
        <motion.div 
          key={deSnap.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full max-w-2xl mx-auto flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>

          {/* User Header */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-400/50">
              <ProfilePhoto
                src={deSnap.author?.profilePicture}
                alt={deSnap.author?.name || 'User'}
                width={40}
                height={40}
                userId={deSnap.author?.id}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* User Info */}
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">
                {deSnap.author?.name || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-xs">
                @{deSnap.author?.username || 'user'}
              </span>
            </div>
          </div>

          {/* Video container */}
          <div className="flex-1 flex items-center justify-center relative bg-black">
            <video
              ref={videoRef}
              src={ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content}
              className="w-full h-full object-contain max-h-[80vh]"
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              onClick={togglePlayPause}
              onLoadStart={() => {
                console.log(
                  "🔄 Video load started:",
                  ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content,
                );
                // Clear any existing error when video starts loading
                setVideoError(null);
              }}
              onCanPlay={() => {
                console.log(
                  "✅ Video can play:",
                  ensureAbsoluteMediaUrl(deSnap.content) || deSnap.content,
                );
                // Clear error when video becomes playable
                setVideoError(null);
              }}
              onError={(e) => {
                console.error("❌ Video element error event fired");
                const video = e.currentTarget;
                const originalUrl = deSnap.content;
                const processedUrl = ensureAbsoluteMediaUrl(deSnap.content);

                console.error("Video load error details:", {
                  originalUrl,
                  processedUrl,
                  currentSrc: video.src,
                  error: video.error,
                  code: video.error?.code,
                  message: video.error?.message,
                  networkState: video.networkState,
                  readyState: video.readyState,
                });

                // Try alternative URL formats with video debugger
                const alternatives =
                  videoDebugger.getAlternativeUrls(originalUrl);
                let triedAlternative = false;

                for (const altUrl of alternatives) {
                  if (altUrl !== video.src && !triedAlternative) {
                    console.log("🔄 Trying alternative URL:", altUrl);
                    video.src = altUrl;
                    triedAlternative = true;
                    break;
                  }
                }

                // Only show error if no alternatives worked and video is truly failed
                if (!triedAlternative) {
                  setTimeout(() => {
                    if (video.readyState === 0 && video.networkState === 3) {
                      const errorMessage =
                        video.error?.message || "Video failed to load";
                      setVideoError(errorMessage);
                    }
                  }, 5000);
                }

                // Only set error after trying alternatives and waiting
                if (!triedAlternative) {
                  setTimeout(() => {
                    if (video.readyState === 0) {
                      // Don't immediately set error - let the retry mechanism work first
                    }
                  }, 1000);
                }
              }}
            />

            {/* Loading indicator - show while video is loading */}
            {!videoError && videoRef.current?.readyState === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white p-6">
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}

            {/* Video error overlay - only show if video truly failed */}
            {videoError && videoRef.current?.readyState === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white p-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X size={32} className="text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Video Unavailable
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">{videoError}</p>
                    {isDebugging && (
                      <p className="text-blue-400 text-sm">Trying to fix...</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setVideoError(null);
                      setErrorCount(0);
                      if (videoRef.current) {
                        const finalUrl =
                          ensureAbsoluteMediaUrl(deSnap.content) ||
                          deSnap.content;
                        videoRef.current.src = finalUrl;
                        videoRef.current.load();
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Play/Pause overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause size={64} className="text-white" />
              ) : (
                <Play size={64} className="text-white" />
              )}
            </div>

            {/* Video controls */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              {/* Progress bar */}
              <div
                ref={progressRef}
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-2"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Time and controls */}
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center gap-4">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(deSnap.duration)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="hover:bg-white/20 rounded-full p-1 transition-colors"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DeSnap info and actions */}
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <div className="flex items-center justify-between">
              {/* Left side - Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <VisibilityIcon size={16} className={visibilityColor} />
                  <span className="text-white text-sm">{visibilityLabel}</span>
                </div>

                <div className="flex items-center gap-4 text-white text-sm">
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {deSnap.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(deSnap.duration)}
                  </span>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleLike}
                  className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                    isLiked ? "bg-red-500/20" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Heart
                    size={24}
                    className={
                      isLiked ? "text-red-400 fill-current" : "text-white"
                    }
                  />
                  <span className="text-white text-xs">{likes}</span>
                </button>

                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <MessageCircle size={24} className="text-white" />
                  <span className="text-white text-xs">{deSnap.comments}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                    isBookmarked
                      ? "bg-yellow-500/20"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Bookmark
                    size={24}
                    className={
                      isBookmarked
                        ? "text-yellow-400 fill-current"
                        : "text-white"
                    }
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Share size={24} className="text-white" />
                </button>

                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center gap-1 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Download DeSnap"
                >
                  <Download size={24} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Professional Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-black/90 backdrop-blur-2xl border-t border-white/10 shadow-2xl flex flex-col z-50"
                style={{
                  maxHeight: "65vh",
                  borderTopLeftRadius: "28px",
                  borderTopRightRadius: "28px",
                }}
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-14 h-1.5 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <MessageCircle size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">Comments</h4>
                        <p className="text-xs text-gray-400">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowComments(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
                    >
                      <X size={22} />
                    </motion.button>
                  </div>
                </div>

                {/* Comments List with Professional Styling */}
                <div 
                  className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(6, 182, 212, 0.5) transparent",
                  }}
                >
                  {isLoadingComments ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                        <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500/20 border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      </div>
                      <p className="text-gray-400 text-sm mt-4 font-medium">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                        <MessageCircle size={36} className="text-cyan-400" />
                      </div>
                      <p className="text-white text-base font-semibold mb-1">No comments yet</p>
                      <p className="text-gray-400 text-sm text-center max-w-xs">
                        Be the first to share your thoughts on this DeSnap!
                      </p>
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {comment.user?.profilePicture ? (
                              <img
                                src={ensureAbsoluteMediaUrl(comment.user.profilePicture) || comment.user.profilePicture}
                                alt={comment.user.name}
                                className="w-11 h-11 rounded-full ring-2 ring-cyan-400/30 object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center ring-2 ring-cyan-400/30">
                                <span className="text-white font-bold text-sm">
                                  {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-black" />
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="font-semibold text-white text-sm">
                                {comment.user?.name || "Unknown User"}
                              </span>
                              {comment.user?.username && (
                                <span className="text-xs text-gray-500">
                                  @{comment.user.username}
                                </span>
                              )}
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed break-words">
                              {comment.content}
                            </p>
                            
                            {/* Comment Actions */}
                            <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-xs text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                                <Heart size={12} />
                                Like
                              </button>
                              <button className="text-xs text-gray-400 hover:text-cyan-400 transition-colors">
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Enhanced Comment Input */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-white/10 bg-gradient-to-b from-black/50 to-black flex-shrink-0">
                  <form onSubmit={handleSubmitComment} className="flex gap-3 items-end">
                    {/* User Avatar */}
                    <div className="flex-shrink-0 hidden sm:block">
                      {user?.profilePicture ? (
                        <img
                          src={ensureAbsoluteMediaUrl(user.profilePicture) || user.profilePicture}
                          alt={user.name || "You"}
                          className="w-11 h-11 rounded-full ring-2 ring-cyan-400/30 object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center ring-2 ring-cyan-400/30">
                          <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || "Y"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Input Field */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full bg-white/10 text-white placeholder-gray-400 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:bg-white/15 transition-all backdrop-blur-sm border border-white/10"
                        disabled={isSubmittingComment}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* Always Visible Post Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-2xl hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 min-w-[80px] justify-center pointer-events-auto z-10"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {isSubmittingComment ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <MessageCircle size={16} />
                          <span className="hidden sm:inline">Post</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
