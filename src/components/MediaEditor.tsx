"use client";

import React, { useState, useRef, useEffect } from 'react';

interface MediaEditorProps {
  file: File;
  type: 'image' | 'video';
  onSave: (editedFile: File, thumbnail?: string) => void;
  onCancel: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export default function MediaEditor({ file, type, onSave, onCancel }: MediaEditorProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [editedMediaUrl, setEditedMediaUrl] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<'filters' | 'adjust' | 'text' | 'stickers' | 'draw' | 'crop' | 'trim'>('filters');
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Image editing state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  
  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Sticker state
  const [stickers, setStickers] = useState<Sticker[]>([]);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawWidth, setDrawWidth] = useState(3);
  
  // Crop state
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isCropping, setIsCropping] = useState(false);
  
  // Video trim state
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Available filters
  const filters = [
    { name: 'None', value: 'none', filter: '' },
    { name: 'Grayscale', value: 'grayscale', filter: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia', filter: 'sepia(100%)' },
    { name: 'Vintage', value: 'vintage', filter: 'sepia(50%) contrast(120%) brightness(90%)' },
    { name: 'Cool', value: 'cool', filter: 'hue-rotate(180deg) saturate(150%)' },
    { name: 'Warm', value: 'warm', filter: 'hue-rotate(-30deg) saturate(120%)' },
    { name: 'High Contrast', value: 'contrast', filter: 'contrast(150%)' },
    { name: 'Fade', value: 'fade', filter: 'brightness(110%) contrast(80%)' },
  ];

  // Available stickers (emojis)
  const availableStickers = [
    '😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😇',
    '❤️', '💕', '💖', '✨', '⭐', '🌟', '💫', '🔥',
    '👍', '👏', '🙌', '💪', '🎉', '🎊', '🎈', '🎁',
    '🌈', '☀️', '🌙', '⚡', '💥', '💯', '✅', '🎯'
  ];

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setEditedMediaUrl(url);

    if (type === 'video' && videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(duration);
        setTrimEnd(duration);
      };
    }

    return () => URL.revokeObjectURL(url);
  }, [file, type]);

  // Apply filters and adjustments
  useEffect(() => {
    if (type === 'image') {
      applyImageEdits();
    }
  }, [brightness, contrast, saturation, blur, selectedFilter, textOverlays, stickers]);

  const applyImageEdits = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = mediaUrl;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply filters
      const filterValue = filters.find(f => f.value === selectedFilter)?.filter || '';
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) ${filterValue}`;
      
      ctx.drawImage(img, 0, 0);
      
      // Reset filter for overlays
      ctx.filter = 'none';

      // Draw text overlays
      textOverlays.forEach(overlay => {
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = 'center';
        ctx.fillText(overlay.text, overlay.x, overlay.y);
      });

      // Draw stickers
      stickers.forEach(sticker => {
        ctx.save();
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.font = `${sticker.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      });

      // Update edited URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setEditedMediaUrl(url);
        }
      });
    };
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: canvasRef.current ? canvasRef.current.width / 2 : 200,
      y: canvasRef.current ? canvasRef.current.height / 2 : 200,
      fontSize,
      color: textColor,
      fontFamily
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setCurrentText('');
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      emoji,
      x: canvasRef.current ? canvasRef.current.width / 2 : 200,
      y: canvasRef.current ? canvasRef.current.height / 2 : 200,
      size: 48,
      rotation: 0
    };

    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingCanvasRef.current) return;
    setIsDrawing(true);
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingCanvasRef.current) return;
    
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawWidth;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    if (!drawingCanvasRef.current) return;
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };

  // Video controls
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    
    // Loop within trim range
    if (currentTime >= trimEnd) {
      videoRef.current.currentTime = trimStart;
    }
  };

  // Save edited media
  const handleSave = async () => {
    setIsProcessing(true);

    try {
      if (type === 'image') {
        await saveEditedImage();
      } else {
        await saveEditedVideo();
      }
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Failed to save edited media. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveEditedImage = async () => {
    if (!canvasRef.current) return;

    // Merge drawing canvas if exists
    if (drawingCanvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(drawingCanvasRef.current, 0, 0);
      }
    }

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], file.name, { type: 'image/jpeg' });
        onSave(editedFile);
      }
    }, 'image/jpeg', 0.95);
  };

  const saveEditedVideo = async () => {
    // For video, we'll pass the original file with trim metadata
    // Actual video processing would require FFmpeg or server-side processing
    // For now, we'll create a thumbnail from the video
    
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture thumbnail at trim start
    videoRef.current.currentTime = trimStart;
    await new Promise(resolve => setTimeout(resolve, 100));

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const thumbnailUrl = URL.createObjectURL(blob);
        onSave(file, thumbnailUrl);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Cancel
        </button>
        <h2 className="text-white text-xl font-semibold">
          Edit {type === 'image' ? 'Photo' : 'Video'}
        </h2>
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600"
        >
          {isProcessing ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {type === 'image' ? (
            <div className="relative max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full"
                style={{ display: currentTab === 'draw' ? 'none' : 'block' }}
              />
              <canvas
                ref={drawingCanvasRef}
                className="absolute top-0 left-0 max-w-full max-h-full"
                style={{ display: currentTab === 'draw' ? 'block' : 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                src={mediaUrl}
                className="max-w-full max-h-[70vh]"
                onTimeUpdate={handleVideoTimeUpdate}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Video Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-full p-2">
                <button
                  onClick={togglePlayPause}
                  className="text-white px-4 py-2"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Editing Tools Panel */}
        <div className="w-80 bg-gray-900 overflow-y-auto">
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-gray-700">
            <button
              onClick={() => setCurrentTab('filters')}
              className={`px-3 py-2 text-sm ${currentTab === 'filters' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            >
              Filters
            </button>
            <button
              onClick={() => setCurrentTab('adjust')}
              className={`px-3 py-2 text-sm ${currentTab === 'adjust' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            >
              Adjust
            </button>
            <button
              onClick={() => setCurrentTab('text')}
              className={`px-3 py-2 text-sm ${currentTab === 'text' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            >
              Text
            </button>
            <button
              onClick={() => setCurrentTab('stickers')}
              className={`px-3 py-2 text-sm ${currentTab === 'stickers' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            >
              Stickers
            </button>
            {type === 'image' && (
              <button
                onClick={() => setCurrentTab('draw')}
                className={`px-3 py-2 text-sm ${currentTab === 'draw' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
              >
                Draw
              </button>
            )}
            {type === 'video' && (
              <button
                onClick={() => setCurrentTab('trim')}
                className={`px-3 py-2 text-sm ${currentTab === 'trim' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
              >
                Trim
              </button>
            )}
          </div>

          {/* Tool Content */}
          <div className="p-4">
            {/* Filters Tab */}
            {currentTab === 'filters' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`p-2 rounded text-sm ${
                        selectedFilter === filter.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adjust Tab */}
            {currentTab === 'adjust' && (
              <div className="space-y-6">
                <h3 className="text-white font-semibold mb-3">Adjustments</h3>
                
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Brightness: {brightness}%
                  </label>
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
                  <label className="text-gray-300 text-sm block mb-2">
                    Contrast: {contrast}%
                  </label>
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
                  <label className="text-gray-300 text-sm block mb-2">
                    Saturation: {saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Blur: {blur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                    setBlur(0);
                  }}
                  className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600"
                >
                  Reset All
                </button>
              </div>
            )}

            {/* Text Tab */}
            {currentTab === 'text' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-3">Add Text</h3>
                
                <input
                  type="text"
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                />

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-10 rounded"
                  />
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min="12"
                    max="120"
                    className="w-20 bg-gray-800 text-white px-2 py-2 rounded"
                  />
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="flex-1 bg-gray-800 text-white px-2 py-2 rounded"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans</option>
                    <option value="Courier New">Courier</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>

                <button
                  onClick={addTextOverlay}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Add Text
                </button>

                {textOverlays.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-gray-300 text-sm mb-2">Text Overlays:</h4>
                    {textOverlays.map((overlay) => (
                      <div key={overlay.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2">
                        <span className="text-white text-sm truncate">{overlay.text}</span>
                        <button
                          onClick={() => removeTextOverlay(overlay.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stickers Tab */}
            {currentTab === 'stickers' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-3">Add Stickers</h3>
                
                <div className="grid grid-cols-6 gap-2">
                  {availableStickers.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addSticker(emoji)}
                      className="text-3xl hover:bg-gray-800 rounded p-2"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {stickers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-gray-300 text-sm mb-2">Added Stickers:</h4>
                    {stickers.map((sticker) => (
                      <div key={sticker.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2">
                        <span className="text-2xl">{sticker.emoji}</span>
                        <button
                          onClick={() => removeSticker(sticker.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Draw Tab */}
            {currentTab === 'draw' && type === 'image' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-3">Draw</h3>
                
                <div>
                  <label className="text-gray-300 text-sm block mb-2">Color</label>
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-full h-10 rounded"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Brush Size: {drawWidth}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={clearDrawing}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                >
                  Clear Drawing
                </button>
              </div>
            )}

            {/* Trim Tab (Video) */}
            {currentTab === 'trim' && type === 'video' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-3">Trim Video</h3>
                
                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    Start: {trimStart.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTrimStart(value);
                      if (videoRef.current) {
                        videoRef.current.currentTime = value;
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm block mb-2">
                    End: {trimEnd.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="text-gray-300 text-sm">
                  Duration: {(trimEnd - trimStart).toFixed(1)}s
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
