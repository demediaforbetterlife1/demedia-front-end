"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onError?: () => void;
}

export default function VideoPlayer({
  src,
  className = "",
  autoPlay = false,
  muted = true,
  controls = true,
  onError
}: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setError(false);
    setLoading(true);
    setErrorMessage("");
  }, [src]);

  const handleError = () => {
    console.error("❌ Video failed to load:", src);
    
    // Check if it's a 503 error (backend down)
    if (src.includes("demedia-backend.fly.dev")) {
      setErrorMessage("Old backend is offline. Video unavailable.");
    } else {
      setErrorMessage("Video failed to load");
    }
    
    setError(true);
    setLoading(false);
    onError?.();
  };

  const handleLoadStart = () => {
    console.log("📹 Video loading:", src);
    setLoading(true);
  };

  const handleCanPlay = () => {
    console.log("✅ Video ready:", src);
    setLoading(false);
  };

  if (error) {
    return (
      <div className={`${className} bg-gray-900 flex flex-col items-center justify-center p-8 rounded-lg`}>
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-white text-center mb-2">Video Unavailable</p>
        <p className="text-gray-400 text-sm text-center">{errorMessage}</p>
        {src.includes("demedia-backend.fly.dev") && (
          <p className="text-yellow-500 text-xs text-center mt-4">
            ⚠️ This video is stored on an offline server
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`${className} bg-gray-900 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        className={`${className} ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        playsInline
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}