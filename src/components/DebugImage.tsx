"use client";

import React, { useState } from "react";
import { fixImageUrl } from "@/utils/imageUrlFixer";

interface DebugImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
}

export default function DebugImage({ 
  src, 
  alt, 
  className = "", 
  fallback = "/images/default-post.svg" 
}: DebugImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fixedSrc = fixImageUrl(src);
  const finalSrc = error ? fallback : (fixedSrc || fallback);

  console.log("DebugImage:", {
    original: src,
    fixed: fixedSrc,
    final: finalSrc,
    error,
    alt
  });

  return (
    <div className="relative">
      <img
        src={finalSrc}
        alt={alt}
        className={`${className} ${loading ? "opacity-50" : "opacity-100"} transition-opacity`}
        onLoad={() => {
          setLoading(false);
          console.log("Image loaded successfully:", finalSrc);
        }}
        onError={(e) => {
          console.error("Image failed to load:", finalSrc);
          setError(true);
          setLoading(false);
        }}
      />
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 max-w-xs truncate">
          {finalSrc}
        </div>
      )}
    </div>
  );
}