"use client";

import { useEffect, useState } from 'react';

export default function ThemeEffects() {
  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    // Get initial theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          setTheme(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (theme === 'super-dark') {
      createSpaceElements();
    } else if (theme === 'gold') {
      createGoldElements();
    } else {
      // Clean up elements for other themes
      cleanupThemeElements();
    }

    return () => cleanupThemeElements();
  }, [theme]);

  return null; // This component doesn't render anything visible
}

function createSpaceElements() {
  // Clean up existing elements first
  cleanupThemeElements();

  const container = document.body;

  // Create planets
  const planetClasses = [
    'space-planet-1',
    'space-planet-2',
    'space-planet-3',
    'space-planet-4',
  ];

  planetClasses.forEach((className) => {
    const planet = document.createElement('div');
    planet.className = className;
    planet.setAttribute('data-theme-effect', 'true');
    container.appendChild(planet);
  });

  // Create Saturn
  const saturn = document.createElement('div');
  saturn.className = 'space-planet-saturn';
  saturn.setAttribute('data-theme-effect', 'true');
  container.appendChild(saturn);

  // Create stars (100 stars)
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2 + 1;
    const type = Math.random();
    
    if (type < 0.6) {
      star.className = 'space-star';
    } else if (type < 0.8) {
      star.className = 'space-star space-star-blue';
    } else {
      star.className = 'space-star space-star-yellow';
    }
    
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.animationDuration = `${2 + Math.random() * 3}s`;
    star.setAttribute('data-theme-effect', 'true');
    container.appendChild(star);
  }

  // Create shooting stars (5)
  for (let i = 0; i < 5; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'space-shooting-star';
    shootingStar.style.top = `${Math.random() * 50}%`;
    shootingStar.style.left = `${Math.random() * 50}%`;
    shootingStar.style.animationDelay = `${Math.random() * 5}s`;
    shootingStar.style.animationDuration = `${4 + Math.random() * 3}s`;
    shootingStar.setAttribute('data-theme-effect', 'true');
    container.appendChild(shootingStar);
  }

  // Create comets (3)
  for (let i = 0; i < 3; i++) {
    const comet = document.createElement('div');
    comet.className = 'space-comet';
    comet.style.top = `${Math.random() * 40}%`;
    comet.style.left = `${Math.random() * 40}%`;
    comet.style.animationDelay = `${Math.random() * 8}s`;
    comet.style.animationDuration = `${7 + Math.random() * 5}s`;
    comet.setAttribute('data-theme-effect', 'true');
    container.appendChild(comet);
  }

  // Create galaxies (3)
  for (let i = 0; i < 3; i++) {
    const galaxy = document.createElement('div');
    galaxy.className = 'space-galaxy';
    galaxy.style.top = `${Math.random() * 80}%`;
    galaxy.style.left = `${Math.random() * 80}%`;
    galaxy.style.animationDelay = `${Math.random() * 10}s`;
    galaxy.setAttribute('data-theme-effect', 'true');
    container.appendChild(galaxy);
  }

  // Create asteroids (10)
  for (let i = 0; i < 10; i++) {
    const asteroid = document.createElement('div');
    asteroid.className = 'space-asteroid';
    asteroid.style.top = `${Math.random() * 100}%`;
    asteroid.style.left = `${-50}px`;
    asteroid.style.animationDelay = `${Math.random() * 15}s`;
    asteroid.style.animationDuration = `${12 + Math.random() * 8}s`;
    asteroid.setAttribute('data-theme-effect', 'true');
    container.appendChild(asteroid);
  }

  // Create space dust (50)
  for (let i = 0; i < 50; i++) {
    const dust = document.createElement('div');
    dust.className = 'space-dust';
    dust.style.left = `${Math.random() * 100}%`;
    dust.style.animationDelay = `${Math.random() * 20}s`;
    dust.style.animationDuration = `${15 + Math.random() * 10}s`;
    dust.setAttribute('data-theme-effect', 'true');
    container.appendChild(dust);
  }
}

function createGoldElements() {
  // Clean up existing elements first
  cleanupThemeElements();

  const container = document.body;

  // Create glowing orbs
  for (let i = 1; i <= 3; i++) {
    const orb = document.createElement('div');
    orb.className = `gold-orb gold-orb-${i}`;
    orb.setAttribute('data-theme-effect', 'true');
    container.appendChild(orb);
  }

  // Create floating gold particles (30)
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    const size = Math.random();
    
    if (size < 0.4) {
      particle.className = 'gold-particle gold-particle-small';
    } else if (size < 0.7) {
      particle.className = 'gold-particle gold-particle-medium';
    } else {
      particle.className = 'gold-particle gold-particle-large';
    }
    
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 12}s`;
    particle.style.animationDuration = `${10 + Math.random() * 10}s`;
    particle.setAttribute('data-theme-effect', 'true');
    container.appendChild(particle);
  }

  // Create sparkling stars (20)
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'gold-sparkle';
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 2}s`;
    sparkle.style.animationDuration = `${1.5 + Math.random()}s`;
    sparkle.setAttribute('data-theme-effect', 'true');
    container.appendChild(sparkle);
  }
}

function cleanupThemeElements() {
  // Remove all theme effect elements
  const elements = document.querySelectorAll('[data-theme-effect="true"]');
  elements.forEach((el) => el.remove());
}
