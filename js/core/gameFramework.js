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
      // Default game logic - can be overridden
      gameLogic: {
        spin: null,  // Will be set to default if not provided
        calculateWin: null,  // Will be set to default if not provided
        renderGame: null,  // Will be set to default if not provided
        handleWin: null,  // Will be set to default if not provided
        handleLoss: null  // Will be set to default if not provided
      },
      ...config
    };

    // Initialize sub-modules
    this.modules = {};

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
      canvasSize: document.getElementById('settings-canvas-size'),
      gameCanvas: document.getElementById('settings-game-canvas')
    };

    // Set game title
    if (this.elements.gameTitle) {
      this.elements.gameTitle.textContent = this.config.gameTitle;
    }
    
    // Initialize canvas and managers
    this.initializeManagers();

    // Initialize displays
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  /**
   * Initialize all managers
   */
  initializeManagers() {
    // Create the game state manager first - it needs to be available for other managers
    this.modules.gameState = new GameStateManager(this.config, null, null);
    
    // Get initial state
    this.state = this.modules.gameState.getState();
    
    // Initialize canvas manager
    this.modules.canvas = new CanvasManager(this.config, this.state);
    this.modules.canvas.setCanvas(this.elements.canvas);
    
    // Initialize canvas
    this.modules.canvas.initCanvas();
    
    // Initialize UI manager
    this.modules.ui = new UIManager(
      this.config,
      this.state,
      this.elements,
      this.modules.canvas,
      null, // No PixiManager
      this.updateState.bind(this)
    );
    
    // Update GameStateManager with references to other managers
    this.modules.gameState = new GameStateManager(
      this.config,
      this.modules.canvas,
      this.modules.ui
    );
    
    // Pass spin method to UI config
    this.config.onSpin = this.spin.bind(this);
    
    // Set up event listeners
    this.modules.ui.setupEventListeners();
    
    // Update initial displays
    this.modules.ui.updatePotentialWin();
    this.modules.ui.updateBalance();
    
    // Draw initial canvas
    this.redrawCanvas();
  }

  /**
   * Update the game state
   * @param {Object} newState - New state object
   */
  updateState(newState) {
    this.state = this.modules.gameState.updateState(newState);
    return this.state;
  }

  /**
   * Update the current time display
   */
  updateTime() {
    this.modules.ui.updateTime();
  }

  /**
   * Begin the game spin process
   */
  spin() {
    this.modules.gameState.spin();
  }

  /**
   * Redraw the canvas
   */
  redrawCanvas() {
    this.modules.ui.redrawCanvas();
  }

  /**
   * Switch between PC and mobile layouts
   * @param {string} layout - The layout to switch to ('pc' or 'mobile')
   */
  switchLayout(layout) {
    this.modules.ui.switchLayout(layout);
  }

  /**
   * Change the theme of the game
   * @param {string} themeName - The name of the theme to apply
   */
  changeTheme(themeName) {
    this.modules.ui.changeTheme(themeName);
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
    // Clean up UI event listeners
    if (this.modules.ui) {
      this.modules.ui.cleanup();
    }
  }
}

// Export the framework
window.GameFramework = GameFramework;