"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function GlowingPlanets() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || theme !== 'super-dark') {
    return null;
  }

  return (
    <>
      <div className="glowing-planet-1" />
      <div className="glowing-planet-2" />
      <div className="glowing-planet-3" />
    </>
  );
}
