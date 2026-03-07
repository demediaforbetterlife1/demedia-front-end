"use client";

import React, { useState } from 'react';
import MediaUploadWithEditor from './MediaUploadWithEditor';
import { useTheme } from '@/contexts/ThemeContext';

interface CreateDeSnapWithEditorProps {
  onSubmit: (desnapData: FormData) => Promise<void>;
  onCancel?: () => void;
}

export default function CreateDeSnapWithEditor({ onSubmit, onCancel }: CreateDeSnapWithEditorProps) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState<{ file: File; metadata?: any } | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();

  const handleMediaUpload = (file: File, metadata?: any) => {
    setMediaFile({ file, metadata });
  };

  const handleSubmit = async () => {
    // Allow text-only desnaps or media-only desnaps
    if (!text.trim() && !mediaFile) {
      alert('Please add text or media to your DeSnap');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('visibility', visibility);
      
      if (mediaFile) {
        formData.append('media', mediaFile.file);
        if (mediaFile.metadata) {
          formData.append('metadata', JSON.stringify(mediaFile.metadata));
        }
      }

      await onSubmit(formData);
      
      // Reset form
      setText('');
      setMediaFile(null);
      setVisibility('public');
    } catch (error) {
      console.error('Error creating DeSnap:', error);
      // Don't show alert here, let parent handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === 'dark' || theme === 'super-dark' || theme === 'gold';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${
        isDark 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      } border rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create DeSnap
        </h2>

        {/* Text Input */}
        <div className="mb-4">
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Caption (Optional)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a caption to your DeSnap..."
            className={`w-full ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } border rounded-xl p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
            maxLength={280}
          />
          <div className={`text-right text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {text.length}/280
          </div>
        </div>

        {/* Media Upload */}
        {!mediaFile ? (
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Media (Required for video DeSnaps)
            </label>
            <MediaUploadWithEditor
              onUpload={handleMediaUpload}
              acceptedTypes="both"
              maxSizeMB={100}
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Media Preview
            </label>
            <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl overflow-hidden`}>
              {mediaFile.file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(mediaFile.file)}
                  alt="DeSnap media"
                  className="w-full max-h-[300px] object-contain"
                />
              ) : (
                <video
                  src={URL.createObjectURL(mediaFile.file)}
                  className="w-full max-h-[300px] object-contain"
                  controls
                />
              )}
              <button
                onClick={() => setMediaFile(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                title="Remove media"
              >
                ✕
              </button>
            </div>
            {mediaFile.metadata && (
              <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {mediaFile.metadata.duration && (
                  <span>Duration: {Math.round(mediaFile.metadata.duration)}s</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visibility Options */}
        <div className="mb-6">
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className={`w-full ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="public">Public - Everyone can see</option>
            <option value="followers">Followers - Only your followers</option>
            <option value="private">Private - Only you</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } py-3 rounded-xl font-semibold transition`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!text.trim() && !mediaFile)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Posting...' : 'Post DeSnap'}
          </button>
        </div>
      </div>
    </div>
  );
}
