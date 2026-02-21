/**
 * Photo Editor Hook
 * Manages photo editing state and operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { imageProcessingService, ImageAdjustments, CropData, TextOverlay, StickerOverlay, DrawingStroke } from '@/services/imageProcessingService';

export interface PhotoEditorState {
  originalImage: HTMLImageElement | null;
  currentImage: string | null;
  adjustments: ImageAdjustments;
  cropData: CropData | null;
  textOverlays: TextOverlay[];
  stickers: StickerOverlay[];
  drawingStrokes: DrawingStroke[];
  selectedFilter: string;
  history: string[];
  historyIndex: number;
  isProcessing: boolean;
}

export function usePhotoEditor(file: File | null) {
  const [state, setState] = useState<PhotoEditorState>({
    originalImage: null,
    currentImage: null,
    adjustments: {},
    cropData: null,
    textOverlays: [],
    stickers: [],
    drawingStrokes: [],
    selectedFilter: 'normal',
    history: [],
    historyIndex: -1,
    isProcessing: false
  });

  const processingRef = useRef(false);

  // Load image from file
  useEffect(() => {
    if (!file) return;

    const loadImage = async () => {
      try {
        const img = await imageProcessingService.loadImage(file);
        const dataUrl = await imageProcessingService.applyAdjustments(img, {});
        
        setState(prev => ({
          ...prev,
          originalImage: img,
          currentImage: dataUrl,
          history: [dataUrl],
          historyIndex: 0
        }));
      } catch (error) {
        console.error('Failed to load image:', error);
      }
    };

    loadImage();
  }, [file]);

  // Add to history
  const addToHistory = useCallback((imageData: string) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(imageData);
      
      // Limit history to 20 items
      if (newHistory.length > 20) {
        newHistory.shift();
      }

      return {
        ...prev,
        currentImage: imageData,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Apply adjustments
  const applyAdjustments = useCallback(async (adjustments: ImageAdjustments) => {
    if (!state.originalImage || processingRef.current) return;

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true, adjustments }));

    try {
      const result = await imageProcessingService.applyAdjustments(
        state.originalImage!,
        adjustments
      );
      addToHistory(result);
    } catch (error) {
      console.error('Failed to apply adjustments:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.originalImage, addToHistory]);

  // Apply filter
  const applyFilter = useCallback(async (filterName: string) => {
    if (!state.originalImage || processingRef.current) return;

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true, selectedFilter: filterName }));

    try {
      const result = await imageProcessingService.applyFilter(
        state.originalImage!,
        filterName
      );
      addToHistory(result);
    } catch (error) {
      console.error('Failed to apply filter:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.originalImage, addToHistory]);

  // Crop image
  const crop = useCallback(async (cropData: CropData) => {
    if (!state.originalImage || processingRef.current) return;

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true, cropData }));

    try {
      const result = await imageProcessingService.crop(state.originalImage!, cropData);
      addToHistory(result);
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.originalImage, addToHistory]);

  // Rotate image
  const rotate = useCallback(async (degrees: number) => {
    if (!state.originalImage || processingRef.current) return;

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await imageProcessingService.rotate(state.originalImage!, degrees);
      addToHistory(result);
    } catch (error) {
      console.error('Failed to rotate image:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.originalImage, addToHistory]);

  // Flip image
  const flip = useCallback(async (direction: 'horizontal' | 'vertical') => {
    if (!state.originalImage || processingRef.current) return;

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await imageProcessingService.flip(state.originalImage!, direction);
      addToHistory(result);
    } catch (error) {
      console.error('Failed to flip image:', error);
    } finally {
      processingRef.current = false;
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.originalImage, addToHistory]);

  // Add text overlay
  const addText = useCallback((text: TextOverlay) => {
    setState(prev => ({
      ...prev,
      textOverlays: [...prev.textOverlays, text]
    }));
  }, []);

  // Update text overlay
  const updateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  }, []);

  // Remove text overlay
  const removeText = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.filter(t => t.id !== id)
    }));
  }, []);

  // Add sticker
  const addSticker = useCallback((sticker: StickerOverlay) => {
    setState(prev => ({
      ...prev,
      stickers: [...prev.stickers, sticker]
    }));
  }, []);

  // Update sticker
  const updateSticker = useCallback((id: string, updates: Partial<StickerOverlay>) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }));
  }, []);

  // Remove sticker
  const removeSticker = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.filter(s => s.id !== id)
    }));
  }, []);

  // Add drawing stroke
  const addDrawingStroke = useCallback((stroke: DrawingStroke) => {
    setState(prev => ({
      ...prev,
      drawingStrokes: [...prev.drawingStrokes, stroke]
    }));
  }, []);

  // Clear all drawings
  const clearDrawings = useCallback(() => {
    setState(prev => ({
      ...prev,
      drawingStrokes: []
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        return {
          ...prev,
          historyIndex: prev.historyIndex - 1,
          currentImage: prev.history[prev.historyIndex - 1]
        };
      }
      return prev;
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        return {
          ...prev,
          historyIndex: prev.historyIndex + 1,
          currentImage: prev.history[prev.historyIndex + 1]
        };
      }
      return prev;
    });
  }, []);

  // Export final image
  const exportImage = useCallback(async (): Promise<File | null> => {
    if (!state.currentImage || !state.originalImage) return null;

    try {
      // Load current image
      const img = await imageProcessingService.loadImage(
        await imageProcessingService.dataUrlToFile(state.currentImage, 'temp.jpg')
      );

      // Apply text overlays
      let result = state.currentImage;
      if (state.textOverlays.length > 0) {
        result = await imageProcessingService.addTextOverlay(img, state.textOverlays);
      }

      // Apply stickers
      if (state.stickers.length > 0) {
        const imgWithText = await imageProcessingService.loadImage(
          await imageProcessingService.dataUrlToFile(result, 'temp.jpg')
        );
        result = await imageProcessingService.addStickers(imgWithText, state.stickers);
      }

      // Apply drawings
      if (state.drawingStrokes.length > 0) {
        const imgWithStickers = await imageProcessingService.loadImage(
          await imageProcessingService.dataUrlToFile(result, 'temp.jpg')
        );
        result = await imageProcessingService.addDrawing(imgWithStickers, state.drawingStrokes);
      }

      // Convert to file
      return await imageProcessingService.dataUrlToFile(result, 'edited-photo.jpg');
    } catch (error) {
      console.error('Failed to export image:', error);
      return null;
    }
  }, [state]);

  // Generate thumbnail
  const generateThumbnail = useCallback(async (): Promise<string | null> => {
    if (!state.currentImage || !state.originalImage) return null;

    try {
      const img = await imageProcessingService.loadImage(
        await imageProcessingService.dataUrlToFile(state.currentImage, 'temp.jpg')
      );
      return await imageProcessingService.generateThumbnail(img);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }, [state.currentImage, state.originalImage]);

  // Reset editor
  const reset = useCallback(() => {
    setState({
      originalImage: state.originalImage,
      currentImage: state.history[0] || null,
      adjustments: {},
      cropData: null,
      textOverlays: [],
      stickers: [],
      drawingStrokes: [],
      selectedFilter: 'normal',
      history: state.history.slice(0, 1),
      historyIndex: 0,
      isProcessing: false
    });
  }, [state.originalImage, state.history]);

  return {
    state,
    actions: {
      applyAdjustments,
      applyFilter,
      crop,
      rotate,
      flip,
      addText,
      updateText,
      removeText,
      addSticker,
      updateSticker,
      removeSticker,
      addDrawingStroke,
      clearDrawings,
      undo,
      redo,
      exportImage,
      generateThumbnail,
      reset
    },
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1
  };
}