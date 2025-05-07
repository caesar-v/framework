/**
 * Canvas Manager - Game Framework
 * 
 * Handles canvas initialization, rendering, and basic graphics operations.
 * Provides an abstraction layer for games to draw on the canvas.
 * Compatible with both the simplified and full-featured framework.
 */

class CanvasManager {
  /**
   * Initialize a new Canvas Manager
   * @param {Object} config - Configuration for the canvas manager
   */
  constructor(config = {}) {
    this.config = {
      canvasId: 'game-canvas',
      width: 800,
      height: 600,
      backgroundColor: ['#0d1117', '#161b22'],
      gridColor: 'rgba(88, 166, 255, 0.1)',
      gridSize: 30,
      ...config
    };
    
    this.canvas = null;
    this.ctx = null;
    this.initialized = false;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.resizeListener = null;
    
    // Animation loop handlers
    this.renderCallbacks = [];
  }
  
  /**
   * Initialize the canvas
   * @param {string|HTMLCanvasElement} canvasElement - Canvas element or ID
   * @returns {boolean} True if initialization was successful
   */
  init(canvasElement) {
    // Clear any existing state
    this.cleanup();
    
    // Get canvas element
    if (typeof canvasElement === 'string') {
      this.canvas = document.getElementById(canvasElement || this.config.canvasId);
    } else if (canvasElement instanceof HTMLCanvasElement) {
      this.canvas = canvasElement;
    }
    
    // Check if canvas exists
    if (!this.canvas) {
      console.error('CanvasManager: Canvas element not found');
      return false;
    }
    
    // Get context
    try {
      this.ctx = this.canvas.getContext('2d');
    } catch (error) {
      console.error('CanvasManager: Failed to get canvas context:', error);
      return false;
    }
    
    // Set canvas size initially
    this.resize();
    
    // Set up resize handler
    this.resizeListener = () => this.resize();
    window.addEventListener('resize', this.resizeListener);
    
    // Mark as initialized
    this.initialized = true;
    
    // Initial draw
    this.clear();
    this.drawBackground();
    
    return true;
  }
  
  /**
   * Resize the canvas to match its display size
   */
  resize() {
    if (!this.canvas) return;
    
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    // Only resize if necessary to avoid clearing canvas
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      
      // Redraw after resize
      this.drawBackground();
    }
  }
  
  /**
   * Clear the canvas
   */
  clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Draw the background with gradient and grid
   */
  drawBackground() {
    if (!this.ctx || !this.canvas) return;
    
    // Create gradient
    const [colorStart, colorEnd] = this.config.backgroundColor;
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    
    // Fill background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
  }
  
  /**
   * Draw a grid pattern on the canvas
   */
  drawGrid() {
    if (!this.ctx || !this.canvas) return;
    
    const { gridSize, gridColor } = this.config;
    
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    
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
  
  /**
   * Get current canvas dimensions
   * @returns {Object} Width and height of the canvas
   */
  getDimensions() {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
  
  /**
   * Add a render callback for the animation loop
   * @param {Function} callback - Function to call on each frame
   * @returns {number} Index of the callback for removal
   */
  addRenderCallback(callback) {
    if (typeof callback !== 'function') return -1;
    this.renderCallbacks.push(callback);
    
    // Start animation loop if this is the first callback
    if (this.renderCallbacks.length === 1) {
      this.startAnimationLoop();
    }
    
    return this.renderCallbacks.length - 1;
  }
  
  /**
   * Remove a render callback
   * @param {number} index - Index of the callback to remove
   */
  removeRenderCallback(index) {
    if (index >= 0 && index < this.renderCallbacks.length) {
      this.renderCallbacks.splice(index, 1);
      
      // Stop animation loop if no callbacks remain
      if (this.renderCallbacks.length === 0) {
        this.stopAnimationLoop();
      }
    }
  }
  
  /**
   * Start the animation loop
   */
  startAnimationLoop() {
    if (this.animationFrameId !== null) return;
    
    const animate = (timestamp) => {
      // Calculate delta time
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      // Call all render callbacks
      for (const callback of this.renderCallbacks) {
        callback(deltaTime, timestamp);
      }
      
      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * Stop the animation loop
   */
  stopAnimationLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Draw text on the canvas
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Text options
   */
  drawText(text, x, y, options = {}) {
    if (!this.ctx) return;
    
    const {
      font = 'Arial',
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
  
  /**
   * Draw a rounded rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Corner radius
   * @param {string} fillColor - Fill color
   * @param {string} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor, strokeWidth = 1) {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    
    // Draw rounded rectangle
    this.ctx.roundRect(x, y, width, height, radius);
    
    // Fill if color is provided
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    
    // Stroke if color is provided
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw a circle
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} radius - Radius
   * @param {string} fillColor - Fill color
   * @param {string} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  drawCircle(x, y, radius, fillColor, strokeColor, strokeWidth = 1) {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Fill if color is provided
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    
    // Stroke if color is provided
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Stop animation loop
    this.stopAnimationLoop();
    
    // Remove event listeners
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    
    // Clear callbacks
    this.renderCallbacks = [];
    
    // Reset state
    this.initialized = false;
  }
}

// Export the CanvasManager
if (typeof window !== 'undefined') {
  window.CanvasManager = CanvasManager;
}