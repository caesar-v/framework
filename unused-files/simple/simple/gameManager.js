/**
 * Game Manager - Simple Game Framework
 * 
 * Manages loading and switching between different games.
 * Acts as a central hub for game state and event handling.
 */

class GameManager {
  /**
   * Initialize a new Game Manager
   * @param {Object} config - Configuration for the game manager
   */
  constructor(config = {}) {
    this.config = {
      canvasId: 'game-canvas',
      defaultGame: 'dice',
      defaultBalance: 1000,
      statusElementId: 'status-message',
      balanceElementId: 'balance-display',
      spinButtonId: 'spin-button',
      gameSelectId: 'game-select',
      ...config
    };
    
    // Game registry
    this.games = {};
    this.activeGameId = null;
    this.activeGame = null;
    
    // Shared game state
    this.state = {
      balance: this.config.defaultBalance,
      betAmount: 10,
      lastWin: 0,
      gameHistory: []
    };
    
    // UI elements
    this.elements = {};
    
    // Canvas manager
    this.canvasManager = null;
    
    // Initialization flag
    this.initialized = false;
  }
  
  /**
   * Initialize the game manager
   * @returns {boolean} True if initialization was successful
   */
  init() {
    // Show initialization message
    this.showStatus('Initializing game framework...');
    
    // Get UI elements
    this.elements = {
      canvas: document.getElementById(this.config.canvasId),
      statusMessage: document.getElementById(this.config.statusElementId),
      balanceDisplay: document.getElementById(this.config.balanceElementId),
      spinButton: document.getElementById(this.config.spinButtonId),
      gameSelect: document.getElementById(this.config.gameSelectId)
    };
    
    // Check if essential elements exist
    if (!this.elements.canvas) {
      this.showStatus('Canvas element not found', true);
      return false;
    }
    
    // Initialize canvas manager
    this.canvasManager = new CanvasManager();
    const canvasInitialized = this.canvasManager.init(this.elements.canvas);
    
    if (!canvasInitialized) {
      this.showStatus('Failed to initialize canvas', true);
      return false;
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update balance display
    this.updateBalanceDisplay();
    
    // Mark as initialized
    this.initialized = true;
    
    // Show ready message
    this.showStatus('Game framework ready!');
    
    return true;
  }
  
  /**
   * Setup event listeners
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
  }
  
  /**
   * Register a game with the manager
   * @param {string} gameId - Unique identifier for the game
   * @param {Function} gameFactory - Factory function that creates the game
   * @returns {boolean} True if registration was successful
   */
  registerGame(gameId, gameFactory) {
    if (!gameId || typeof gameFactory !== 'function') {
      console.error('GameManager: Invalid game registration');
      return false;
    }
    
    // Store game factory in registry
    this.games[gameId] = gameFactory;
    
    return true;
  }
  
  /**
   * Load a game by ID
   * @param {string} gameId - ID of the game to load
   * @returns {boolean} True if game was loaded successfully
   */
  loadGame(gameId) {
    if (!this.initialized) {
      console.error('GameManager: Cannot load game, manager not initialized');
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
      this.activeGame = this.games[gameId](this.canvasManager, this.state);
      this.activeGameId = gameId;
      
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
      
      this.showStatus(`Loaded ${this.activeGame.name || gameId}`);
      return true;
    } catch (error) {
      console.error(`GameManager: Failed to load game ${gameId}:`, error);
      this.showStatus(`Failed to load game ${gameId}`, true);
      return false;
    }
  }
  
  /**
   * Handle spin button click
   */
  handleSpin() {
    if (!this.activeGame) return;
    
    // Check if game has enough balance for minimum bet
    if (this.state.balance < this.state.betAmount) {
      this.showStatus('Not enough balance to play!', true);
      return;
    }
    
    // Call the game's spin method
    if (typeof this.activeGame.spin === 'function') {
      this.activeGame.spin();
    } else if (typeof this.activeGame.play === 'function') {
      this.activeGame.play();
    } else if (this.activeGameId === 'dice' && typeof this.activeGame.rollDice === 'function') {
      this.activeGame.rollDice();
    } else if (this.activeGameId === 'card' && typeof this.activeGame.dealCards === 'function') {
      this.activeGame.dealCards();
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
    
    // Add to history
    this.state.gameHistory.push({
      timestamp: new Date(),
      gameId: this.activeGameId,
      amount,
      reason,
      newBalance: this.state.balance
    });
    
    // Show message if significant amount
    if (amount > 0 && amount >= this.state.betAmount) {
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

// Export the GameManager
if (typeof window !== 'undefined') {
  window.GameManager = GameManager;
}