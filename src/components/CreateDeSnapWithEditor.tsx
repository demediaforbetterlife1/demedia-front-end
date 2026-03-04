"use client";

import React, { useState } from 'react';
import MediaUploadWithEditor from './MediaUploadWithEditor';

interface CreateDeSnapWithEditorProps {
  onSubmit: (desnapData: any) => Promise<void>;
  onCancel?: () => void;
}

export default function CreateDeSnapWithEditor({ onSubmit, onCancel }: CreateDeSnapWithEditorProps) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<{ file: File; metadata?: any } | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (file: File, metadata?: any) => {
    setMediaFile({ file, metadata });
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      alert('Please add content or media to your DeSnap');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      
      if (mediaFile) {
        formData.append('media', mediaFile.file);
        if (mediaFile.metadata) {
          formData.append('metadata', JSON.stringify(mediaFile.metadata));
        }
      }

      await onSubmit(formData);
      
      // Reset form
      setContent('');
      setMediaFile(null);
      setVisibility('public');
    } catch (error) {
      console.error('Error creating DeSnap:', error);
      alert('Failed to create DeSnap');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create DeSnap</h2>

        {/* Content Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={280}
        />
        <div className="text-right text-sm text-gray-500 mb-4">
          {content.length}/280
        </div>

        {/* Media Upload */}
        {!mediaFile ? (
          <div className="mb-4">
            <MediaUploadWithEditor
              onUpload={handleMediaUpload}
              acceptedTypes="both"
              maxSizeMB={50}
            />
          </div>
        ) : (
          <div className="mb-4">
            <div className="relative bg-gray-200 rounded-lg overflow-hidden">
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
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Visibility Options */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Posting...' : 'Post DeSnap'}
          </button>
        </div>
      </div>
    </div>
  );
}
