/**
 * GameLoader - Core class for loading and managing game instances
 * Handles the loading, switching, and lifecycle of game instances within the framework
 */

class GameLoader {
  /**
   * Create a new GameLoader
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    console.log('GameLoader: Initializing');
    
    // Storage for game instances and current active game
    this.gameInstances = {};
    this.activeGame = null;
    
    // Initialize registry (will be populated from manifests)
    this.gameRegistry = {};
    
    // Create GameRegistry instance to use new manifest system
    this.createGameRegistry();
    
    // Initialize selector when DOM is ready
    this.initSelector();

    // Wait for DOM before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initEvents());
    } else {
      this.initEvents();
    }
  }
  
  /**
   * Create and initialize the GameRegistry instance
   */
  async createGameRegistry() {
    try {
      // Dynamically import the GameRegistry module
      const GameRegistryModule = await import('/api/core/GameRegistry.js');
      const GameRegistry = GameRegistryModule.default;
      
      // Create registry instance
      this.registry = new GameRegistry();
      
      // Initialize registry
      await this.registry.initialize();
      
      // Load manifest files
      const manifestPaths = [
        '/games/manifests/dice-game.json',
        '/games/manifests/card-game.json'
      ];
      
      // Register games from manifests
      await this.registry.registerGamesFromManifests(manifestPaths);
      
      // Update gameRegistry with manifest data
      this.updateGameRegistryFromManifests();
      
      // Initialize GameStateManager
      await this.initGameStateManager();
      
      // Initialize BettingService
      await this.initBettingService();
      
      console.log('GameLoader: GameRegistry initialized with manifests');
    } catch (error) {
      console.error('GameLoader: Error initializing GameRegistry:', error);
      
      // Fall back to hardcoded registry if needed
      this.gameRegistry = {
        'dice': {
          name: 'Dice Game',
          class: 'DiceGame'
        },
        'card': {
          name: 'Card Game',
          class: 'CardGame'
        }
      };
      console.warn('GameLoader: Using fallback hardcoded game registry');
      
      // Try to initialize GameStateManager anyway
      try {
        await this.initGameStateManager();
      } catch (stateError) {
        console.error('GameLoader: Error initializing GameStateManager:', stateError);
      }
      
      // Try to initialize BettingService anyway
      try {
        await this.initBettingService();
      } catch (bettingError) {
        console.error('GameLoader: Error initializing BettingService:', bettingError);
      }
    }
  }
  
  /**
   * Initialize the GameStateManager
   */
  async initGameStateManager() {
    try {
      // Dynamically import the GameStateManager module
      const GameStateManagerModule = await import('/api/services/GameStateManager.js');
      const GameStateManager = GameStateManagerModule.default;
      
      // Create GameStateManager instance
      this.stateManager = new GameStateManager({
        autoSave: true,
        autoSaveInterval: 10000, // 10 seconds
        maxHistoryLength: 20
      });
      
      // Initialize state manager
      await this.stateManager.initialize();
      
      // Setup UI update event listeners
      this.setupStateEventListeners();
      
      console.log('GameLoader: GameStateManager initialized');
    } catch (error) {
      console.error('GameLoader: Error initializing GameStateManager:', error);
      throw error;
    }
  }
  
  /**
   * Setup event listeners for state changes
   */
  setupStateEventListeners() {
    if (!this.stateManager) return;
    
    // Add event listeners for state changes
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (this.activeGame) {
          const gameType = this.getGameTypeFromInstance(this.activeGame);
          if (gameType && this.stateManager.canUndo(gameType)) {
            e.preventDefault();
            const prevState = this.stateManager.undo(gameType);
            console.log('GameLoader: Undid action', prevState);
            this.restoreGameStateToInstance(gameType, prevState);
          }
        }
      }
      
      // Ctrl+Shift+Z or Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        if (this.activeGame) {
          const gameType = this.getGameTypeFromInstance(this.activeGame);
          if (gameType && this.stateManager.canRedo(gameType)) {
            e.preventDefault();
            const nextState = this.stateManager.redo(gameType);
            console.log('GameLoader: Redid action', nextState);
            this.restoreGameStateToInstance(gameType, nextState);
          }
        }
      }
    });
  }
  
  /**
   * Initialize the BettingService
   */
  async initBettingService() {
    try {
      // Dynamically import the BettingService module
      const BettingServiceModule = await import('/api/services/BettingService.js');
      const BettingService = BettingServiceModule.default;
      
      // Create BettingService instance with default options
      this.bettingService = new BettingService({
        initialBalance: 1000,
        minBet: 1,
        maxBet: 500,
        defaultBet: 10,
        currency: '$',
        persistBalance: true,
        maxHistoryEntries: 50
      });
      
      // Setup UI update event listeners
      this.setupBettingEventListeners();
      
      // Configure betting service for each game in registry
      if (this.registry) {
        const games = this.registry.getGames();
        
        for (const game of games) {
          if (game.id && game.config) {
            const bettingConfig = {
              minBet: game.config.minBet,
              maxBet: game.config.maxBet,
              defaultBet: game.config.defaultBet
            };
            
            this.bettingService.setGameLimits(game.id, bettingConfig);
            
            // Configure from full manifest
            this.bettingService.configureFromManifest(game.id, game);
            
            console.log(`GameLoader: Configured betting limits for ${game.id}`);
          }
        }
      }
      
      // Subscribe to betting events for logging
      this.bettingService.subscribe('win', (winInfo) => {
        console.log(`GameLoader: Win registered in ${winInfo.gameId}:`, winInfo.amount);
      });
      
      this.bettingService.subscribe('loss', (lossInfo) => {
        console.log(`GameLoader: Loss registered in ${lossInfo.gameId}:`, lossInfo.amount);
      });
      
      console.log('GameLoader: BettingService initialized with balance', this.bettingService.getFormattedBalance());
    } catch (error) {
      console.error('GameLoader: Error initializing BettingService:', error);
      throw error;
    }
  }
  
  /**
   * Setup event listeners for betting UI updates
   */
  setupBettingEventListeners() {
    if (!this.bettingService) return;
    
    // Subscribe to balance changes
    this.bettingService.subscribe('balanceChange', (data) => {
      // Update balance display
      const balanceElement = document.getElementById('balance');
      if (balanceElement) {
        balanceElement.textContent = this.bettingService.getFormattedBalance();
      }
      
      // Update game state if needed
      if (this.activeGame) {
        const gameType = this.getGameTypeFromInstance(this.activeGame);
        if (gameType) {
          // If game implements IGame interface, update its state
          if (typeof this.activeGame.updateBalance === 'function') {
            this.activeGame.updateBalance(data.newBalance);
          }
          
          // Update game framework UI if available
          const framework = this.activeGame.framework || this.activeGame.game;
          if (framework && typeof framework.updateBalance === 'function') {
            framework.updateBalance();
          }
        }
      }
    });
    
    // Subscribe to bet changes
    this.bettingService.subscribe('betChange', (data) => {
      // Update bet display
      const betElement = document.getElementById('current-bet');
      if (betElement) {
        betElement.textContent = this.bettingService.getFormattedBet();
      }
      
      // Update potential win display
      const potentialWinElement = document.getElementById('potential-win');
      if (potentialWinElement && this.activeGame) {
        const gameType = this.getGameTypeFromInstance(this.activeGame);
        if (gameType) {
          const potentialWin = this.bettingService.calculatePotentialWin(null, null, gameType);
          potentialWinElement.textContent = this.bettingService.formatAmount(potentialWin);
        }
      }
      
      // Update game state if needed
      if (this.activeGame) {
        // If game implements IGame interface, update its bet
        if (typeof this.activeGame.updateBet === 'function') {
          this.activeGame.updateBet(data.newBet);
        }
        
        // Update game framework UI if available
        const framework = this.activeGame.framework || this.activeGame.game;
        if (framework) {
          if (typeof framework.updateBet === 'function') {
            framework.updateBet(data.newBet);
          } else if (framework.state) {
            framework.state.bet = data.newBet;
          }
          
          // Update potential win
          if (typeof framework.updatePotentialWin === 'function') {
            framework.updatePotentialWin();
          }
        }
      }
    });
    
    // Subscribe to risk level changes
    this.bettingService.subscribe('riskLevelChange', (data) => {
      // Update risk level display
      const riskLevelElement = document.getElementById('risk-level');
      if (riskLevelElement) {
        riskLevelElement.textContent = data.newLevel.charAt(0).toUpperCase() + data.newLevel.slice(1);
      }
      
      // Update potential win display
      const potentialWinElement = document.getElementById('potential-win');
      if (potentialWinElement && this.activeGame) {
        const gameType = this.getGameTypeFromInstance(this.activeGame);
        if (gameType) {
          const potentialWin = this.bettingService.calculatePotentialWin(null, null, gameType);
          potentialWinElement.textContent = this.bettingService.formatAmount(potentialWin);
        }
      }
      
      // Update game state if needed
      if (this.activeGame) {
        // If game implements IGame interface, update its risk level
        if (typeof this.activeGame.updateRiskLevel === 'function') {
          this.activeGame.updateRiskLevel(data.newLevel);
        }
        
        // Update game framework UI if available
        const framework = this.activeGame.framework || this.activeGame.game;
        if (framework) {
          if (framework.state) {
            framework.state.riskLevel = data.newLevel;
          }
          
          // Update potential win
          if (typeof framework.updatePotentialWin === 'function') {
            framework.updatePotentialWin();
          }
        }
      }
    });
    
    // Setup UI control event listeners
    this.setupBettingControls();
  }
  
  /**
   * Setup event listeners for betting control buttons
   */
  setupBettingControls() {
    // Bet increase button
    const betIncreaseBtn = document.getElementById('bet-increase');
    if (betIncreaseBtn) {
      betIncreaseBtn.addEventListener('click', () => {
        if (this.bettingService) {
          const gameType = this.activeGame ? this.getGameTypeFromInstance(this.activeGame) : null;
          this.bettingService.increaseBet(1, gameType);
        }
      });
    }
    
    // Bet decrease button
    const betDecreaseBtn = document.getElementById('bet-decrease');
    if (betDecreaseBtn) {
      betDecreaseBtn.addEventListener('click', () => {
        if (this.bettingService) {
          const gameType = this.activeGame ? this.getGameTypeFromInstance(this.activeGame) : null;
          this.bettingService.decreaseBet(1, gameType);
        }
      });
    }
    
    // Max bet button
    const maxBetBtn = document.getElementById('max-bet');
    if (maxBetBtn) {
      maxBetBtn.addEventListener('click', () => {
        if (this.bettingService) {
          const gameType = this.activeGame ? this.getGameTypeFromInstance(this.activeGame) : null;
          this.bettingService.setMaxBet(gameType);
        }
      });
    }
    
    // Min bet button
    const minBetBtn = document.getElementById('min-bet');
    if (minBetBtn) {
      minBetBtn.addEventListener('click', () => {
        if (this.bettingService) {
          const gameType = this.activeGame ? this.getGameTypeFromInstance(this.activeGame) : null;
          this.bettingService.setMinBet(gameType);
        }
      });
    }
    
    // Risk level buttons
    ['low', 'medium', 'high'].forEach(level => {
      const riskBtn = document.getElementById(`risk-${level}`);
      if (riskBtn) {
        riskBtn.addEventListener('click', () => {
          if (this.bettingService) {
            this.bettingService.setRiskLevel(level);
          }
        });
      }
    });
  }
  
  /**
   * Get game type from game instance
   * @param {Object} gameInstance - Game instance
   * @return {string|null} Game type ID or null if not found
   */
  getGameTypeFromInstance(gameInstance) {
    if (!gameInstance) return null;
    
    // Find game type by instance reference
    for (const [gameType, instance] of Object.entries(this.gameInstances)) {
      if (instance === gameInstance) {
        return gameType;
      }
    }
    
    return null;
  }
  
  /**
   * Update the gameRegistry object from loaded manifests
   */
  updateGameRegistryFromManifests() {
    if (!this.registry) return;
    
    // Get all registered games
    const games = this.registry.getGames();
    
    // Clear existing registry
    this.gameRegistry = {};
    
    // Add each game to registry
    for (const manifest of games) {
      this.gameRegistry[manifest.id] = {
        name: manifest.name,
        class: manifest.main || `${manifest.id.charAt(0).toUpperCase() + manifest.id.slice(1)}Game`,
        manifest: manifest
      };
    }
    
    console.log('GameLoader: Game registry updated from manifests:', Object.keys(this.gameRegistry));
  }
  
  /**
   * Initialize the game selector
   */
  initSelector() {
    this.gameSelector = document.getElementById('game-select');
    if (!this.gameSelector) {
      console.error('Game selector element not found');
    } else {
      console.log('Game selector found:', this.gameSelector);
    }
  }
  
  /**
   * Initialize events after DOM is loaded
   * Enhanced with server restart detection and manifest support
   */
  async initEvents() {
    console.log('Initializing GameLoader events');
    
    // Track if this was initialized after potential server restart
    const initTimestamp = new Date().getTime();
    const lastInitTimestamp = parseInt(sessionStorage.getItem('gameLoaderInitTimestamp') || '0', 10);
    const possibleServerRestart = lastInitTimestamp > 0 && (initTimestamp - lastInitTimestamp > 5000);
    
    if (possibleServerRestart) {
      console.log('GameLoader: Possible server restart detected during initialization');
    }
    
    // Store current timestamp for future comparisons
    sessionStorage.setItem('gameLoaderInitTimestamp', initTimestamp.toString());
    
    // Re-get selector in case it wasn't available in constructor
    if (!this.gameSelector) {
      this.gameSelector = document.getElementById('game-select');
    }
    
    // Ensure game registry is populated from manifests if needed
    if (Object.keys(this.gameRegistry).length === 0) {
      try {
        // Wait for registry to be populated
        await new Promise(resolve => {
          const checkRegistry = () => {
            if (this.registry && Object.keys(this.gameRegistry).length > 0) {
              resolve();
            } else {
              setTimeout(checkRegistry, 100);
            }
          };
          checkRegistry();
        });
        
        // Wait a bit more to ensure all registry operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('GameLoader: Registry populated before continuing with initialization');
      } catch (error) {
        console.error('GameLoader: Error waiting for registry:', error);
      }
    }
    
    // Update the selector with games from registry
    this.updateGameSelector();
    
    if (this.gameSelector) {
      // Set up simple event listener for game switching
      this.gameSelector.addEventListener('change', () => {
        const selectedGameType = this.gameSelector.value;
        console.log('Game selection changed to:', selectedGameType);
        
        // Use standard game creation for all games
        this.forceCreateNewGame(selectedGameType);
        
        // Close settings panel after game change
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel && settingsPanel.classList.contains('active')) {
          settingsPanel.classList.remove('active');
        }
      });
      
      // Get default game value
      // First try data-default attribute
      let defaultGameType = 'dice';
      if (this.gameSelector.getAttribute('data-default')) {
        defaultGameType = this.gameSelector.getAttribute('data-default');
      }
      
      // Set initial value if not selected
      if (!this.gameSelector.value) {
        // Select first option from list by default
        if (this.gameSelector.options && this.gameSelector.options.length > 0) {
          this.gameSelector.value = this.gameSelector.options[0].value;
        } else {
          // If no options, use defaultGameType as default value
          this.gameSelector.value = defaultGameType;
        }
        console.log('Set default game to:', this.gameSelector.value);
      }
      
      // Guaranteed loading of default game
      // Using forceCreateNewGame instead of loadGame for reliability
      console.log('Loading default game:', this.gameSelector.value);
      
      // If this is after server restart, attempt immediate initialization
      if (possibleServerRestart) {
        console.log('GameLoader: Immediate game initialization after server restart');
        try {
          // Try to load selected game or fall back to default
          const gameType = this.gameSelector.value || defaultGameType;
          this.forceCreateNewGame(gameType);
        } catch (e) {
          console.error('GameLoader: Error during immediate initialization after restart:', e);
        }
      }
      
      // Use timeout to allow DOM to fully load
      // This runs regardless of whether we tried immediate initialization
      setTimeout(() => {
        // Check that game has not been loaded yet
        if (!this.activeGame) {
          console.log('Forcing default game creation:', this.gameSelector.value);
          this.forceCreateNewGame(this.gameSelector.value);
        }
      }, possibleServerRestart ? 50 : 100);
      
    } else {
      console.error('Game selector not found, cannot load games');
      
      // Emergency recovery - try to load a game even without selector
      console.log('Emergency recovery: trying to load Dice Game without selector');
      
      // Try immediately and also schedule a delayed attempt
      this.forceCreateNewGame('dice');
      
      setTimeout(() => {
        if (!this.activeGame) {
          this.forceCreateNewGame('dice');
        }
      }, 300);
    }
  }
  
  /**
   * Update game selector with options from registry
   */
  updateGameSelector() {
    if (!this.gameSelector) return;
    
    // Store current selection
    const currentSelection = this.gameSelector.value;
    
    // Clear existing options
    while (this.gameSelector.firstChild) {
      this.gameSelector.removeChild(this.gameSelector.firstChild);
    }
    
    // Add options from registry
    for (const [gameId, gameInfo] of Object.entries(this.gameRegistry)) {
      const option = document.createElement('option');
      option.value = gameId;
      option.textContent = gameInfo.name;
      this.gameSelector.appendChild(option);
    }
    
    // Restore selection if possible
    if (currentSelection && this.gameRegistry[currentSelection]) {
      this.gameSelector.value = currentSelection;
    } else if (this.gameSelector.options.length > 0) {
      // Select first option
      this.gameSelector.value = this.gameSelector.options[0].value;
    }
    
    console.log('GameLoader: Updated game selector with', this.gameSelector.options.length, 'games');
  }
  
  /**
   * Create a new game instance
   * Enhanced implementation with manifest support
   */
  forceCreateNewGame(gameType) {
    // Check that game type is specified
    if (!gameType) {
      console.error('Game type not specified for forceCreateNewGame');
      // Set default value
      gameType = 'dice';
      console.log('Using default game type:', gameType);
    }

    // CRITICAL FIX: Prevent recursive calls and infinite loops
    if (this._creatingGame) {
      console.warn('Already creating a game, ignoring additional request');
      return;
    }
    
    this._creatingGame = true;
    console.log(`Creating new game instance: ${gameType}`);
    
    try {
      // First clean up any active game
      if (this.activeGame) {
        // Special cleanup for games with animation frames
        if (this.activeGame.animationId) {
          cancelAnimationFrame(this.activeGame.animationId);
          this.activeGame.animationId = null;
        }
        
        // Use destroy method if available (from IGame interface)
        if (typeof this.activeGame.destroy === 'function') {
          try {
            this.activeGame.destroy();
          } catch (destroyError) {
            console.warn('Error calling destroy on active game:', destroyError);
          }
        }
        
        // Remove all references to the active game
        this.activeGame = null;
      }
      
      // Remove any cached instance with additional cleanup
      if (this.gameInstances[gameType]) {
        // Special cleanup for specific game types
        try {
          const instance = this.gameInstances[gameType];
          
          // Try destroy method first (IGame interface)
          if (instance.destroy && typeof instance.destroy === 'function') {
            instance.destroy();
          } 
          // Fall back to cleanup method
          else if (instance.cleanup && typeof instance.cleanup === 'function') {
            instance.cleanup();
          }
        } catch (cleanupError) {
          console.warn(`Error during cleanup of ${gameType}:`, cleanupError);
        }
        
        // Remove from cache
        delete this.gameInstances[gameType];
      }
      
      // Check if game type exists in registry
      if (!this.gameRegistry[gameType]) {
        console.error('Unknown game type:', gameType);
        return;
      }
      
      // Get the game info from registry
      const gameInfo = this.gameRegistry[gameType];
      const className = gameInfo.class;
      console.log(`Creating new instance of ${className}`);
      
      // Get game class constructor
      const GameClass = window[className];
      
      if (!GameClass) {
        console.error(`Game class ${className} not found!`);
        return;
      }
      
      // Configure betting service for this game if available
      if (this.bettingService && gameInfo.manifest) {
        this.bettingService.configureFromManifest(gameType, gameInfo.manifest);
      }
      
      // Create a new instance of the game
      const gameInstance = new GameClass();
      
      // Get manifest if available
      const manifest = gameInfo.manifest;
      
      // Initialize the framework with additional info from manifest
      const frameworkOptions = {
        gameTitle: gameInfo.name,
        manifest: manifest // Pass manifest to framework for advanced configuration
      };
      
      const framework = new GameFramework(frameworkOptions);
      
      // Check if game already implements the IGame interface
      const implementsIGame = typeof gameInstance.initialize === 'function' && 
                            typeof gameInstance.start === 'function' &&
                            typeof gameInstance.destroy === 'function';
      
      if (implementsIGame) {
        // Game already implements IGame, use it directly
        this.gameInstances[gameType] = gameInstance;
        
        // If the game has a setFramework method, use it to connect to the framework
        if (typeof gameInstance.setFramework === 'function') {
          gameInstance.setFramework(framework);
        } else {
          // Backwards compatibility - set game property
          gameInstance.game = framework;
        }
      } else {
        // Game doesn't implement IGame, use adapter
        try {
          // Dynamically import the GameAdapter
          import('/games/GameAdapter.js')
            .then(module => {
              const GameAdapter = module.default;
              
              // Create adapter and store it
              const gameAdapter = new GameAdapter(gameInstance);
              this.gameInstances[gameType] = gameAdapter;
              
              // Connect framework to adapter
              gameAdapter.setFramework(framework);
              
              console.log(`GameLoader: Created GameAdapter for ${gameType}`);
            })
            .catch(error => {
              console.error('GameLoader: Failed to load GameAdapter, using direct instance:', error);
              
              // Fallback to direct instance without adapter
              this.gameInstances[gameType] = gameInstance;
              
              // Connect framework directly
              if (typeof gameInstance.setFramework === 'function') {
                gameInstance.setFramework(framework);
              } else {
                gameInstance.game = framework;
              }
            });
        } catch (adapterError) {
          console.error('GameLoader: Error creating GameAdapter, using direct instance:', adapterError);
          
          // Fallback to direct instance without adapter
          this.gameInstances[gameType] = gameInstance;
          
          // Connect framework directly
          if (typeof gameInstance.setFramework === 'function') {
            gameInstance.setFramework(framework);
          } else {
            gameInstance.game = framework;
          }
        }
      }
      
      // Check for and load game assets if defined in manifest
      if (manifest && manifest.assets && Array.isArray(manifest.assets) && manifest.assets.length > 0) {
        this.preloadGameAssets(gameType, manifest.assets);
      }
      
      // Call initialize method if available (IGame interface)
      if (typeof this.gameInstances[gameType].initialize === 'function') {
        try {
          this.gameInstances[gameType].initialize();
        } catch (initError) {
          console.warn('Error calling initialize method on game:', initError);
        }
      }
      
      // Set as active game
      this.activeGame = this.gameInstances[gameType];
      
      // Update selector to match
      if (this.gameSelector && this.gameSelector.value !== gameType) {
        this.gameSelector.value = gameType;
      }
      
      // Update title
      const titleElement = document.querySelector('.game-title');
      if (titleElement && this.gameRegistry[gameType]) {
        titleElement.textContent = this.gameRegistry[gameType].name;
      }
      
      console.log(`Successfully created and activated new ${gameType} game`);
      
      // Get the framework reference (could be either .game or .framework)
      const gameFramework = this.activeGame?.framework || this.activeGame?.game;
      
      // Force a redraw of the game canvas
      if (gameFramework) {
        setTimeout(() => {
          try {
            // Try the new redrawCanvas method first
            if (typeof gameFramework.redrawCanvas === 'function') {
              gameFramework.redrawCanvas();
            } 
            // Fall back to the old drawCanvas method
            else if (typeof gameFramework.drawCanvas === 'function') {
              gameFramework.drawCanvas();
            }
            
            // Update game canvas info in settings panel
            if (typeof gameFramework.updateGameCanvasInfo === 'function') {
              gameFramework.updateGameCanvasInfo();
            }
          } catch (drawError) {
            console.error('Error during initial canvas draw:', drawError);
          }
        }, 100);
      }
      
      // Start the game if it implements the IGame interface
      if (typeof this.activeGame.start === 'function') {
        try {
          setTimeout(() => {
            this.activeGame.start();
          }, 200);
        } catch (startError) {
          console.warn('Error calling start method on game:', startError);
        }
      }
      
      // Update UI elements with betting information if available
      if (this.bettingService) {
        try {
          // Update bet display
          const betElement = document.getElementById('current-bet');
          if (betElement) {
            betElement.textContent = this.bettingService.getFormattedBet();
          }
          
          // Update balance display
          const balanceElement = document.getElementById('balance');
          if (balanceElement) {
            balanceElement.textContent = this.bettingService.getFormattedBalance();
          }
          
          // Update potential win display if available
          const potentialWinElement = document.getElementById('potential-win');
          if (potentialWinElement) {
            const potentialWin = this.bettingService.calculatePotentialWin(null, null, gameType);
            potentialWinElement.textContent = this.bettingService.formatAmount(potentialWin);
          }
          
          console.log(`GameLoader: Updated UI with betting information`);
        } catch (betUIError) {
          console.warn('Error updating betting UI:', betUIError);
        }
      }
      
    } catch (error) {
      console.error(`Error creating new game instance:`, error);
      // Attempt recovery if creation failed
      try {
        console.log('Attempting recovery after game creation error');
        // Fallback to first available game
        const firstGameType = Object.keys(this.gameRegistry)[0];
        if (firstGameType && firstGameType !== gameType) {
          // Reset creation flag before recursive call
          this._creatingGame = false;
          this.forceCreateNewGame(firstGameType);
        }
      } catch (recoveryError) {
        console.error('Failed to recover from game creation error:', recoveryError);
      }
    } finally {
      // CRITICAL: Always reset creation flag when done
      setTimeout(() => {
        this._creatingGame = false;
        console.log('Game creation lock released');
      }, 100);
    }
  }
  
  /**
   * Preload game assets defined in manifest
   * @param {string} gameType - The game type
   * @param {Array} assets - Array of asset definitions from manifest
   */
  preloadGameAssets(gameType, assets) {
    if (!assets || !Array.isArray(assets) || assets.length === 0) return;
    
    console.log(`GameLoader: Preloading ${assets.length} assets for ${gameType}`);
    
    const game = this.gameInstances[gameType];
    if (!game) return;
    
    // Get framework reference
    const framework = game.framework || game.game;
    if (!framework) return;
    
    // Check if framework has asset loader
    const assetLoader = framework.assetLoader || 
                      (framework.modules && framework.modules.assetLoader);
    
    if (assetLoader) {
      // Use framework's asset loader if available
      try {
        console.log('GameLoader: Using framework asset loader for preloading');
        
        if (typeof assetLoader.loadAssets === 'function') {
          assetLoader.loadAssets(assets);
        } else if (typeof assetLoader.load === 'function') {
          assetLoader.load(assets);
        }
      } catch (e) {
        console.error('GameLoader: Error using framework asset loader:', e);
      }
    } else {
      // Basic preloading for common asset types
      console.log('GameLoader: Using basic asset preloading');
      
      assets.forEach(asset => {
        try {
          if (!asset.path) return;
          
          const type = asset.type || this.getAssetTypeFromPath(asset.path);
          
          switch (type) {
            case 'image':
              this.preloadImage(asset.path);
              break;
            case 'audio':
              this.preloadAudio(asset.path);
              break;
            case 'json':
            case 'data':
              this.preloadData(asset.path);
              break;
          }
        } catch (assetError) {
          console.warn(`GameLoader: Error preloading asset ${asset.path}:`, assetError);
        }
      });
    }
  }
  
  /**
   * Get asset type from file path extension
   * @param {string} path - The asset path
   * @return {string} The asset type
   */
  getAssetTypeFromPath(path) {
    const extension = path.split('.').pop().toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    } else if (['json'].includes(extension)) {
      return 'json';
    } else {
      return 'data';
    }
  }
  
  /**
   * Preload an image asset
   * @param {string} path - Path to the image
   */
  preloadImage(path) {
    const img = new Image();
    img.src = path;
    console.log(`GameLoader: Preloading image: ${path}`);
  }
  
  /**
   * Preload an audio asset
   * @param {string} path - Path to the audio file
   */
  preloadAudio(path) {
    const audio = new Audio();
    audio.src = path;
    audio.preload = 'auto';
    console.log(`GameLoader: Preloading audio: ${path}`);
  }
  
  /**
   * Preload a data asset (JSON)
   * @param {string} path - Path to the data file
   */
  preloadData(path) {
    fetch(path)
      .then(response => response.json())
      .then(data => console.log(`GameLoader: Preloaded data: ${path}`))
      .catch(error => console.warn(`GameLoader: Error preloading data ${path}:`, error));
  }
  
  /**
   * Save game state using GameStateManager or legacy localStorage
   * @param {string} gameId - The game type ID
   */
  saveGameState(gameId) {
    // If state manager is available, use it
    if (this.stateManager) {
      try {
        const gameInstance = this.gameInstances[gameId];
        if (!gameInstance) return;
        
        // Get framework reference (could be .framework or .game)
        const gameFramework = gameInstance.framework || gameInstance.game;
        
        if (gameFramework) {
          // Check for state directly on framework or in modules.gameState
          const gameState = gameFramework.state || 
                          (gameFramework.modules && gameFramework.modules.gameState && 
                            gameFramework.modules.gameState.state);
          
          if (gameState) {
            // Check if game implements getState method (IGame interface)
            let state = gameState;
            if (typeof gameInstance.getState === 'function') {
              try {
                state = gameInstance.getState();
              } catch (error) {
                console.warn(`GameLoader: Error calling getState on game:`, error);
              }
            }
            
            // Save state to state manager
            this.stateManager.setState(gameId, state);
            console.log(`GameLoader: Saved state for ${gameId} using GameStateManager`);
          }
        }
      } catch (error) {
        console.error(`GameLoader: Error saving game state with GameStateManager:`, error);
        // Fall back to legacy method
        this.saveGameStateLegacy(gameId);
      }
    } else {
      // Use legacy method
      this.saveGameStateLegacy(gameId);
    }
  }
  
  /**
   * Legacy method to save game state to local storage
   * @param {string} gameId - The game type ID
   * @private
   */
  saveGameStateLegacy(gameId) {
    const gameInstance = this.gameInstances[gameId];
    if (!gameInstance) return;
    
    // Get framework reference (could be .framework or .game)
    const gameFramework = gameInstance.framework || gameInstance.game;
    
    if (gameFramework) {
      try {
        // Check for state directly on framework or in modules.gameState
        const gameState = gameFramework.state || 
                        (gameFramework.modules && gameFramework.modules.gameState && 
                          gameFramework.modules.gameState.state);
        
        if (gameState) {
          localStorage.setItem(`game_state_${gameId}`, JSON.stringify(gameState));
          console.log(`GameLoader: Saved state for ${gameId} using legacy storage`);
        }
      } catch (error) {
        console.error(`GameLoader: Error saving game state with legacy method:`, error);
      }
    }
  }
  
  /**
   * Restore game state using GameStateManager or legacy localStorage
   * @param {string} gameId - The game type ID
   */
  restoreGameState(gameId) {
    // If state manager is available, use it
    if (this.stateManager) {
      try {
        const gameState = this.stateManager.getState(gameId);
        if (gameState) {
          this.restoreGameStateToInstance(gameId, gameState);
          console.log(`GameLoader: Restored state for ${gameId} using GameStateManager`);
          return;
        }
      } catch (error) {
        console.error(`GameLoader: Error restoring game state with GameStateManager:`, error);
        // Fall back to legacy method
      }
    }
    
    // Use legacy method if state manager failed or is not available
    this.restoreGameStateLegacy(gameId);
  }
  
  /**
   * Legacy method to restore game state from local storage
   * @param {string} gameId - The game type ID
   * @private
   */
  restoreGameStateLegacy(gameId) {
    try {
      const savedState = localStorage.getItem(`game_state_${gameId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.restoreGameStateToInstance(gameId, parsedState);
        console.log(`GameLoader: Restored state for ${gameId} using legacy storage`);
      }
    } catch (e) {
      console.error('GameLoader: Failed to restore game state from legacy storage:', e);
    }
  }
  
  /**
   * Apply state to a game instance
   * @param {string} gameId - The game type ID
   * @param {Object} state - The state to apply
   * @private
   */
  restoreGameStateToInstance(gameId, state) {
    if (!state) return;
    
    const gameInstance = this.gameInstances[gameId];
    if (!gameInstance) return;
    
    try {
      // Check if game implements setState method (IGame interface)
      if (typeof gameInstance.setState === 'function') {
        gameInstance.setState(state);
        return;
      }
      
      // Get framework reference (could be .framework or .game)
      const gameFramework = gameInstance.framework || gameInstance.game;
      
      if (gameFramework) {
        // Determine which state object to update
        if (gameFramework.state) {
          // Legacy framework - state directly on framework
          Object.assign(gameFramework.state, state);
        } else if (gameFramework.modules && gameFramework.modules.gameState) {
          // Modern framework - state in gameState module
          const stateManager = gameFramework.modules.gameState;
          if (stateManager.state) {
            Object.assign(stateManager.state, state);
          }
          
          // Also try to update state through state manager
          if (typeof stateManager.updateState === 'function') {
            stateManager.updateState(state);
          }
        }

        // Update UI to reflect restored state (try both legacy and modern methods)
        if (typeof gameFramework.updateBalance === 'function') {
          gameFramework.updateBalance();
        } else if (gameFramework.modules && gameFramework.modules.ui && 
                  typeof gameFramework.modules.ui.updateBalance === 'function') {
          gameFramework.modules.ui.updateBalance();
        }
        
        if (typeof gameFramework.updatePotentialWin === 'function') {
          gameFramework.updatePotentialWin();
        } else if (gameFramework.modules && gameFramework.modules.ui &&
                  typeof gameFramework.modules.ui.updatePotentialWin === 'function') {
          gameFramework.modules.ui.updatePotentialWin();
        }
      }
    } catch (error) {
      console.error('GameLoader: Error applying state to game instance:', error);
    }
  }
}

// Export as ES module
export default GameLoader;