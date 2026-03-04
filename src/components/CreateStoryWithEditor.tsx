"use client";

import React, { useState } from 'react';
import MediaUploadWithEditor from './MediaUploadWithEditor';

interface CreateStoryWithEditorProps {
  onSubmit: (storyData: any) => Promise<void>;
  onCancel?: () => void;
}

export default function CreateStoryWithEditor({ onSubmit, onCancel }: CreateStoryWithEditorProps) {
  const [mediaFile, setMediaFile] = useState<{ file: File; metadata?: any } | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'close_friends'>('followers');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (file: File, metadata?: any) => {
    setMediaFile({ file, metadata });
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      alert('Please select a photo or video for your story');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('media', mediaFile.file);
      formData.append('visibility', visibility);
      
      if (mediaFile.metadata) {
        formData.append('metadata', JSON.stringify(mediaFile.metadata));
      }

      await onSubmit(formData);
      
      // Reset form
      setMediaFile(null);
      setVisibility('followers');
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create Story</h2>

        {/* Media Upload */}
        {!mediaFile ? (
          <div className="mb-4">
            <MediaUploadWithEditor
              onUpload={handleMediaUpload}
              acceptedTypes="both"
              maxSizeMB={50}
            />
            <p className="text-gray-500 text-sm mt-2">
              Stories disappear after 24 hours
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <div className="relative aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden max-h-[400px]">
              {mediaFile.file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(mediaFile.file)}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(mediaFile.file)}
                  className="w-full h-full object-cover"
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
        {mediaFile && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Who can see this?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm">Public - Everyone can see</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="followers"
                  checked={visibility === 'followers'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm">Followers - Only your followers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="close_friends"
                  checked={visibility === 'close_friends'}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm">Close Friends - Selected friends only</span>
              </label>
            </div>
          </div>
        )}

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
            disabled={isSubmitting || !mediaFile}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Sharing...' : 'Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
