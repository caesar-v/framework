/**
 * BaseGame - Abstract base class for all game implementations
 */
class BaseGame {
  constructor(config = {}) {
    console.log('BaseGame constructor called with config:', config);
    
    // Clear any existing game instance if this is a re-initialization
    if (this.game) {
      console.log('Cleaning up existing game instance');
      // Remove any canvas handlers or animation loops
      this.game = null;
    }
    
    // Store base configuration - this will be used by the framework
    this.config = config;
    
    // Common initialization logic
    this.validateConfig(config);
    
    // Make sure document is ready before creating framework
    const initFramework = () => {
      console.log('Initializing game framework with config:', this.config);
      
      // Create the game framework instance with complete configuration
      this.game = new GameFramework({
        // Default properties
        gameTitle: 'Game Title',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        // Custom config overrides default
        ...this.config,
        // Game logic methods
        gameLogic: {
          spin: this.spin.bind(this),
          calculateWin: this.calculateWin.bind(this),
          renderGame: this.renderGame.bind(this),
          renderGameWithPixi: this.renderGameWithPixi.bind(this),
          handleWin: this.handleWin.bind(this),
          handleLoss: this.handleLoss.bind(this)
        }
      });
    };
    
    // Wait for DOM to be ready before initializing framework
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFramework);
    } else {
      // DOM already loaded, initialize immediately
      initFramework();
    }
  }

  // Required methods that subclasses must implement
  validateConfig(config) {
    console.log('BaseGame.validateConfig called with config:', config);
    
    // Validate that the config has required properties
    if (!config) {
      console.warn('Invalid or undefined config passed to BaseGame');
      return;
    }
    
    if (!config.gameTitle) {
      console.warn('No game title provided in config');
    }
  }

  spin(callback) {
    throw new Error('spin() method must be implemented by subclass');
  }

  calculateWin(betAmount, riskLevel, result) {
    throw new Error('calculateWin() method must be implemented by subclass');
  }

  renderGame(ctx, width, height, state) {
    // Default implementation - fill the entire canvas with a dynamic background
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }
    
    try {
      // Get center coordinates
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Clear the entire canvas
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient background that fills the entire canvas
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#071824'); // Dark blue at top
      gradient.addColorStop(1, '#071d2a'); // Slightly lighter blue at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add decorative grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      const lineSpacing = Math.max(50, height / 20);
      for (let y = 0; y < height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Vertical lines
      for (let x = 0; x < width; x += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Calculate proportional font sizes
      const titleFontSize = Math.max(36, Math.min(60, height * 0.07));
      const instructionsFontSize = Math.max(18, Math.min(30, height * 0.035));
      
      // Draw game title
      ctx.font = `bold ${titleFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.config.gameTitle || 'Game Title', centerX, centerY - height * 0.1);
      
      // Draw instructions
      ctx.font = `${instructionsFontSize}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Click SPIN to play!', centerX, centerY + height * 0.05);
      
      // Add game version info
      const versionFontSize = Math.max(12, height * 0.015);
      ctx.font = `${versionFontSize}px Arial`;
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'right';
      ctx.fillText('Game Framework v1.0', width - 20, height - 20);
    } catch (error) {
      console.error('Error in Canvas rendering:', error);
    }
  }
  
  renderGameWithPixi(pixiApp, container, width, height, state) {
    // Default implementation - fill the entire canvas
    if (!pixiApp || !container) {
      console.warn('PIXI renderer not available');
      return;
    }
    
    try {
      // Clear container first
      container.removeChildren();
      
      // Get center coordinates
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Create background that fills the entire canvas
      const background = new PIXI.Graphics();
      
      // Create gradient-like effect using multiple rectangles
      const colors = [0x071824, 0x071d2a]; // Default colors
      
      // Fill the entire canvas
      background.beginFill(colors[0]);
      background.drawRect(0, 0, width, height);
      background.endFill();
      
      // Add a darker overlay at the bottom for gradient effect
      const overlay = new PIXI.Graphics();
      overlay.beginFill(colors[1]);
      overlay.drawRect(0, height * 0.5, width, height * 0.5);
      overlay.endFill();
      overlay.alpha = 0.7;
      
      // Add background to container
      container.addChild(background);
      container.addChild(overlay);
      
      // Add decorative grid lines
      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0xFFFFFF, 0.1);
      
      // Horizontal lines
      const lineSpacing = Math.max(50, height / 20);
      for (let y = 0; y < height; y += lineSpacing) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
      
      // Vertical lines
      for (let x = 0; x < width; x += lineSpacing) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      
      container.addChild(grid);
      
      // Calculate proportional font sizes
      const titleFontSize = Math.max(36, Math.min(60, height * 0.07));
      const instructionsFontSize = Math.max(18, Math.min(30, height * 0.035));
      
      // Create a text object using PIXI
      const textStyle = new PIXI.TextStyle({
        fontFamily: 'Poppins, Arial',
        fontSize: titleFontSize,
        fontWeight: 'bold',
        fill: '#FFD700',
        align: 'center'
      });
      
      const centerText = new PIXI.Text(
        this.config.gameTitle || 'Game Title', 
        textStyle
      );
      
      // Position the text in the center
      centerText.anchor.set(0.5);
      centerText.x = centerX;
      centerText.y = centerY - height * 0.1;
      
      // Add to container
      container.addChild(centerText);
      
      // Add a second line with smaller text
      const instructionsStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: instructionsFontSize,
        fill: '#FFFFFF',
        align: 'center'
      });
      
      const instructionsText = new PIXI.Text(
        'Click SPIN to play!', 
        instructionsStyle
      );
      
      instructionsText.anchor.set(0.5);
      instructionsText.x = centerX;
      instructionsText.y = centerY + height * 0.05;
      
      container.addChild(instructionsText);
      
      // Add game version info
      const versionStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: Math.max(12, height * 0.015),
        fill: '#AAAAAA',
        align: 'right'
      });
      
      const versionText = new PIXI.Text(
        'Game Framework v1.0', 
        versionStyle
      );
      
      versionText.anchor.set(1, 1);
      versionText.x = width - 20;
      versionText.y = height - 20;
      
      container.addChild(versionText);
    } catch (error) {
      console.error('Error in PIXI rendering:', error);
    }
  }

  handleWin(ctx, width, height, winAmount, result) {
    // Default implementation that utilizes the full canvas
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }
    
    try {
      const centerX = width / 2;
      
      // Scale font sizes based on canvas dimensions
      const winFontSize = Math.max(32, Math.min(64, width * 0.065));
      const subtitleFontSize = Math.max(24, Math.min(36, width * 0.035));
      
      // Draw win message - position relative to canvas height
      ctx.font = `bold ${winFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, height * 0.15);
      
      // Draw subtitle
      ctx.font = `bold ${subtitleFontSize}px Poppins, Arial`;
      ctx.fillText('Congratulations!', centerX, height * 0.25);
    } catch (error) {
      console.error('Error in handleWin rendering:', error);
    }
  }

  handleLoss(ctx, width, height, result) {
    // Default implementation that utilizes the full canvas
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }
    
    try {
      const centerX = width / 2;
      
      // Scale font size based on canvas dimensions
      const lossFontSize = Math.max(24, Math.min(36, width * 0.035));
      
      // Draw try again message - position relative to canvas height
      ctx.font = `bold ${lossFontSize}px Poppins, Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Try again!', centerX, height * 0.9);
    } catch (error) {
      console.error('Error in handleLoss rendering:', error);
    }
  }

  // Common utility methods all games can use
  drawText(ctx, text, x, y, options = {}) {
    const {
      font = 'bold 48px Poppins',
      color = '#FFD700',
      align = 'center',
      baseline = 'middle'
    } = options;

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  }
}

// Export the base class
window.BaseGame = BaseGame;