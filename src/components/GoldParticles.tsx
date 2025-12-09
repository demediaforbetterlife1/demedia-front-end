"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

// Check if device prefers reduced motion or is low-end
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  // Check for low memory or slow connection
  const nav = navigator as any;
  const lowMemory = nav.deviceMemory && nav.deviceMemory < 4;
  const slowConnection = nav.connection && 
    (nav.connection.effectiveType === '2g' || nav.connection.effectiveType === 'slow-2g');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return lowMemory || slowConnection || (isMobile && window.innerWidth < 768);
};

export default function GoldParticles() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shouldRender, setShouldRender] = useState(true);

  // Check device capabilities on mount
  useEffect(() => {
    if (prefersReducedMotion() || isLowEndDevice()) {
      setShouldRender(false);
    }
  }, []);

  // Memoize particle generation with device-aware count
  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    // Reduced particle count - even fewer on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const particleCount = isMobile ? 4 : 6;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 10,
        duration: 18 + Math.random() * 12, // Slower for less CPU usage
        opacity: 0.15 + Math.random() * 0.25
      });
    }
    return newParticles;
  }, []);

  useEffect(() => {
    if (theme !== 'gold' || !shouldRender) {
      setParticles([]);
      return;
    }

    // Create floating gold particles
    setParticles(generateParticles());
    
    // Regenerate particles less frequently
    const interval = setInterval(() => {
      setParticles(generateParticles());
    }, 30000); // Increased interval for better performance

    return () => clearInterval(interval);
  }, [theme, generateParticles, shouldRender]);

  if (theme !== 'gold' || particles.length === 0 || !shouldRender) return null;

  return (
    <div className="gold-particles-container" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="gold-particle"
          style={{
            left: `${particle.x}%`,
            bottom: '-10px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            opacity: particle.opacity,
          }}
        />
      ))}
      <style jsx>{`
        .gold-particles-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          contain: strict;
        }
        .gold-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(201, 162, 39, 0.5) 0%, transparent 70%);
          border-radius: 50%;
          animation: gold-float-elegant linear infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        @keyframes gold-float-elegant {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity, 0.25);
          }
          90% {
            opacity: var(--particle-opacity, 0.25);
          }
          100% {
            transform: translate3d(15px, -100vh, 0);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gold-particles-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
