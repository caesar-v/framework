/**
 * AbstractBaseGame - Abstract base class for all game implementations
 * 
 * This class provides a template for all game implementations. It defines
 * the required methods that must be implemented by subclasses and provides
 * default implementations of common utility methods.
 */
class AbstractBaseGame {
  /**
   * Initialize the abstract base game
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    // Prevent direct instantiation of abstract class
    if (this.constructor === AbstractBaseGame) {
      throw new Error('AbstractBaseGame is an abstract class and cannot be instantiated directly.');
    }
    
    console.log('AbstractBaseGame constructor called with config:', config);
    
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

  /**
   * Validate the provided configuration
   * @param {Object} config - The configuration object to validate
   */
  validateConfig(config) {
    console.log('AbstractBaseGame.validateConfig called with config:', config);
    
    // Validate that the config has required properties
    if (!config) {
      console.warn('Invalid or undefined config passed to AbstractBaseGame');
      return;
    }
    
    if (!config.gameTitle) {
      console.warn('No game title provided in config');
    }
  }

  /**
   * Abstract method to spin the game
   * @param {Function} callback - Function to call with results when spin is complete
   */
  spin(callback) {
    console.warn('AbstractBaseGame.spin() called - subclasses must implement this method');
    
    // Provide a default implementation instead of throwing error
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback({
          isWin: Math.random() > 0.7,
          payout: 10
        });
      }
    }, 1000);
  }

  /**
   * Abstract method to calculate win amount
   * @param {number} betAmount - The bet amount
   * @param {string} riskLevel - The risk level ('low', 'medium', 'high')
   * @param {Object} result - The result of the spin
   * @returns {number} - The calculated win amount
   */
  calculateWin(betAmount, riskLevel, result) {
    console.warn('AbstractBaseGame.calculateWin() called - subclasses must implement this method');
    
    // Provide a default implementation instead of throwing error
    if (!result || !result.isWin) return 0;
    
    const multipliers = {
      'low': 2,
      'medium': 3,
      'high': 5
    };
    const multiplier = multipliers[riskLevel] || 3;
    return betAmount * multiplier;
  }

  /**
   * Render the game using Canvas 2D
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} state - The current game state
   */
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
      ctx.fillText('Subclass must implement renderGame', centerX, centerY);
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
  
  /**
   * Deprecated method - PIXI has been removed from the core framework
   * Individual games can implement their own PIXI rendering if needed
   * @deprecated
   */
  renderGameWithPixi() {
    console.warn('PIXI has been removed from the core framework. Use Canvas2D rendering instead or implement PIXI in your game directly.');
  }

  /**
   * Handle a win result
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {number} winAmount - The amount won
   * @param {Object} result - The result of the spin
   */
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

  /**
   * Handle a loss result
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} result - The result of the spin
   */
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

  /**
   * Utility method to draw text with consistent styling
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {string} text - The text to draw
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} options - Text options
   */
  drawText(ctx, text, x, y, options = {}) {
    // Delegate to the Helpers utility class for drawing text
    if (window.Helpers && typeof window.Helpers.drawText === 'function') {
      window.Helpers.drawText(ctx, text, x, y, options);
    } else {
      // Fallback if Helpers is not available
      const {
        font = 'bold 48px Poppins',
        color = '#FFD700',
        align = 'center',
        baseline = 'middle'
      } = options;
      
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }
}

// Export the abstract base class
window.AbstractBaseGame = AbstractBaseGame;