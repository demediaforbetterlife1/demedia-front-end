"use client";

import React, { useEffect, useState, useMemo } from 'react';
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

export default function GoldParticles() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  // Memoize particle generation to prevent unnecessary recalculations
  const generateParticles = useMemo(() => {
    return () => {
      const newParticles: Particle[] = [];
      // Reduced particle count for a more elegant, less cluttered look
      const particleCount = 8;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1, // Smaller particles (1-3px)
          delay: Math.random() * 8, // Longer delays for staggered effect
          duration: 15 + Math.random() * 10, // Slower, more elegant movement
          opacity: 0.2 + Math.random() * 0.3 // Subtle opacity (0.2-0.5)
        });
      }
      return newParticles;
    };
  }, []);

  useEffect(() => {
    if (theme !== 'gold') {
      setParticles([]);
      return;
    }

    // Create floating gold particles
    setParticles(generateParticles());
    
    // Regenerate particles less frequently for smoother experience
    const interval = setInterval(() => {
      setParticles(generateParticles());
    }, 20000);

    return () => clearInterval(interval);
  }, [theme, generateParticles]);

  if (theme !== 'gold' || particles.length === 0) return null;

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
        }
        .gold-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(201, 162, 39, 0.6) 0%, transparent 70%);
          border-radius: 50%;
          animation: gold-float-elegant linear infinite;
        }
        @keyframes gold-float-elegant {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity, 0.3);
          }
          90% {
            opacity: var(--particle-opacity, 0.3);
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
