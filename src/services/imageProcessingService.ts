/**
 * Image Processing Service
 * Canvas-based image editing without external dependencies
 */

export interface ImageAdjustments {
  brightness?: number;    // -100 to 100
  contrast?: number;      // -100 to 100
  saturation?: number;    // -100 to 100
  temperature?: number;   // -100 to 100
  tint?: number;          // -100 to 100
  exposure?: number;      // -100 to 100
  sharpness?: number;     // 0 to 100
  blur?: number;          // 0 to 100
  vignette?: number;      // 0 to 100
  grain?: number;         // 0 to 100
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  rotation: number;
  scale: number;
  textAlign: 'left' | 'center' | 'right';
  shadow?: {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

class ImageProcessingService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Load image from file
   */
  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Apply crop to image
   */
  async crop(image: HTMLImageElement, cropData: CropData): Promise<string> {
    this.canvas.width = cropData.width;
    this.canvas.height = cropData.height;

    this.ctx.drawImage(
      image,
      cropData.x,
      cropData.y,
      cropData.width,
      cropData.height,
      0,
      0,
      cropData.width,
      cropData.height
    );

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Rotate image
   */
  async rotate(image: HTMLImageElement, degrees: number): Promise<string> {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    const newWidth = image.width * cos + image.height * sin;
    const newHeight = image.width * sin + image.height * cos;

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    this.ctx.save();
    this.ctx.translate(newWidth / 2, newHeight / 2);
    this.ctx.rotate(radians);
    this.ctx.drawImage(image, -image.width / 2, -image.height / 2);
    this.ctx.restore();

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Flip image horizontally or vertically
   */
  async flip(image: HTMLImageElement, direction: 'horizontal' | 'vertical'): Promise<string> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.ctx.save();

    if (direction === 'horizontal') {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(image, -image.width, 0);
    } else {
      this.ctx.scale(1, -1);
      this.ctx.drawImage(image, 0, -image.height);
    }

    this.ctx.restore();

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Apply adjustments to image
   */
  async applyAdjustments(image: HTMLImageElement, adjustments: ImageAdjustments): Promise<string> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.ctx.drawImage(image, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Apply pixel-level adjustments
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      if (adjustments.brightness !== undefined) {
        const brightness = adjustments.brightness * 2.55;
        r += brightness;
        g += brightness;
        b += brightness;
      }

      // Contrast
      if (adjustments.contrast !== undefined) {
        const contrast = (adjustments.contrast + 100) / 100;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Saturation
      if (adjustments.saturation !== undefined) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const saturation = (adjustments.saturation + 100) / 100;
        r = gray + saturation * (r - gray);
        g = gray + saturation * (g - gray);
        b = gray + saturation * (b - gray);
      }

      // Temperature (warm/cool)
      if (adjustments.temperature !== undefined) {
        const temp = adjustments.temperature / 100;
        r += temp * 50;
        b -= temp * 50;
      }

      // Tint (green/magenta)
      if (adjustments.tint !== undefined) {
        const tint = adjustments.tint / 100;
        g += tint * 50;
      }

      // Exposure
      if (adjustments.exposure !== undefined) {
        const exposure = Math.pow(2, adjustments.exposure / 100);
        r *= exposure;
        g *= exposure;
        b *= exposure;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Apply blur if specified
    if (adjustments.blur && adjustments.blur > 0) {
      this.ctx.filter = `blur(${adjustments.blur / 10}px)`;
      this.ctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = 'none';
    }

    // Apply vignette if specified
    if (adjustments.vignette && adjustments.vignette > 0) {
      this.applyVignette(adjustments.vignette);
    }

    // Apply grain if specified
    if (adjustments.grain && adjustments.grain > 0) {
      this.applyGrain(adjustments.grain);
    }

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Apply vignette effect
   */
  private applyVignette(intensity: number): void {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) / 2
    );

    const alpha = intensity / 100;
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Apply grain effect
   */
  private applyGrain(intensity: number): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    const grainAmount = intensity / 100 * 50;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * grainAmount;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply filter preset
   */
  async applyFilter(image: HTMLImageElement, filterName: string): Promise<string> {
    const filters = this.getFilterPresets();
    const filter = filters[filterName];

    if (!filter) {
      return this.imageToDataUrl(image);
    }

    return this.applyAdjustments(image, filter);
  }

  /**
   * Add text overlay
   */
  async addTextOverlay(image: HTMLImageElement, textOverlays: TextOverlay[]): Promise<string> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.ctx.drawImage(image, 0, 0);

    textOverlays.forEach(overlay => {
      this.ctx.save();

      // Apply transformations
      this.ctx.translate(overlay.x, overlay.y);
      this.ctx.rotate((overlay.rotation * Math.PI) / 180);
      this.ctx.scale(overlay.scale, overlay.scale);

      // Set font
      this.ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      this.ctx.textAlign = overlay.textAlign;
      this.ctx.textBaseline = 'middle';

      // Apply shadow if specified
      if (overlay.shadow) {
        this.ctx.shadowBlur = overlay.shadow.blur;
        this.ctx.shadowColor = overlay.shadow.color;
        this.ctx.shadowOffsetX = overlay.shadow.offsetX;
        this.ctx.shadowOffsetY = overlay.shadow.offsetY;
      }

      // Draw background if specified
      if (overlay.backgroundColor) {
        const metrics = this.ctx.measureText(overlay.text);
        const padding = 10;
        this.ctx.fillStyle = overlay.backgroundColor;
        this.ctx.fillRect(
          -metrics.width / 2 - padding,
          -overlay.fontSize / 2 - padding,
          metrics.width + padding * 2,
          overlay.fontSize + padding * 2
        );
      }

      // Draw text
      this.ctx.fillStyle = overlay.color;
      this.ctx.fillText(overlay.text, 0, 0);

      this.ctx.restore();
    });

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Add sticker overlays
   */
  async addStickers(image: HTMLImageElement, stickers: StickerOverlay[]): Promise<string> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.ctx.drawImage(image, 0, 0);

    stickers.forEach(sticker => {
      this.ctx.save();

      // Apply transformations
      this.ctx.translate(sticker.x, sticker.y);
      this.ctx.rotate((sticker.rotation * Math.PI) / 180);
      this.ctx.scale(sticker.scale, sticker.scale);

      // Draw emoji
      this.ctx.font = '64px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(sticker.emoji, 0, 0);

      this.ctx.restore();
    });

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Add drawing strokes
   */
  async addDrawing(image: HTMLImageElement, strokes: DrawingStroke[]): Promise<string> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.ctx.drawImage(image, 0, 0);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      this.ctx.stroke();
    });

    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(image: HTMLImageElement, maxWidth: number = 300): Promise<string> {
    const aspectRatio = image.height / image.width;
    const thumbnailWidth = Math.min(maxWidth, image.width);
    const thumbnailHeight = thumbnailWidth * aspectRatio;

    this.canvas.width = thumbnailWidth;
    this.canvas.height = thumbnailHeight;

    this.ctx.drawImage(image, 0, 0, thumbnailWidth, thumbnailHeight);

    return this.canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * Convert image to data URL
   */
  private imageToDataUrl(image: HTMLImageElement): string {
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);
    return this.canvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Get filter presets
   */
  private getFilterPresets(): Record<string, ImageAdjustments> {
    return {
      normal: {},
      vivid: { saturation: 30, contrast: 10 },
      dramatic: { contrast: 40, brightness: -10 },
      warm: { temperature: 30, saturation: 10 },
      cool: { temperature: -30, tint: 10 },
      vintage: { saturation: -20, temperature: 20, vignette: 30 },
      blackAndWhite: { saturation: -100, contrast: 20 },
      sepia: { saturation: -50, temperature: 40 },
      fade: { contrast: -20, brightness: 10 },
      bright: { brightness: 20, exposure: 10 },
      dark: { brightness: -20, contrast: 20 },
      soft: { blur: 10, brightness: 5 },
      sharp: { sharpness: 50, contrast: 15 },
      moody: { saturation: -30, contrast: 30, vignette: 40 },
      cinematic: { contrast: 25, saturation: -10, vignette: 20 }
    };
  }

  /**
   * Convert data URL to File
   */
  async dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/jpeg' });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService();
export default imageProcessingService;