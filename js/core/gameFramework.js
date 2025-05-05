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
        usePixi: false, // Disabled by default due to compatibility issues
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
        settingsButton: document.getElementById('settings-button'),
        menuOverlay: document.getElementById('menu-overlay'),
        closeMenu: document.getElementById('close-menu'),
        settingsPanel: document.getElementById('settings-panel'),
        closeSettings: document.getElementById('close-settings'),
        popupTabs: document.querySelectorAll('.popup-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        manualTab: document.getElementById('manual-tab'),
        autoTab: document.getElementById('auto-tab'),
        spinButton: document.getElementById('spin-button'),
        currentTime: document.getElementById('current-time'),
        betInput: document.getElementById('bet-input'),
        decreaseBet: document.getElementById('decrease-bet'),
        increaseBet: document.getElementById('increase-bet'),
        halfBet: document.getElementById('half-bet'),
        doubleBet: document.getElementById('double-bet'),
        maxBet: document.getElementById('max-bet'),
        quickBets: document.querySelectorAll('.quick-bet'),
        riskLevel: document.getElementById('risk-level'),
        potentialWin: document.getElementById('potential-win'),
        balanceDisplay: document.getElementById('balance-display'),
        debugToggle: document.getElementById('debug-toggle'),
        debugButton: document.getElementById('debug-button'),
        autotestButton: document.getElementById('autotest-button'),
        gameSelect: document.getElementById('game-select'),
        // Screen resolution displays in settings panel
        screenResolution: document.getElementById('settings-screen-resolution'),
        windowSize: document.getElementById('settings-window-size'),
        canvasSize: document.getElementById('settings-canvas-size')
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
      
      // Listen for PIXI loading events
      window.addEventListener('pixiloaded', () => {
        console.log('Received pixiloaded event - reinitializing canvas with PIXI');
        // Reinitialize canvas with PIXI now available
        this.initCanvas();
      });
      
      window.addEventListener('pixifailed', () => {
        console.log('Received pixifailed event - disabling PIXI rendering');
        // Disable PIXI rendering since it failed to load
        this.config.usePixi = false;
        // Still initialize canvas with Canvas2D fallback
        this.initCanvas();
      });
      
      // Initial canvas setup
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
      
      // Settings panel handling
      safeAddEventListener(this.elements.settingsButton, 'click', () => this.toggleSettingsPanel(true));
      safeAddEventListener(this.elements.closeSettings, 'click', () => this.toggleSettingsPanel(false));
      
      // Close settings panel when clicking Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.elements.settingsPanel.classList.contains('active')) {
          this.toggleSettingsPanel(false);
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
  
      // Window resize handler - recalculate canvas dimensions
      window.addEventListener('resize', () => {
        // Debounce resize events to avoid performance issues
        if (this._resizeTimeout) {
          clearTimeout(this._resizeTimeout);
        }
        
        this._resizeTimeout = setTimeout(() => {
          console.log('Window resized, updating canvas dimensions');
          
          // Get new viewport dimensions
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Get actual screen dimensions when available
          const screenWidth = window.screen ? window.screen.width : viewportWidth;
          const screenHeight = window.screen ? window.screen.height : viewportHeight;
          
          // Get the playground element to calculate canvas dimensions
          const playgroundElement = document.querySelector('.playground-zone');
          
          // Calculate canvas dimensions based on the playground area
          let playgroundWidth = viewportWidth;
          let playgroundHeight = viewportHeight;
          
          if (playgroundElement) {
            // Get the actual available space in the playground (accounting for padding, margin)
            const playgroundRect = playgroundElement.getBoundingClientRect();
            playgroundWidth = playgroundRect.width;
            playgroundHeight = playgroundRect.height;
            
            console.log(`Playground dimensions after resize: ${playgroundWidth}×${playgroundHeight}`);
          } else {
            console.warn('Playground element not found, using viewport dimensions as fallback');
          }
          
          // Update the config with current playground dimensions
          this.config.canvasDimensions = {
            pc: { 
              width: playgroundWidth,
              height: playgroundHeight
            },
            mobile: { 
              width: playgroundWidth,
              height: playgroundHeight
            }
          };
          
          // Update canvas size
          const targetDims = this.config.canvasDimensions[this.state.layout];
          this.canvas.width = targetDims.width;
          this.canvas.height = targetDims.height;
          
          // Update screen resolution information in settings panel
          this.updateScreenInfo(screenWidth, screenHeight, viewportWidth, viewportHeight);
          
          // Add canvas dimensions to the settings info as well
          if (this.elements.windowSize) {
            this.elements.windowSize.textContent = `Window: ${viewportWidth}×${viewportHeight} | Canvas: ${this.canvas.width}×${this.canvas.height}`;
          }
          
          // Redraw canvas with new dimensions
          this.drawCanvas();
          
          // If using PixiJS, make sure to resize it too - v8 style
          if (this.pixiApp && this.pixiApp.renderer) {
            // PIXI v8 resize - different from earlier versions
            this.pixiApp.renderer.resize(this.canvas.width, this.canvas.height);
            // Render after resize
            this.pixiApp.render();
          }
          
          console.log(`Canvas resized to: ${this.canvas.width}×${this.canvas.height}`);
        }, 150); // debounce delay
      });
      
      // Also add a ResizeObserver to detect size changes in the playground area
      // This handles changes that might occur without a window resize event
      if (window.ResizeObserver) {
        const playgroundElement = document.querySelector('.playground-zone');
        if (playgroundElement) {
          const resizeObserver = new ResizeObserver(entries => {
            // Only proceed if not already handling a resize
            if (this._resizeTimeout) return;
            
            for (const entry of entries) {
              if (entry.target === playgroundElement) {
                // Playground size has changed, update canvas
                const playgroundRect = playgroundElement.getBoundingClientRect();
                const playgroundWidth = playgroundRect.width;
                const playgroundHeight = playgroundRect.height;
                
                console.log(`Playground resized (observer): ${playgroundWidth}×${playgroundHeight}`);
                
                // Use debounce to avoid too many updates
                this._resizeTimeoutObserver = setTimeout(() => {
                  // Update canvas dimensions
                  this.canvas.width = playgroundWidth;
                  this.canvas.height = playgroundHeight;
                  
                  // Update canvas size in settings panel
                  if (this.elements.canvasSize) {
                    this.elements.canvasSize.textContent = `Canvas: ${this.canvas.width}×${this.canvas.height}`;
                  }
                  
                  // Update PixiJS if used - v8 style
                  if (this.pixiApp && this.pixiApp.renderer) {
                    // PIXI v8 resize
                    this.pixiApp.renderer.resize(playgroundWidth, playgroundHeight);
                    // Force render after resize
                    this.pixiApp.render();
                  }
                  
                  // Redraw canvas
                  this.drawCanvas();
                  
                  this._resizeTimeoutObserver = null;
                }, 100);
              }
            }
          });
          
          // Start observing the playground
          resizeObserver.observe(playgroundElement);
          
          // Store the observer for cleanup if needed
          this._resizeObserver = resizeObserver;
        }
      }
    }
  
    /**
     * Initialize the canvas with the correct dimensions
     */
    initCanvas() {
      // Get current viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Get actual screen dimensions when available
      const screenWidth = window.screen ? window.screen.width : viewportWidth;
      const screenHeight = window.screen ? window.screen.height : viewportHeight;
      
      // Get the playground element to calculate canvas dimensions
      const playgroundElement = document.querySelector('.playground-zone');
      
      // Calculate canvas dimensions based on the playground area
      let playgroundWidth = viewportWidth;
      let playgroundHeight = viewportHeight;
      
      if (playgroundElement) {
        // Get the actual available space in the playground (accounting for padding, margin)
        const playgroundRect = playgroundElement.getBoundingClientRect();
        playgroundWidth = playgroundRect.width;
        playgroundHeight = playgroundRect.height;
        
        console.log(`Playground dimensions: ${playgroundWidth}×${playgroundHeight}`);
      } else {
        console.warn('Playground element not found, using viewport dimensions as fallback');
      }
      
      // Update the config with current playground dimensions
      this.config.canvasDimensions = {
        pc: { 
          width: playgroundWidth,
          height: playgroundHeight
        },
        mobile: { 
          width: playgroundWidth,
          height: playgroundHeight
        }
      };
      
      // Set canvas dimensions based on current layout and playground size
      const targetDims = this.config.canvasDimensions[this.state.layout];
      this.canvas.width = targetDims.width;
      this.canvas.height = targetDims.height;
      
      // Update screen resolution information in settings panel
      this.updateScreenInfo(screenWidth, screenHeight, viewportWidth, viewportHeight);
      
      // Check if we should disable PIXI based on version
      if (this.config.usePixi && window.PIXI && window.PIXI.VERSION) {
        // If we detect PIXI v8.0.2, disable it as it has known issues
        if (window.PIXI.VERSION === '8.0.2') {
          console.warn('PIXI v8.0.2 detected - this version has known compatibility issues. Falling back to Canvas2D rendering.');
          this.config.usePixi = false;
        }
      }
      
      // Delayed initialization of PixiJS to ensure the PIXI library is fully loaded
      setTimeout(() => {
        // Initialize PixiJS if enabled and available
        if (this.config.usePixi && window.PIXI) {
          console.log('Initializing PIXI after delay, PIXI status:', !!window.PIXI);
          try {
            // Try initializing PIXI
            this.initPixi();
          } catch (e) {
            console.error('PIXI initialization failed completely, falling back to Canvas2D:', e);
            this.config.usePixi = false;
            this.cleanupPixi();
          }
        } else if (this.config.usePixi) {
          console.warn('PIXI initialization delayed - library not available:', 
                       'PIXI:', !!window.PIXI, 
                       'PixiHelper:', !!window.PixiHelper);
          this.config.usePixi = false;
        }
        
        // Draw canvas content - always call this even if PIXI fails
        this.drawCanvas();
      }, 100); // Short delay to ensure PIXI is loaded
      
      // Log the canvas size for debugging
      console.log(`Canvas initialized with dimensions: ${this.canvas.width}×${this.canvas.height}`);
      console.log(`Viewport dimensions: ${viewportWidth}×${viewportHeight}`);
      console.log(`Screen dimensions: ${screenWidth}×${screenHeight}`);
    }
    
    /**
     * Update screen resolution information in the settings panel
     * @param {number} screenWidth - The physical screen width
     * @param {number} screenHeight - The physical screen height
     * @param {number} windowWidth - The window width
     * @param {number} windowHeight - The window height
     */
    updateScreenInfo(screenWidth, screenHeight, windowWidth, windowHeight) {
      // Update screen resolution in settings panel
      if (this.elements.screenResolution) {
        this.elements.screenResolution.textContent = `${screenWidth}×${screenHeight}`;
      }
      
      // Update window size in settings panel
      if (this.elements.windowSize) {
        this.elements.windowSize.textContent = `Window: ${windowWidth}×${windowHeight}`;
      }
      
      // Update canvas size in settings panel
      if (this.elements.canvasSize && this.canvas) {
        this.elements.canvasSize.textContent = `Canvas: ${this.canvas.width}×${this.canvas.height}`;
      }
    }
    
    /**
     * Check if WebGL is supported in the browser
     * @returns {boolean} - Whether WebGL is supported
     */
    isWebGLSupported() {
      // First check if WebGL is already detected and cached
      if (typeof window.webGLSupported !== 'undefined') {
        console.log('Using cached WebGL support value:', window.webGLSupported);
        return window.webGLSupported;
      }
      
      try {
        // Try to create a WebGL context - check WebGL2 first (preferred for PIXI v8)
        const canvas = document.createElement('canvas');
        let gl = null;
        
        // Try WebGL2 first, then fallback to WebGL1
        try {
          gl = canvas.getContext('webgl2');
          if (gl) {
            console.log('WebGL2 is supported');
            window.webGLSupported = true;
            return true;
          }
        } catch (e) {
          console.warn('WebGL2 not supported, will try WebGL1');
        }
        
        // Try WebGL1 as fallback
        try {
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          // If we got a context, WebGL is supported
          const isSupported = !!gl;
          
          // Cache the result
          window.webGLSupported = isSupported;
          
          if (isSupported) {
            console.log('WebGL1 is supported');
          } else {
            console.warn('Neither WebGL2 nor WebGL1 are supported');
          }
          
          return isSupported;
        } catch (e) {
          console.warn('WebGL1 support check failed:', e);
          window.webGLSupported = false;
          return false;
        } finally {
          // Clean up
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
            }
          }
        }
      } catch (e) {
        console.warn('WebGL support check failed completely:', e);
        window.webGLSupported = false;
        return false;
      }
    }
    
    /**
     * Clean up PIXI resources
     * Call this when switching games or layouts to prevent memory leaks
     * Updated for PIXI v8 compatibility
     */
    cleanupPixi() {
      // Clean up previous PIXI resources if they exist
      if (this.pixiApp) {
        try {
          console.log('Cleaning up PIXI resources');
          
          // Clean up containers in reverse order (foreground first)
          try {
            if (this.pixiForeground) {
              this.pixiForeground.removeChildren();
              // In PIXI v8, destroy takes options object
              this.pixiForeground.destroy?.({ children: true });
              this.pixiForeground = null;
            }
          } catch (e) {
            console.warn('Error cleaning pixiForeground:', e);
          }
          
          try {
            if (this.pixiBackground) {
              this.pixiBackground.removeChildren();
              this.pixiBackground.destroy?.({ children: true });
              this.pixiBackground = null;
            }
          } catch (e) {
            console.warn('Error cleaning pixiBackground:', e);
          }
          
          try {
            if (this.pixiContainer) {
              this.pixiContainer.removeChildren();
              this.pixiContainer.destroy?.({ children: true });
              this.pixiContainer = null;
            }
          } catch (e) {
            console.warn('Error cleaning pixiContainer:', e);
          }
          
          // Handle PIXI application cleanup
          try {
            if (this.pixiApp) {
              // PIXI v8 has a destroy method on the application
              if (typeof this.pixiApp.destroy === 'function') {
                console.log('Using PIXI v8 app.destroy() method');
                this.pixiApp.destroy();
              } 
              // For custom app objects, handle renderer separately
              else if (this.pixiApp.renderer && typeof this.pixiApp.renderer.destroy === 'function') {
                console.log('Destroying renderer manually');
                // First try to clean up stage if it exists
                if (this.pixiApp.stage) {
                  this.pixiApp.stage.destroy?.({ children: true });
                }
                // Then destroy the renderer
                this.pixiApp.renderer.destroy();
              }
              
              this.pixiApp = null;
              console.log('PIXI app destroyed successfully');
            }
          } catch (e) {
            console.warn('Error destroying PIXI application:', e);
            this.pixiApp = null;
          }
          
          console.log('PIXI resources cleaned up successfully');
        } catch (error) {
          console.error('Error cleaning up PIXI resources:', error);
        }
      }
    }
    
    /**
     * Initialize PixiJS v8 rendering
     */
    /**
     * Very minimal PIXI initialization for PIXI v8
     * Only used as a backup if the normal initPixi fails
     * @deprecated This function is kept for compatibility but is no longer used
     * in the main initialization flow. Refer to the updated initPixi method.
     */
    initPixiMinimal() {
      console.log('initPixiMinimal is deprecated - using main initPixi method instead');
      return false;
    }
    
    initPixi() {
      // Clean up previous PIXI resources if they exist
      this.cleanupPixi();
      
      try {
        console.log('Initializing PixiJS v8 application');
        
        // Check if WebGL is supported (but don't force it - PIXI v8 can auto-select)
        const webGLSupported = this.isWebGLSupported();
        console.log('WebGL supported:', webGLSupported);
        
        // Verify PIXI is available
        if (!window.PIXI) {
          console.warn('PIXI.js not available in window, using Canvas2D fallback');
          this.config.usePixi = false;
          return;
        }
        
        // Log PIXI version information for debugging
        console.log('PIXI Version:', window.PIXI.VERSION || 'Unknown');
        
        // PIXI v8 proper initialization
        try {
          // Create proper PIXI v8 application using new init pattern
          console.log('Creating PIXI v8 Application with new initialization pattern');
          
          // PIXI v8 uses a new initialization pattern
          const app = new PIXI.Application();
          
          // Initialize with our canvas and settings
          try {
            app.init({
              canvas: this.canvas,
              width: this.canvas.width,
              height: this.canvas.height,
              backgroundColor: this.getBackgroundColor(),
              resolution: window.devicePixelRatio || 1,
              autoDensity: true,
              // Let PIXI choose the renderer (WebGL2, WebGL, Canvas)
              // But prefer Canvas for more compatibility
              preference: 'canvas', // Force canvas renderer to avoid WebGL issues
              // Add any extra options from config
              ...this.config.pixiOptions
            });
          } catch (initError) {
            console.error("PIXI app.init failed:", initError);
            throw new Error("PIXI initialization failed");
          }
          
          this.pixiApp = app;
          console.log('PIXI v8 application initialized successfully');
          
          // Create containers for organization
          // Create a container for all game elements
          this.pixiContainer = new PIXI.Container();
          this.pixiApp.stage.addChild(this.pixiContainer);
          
          // Create a background container
          this.pixiBackground = new PIXI.Container();
          this.pixiContainer.addChild(this.pixiBackground);
          
          // Create a foreground container for UI elements
          this.pixiForeground = new PIXI.Container();
          this.pixiContainer.addChild(this.pixiForeground);
          
          console.log('PIXI v8 containers initialized successfully');
          
          // Log renderer information
          if (this.pixiApp.renderer) {
            const rendererType = this.pixiApp.renderer.type || 'unknown';
            console.log(`PIXI renderer type: ${rendererType}`);
          }
          
          // Force a render after initialization
          this.pixiApp.render();
          
          // Log success
          console.log('PIXI v8 initialization completed successfully');
          
          return;
        } catch (err) {
          console.error('Error initializing PIXI v8 with modern approach:', err);
          // Continue to fallback approach
        }
        
        // Fallback to simplified approach if modern initialization failed
        try {
          console.log('Falling back to simplified PIXI initialization');
          
          // Try to use PixiHelper if available
          if (window.PixiHelper && window.PixiHelper.initApp) {
            console.log('Using PixiHelper.initApp for initialization');
            this.pixiApp = window.PixiHelper.initApp(this.canvas, {
              backgroundColor: this.getBackgroundColor(),
              resolution: window.devicePixelRatio || 1,
              ...this.config.pixiOptions
            });
            
            // Verify app was created
            if (this.pixiApp) {
              console.log('PixiHelper.initApp returned valid app');
              
              // Setup containers
              this.pixiContainer = new PIXI.Container();
              this.pixiApp.stage.addChild(this.pixiContainer);
              
              this.pixiBackground = new PIXI.Container();
              this.pixiContainer.addChild(this.pixiBackground);
              
              this.pixiForeground = new PIXI.Container();
              this.pixiContainer.addChild(this.pixiForeground);
              
              console.log('PIXI initialization via PixiHelper successful');
              return;
            }
            console.warn('PixiHelper.initApp returned null, trying manual approach');
          }
          
          // Try the most basic fallback - manually create basic objects
          console.log('Creating minimal PIXI app manually');
          
          try {
            // First try WebGL renderer
            const renderer = new PIXI.Renderer({
              width: this.canvas.width,
              height: this.canvas.height,
              view: this.canvas,
              backgroundColor: this.getBackgroundColor(),
              backgroundAlpha: 1,
              resolution: window.devicePixelRatio || 1
            });
            
            console.log('WebGL renderer created successfully');
            
            // Create manual app object
            this.pixiApp = {
              renderer: renderer,
              stage: new PIXI.Container(),
              render: function() {
                if (this.renderer && this.stage) {
                  this.renderer.render(this.stage);
                }
              },
              // Simple destroy method
              destroy: function() {
                if (this.renderer) {
                  this.renderer.destroy();
                }
              }
            };
          } catch (webglError) {
            console.warn('WebGL renderer failed, trying Canvas renderer:', webglError);
            
            // If WebGL fails, try Canvas renderer
            try {
              let rendererOptions = {
                width: this.canvas.width,
                height: this.canvas.height,
                backgroundAlpha: 1
              };
              
              // Handle view/canvas parameter correctly based on version
              if (PIXI.VERSION && PIXI.VERSION.startsWith('8')) {
                rendererOptions.canvas = this.canvas;
              } else {
                rendererOptions.view = this.canvas;
              }
              
              // Add background color
              rendererOptions.background = this.getBackgroundColor();
              
              // Create canvas renderer with error handling for different PIXI versions
              let canvasRenderer;
              try {
                canvasRenderer = new PIXI.CanvasRenderer(rendererOptions);
              } catch (versionError) {
                // Older versions might use a different signature
                console.warn('Modern CanvasRenderer initialization failed, trying legacy approach:', versionError);
                canvasRenderer = new PIXI.CanvasRenderer(
                  this.canvas.width, 
                  this.canvas.height,
                  { 
                    view: this.canvas,
                    backgroundColor: this.getBackgroundColor()
                  }
                );
              }
              console.log('Canvas renderer created successfully');
              
              // Create app object with canvas renderer
              this.pixiApp = {
                renderer: canvasRenderer,
                stage: new PIXI.Container(),
                render: function() {
                  if (this.renderer && this.stage) {
                    this.renderer.render(this.stage);
                  }
                },
                destroy: function() {
                  if (this.renderer) {
                    this.renderer.destroy();
                  }
                }
              };
            } catch (canvasError) {
              console.error('Canvas renderer also failed:', canvasError);
              // No renderers available, throw error to fallback to Canvas2D
              throw new Error('No available renderers');
            }
          }
          
          // If we got here, we have a valid pixiApp with renderer and stage
          
          // Setup containers
          this.pixiContainer = new PIXI.Container();
          this.pixiApp.stage.addChild(this.pixiContainer);
          
          this.pixiBackground = new PIXI.Container();
          this.pixiContainer.addChild(this.pixiBackground);
          
          this.pixiForeground = new PIXI.Container();
          this.pixiContainer.addChild(this.pixiForeground);
          
          console.log('PIXI minimal fallback initialization successful');
        } catch (fallbackError) {
          console.error('All PIXI initialization approaches failed:', fallbackError);
          // Final fallback: disable PIXI completely and use Canvas2D
          this.config.usePixi = false;
          this.cleanupPixi();
          return;
        }
        
      } catch (error) {
        console.error('Failed to initialize PIXI:', error);
        this.config.usePixi = false;
        this.cleanupPixi();
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
      if (this.pixiApp && this.config.usePixi && window.PIXI) {
        try {
          // Try to draw with PIXI
          this.drawWithPixi();
        } catch (e) {
          // If any error occurs, fall back to Canvas2D
          console.warn('Error drawing with PIXI, falling back to Canvas2D:', e);
          this.drawWithCanvas2D();
        }
      } else {
        // Default to Canvas2D if PIXI is not available or disabled
        this.drawWithCanvas2D();
      }
    }
    
    /**
     * Draw using the PixiJS renderer
     */
    drawWithPixi() {
      // Check if PIXI is properly initialized
      if (!this.pixiApp || !this.pixiApp.renderer || !this.pixiBackground || !this.pixiForeground) {
        console.error('PIXI not properly initialized, falling back to Canvas2D');
        this.drawWithCanvas2D();
        return;
      }
      
      try {
        // Clear existing containers
        this.pixiBackground.removeChildren();
        this.pixiForeground.removeChildren();
        
        // Create background with gradient (using a rectangle)
        const colors = this.config.canvasBackground && this.config.canvasBackground[this.state.theme] 
          ? this.config.canvasBackground[this.state.theme]
          : ['#071824', '#071d2a']; // Default colors
          
        // Convert hex to number for the base color
        const baseColor = parseInt(colors[0].replace('#', ''), 16);
        
        // Create a simple colored background as fallback that fills the entire canvas
        const background = new PIXI.Graphics();
        
        // Use simple fill for compatibility with all PixiJS versions
        background.beginFill(baseColor, 1);
        background.drawRect(0, 0, this.canvas.width, this.canvas.height);
        background.endFill();
      
      // Create gradient as a separate sprite for better compatibility
      try {
        // Create vertical or horizontal gradient based on layout
        const gradientTexture = this.state.layout === 'pc' 
          ? this.createGradientTexture(colors[0], colors[1], false)
          : this.createGradientTexture(colors[0], colors[1], true);
          
        if (gradientTexture) {
          // Create sprite with gradient texture - fill the entire canvas
          const gradientSprite = new PIXI.Sprite(gradientTexture);
          gradientSprite.width = this.canvas.width;
          gradientSprite.height = this.canvas.height;
          
          // Add to background container
          this.pixiBackground.addChild(gradientSprite);
        }
      } catch (error) {
        console.warn('Gradient background not supported in this PixiJS version, using solid color', error);
        // Fallback is the solid background already added
      }
      
      // Add background to container
      this.pixiBackground.addChild(background);
      
      // Draw grid if in debug mode
      if (window.debugManager && window.debugManager.isDebugEnabled) {
        this.drawGridWithPixi();
        
        // Add canvas size indicator in debug mode
        const sizeText = PixiHelper.createText(
          `Canvas: ${this.canvas.width}×${this.canvas.height}`,
          {
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            alpha: 0.7
          },
          {
            x: 10,
            y: 10,
            anchor: { x: 0, y: 0 }
          }
        );
        this.pixiBackground.addChild(sizeText);
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
      
      // Force a render for PIXI v8
      try {
        if (this.pixiApp && this.pixiApp.render) {
          this.pixiApp.render();
        }
      } catch (err) {
        console.warn('Error forcing PIXI render:', err);
      }
      
      } catch (mainError) {
        console.error('Error in drawWithPixi:', mainError);
        // If PIXI rendering fails completely, fall back to Canvas2D
        this.drawWithCanvas2D();
      }
    }
    
    /**
     * Create a gradient texture for Pixi
     */
    createGradientTexture(color1, color2, horizontal = false) {
      try {
        const quality = 256;
        const canvas = document.createElement('canvas');
        
        if (!canvas) {
          console.warn('Failed to create canvas for gradient texture');
          return null;
        }
        
        // For horizontal gradient, make a wide but not tall canvas
        // For vertical gradient, make a tall but not wide canvas
        if (horizontal) {
          canvas.width = quality;
          canvas.height = 1;
        } else {
          canvas.width = 1;
          canvas.height = quality;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Failed to get canvas context for gradient texture');
          return null;
        }
        
        // Create gradient
        const gradient = horizontal 
          ? ctx.createLinearGradient(0, 0, quality, 0)
          : ctx.createLinearGradient(0, 0, 0, quality);
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Use the most compatible way to create a texture
        try {
          // Try PIXI v8 approach first
          if (PIXI.Texture.fromCanvas) {
            return PIXI.Texture.fromCanvas(canvas);
          } else if (PIXI.Texture.from) {
            return PIXI.Texture.from(canvas);
          } else {
            // Fallback for PIXI v8
            const baseTexture = new PIXI.BaseTexture(canvas);
            return new PIXI.Texture(baseTexture);
          }
        } catch (textureError) {
          console.warn('Error creating texture from canvas:', textureError);
          return null;
        }
      } catch (error) {
        console.warn('Error creating gradient texture:', error);
        // Return a simple colored base texture as fallback
        try {
          return PIXI.Texture.WHITE;
        } catch (e) {
          return null;
        }
      }
    }
    
    /**
     * Draw grid using PixiJS
     */
    drawGridWithPixi() {
      const gridGraphics = new PIXI.Graphics();
      gridGraphics.lineStyle(1, 0xFFFFFF, 0.1);
      
      // Calculate grid size based on canvas dimensions
      // Adjust grid spacing to avoid too many lines on large canvases
      let gridSize = 100;
      const maxGridLines = 30; // Maximum number of grid lines in either direction
      
      if (this.canvas.width / gridSize > maxGridLines) {
        gridSize = Math.ceil(this.canvas.width / maxGridLines / 100) * 100;
      }
      
      // Vertical grid lines
      for (let x = 0; x < this.canvas.width; x += gridSize) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, this.canvas.height);
      }
      
      // Horizontal grid lines
      for (let y = 0; y < this.canvas.height; y += gridSize) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(this.canvas.width, y);
      }
      
      // Add the grid to the background
      this.pixiBackground.addChild(gridGraphics);
      
      // Draw center marker
      const centerMarker = new PIXI.Graphics();
      centerMarker.lineStyle(2, 0xFFFF00, 0.3);
      
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      // Horizontal center line
      centerMarker.moveTo(centerX - 50, centerY);
      centerMarker.lineTo(centerX + 50, centerY);
      
      // Vertical center line
      centerMarker.moveTo(centerX, centerY - 50);
      centerMarker.lineTo(centerX, centerY + 50);
      
      this.pixiBackground.addChild(centerMarker);
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
      // Clear canvas - IMPORTANT: Use full canvas dimensions
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
      
      // Fill background with gradient - use full canvas size
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw reference grid if in debug mode
      if (window.debugManager && window.debugManager.isDebugEnabled) {
        this.drawGrid();
      }
      
      // Add canvas size indicator in debug mode
      if (window.debugManager && window.debugManager.isDebugEnabled) {
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Canvas: ${this.canvas.width}×${this.canvas.height}`, 10, 10);
      }
      
      // Call the game's render function with safety check
      if (this.config && this.config.gameLogic && typeof this.config.gameLogic.renderGame === 'function') {
        try {
          // Call the game's render function with the current canvas dimensions
          this.config.gameLogic.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
        } catch (error) {
          console.error('Error in game renderGame:', error);
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
      
      // Calculate grid size based on canvas dimensions
      // Adjust grid spacing to avoid too many lines on large canvases
      let gridSize = 100;
      const maxGridLines = 30; // Maximum number of grid lines in either direction
      
      if (this.canvas.width / gridSize > maxGridLines) {
        gridSize = Math.ceil(this.canvas.width / maxGridLines / 100) * 100;
      }
      
      // Vertical grid lines
      for (let x = 0; x < this.canvas.width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < this.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
      
      // Draw center marker
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.lineWidth = 2;
      
      // Horizontal center line
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 50, centerY);
      this.ctx.lineTo(centerX + 50, centerY);
      this.ctx.stroke();
      
      // Vertical center line
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY - 50);
      this.ctx.lineTo(centerX, centerY + 50);
      this.ctx.stroke();
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
      // Only proceed if layout is actually changing
      if (this.state.layout === layout) {
        console.log(`Already using ${layout} layout, no change needed`);
        return;
      }
      
      console.log(`Switching layout from ${this.state.layout} to ${layout}`);
      this.state.layout = layout;
      
      // Update container classes
      if (layout === 'pc') {
        this.elements.container.classList.remove('mobile');
        this.elements.container.classList.add('pc');
      } else {
        this.elements.container.classList.remove('pc');
        this.elements.container.classList.add('mobile');
      }
      
      // Clean up PIXI resources before reinitializing canvas
      this.cleanupPixi();
      
      // Reinitialize canvas for new dimensions
      this.initCanvas();
      
      console.log(`Layout switched to ${layout}`);
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
        
        // Close settings panel if it's open
        if (this.elements.settingsPanel.classList.contains('active')) {
          this.toggleSettingsPanel(false);
        }
      } else {
        this.elements.menuOverlay.classList.remove('active');
      }
    }
    
    /**
     * Toggle the settings panel
     * @param {boolean} show - Whether to show or hide the settings panel
     */
    toggleSettingsPanel(show) {
      if (show) {
        this.elements.settingsPanel.classList.add('active');
        
        // Close menu if it's open
        if (this.elements.menuOverlay.classList.contains('active')) {
          this.toggleMenu(false);
        }
      } else {
        this.elements.settingsPanel.classList.remove('active');
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