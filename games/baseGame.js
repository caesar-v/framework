/**
 * BaseGame - Abstract base class for all game implementations
 */
class BaseGame {
  constructor(config = {}) {
    console.log('BaseGame constructor called with config:', config);
    
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
    throw new Error('renderGame() method must be implemented by subclass');
  }

  handleWin(ctx, width, height, winAmount, result) {
    throw new Error('handleWin() method must be implemented by subclass');
  }

  handleLoss(ctx, width, height, result) {
    throw new Error('handleLoss() method must be implemented by subclass');
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