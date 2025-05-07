/**
 * GameFramework - Lightweight framework for game prototyping
 * 
 * This framework provides a structure for quickly prototyping casino-style games
 * with a consistent UI and customizable game logic.
 * 
 * Completely rewritten to align with IGame interface and modern architecture
 */

class GameFramework {
  /**
   * Initialize the game framework
   * @param {Object} config - Configuration object for the game
   */
  constructor(config = {}) {
    console.log('GameFramework: Creating new instance');
    
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
      // Default game logic - can be overridden
      gameLogic: {
        spin: null,
        calculateWin: null,
        renderGame: null,
        handleWin: null,
        handleLoss: null
      },
      ...config
    };

    // Storage for modules and UI elements
    this.modules = {};
    this.elements = {};
    
    // Set document title first - always safe
    document.title = this.config.gameTitle;
    
    // Initialize when DOM is ready
    this.init();
  }

  /**
   * Initialize the game
   */
  init() {
    console.log('GameFramework.init(): Initializing framework');
    
    // Handle DOM ready state
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._initAfterDOM());
    } else {
      this._initAfterDOM();
    }
  }
  
  /**
   * Initialize after DOM is loaded - private method
   * @private
   */
  _initAfterDOM() {
    console.log('GameFramework._initAfterDOM(): DOM ready, initializing');
    
    try {
      // Initialize modules in correct order
      this._initDOMElements();
      this._initStateManager();
      this._initCanvasManager();
      this._initUIManager();
      this._updateDisplays();
      
      // Set up time updating
      this._initTimeUpdater();
      
      console.log('GameFramework: Initialization complete');
    } catch (error) {
      console.error('GameFramework: Error during initialization:', error);
    }
  }
  
  /**
   * Set up DOM elements with safe queries
   * @private
   */
  _initDOMElements() {
    console.log('GameFramework: Getting DOM elements');
    
    // Safe element query helper
    const getElement = (selector, fallbackCreate = false) => {
      let element = null;
      
      try {
        // Try to get element
        if (selector.startsWith('#')) {
          element = document.getElementById(selector.slice(1));
        } else {
          element = document.querySelector(selector);
        }
        
        // Create fallback element if needed
        if (!element && fallbackCreate) {
          const tagName = selector.startsWith('#') ? 'div' : 'div';
          element = document.createElement(tagName);
          
          if (selector.startsWith('#')) {
            element.id = selector.slice(1);
          } else if (selector.startsWith('.')) {
            element.className = selector.slice(1);
          }
          
          // Add to body if container not found
          const container = document.querySelector(this.config.containerSelector) || document.body;
          container.appendChild(element);
          console.log(`GameFramework: Created fallback element for ${selector}`);
        }
      } catch (error) {
        console.warn(`GameFramework: Error getting element ${selector}:`, error);
      }
      
      return element;
    };
    
    // Required elements
    this.elements = {
      // Essential elements - create if needed
      container: getElement(this.config.containerSelector, true),
      canvas: getElement('#game-canvas', true),
      
      // Game display elements
      gameTitle: getElement('.game-title'),
      footerGameTitle: getElement('#footer-game-title'),
      
      // UI controls - optional
      themeSelect: getElement('#theme-select'),
      spinButton: getElement('#spin-button'),
      betInput: getElement('#bet-input'),
      balanceDisplay: getElement('#balance-display'),
      potentialWin: getElement('#potential-win'),
      currentTime: getElement('#current-time'),
      
      // Layout controls
      desktopLayout: getElement('#desktop'),
      mobileLayout: getElement('#mobile'),
      
      // Standard buttons
      decreaseBet: getElement('#decrease-bet'),
      increaseBet: getElement('#increase-bet'),
      halfBet: getElement('#half-bet'),
      doubleBet: getElement('#double-bet'),
      maxBet: getElement('#max-bet'),
      riskLevel: getElement('#risk-level'),
      
      // Settings and controls
      menuButton: getElement('#menu-button'),
      menuOverlay: getElement('#menu-overlay'),
      closeMenu: getElement('#close-menu'),
      settingsButton: getElement('#settings-button'),
      settingsPanel: getElement('#settings-panel'),
      closeSettings: getElement('#close-settings'),
      soundButton: getElement('#sound-button'),
      
      // Game mode controls
      manualTab: getElement('#manual-tab'),
      autoTab: getElement('#auto-tab'),
      
      // Debug controls
      debugToggle: getElement('#debug-toggle'),
      debugButton: getElement('#debug-button'),
      autotestButton: getElement('#autotest-button'),
      gameSelect: getElement('#game-select'),
      
      // Setting displays
      screenResolution: getElement('#settings-screen-resolution'),
      windowSize: getElement('#settings-window-size'),
      canvasSize: getElement('#settings-canvas-size'),
      gameCanvas: getElement('#settings-game-canvas')
    };
    
    // Update HTML title elements
    this._updateTitleElements();
    
    // Make essential elements have required properties if missing
    this._setupEssentialElements();
  }
  
  /**
   * Update all title elements with game title
   * @private
   */
  _updateTitleElements() {
    // Try all possible title elements
    const titleElements = [
      this.elements.gameTitle,
      this.elements.footerGameTitle,
      document.querySelector('.portal-title')
    ].filter(Boolean);
    
    // Update all found title elements
    titleElements.forEach(element => {
      try {
        if (element && element.textContent !== undefined) {
          element.textContent = this.config.gameTitle;
        }
      } catch (err) {}
    });
  }
  
  /**
   * Set up required properties on essential elements
   * @private
   */
  _setupEssentialElements() {
    // Ensure canvas has dimensions
    if (this.elements.canvas) {
      if (!this.elements.canvas.width || !this.elements.canvas.height) {
        const dimensions = this.config.canvasDimensions[this.config.defaultLayout];
        this.elements.canvas.width = dimensions.width;
        this.elements.canvas.height = dimensions.height;
      }
    }
    
    // Add any other essential setup here
  }
  
  /**
   * Initialize game state manager
   * @private
   */
  _initStateManager() {
    console.log('GameFramework: Initializing GameStateManager');
    
    try {
      if (typeof GameStateManager === 'function') {
        // Create initial state manager
        this.modules.gameState = new GameStateManager(this.config, null, null);
        
        // Get initial state
        this.state = this.modules.gameState.getState();
      } else {
        console.warn('GameFramework: GameStateManager not found, creating minimal state object');
        
        // Create minimal state if manager not available
        this.state = {
          balance: this.config.initialBalance,
          bet: this.config.initialBet,
          theme: this.config.defaultTheme,
          layout: this.config.defaultLayout,
          riskLevel: this.config.defaultRiskLevel
        };
        
        // Create minimal state manager if needed
        this.modules.gameState = {
          getState: () => this.state,
          updateState: (newState) => {
            Object.assign(this.state, newState);
            return this.state;
          },
          spin: () => console.log('GameFramework: Minimal state manager - spin called')
        };
      }
    } catch (error) {
      console.error('GameFramework: Error initializing state manager:', error);
      
      // Create minimal state as fallback
      this.state = {
        balance: this.config.initialBalance,
        bet: this.config.initialBet,
        theme: this.config.defaultTheme
      };
    }
  }
  
  /**
   * Initialize canvas manager
   * @private
   */
  _initCanvasManager() {
    console.log('GameFramework: Initializing CanvasManager');
    
    try {
      if (typeof CanvasManager === 'function' && this.elements.canvas) {
        // Create canvas manager
        this.modules.canvas = new CanvasManager(this.config, this.state);
        this.modules.canvas.setCanvas(this.elements.canvas);
        this.modules.canvas.initCanvas();
      } else {
        console.warn('GameFramework: CanvasManager not found or canvas missing, creating minimal manager');
        
        // Create minimal canvas manager
        this.modules.canvas = {
          redrawCanvas: () => {},
          drawBackground: () => {},
          setCanvas: () => {},
          initCanvas: () => {}
        };
      }
    } catch (error) {
      console.error('GameFramework: Error initializing canvas manager:', error);
      
      // Create minimal canvas manager as fallback
      this.modules.canvas = {
        redrawCanvas: () => {},
        drawBackground: () => {},
        setCanvas: () => {},
        initCanvas: () => {}
      };
    }
  }
  
  /**
   * Initialize UI manager
   * @private
   */
  _initUIManager() {
    console.log('GameFramework: Initializing UIManager');
    
    try {
      if (typeof UIManager === 'function') {
        // Create UI manager
        this.modules.ui = new UIManager(
          this.config,
          this.state,
          this.elements,
          this.modules.canvas,
          null, // No PixiManager
          this.updateState.bind(this)
        );
        
        // Update state manager with UI reference
        if (typeof GameStateManager === 'function') {
          this.modules.gameState = new GameStateManager(
            this.config,
            this.modules.canvas,
            this.modules.ui
          );
        }
        
        // Set up UI events
        this.modules.ui.setupEventListeners();
        
        // Set spin method on config
        this.config.onSpin = this.spin.bind(this);
      } else {
        console.warn('GameFramework: UIManager not found, creating minimal UI manager');
        
        // Create minimal UI manager
        this.modules.ui = {
          setupEventListeners: () => {},
          updatePotentialWin: () => {},
          updateBalance: () => {},
          redrawCanvas: () => {},
          updateTime: () => this._updateTimeDisplay()
        };
      }
    } catch (error) {
      console.error('GameFramework: Error initializing UI manager:', error);
      
      // Create minimal UI manager as fallback
      this.modules.ui = {
        setupEventListeners: () => {},
        updatePotentialWin: () => {},
        updateBalance: () => {},
        redrawCanvas: () => {},
        updateTime: () => this._updateTimeDisplay()
      };
    }
  }
  
  /**
   * Set up timer for updating time display
   * @private
   */
  _initTimeUpdater() {
    // Update time immediately
    this.updateTime();
    
    // Set interval for updating time
    this._timeInterval = setInterval(() => this.updateTime(), 1000);
  }
  
  /**
   * Update core displays (balance, potential win)
   * @private 
   */
  _updateDisplays() {
    try {
      // Update displays if UI manager is available
      if (this.modules.ui) {
        if (typeof this.modules.ui.updatePotentialWin === 'function') {
          this.modules.ui.updatePotentialWin();
        }
        
        if (typeof this.modules.ui.updateBalance === 'function') {
          this.modules.ui.updateBalance();
        }
      }
      
      // Draw initial canvas
      this.redrawCanvas();
    } catch (error) {
      console.error('GameFramework: Error updating displays:', error);
    }
  }
  
  /**
   * Update time display directly - fallback implementation
   * @private
   */
  _updateTimeDisplay() {
    if (this.elements.currentTime) {
      try {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        this.elements.currentTime.textContent = `${hours}:${minutes}:${seconds}`;
      } catch (error) {
        // Ignore time display errors
      }
    }
  }
  
  /**
   * Update the game state
   * @param {Object} newState - New state object
   * @returns {Object} Updated state
   */
  updateState(newState) {
    try {
      if (this.modules.gameState && typeof this.modules.gameState.updateState === 'function') {
        this.state = this.modules.gameState.updateState(newState);
      } else {
        // Fallback state update
        this.state = {...this.state, ...newState};
      }
      return this.state;
    } catch (error) {
      console.error('GameFramework: Error updating state:', error);
      return this.state;
    }
  }

  /**
   * Update the current time display
   */
  updateTime() {
    try {
      if (this.modules.ui && typeof this.modules.ui.updateTime === 'function') {
        this.modules.ui.updateTime();
      } else {
        this._updateTimeDisplay();
      }
    } catch (error) {
      // Fallback to direct update
      this._updateTimeDisplay();
    }
  }

  /**
   * Begin the game spin process
   */
  spin() {
    try {
      if (this.modules.gameState && typeof this.modules.gameState.spin === 'function') {
        this.modules.gameState.spin();
      } else {
        console.log('GameFramework: Spin called but no game state manager available');
      }
    } catch (error) {
      console.error('GameFramework: Error during spin:', error);
    }
  }

  /**
   * Redraw the canvas
   */
  redrawCanvas() {
    try {
      if (this.modules.ui && typeof this.modules.ui.redrawCanvas === 'function') {
        this.modules.ui.redrawCanvas();
      } else if (this.modules.canvas && typeof this.modules.canvas.redrawCanvas === 'function') {
        this.modules.canvas.redrawCanvas();
      }
    } catch (error) {
      console.error('GameFramework: Error redrawing canvas:', error);
    }
  }

  /**
   * Switch between PC and mobile layouts
   * @param {string} layout - The layout to switch to ('pc' or 'mobile')
   */
  switchLayout(layout) {
    try {
      if (this.modules.ui && typeof this.modules.ui.switchLayout === 'function') {
        this.modules.ui.switchLayout(layout);
      } else {
        console.log(`GameFramework: Switched to ${layout} layout`);
        this.updateState({layout});
      }
    } catch (error) {
      console.error('GameFramework: Error switching layout:', error);
    }
  }

  /**
   * Change the theme of the game
   * @param {string} themeName - The name of the theme to apply
   */
  changeTheme(themeName) {
    try {
      if (this.modules.ui && typeof this.modules.ui.changeTheme === 'function') {
        this.modules.ui.changeTheme(themeName);
      } else {
        console.log(`GameFramework: Changed theme to ${themeName}`);
        this.updateState({theme: themeName});
      }
    } catch (error) {
      console.error('GameFramework: Error changing theme:', error);
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
   * Clean up resources
   */
  cleanup() {
    try {
      // Clear the time interval
      if (this._timeInterval) {
        clearInterval(this._timeInterval);
      }
      
      // Clean up UI event listeners
      if (this.modules.ui && typeof this.modules.ui.cleanup === 'function') {
        this.modules.ui.cleanup();
      }
      
      console.log('GameFramework: Cleanup complete');
    } catch (error) {
      console.error('GameFramework: Error during cleanup:', error);
    }
  }
}

// Only export the framework if it's not already defined
if (typeof window.GameFramework === 'undefined') {
  window.GameFramework = GameFramework;
  console.log('GameFramework: Class exported to global scope');
} else {
  console.log('GameFramework: Class already defined in global scope, not overwriting');
}