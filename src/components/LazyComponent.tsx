"use client";

import React from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
  rootMargin?: string;
  threshold?: number;
}

const DefaultSkeleton = ({ minHeight = "200px" }: { minHeight?: string }) => (
  <div 
    className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"
    style={{ minHeight }}
  />
);

export default function LazyComponent({
  children,
  fallback,
  minHeight = "200px",
  rootMargin = "100px",
  threshold = 0.01,
}: LazyComponentProps) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <DefaultSkeleton minHeight={minHeight} />)}
    </div>
  );
}
