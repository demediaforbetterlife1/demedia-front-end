"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function GoldParticles() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (theme !== 'gold') return;

    // Create floating gold particles
    const createParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          delay: Math.random() * 5
        });
      }
      setParticles(newParticles);
    };

    createParticles();
    const interval = setInterval(createParticles, 10000); // Regenerate particles every 10 seconds

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'gold') return null;

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="gold-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </>
  );
}
