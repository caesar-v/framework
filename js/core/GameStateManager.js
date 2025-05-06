/**
 * GameStateManager - Handles game state and game logic
 */
class GameStateManager {
  /**
   * Initialize the game state manager
   * @param {Object} config - Configuration object
   * @param {CanvasManager} canvasManager - Reference to the canvas manager
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(config, canvasManager, uiManager) {
    this.config = config;
    this.canvasManager = canvasManager;
    this.uiManager = uiManager;
    
    // Initialize game state
    this.state = {
      theme: this.config.defaultTheme,
      layout: this.config.defaultLayout,
      soundEnabled: true,
      autoPlay: false,
      isSpinning: false,
      betAmount: this.config.initialBet,
      balance: this.config.initialBalance,
      riskLevel: this.config.defaultRiskLevel,
      maxBet: this.config.maxBet
    };
    
    // Ensure game logic is complete
    this._ensureGameLogicComplete();
  }

  /**
   * Ensure gameLogic has all required methods
   * Generic fallbacks for any game
   * @private
   */
  _ensureGameLogicComplete() {
    // First make sure gameLogic exists
    this.config.gameLogic = this.config.gameLogic || {};
    
    // Check each required method and provide a fallback if missing
    if (!this.config.gameLogic.spin || typeof this.config.gameLogic.spin !== 'function') {
      this.config.gameLogic.spin = function(callback) {
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback({
              isWin: Math.random() > 0.7,
              payout: 10
            });
          }
        }, 1000);
      };
    }
    
    if (!this.config.gameLogic.calculateWin || typeof this.config.gameLogic.calculateWin !== 'function') {
      this.config.gameLogic.calculateWin = function(betAmount, riskLevel, result) {
        if (!result.isWin) return 0;
        
        const multipliers = {
          'low': 2,
          'medium': 3,
          'high': 5
        };
        const multiplier = multipliers[riskLevel] || 3;
        return betAmount * multiplier;
      };
    }
    
    if (!this.config.gameLogic.renderGame || typeof this.config.gameLogic.renderGame !== 'function') {
      this.config.gameLogic.renderGame = this.defaultRenderGame.bind(this);
    }
    
    if (!this.config.gameLogic.handleWin || typeof this.config.gameLogic.handleWin !== 'function') {
      this.config.gameLogic.handleWin = this.defaultHandleWin.bind(this);
    }
    
    if (!this.config.gameLogic.handleLoss || typeof this.config.gameLogic.handleLoss !== 'function') {
      this.config.gameLogic.handleLoss = this.defaultHandleLoss.bind(this);
    }
  }

  /**
   * Begin the game spin process
   */
  spin() {
    if (this.state.isSpinning) {
      return;
    }
    
    if (this.state.balance < this.state.betAmount) {
      alert("Insufficient balance!");
      return;
    }
    
    // CRITICAL FIX: Always re-check game logic methods before spinning
    this._ensureGameLogicComplete();
    
    this.state.isSpinning = true;
    this.state.balance -= this.state.betAmount;
    this.uiManager.updateBalance();
    this.uiManager.elements.spinButton.textContent = 'SPINNING...';
    
    // Create a safety wrapper for the callback
    const safeCallback = (result) => {
      try {
        this.onSpinComplete(result || {
          isWin: Math.random() > 0.7,
          payout: 10
        });
      } catch (error) {
        console.error('Error in onSpinComplete handler:', error);
        // Reset spinning state as a last resort
        this.state.isSpinning = false;
        this.uiManager.elements.spinButton.textContent = this.state.autoPlay ? 'AUTO SPIN' : 'SPIN';
      }
    };
    
    try {
      // Double check spin method exists
      if (typeof this.config.gameLogic.spin !== 'function') {
        throw new Error('Missing spin method');
      }
      
      // Call the game's spin method with the safety wrapper
      this.config.gameLogic.spin(safeCallback);
    } catch (error) {
      console.error('Error calling game spin method:', error);
      // Fall back to default implementation
      setTimeout(() => {
        safeCallback({
          isWin: Math.random() > 0.7,
          payout: 10
        });
      }, 1000);
    }
  }

  /**
   * Handle the completion of a spin
   * @param {Object} result - Result of the spin
   */
  onSpinComplete(result) {
    const { canvas, ctx } = this.canvasManager.getCanvas();
    
    if (result && result.isWin) {
      // Calculate win amount with safety check
      let winAmount = 0;
      
      if (this.config && this.config.gameLogic && typeof this.config.gameLogic.calculateWin === 'function') {
        winAmount = this.config.gameLogic.calculateWin(
          this.state.betAmount, 
          this.state.riskLevel,
          result
        );
      } else {
        // Default win calculation
        console.error('Game logic calculateWin method is missing - using default');
        winAmount = this.state.betAmount * 2;
      }
      
      this.state.balance += winAmount;
      this.uiManager.updateBalance();
      
      // Call the game's win handler with safety check
      if (this.config && this.config.gameLogic && typeof this.config.gameLogic.handleWin === 'function') {
        this.config.gameLogic.handleWin(ctx, canvas.width, canvas.height, winAmount, result);
      } else {
        // Default win handler
        console.error('Game logic handleWin method is missing - using default');
        if (ctx) {
          ctx.font = 'bold 48px Arial';
          ctx.fillStyle = 'gold';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`WIN! +${winAmount.toFixed(2)} ${this.config.currency}`, 
                      canvas.width/2, canvas.height/2);
        }
      }
    } else {
      // Call the game's loss handler with safety check
      if (this.config && this.config.gameLogic && typeof this.config.gameLogic.handleLoss === 'function') {
        this.config.gameLogic.handleLoss(ctx, canvas.width, canvas.height, result);
      } else {
        // Default loss handler
        console.error('Game logic handleLoss method is missing - using default');
        if (ctx) {
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Try again!', canvas.width/2, canvas.height - 100);
        }
      }
    }
    
    this.state.isSpinning = false;
    this.uiManager.elements.spinButton.textContent = this.state.autoPlay ? 'AUTO SPIN' : 'SPIN';
    
    // If auto play is enabled, continue spinning after a delay
    if (this.state.autoPlay && this.state.balance >= this.state.betAmount) {
      setTimeout(() => this.spin(), 1500);
    } else {
      // Redraw canvas after a short delay to clear any win/loss messages
      setTimeout(() => this.uiManager.redrawCanvas(), 2000);
    }
  }

  /**
   * Get the current game state
   * @returns {Object} - The current game state
   */
  getState() {
    return this.state;
  }

  /**
   * Update the game state
   * @param {Object} newState - New state to merge with current state
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    return this.state;
  }

  /* DEFAULT GAME LOGIC METHODS */
  
  /**
   * Default implementation of the game rendering
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} state - The current game state
   */
  defaultRenderGame(ctx, width, height, state) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Fill the entire canvas with a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const colors = this.config.canvasBackground[this.state.theme] || ['#071824', '#071d2a'];
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    // Clear and fill the entire canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw center marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY);
    ctx.lineTo(centerX + 50, centerY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 50);
    ctx.lineTo(centerX, centerY + 50);
    ctx.stroke();
    
    // Draw text
    ctx.font = 'bold 48px Poppins';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.config.gameTitle, centerX, centerY - 80);
    
    ctx.font = '24px Montserrat';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('Game Canvas Area', centerX, centerY);
    
    ctx.font = '18px Montserrat';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${width}×${height}`, centerX, centerY + 40);
  }

  /**
   * Default implementation of win handling
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {number} winAmount - The amount won
   * @param {Object} result - The result of the spin
   */
  defaultHandleWin(ctx, width, height, winAmount, result) {
    // Flash win message on canvas
    ctx.font = 'bold 64px Poppins';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WIN! +${winAmount.toFixed(2)} ${this.config.currency}`, width / 2, height / 2);
  }

  /**
   * Default implementation of loss handling
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} result - The result of the spin
   */
  defaultHandleLoss(ctx, width, height, result) {
    // Optionally show a loss message
    ctx.font = 'bold 64px Poppins';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Try again!', width / 2, height / 2);
  }
}

// Export the game state manager
window.GameStateManager = GameStateManager;