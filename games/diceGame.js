/**
 * Dice Game - Example implementation using GameFramework
 * 
 * This demonstrates how to create a dice game using the framework
 */

class DiceGame extends BaseGame {
    constructor(config = {}) {
      // Default dice configuration
      const diceConfig = {
        gameTitle: 'Lucky Dice',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        numDice: 3,
        diceSize: 80,
        diceColors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'],
        winningConditions: {
          // Map of win conditions and their multipliers
          'allSame': 5,       // All dice show the same value
          'straight': 3,      // Consecutive values (e.g., 1-2-3 or 4-5-6)
          'onePair': 1.5,     // At least two dice show the same value
        }
      };
      
      // Merge configs and call parent constructor
      const mergedConfig = {...diceConfig, ...config};
      super(mergedConfig);
      
      // Ensure this.config is set correctly
      this.config = mergedConfig;
      
      // Current dice values
      this.diceValues = [];
      this.diceRotations = [];
      this.animationPhase = 0;
      
      // Random dice positions for animation
      this.dicePositions = [];
      
      // Initialize dice
      this.initDice();
      
      // Start animation loop
      this.animate();
    }
    
    /**
     * Initialize dice with random values
     */
    initDice() {
      this.diceValues = [];
      this.diceRotations = [];
      this.dicePositions = [];
      
      for (let i = 0; i < this.config.numDice; i++) {
        // Random initial value (1-6)
        this.diceValues.push(Math.floor(Math.random() * 6) + 1);
        
        // Random rotation for animation
        this.diceRotations.push({
          x: Math.random() * 360,
          y: Math.random() * 360,
          z: Math.random() * 360
        });
        
        // Random position offset for animation
        this.dicePositions.push({
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100
        });
      }
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
        console.warn('Invalid configuration object passed to DiceGame');
        return;
      }
      
      if (!config.diceColors || !Array.isArray(config.diceColors) || config.diceColors.length === 0) {
        console.warn('No dice colors provided in configuration');
      }
      
      if (!config.numDice || typeof config.numDice !== 'number' || config.numDice <= 0) {
        console.warn('Invalid numDice configuration provided');
      }
      
      if (!config.winningConditions || typeof config.winningConditions !== 'object') {
        console.warn('Invalid winningConditions configuration provided');
      }
    }
    
    /**
     * Animation loop for dice
     */
    animate() {
      // Increment animation phase
      this.animationPhase += 0.02;
      
      // Update dice rotations for idle animation
      for (let i = 0; i < this.diceRotations.length; i++) {
        // Gentle rotation for idle animation
        this.diceRotations[i].x += 0.2 * Math.sin(this.animationPhase + i);
        this.diceRotations[i].y += 0.3 * Math.cos(this.animationPhase * 0.7 + i);
      }
      
      // Request next frame
      requestAnimationFrame(() => this.animate());
      
      // Redraw only if game is initialized and not spinning
      if (this.game && !this.game.state.isSpinning) {
        this.game.drawCanvas();
      }
    }
    
    /**
     * Handle the spin action
     * @param {Function} callback - Function to call when spin is complete
     */
    spin(callback) {
      // Reset dice positions for animation
      for (let i = 0; i < this.config.numDice; i++) {
        this.dicePositions[i] = {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200
        };
        
        // Fast rotation during spin
        this.diceRotations[i] = {
          x: Math.random() * 720 - 360,
          y: Math.random() * 720 - 360,
          z: Math.random() * 720 - 360
        };
      }
      
      // Animation time before revealing result
      setTimeout(() => {
        // Generate new dice values
        this.diceValues = [];
        for (let i = 0; i < this.config.numDice; i++) {
          this.diceValues.push(Math.floor(Math.random() * 6) + 1);
        }
        
        // Reset positions for result display
        for (let i = 0; i < this.config.numDice; i++) {
          this.dicePositions[i] = {
            x: 0,
            y: 0
          };
          
          // Set final rotation based on dice value
          // This creates the illusion that specific faces are showing
          this.diceRotations[i] = this.getDiceRotation(this.diceValues[i]);
        }
        
        // Check for winning combinations
        const result = this.checkWin();
        
        // Return the result
        callback(result);
      }, 2000);
    }
    
    /**
     * Get the rotation values to show a specific dice face
     * @param {number} value - The dice value (1-6)
     * @returns {Object} Rotation values for x, y, z axes
     */
    getDiceRotation(value) {
      // Different rotations to show different faces of a dice
      switch (value) {
        case 1: return { x: 0, y: 0, z: 0 }; // Front face (1)
        case 2: return { x: 0, y: -90, z: 0 }; // Right face (2)
        case 3: return { x: -90, y: 0, z: 0 }; // Top face (3)
        case 4: return { x: 90, y: 0, z: 0 }; // Bottom face (4)
        case 5: return { x: 0, y: 90, z: 0 }; // Left face (5)
        case 6: return { x: 180, y: 0, z: 0 }; // Back face (6)
        default: return { x: 0, y: 0, z: 0 };
      }
    }
    
    /**
     * Check if there are any winning combinations
     * @returns {Object} Result object with win information
     */
    checkWin() {
      // Check for winning combinations
      const sortedValues = [...this.diceValues].sort((a, b) => a - b);
      
      // Check for "all same"
      const allSame = sortedValues.every(value => value === sortedValues[0]);
      
      // Check for straight (consecutive values)
      let isStraight = true;
      for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] !== sortedValues[i-1] + 1) {
          isStraight = false;
          break;
        }
      }
      
      // Check for at least one pair
      let hasPair = false;
      for (let i = 1; i < sortedValues.length; i++) {
        if (sortedValues[i] === sortedValues[i-1]) {
          hasPair = true;
          break;
        }
      }
      
      // Determine the win type (best win takes precedence)
      let winType = null;
      if (allSame) {
        winType = 'allSame';
      } else if (isStraight) {
        winType = 'straight';
      } else if (hasPair) {
        winType = 'onePair';
      }
      
      const isWin = winType !== null;
      
      return {
        isWin,
        winType,
        diceValues: this.diceValues
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
      
      if (!result.isWin || !result.winType) {
        return 0;
      }
      
      // Base win is the win condition's multiplier times the bet
      const baseMultiplier = this.config.winningConditions[result.winType];
      const baseWin = baseMultiplier * betAmount;
      
      // Apply risk multiplier
      return baseWin * riskMultipliers[riskLevel];
    }
    
    /**
     * Render a single die
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} size - The die size
     * @param {number} value - The die value (1-6)
     * @param {Object} rotation - Rotation values for x, y, z axes
     * @param {string} color - The die color
     */
    renderDie(ctx, x, y, size, value, rotation, color) {
      ctx.save();
      ctx.translate(x, y);
      
      // Apply pseudo-3D rotation (simplified)
      // This is a very basic approximation of 3D rotation
      const scale = 0.8 + 0.2 * Math.cos(rotation.x * Math.PI / 180);
      ctx.scale(scale, scale);
      
      // Draw die body
      ctx.fillStyle = color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      
      // Die with rounded corners
      const radius = size * 0.2;
      ctx.beginPath();
      ctx.moveTo(-size/2 + radius, -size/2);
      ctx.lineTo(size/2 - radius, -size/2);
      ctx.arcTo(size/2, -size/2, size/2, -size/2 + radius, radius);
      ctx.lineTo(size/2, size/2 - radius);
      ctx.arcTo(size/2, size/2, size/2 - radius, size/2, radius);
      ctx.lineTo(-size/2 + radius, size/2);
      ctx.arcTo(-size/2, size/2, -size/2, size/2 - radius, radius);
      ctx.lineTo(-size/2, -size/2 + radius);
      ctx.arcTo(-size/2, -size/2, -size/2 + radius, -size/2, radius);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      
      // Draw dots based on value and rotation
      ctx.fillStyle = '#fff';
      
      // Simplified dot drawing - normally you'd account for 3D rotation,
      // but we'll just draw the dots for the face value
      switch (value) {
        case 1:
          this.drawDot(ctx, 0, 0, size * 0.12);
          break;
        case 2:
          this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
          break;
        case 3:
          this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, 0, 0, size * 0.12);
          this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
          break;
        case 4:
          this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
          this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
          break;
        case 5:
          this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
          this.drawDot(ctx, 0, 0, size * 0.12);
          this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
          break;
        case 6:
          this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
          this.drawDot(ctx, -size * 0.25, 0, size * 0.12);
          this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
          this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
          this.  drawDot(ctx, size * 0.25, 0, size * 0.12);
          this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
          break;
      }
      
      ctx.restore();
    }
    
    /**
     * Draw a dot on the die
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} radius - The dot radius
     */
    drawDot(ctx, x, y, radius) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    /**
     * Render the game on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} state - The game state
     */
    renderGame(ctx, width, height, state) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw table background
      ctx.fillStyle = '#1a5d1a';
      ctx.fillRect(centerX - 400, centerY - 250, 800, 500);
      
      // Draw table border
      ctx.strokeStyle = '#0d3d0d';
      ctx.lineWidth = 20;
      ctx.strokeRect(centerX - 400, centerY - 250, 800, 500);
      
      // Draw title
      ctx.font = 'bold 48px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Lucky Dice', centerX, centerY - 300);
      
      // Draw dice
      const spacing = this.config.diceSize * 1.5;
      const startX = centerX - (spacing * (this.config.numDice - 1)) / 2;
      
      for (let i = 0; i < this.config.numDice; i++) {
        const value = this.diceValues[i];
        const rotation = this.diceRotations[i];
        const position = this.dicePositions[i];
        const color = this.config.diceColors[i % this.config.diceColors.length];
        
        this.renderDie(
          ctx,
          startX + i * spacing + position.x,
          centerY + position.y,
          this.config.diceSize,
          value,
          rotation,
          color
        );
      }
      
      // Draw instructions
      ctx.font = '24px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Roll the dice and match winning combinations!', centerX, centerY + 200);
      
      // Draw winning combinations table
      ctx.font = '18px Montserrat';
      ctx.textAlign = 'left';
      let y = centerY - 200;
      
      ctx.fillText('Winning Combinations:', centerX - 350, y);
      y += 30;
      
      ctx.fillText('• All Same: 5x', centerX - 350, y);
      y += 25;
      
      ctx.fillText('• Straight: 3x', centerX - 350, y);
      y += 25;
      
      ctx.fillText('• One Pair: 1.5x', centerX - 350, y);
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
      
      // Draw win message
      ctx.font = 'bold 64px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, 150);
      
      // Draw the win type
      let winTypeText = '';
      switch (result.winType) {
        case 'allSame':
          winTypeText = 'All Same Numbers!';
          break;
        case 'straight':
          winTypeText = 'Straight Combination!';
          break;
        case 'onePair':
          winTypeText = 'Matching Pair!';
          break;
      }
      
      ctx.font = 'bold 36px Poppins';
      ctx.fillText(winTypeText, centerX, 220);
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
      ctx.fillText('No winning combination. Try again!', centerX, height - 100);
    }
  }
  
// Export to global scope
window.DiceGame = DiceGame;