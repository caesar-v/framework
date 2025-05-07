/**
 * GameInitializer - Dedicated class to ensure reliable game initialization
 * Provides a robust mechanism for game initialization with multiple fallback strategies
 */

class GameInitializer {
  /**
   * Create a new GameInitializer
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      // Delay before first initialization attempt
      initialDelay: 50,
      
      // Interval for checking if game is loaded
      checkInterval: 200,
      
      // Maximum number of initialization attempts
      maxAttempts: 15,
      
      // Default game to load when all else fails
      defaultGame: 'dice',
      
      // Timeout for each initialization attempt (ms)
      attemptTimeout: 1000,
      
      // Delay between server restart detection attempts
      serverRestartCheckInterval: 2000,
      
      // How many server restart checks to perform
      serverRestartCheckMax: 5,
      
      // Reference to GameAPI (if available)
      gameAPI: null,
      
      // Custom game validation function
      gameValidationFunction: null,
      
      // Override with custom config
      ...config
    };
    
    // State tracking
    this.initialized = false;
    this.attempts = 0;
    this.checkIntervalId = null;
    this.serverRestartDetected = false;
    this.serverRestartChecks = 0;
    this.lastLoadTimeStamp = new Date().getTime();
    
    // Store timestamp for restart detection
    this.storeInitializationTimestamp();
    
    // Automatically start initialization process
    if (this.config.autoStart !== false) {
      setTimeout(() => this.ensureGameInitialized(), this.config.initialDelay);
      
      // Also listen for DOM ready event as a backup trigger
      document.addEventListener('DOMContentLoaded', () => {
        if (!this.initialized && this.attempts < 2) {
          console.log('GameInitializer: Attempting initialization on DOM loaded');
          this.ensureGameInitialized();
        }
      });
    }
  }
  
  /**
   * Store initialization timestamp for restart detection
   * @private
   */
  storeInitializationTimestamp() {
    try {
      sessionStorage.setItem('gameInitializerTimestamp', this.lastLoadTimeStamp.toString());
    } catch (e) {
      console.error('GameInitializer: Error storing timestamp:', e);
    }
  }
  
  /**
   * Detect if a server restart has occurred
   * This is determined by checking the load timestamp against session storage
   * @return {boolean} Whether a server restart was detected
   */
  detectServerRestart() {
    try {
      // Get stored timestamp from previous session
      const storedTimestamp = sessionStorage.getItem('gameInitializerTimestamp');
      
      if (storedTimestamp) {
        const storedTime = parseInt(storedTimestamp, 10);
        const currentTime = new Date().getTime();
        
        // If current time is significantly newer than stored time, a restart likely occurred
        if (currentTime - storedTime > 5000) {
          console.log('GameInitializer: Possible server restart detected');
          this.serverRestartDetected = true;
          
          // Start server restart recovery process
          this.startServerRestartRecovery();
          return true;
        }
      }
      
      // Always update the timestamp for future comparisons
      sessionStorage.setItem('gameInitializerTimestamp', this.lastLoadTimeStamp.toString());
      return false;
    } catch (e) {
      console.error('GameInitializer: Error detecting server restart:', e);
      return false;
    }
  }
  
  /**
   * Start recovery process after server restart
   * @private
   */
  startServerRestartRecovery() {
    console.log('GameInitializer: Starting server restart recovery process');
    
    // Schedule repeated checks to ensure game loads after restart
    const restartCheckInterval = setInterval(() => {
      this.serverRestartChecks++;
      console.log(`GameInitializer: Server restart recovery check ${this.serverRestartChecks}/${this.config.serverRestartCheckMax}`);
      
      // Stop checking after max attempts
      if (this.serverRestartChecks >= this.config.serverRestartCheckMax) {
        console.log('GameInitializer: Reached maximum restart recovery attempts');
        clearInterval(restartCheckInterval);
        return;
      }
      
      // Use lenient mode for initialization check after server restart
      if (this.isGameInitialized(true)) {
        console.log('GameInitializer: Game initialized successfully after restart (lenient check)');
        clearInterval(restartCheckInterval);
        
        // Schedule a full check and recovery if needed
        setTimeout(() => {
          if (!this.isGameInitialized()) {
            console.log('GameInitializer: Game passes lenient check but not full check, attempting to complete initialization');
            this.forceRedraw();
          }
        }, 1000);
        return;
      }
      
      // Force game initialization
      console.log('GameInitializer: Forcing game initialization after restart');
      this.initializeGame(true);
      
    }, this.config.serverRestartCheckInterval);
  }
  
  /**
   * Force a redraw of the active game
   * @private
   */
  forceRedraw() {
    // Try with GameAPI first
    if (this.config.gameAPI && this.config.gameAPI.activeGame) {
      const game = this.config.gameAPI.activeGame;
      
      // Try performAction if available
      if (typeof game.performAction === 'function') {
        try {
          game.performAction({ type: 'redraw' });
          return;
        } catch (e) {
          console.warn('GameInitializer: Error in performAction redraw:', e);
        }
      }
    }
    
    // Fall back to gameLoader method
    if (window.gameLoader && window.gameLoader.activeGame) {
      const framework = window.gameLoader.activeGame.framework || window.gameLoader.activeGame.game;
      if (framework) {
        if (typeof framework.redrawCanvas === 'function') {
          framework.redrawCanvas();
        } else if (typeof framework.drawCanvas === 'function') {
          framework.drawCanvas();
        }
      }
    }
  }
  
  /**
   * Main initialization function
   * This ensures a game is always loaded by repeatedly checking and forcing initialization
   */
  ensureGameInitialized() {
    console.log('GameInitializer: Starting game initialization check');
    
    // Check for server restart
    this.detectServerRestart();
    
    // Try different initialization strategies
    if (this.config.gameAPI) {
      // Try initializing through GameAPI
      if (!this.config.gameAPI.activeGame) {
        console.log('GameInitializer: GameAPI exists but no active game, initializing immediately');
        this.initializeGame();
      }
    } else if (window.gameLoader && !window.gameLoader.activeGame) {
      // Fall back to legacy GameLoader
      console.log('GameInitializer: GameLoader exists but no active game, initializing immediately');
      this.initializeGame();
    }
    
    // Set up periodic checks
    this.checkIntervalId = setInterval(() => this.checkGameStatus(), this.config.checkInterval);
    
    // Set up final safety check
    setTimeout(() => this.finalSafetyCheck(), 5000);
  }
  
  /**
   * Check if game is properly initialized
   * @param {boolean} lenientMode - When true, use less strict checks (for emergency recovery)
   * @returns {boolean} True if game is initialized, false otherwise
   */
  isGameInitialized(lenientMode = false) {
    // If a custom validation function is provided, use it
    if (typeof this.config.gameValidationFunction === 'function') {
      return this.config.gameValidationFunction(lenientMode);
    }
    
    // First try with GameAPI if available
    if (this.config.gameAPI) {
      if (!this.config.gameAPI.activeGame) {
        console.log('GameInitializer: No active game found in GameAPI');
        return false;
      }
      
      // In lenient mode, basic check is enough
      if (lenientMode) {
        return true;
      }
      
      // Check if game has necessary methods
      const game = this.config.gameAPI.activeGame;
      if (!game.getState || !game.setState) {
        console.log('GameInitializer: Game missing required IGame interface methods');
        return false;
      }
      
      return true;
    }
    
    // Fall back to legacy game initialization check
    
    // Game is initialized if GameLoader exists and has an active game
    if (!window.gameLoader) {
      console.log('GameInitializer: GameLoader not found');
      return false;
    }
    
    if (!window.gameLoader.activeGame) {
      console.log('GameInitializer: No active game found');
      return false;
    }
    
    // Check if the game framework is initialized
    const framework = window.gameLoader.activeGame.framework || window.gameLoader.activeGame.game;
    if (!framework) {
      console.log('GameInitializer: Game framework not found in active game');
      return false;
    }
    
    // In lenient mode (used during recovery), we only check the basic structure
    if (lenientMode) {
      console.log('GameInitializer: Using lenient initialization check (recovery mode)');
      return true;
    }
    
    // Enhanced checks for proper initialization
    
    // Check 1: Canvas existence and visibility
    let hasValidCanvas = false;
    
    if (framework.canvas) {
      // Check if canvas has dimensions
      if (framework.canvas.width > 0 && framework.canvas.height > 0) {
        console.log('GameInitializer: Game has properly sized canvas');
        hasValidCanvas = true;
      } else {
        console.log('GameInitializer: Game canvas has invalid dimensions');
        if (!lenientMode) return false;
      }
    } else if (framework.modules && framework.modules.canvas && framework.modules.canvas.canvas) {
      // Modern modular framework - check canvas in modules
      const canvasModule = framework.modules.canvas;
      if (canvasModule.canvas.width > 0 && canvasModule.canvas.height > 0) {
        console.log('GameInitializer: Game has properly sized canvas in module');
        hasValidCanvas = true;
      } else {
        console.log('GameInitializer: Game canvas in module has invalid dimensions');
        if (!lenientMode) return false;
      }
    } else {
      // No canvas found at either location
      console.log('GameInitializer: No canvas found in game framework');
      
      // Try to find canvas directly in the DOM as a fallback
      const gameCanvas = document.getElementById('game-canvas');
      if (gameCanvas && gameCanvas.width > 0 && gameCanvas.height > 0) {
        console.log('GameInitializer: Found valid canvas in DOM but not in framework');
        hasValidCanvas = true;
      } else if (!lenientMode) {
        return false;
      }
    }
    
    // Check 2: Game state existence
    if (!framework.state && (!framework.modules || !framework.modules.gameState)) {
      console.log('GameInitializer: No game state found');
      // Not a critical error, but worth noting
    }
    
    // Check 3: UI elements
    const gameCanvas = document.getElementById('game-canvas');
    if (!gameCanvas) {
      console.log('GameInitializer: Game canvas element not found in DOM');
      if (!hasValidCanvas && !lenientMode) return false;
    }
    
    // Check 4: Verify the game is functional by checking if it has render or update methods
    const hasRenderMethod = typeof framework.render === 'function' || 
                          (framework.modules && framework.modules.canvas && 
                            typeof framework.modules.canvas.render === 'function');
                           
    const hasUpdateMethod = typeof framework.update === 'function' || 
                          (framework.modules && typeof framework.modules.update === 'function');
                          
    if (!hasRenderMethod && !hasUpdateMethod) {
      console.log('GameInitializer: Game lacks render or update methods');
      if (!lenientMode) return false;
    }
    
    // All checks passed
    console.log('GameInitializer: Game is properly initialized with all required components');
    return true;
  }
  
  /**
   * Check if game is properly initialized and force initialization if needed
   * @private
   */
  checkGameStatus() {
    // Stop checking after max attempts
    if (this.attempts >= this.config.maxAttempts) {
      console.warn(`GameInitializer: Reached maximum attempts (${this.config.maxAttempts}), stopping checks`);
      clearInterval(this.checkIntervalId);
      return;
    }
    
    this.attempts++;
    console.log(`GameInitializer: Check attempt ${this.attempts}/${this.config.maxAttempts}`);
    
    // Check if game is already initialized
    if (this.isGameInitialized()) {
      console.log('GameInitializer: Game is properly initialized, stopping checks');
      this.initialized = true;
      clearInterval(this.checkIntervalId);
      return;
    }
    
    // If game is not initialized after several attempts, force initialization
    if (this.attempts > 2) {
      console.warn('GameInitializer: Game not initialized after multiple checks, forcing initialization');
      this.initializeGame();
    }
  }
  
  /**
   * Force game initialization
   * @param {boolean} isServerRestart - Whether this is being called after a server restart
   */
  initializeGame(isServerRestart = false) {
    console.log(`GameInitializer: Forcing game initialization${isServerRestart ? ' after server restart' : ''}`);
    
    // Try initializing through different methods
    if (this.config.gameAPI) {
      this.initializeGameWithAPI(isServerRestart);
    } else {
      this.initializeGameLegacy(isServerRestart);
    }
  }
  
  /**
   * Initialize game using GameAPI
   * @private
   * @param {boolean} isServerRestart - Whether this is being called after a server restart
   */
  initializeGameWithAPI(isServerRestart) {
    const gameAPI = this.config.gameAPI;
    
    // Get default game ID
    let gameId = this.determineGameId();
    
    try {
      // Force load the game
      gameAPI.loadGame(gameId, { 
        forceReload: isServerRestart,
        preserveState: !isServerRestart
      }).then(() => {
        console.log(`GameInitializer: Successfully initialized game ${gameId} with GameAPI`);
      }).catch(error => {
        console.error(`GameInitializer: Error initializing game ${gameId} with GameAPI:`, error);
        
        // Try with default game as fallback
        if (gameId !== this.config.defaultGame) {
          console.log(`GameInitializer: Trying fallback initialization with default game ${this.config.defaultGame}`);
          return gameAPI.loadGame(this.config.defaultGame, { 
            forceReload: true,
            preserveState: false
          });
        }
      });
    } catch (error) {
      console.error('GameInitializer: Failed to initialize game with GameAPI:', error);
    }
  }
  
  /**
   * Initialize game using legacy method (GameLoader)
   * @private
   * @param {boolean} isServerRestart - Whether this is being called after a server restart
   */
  initializeGameLegacy(isServerRestart) {
    // Reset any loading flags
    this.resetGameLoaderFlags();
    
    // Determine which game to load
    const gameType = this.determineGameType();
    
    // Try to create a new game instance
    try {
      // If GameLoader doesn't exist, create it
      if (!window.gameLoader) {
        console.log('GameInitializer: Creating new GameLoader instance');
        if (typeof GameLoader === 'function') {
          window.gameLoader = new GameLoader();
          
          // Wait for GameLoader to initialize its registry
          setTimeout(async () => {
            if (window.gameLoader && window.gameLoader.registry) {
              try {
                // If GameRegistry is available but empty, attempt to load manifests
                if (Object.keys(window.gameLoader.gameRegistry).length === 0) {
                  console.log('GameInitializer: Loading game manifests from registry');
                  
                  // Wait for registry to finish loading manifests
                  await new Promise(resolve => {
                    const checkRegistry = () => {
                      if (Object.keys(window.gameLoader.gameRegistry).length > 0) {
                        resolve();
                      } else {
                        setTimeout(checkRegistry, 100);
                      }
                    };
                    checkRegistry();
                  });
                  
                  console.log('GameInitializer: Game manifests loaded successfully');
                }
              } catch (error) {
                console.error('GameInitializer: Error loading game manifests:', error);
              }
            }
          }, 200);
        } else {
          console.error('GameInitializer: GameLoader constructor not available');
          // Try to load script explicitly if after server restart
          if (isServerRestart) {
            console.log('GameInitializer: Attempting to dynamically load gameLoader.js after server restart');
            this.loadGameLoaderScript().then(() => {
              console.log('GameInitializer: GameLoader script loaded, retrying initialization');
              // After loading script, retry initialization
              setTimeout(() => this.initializeGame(true), 500);
            }).catch(err => {
              console.error('GameInitializer: Failed to load GameLoader script:', err);
            });
          }
          return;
        }
      }
      
      // Check for critical game classes if after server restart
      if (isServerRestart && window.frameworkStarter && typeof window.frameworkStarter.checkClasses === 'function') {
        console.log('GameInitializer: Checking required classes after server restart');
        const classesAvailable = window.frameworkStarter.checkClasses();
        if (!classesAvailable) {
          console.error('GameInitializer: Required classes missing after server restart');
          // Force page reload as last resort if critical classes are missing
          if (confirm('Game framework could not initialize properly after server restart. Reload page?')) {
            window.location.reload();
          }
          return;
        }
      }
      
      // Force create new game with a timeout to prevent hanging
      console.log(`GameInitializer: Creating new game instance: ${gameType}`);
      
      // Create game with a timeout
      const timeoutId = setTimeout(() => {
        console.error('GameInitializer: Game creation timed out, resetting flags');
        this.resetGameLoaderFlags();
      }, this.config.attemptTimeout);
      
      // Try multiple initialization approaches for robustness
      
      // Approach 1: Framework starter (if available)
      if (window.frameworkStarter && typeof window.frameworkStarter.initGame === 'function') {
        try {
          console.log('GameInitializer: Using framework starter for initialization');
          window.frameworkStarter.initGame();
        } catch (starterError) {
          console.error('GameInitializer: Framework starter initialization failed:', starterError);
        }
      }
      
      // Approach 2: Direct GameLoader initialization
      if (!window.gameLoader.activeGame) {
        console.log('GameInitializer: Direct GameLoader initialization');
        // Attempt to create game
        window.gameLoader.forceCreateNewGame(gameType);
      }
      
      // Clear timeout if we got here
      clearTimeout(timeoutId);
      
      // Additional safety measures for server restart
      if (isServerRestart) {
        // Wait and check if initialization was successful
        setTimeout(() => {
          if (!this.isGameInitialized()) {
            console.warn('GameInitializer: Game still not initialized after restart attempts');
            
            // One final attempt with default game type
            console.log('GameInitializer: Final emergency attempt with default game');
            if (window.gameLoader) {
              // Reset everything
              this.resetGameLoaderFlags();
              if (window.gameLoader.activeGame) {
                window.gameLoader.activeGame = null;
              }
              
              // Try with explicit default type
              window.gameLoader.forceCreateNewGame(this.config.defaultGame);
            }
          }
        }, 1000);
      }
      
      console.log('GameInitializer: Game creation initiated');
    } catch (e) {
      console.error('GameInitializer: Error forcing game initialization:', e);
    }
  }
  
  /**
   * Dynamically load the GameLoader script
   * Only used as a last resort after server restart
   * @private
   * @return {Promise<void>} Promise that resolves when script is loaded
   */
  loadGameLoaderScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'js/core/gameLoader.js';
      script.onload = () => {
        console.log('GameInitializer: GameLoader script loaded dynamically');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load GameLoader script'));
      };
      document.head.appendChild(script);
    });
  }
  
  /**
   * Reset all gameLoader flags
   * @private
   */
  resetGameLoaderFlags() {
    if (!window.gameLoader) return;
    
    console.log('GameInitializer: Resetting GameLoader flags');
    window.gameLoader._creatingGame = false;
    window.gameLoader._loadingGame = false;
    window.gameLoader._loadingGameTest = false;
    window.gameLoader._loadingInProgress = null;
    
    // Reset any animation IDs for the active game
    if (window.gameLoader.activeGame && window.gameLoader.activeGame.animationId) {
      console.log('GameInitializer: Cancelling active animation frame');
      cancelAnimationFrame(window.gameLoader.activeGame.animationId);
      window.gameLoader.activeGame.animationId = null;
    }
  }
  
  /**
   * Determine which game to load using GameAPI
   * @private
   * @return {string} Game ID to load
   */
  determineGameId() {
    // First try to get value from selector
    const gameSelector = document.getElementById('game-select');
    if (gameSelector && gameSelector.value) {
      return gameSelector.value;
    }
    
    // If selector exists but has no value, get the first option
    if (gameSelector && gameSelector.options && gameSelector.options.length > 0) {
      return gameSelector.options[0].value;
    }
    
    // Check if we have available games from GameAPI
    if (this.config.gameAPI) {
      const games = this.config.gameAPI.getGames();
      if (games.length > 0) {
        console.log('GameInitializer: Using first game from API:', games[0].id);
        return games[0].id;
      }
    }
    
    // Use default game as last resort
    return this.config.defaultGame;
  }
  
  /**
   * Determine which game to load for legacy GameLoader
   * @private
   * @return {string} Game type to load
   */
  determineGameType() {
    // First try to get value from selector
    const gameSelector = document.getElementById('game-select');
    if (gameSelector && gameSelector.value) {
      return gameSelector.value;
    }
    
    // If selector exists but has no value, get the first option
    if (gameSelector && gameSelector.options && gameSelector.options.length > 0) {
      return gameSelector.options[0].value;
    }
    
    // Check if we have a registry with games
    if (window.gameLoader && window.gameLoader.gameRegistry) {
      const registryGames = Object.keys(window.gameLoader.gameRegistry);
      if (registryGames.length > 0) {
        console.log('GameInitializer: Using first game from registry:', registryGames[0]);
        return registryGames[0];
      }
    }
    
    // Use default game as last resort
    return this.config.defaultGame;
  }
  
  /**
   * Final safety check to ensure game is initialized
   * This runs once after all other mechanisms have had a chance to work
   * @private
   */
  finalSafetyCheck() {
    console.log('GameInitializer: Running final safety check');
    
    // First try a lenient check for recovery scenarios
    if (!this.isGameInitialized(true)) {
      console.warn('GameInitializer: Final check - game still not initialized, forcing emergency initialization');
      
      // Clean up any previous initialization attempts
      if (this.checkIntervalId) {
        clearInterval(this.checkIntervalId);
      }
      
      // Reset flags and force initialization
      this.resetGameLoaderFlags();
      
      // Try to create a completely fresh game instance
      if (this.config.gameAPI) {
        // Use GameAPI with fallback game
        this.config.gameAPI.loadGame(this.config.defaultGame, { forceReload: true, preserveState: false })
          .catch(error => {
            console.error('GameInitializer: GameAPI emergency initialization failed:', error);
            this.showInitializationFailureUI();
          });
      } else if (window.gameLoader) {
        try {
          // Clean up any existing game instances and references
          // Clear active game
          if (window.gameLoader.activeGame) {
            window.gameLoader.activeGame = null;
          }
          
          // Clear existing game instances to force fresh creation
          if (window.gameLoader.gameInstances) {
            for (const gameType in window.gameLoader.gameInstances) {
              delete window.gameLoader.gameInstances[gameType];
            }
          }
          
          // Fresh game instance with default game type
          if (typeof window.gameLoader.forceCreateNewGame === 'function') {
            console.log(`GameInitializer: Last resort - creating ${this.config.defaultGame} game`);
            window.gameLoader.forceCreateNewGame(this.config.defaultGame);
          }
        } catch (error) {
          console.error('GameInitializer: Fatal error during emergency initialization:', error);
          this.showInitializationFailureUI();
        }
      } else {
        console.error('GameInitializer: No initialization method available for emergency recovery');
        this.showInitializationFailureUI();
      }
    } else {
      console.log('GameInitializer: Final check - game is properly initialized');
      
      // Even if initialized, schedule a second verification check
      // to ensure the game is still initialized after some time
      setTimeout(() => {
        if (!this.isGameInitialized()) {
          console.warn('GameInitializer: Game initialization lost after initial success');
          
          // Attempt recovery
          this.resetGameLoaderFlags();
          this.initializeGame();
        }
      }, 3000);
    }
  }
  
  /**
   * Show UI indication of initialization failure
   * Creates a visible error indicator and manual recovery button
   * @private
   */
  showInitializationFailureUI() {
    console.log('GameInitializer: Showing initialization failure UI');
    
    // Check if we already have a failure indicator
    if (document.getElementById('game-init-failure')) {
      return;
    }
    
    try {
      // Create failure indicator
      const failureIndicator = document.createElement('div');
      failureIndicator.id = 'game-init-failure';
      failureIndicator.style.position = 'fixed';
      failureIndicator.style.top = '50%';
      failureIndicator.style.left = '50%';
      failureIndicator.style.transform = 'translate(-50%, -50%)';
      failureIndicator.style.backgroundColor = 'rgba(196, 40, 40, 0.9)';
      failureIndicator.style.color = 'white';
      failureIndicator.style.padding = '20px';
      failureIndicator.style.borderRadius = '8px';
      failureIndicator.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      failureIndicator.style.zIndex = '9999';
      failureIndicator.style.textAlign = 'center';
      failureIndicator.style.maxWidth = '80%';
      
      // Failure message
      failureIndicator.innerHTML = `
        <h3 style="margin-top: 0;">Game Initialization Failed</h3>
        <p>The game framework could not initialize properly after multiple attempts.</p>
        <button id="game-init-retry" style="background: #50fa7b; color: #282a36; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: bold;">Retry Initialization</button>
        <button id="game-init-reload" style="background: #6272a4; color: #f8f8f2; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Reload Page</button>
      `;
      
      // Append to body
      document.body.appendChild(failureIndicator);
      
      // Add event listeners
      document.getElementById('game-init-retry').addEventListener('click', () => {
        // Remove failure indicator
        document.body.removeChild(failureIndicator);
        
        // Reset and retry
        this.resetGameLoaderFlags();
        this.initializeGame(true);
      });
      
      document.getElementById('game-init-reload').addEventListener('click', () => {
        window.location.reload();
      });
      
    } catch (e) {
      console.error('GameInitializer: Error creating failure UI:', e);
    }
  }
  
  /**
   * Manual emergency recovery
   * @public
   * @return {string} Status message
   */
  emergencyRecovery() {
    console.log('GameInitializer: Manual emergency recovery triggered');
    
    // Try with GameAPI first
    if (this.config.gameAPI) {
      try {
        this.config.gameAPI.loadGame(this.config.defaultGame, { 
          forceReload: true,
          preserveState: false
        });
        return "Emergency recovery initiated with GameAPI";
      } catch (error) {
        console.error('GameInitializer: GameAPI emergency recovery failed:', error);
      }
    }
    
    // Fall back to legacy method
    // Clean all state
    this.resetGameLoaderFlags();
    
    // Reset GameLoader state
    if (window.gameLoader) {
      if (window.gameLoader.activeGame) {
        window.gameLoader.activeGame = null;
      }
      
      // Clear game instances
      if (window.gameLoader.gameInstances) {
        for (const gameType in window.gameLoader.gameInstances) {
          delete window.gameLoader.gameInstances[gameType];
        }
      }
    }
    
    // Try framework starter first
    if (window.frameworkStarter && typeof window.frameworkStarter.start === 'function') {
      window.frameworkStarter.start();
    }
    
    // Then try direct game loader
    setTimeout(() => {
      if (!this.isGameInitialized() && window.gameLoader) {
        window.gameLoader.forceCreateNewGame(this.config.defaultGame);
      }
    }, 500);
    
    return "Emergency recovery initiated";
  }
  
  /**
   * Force reload the page
   * @public
   */
  forceReload() {
    window.location.reload();
  }
}

// Export as ES module
export default GameInitializer;