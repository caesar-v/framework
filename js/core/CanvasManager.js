/**
 * CanvasManager - Handles canvas operations, dimensions and rendering
 */
class CanvasManager {
  /**
   * Initialize the canvas manager
   * @param {Object} config - Configuration object for canvas settings
   * @param {Object} state - Current game state
   */
  constructor(config, state) {
    this.config = config;
    this.state = state;
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Set the canvas reference
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    if (canvas) {
      this.ctx = canvas.getContext('2d');
    }
  }

  /**
   * Initialize the canvas with the correct dimensions
   */
  initCanvas() {
    if (!this.canvas) {
      console.error('Canvas not set');
      return;
    }

    // Get current viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get actual screen dimensions when available
    const screenWidth = window.screen ? window.screen.width : viewportWidth;
    const screenHeight = window.screen ? window.screen.height : viewportHeight;
    
    // Get the playground element to calculate canvas dimensions
    const playgroundElement = document.querySelector('.playground-zone');
    
    // Calculate canvas dimensions based on the playground area
    let playgroundWidth = viewportWidth;
    let playgroundHeight = viewportHeight;
    
    if (playgroundElement) {
      // Get the actual available space in the playground (accounting for padding, margin)
      const playgroundRect = playgroundElement.getBoundingClientRect();
      playgroundWidth = playgroundRect.width;
      playgroundHeight = playgroundRect.height;
      
      console.log(`Playground dimensions: ${playgroundWidth}×${playgroundHeight}`);
    } else {
      console.warn('Playground element not found, using viewport dimensions as fallback');
    }
    
    // Update the config with current playground dimensions
    this.config.canvasDimensions = {
      pc: { 
        width: playgroundWidth,
        height: playgroundHeight
      },
      mobile: { 
        width: playgroundWidth,
        height: playgroundHeight
      }
    };
    
    // Set canvas dimensions based on current layout and playground size
    const targetDims = this.config.canvasDimensions[this.state.layout];
    
    // Force canvas to fill the entire playground zone (ensure pixel-perfect sizing)
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = targetDims.width;
    this.canvas.height = targetDims.height;
    
    // Log the canvas size for debugging
    console.log(`Canvas initialized with dimensions: ${this.canvas.width}×${this.canvas.height}`);
    console.log(`Viewport dimensions: ${viewportWidth}×${viewportHeight}`);
    console.log(`Screen dimensions: ${screenWidth}×${screenHeight}`);
    
    return {
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      playgroundWidth,
      playgroundHeight
    };
  }

  /**
   * Draw using the Canvas 2D API 
   * @param {Function} renderGame - Function to render the game content
   */
  drawWithCanvas2D(renderGame) {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not initialized');
      return;
    }

    // Get the current canvas dimensions
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas - IMPORTANT: Use full canvas dimensions
    this.ctx.clearRect(0, 0, width, height);
    
    // Create gradient based on theme and layout
    let gradient;
    if (this.state.layout === 'pc') {
      gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    } else {
      gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    }
    
    // Set colors based on theme with safety check
    const colors = this.config.canvasBackground && this.config.canvasBackground[this.state.theme] 
      ? this.config.canvasBackground[this.state.theme]
      : ['#071824', '#071d2a']; // Default colors
    
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    // Fill background with gradient - use full canvas size
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw reference grid if in debug mode
    if (window.debugManager && window.debugManager.isDebugEnabled) {
      this.drawGrid();
    }
    
    // Add canvas size indicator in debug mode
    if (window.debugManager && window.debugManager.isDebugEnabled) {
      this.ctx.font = 'bold 14px monospace';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`Canvas: ${this.canvas.width}×${this.canvas.height}`, 10, 10);
    }
    
    // Call the game's render function with safety check
    if (typeof renderGame === 'function') {
      try {
        // Call the game's render function with the current canvas dimensions
        renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
      } catch (error) {
        console.error('Error in game renderGame:', error);
        this.renderFallbackGame();
      }
    } else {
      this.renderFallbackGame();
    }
  }

  /**
   * Draw a reference grid on the canvas
   */
  drawGrid() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    // Calculate grid size based on canvas dimensions
    // Adjust grid spacing to avoid too many lines on large canvases
    let gridSize = 100;
    const maxGridLines = 30; // Maximum number of grid lines in either direction
    
    if (this.canvas.width / gridSize > maxGridLines) {
      gridSize = Math.ceil(this.canvas.width / maxGridLines / 100) * 100;
    }
    
    // Vertical grid lines
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    // Draw center marker
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    this.ctx.lineWidth = 2;
    
    // Horizontal center line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 50, centerY);
    this.ctx.lineTo(centerX + 50, centerY);
    this.ctx.stroke();
    
    // Vertical center line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 50);
    this.ctx.lineTo(centerX, centerY + 50);
    this.ctx.stroke();
  }

  /**
   * Render a fallback game display when the actual game rendering fails
   * @private
   */
  renderFallbackGame() {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw a simple fallback interface
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.config.gameTitle || 'Game Prototype', centerX, centerY - 80);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('Game is initializing...', centerX, centerY);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('Click SPIN to play', centerX, centerY + 50);
  }

  /**
   * Get the current canvas and context
   * @returns {Object} Object containing canvas and context
   */
  getCanvas() {
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      width: this.canvas ? this.canvas.width : 0,
      height: this.canvas ? this.canvas.height : 0
    };
  }

  /**
   * Update screen resolution information in the settings panel
   * @param {HTMLElement} elements - DOM elements to update
   * @param {number} screenWidth - The physical screen width
   * @param {number} screenHeight - The physical screen height
   * @param {number} windowWidth - The window width
   * @param {number} windowHeight - The window height
   */
  updateScreenInfo(elements, screenWidth, screenHeight, windowWidth, windowHeight) {
    if (!elements) return;

    // Update screen resolution in settings panel
    if (elements.screenResolution) {
      elements.screenResolution.textContent = `${screenWidth}×${screenHeight}`;
    }
    
    // Update window size in settings panel
    if (elements.windowSize) {
      elements.windowSize.textContent = `Window: ${windowWidth}×${windowHeight}`;
    }
    
    // Update canvas size and playground dimensions in settings panel
    if (elements.canvasSize && this.canvas) {
      // Get the current playground dimensions
      const playgroundElement = document.querySelector('.playground-zone');
      let playgroundInfo = '';
      
      if (playgroundElement) {
        const playgroundRect = playgroundElement.getBoundingClientRect();
        const playgroundWidth = Math.round(playgroundRect.width);
        const playgroundHeight = Math.round(playgroundRect.height);
        playgroundInfo = ` | Playground: ${playgroundWidth}×${playgroundHeight}`;
      }
      
      elements.canvasSize.textContent = `Canvas: ${this.canvas.width}×${this.canvas.height}${playgroundInfo}`;
    }
    
    this.updateGameCanvasInfo(elements);
  }
  
  /**
   * Update game-specific canvas dimensions in the settings panel
   * This shows the dimensions of each game's gameplay area
   * @param {HTMLElement} elements - DOM elements to update
   */
  updateGameCanvasInfo(elements) {
    if (!elements || !elements.gameCanvas || !this.canvas) return;

    // Get the current game name
    const gameName = this.config.gameTitle || 'Game';
    
    // Get the active game's dimensions
    let gameWidth = this.canvas.width;
    let gameHeight = this.canvas.height;
    
    // For BaseGame, CardGame, and DiceGame, add specific dimensions
    // These would typically be the table area or playfield
    if (gameName.includes('Card')) {
      // Card Game table now matches canvas exactly
      elements.gameCanvas.textContent = `${gameName} Table: ${gameWidth}×${gameHeight}`;
    } 
    else if (gameName.includes('Dice')) {
      // Dice Game table now matches canvas exactly
      elements.gameCanvas.textContent = `${gameName} Table: ${gameWidth}×${gameHeight}`;
    }
    else if (gameName.includes('Base')) {
      // For Base Game, simply show the canvas size with a note
      elements.gameCanvas.textContent = `${gameName} Area: ${gameWidth}×${gameHeight} (Full Canvas)`;
    }
    else {
      // Generic case for other games
      elements.gameCanvas.textContent = `${gameName} Canvas: ${gameWidth}×${gameHeight}`;
    }
  }

  /**
   * Get the background color based on the current theme
   * @returns {number} - The hex color as a number for PixiJS
   */
  getBackgroundColor() {
    const colors = this.config.canvasBackground && this.config.canvasBackground[this.state.theme] 
      ? this.config.canvasBackground[this.state.theme]
      : ['#071824', '#071d2a']; // Default colors
    
    // Convert hex to number (assuming first color in gradient)
    let color = colors[0];
    // Remove # if present
    if (color.startsWith('#')) {
      color = color.slice(1);
    }
    return parseInt(color, 16);
  }
}

// Export the canvas manager
window.CanvasManager = CanvasManager;