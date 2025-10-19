"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export const AnimatedStars: React.FC = () => {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    if (theme !== 'super-dark' && theme !== 'super-light') {
      setStars([]);
      setShootingStars([]);
      return;
    }

    // Generate static stars
    const generateStars = () => {
      const newStars: Star[] = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          delay: Math.random() * 2,
          duration: Math.random() * 3 + 2,
        });
      }
      setStars(newStars);
    };

    // Generate shooting stars
    const generateShootingStars = () => {
      const newShootingStars: ShootingStar[] = [];
      const starCount = theme === 'super-dark' ? 5 : 3;
      for (let i = 0; i < starCount; i++) {
        newShootingStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 5,
        });
      }
      setShootingStars(newShootingStars);
    };

    generateStars();
    generateShootingStars();

    // Regenerate shooting stars periodically
    const interval = setInterval(() => {
      generateShootingStars();
    }, theme === 'super-dark' ? 6000 : 10000);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'super-dark' && theme !== 'super-light') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Static Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute w-1 h-1 rounded-full opacity-30 ${
            theme === 'super-dark' ? 'bg-white' : 'bg-blue-400'
          }`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle ${star.duration}s infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Shooting Stars */}
      {shootingStars.map((shootingStar, index) => (
        <div
          key={shootingStar.id}
          className={`absolute ${
            theme === 'super-dark' 
              ? 'w-4 h-1 shooting-star'
              : 'w-3 h-1 shooting-star-fast'
          }`}
          style={{
            left: `${shootingStar.x}%`,
            top: `${shootingStar.y}%`,
            animationDelay: `${shootingStar.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Add the CSS animations to the global styles
const starStyles = `
  @keyframes twinkle {
    0%, 100% { 
      opacity: 0.3; 
      transform: scale(1); 
    }
    50% { 
      opacity: 1; 
      transform: scale(1.2); 
    }
  }

  @keyframes shooting-star {
    0% { 
      transform: translateX(-200px) translateY(-200px) rotate(45deg);
      opacity: 0;
      box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7);
    }
    5% { 
      opacity: 1;
      box-shadow: 0 0 10px 2px rgba(34, 211, 238, 0.8);
    }
    15% { 
      box-shadow: 0 0 20px 4px rgba(34, 211, 238, 0.6);
    }
    85% { 
      box-shadow: 0 0 30px 6px rgba(34, 211, 238, 0.4);
    }
    95% { 
      opacity: 1;
      box-shadow: 0 0 40px 8px rgba(34, 211, 238, 0.2);
    }
    100% { 
      transform: translateX(calc(100vw + 200px)) translateY(calc(100vh + 200px)) rotate(45deg);
      opacity: 0;
      box-shadow: 0 0 0 0 rgba(34, 211, 238, 0);
    }
  }

  @keyframes shooting-star-fast {
    0% { 
      transform: translateX(-150px) translateY(-150px) rotate(45deg);
      opacity: 0;
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    3% { 
      opacity: 1;
      box-shadow: 0 0 8px 1px rgba(59, 130, 246, 0.8);
    }
    10% { 
      box-shadow: 0 0 15px 3px rgba(59, 130, 246, 0.6);
    }
    90% { 
      box-shadow: 0 0 25px 5px rgba(59, 130, 246, 0.4);
    }
    97% { 
      opacity: 1;
      box-shadow: 0 0 35px 7px rgba(59, 130, 246, 0.2);
    }
    100% { 
      transform: translateX(calc(100vw + 150px)) translateY(calc(100vh + 150px)) rotate(45deg);
      opacity: 0;
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }

  .shooting-star {
    animation: shooting-star 3s linear infinite;
    background: linear-gradient(45deg, 
      rgba(34, 211, 238, 1) 0%, 
      rgba(168, 85, 247, 0.8) 30%, 
      rgba(236, 72, 153, 0.6) 60%, 
      transparent 100%
    );
    border-radius: 50% 0 0 50%;
    position: relative;
  }

  .shooting-star::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.8) 20%, 
      rgba(255, 255, 255, 0.4) 50%, 
      transparent 100%
    );
    border-radius: 50% 0 0 50%;
  }

  .shooting-star-fast {
    animation: shooting-star-fast 2s linear infinite;
    background: linear-gradient(45deg, 
      rgba(59, 130, 246, 1) 0%, 
      rgba(147, 51, 234, 0.8) 30%, 
      rgba(236, 72, 153, 0.6) 60%, 
      transparent 100%
    );
    border-radius: 50% 0 0 50%;
    position: relative;
  }

  .shooting-star-fast::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.9) 15%, 
      rgba(255, 255, 255, 0.5) 40%, 
      transparent 100%
    );
    border-radius: 50% 0 0 50%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = starStyles;
  document.head.appendChild(styleSheet);
}
