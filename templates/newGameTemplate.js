/**
   * NewGameTemplate - Template for creating new games using the framework
   * 
   * INSTRUCTIONS:
   * 1. Copy this file to js/games/yourGameName.js
   * 2. Rename the class to your game name
   * 3. Implement the required methods
   * 4. Register your game in the GameLoader
   *    gameLoader.registerGame('gametype', 'Game Name', 'js/games/yourGameName.js', 'YourGameName');
   */

class NewGameTemplate extends BaseGame {
    constructor(config = {}) {
      // Define game-specific default configuration
      const defaultConfig = {
        gameTitle: 'New Game',
        // Add other game-specific config properties
      };

      // Call parent constructor with merged config
      super({...defaultConfig, ...config});

      // Add game-specific properties here
      this.gameState = {
        // Your game's specific state
      };

      // Initialize game-specific elements
      this.init();
    }

    /**
     * Initialize game-specific elements
     */
    init() {
      // Implement any game-specific initialization logic
    }

    /**
     * Handle the spin action
     * @param {Function} callback - Function to call when spin is complete
     */
    spin(callback) {
      // Implement spin logic
      // Example:
      setTimeout(() => {
        // Generate game result
        const result = {
          isWin: Math.random() > 0.7,
          // Add game-specific result data
        };

        // Return the result through the callback
        callback(result);
      }, 2000);
    }

    /**
     * Calculate the win amount
     * @param {number} betAmount - The bet amount
     * @param {string} riskLevel - The risk level
     * @param {Object} result - The spin result
     * @returns {number} The calculated win amount
     */
    calculateWin(betAmount, riskLevel, result) {
      // Implement win calculation logic
      const riskMultipliers = {
        'low': 1.5,
        'medium': 3,
        'high': 6
      };

      if (!result.isWin) {
        return 0;
      }

      // Example calculation
      return betAmount * riskMultipliers[riskLevel];
    }

    /**
     * Render the game on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} state - The game state
     */
    renderGame(ctx, width, height, state) {
      // Implement rendering logic
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw your game elements here

      // Example: Draw title
      this.drawText(ctx, this.game.config.gameTitle, centerX, centerY - 100);

      // Example: Draw game area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(centerX - 200, centerY - 150, 400, 300);

      // Example: Draw instructions
      this.drawText(ctx, 'Game Instructions', centerX, centerY + 200, {
        font: '24px Montserrat',
        color: 'rgba(255, 255, 255, 0.8)'
      });
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
      // Implement win animation/display
      const centerX = width / 2;

      // Example: Draw win message
      this.drawText(ctx, `WIN! +${winAmount.toFixed(2)} €`, centerX, 150, {
        font: 'bold 64px Poppins',
        color: '#FFD700'
      });
    }

    /**
     * Handle loss display
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} result - The spin result
     */
    handleLoss(ctx, width, height, result) {
      // Implement loss display
      const centerX = width / 2;

      // Example: Draw try again message
      this.drawText(ctx, 'Try again!', centerX, height - 100, {
        font: 'bold 36px Poppins',
        color: 'rgba(255, 255, 255, 0.5)'
      });
    }
  }

  // Don't forget to register your game with the gameLoader!
  // Example: gameLoader.registerGame('newgame', 'New Game', 'js/games/newGameTemplate.js', 'NewGameTemplate');