/**
 * Canvas Manager Service
 * Handles all canvas operations including initialization, resizing, and drawing utilities
 */

// Types for drawing options
type TextOptions = {
  font?: string;
  size?: number;
  weight?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
};

// Canvas Manager singleton
class CanvasManager {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  // Initialize canvas
  init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get canvas context');
      return false;
    }
    
    this.resize();
    
    // Add event listener for window resize
    window.addEventListener('resize', this.resize.bind(this));
    
    return true;
  }

  // Clean up resources
  cleanup(): void {
    window.removeEventListener('resize', this.resize.bind(this));
    this.canvas = null;
    this.ctx = null;
  }

  // Resize canvas to match display size
  resize(): void {
    if (!this.canvas) return;
    
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }
  }

  // Clear canvas
  clear(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw background with grid
  drawBackground(): void {
    if (!this.ctx || !this.canvas) return;
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(1, '#161b22');
    
    // Fill background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
  }

  // Draw grid
  drawGrid(): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.strokeStyle = 'rgba(88, 166, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 30;
    
    // Draw vertical lines
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  // Draw text
  drawText(text: string, x: number, y: number, options: TextOptions = {}): void {
    if (!this.ctx) return;
    
    const {
      font = 'Montserrat',
      size = 16,
      weight = 'normal',
      color = '#ffffff',
      align = 'center',
      baseline = 'middle'
    } = options;
    
    this.ctx.font = `${weight} ${size}px ${font}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, x, y);
  }

  // Draw rectangle
  drawRect(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    fillColor?: string, 
    strokeColor?: string, 
    strokeWidth: number = 1
  ): void {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }

  // Draw circle
  drawCircle(
    x: number, 
    y: number, 
    radius: number, 
    fillColor?: string, 
    strokeColor?: string, 
    strokeWidth: number = 1
  ): void {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }

  // Draw image
  drawImage(image: HTMLImageElement, x: number, y: number, width?: number, height?: number): void {
    if (!this.ctx) return;
    
    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }
  }
}

// Export as singleton
export const canvasManager = new CanvasManager();