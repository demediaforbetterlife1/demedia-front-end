'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * Component that monitors for version updates and notifies users
 * DISABLED - Causing false positives
 */
export function VersionUpdateNotification() {
  // DISABLED: Return null to prevent any notifications
  return null;
}
