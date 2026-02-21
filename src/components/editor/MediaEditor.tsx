"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import PhotoEditor from './PhotoEditor/PhotoEditor';
import VideoEditor from './VideoEditor/VideoEditor';
import { contentModerationService } from '@/services/contentModeration';

export interface MediaEditorProps {
  file: File | null;
  mediaType: 'photo' | 'video';
  contentType: 'post' | 'story' | 'desnap';
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: {
    file: File;
    thumbnail?: string;
    duration?: number;
    editSettings?: any;
  }) => void;
}

export default function MediaEditor({
  file,
  mediaType,
  contentType,
  isOpen,
  onClose,
  onComplete
}: MediaEditorProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate file on mount
  useEffect(() => {
    if (!file || !isOpen) return;

    const validateFile = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        // Content moderation check
        if (mediaType === 'photo') {
          const moderationResult = await contentModerationService.moderateImage(file);
          if (!moderationResult.isApproved) {
            setValidationError(
              moderationResult.reason || 'Content not approved for upload'
            );
            setIsValidating(false);
            return;
          }
        } else {
          const moderationResult = await contentModerationService.moderateVideo(file);
          if (!moderationResult.isApproved) {
            setValidationError(
              moderationResult.reason || 'Content not approved for upload'
            );
            setIsValidating(false);
            return;
          }
        }

        // File size validation
        const maxSize = mediaType === 'photo' ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
        if (file.size > maxSize) {
          const sizeMB = Math.round(maxSize / (1024 * 1024));
          setValidationError(`File too large. Maximum size is ${sizeMB}MB`);
          setIsValidating(false);
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationError('Failed to validate file. Please try again.');
        setIsValidating(false);
      }
    };

    validateFile();
  }, [file, mediaType, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full h-full max-w-7xl max-h-screen bg-gray-900 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>

          {/* Content */}
          {isValidating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Validating file...</p>
              </div>
            </div>
          ) : validationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Validation Failed</h3>
                <p className="text-gray-400 mb-6">{validationError}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : mediaType === 'photo' ? (
            <PhotoEditor
              file={file}
              contentType={contentType}
              onComplete={onComplete}
              onCancel={onClose}
            />
          ) : (
            <VideoEditor
              file={file}
              contentType={contentType}
              onComplete={onComplete}
              onCancel={onClose}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}