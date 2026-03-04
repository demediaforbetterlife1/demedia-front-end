"use client";

import React, { useState, useRef, useEffect } from 'react';

interface PhotoEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ file, onSave, onCancel }: PhotoEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Editing state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [rotation, setRotation] = useState(0);
  
  // Text state
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [texts, setTexts] = useState<Array<{ text: string; color: string; id: number }>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = [
    { name: 'Original', value: 'none' },
    { name: 'B&W', value: 'grayscale' },
    { name: 'Sepia', value: 'sepia' },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Cool', value: 'cool' },
    { name: 'Warm', value: 'warm' },
    { name: 'Bright', value: 'bright' },
    { name: 'Fade', value: 'fade' },
  ];

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (imageUrl) {
      renderImage();
    }
  }, [imageUrl, brightness, contrast, saturation, selectedFilter, rotation, texts]);

  const renderImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      imageRef.current = img;
      
      // Handle rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-img.width / 2, -img.height / 2);

      // Apply filters
      let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      
      switch (selectedFilter) {
        case 'grayscale':
          filterString += ' grayscale(100%)';
          break;
        case 'sepia':
          filterString += ' sepia(100%)';
          break;
        case 'vintage':
          filterString += ' sepia(50%) contrast(120%) brightness(90%)';
          break;
        case 'cool':
          filterString += ' hue-rotate(180deg) saturate(150%)';
          break;
        case 'warm':
          filterString += ' hue-rotate(-30deg) saturate(120%)';
          break;
        case 'bright':
          filterString += ' brightness(120%) contrast(110%)';
          break;
        case 'fade':
          filterString += ' brightness(110%) contrast(80%) saturate(80%)';
          break;
      }

      ctx.filter = filterString;
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Draw text overlays
      ctx.filter = 'none';
      texts.forEach((textItem, index) => {
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = textItem.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        const y = canvas.height / 2 + (index - texts.length / 2) * 60;
        ctx.strokeText(textItem.text, canvas.width / 2, y);
        ctx.fillText(textItem.text, canvas.width / 2, y);
      });
    };
  };

  const addText = () => {
    if (textValue.trim()) {
      setTexts([...texts, { text: textValue, color: textColor, id: Date.now() }]);
      setTextValue('');
      setShowTextInput(false);
    }
  };

  const removeText = (id: number) => {
    setTexts(texts.filter(t => t.id !== id));
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSelectedFilter('none');
    setRotation(0);
    setTexts([]);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (blob) {
          const editedFile = new File([blob], file.name, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          onSave(editedFile);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          ✕ Cancel
        </button>
        <h2 className="text-white font-semibold">Edit Photo</h2>
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
        >
          {isProcessing ? '...' : '✓ Save'}
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'high-quality' }}
        />
      </div>

      {/* Tools */}
      <div className="bg-gray-900 p-4 space-y-4 max-h-[50vh] overflow-y-auto">
        {/* Filters */}
        <div>
          <h3 className="text-white text-sm font-semibold mb-2">Filters</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2 rounded whitespace-nowrap text-sm ${
                  selectedFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments */}
        <div className="space-y-3">
          <h3 className="text-white text-sm font-semibold">Adjust</h3>
          
          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Brightness</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Contrast</span>
              <span>{contrast}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-gray-300 text-xs mb-1">
              <span>Saturation</span>
              <span>{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRotate}
            className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
          >
            🔄 Rotate
          </button>
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
          >
            📝 Text
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
          >
            ↺ Reset
          </button>
        </div>

        {/* Text Input */}
        {showTextInput && (
          <div className="bg-gray-800 p-3 rounded space-y-2">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter text..."
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-10 rounded"
              />
              <button
                onClick={addText}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Add Text
              </button>
            </div>
          </div>
        )}

        {/* Text List */}
        {texts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-white text-sm font-semibold">Text Overlays</h3>
            {texts.map((textItem) => (
              <div key={textItem.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                <span className="text-white text-sm" style={{ color: textItem.color }}>
                  {textItem.text}
                </span>
                <button
                  onClick={() => removeText(textItem.id)}
                  className="text-red-500 hover:text-red-400 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
