"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

const DefaultFallback = ({ minHeight = "200px" }: { minHeight?: string }) => (
  <div 
    className="flex items-center justify-center w-full"
    style={{ minHeight }}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center space-y-4"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
        Loading...
      </p>
    </motion.div>
  </div>
);

export default function LazyLoadWrapper({ 
  children, 
  fallback,
  minHeight = "200px"
}: LazyLoadWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
      {children}
    </Suspense>
  );
}
