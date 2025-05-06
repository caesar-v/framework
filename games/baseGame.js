/**
 * BaseGame - Concrete implementation of AbstractBaseGame
 */
class BaseGame extends AbstractBaseGame {
  /**
   * Initialize the base game
   * @param {Object} config - Configuration object for the game
   */
  constructor(config = {}) {
    // Call the parent constructor with config
    super({
      gameTitle: 'Base Game',
      ...config
    });
    
    console.log('BaseGame constructor called with config:', config);
  }
  
  /**
   * Validate the provided configuration
   * @param {Object} config - The configuration object to validate
   */
  validateConfig(config) {
    console.log('BaseGame.validateConfig called with config:', config);
    
    // Validate that the config has required properties
    if (!config) {
      console.warn('Invalid or undefined config passed to BaseGame');
      return;
    }
    
    if (!config.gameTitle) {
      console.warn('No game title provided in config, using default');
      config.gameTitle = 'Base Game';
    }
    
    // Call parent validation as well
    super.validateConfig(config);
  }

  /**
   * Spin the game - specific implementation for Base Game
   * @param {Function} callback - Function to call with results when spin is complete
   */
  spin(callback) {
    console.log('BaseGame.spin() called');
    
    // Simulate a random game result after a short delay
    setTimeout(() => {
      // 30% chance to win
      const isWin = Math.random() > 0.7;
      
      // Call the callback with the result
      if (typeof callback === 'function') {
        callback({
          isWin,
          payout: isWin ? 20 : 0
        });
      }
    }, 1500);
  }

  /**
   * Calculate win amount based on bet amount, risk level, and result
   * @param {number} betAmount - The bet amount
   * @param {string} riskLevel - The risk level ('low', 'medium', 'high')
   * @param {Object} result - The result of the spin
   * @returns {number} - The calculated win amount
   */
  calculateWin(betAmount, riskLevel, result) {
    if (!result || !result.isWin) return 0;
    
    // Define multipliers based on risk level
    const multipliers = {
      'low': 2,
      'medium': 3,
      'high': 6
    };
    
    // Get the appropriate multiplier or use medium as default
    const multiplier = multipliers[riskLevel] || multipliers.medium;
    
    // Calculate and return the win amount
    const winAmount = betAmount * multiplier;
    console.log(`BaseGame.calculateWin: bet=${betAmount}, risk=${riskLevel}, multiplier=${multiplier}, win=${winAmount}`);
    
    return winAmount;
  }

  /**
   * Render the game using Canvas 2D
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} state - The current game state
   */
  renderGame(ctx, width, height, state) {
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
      
      // Draw game title
      this.drawText(ctx, this.config.gameTitle || 'Base Game', centerX, centerY - 120, {
        font: 'bold 48px Poppins, Arial',
        color: '#FFD700'
      });
      
      // Draw game state
      this.drawText(ctx, `Balance: ${state.balance.toFixed(2)} ${this.config.currency}`, centerX, centerY - 50, {
        font: '24px Arial',
        color: 'white'
      });
      
      this.drawText(ctx, `Bet: ${state.betAmount.toFixed(2)} ${this.config.currency}`, centerX, centerY, {
        font: '24px Arial',
        color: 'white'
      });
      
      this.drawText(ctx, `Risk Level: ${state.riskLevel}`, centerX, centerY + 50, {
        font: '24px Arial',
        color: 'white'
      });
      
      // Draw instructions
      this.drawText(ctx, state.isSpinning ? 'Spinning...' : 'Click SPIN to play!', centerX, centerY + 120, {
        font: '20px Arial',
        color: 'rgba(255, 255, 255, 0.7)'
      });
    } catch (error) {
      console.error('Error in BaseGame.renderGame:', error);
      // Fall back to parent implementation if there's an error
      super.renderGame(ctx, width, height, state);
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
    // BaseGame implementation for win display
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }
    
    try {
      const centerX = width / 2;
      
      // Scale font sizes based on canvas dimensions
      const winFontSize = Math.max(36, Math.min(72, width * 0.08));
      const subtitleFontSize = Math.max(28, Math.min(42, width * 0.04));
      
      // Clear the top area for win message
      ctx.clearRect(0, 0, width, height * 0.3);
      
      // Add gradient background for the win message area
      const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
      gradient.addColorStop(0, 'rgba(21, 28, 40, 0.9)');
      gradient.addColorStop(1, 'rgba(21, 28, 40, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height * 0.3);
      
      // Add gold border
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height * 0.3 - 20);
      
      // Draw win message with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw main win text
      ctx.font = `bold ${winFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} ${this.config.currency || '€'}`, centerX, height * 0.15);
      
      // Draw subtitle with smaller text
      ctx.font = `bold ${subtitleFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Congratulations!', centerX, height * 0.25);
      ctx.restore();
      
    } catch (error) {
      console.error('Error in BaseGame.handleWin rendering:', error);
      // Fall back to parent implementation if there's an error
      super.handleWin(ctx, width, height, winAmount, result);
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
    // BaseGame implementation for loss display
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }
    
    try {
      const centerX = width / 2;
      
      // Scale font size based on canvas dimensions
      const lossFontSize = Math.max(28, Math.min(42, width * 0.04));
      
      // Create semi-transparent overlay at the bottom
      ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
      const messageHeight = height * 0.15;
      ctx.fillRect(0, height - messageHeight, width, messageHeight);
      
      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, height - messageHeight + 10, width - 20, messageHeight - 20);
      
      // Draw try again message
      ctx.font = `bold ${lossFontSize}px Poppins, Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Better luck next time! Try again.', centerX, height - messageHeight / 2);
      
    } catch (error) {
      console.error('Error in BaseGame.handleLoss rendering:', error);
      // Fall back to parent implementation if there's an error
      super.handleLoss(ctx, width, height, result);
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
    // BaseGame implementation for drawing text
    if (!ctx) {
      console.warn('Canvas context not available for drawText');
      return;
    }
    
    try {
      // Extract options with defaults
      const {
        font = 'bold 24px Poppins, Arial',
        color = '#FFFFFF',
        align = 'center',
        baseline = 'middle',
        maxWidth,
        shadow = false,
        shadowColor = 'rgba(0, 0, 0, 0.5)',
        shadowBlur = 5,
        shadowOffsetX = 2,
        shadowOffsetY = 2
      } = options;
      
      // Save context state
      ctx.save();
      
      // Apply text properties
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      
      // Apply shadow if requested
      if (shadow) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
      }
      
      // Draw the text
      if (maxWidth) {
        ctx.fillText(text, x, y, maxWidth);
      } else {
        ctx.fillText(text, x, y);
      }
      
      // Restore context state
      ctx.restore();
    } catch (error) {
      console.error('Error in BaseGame.drawText:', error);
      // Use direct default text rendering as a last resort
      try {
        ctx.fillStyle = color || '#FFFFFF';
        ctx.fillText(text, x, y);
      } catch (e) {
        console.error('Final fallback text rendering failed:', e);
      }
    }
  }
}

// Export the base game
window.BaseGame = BaseGame;