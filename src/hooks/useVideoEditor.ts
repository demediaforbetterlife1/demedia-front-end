/**
 * Video Editor Hook
 * Manages video editing state and operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { videoProcessingService, VideoMetadata, TrimData } from '@/services/videoProcessingService';
import { TextOverlay, StickerOverlay } from '@/services/imageProcessingService';

export interface VideoEditorState {
  video: HTMLVideoElement | null;
  videoUrl: string | null;
  metadata: VideoMetadata | null;
  trimData: TrimData | null;
  speed: number;
  volume: number;
  isMuted: boolean;
  textOverlays: TextOverlay[];
  stickers: StickerOverlay[];
  selectedFilter: string;
  coverFrameTime: number;
  coverFrameUrl: string | null;
  aspectRatio: number | null;
  isPlaying: boolean;
  currentTime: number;
  isProcessing: boolean;
}

export function useVideoEditor(file: File | null) {
  const [state, setState] = useState<VideoEditorState>({
    video: null,
    videoUrl: null,
    metadata: null,
    trimData: null,
    speed: 1,
    volume: 1,
    isMuted: false,
    textOverlays: [],
    stickers: [],
    selectedFilter: 'normal',
    coverFrameTime: 0,
    coverFrameUrl: null,
    aspectRatio: null,
    isPlaying: false,
    currentTime: 0,
    isProcessing: false
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load video from file
  useEffect(() => {
    if (!file) return;

    const loadVideo = async () => {
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        const video = await videoProcessingService.loadVideo(file);
        const metadata = await videoProcessingService.getMetadata(video);
        const videoUrl = videoProcessingService.createVideoUrl(file);
        
        // Generate initial cover frame
        const coverFrame = await videoProcessingService.generateThumbnail(video, 1);

        setState(prev => ({
          ...prev,
          video,
          videoUrl,
          metadata,
          coverFrameTime: 1,
          coverFrameUrl: coverFrame,
          trimData: { start: 0, end: metadata.duration },
          isProcessing: false
        }));

        videoRef.current = video;
      } catch (error) {
        console.error('Failed to load video:', error);
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    };

    loadVideo();

    return () => {
      if (state.videoUrl) {
        videoProcessingService.revokeVideoUrl(state.videoUrl);
      }
    };
  }, [file]);

  // Set trim data
  const setTrim = useCallback((trimData: TrimData) => {
    setState(prev => ({ ...prev, trimData }));
  }, []);

  // Set playback speed
  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted;
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  // Play/pause video
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }

    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying]);

  // Seek to time
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  // Set cover frame
  const setCoverFrame = useCallback(async (time: number) => {
    if (!state.video) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const coverFrame = await videoProcessingService.generateThumbnail(state.video, time);
      setState(prev => ({
        ...prev,
        coverFrameTime: time,
        coverFrameUrl: coverFrame,
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to set cover frame:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.video]);

  // Set aspect ratio
  const setAspectRatio = useCallback((aspectRatio: number | null) => {
    setState(prev => ({ ...prev, aspectRatio }));
  }, []);

  // Add text overlay
  const addText = useCallback((text: TextOverlay) => {
    setState(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, text]
    }));
  }, []);

  // Update text overlay
  const updateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  }, []);

  // Remove text overlay
  const removeText = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.filter(t => t.id !== id)
    }));
  }, []);

  // Add sticker
  const addSticker = useCallback((sticker: StickerOverlay) => {
    setState(prev => ({
      ...prev,
      stickers: [...prev.stickers, sticker]
    }));
  }, []);

  // Update sticker
  const updateSticker = useCallback((id: string, updates: Partial<StickerOverlay>) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
  }, []);

  // Remove sticker
  const removeSticker = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }));
  }, []);

  // Apply filter
  const applyFilter = useCallback((filterName: string) => {
    setState(prev => ({ ...prev, selectedFilter: filterName }));
  }, []);

  // Get trimmed duration
  const getTrimmedDuration = useCallback((): number => {
    if (!state.trimData || !state.metadata) return 0;
    return videoProcessingService.getTrimmedDuration(
      state.metadata.duration,
      state.trimData
    );
  }, [state.trimData, state.metadata]);

  // Get adjusted duration (with speed)
  const getAdjustedDuration = useCallback((): number => {
    const trimmedDuration = getTrimmedDuration();
    return videoProcessingService.getAdjustedDuration(trimmedDuration, state.speed);
  }, [getTrimmedDuration, state.speed]);

  // Export video metadata (actual video processing would happen on backend)
  const exportVideo = useCallback(async (): Promise<{
    file: File;
    thumbnail: string;
    duration: number;
    settings: any;
  } | null> => {
    if (!file || !state.coverFrameUrl) return null;

    try {
      const duration = getAdjustedDuration();

      // In a real implementation, you would:
      // 1. Send video + edit settings to backend
      // 2. Backend processes video with FFmpeg
      // 3. Return processed video URL
      
      // For now, we return the original file with metadata
      const settings = {
        trim: state.trimData,
        speed: state.speed,
        volume: state.volume,
        muted: state.isMuted,
        textOverlays: state.textOverlays,
        stickers: state.stickers,
        filter: state.selectedFilter,
        aspectRatio: state.aspectRatio,
        coverFrameTime: state.coverFrameTime
      };

      return {
        file,
        thumbnail: state.coverFrameUrl,
        duration,
        settings
      };
    } catch (error) {
      console.error('Failed to export video:', error);
      return null;
    }
  }, [file, state, getAdjustedDuration]);

  // Reset editor
  const reset = useCallback(() => {
    if (!state.metadata) return;

    setState(prev => ({
      ...prev,
      trimData: { start: 0, end: prev.metadata!.duration },
      speed: 1,
      volume: 1,
      isMuted: false,
      textOverlays: [],
      stickers: [],
      selectedFilter: 'normal',
      aspectRatio: null,
      isPlaying: false,
      currentTime: 0
    }));

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
    }
  }, [state.metadata]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.video) {
        videoProcessingService.cleanup(state.video);
      }
    };
  }, [state.video]);

  return {
    state,
    videoRef,
    actions: {
      setTrim,
      setSpeed,
      setVolume,
      toggleMute,
      togglePlayPause,
      seekTo,
      setCoverFrame,
      setAspectRatio,
      addText,
      updateText,
      removeText,
      addSticker,
      updateSticker,
      removeSticker,
      applyFilter,
      exportVideo,
      reset
    },
    getTrimmedDuration,
    getAdjustedDuration
  };
}