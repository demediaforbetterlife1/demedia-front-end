"use client";

import { useEffect, useState } from 'react';

export default function ThemeEffects() {
  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    // Get initial theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
    console.log('🎨 ThemeEffects initialized with theme:', currentTheme);

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          console.log('🎨 Theme changed to:', newTheme);
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
      console.log('✨ Creating space elements for super-dark theme');
      createSpaceElements();
    } else if (theme === 'gold') {
      console.log('✨ Creating gold elements for gold theme');
      createGoldElements();
    } else {
      // Clean up elements for other themes
      console.log('🧹 Cleaning up theme elements for theme:', theme);
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
  console.log('🌌 Creating space elements...');

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
  console.log('🪐 Created', planetClasses.length, 'planets');

  // Create Saturn
  const saturn = document.createElement('div');
  saturn.className = 'space-planet-saturn';
  saturn.setAttribute('data-theme-effect', 'true');
  container.appendChild(saturn);
  console.log('🪐 Created Saturn with rings');

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
  console.log('⭐ Created 100 twinkling stars');

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
  console.log('💫 Created 5 shooting stars');

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
  console.log('☄️ Created 3 comets with tails');

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
  console.log('🌌 Created 3 distant galaxies');

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
  console.log('🌑 Created 10 asteroids');

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
  console.log('✨ Created 50 space dust particles');
  
  console.log('✅ Space theme fully initialized!');
}

function createGoldElements() {
  // Clean up existing elements first
  cleanupThemeElements();

  const container = document.body;
  console.log('✨ Creating gold elements...');

  // Create glowing orbs
  for (let i = 1; i <= 3; i++) {
    const orb = document.createElement('div');
    orb.className = `gold-orb gold-orb-${i}`;
    orb.setAttribute('data-theme-effect', 'true');
    container.appendChild(orb);
  }
  console.log('🔮 Created 3 glowing orbs');

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
  console.log('✨ Created 30 floating gold particles');

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
  console.log('⭐ Created 20 sparkling stars');
  
  console.log('✅ Gold theme fully initialized!');
}

function cleanupThemeElements() {
  // Remove all theme effect elements
  const elements = document.querySelectorAll('[data-theme-effect="true"]');
  if (elements.length > 0) {
    console.log('🧹 Cleaning up', elements.length, 'theme effect elements');
  }
  elements.forEach((el) => el.remove());
}
