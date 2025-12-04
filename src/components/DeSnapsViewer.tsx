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
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ensureAbsoluteMediaUrl } from "@/utils/mediaUtils";
import { normalizeDeSnap } from "@/utils/desnapUtils";
import { DeSnap } from "@/types/desnap";
import { videoDebugger } from "@/utils/videoDebugger";

interface DeSnapsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  deSnap: DeSnap;
  onDeSnapUpdated?: (updatedDeSnap: DeSnap) => void;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

    setIsSubmittingComment(true);
    try {
      const response = await apiFetch(
        `/api/desnaps/${deSnap.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content: newComment.trim() }),
        },
        user?.id,
      );

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");
        // Update comment count
        mergeAndEmitUpdate({ comments: deSnap.comments + 1 });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/90" onClick={onClose} />

        {/* DeSnap content */}
        <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>

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
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-black/90 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
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
                  className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
                  style={{
                    maxHeight: "calc(65vh - 200px)",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(6, 182, 212, 0.5) transparent",
                  }}
                >
                  {isLoadingComments ? (
                    <p className="text-gray-400 text-sm">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="text-white text-sm">
                        <div className="flex items-start gap-2">
                          {comment.user?.profilePicture ? (
                            <img
                              src={comment.user.profilePicture}
                              alt={comment.user.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-xs">
                                {comment.user?.name?.charAt(0) || "U"}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <span className="font-semibold">
                              {comment.user?.name || "Unknown"}
                            </span>
                            <span className="ml-2 text-gray-300">
                              {comment.content}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input */}
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    disabled={isSubmittingComment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmittingComment ? "..." : "Post"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
