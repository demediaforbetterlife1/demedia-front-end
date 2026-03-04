"use client";

import React, { useState, useRef } from 'react';
import PhotoEditor from './PhotoEditor';
import VideoEditor from './VideoEditor';

interface MediaUploadWithEditorProps {
  onUpload: (file: File, metadata?: any) => void;
  acceptedTypes?: 'image' | 'video' | 'both';
  maxSizeMB?: number;
  showPreview?: boolean;
}

export default function MediaUploadWithEditor({
  onUpload,
  acceptedTypes = 'both',
  maxSizeMB = 100,
  showPreview = true
}: MediaUploadWithEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    if (acceptedTypes === 'image') return 'image/*';
    if (acceptedTypes === 'video') return 'video/*';
    return 'image/*,video/*';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Determine file type
    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('video/') ? 'video' : null;

    if (!type) {
      alert('Please select a valid image or video file');
      return;
    }

    // Check if type is accepted
    if (acceptedTypes !== 'both' && type !== acceptedTypes) {
      alert(`Only ${acceptedTypes} files are accepted`);
      return;
    }

    setSelectedFile(file);
    setFileType(type);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Show editor
    setShowEditor(true);
  };

  const handleEditorSave = (editedFile: File, thumbnail?: string, metadata?: any) => {
    setShowEditor(false);
    
    // Pass the edited file to parent with metadata
    onUpload(editedFile, {
      thumbnail,
      ...metadata,
      originalName: selectedFile?.name,
      type: fileType
    });

    // Cleanup
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setFileType(null);
    setPreviewUrl('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    
    // Cleanup
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setFileType(null);
    setPreviewUrl('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="media-upload-container">
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={handleButtonClick}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {acceptedTypes === 'image' ? 'Select Photo' : 
             acceptedTypes === 'video' ? 'Select Video' : 
             'Select Photo or Video'}
          </span>
        </button>

        <p className="text-gray-500 text-xs mt-2 text-center">
          Max size: {maxSizeMB}MB
        </p>
      </div>

      {/* Editors */}
      {showEditor && selectedFile && fileType === 'image' && (
        <PhotoEditor
          file={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}

      {showEditor && selectedFile && fileType === 'video' && (
        <VideoEditor
          file={selectedFile}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}
