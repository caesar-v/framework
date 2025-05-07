/**
 * Full Game Manager - Game Framework
 * 
 * Enhanced game manager that supports all features of the original index.html:
 * - Header and footer
 * - Settings panel
 * - Betting controls
 * - Theme switching
 * - Layout switching
 * - Debug tools
 */

class FullGameManager {
  /**
   * Initialize a new Full Game Manager
   * @param {Object} config - Configuration for the game manager
   */
  constructor(config = {}) {
    this.config = {
      canvasId: 'game-canvas',
      containerSelector: '#game-container',
      defaultGame: 'dice',
      defaultBalance: 1000,
      defaultBet: 10,
      minBet: 5,
      maxBet: 500,
      defaultTheme: 'default',
      defaultLayout: 'pc',
      statusElementId: 'status-message',
      ...config
    };
    
    // Game registry
    this.games = {};
    this.activeGameId = null;
    this.activeGame = null;
    
    // Game state
    this.state = {
      balance: this.config.defaultBalance,
      bet: this.config.defaultBet,
      theme: this.config.defaultTheme,
      layout: this.config.defaultLayout,
      lastWin: 0,
      gameHistory: [],
      sound: true,
      autoPlay: false,
      riskLevel: 'medium',
      riskMultipliers: {
        low: 1.5,
        medium: 3,
        high: 6
      }
    };
    
    // UI elements
    this.elements = {};
    
    // Canvas manager
    this.canvasManager = null;
    
    // Initialization flag
    this.initialized = false;
    
    // Debug mode
    this.debugMode = false;
  }
  
  /**
   * Initialize the game manager
   * @returns {boolean} True if initialization was successful
   */
  init() {
    console.log('FullGameManager: Initializing');
    this.showStatus('Initializing full-featured game framework...');
    
    // Get all UI elements
    this.initElements();
    
    // Check if essential elements exist
    if (!this.elements.canvas) {
      this.showStatus('Canvas element not found', true);
      return false;
    }
    
    // Initialize canvas manager
    this.canvasManager = new CanvasManager({
      backgroundColor: this.getThemeColors(this.state.theme)
    });
    
    const canvasInitialized = this.canvasManager.init(this.elements.canvas);
    if (!canvasInitialized) {
      this.showStatus('Failed to initialize canvas', true);
      return false;
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update displays
    this.updateBalanceDisplay();
    this.updateBetDisplay();
    this.updatePotentialWinDisplay();
    this.updateTimeDisplay();
    
    // Start time updater
    this.startTimeUpdater();
    
    // Apply theme and layout
    this.applyTheme(this.state.theme);
    this.applyLayout(this.state.layout);
    
    // Update screen resolution info
    this.updateScreenInfo();
    
    // Mark as initialized
    this.initialized = true;
    
    // Show ready message
    this.showStatus('Game framework ready!');
    
    return true;
  }
  
  /**
   * Initialize all UI elements
   */
  initElements() {
    // Main elements
    this.elements = {
      container: document.querySelector(this.config.containerSelector),
      canvas: document.getElementById(this.config.canvasId),
      statusMessage: document.getElementById(this.config.statusElementId),
      
      // Game header/title
      gameTitle: document.querySelector('.game-title'),
      footerGameTitle: document.getElementById('footer-game-title'),
      
      // Balance and betting
      balanceDisplay: document.getElementById('balance-display'),
      betInput: document.getElementById('bet-input'),
      decreaseBet: document.getElementById('decrease-bet'),
      increaseBet: document.getElementById('increase-bet'),
      halfBet: document.getElementById('half-bet'),
      doubleBet: document.getElementById('double-bet'),
      maxBet: document.getElementById('max-bet'),
      potentialWin: document.getElementById('potential-win'),
      
      // Game selection
      gameSelect: document.getElementById('game-select'),
      
      // Game play
      spinButton: document.getElementById('spin-button'),
      
      // Time
      currentTime: document.getElementById('current-time'),
      
      // Layout
      desktopLayout: document.getElementById('desktop'),
      mobileLayout: document.getElementById('mobile'),
      
      // Theme
      themeSelect: document.getElementById('theme-select'),
      
      // Settings
      settingsButton: document.getElementById('settings-button'),
      settingsPanel: document.getElementById('settings-panel'),
      closeSettings: document.getElementById('close-settings'),
      
      // Risk level
      riskLevel: document.getElementById('risk-level'),
      
      // Play modes
      manualTab: document.getElementById('manual-tab'),
      autoTab: document.getElementById('auto-tab'),
      
      // Menu
      menuButton: document.getElementById('menu-button'),
      menuOverlay: document.getElementById('menu-overlay'),
      closeMenu: document.getElementById('close-menu'),
      
      // Sound
      soundButton: document.getElementById('sound-button'),
      
      // Debug
      debugToggle: document.getElementById('debug-toggle'),
      debugButton: document.getElementById('debug-button'),
      
      // Screen resolution displays
      screenResolution: document.getElementById('settings-screen-resolution'),
      windowSize: document.getElementById('settings-window-size'),
      canvasSize: document.getElementById('settings-canvas-size'),
      gameCanvas: document.getElementById('settings-game-canvas')
    };
  }
  
  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Spin button
    if (this.elements.spinButton) {
      this.elements.spinButton.addEventListener('click', () => this.handleSpin());
    }
    
    // Game select
    if (this.elements.gameSelect) {
      this.elements.gameSelect.addEventListener('change', (e) => {
        this.loadGame(e.target.value);
      });
    }
    
    // Betting controls
    if (this.elements.decreaseBet) {
      this.elements.decreaseBet.addEventListener('click', () => this.changeBet(-5));
    }
    
    if (this.elements.increaseBet) {
      this.elements.increaseBet.addEventListener('click', () => this.changeBet(5));
    }
    
    if (this.elements.halfBet) {
      this.elements.halfBet.addEventListener('click', () => this.setBetFraction(0.5));
    }
    
    if (this.elements.doubleBet) {
      this.elements.doubleBet.addEventListener('click', () => this.setBetFraction(2));
    }
    
    if (this.elements.maxBet) {
      this.elements.maxBet.addEventListener('click', () => this.setBet(this.config.maxBet));
    }
    
    // Risk level
    if (this.elements.riskLevel) {
      this.elements.riskLevel.addEventListener('change', (e) => {
        this.state.riskLevel = e.target.value;
        this.updatePotentialWinDisplay();
      });
    }
    
    // Layout controls
    if (this.elements.desktopLayout) {
      this.elements.desktopLayout.addEventListener('change', () => {
        if (this.elements.desktopLayout.checked) {
          this.applyLayout('pc');
        }
      });
    }
    
    if (this.elements.mobileLayout) {
      this.elements.mobileLayout.addEventListener('change', () => {
        if (this.elements.mobileLayout.checked) {
          this.applyLayout('mobile');
        }
      });
    }
    
    // Theme select
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }
    
    // Settings panel
    if (this.elements.settingsButton && this.elements.settingsPanel) {
      this.elements.settingsButton.addEventListener('click', () => {
        this.elements.settingsPanel.style.display = 'block';
        // Update screen info when opening settings
        this.updateScreenInfo();
      });
    }
    
    if (this.elements.closeSettings && this.elements.settingsPanel) {
      this.elements.closeSettings.addEventListener('click', () => {
        this.elements.settingsPanel.style.display = 'none';
      });
    }
    
    // Menu overlay
    if (this.elements.menuButton && this.elements.menuOverlay) {
      this.elements.menuButton.addEventListener('click', () => {
        this.elements.menuOverlay.style.display = 'flex';
      });
    }
    
    if (this.elements.closeMenu && this.elements.menuOverlay) {
      this.elements.closeMenu.addEventListener('click', () => {
        this.elements.menuOverlay.style.display = 'none';
      });
    }
    
    // Sound toggle
    if (this.elements.soundButton) {
      this.elements.soundButton.addEventListener('click', () => {
        this.state.sound = !this.state.sound;
        this.elements.soundButton.classList.toggle('active', this.state.sound);
      });
    }
    
    // Debug toggle
    if (this.elements.debugToggle) {
      this.elements.debugToggle.addEventListener('change', () => {
        this.debugMode = this.elements.debugToggle.checked;
        document.body.classList.toggle('debug-mode', this.debugMode);
      });
    }
    
    // Debug button
    if (this.elements.debugButton) {
      this.elements.debugButton.addEventListener('click', () => {
        this.showDebugInfo();
      });
    }
    
    // Window resize
    window.addEventListener('resize', () => {
      this.updateScreenInfo();
    });
    
    // Play mode tabs
    if (this.elements.manualTab && this.elements.autoTab) {
      this.elements.manualTab.addEventListener('click', () => {
        this.elements.manualTab.classList.add('active');
        this.elements.autoTab.classList.remove('active');
        this.state.autoPlay = false;
      });
      
      this.elements.autoTab.addEventListener('click', () => {
        this.elements.autoTab.classList.add('active');
        this.elements.manualTab.classList.remove('active');
        this.state.autoPlay = true;
      });
    }
  }
  
  /**
   * Register a game with the manager
   * @param {string} gameId - Unique identifier for the game
   * @param {Function} gameFactory - Factory function that creates the game
   * @returns {boolean} True if registration was successful
   */
  registerGame(gameId, gameFactory) {
    if (!gameId || typeof gameFactory !== 'function') {
      console.error('FullGameManager: Invalid game registration');
      return false;
    }
    
    // Store game factory in registry
    this.games[gameId] = gameFactory;
    console.log(`FullGameManager: Registered game '${gameId}'`);
    
    return true;
  }
  
  /**
   * Load a game by ID
   * @param {string} gameId - ID of the game to load
   * @returns {boolean} True if game was loaded successfully
   */
  loadGame(gameId) {
    if (!this.initialized) {
      console.error('FullGameManager: Cannot load game, manager not initialized');
      return false;
    }
    
    // Check if game exists
    if (!this.games[gameId]) {
      this.showStatus(`Game ${gameId} not found`, true);
      return false;
    }
    
    // Clean up active game if exists
    if (this.activeGame && typeof this.activeGame.cleanup === 'function') {
      this.activeGame.cleanup();
    }
    
    try {
      // Create new game instance
      this.activeGame = this.games[gameId](this.canvasManager, this);
      this.activeGameId = gameId;
      
      // Update game's bet amount to match current bet
      if (this.activeGame.config) {
        this.activeGame.config.betAmount = this.state.bet;
      }
      
      // Initialize game if it has init method
      if (typeof this.activeGame.init === 'function') {
        this.activeGame.init();
      }
      
      // Draw game
      if (typeof this.activeGame.draw === 'function') {
        this.activeGame.draw();
      }
      
      // Update game select if it doesn't match
      if (this.elements.gameSelect && this.elements.gameSelect.value !== gameId) {
        this.elements.gameSelect.value = gameId;
      }
      
      // Update header and footer titles
      this.updateGameTitle(this.activeGame.name || gameId);
      
      this.showStatus(`Loaded ${this.activeGame.name || gameId}`);
      return true;
    } catch (error) {
      console.error(`FullGameManager: Failed to load game ${gameId}:`, error);
      this.showStatus(`Failed to load game ${gameId}`, true);
      return false;
    }
  }
  
  /**
   * Update game title in header and footer
   * @param {string} title - Game title
   */
  updateGameTitle(title) {
    // Update document title
    document.title = title;
    
    // Update header title
    if (this.elements.gameTitle) {
      this.elements.gameTitle.textContent = title;
    }
    
    // Update footer title
    if (this.elements.footerGameTitle) {
      this.elements.footerGameTitle.textContent = title;
    }
  }
  
  /**
   * Handle spin button click
   */
  handleSpin() {
    if (!this.activeGame) return;
    
    // Check if game has enough balance for minimum bet
    if (this.state.balance < this.state.bet) {
      this.showStatus('Not enough balance to play!', true);
      return;
    }
    
    // Call the game's spin method
    if (typeof this.activeGame.spin === 'function') {
      this.activeGame.spin(this.state.bet);
    } else if (typeof this.activeGame.play === 'function') {
      this.activeGame.play(this.state.bet);
    } else if (this.activeGameId === 'dice' && typeof this.activeGame.rollDice === 'function') {
      this.activeGame.rollDice(this.state.bet);
    } else if (this.activeGameId === 'card' && typeof this.activeGame.dealCards === 'function') {
      this.activeGame.dealCards(this.state.bet);
    }
  }
  
  /**
   * Change bet amount
   * @param {number} amount - Amount to change by
   */
  changeBet(amount) {
    const newBet = Math.max(this.config.minBet, Math.min(this.config.maxBet, this.state.bet + amount));
    this.setBet(newBet);
  }
  
  /**
   * Set bet to a fraction of current bet
   * @param {number} fraction - Fraction to multiply by
   */
  setBetFraction(fraction) {
    const newBet = Math.max(this.config.minBet, Math.min(this.config.maxBet, Math.floor(this.state.bet * fraction)));
    this.setBet(newBet);
  }
  
  /**
   * Set bet amount directly
   * @param {number} amount - New bet amount
   */
  setBet(amount) {
    this.state.bet = Math.max(this.config.minBet, Math.min(this.config.maxBet, amount));
    this.updateBetDisplay();
    this.updatePotentialWinDisplay();
    
    // Update active game bet amount if applicable
    if (this.activeGame && this.activeGame.config) {
      this.activeGame.config.betAmount = this.state.bet;
    }
  }
  
  /**
   * Update the bet display
   */
  updateBetDisplay() {
    if (this.elements.betInput) {
      this.elements.betInput.value = this.state.bet;
    }
  }
  
  /**
   * Update the balance
   * @param {number} amount - Amount to add to balance (negative for subtraction)
   * @param {string} reason - Reason for balance change
   */
  updateBalance(amount, reason = '') {
    // Update balance
    this.state.balance += amount;
    
    // Update display
    this.updateBalanceDisplay();
    
    // If it's a win, record it
    if (amount > 0 && amount >= this.state.bet) {
      this.state.lastWin = amount;
    }
    
    // Add to history
    this.state.gameHistory.push({
      timestamp: new Date(),
      gameId: this.activeGameId,
      amount,
      reason,
      newBalance: this.state.balance
    });
    
    // Show message if significant amount
    if (amount > 0 && amount >= this.state.bet) {
      this.showStatus(`You won ${amount}!`);
    } else if (amount < 0) {
      this.showStatus(`Bet ${Math.abs(amount)} placed`);
    }
    
    // Return new balance
    return this.state.balance;
  }
  
  /**
   * Update the balance display
   */
  updateBalanceDisplay() {
    if (this.elements.balanceDisplay) {
      this.elements.balanceDisplay.textContent = this.state.balance;
    }
  }
  
  /**
   * Update potential win display
   */
  updatePotentialWinDisplay() {
    if (this.elements.potentialWin) {
      const multiplier = this.state.riskMultipliers[this.state.riskLevel] || 3;
      const potentialWin = this.state.bet * multiplier;
      this.elements.potentialWin.textContent = potentialWin.toFixed(2);
    }
  }
  
  /**
   * Start time updater
   */
  startTimeUpdater() {
    // Update immediately
    this.updateTimeDisplay();
    
    // Update every second
    setInterval(() => this.updateTimeDisplay(), 1000);
  }
  
  /**
   * Update time display
   */
  updateTimeDisplay() {
    if (this.elements.currentTime) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      this.elements.currentTime.textContent = `${hours}:${minutes}:${seconds}`;
    }
  }
  
  /**
   * Apply theme
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    // Update state
    this.state.theme = theme;
    
    // Remove all theme classes
    if (this.elements.container) {
      const themeClasses = ['theme-default', 'theme-pirate', 'theme-neon', 'theme-classic'];
      themeClasses.forEach(cls => this.elements.container.classList.remove(cls));
      
      // Add selected theme class
      this.elements.container.classList.add(`theme-${theme}`);
    }
    
    // Update canvas background
    if (this.canvasManager) {
      this.canvasManager.config.backgroundColor = this.getThemeColors(theme);
      this.canvasManager.drawBackground();
    }
    
    // Update theme select
    if (this.elements.themeSelect && this.elements.themeSelect.value !== theme) {
      this.elements.themeSelect.value = theme;
    }
  }
  
  /**
   * Get theme colors
   * @param {string} theme - Theme name
   * @returns {string[]} Array of [startColor, endColor]
   */
  getThemeColors(theme) {
    const themes = {
      default: ['#071824', '#071d2a'],
      pirate: ['#1E1B4B', '#2D2B55'],
      neon: ['#0D0221', '#130B2A'],
      classic: ['#0E0E10', '#1F1F23']
    };
    
    return themes[theme] || themes.default;
  }
  
  /**
   * Apply layout
   * @param {string} layout - Layout type ('pc' or 'mobile')
   */
  applyLayout(layout) {
    // Update state
    this.state.layout = layout;
    
    // Update container class
    if (this.elements.container) {
      this.elements.container.classList.remove('pc', 'mobile');
      this.elements.container.classList.add(layout);
    }
    
    // Update layout radio buttons
    if (this.elements.desktopLayout) {
      this.elements.desktopLayout.checked = layout === 'pc';
    }
    
    if (this.elements.mobileLayout) {
      this.elements.mobileLayout.checked = layout === 'mobile';
    }
    
    // Resize canvas
    if (this.canvasManager) {
      this.canvasManager.resize();
    }
    
    // Redraw game
    if (this.activeGame && typeof this.activeGame.draw === 'function') {
      this.activeGame.draw();
    }
    
    // Update screen info
    this.updateScreenInfo();
  }
  
  /**
   * Update screen resolution information
   */
  updateScreenInfo() {
    // Get screen resolution
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Get window size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Get canvas size
    const canvasWidth = this.elements.canvas ? this.elements.canvas.width : 0;
    const canvasHeight = this.elements.canvas ? this.elements.canvas.height : 0;
    
    // Get game playground size
    const playgroundZone = document.querySelector('.playground-zone');
    const playgroundWidth = playgroundZone ? playgroundZone.clientWidth : 0;
    const playgroundHeight = playgroundZone ? playgroundZone.clientHeight : 0;
    
    // Update display elements
    if (this.elements.screenResolution) {
      this.elements.screenResolution.textContent = `${screenWidth}×${screenHeight}`;
    }
    
    if (this.elements.windowSize) {
      this.elements.windowSize.textContent = `Window: ${windowWidth}×${windowHeight}`;
    }
    
    if (this.elements.canvasSize) {
      this.elements.canvasSize.textContent = `Canvas: ${canvasWidth}×${canvasHeight}`;
    }
    
    if (this.elements.gameCanvas) {
      this.elements.gameCanvas.textContent = `Game Playground: ${playgroundWidth}×${playgroundHeight}`;
    }
  }
  
  /**
   * Show debug information
   */
  showDebugInfo() {
    const debugInfo = {
      framework: {
        initialized: this.initialized,
        activeGame: this.activeGameId,
        canvas: this.canvasManager ? 'initialized' : 'not initialized'
      },
      state: this.state,
      dom: {
        foundElements: Object.entries(this.elements)
          .filter(([, element]) => element !== null)
          .map(([name]) => name),
        missingElements: Object.entries(this.elements)
          .filter(([, element]) => element === null)
          .map(([name]) => name)
      }
    };
    
    console.log('Debug Info:', debugInfo);
    this.showStatus('Debug info logged to console');
    
    // Display on screen if in debug mode
    if (this.debugMode) {
      // Create or update debug panel
      let debugPanel = document.getElementById('debug-panel');
      
      if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.top = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugPanel.style.color = '#fff';
        debugPanel.style.padding = '10px';
        debugPanel.style.borderRadius = '5px';
        debugPanel.style.maxHeight = '80vh';
        debugPanel.style.overflowY = 'auto';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.fontSize = '12px';
        debugPanel.style.fontFamily = 'monospace';
        document.body.appendChild(debugPanel);
      }
      
      // Update content
      debugPanel.innerHTML = `
        <h3>Debug Info</h3>
        <button id="close-debug-panel" style="position: absolute; top: 5px; right: 5px;">X</button>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
      `;
      
      // Add close button handler
      document.getElementById('close-debug-panel').addEventListener('click', () => {
        debugPanel.style.display = 'none';
      });
    }
  }
  
  /**
   * Show a status message
   * @param {string} message - Message to show
   * @param {boolean} isError - Whether this is an error message
   */
  showStatus(message, isError = false) {
    console.log(message);
    
    if (this.elements.statusMessage) {
      this.elements.statusMessage.textContent = message;
      this.elements.statusMessage.style.color = isError ? '#f85149' : '#2ea043';
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Clean up active game
    if (this.activeGame && typeof this.activeGame.cleanup === 'function') {
      this.activeGame.cleanup();
    }
    
    // Clean up canvas manager
    if (this.canvasManager) {
      this.canvasManager.cleanup();
    }
    
    // Reset state
    this.initialized = false;
  }
}

// Export the FullGameManager
if (typeof window !== 'undefined') {
  window.FullGameManager = FullGameManager;
}