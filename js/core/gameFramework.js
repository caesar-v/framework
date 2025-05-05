/**
 * GameFramework - Lightweight framework for game prototyping
 * 
 * This framework provides a structure for quickly prototyping casino-style games
 * with a consistent UI and customizable game logic.
 */

class GameFramework {
    /**
     * Initialize the game framework
     * @param {Object} config - Configuration object for the game
     */
    constructor(config = {}) {
      // Default configuration
      this.config = {
        gameTitle: 'Game Prototype',
        containerSelector: '#game-container',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        currency: '€',
        riskLevels: {
          low: 1.5,
          medium: 3,
          high: 6
        },
        defaultRiskLevel: 'medium',
        canvasBackground: {
          default: ['#071824', '#071d2a'],
          pirate: ['#1E1B4B', '#2D2B55'],
          neon: ['#0D0221', '#130B2A'],
          classic: ['#0E0E10', '#1F1F23']
        },
        themes: ['default', 'pirate', 'neon', 'classic'],
        defaultTheme: 'default',
        canvasDimensions: {
          pc: { width: 1920, height: 1080 },
          mobile: { width: 1080, height: 1920 }
        },
        defaultLayout: 'pc',
        // PixiJS integration options
        usePixi: true, // Whether to use PixiJS for rendering (if available)
        pixiOptions: {  // Additional options for PixiJS
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          backgroundAlpha: 1
        },
        // Default game logic - can be overridden
        gameLogic: {
          spin: null,  // Will be set to this.defaultSpin if not provided
          calculateWin: null,  // Will be set to this.defaultCalculateWin if not provided
          renderGame: null,  // Will be set to this.defaultRenderGame if not provided
          renderGameWithPixi: null, // Optional PixiJS renderer
          handleWin: null,  // Will be set to this.defaultHandleWin if not provided
          handleLoss: null  // Will be set to this.defaultHandleLoss if not provided
        },
        ...config
      };
  
      // Set default game logic functions if not provided
      if (!this.config.gameLogic.spin) this.config.gameLogic.spin = this.defaultSpin.bind(this);
      if (!this.config.gameLogic.calculateWin) this.config.gameLogic.calculateWin = this.defaultCalculateWin.bind(this);
      if (!this.config.gameLogic.renderGame) this.config.gameLogic.renderGame = this.defaultRenderGame.bind(this);
      if (!this.config.gameLogic.handleWin) this.config.gameLogic.handleWin = this.defaultHandleWin.bind(this);
      if (!this.config.gameLogic.handleLoss) this.config.gameLogic.handleLoss = this.defaultHandleLoss.bind(this);
  
      // Game state
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
  
      // Canvas context
      this.canvas = null;
      this.ctx = null;
  
      // Initialize the game
      this.init();
    }
  
    /**
     * Initialize the game
     * Set up DOM elements and event listeners
     */
    init() {
      console.log('GameFramework.init() called');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._initAfterDOM());
      } else {
        this._initAfterDOM();
      }
    }
    
    /**
     * Initialize after DOM is loaded
     * @private
     */
    _initAfterDOM() {
      console.log('GameFramework._initAfterDOM() called');
      
      // Set the game title
      document.title = this.config.gameTitle;
      
      // Get references to DOM elements
      this.elements = {
        container: document.querySelector(this.config.containerSelector),
        gameTitle: document.querySelector('.game-title'),
        canvas: document.getElementById('game-canvas'),
        themeSelect: document.getElementById('theme-select'),
        desktopLayout: document.getElementById('desktop'),
        mobileLayout: document.getElementById('mobile'),
        soundButton: document.getElementById('sound-button'),
        menuButton: document.getElementById('menu-button'),
        menuOverlay: document.getElementById('menu-overlay'),
        closeMenu: document.getElementById('close-menu'),
        popupTabs: document.querySelectorAll('.popup-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        manualTab: document.getElementById('manual-tab'),
        autoTab: document.getElementById('auto-tab'),
        spinButton: document.getElementById('spin-button'),
        currentTime: document.getElementById('current-time'),
        dimensionsDisplay: document.getElementById('dimensions-display'),
        betInput: document.getElementById('bet-input'),
        decreaseBet: document.getElementById('decrease-bet'),
        increaseBet: document.getElementById('increase-bet'),
        halfBet: document.getElementById('half-bet'),
        doubleBet: document.getElementById('double-bet'),
        maxBet: document.getElementById('max-bet'),
        quickBets: document.querySelectorAll('.quick-bet'),
        riskLevel: document.getElementById('risk-level'),
        potentialWin: document.getElementById('potential-win'),
        balanceDisplay: document.getElementById('balance-display')
      };
  
      // Set game title
      if (this.elements.gameTitle) {
        this.elements.gameTitle.textContent = this.config.gameTitle;
      }
      
      // CRITICAL FIX: Verify gameLogic exists and has all required methods
      this._ensureGameLogicComplete();
  
      // Initialize canvas
      this.canvas = this.elements.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.initCanvas();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Initialize displays
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);
      this.updatePotentialWin();
      this.updateBalance();
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
        this.config.gameLogic.renderGame = function(ctx, width, height, state) {
          if (!ctx) return;
          
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Draw game title
          ctx.font = 'bold 48px Arial';
          ctx.fillStyle = '#FFD700';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Game Prototype', centerX, centerY - 100);
          
          // Instructions
          ctx.font = '24px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText('Click SPIN to play!', centerX, centerY);
        };
      }
      
      if (!this.config.gameLogic.handleWin || typeof this.config.gameLogic.handleWin !== 'function') {
        this.config.gameLogic.handleWin = function(ctx, width, height, winAmount, result) {
          if (!ctx) return;
          
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Draw win message
          ctx.font = 'bold 64px Arial';
          ctx.fillStyle = '#FFD700';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, centerY - 50);
        };
      }
      
      if (!this.config.gameLogic.handleLoss || typeof this.config.gameLogic.handleLoss !== 'function') {
        this.config.gameLogic.handleLoss = function(ctx, width, height, result) {
          if (!ctx) return;
          
          const centerX = width / 2;
          
          // Draw try again message
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Try again!', centerX, height - 100);
        };
      }
    }
  
    /**
     * Set up event listeners for all interactive elements
     */
    setupEventListeners() {
      console.log('Setting up event listeners');
      
      // Helper function to safely add event listeners
      const safeAddEventListener = (element, event, handler) => {
        if (!element) {
          console.error(`Cannot add ${event} listener - element is undefined`);
          return false;
        }
        
        try {
          element.addEventListener(event, handler);
          return true;
        } catch (e) {
          console.error(`Error adding ${event} listener:`, e);
          return false;
        }
      };
      
      // Theme selection
      safeAddEventListener(this.elements.themeSelect, 'change', () => {
        this.changeTheme(this.elements.themeSelect.value);
      });
  
    // Note: We're removing the layout selection event listeners 
    // because the GameLoader will now handle these events
    // Layout selection will be controlled externally via the switchLayout method
  
      // Sound toggle
      safeAddEventListener(this.elements.soundButton, 'click', () => this.toggleSound());
  
      // Menu handling
      safeAddEventListener(this.elements.menuButton, 'click', () => this.toggleMenu(true));
      safeAddEventListener(this.elements.closeMenu, 'click', () => this.toggleMenu(false));
      safeAddEventListener(this.elements.menuOverlay, 'click', (e) => {
        if (e.target === this.elements.menuOverlay) {
          this.toggleMenu(false);
        }
      });
  
      // Tab navigation
      if (this.elements.popupTabs) {
        this.elements.popupTabs.forEach(tab => {
          safeAddEventListener(tab, 'click', () => {
            this.switchTab(tab.dataset.tab);
          });
        });
      }
  
      // Play mode tabs
      safeAddEventListener(this.elements.manualTab, 'click', () => {
        this.state.autoPlay = false;
        this.elements.manualTab.classList.add('active');
        this.elements.autoTab.classList.remove('active');
        this.elements.spinButton.textContent = 'SPIN';
      });
  
      safeAddEventListener(this.elements.autoTab, 'click', () => {
        this.state.autoPlay = true;
        this.elements.autoTab.classList.add('active');
        this.elements.manualTab.classList.remove('active');
        this.elements.spinButton.textContent = 'AUTO SPIN';
      });
  
      // Spin button
      safeAddEventListener(this.elements.spinButton, 'click', () => this.spin());
  
      // Bet controls
      safeAddEventListener(this.elements.decreaseBet, 'click', () => {
        if (this.state.isSpinning) return;
        this.state.betAmount = Math.max(1, this.state.betAmount - 1);
        this.elements.betInput.value = this.state.betAmount;
        this.updatePotentialWin();
      });
  
      safeAddEventListener(this.elements.increaseBet, 'click', () => {
        if (this.state.isSpinning) return;
        this.state.betAmount = Math.min(this.state.maxBet, this.state.betAmount + 1);
        this.elements.betInput.value = this.state.betAmount;
        this.updatePotentialWin();
      });
  
      safeAddEventListener(this.elements.halfBet, 'click', () => this.setHalfBet());
      safeAddEventListener(this.elements.doubleBet, 'click', () => this.setDoubleBet());
      safeAddEventListener(this.elements.maxBet, 'click', () => this.setMaxBet());
  
      // Quick bet buttons
      if (this.elements.quickBets) {
        this.elements.quickBets.forEach(button => {
          safeAddEventListener(button, 'click', () => {
            if (this.state.isSpinning || !button.dataset.bet) return;
            this.state.betAmount = parseInt(button.dataset.bet);
            this.elements.betInput.value = this.state.betAmount;
            this.updatePotentialWin();
          });
        });
      }
  
      // Risk level change
      safeAddEventListener(this.elements.riskLevel, 'change', () => {
        if (this.state.isSpinning) return;
        this.state.riskLevel = this.elements.riskLevel.value;
        this.updatePotentialWin();
      });
      
      console.log('All event listeners set up successfully');
  
      // Window resize
      window.addEventListener('resize', () => {
        this.drawCanvas();
      });
    }
  
    /**
     * Initialize the canvas with the correct dimensions
     */
    initCanvas() {
      // Set canvas dimensions based on layout
      const targetDims = this.config.canvasDimensions[this.state.layout];
      this.canvas.width = targetDims.width;
      this.canvas.height = targetDims.height;
      
      // Update dimensions display
      this.elements.dimensionsDisplay.textContent = `${this.canvas.width}×${this.canvas.height}`;
      
      // Initialize PixiJS if enabled and available
      if (this.config.usePixi && window.PIXI && window.PixiHelper) {
        this.initPixi();
      }
      
      // Draw canvas content
      this.drawCanvas();
    }
    
    /**
     * Initialize PixiJS rendering
     */
    initPixi() {
      // Only initialize once
      if (this.pixiApp) return;
      
      try {
        console.log('Initializing PixiJS application');
        
        // Create Pixi application
        this.pixiApp = PixiHelper.initApp(this.canvas, {
          backgroundColor: this.getBackgroundColor(),
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });
        
        // Create a container for all game elements
        this.pixiContainer = PixiHelper.createContainer();
        this.pixiApp.stage.addChild(this.pixiContainer);
        
        // Create a background container
        this.pixiBackground = PixiHelper.createContainer();
        this.pixiContainer.addChild(this.pixiBackground);
        
        // Create a foreground container for UI elements
        this.pixiForeground = PixiHelper.createContainer();
        this.pixiContainer.addChild(this.pixiForeground);
        
        console.log('PixiJS initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PixiJS:', error);
        this.pixiApp = null;
      }
    }
    
    /**
     * Get the background color based on the current theme
     * @returns {number} - The hex color as a number
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
  
    /**
     * Draw the canvas with the appropriate theme and layout
     */
    drawCanvas() {
      // CRITICAL FIX: Always re-check game logic methods before drawing
      this._ensureGameLogicComplete();
      
      // Check if we should use PixiJS
      if (this.pixiApp && this.config.usePixi) {
        this.drawWithPixi();
      } else {
        this.drawWithCanvas2D();
      }
    }
    
    /**
     * Draw using the PixiJS renderer
     */
    drawWithPixi() {
      // Clear existing containers
      this.pixiBackground.removeChildren();
      
      // Create background with gradient (using a rectangle)
      const colors = this.config.canvasBackground && this.config.canvasBackground[this.state.theme] 
        ? this.config.canvasBackground[this.state.theme]
        : ['#071824', '#071d2a']; // Default colors
        
      // Convert hex to number
      const color1 = parseInt(colors[0].replace('#', ''), 16);
      const color2 = parseInt(colors[1].replace('#', ''), 16);
      
      // Create gradient background using a rectangle with fill gradient
      const background = new PIXI.Graphics();
      
      // Create vertical or horizontal gradient based on layout
      if (this.state.layout === 'pc') {
        // Vertical gradient
        background.beginTextureFill({
          texture: this.createGradientTexture(color1, color2, false),
          alpha: 1
        });
      } else {
        // Horizontal gradient
        background.beginTextureFill({
          texture: this.createGradientTexture(color1, color2, true),
          alpha: 1
        });
      }
      
      // Draw full-screen rectangle
      background.drawRect(0, 0, this.canvas.width, this.canvas.height);
      background.endFill();
      
      // Add to background container
      this.pixiBackground.addChild(background);
      
      // Draw grid if in debug mode
      if (window.debugManager && window.debugManager.isDebugEnabled) {
        this.drawGridWithPixi();
      }
      
      // Call the game's render function with safety check
      if (this.config && this.config.gameLogic) {
        try {
          // Check if there's a dedicated Pixi renderer in the game logic
          if (typeof this.config.gameLogic.renderGameWithPixi === 'function') {
            this.config.gameLogic.renderGameWithPixi(this.pixiApp, this.pixiContainer, this.canvas.width, this.canvas.height, this.state);
          } else if (typeof this.config.gameLogic.renderGame === 'function') {
            // Fall back to Canvas2D rendering if no Pixi renderer is provided
            this.drawWithCanvas2D();
          }
        } catch (error) {
          console.error('Error in game renderGameWithPixi:', error);
          this.renderFallbackGameWithPixi();
        }
      } else {
        this.renderFallbackGameWithPixi();
      }
    }
    
    /**
     * Create a gradient texture for Pixi
     */
    createGradientTexture(color1, color2, horizontal = false) {
      const quality = 256;
      const canvas = document.createElement('canvas');
      
      if (horizontal) {
        canvas.width = quality;
        canvas.height = 1;
      } else {
        canvas.width = 1;
        canvas.height = quality;
      }
      
      const ctx = canvas.getContext('2d');
      
      // Create gradient
      const gradient = horizontal 
        ? ctx.createLinearGradient(0, 0, quality, 0)
        : ctx.createLinearGradient(0, 0, 0, quality);
        
      // Convert numbers back to hex strings for canvas
      const hex1 = '#' + color1.toString(16).padStart(6, '0');
      const hex2 = '#' + color2.toString(16).padStart(6, '0');
      
      gradient.addColorStop(0, hex1);
      gradient.addColorStop(1, hex2);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      return PIXI.Texture.from(canvas);
    }
    
    /**
     * Draw grid using PixiJS
     */
    drawGridWithPixi() {
      const gridGraphics = new PIXI.Graphics();
      gridGraphics.lineStyle(1, 0xFFFFFF, 0.1);
      
      // Vertical grid lines
      for (let x = 0; x < this.canvas.width; x += 100) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, this.canvas.height);
      }
      
      // Horizontal grid lines
      for (let y = 0; y < this.canvas.height; y += 100) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(this.canvas.width, y);
      }
      
      this.pixiBackground.addChild(gridGraphics);
    }
    
    /**
     * Render fallback game using PixiJS
     */
    renderFallbackGameWithPixi() {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      // Game title
      const titleText = PixiHelper.createText(
        this.config.gameTitle || 'Game Prototype',
        {
          fontFamily: 'Arial',
          fontSize: 48,
          fontWeight: 'bold',
          fill: 0xFFD700,
          align: 'center'
        },
        {
          x: centerX,
          y: centerY - 80,
          anchor: 0.5
        }
      );
      
      // Instructions
      const instructionsText = PixiHelper.createText(
        'Game is initializing...',
        {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0xFFFFFF,
          align: 'center'
        },
        {
          x: centerX,
          y: centerY,
          anchor: 0.5
        }
      );
      
      // Click to play
      const clickText = PixiHelper.createText(
        'Click SPIN to play',
        {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xFFFFFF,
          alpha: 0.6,
          align: 'center'
        },
        {
          x: centerX,
          y: centerY + 50,
          anchor: 0.5
        }
      );
      
      // Add to container
      this.pixiForeground.addChild(titleText);
      this.pixiForeground.addChild(instructionsText);
      this.pixiForeground.addChild(clickText);
    }
    
    /**
     * Draw using the Canvas 2D API (original implementation)
     */
    drawWithCanvas2D() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Create gradient based on theme and layout
      let gradient;
      if (this.state.layout === 'pc') {
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      } else {
        gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
      }
      
      // Set colors based on theme with safety check
      const colors = this.config.canvasBackground && this.config.canvasBackground[this.state.theme] 
        ? this.config.canvasBackground[this.state.theme]
        : ['#071824', '#071d2a']; // Default colors
      
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      // Fill background
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw grid for reference
      this.drawGrid();
      
      // Call the game's render function with safety check
      if (this.config && this.config.gameLogic && typeof this.config.gameLogic.renderGame === 'function') {
        try {
          this.config.gameLogic.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
        } catch (error) {
          this.renderFallbackGame();
        }
      } else {
        this.renderFallbackGame();
      }
    }
    
    /**
     * Render a fallback game display when the actual game rendering fails
     * @private
     */
    renderFallbackGame() {
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
     * Draw a reference grid on the canvas
     */
    drawGrid() {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x < this.canvas.width; x += 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < this.canvas.height; y += 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }
  
    /**
     * Update the current time display
     */
    updateTime() {
      const now = new Date();
      this.elements.currentTime.textContent = now.toLocaleTimeString();
    }
  
    /**
     * Calculate the potential win based on bet and risk level
     */
    calculatePotentialWin() {
      const multiplier = this.config.riskLevels[this.state.riskLevel];
      return this.state.betAmount * multiplier;
    }
  
    /**
     * Update the potential win display
     */
    updatePotentialWin() {
      this.elements.potentialWin.textContent = this.calculatePotentialWin().toFixed(2) + ` ${this.config.currency}`;
    }
  
    /**
     * Update the balance display
     */
    updateBalance() {
      this.elements.balanceDisplay.textContent = this.state.balance.toFixed(2) + ` ${this.config.currency}`;
    }
  
    /**
     * Toggle sound on/off
     */
    toggleSound() {
      this.state.soundEnabled = !this.state.soundEnabled;
      this.elements.soundButton.classList.toggle('active');
      this.elements.soundButton.textContent = this.state.soundEnabled ? '🔊' : '🔈';
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
      this.updateBalance();
      this.elements.spinButton.textContent = 'SPINNING...';
      
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
          this.elements.spinButton.textContent = this.state.autoPlay ? 'AUTO SPIN' : 'SPIN';
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
        this.updateBalance();
        
        // Call the game's win handler with safety check
        if (this.config && this.config.gameLogic && typeof this.config.gameLogic.handleWin === 'function') {
          this.config.gameLogic.handleWin(this.ctx, this.canvas.width, this.canvas.height, winAmount, result);
        } else {
          // Default win handler
          console.error('Game logic handleWin method is missing - using default');
          if (this.ctx) {
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillStyle = 'gold';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`WIN! +${winAmount.toFixed(2)} ${this.config.currency}`, 
                              this.canvas.width/2, this.canvas.height/2);
          }
        }
      } else {
        // Call the game's loss handler with safety check
        if (this.config && this.config.gameLogic && typeof this.config.gameLogic.handleLoss === 'function') {
          this.config.gameLogic.handleLoss(this.ctx, this.canvas.width, this.canvas.height, result);
        } else {
          // Default loss handler
          console.error('Game logic handleLoss method is missing - using default');
          if (this.ctx) {
            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Try again!', this.canvas.width/2, this.canvas.height - 100);
          }
        }
      }
      
      this.state.isSpinning = false;
      this.elements.spinButton.textContent = this.state.autoPlay ? 'AUTO SPIN' : 'SPIN';
      
      // If auto play is enabled, continue spinning after a delay
      if (this.state.autoPlay && this.state.balance >= this.state.betAmount) {
        setTimeout(() => this.spin(), 1500);
      } else {
        // Redraw canvas after a short delay to clear any win/loss messages
        setTimeout(() => this.drawCanvas(), 2000);
      }
    }
  
    /**
     * Set the bet to half of the current bet
     */
    setHalfBet() {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.max(1, Math.floor(this.state.betAmount / 2));
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
    }
    
    /**
     * Double the current bet amount
     */
    setDoubleBet() {
      if (this.state.isSpinning) return;
      // Double the current bet, but don't exceed max bet or current balance
      const doubled = this.state.betAmount * 2;
      this.state.betAmount = Math.min(doubled, this.state.maxBet, this.state.balance);
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
    }
  
    /**
     * Set the bet to the maximum allowed
     */
    setMaxBet() {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.min(this.state.maxBet, this.state.balance);
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
    }
  
    /**
     * Switch between PC and mobile layouts
     * @param {string} layout - The layout to switch to ('pc' or 'mobile')
     */
    switchLayout(layout) {
      this.state.layout = layout;
      
      if (layout === 'pc') {
        this.elements.container.classList.remove('mobile');
        this.elements.container.classList.add('pc');
      } else {
        this.elements.container.classList.remove('pc');
        this.elements.container.classList.add('mobile');
      }
      
      // Reinitialize canvas for new dimensions
      this.initCanvas();
    }
  
    /**
     * Change the theme of the game
     * @param {string} themeName - The name of the theme to apply
     */
    changeTheme(themeName) {
      this.elements.container.className = `game-container ${this.state.layout}`;
      
      if (themeName !== 'default') {
        this.elements.container.classList.add(`theme-${themeName}`);
      }
      
      this.state.theme = themeName;
      this.drawCanvas();
    }
  
    /**
     * Toggle the menu overlay
     * @param {boolean} show - Whether to show or hide the menu
     */
    toggleMenu(show) {
      if (show) {
        this.elements.menuOverlay.classList.add('active');
      } else {
        this.elements.menuOverlay.classList.remove('active');
      }
    }
  
    /**
     * Switch between tabs in the popup menu
     * @param {string} tabId - The ID of the tab to switch to
     */
    switchTab(tabId) {
      // Update tab styling
      this.elements.popupTabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update content visibility
      this.elements.tabContents.forEach(content => {
        if (content.id === tabId + '-tab') {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    }
  
    /* DEFAULT GAME LOGIC METHODS */
    
    /**
     * Default implementation of the spin function
     * @param {Function} callback - Function to call when spin is complete
     */
    defaultSpin(callback) {
      // Simulate a delay for the spin animation
      setTimeout(() => {
        // 30% chance to win by default
        const isWin = Math.random() > 0.7;
        callback({ isWin });
      }, 2000);
    }
  
    /**
     * Default implementation of win calculation
     * @param {number} betAmount - The bet amount
     * @param {string} riskLevel - The risk level ('low', 'medium', 'high')
     * @param {Object} result - The result of the spin
     * @returns {number} - The calculated win amount
     */
    defaultCalculateWin(betAmount, riskLevel, result) {
      return betAmount * this.config.riskLevels[riskLevel];
    }
  
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
  
  // Export the framework
  window.GameFramework = GameFramework;