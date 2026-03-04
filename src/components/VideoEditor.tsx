"use client";

import React, { useState, useRef, useEffect } from 'react';

interface VideoEditorProps {
  file: File;
  onSave: (file: File, thumbnail: string, duration: { start: number; end: number }) => void;
  onCancel: () => void;
}

export default function VideoEditor({ file, onSave, onCancel }: VideoEditorProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Video state
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = [
    { name: 'Original', value: 'none' },
    { name: 'B&W', value: 'grayscale' },
    { name: 'Sepia', value: 'sepia' },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Cool', value: 'cool' },
    { name: 'Warm', value: 'warm' },
  ];

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);
      setTrimEnd(dur);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // Loop within trim range
      if (time >= trimEnd) {
        video.currentTime = trimStart;
        if (!isPlaying) {
          video.pause();
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [trimStart, trimEnd, isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Start from trim start if at the end
      if (video.currentTime >= trimEnd || video.currentTime < trimStart) {
        video.currentTime = trimStart;
      }
      video.play();
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFilterStyle = (): string => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    switch (selectedFilter) {
      case 'grayscale':
        filterString += ' grayscale(100%)';
        break;
      case 'sepia':
        filterString += ' sepia(100%)';
        break;
      case 'vintage':
        filterString += ' sepia(50%) contrast(120%) brightness(90%)';
        break;
      case 'cool':
        filterString += ' hue-rotate(180deg) saturate(150%)';
        break;
      case 'warm':
        filterString += ' hue-rotate(-30deg) saturate(120%)';
        break;
    }

    return filterString;
  };

  const captureThumbnail = async (): Promise<string> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        resolve('');
        return;
      }

      // Seek to trim start for thumbnail
      video.currentTime = trimStart;
      
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Apply filters to thumbnail
        ctx.filter = getFilterStyle();
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve('');
          }
        }, 'image/jpeg', 0.8);
      }, 100);
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);

    try {
      // Capture thumbnail
      const thumbnail = await captureThumbnail();
      
      // Pass the original file with trim metadata
      // Note: Actual video trimming would require server-side processing with FFmpeg
      onSave(file, thumbnail, { start: trimStart, end: trimEnd });
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video');
    } finally {
      setIsProcessing(false);
    }
  };

  const trimDuration = trimEnd - trimStart;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ✕ Cancel
        </button>
        <h2 className="text-white font-semibold">Edit Video</h2>
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
        >
          {isProcessing ? '...' : '✓ Save'}
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="relative max-w-full max-h-full">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-[60vh]"
            style={{ filter: getFilterStyle() }}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl hover:bg-opacity-70"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Time Display */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4 max-h-[40vh] overflow-y-auto">
        {/* Playback Controls */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300 text-xs">
            <span>Playback</span>
            <span>{formatTime(currentTime)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Trim Controls */}
        <div className="space-y-3">
          <h3 className="text-white text-sm font-semibold">Trim Video</h3>
          
          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Start</span>
              <span>{formatTime(trimStart)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={trimStart}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value < trimEnd) {
                  setTrimStart(value);
                  seekTo(value);
                }
              }}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>End</span>
              <span>{formatTime(trimEnd)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={trimEnd}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > trimStart) {
                  setTrimEnd(value);
                }
              }}
              className="w-full"
            />
          </div>

          <div className="bg-gray-800 p-2 rounded text-center">
            <span className="text-white text-sm">
              Duration: {formatTime(trimDuration)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-2">Filters</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2 rounded whitespace-nowrap text-sm ${
                  selectedFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments */}
        <div className="space-y-3">
          <h3 className="text-white text-sm font-semibold">Adjust</h3>
          
          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Brightness</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Contrast</span>
              <span>{contrast}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Saturation</span>
              <span>{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTrimStart(0);
              setTrimEnd(duration);
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
              setSelectedFilter('none');
            }}
            className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
          >
            ↺ Reset All
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-3 rounded text-xs text-blue-200">
          <p>💡 Tip: Video will be trimmed from {formatTime(trimStart)} to {formatTime(trimEnd)}</p>
        </div>
      </div>
    </div>
  );
}
