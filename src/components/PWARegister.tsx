'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/registerServiceWorker';

export default function PWARegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
