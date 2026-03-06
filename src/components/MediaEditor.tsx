'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Crop, Sliders, Type, Sticker, Download, Check } from 'lucide-react';

interface MediaEditorProps {
  file: File;
  type: 'image' | 'video';
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function MediaEditor({ file, type, onSave, onCancel }: MediaEditorProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'crop'>('filters');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let source: HTMLImageElement | HTMLVideoElement | null = null;
    
    if (type === 'image' && imageRef.current) {
      source = imageRef.current;
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
    } else if (type === 'video' && videoRef.current) {
      source = videoRef.current;
      canvas.width = source.videoWidth;
      canvas.height = source.videoHeight;
    }

    if (!source) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Add text if present
    if (text) {
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, (canvas.width * textPosition.x) / 100, (canvas.height * textPosition.y) / 100);
    }

    ctx.restore();
  };

  useEffect(() => {
    if (type === 'image' && imageRef.current?.complete) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, rotation, text, textColor, textPosition]);

  const handleImageLoad = () => {
    applyFilters();
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], file.name, { type: file.type });
        onSave(editedFile);
      }
    }, file.type);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setText('');
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-md border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-cyan-400" />
          <h2 className="text-white font-bold text-lg">Edit Media</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-700 hover:to-purple-700 transition-all flex items-center gap-2"
          >
            <Check size={18} />
            Save
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black">
          <div className="relative max-w-4xl max-h-full">
            {/* Hidden source elements */}
            {type === 'image' ? (
              <img
                ref={imageRef}
                src={mediaUrl}
                alt="Edit preview"
                className="hidden"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
              />
            ) : (
              <video
                ref={videoRef}
                src={mediaUrl}
                className="hidden"
                onLoadedData={applyFilters}
                crossOrigin="anonymous"
              />
            )}

            {/* Canvas for editing */}
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'filters', label: 'Filters', icon: Sliders },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'crop', label: 'Rotate', icon: RotateCw },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
                    activeTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-6">
            {activeTab === 'filters' && (
              <>
                {/* Brightness */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Brightness: {brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Contrast: {contrast}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Saturation: {saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Preset Filters */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Quick Filters
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Normal', b: 100, c: 100, s: 100 },
                      { name: 'Bright', b: 120, c: 110, s: 110 },
                      { name: 'Dark', b: 80, c: 120, s: 90 },
                      { name: 'Vivid', b: 110, c: 130, s: 150 },
                      { name: 'B&W', b: 100, c: 120, s: 0 },
                      { name: 'Vintage', b: 110, c: 90, s: 80 },
                    ].map((filter) => (
                      <button
                        key={filter.name}
                        onClick={() => {
                          setBrightness(filter.b);
                          setContrast(filter.c);
                          setSaturation(filter.s);
                        }}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'text' && (
              <>
                {/* Text Input */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Add Text
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Text Position */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Horizontal Position: {textPosition.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textPosition.x}
                    onChange={(e) =>
                      setTextPosition((prev) => ({ ...prev, x: Number(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Vertical Position: {textPosition.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textPosition.y}
                    onChange={(e) =>
                      setTextPosition((prev) => ({ ...prev, y: Number(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </>
            )}

            {activeTab === 'crop' && (
              <>
                {/* Rotation */}
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Rotation: {rotation}°
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRotate}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCw size={18} />
                      Rotate 90°
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Custom Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
