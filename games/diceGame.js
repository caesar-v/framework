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
      console.log('DiceGame.initDice - Starting initialization');
      
      // Add fallback for numDice
      const numDice = this.config && this.config.numDice ? this.config.numDice : 3;
      
      // Initialize arrays
      this.diceValues = [];
      this.diceRotations = [];
      this.dicePositions = [];
      
      for (let i = 0; i < numDice; i++) {
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
      
      console.log('DiceGame.initDice - Dice initialized:', {
        values: this.diceValues,
        positions: this.dicePositions,
        config: this.config
      });
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
      
      // Make sure diceRotations is initialized
      if (this.diceRotations && this.diceRotations.length > 0) {
        // Update dice rotations for idle animation
        for (let i = 0; i < this.diceRotations.length; i++) {
          if (this.diceRotations[i]) {
            // Gentle rotation for idle animation
            this.diceRotations[i].x += 0.2 * Math.sin(this.animationPhase + i);
            this.diceRotations[i].y += 0.3 * Math.cos(this.animationPhase * 0.7 + i);
          }
        }
      }
      
      // Request next frame - using a more stable approach with error handling
      try {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            try {
              this.animate();
            } catch (animError) {
              console.error("Animation loop error:", animError);
            }
          });
        }
      } catch (rafError) {
        console.error("Error requesting animation frame:", rafError);
      }
      
      // Redraw only if game is initialized and not spinning
      if (this.game && this.game.state && !this.game.state.isSpinning) {
        try {
          this.game.drawCanvas();
        } catch (drawError) {
          console.error("Error drawing canvas:", drawError);
        }
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
    renderGameWithPixi(pixiApp, container, width, height, state) {
      if (!pixiApp || !container) {
        console.warn('PIXI renderer not available for DiceGame');
        return;
      }
      
      // Use static flag to prevent excessive logging - log only once
      if (!this._loggedRenderInfoPixi) {
        console.log('DiceGame.renderGameWithPixi - Initial PIXI render');
        console.log('DiceGame.renderGameWithPixi - Initial render - diceValues:', this.diceValues);
        console.log('DiceGame.renderGameWithPixi - Initial render - dicePositions:', this.dicePositions);
        this._loggedRenderInfoPixi = true;
      }
      
      try {
        // Clear existing container
        container.removeChildren();
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create background that fills the entire canvas
        const background = new PIXI.Graphics();
        
        // Create gradient-like effect using multiple rectangles
        const topColor = 0x0e3c0a;
        const bottomColor = 0x195c1a;
        
        // Fill the entire canvas with gradient background
        background.beginFill(topColor);
        background.drawRect(0, 0, width, height);
        background.endFill();
        
        // Add second color to create gradient effect
        const gradientOverlay = new PIXI.Graphics();
        gradientOverlay.beginFill(bottomColor, 0.6);
        gradientOverlay.drawRect(0, height/2, width, height/2);
        gradientOverlay.endFill();
        
        container.addChild(background);
        container.addChild(gradientOverlay);
        
        // Create table that completely fills the canvas
        const tableWidth = width; // 100% of width
        const tableHeight = height; // 100% of height
        
        const table = new PIXI.Graphics();
        table.beginFill(0x1a5d1a);
        table.drawRect(
          centerX - tableWidth/2, 
          centerY - tableHeight/2, 
          tableWidth, 
          tableHeight
        );
        table.endFill();
        
        // Add felt texture/pattern with border that scales with table size
        const borderWidth = Math.max(5, Math.floor(tableWidth * 0.015));
        table.lineStyle(borderWidth, 0x0e4c0e); // Darker green border
        table.drawRect(
          centerX - tableWidth/2, 
          centerY - tableHeight/2, 
          tableWidth, 
          tableHeight
        );
        
        container.addChild(table);
        
        // Draw title with PIXI - font size scales with canvas
        const titleFontSize = Math.max(24, Math.min(48, width * 0.05));
        const titleStyle = new PIXI.TextStyle({
          fontFamily: 'Poppins, Arial',
          fontSize: titleFontSize,
          fontWeight: 'bold',
          fill: '#FFD700',
          align: 'center'
        });
        
        const titleText = new PIXI.Text(this.config.gameTitle, titleStyle);
        titleText.anchor.set(0.5);
        titleText.x = centerX;
        titleText.y = centerY - tableHeight * 0.4;
        
        container.addChild(titleText);
        
        // Draw dice on the table - code for this will be added later
        
        // Draw simple instructions if dice aren't rolled yet
        if (!this.diceValues || this.diceValues.length === 0) {
          const instructionsFontSize = Math.max(16, Math.min(24, width * 0.025));
          const instructionsStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: instructionsFontSize,
            fill: '#FFFFFF',
            align: 'center'
          });
          
          const instructionsText = new PIXI.Text('Click SPIN to roll dice!', instructionsStyle);
          instructionsText.anchor.set(0.5);
          instructionsText.x = centerX;
          instructionsText.y = centerY;
          
          container.addChild(instructionsText);
        }
        
        // Add winning combinations - text size scales with canvas
        const winTextSize = Math.max(12, Math.min(18, width * 0.018));
        const winTextStyle = new PIXI.TextStyle({
          fontFamily: 'Montserrat, Arial',
          fontSize: winTextSize,
          fill: '#FFFFFF',
          align: 'left'
        });
        
        // Position relative to table size
        const winX = centerX - tableWidth * 0.45;
        let winY = centerY - tableHeight * 0.3;
        
        const winTitleText = new PIXI.Text('Winning Combinations:', winTextStyle);
        winTitleText.x = winX;
        winTitleText.y = winY;
        container.addChild(winTitleText);
        
        winY += winTextSize * 1.5;
        const win1Text = new PIXI.Text('• All Same: 5x', winTextStyle);
        win1Text.x = winX;
        win1Text.y = winY;
        container.addChild(win1Text);
        
        winY += winTextSize * 1.3;
        const win2Text = new PIXI.Text('• Straight: 3x', winTextStyle);
        win2Text.x = winX;
        win2Text.y = winY;
        container.addChild(win2Text);
        
        winY += winTextSize * 1.3;
        const win3Text = new PIXI.Text('• One Pair: 1.5x', winTextStyle);
        win3Text.x = winX;
        win3Text.y = winY;
        container.addChild(win3Text);
      } catch (error) {
        console.error('Error in PIXI dice game rendering:', error);
      }
    }
    
    renderGame(ctx, width, height, state) {
      // Use static flag to prevent excessive logging - log only once
      if (!this._loggedRenderInfo) {
        console.log('DiceGame.renderGame - Initial render - config:', this.config);
        console.log('DiceGame.renderGame - Initial render - diceValues:', this.diceValues);
        console.log('DiceGame.renderGame - Initial render - dicePositions:', this.dicePositions);
        this._loggedRenderInfo = true;
      }
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Clear the entire canvas first
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient background that fills the entire canvas
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0e3c0a'); // Dark green at top
      gradient.addColorStop(1, '#195c1a'); // Slightly lighter green at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw gambling table with felt that completely fills the canvas
      // Table size exactly matches the canvas dimensions
      const tableWidth = width; // 100% of width
      const tableHeight = height; // 100% of height
      
      // Draw table background
      ctx.fillStyle = '#1a5d1a';
      ctx.fillRect(
        centerX - tableWidth/2, 
        centerY - tableHeight/2, 
        tableWidth, 
        tableHeight
      );
      
      // Draw table border with width proportional to table size
      const borderWidth = Math.max(5, Math.floor(tableWidth * 0.015));
      ctx.strokeStyle = '#0d3d0d';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        centerX - tableWidth/2, 
        centerY - tableHeight/2, 
        tableWidth, 
        tableHeight
      );
      
      // Draw title with font size proportional to canvas width
      const titleFontSize = Math.max(24, Math.min(48, width * 0.05));
      ctx.font = `bold ${titleFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        this.config.gameTitle || 'Lucky Dice',
        centerX,
        centerY - tableHeight * 0.4
      );
      
      // Add fallbacks for dice properties
      const diceSize = this.config && this.config.diceSize ? this.config.diceSize : 80;
      const numDice = this.config && this.config.numDice ? this.config.numDice : 3;
      const diceColors = this.config && this.config.diceColors ? this.config.diceColors : 
          ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
      
      // Adjust dice size based on canvas size
      const scaledDiceSize = Math.max(40, Math.min(diceSize, width * 0.08, height * 0.12));
      
      // Draw dice
      const spacing = scaledDiceSize * 1.5;
      const startX = centerX - (spacing * (numDice - 1)) / 2;
      
      // Make sure dice values and positions are initialized
      if (this.diceValues && this.diceRotations && this.dicePositions) {
        for (let i = 0; i < numDice; i++) {
          // Use fallbacks for all values
          const value = this.diceValues[i] !== undefined ? this.diceValues[i] : Math.floor(Math.random() * 6) + 1;
          const rotation = this.diceRotations[i] || { x: 0, y: 0, z: 0 };
          const position = this.dicePositions[i] || { x: 0, y: 0 };
          const color = diceColors[i % diceColors.length];
          
          this.renderDie(
            ctx,
            startX + i * spacing + position.x,
            centerY + position.y,
            scaledDiceSize,
            value,
            rotation,
            color
          );
        }
      } else {
        // Draw placeholder message if dice data isn't ready
        const msgFontSize = Math.max(16, Math.min(24, width * 0.025));
        ctx.font = `${msgFontSize}px Montserrat, Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('Loading dice...', centerX, centerY);
      }
      
      // Draw instructions - font size scales with canvas width
      const instructionsFontSize = Math.max(16, Math.min(24, width * 0.025));
      ctx.font = `${instructionsFontSize}px Montserrat, Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Roll the dice and match winning combinations!', 
        centerX, 
        centerY + tableHeight * 0.3
      );
      
      // Draw winning combinations table - font size scales with canvas width
      const winTextSize = Math.max(12, Math.min(18, width * 0.018));
      ctx.font = `${winTextSize}px Montserrat, Arial`;
      ctx.textAlign = 'left';
      
      // Position relative to table size
      const winX = centerX - tableWidth * 0.45;
      let winY = centerY - tableHeight * 0.3;
      
      ctx.fillText('Winning Combinations:', winX, winY);
      winY += winTextSize * 1.5;
      
      ctx.fillText('• All Same: 5x', winX, winY);
      winY += winTextSize * 1.3;
      
      ctx.fillText('• Straight: 3x', winX, winY);
      winY += winTextSize * 1.3;
      
      ctx.fillText('• One Pair: 1.5x', winX, winY);
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
      
      // Scale font sizes based on canvas dimensions
      const winFontSize = Math.max(32, Math.min(64, width * 0.065));
      const winTypeFontSize = Math.max(24, Math.min(36, width * 0.035));
      
      // Draw win message - position relative to canvas height
      ctx.font = `bold ${winFontSize}px Poppins, Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, height * 0.15);
      
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
      
      ctx.font = `bold ${winTypeFontSize}px Poppins, Arial`;
      ctx.fillText(winTypeText, centerX, height * 0.22);
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
      
      // Scale font size based on canvas dimensions
      const lossFontSize = Math.max(24, Math.min(36, width * 0.035));
      
      // Draw try again message - position relative to canvas height
      ctx.font = `bold ${lossFontSize}px Poppins, Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No winning combination. Try again!', centerX, height * 0.9);
    }
  }
  
// Export to global scope
window.DiceGame = DiceGame;