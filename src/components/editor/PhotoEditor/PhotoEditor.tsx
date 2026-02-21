"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crop, Sliders, Sparkles, Type, Sticker, Pen, 
  RotateCw, FlipHorizontal, Undo2, Redo2, Check,
  Loader2
} from 'lucide-react';
import { usePhotoEditor } from '@/hooks/usePhotoEditor';

interface PhotoEditorProps {
  file: File | null;
  contentType: 'post' | 'story' | 'desnap';
  onComplete: (result: { file: File; thumbnail?: string; editSettings?: any }) => void;
  onCancel: () => void;
}

type Tool = 'none' | 'crop' | 'adjust' | 'filter' | 'text' | 'sticker' | 'draw';

export default function PhotoEditor({ file, contentType, onComplete, onCancel }: PhotoEditorProps) {
  const { state, actions, canUndo, canRedo } = usePhotoEditor(file);
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [isExporting, setIsExporting] = useState(false);

  const tools = [
    { id: 'crop' as Tool, icon: Crop, label: 'Crop' },
    { id: 'adjust' as Tool, icon: Sliders, label: 'Adjust' },
    { id: 'filter' as Tool, icon: Sparkles, label: 'Filters' },
    { id: 'text' as Tool, icon: Type, label: 'Text' },
    { id: 'sticker' as Tool, icon: Sticker, label: 'Stickers' },
    { id: 'draw' as Tool, icon: Pen, label: 'Draw' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportedFile = await actions.exportImage();
      if (!exportedFile) throw new Error('Failed to export');
      
      const thumbnail = await actions.generateThumbnail();
      
      onComplete({
        file: exportedFile,
        thumbnail: thumbnail || undefined,
        editSettings: {
          adjustments: state.adjustments,
          filter: state.selectedFilter,
          textOverlays: state.textOverlays,
          stickers: state.stickers
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={actions.undo}
            disabled={!canUndo}
            className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Undo2 className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={actions.redo}
            disabled={!canRedo}
            className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Redo2 className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-white">Edit Photo</h2>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Done
            </>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/50">
          {state.currentImage ? (
            <img
              src={state.currentImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          )}
        </div>

        {/* Tools sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTool === tool.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <tool.icon className="w-5 h-5" />
                <span className="font-medium">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Tool panels */}
          <div className="p-4 border-t border-gray-700">
            {activeTool === 'adjust' && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold mb-4">Adjustments</h3>
                {/* Brightness */}
                <div>
                  <label className="text-sm text-gray-400">Brightness</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={state.adjustments.brightness || 0}
                    onChange={(e) => actions.applyAdjustments({
                      ...state.adjustments,
                      brightness: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                {/* Add more adjustment sliders */}
              </div>
            )}

            {activeTool === 'filter' && (
              <div className="space-y-2">
                <h3 className="text-white font-semibold mb-4">Filters</h3>
                {['normal', 'vivid', 'dramatic', 'warm', 'cool', 'vintage', 'blackAndWhite'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => actions.applyFilter(filter)}
                    className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                      state.selectedFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700">
        <button
          onClick={() => actions.rotate(90)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Rotate"
        >
          <RotateCw className="w-5 h-5 text-gray-300" />
        </button>
        <button
          onClick={() => actions.flip('horizontal')}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Flip"
        >
          <FlipHorizontal className="w-5 h-5 text-gray-300" />
        </button>
      </div>
    </div>
  );
}