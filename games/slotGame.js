/**
 * Slot Game - Example implementation using GameFramework
 * 
 * This demonstrates how to create a simple slot game using the framework
 */

class SlotGame extends BaseGame {
    constructor(config = {}) {
      // Default slot configuration
      const slotConfig = {
        gameTitle: 'Pirate Slots',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        reels: 3,
        rows: 3,
        symbols: ['🎁', '💀', '🗺️', '🧭', '🍾', '💰', '🏴‍☠️'],
        payouts: {
          '🎁': 10,
          '💀': 8,
          '🗺️': 5, 
          '🧭': 4,
          '🍾': 3,
          '💰': 2,
          '🏴‍☠️': 1
        }
      };
      
      // Merge configs and call parent constructor
      const mergedConfig = {...slotConfig, ...config};
      super(mergedConfig);
      
      // Ensure this.config is set correctly
      this.config = mergedConfig;
      
      // Current reel state
      this.reelState = [];
      
      // Initialize reels
      this.initReels();
    }
    
    /**
     * Validate the configuration
     * @param {Object} config - The configuration object
     */
    validateConfig(config) {
      // Call parent method if needed
      super.validateConfig(config);
      
      // Use the passed config object for validation
      // Add safety checks to prevent undefined access
      if (!config) {
        console.warn('Invalid configuration object passed to SlotGame');
        return;
      }
      
      if (!config.symbols || !Array.isArray(config.symbols) || config.symbols.length === 0) {
        console.warn('No symbols provided in slot configuration');
      }
      
      if (!config.reels || typeof config.reels !== 'number' || config.reels <= 0) {
        console.warn('Invalid reels configuration provided');
      }
      
      if (!config.rows || typeof config.rows !== 'number' || config.rows <= 0) {
        console.warn('Invalid rows configuration provided');
      }
    }
    
    /**
     * Initialize the slot reels with random symbols
     */
    initReels() {
      this.reelState = [];
      
      // Ensure config has necessary properties
      const reels = this.config && this.config.reels ? this.config.reels : 3;
      const rows = this.config && this.config.rows ? this.config.rows : 3;
      const symbols = this.config && this.config.symbols ? this.config.symbols : ['🎁', '💀', '🗺️', '🧭', '🍾', '💰', '🏴‍☠️'];
      
      for (let i = 0; i < reels; i++) {
        const reel = [];
        for (let j = 0; j < rows; j++) {
          const randomIndex = Math.floor(Math.random() * symbols.length);
          reel.push(symbols[randomIndex]);
        }
        this.reelState.push(reel);
      }
      
      console.log('Reels initialized:', this.reelState);
    }
    
    /**
     * Handle the spin action
     * @param {Function} callback - Function to call when spin is complete
     */
    spin(callback) {
      // Animation time
      setTimeout(() => {
        // Generate new reel state
        this.initReels();
        
        // Check for winning combinations
        const result = this.checkWin();
        
        // Return the result
        callback(result);
      }, 2000);
    }
    
    /**
     * Check if there are any winning combinations
     * @returns {Object} Result object with win information
     */
    checkWin() {
      // For simplicity, we'll just check for matching symbols on the middle row
      const middleRow = [];
      for (let i = 0; i < this.config.reels; i++) {
        middleRow.push(this.reelState[i][1]); // Get middle symbol of each reel
      }
      
      // Check if all symbols in the middle row are the same
      const firstSymbol = middleRow[0];
      const isWin = middleRow.every(symbol => symbol === firstSymbol);
      
      return {
        isWin,
        winningSymbol: isWin ? firstSymbol : null,
        winningRow: middleRow,
        reelState: this.reelState
      };
    }
    
    /**
     * Calculate the win amount
     * @param {number} betAmount - The bet amount
     * @param {string} riskLevel - The risk level
     * @param {Object} result - The spin result
     * @returns {number} The calculated win amount
     */
    calculateWin(betAmount, riskLevel, result) {
      const riskMultipliers = {
        'low': 1.5,
        'medium': 3,
        'high': 6
      };
      
      if (!result.isWin || !result.winningSymbol) {
        return 0;
      }
      
      // Base win is the symbol's payout value times the bet
      const baseWin = this.config.payouts[result.winningSymbol] * betAmount;
      
      // Apply risk multiplier
      return baseWin * riskMultipliers[riskLevel];
    }
    
    /**
     * Render the game on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} state - The game state
     */
    renderGame(ctx, width, height, state) {
      // Use static flag to prevent excessive logging - log only once
      if (!this._loggedRenderInfo) {
        console.log('SlotGame.renderGame - Initial render - config:', this.config);
        console.log('SlotGame.renderGame - Initial render - reelState:', this.reelState);
        this._loggedRenderInfo = true;
      }
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Define slot machine dimensions with fallbacks
      const slotWidth = 600;
      const slotHeight = 400;
      
      // Ensure config has necessary properties for rendering
      const reels = this.config && this.config.reels ? this.config.reels : 3;
      const rows = this.config && this.config.rows ? this.config.rows : 3;
      
      const reelWidth = slotWidth / reels;
      const symbolHeight = slotHeight / rows;
      
      // Draw slot machine frame
      ctx.fillStyle = '#333';
      ctx.fillRect(centerX - slotWidth/2 - 20, centerY - slotHeight/2 - 20, slotWidth + 40, slotHeight + 40);
      
      ctx.fillStyle = '#222';
      ctx.fillRect(centerX - slotWidth/2, centerY - slotHeight/2, slotWidth, slotHeight);
      
      // Draw title
      ctx.font = 'bold 48px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Pirate Slots', centerX, centerY - slotHeight/2 - 60);
      
      // Draw reels and symbols
      for (let i = 0; i < reels; i++) {
        // Draw reel background
        ctx.fillStyle = '#111';
        ctx.fillRect(
          centerX - slotWidth/2 + i * reelWidth + 5, 
          centerY - slotHeight/2 + 5, 
          reelWidth - 10, 
          slotHeight - 10
        );
        
        // Draw symbols
        for (let j = 0; j < rows; j++) {
          if (this.reelState && this.reelState[i] && this.reelState[i][j]) {
            ctx.font = `${symbolHeight * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              this.reelState[i][j],
              centerX - slotWidth/2 + i * reelWidth + reelWidth/2,
              centerY - slotHeight/2 + j * symbolHeight + symbolHeight/2
            );
          }
        }
      }
      
      // Highlight the middle row (payline)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - slotWidth/2, centerY);
      ctx.lineTo(centerX + slotWidth/2, centerY);
      ctx.stroke();
      
      // Draw payline label
      ctx.font = '18px Montserrat';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'right';
      ctx.fillText('PAYLINE', centerX - slotWidth/2 - 10, centerY);
      
      // Draw instructions
      ctx.font = '24px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Match 3 symbols on the payline to win!', centerX, centerY + slotHeight/2 + 50);
    }
    
    /**
     * Handle win animation/display
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {number} winAmount - The win amount
     * @param {Object} result - The spin result
     */
    handleWin(ctx, width, height, winAmount, result) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw win message
      ctx.font = 'bold 64px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, centerY - 200);
      
      // Draw the winning symbol larger
      if (result.winningSymbol) {
        ctx.font = 'bold 120px Arial';
        ctx.fillText(result.winningSymbol, centerX, centerY + 200);
      }
    }
    
    /**
     * Handle loss display
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} result - The spin result
     */
    handleLoss(ctx, width, height, result) {
      const centerX = width / 2;
      
      // Draw try again message
      ctx.font = 'bold 36px Poppins';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Try again!', centerX, height - 100);
    }
  }
  
// Export to global scope
window.SlotGame = SlotGame;