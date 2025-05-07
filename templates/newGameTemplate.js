/**
 * NewGameTemplate - Template for creating new games using the framework
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to games/yourGameName.js
 * 2. Rename the class to your game name
 * 3. Implement the required methods of the IGame interface
 * 4. Create a manifest file in games/manifests/your-game.json
 * 5. Add the game to GameRegistry
 */

class NewGameTemplate {
  /**
   * Create a new game instance
   * @param {Object} config - Configuration object for the game
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      gameTitle: 'New Game',
      initialBet: 10,
      maxBet: 500,
      ...config
    };
    
    // Game state
    this.state = {
      initialized: false,
      isRunning: false,
      isPaused: false,
      isSpinning: false,
      betAmount: this.config.initialBet || 10,
      riskLevel: 'medium',
      lastResult: null
    };
    
    // Framework reference
    this.framework = null;
    
    // Event listeners
    this.eventListeners = {};
    
    // Canvas and context
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    
    // Animation frame ID for proper cleanup
    this.animationFrameId = null;
  }
  
  /**
   * Initialize the game with configuration
   * @param {Object} config - Game configuration
   * @return {Promise} Promise that resolves when the game is fully initialized
   */
  async initialize(config) {
    console.log('Initializing game with config:', config);
    
    // Store container reference
    this.container = config.container;
    
    // Update config with initialization parameters
    if (config.bet) this.state.betAmount = config.bet;
    if (config.riskLevel) this.state.riskLevel = config.riskLevel;
    
    // Create canvas for rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
    
    // Get rendering context
    this.ctx = this.canvas.getContext('2d');
    
    // Initialize game elements
    this.initGameElements();
    
    // Mark as initialized
    this.state.initialized = true;
    
    // Emit initialized event
    this.emit('initialized', { success: true });
    
    return Promise.resolve();
  }
  
  /**
   * Start the game
   * @return {Promise} Promise that resolves when the game is started
   */
  async start() {
    if (!this.state.initialized) {
      return Promise.reject(new Error('Game not initialized'));
    }
    
    // Update state
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    // Start animation loop
    this.animate();
    
    // Emit started event
    this.emit('started', { success: true });
    
    return Promise.resolve();
  }
  
  /**
   * Pause the game
   */
  pause() {
    if (!this.state.isRunning) {
      console.warn('Cannot pause a game that is not running');
      return;
    }
    
    this.state.isPaused = true;
    
    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Emit paused event
    this.emit('paused', { timestamp: Date.now() });
  }
  
  /**
   * Resume the game after pause
   */
  resume() {
    if (!this.state.isPaused) {
      console.warn('Cannot resume a game that is not paused');
      return;
    }
    
    this.state.isPaused = false;
    
    // Restart animation loop
    this.animate();
    
    // Emit resumed event
    this.emit('resumed', { timestamp: Date.now() });
  }
  
  /**
   * Stop and unload the game, freeing resources
   * @return {Promise} Promise that resolves when the game is fully unloaded
   */
  async destroy() {
    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove window event listeners
    window.removeEventListener('resize', this.resize.bind(this));
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Update state
    this.state.isRunning = false;
    this.state.initialized = false;
    
    // Clear references
    this.container = null;
    this.ctx = null;
    this.canvas = null;
    
    // Clear event listeners
    this.eventListeners = {};
    
    // Emit destroyed event
    this.emit('destroyed', { success: true });
    
    return Promise.resolve();
  }
  
  /**
   * Perform a game action (e.g., spin)
   * @param {Object} params - Action parameters
   * @return {Promise<Object>} Action result
   */
  async performAction(params) {
    if (!this.state.isRunning || this.state.isPaused) {
      return Promise.reject(new Error('Game is not in a runnable state'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      case 'spin':
        // If already spinning, reject
        if (this.state.isSpinning) {
          return Promise.reject(new Error('Already spinning'));
        }
        
        return this.handleSpin();
        
      case 'setBet':
        if (data.amount === undefined) {
          return Promise.reject(new Error('No bet amount provided'));
        }
        
        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
          return Promise.reject(new Error('Invalid bet amount'));
        }
        
        // Limit bet to maximum
        this.state.betAmount = Math.min(amount, this.config.maxBet);
        
        // Emit bet changed event
        this.emit('betChanged', { amount: this.state.betAmount });
        
        return Promise.resolve({
          success: true,
          bet: this.state.betAmount
        });
        
      case 'setRiskLevel':
        if (data.level === undefined) {
          return Promise.reject(new Error('No risk level provided'));
        }
        
        const validLevels = ['low', 'medium', 'high'];
        if (!validLevels.includes(data.level)) {
          return Promise.reject(new Error('Invalid risk level'));
        }
        
        this.state.riskLevel = data.level;
        
        // Emit risk level changed event
        this.emit('riskLevelChanged', { level: data.level });
        
        return Promise.resolve({
          success: true,
          riskLevel: this.state.riskLevel
        });
        
      default:
        return Promise.reject(new Error(`Unknown action type: ${type}`));
    }
  }
  
  /**
   * Handle container size changes
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (!this.container || !this.canvas) return;
    
    // Update canvas dimensions
    this.canvas.width = width || this.container.clientWidth;
    this.canvas.height = height || this.container.clientHeight;
    
    // Redraw the game
    this.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
    
    // Emit resize event
    this.emit('resize', { width: this.canvas.width, height: this.canvas.height });
  }
  
  /**
   * Update game settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    // Update game settings
    if (settings.bet !== undefined) this.state.betAmount = settings.bet;
    if (settings.riskLevel !== undefined) this.state.riskLevel = settings.riskLevel;
    
    // Update more settings as needed for your specific game
    
    // Redraw the game
    if (this.ctx && this.canvas) {
      this.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
    }
    
    // Emit settings updated event
    this.emit('settingsUpdated', { settings });
  }
  
  /**
   * Calculate potential win based on bet and risk level
   * @param {number} betAmount - Bet amount
   * @param {string} riskLevel - Risk level
   * @return {number} Potential win amount
   */
  calculatePotentialWin(betAmount = null, riskLevel = null) {
    // Use provided values or defaults from state
    const bet = betAmount !== null ? betAmount : this.state.betAmount;
    const risk = riskLevel || this.state.riskLevel;
    
    // Define multipliers for each risk level
    const riskMultipliers = {
      'low': 1.5,
      'medium': 3,
      'high': 6
    };
    
    // Apply multiplier
    return bet * (riskMultipliers[risk] || riskMultipliers.medium);
  }
  
  /**
   * Get current game state for saving
   * @return {Object} Game state
   */
  getState() {
    // Return a copy of the state to prevent external modification
    return { ...this.state };
  }
  
  /**
   * Restore game from saved state
   * @param {Object} state - Saved state
   */
  setState(state) {
    // Update state properties
    if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
    if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
    if (state.lastResult !== undefined) this.state.lastResult = { ...state.lastResult };
    
    // Update more state properties as needed for your specific game
    
    // Redraw the game
    if (this.ctx && this.canvas) {
      this.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
    }
    
    // Emit state restored event
    this.emit('stateRestored', { success: true });
  }
  
  /**
   * Get information about the game
   * @return {Object} Game information
   */
  getInfo() {
    return {
      id: 'new-game',
      name: this.config.gameTitle,
      version: '1.0.0',
      type: 'template',
      features: ['spin', 'win_animations', 'risk_levels'],
      author: 'Your Name',
      description: 'A new game using the IGame interface'
    };
  }
  
  /**
   * Check if the game supports a specific feature
   * @param {string} featureName - Feature name
   * @return {boolean} True if feature is supported
   */
  supportsFeature(featureName) {
    const supportedFeatures = [
      'spin',
      'win_animations',
      'risk_levels',
      'state_save',
      'state_restore'
    ];
    
    return supportedFeatures.includes(featureName);
  }
  
  /**
   * Get list of available events
   * @return {string[]} List of event names
   */
  getAvailableEvents() {
    return [
      'initialized',
      'started',
      'paused',
      'resumed',
      'destroyed',
      'spinStart',
      'spinEnd',
      'win',
      'loss',
      'betChanged',
      'riskLevelChanged',
      'resize',
      'stateRestored',
      'settingsUpdated'
    ];
  }
  
  /**
   * Add event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   */
  addEventListener(eventName, handler) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    this.eventListeners[eventName].push(handler);
  }
  
  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   */
  removeEventListener(eventName, handler) {
    if (!this.eventListeners[eventName]) return;
    
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      h => h !== handler
    );
  }
  
  /**
   * Set the framework reference
   * @param {Object} framework - The game framework instance
   */
  setFramework(framework) {
    this.framework = framework;
  }
  
  // ----- Helper Methods (Not part of IGame interface) -----
  
  /**
   * Initialize game elements
   * @private
   */
  initGameElements() {
    // Initialize your game-specific elements here
    
    // Add resize event listener
    window.addEventListener('resize', () => {
      this.resize(this.container.clientWidth, this.container.clientHeight);
    });
  }
  
  /**
   * Animation loop
   * @private
   */
  animate() {
    if (this.state.isPaused) return;
    
    // Update game state here
    
    // Render the game
    this.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Handle spin action
   * @private
   * @return {Promise<Object>} Spin result
   */
  handleSpin() {
    return new Promise((resolve) => {
      // Update state
      this.state.isSpinning = true;
      
      // Emit spin start event
      this.emit('spinStart', { timestamp: Date.now() });
      
      // Simulate spin with timeout (replace with your game logic)
      setTimeout(() => {
        // Generate random result
        const result = {
          isWin: Math.random() > 0.7,
          winType: Math.random() > 0.5 ? 'big-win' : 'regular-win',
          // Add other result data specific to your game
        };
        
        // Calculate win amount if it's a win
        let winAmount = 0;
        if (result.isWin) {
          winAmount = this.calculatePotentialWin();
          
          // Update balance in framework if available
          if (this.framework && this.framework.services && 
              this.framework.services.bettingService) {
            this.framework.services.bettingService.registerWin(
              winAmount, this.getInfo().id, { type: result.winType }
            );
          }
          
          // Emit win event
          this.emit('win', {
            amount: winAmount,
            type: result.winType
          });
        } else {
          // Update balance in framework if available
          if (this.framework && this.framework.services && 
              this.framework.services.bettingService) {
            this.framework.services.bettingService.registerLoss(
              this.state.betAmount, this.getInfo().id
            );
          }
          
          // Emit loss event
          this.emit('loss', {
            amount: this.state.betAmount
          });
        }
        
        // Update state
        this.state.isSpinning = false;
        this.state.lastResult = { ...result, winAmount };
        
        // Emit spin end event
        this.emit('spinEnd', {
          result,
          winAmount
        });
        
        // Resolve promise with result
        resolve({
          success: true,
          result,
          winAmount
        });
      }, 2000); // Simulate 2 second spin
    });
  }
  
  /**
   * Render the game
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Object} state - Current game state
   */
  renderGame(ctx, width, height, state) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate center position
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw game title
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.gameTitle, centerX, 50);
    
    // Draw bet and balance info
    ctx.font = '18px Arial';
    ctx.fillText(`Bet: ${state.betAmount} | Risk: ${state.riskLevel} | Balance: ${this.getBalance()}`, centerX, 90);
    
    // Draw game elements
    // Replace this with your own game rendering logic
    
    // Draw a game area placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(centerX - 200, centerY - 150, 400, 300);
    
    // Draw information for different game states
    if (state.isSpinning) {
      this.drawSpinningState(ctx, width, height);
    } else if (state.lastResult) {
      if (state.lastResult.isWin) {
        this.drawWinState(ctx, width, height, state.lastResult.winAmount);
      } else {
        this.drawLossState(ctx, width, height);
      }
    } else {
      this.drawIdleState(ctx, width, height);
    }
  }
  
  /**
   * Draw spinning state
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawSpinningState(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw spinning indicator
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Spinning...', centerX, centerY);
    
    // Add animation effects or spinners here
  }
  
  /**
   * Draw win state
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} winAmount - Win amount
   */
  drawWinState(ctx, width, height, winAmount) {
    const centerX = width / 2;
    
    // Draw win message
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`WIN: ${winAmount.toFixed(2)}`, centerX, height - 100);
    
    // Add win animations or effects here
  }
  
  /**
   * Draw loss state
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawLossState(ctx, width, height) {
    const centerX = width / 2;
    
    // Draw loss message
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Try again!', centerX, height - 100);
    
    // Add loss animations or effects here
  }
  
  /**
   * Draw idle state
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawIdleState(ctx, width, height) {
    const centerX = width / 2;
    
    // Draw idle message
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press SPIN to play', centerX, height - 100);
    
    // Draw game instructions or decorations here
  }
  
  /**
   * Get current balance from framework or return default
   * @private
   * @return {number} Current balance
   */
  getBalance() {
    if (this.framework && this.framework.services && 
        this.framework.services.bettingService) {
      return this.framework.services.bettingService.getBalance();
    }
    
    return 1000; // Default balance if framework not available
  }
  
  /**
   * Emit an event to all registered listeners
   * @private
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) return;
    
    // Add timestamp to all events
    const eventData = {
      ...data,
      timestamp: Date.now()
    };
    
    // Call all handlers
    this.eventListeners[eventName].forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
}

// Don't export to global scope in module environments
if (typeof window !== 'undefined') {
  window.NewGameTemplate = NewGameTemplate;
}

// Example manifest for the game:
/* 
{
  "id": "new-game",
  "version": "1.0.0",
  "name": "New Game",
  "description": "A new game using the IGame interface",
  "author": "Your Name",
  "main": "NewGameTemplate",
  "thumbnail": "assets/images/games/new-game-thumbnail.png",
  "category": "other",
  "tags": ["template", "beginner"],
  "assets": [
    {
      "type": "image",
      "path": "assets/images/games/common/background.png"
    }
  ],
  "config": {
    "defaultRiskLevel": "medium",
    "minBet": 1,
    "maxBet": 500,
    "defaultBet": 10
  }
}
*/