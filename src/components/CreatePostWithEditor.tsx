"use client";

import React, { useState } from 'react';
import MediaUploadWithEditor from './MediaUploadWithEditor';

interface CreatePostWithEditorProps {
  onSubmit: (postData: any) => Promise<void>;
  onCancel?: () => void;
}

export default function CreatePostWithEditor({ onSubmit, onCancel }: CreatePostWithEditorProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; metadata?: any }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = (file: File, metadata?: any) => {
    setMediaFiles([...mediaFiles, { file, metadata }]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      alert('Please add some content or media');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      mediaFiles.forEach((item, index) => {
        formData.append(`media_${index}`, item.file);
        if (item.metadata) {
          formData.append(`metadata_${index}`, JSON.stringify(item.metadata));
        }
      });

      await onSubmit(formData);
      
      // Reset form
      setContent('');
      setMediaFiles([]);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create Post</h2>

      {/* Content Input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Media Upload */}
      <div className="mb-4">
        <MediaUploadWithEditor
          onUpload={handleMediaUpload}
          acceptedTypes="both"
          maxSizeMB={100}
        />
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Attached Media ({mediaFiles.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {mediaFiles.map((item, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {item.file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeMedia(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
