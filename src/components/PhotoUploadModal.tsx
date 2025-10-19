"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getModalThemeClasses } from "@/utils/enhancedThemeUtils";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: 'profile' | 'cover') => void;
  type: 'profile' | 'cover';
  isUploading?: boolean;
}

export default function PhotoUploadModal({ 
  isOpen, 
  onClose, 
  onUpload, 
  type, 
  isUploading = false 
}: PhotoUploadModalProps) {
  const { theme } = useTheme();
  const themeClasses = getModalThemeClasses(theme);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError("");
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    onUpload(file, type);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`w-full max-w-md ${themeClasses.modal} rounded-2xl shadow-2xl`}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Camera className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Upload {type === 'profile' ? 'Profile' : 'Cover'} Photo
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Choose a photo to upload
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-500/5'
              } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>Uploading...</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Please wait while we upload your photo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${themeClasses.text}`}>
                      {dragActive ? 'Drop your photo here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${themeClasses.textSecondary}`}>
                      {type === 'profile' ? 'Profile photo' : 'Cover photo'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Tips */}
            <div className="mt-6 space-y-2">
              <h4 className={`text-sm font-medium ${themeClasses.text}`}>Tips for great photos:</h4>
              <ul className={`text-xs space-y-1 ${themeClasses.textSecondary}`}>
                <li>• Use high-quality images for best results</li>
                <li>• {type === 'profile' ? 'Square images work best for profile photos' : 'Wide images work best for cover photos'}</li>
                <li>• Make sure the image is well-lit and clear</li>
                <li>• Avoid blurry or low-resolution images</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end space-x-3 p-6 border-t ${themeClasses.border}`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
