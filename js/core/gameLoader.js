class GameLoader {
  constructor() {
    console.log('GameLoader constructor called');
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
      // Dynamically import the GameRegistry module with relative paths
      const GameRegistryModule = await import('../../api/core/GameRegistry.js');
      const GameRegistry = GameRegistryModule.default;
      
      // Create registry instance
      this.registry = new GameRegistry();
      
      // Initialize registry
      await this.registry.initialize();
      
      // Load manifest files with relative paths
      const manifestPaths = [
        '../../games/manifests/dice-game.json',
        '../../games/manifests/card-game.json'
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
      // Dynamically import the GameStateManager module with relative paths
      const GameStateManagerModule = await import('../../api/services/GameStateManager.js');
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
      // Dynamically import the BettingService module with relative paths
      const BettingServiceModule = await import('../../api/services/BettingService.js');
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
      
      // Additional safety check after a longer delay - only on server restart detection
      if (possibleServerRestart) {
        setTimeout(() => {
          if (!this.activeGame) {
            console.warn('GameLoader: Game still not initialized after server restart, forcing emergency initialization');
            
            // Try framework starter first if available
            if (window.frameworkStarter && typeof window.frameworkStarter.start === 'function') {
              window.frameworkStarter.start();
            } 
            // Then force create directly with default
            else {
              this.forceCreateNewGame(defaultGameType);
            }
          }
        }, 800);
      }
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
    
    // Add creation timestamp for debugging
    this._creationStartTime = Date.now();
    this._creatingGame = true;
    this._creatingGameType = gameType; // Track which game we're creating
    console.log(`Creating new game instance: ${gameType} (time: ${this._creationStartTime})`);
    
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
      
      // Get game class constructor - try both window object and direct import
      let GameClass = window[className];
      
      // If class not found in window, try to dynamically import it
      // But with safeguards against infinite recursion
      if (!GameClass) {
        try {
          console.log(`Game class ${className} not found in window object. Attempting dynamic import...`);
          
          // Use async/await with proper error handling to prevent chain of then/catch nesting
          const tryImport = async () => {
            // Track import attempts to prevent infinite loops
            const importAttempts = [];
            let foundClass = null;
            
            try {
              // Attempt 1: Try directly from games directory (without adding .js)
              importAttempts.push(`../../games/${className}`);
              console.log(`Trying import from: ../../games/${className}`);
              const module1 = await import(`../../games/${className}`);
              GameClass = module1.default || module1[className];
              if (GameClass) {
                console.log(`Dynamically imported ${className} from ../../games/`);
                foundClass = GameClass;
              }
            } catch (error1) {
              console.log(`Could not import from ../../games/${className}, trying next path...`);
            }
            
            // If not found yet, try with explicit .js extension
            if (!foundClass) {
              try {
                importAttempts.push(`../../games/${className}.js`);
                console.log(`Trying import from: ../../games/${className}.js`);
                const module2 = await import(`../../games/${className}.js`);
                GameClass = module2.default || module2[className];
                if (GameClass) {
                  console.log(`Dynamically imported ${className} from ../../games/ with .js extension`);
                  foundClass = GameClass;
                }
              } catch (error2) {
                console.log(`Could not import from ../../games/${className}.js, trying next path...`);
              }
            }
            
            // If still not found, try from api/games directory
            if (!foundClass) {
              try {
                importAttempts.push(`../../api/games/${className}`);
                console.log(`Trying import from: ../../api/games/${className}`);
                const module3 = await import(`../../api/games/${className}`);
                GameClass = module3.default || module3[className];
                if (GameClass) {
                  console.log(`Dynamically imported ${className} from ../../api/games/`);
                  foundClass = GameClass;
                }
              } catch (error3) {
                console.log(`Could not import from ../../api/games/${className}, trying fallback...`);
              }
            }
            
            // Last resort: try fallback to game directly (using game type as class name)
            if (!foundClass) {
              const fallbackClassName = gameType.charAt(0).toUpperCase() + gameType.slice(1) + "Game";
              if (fallbackClassName !== className && !importAttempts.includes(`../../games/${fallbackClassName}`)) {
                try {
                  importAttempts.push(`../../games/${fallbackClassName}`);
                  console.log(`Trying fallback class name: ${fallbackClassName}`);
                  const fallbackModule = await import(`../../games/${fallbackClassName}`);
                  GameClass = fallbackModule.default || fallbackModule[fallbackClassName];
                  if (GameClass) {
                    console.log(`Dynamically imported ${fallbackClassName} as fallback`);
                    foundClass = GameClass;
                  }
                } catch (fallbackError) {
                  try {
                    importAttempts.push(`../../games/${fallbackClassName}.js`);
                    console.log(`Trying fallback with .js: ${fallbackClassName}.js`);
                    const fallbackJsModule = await import(`../../games/${fallbackClassName}.js`);
                    GameClass = fallbackJsModule.default || fallbackJsModule[fallbackClassName];
                    if (GameClass) {
                      console.log(`Dynamically imported ${fallbackClassName}.js as fallback`);
                      foundClass = GameClass;
                    } else {
                      console.error(`Fallback class ${fallbackClassName}.js found but not exported correctly`);
                    }
                  } catch (fallbackJsError) {
                    console.error(`Failed to import fallback ${fallbackClassName} with all methods`);
                  }
                }
              }
            }
            
            // If we've tried all options and still don't have a class, log and return null
            if (!foundClass) {
              console.error(`All import attempts failed for ${className} and fallbacks`);
              return null;
            }
            
            return foundClass;
          };
          
          // Execute the import function and continue game creation if successful
          tryImport().then(ImportedClass => {
            if (ImportedClass) {
              // Get or create the framework
              let gameFramework = framework;
              if (!gameFramework) {
                try {
                  gameFramework = new GameFramework({
                    gameTitle: this.gameRegistry[gameType].name || gameType,
                    manifest: this.gameRegistry[gameType].manifest,
                    services: {
                      registry: this.registry,
                      stateManager: this.stateManager,
                      bettingService: this.bettingService
                    }
                  });
                } catch (frameworkError) {
                  console.error(`Error creating GameFramework for ${gameType}:`, frameworkError);
                  // Create minimal framework object
                  gameFramework = {
                    gameTitle: this.gameRegistry[gameType].name || gameType,
                    drawCanvas: () => {},
                    updateBalance: () => {},
                    updateBet: () => {},
                    updatePotentialWin: () => {}
                  };
                }
              }
              
              this.continueGameCreation(gameType, ImportedClass, gameFramework);
            } else {
              console.error(`Failed to import ${className} from any location`);
            }
          }).catch(finalError => {
            console.error(`Fatal error importing game class:`, finalError);
          });
          
          // Return early - we'll continue async in the import callback
          return;
        } catch (importError) {
          console.error(`Error trying to dynamically import ${className}:`, importError);
        }
      }
      
      // Configure betting service for this game if available
      if (this.bettingService && gameInfo.manifest) {
        this.bettingService.configureFromManifest(gameType, gameInfo.manifest);
      }
      
      // Get manifest if available
      const manifest = gameInfo.manifest;
      
      // Initialize the framework with additional info from manifest
      const frameworkOptions = {
        gameTitle: gameInfo.name,
        manifest: manifest, // Pass manifest to framework for advanced configuration
        services: {
          registry: this.registry, // Pass registry reference
          stateManager: this.stateManager, // Pass state manager reference
          bettingService: this.bettingService // Pass betting service reference
        }
      };
      
      // Create the framework with enhanced error handling
      let framework;
      try {
        framework = new GameFramework(frameworkOptions);
        console.log(`GameLoader: Created new GameFramework for ${gameType}`);
      } catch (frameworkError) {
        console.error(`GameLoader: Error creating GameFramework for ${gameType}:`, frameworkError);
        // Create a minimal framework object to prevent crashes
        framework = {
          gameTitle: gameInfo.name,
          drawCanvas: () => {},
          updateBalance: () => {},
          updateBet: () => {},
          updatePotentialWin: () => {},
          services: {
            registry: this.registry,
            stateManager: this.stateManager,
            bettingService: this.bettingService
          }
        };
        console.warn(`GameLoader: Created minimal fallback framework for ${gameType}`);
      }
      
      // If GameClass was found, continue with game creation
      if (GameClass) {
        // Create a new instance and continue
        const gameInstance = new GameClass();
        
        // All games should now directly implement the IGame interface
        const requiredMethods = [
          'initialize', 'start', 'pause', 'resume', 'destroy', 
          'performAction', 'resize', 'updateSettings', 
          'calculatePotentialWin', 'getState', 'setState',
          'getInfo', 'supportsFeature', 'getAvailableEvents',
          'addEventListener', 'removeEventListener'
        ];
        
        const missingMethods = requiredMethods.filter(
          method => typeof gameInstance[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
          console.error(`GameLoader: Game ${gameType} does not fully implement IGame interface. Missing methods: ${missingMethods.join(', ')}`);
          
          // Check for essential methods that must be present
          const essentialMethods = ['initialize', 'start', 'destroy'];
          const missingEssential = essentialMethods.filter(
            method => typeof gameInstance[method] !== 'function'
          );
          
          if (missingEssential.length > 0) {
            console.error(`GameLoader: Game ${gameType} is missing essential methods: ${missingEssential.join(', ')}. Game may not function properly.`);
          }
        }
        
        // Store game instance directly - no adapter needed
        this.gameInstances[gameType] = gameInstance;
        
        // Connect framework to the game
        if (typeof gameInstance.setFramework === 'function') {
          gameInstance.setFramework(framework);
        } else {
          // Backwards compatibility - set game property
          gameInstance.game = framework;
        }
        
        console.log(`GameLoader: Game ${gameType} loaded and connected to framework`);
        
        // Check for and load game assets if defined in manifest
        if (manifest && manifest.assets && Array.isArray(manifest.assets) && manifest.assets.length > 0) {
          this.preloadGameAssets(gameType, manifest.assets);
        }
        
        // Continue with game initialization
        this.initializeAndStartGame(gameType, manifest);
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
      // Attempt recovery if creation failed - but avoid recursive calls
      try {
        console.log('Attempting recovery after game creation error');
        // Fallback to first available game, but DON'T recursively call forceCreateNewGame
        const firstGameType = Object.keys(this.gameRegistry)[0];
        if (firstGameType && firstGameType !== gameType) {
          console.log(`Recovery would use ${firstGameType}, but avoiding recursive call`);
          // Instead of recursive call, schedule it for later via initEvents after clearing the flag
          setTimeout(() => {
            // Only proceed if no active game was created in the meantime
            if (!this.activeGame) {
              console.log(`Delayed recovery with ${firstGameType} after creation error`);
              // Reset lock and try once more
              this._creatingGame = false;
              this.forceCreateNewGame(firstGameType);
            }
          }, 500);
        }
      } catch (recoveryError) {
        console.error('Failed to recover from game creation error:', recoveryError);
      }
    } finally {
      // CRITICAL: Always reset creation flag after an appropriate timeout
      // Calculate elapsed time since creation started
      const elapsedTime = this._creationStartTime ? Date.now() - this._creationStartTime : 0;
      const resetTime = Math.max(500 - elapsedTime, 200); // At least 200ms, but try to make total time 500ms
      
      setTimeout(() => {
        const totalTime = this._creationStartTime ? Date.now() - this._creationStartTime : 0;
        this._creatingGame = false;
        this._creatingGameType = null;
        this._creationStartTime = null;
        console.log(`Game creation lock released after ${totalTime}ms`);
      }, resetTime);
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
   * New method to explicitly force a game switch
   * @param {string} gameType - The game type ID to switch to
   * @param {boolean} [preserveState=true] - Whether to preserve the state of the current game
   * @param {boolean} [reloadInstance=false] - Whether to force reload the game instance
   */
  switchToGame(gameType, preserveState = true, reloadInstance = false) {
    console.log(`Explicit game switch to: ${gameType} (preserveState: ${preserveState}, reloadInstance: ${reloadInstance})`);
    
    // If no game type provided, do nothing
    if (!gameType) {
      console.error('GameLoader: Cannot switch to game without gameType');
      return;
    }
    
    // Get the current game type before cleanup
    let currentGameType = null;
    if (this.activeGame) {
      // Find the current game type
      for (const [id, instance] of Object.entries(this.gameInstances)) {
        if (instance === this.activeGame) {
          currentGameType = id;
          break;
        }
      }
    }
    
    // Save state of current game if needed
    if (preserveState && currentGameType) {
      console.log(`GameLoader: Saving state for current game ${currentGameType} before switch`);
      this.saveGameState(currentGameType);
    }
    
    // Clean up any existing game
    this.cleanupCurrentGame();
    
    // Check if we need to force reload the instance
    if (reloadInstance && this.gameInstances[gameType]) {
      console.log(`GameLoader: Force reloading game ${gameType} instance`);
      
      // Completely remove existing instance to force a clean state
      delete this.gameInstances[gameType];
    }
    
    // Load the game as new or activate existing
    if (this.gameInstances[gameType]) {
      // Game already exists, just activate it
      console.log(`GameLoader: Game ${gameType} already loaded, activating it`);
      this.activateGame(gameType);
    } else {
      // Load new game instance
      console.log(`GameLoader: Loading new instance of game ${gameType}`);
      this.loadGame(gameType);
    }
    
    // Return the current state of the switch
    return {
      fromGame: currentGameType,
      toGame: gameType,
      preservedState: preserveState,
      reloadedInstance: reloadInstance,
      success: true
    };
  }
  
  /**
   * Clean up the current game if needed
   */
  cleanupCurrentGame() {
    if (this.activeGame) {
      try {
        console.log('Cleaning up current game');
        
        // Try to save state if needed
        const currentGameType = Object.keys(this.gameInstances).find(
          key => this.gameInstances[key] === this.activeGame
        );
        
        if (currentGameType) {
          this.saveGameState(currentGameType);
        }
        
        // First try to call proper destroy method (follows IGame interface)
        if (typeof this.activeGame.destroy === 'function') {
          try {
            this.activeGame.destroy();
          } catch (destroyError) {
            console.warn('Error calling destroy on active game:', destroyError);
          }
        }
        
        // Help with garbage collection
        if (this.activeGame.game) {
          // Clean up any animation frame requests
          if (this.activeGame.animationId) {
            cancelAnimationFrame(this.activeGame.animationId);
          }
          
          // Also try to cleanup framework resources
          if (typeof this.activeGame.game.cleanup === 'function') {
            try {
              this.activeGame.game.cleanup();
            } catch (cleanupError) {
              console.warn('Error calling cleanup on game framework:', cleanupError);
            }
          }
        }
        
        // Try additional cleanup for animation frames
        if (this.activeGame.animationFrameId) {
          cancelAnimationFrame(this.activeGame.animationFrameId);
        }
        
        this.activeGame = null;
      } catch (e) {
        console.error('Error during game cleanup:', e);
        // Set activeGame to null even if cleanup fails
        this.activeGame = null;
      }
    }
  }
  
  // New method to force activation of an existing game
  forceActivateGame(gameType) {
    console.log(`Force activating game: ${gameType}`);
    
    // Clear any existing timeouts to prevent conflicts
    if (this._activationTimeout) {
      clearTimeout(this._activationTimeout);
    }
    
    if (this._loadingTimeout) {
      clearTimeout(this._loadingTimeout);
    }
    
    // Reset any loading flags
    this._loadingInProgress = null;
    
    // Check if instance exists
    if (!this.gameInstances[gameType]) {
      console.error(`Cannot force activate - game ${gameType} not loaded yet`);
      this.loadGame(gameType);
      return;
    }
    
    // If it's already active, just refresh it
    if (this.activeGame === this.gameInstances[gameType]) {
      console.log(`${gameType} is already active, refreshing UI`);
      try {
        // Update the selector if needed
        if (this.gameSelector.value !== gameType) {
          this.gameSelector.value = gameType;
        }
        
        // Try to redraw the game if possible
        if (this.activeGame.game && this.activeGame.game.drawCanvas) {
          this.activeGame.game.drawCanvas();
        }
      } catch (e) {
        console.error(`Error refreshing active game:`, e);
      }
      return;
    }
    
    // Activate with animation
    this.activateGameWithEffects(gameType);
  }

  /**
   * Standard game loading method
   */
  loadGame(gameType) {
    // CRITICAL FIX: Prevent recursive calls and infinite loops
    if (this._loadingGame) {
      console.warn('Already loading a game, ignoring additional request');
      // Add a debug flag specifically for test detection
      this._loadingGameTest = true;
      return;
    }
    
    // Prevent potential conflicts between loading and creating games
    if (this._creatingGame) {
      console.warn('Currently creating a game, deferring load request');
      // Schedule a delayed retry to allow creation to complete
      setTimeout(() => {
        if (!this._creatingGame && !this._loadingGame) {
          console.log(`Retrying delayed load of ${gameType} after creation completed`);
          this.loadGame(gameType);
        } else {
          console.warn(`Still busy with game operations, cannot load ${gameType}`);
        }
      }, 600);
      return;
    }
    
    // Add loading timestamp for debugging
    this._loadingStartTime = Date.now();
    this._loadingGame = true;
    this._loadingGameTest = false;
    this._loadingGameType = gameType; // Track which game we're loading
    console.log(`Loading game: ${gameType} (time: ${this._loadingStartTime})`);
    
    // Always update the selector to match, but use a flag to prevent event triggering
    if (this.gameSelector && this.gameSelector.value !== gameType) {
      // Temporarily remove event listener
      const originalOnChange = this.gameSelector.onchange;
      this.gameSelector.onchange = null;
      
      // Update value
      this.gameSelector.value = gameType;
      
      // Restore event listener
      setTimeout(() => {
        this.gameSelector.onchange = originalOnChange;
      }, 50);
    }
    
    // If already loaded, just activate it
    if (this.gameInstances[gameType] && this.gameInstances[gameType].game) {
      console.log(`Game ${gameType} already loaded, activating it`);
      this.activateGame(gameType);
      return;
    }

    // Check if game type exists in registry
    if (!this.gameRegistry[gameType]) {
      console.error('Unknown game type:', gameType);
      return;
    }

    // Set loading flag
    this._loadingInProgress = gameType;
    
    try {
      const className = this.gameRegistry[gameType].class;
      console.log(`Looking for game class: ${className}`);
      
      // Get game class constructor
      const GameClass = window[className];
      
      if (!GameClass) {
        console.error(`Game class ${className} not found!`);
        this._loadingInProgress = null;
        return;
      }
      
      console.log(`Creating new instance of ${className}`);
      
      // Create a try/catch block for game initialization
      try {
        // Create a new game instance
        this.gameInstances[gameType] = new GameClass();
        
        // Initialize the framework
        const framework = new GameFramework({
          gameTitle: this.gameRegistry[gameType].name
        });
        
        // If the game has a setFramework method, use it to connect to the framework
        if (typeof this.gameInstances[gameType].setFramework === 'function') {
          this.gameInstances[gameType].setFramework(framework);
        } else {
          // Backwards compatibility - set game property
          this.gameInstances[gameType].game = framework;
        }
        
        // Wait for a moment to allow game to fully initialize
        setTimeout(() => {
          // Update selector to match the game being loaded
          if (this.gameSelector && this.gameSelector.value !== gameType) {
            console.log(`Updating game selector to ${gameType}`);
            this.gameSelector.value = gameType;
          }
          
          // Check if game framework is ready (could be either .game or .framework)
          if (this.gameInstances[gameType].game || this.gameInstances[gameType].framework) {
            console.log(`${gameType} game framework initialized successfully`);
            this.activateGame(gameType);
          } else {
            console.warn(`${gameType} game framework not initialized yet, waiting...`);
            // Wait a bit more and check again
            setTimeout(() => {
              if (this.gameInstances[gameType].game || this.gameInstances[gameType].framework) {
                this.activateGame(gameType);
              } else {
                console.error(`Failed to initialize ${gameType} game framework`);
              }
              this._loadingInProgress = null;
            }, 500);
          }
        }, 100);
        
        console.log(`Loaded ${gameType} game successfully`);
      } catch (innerError) {
        console.error(`Failed to create ${gameType} game instance:`, innerError);
        this._loadingInProgress = null;
      }
    } catch (error) {
      console.error(`Failed to load game ${gameType}:`, error);
      console.error('Error details:', error.message);
      this._loadingInProgress = null;
    } finally {
      // Calculate elapsed time since loading started
      const elapsedTime = this._loadingStartTime ? Date.now() - this._loadingStartTime : 0;
      const resetTime = Math.max(500 - elapsedTime, 200); // At least 200ms, but try to make total time 500ms
      
      // Reset loading flag after a reasonable delay
      setTimeout(() => {
        const totalTime = this._loadingStartTime ? Date.now() - this._loadingStartTime : 0;
        this._loadingGame = false;
        this._loadingGameType = null;
        this._loadingStartTime = null;
        console.log(`Game loading lock released after ${totalTime}ms`);
      }, resetTime);
    }
  }

  /**
   * Simple direct activation without complex animations or state tracking
   */
  activateGameWithEffects(gameType) {
    console.log(`Activating game: ${gameType}`);
    
    // Before we start, make sure the game instance is properly initialized
    if (!this.gameInstances[gameType] || 
        (!this.gameInstances[gameType].game && !this.gameInstances[gameType].framework)) {
      console.error(`Cannot activate - game ${gameType} is not fully initialized`);
      return;
    }
    
    try {
      // Save state of current game if any
      if (this.activeGame) {
        const currentGameType = Object.keys(this.gameInstances).find(
          key => this.gameInstances[key] === this.activeGame
        );
        if (currentGameType) {
          this.saveGameState(currentGameType);
        }
      }
      
      // Get the container for basic animation
      const container = document.querySelector('#game-container');
      if (container) {
        container.style.opacity = '0.5';
        setTimeout(() => {
          container.style.opacity = '1';
        }, 300);
      }
      
      // Update active game
      this.activeGame = this.gameInstances[gameType];
      
      // Update selector if needed
      if (this.gameSelector && this.gameSelector.value !== gameType) {
        this.gameSelector.value = gameType;
      }
      
      // Update title
      const titleElement = document.querySelector('.game-title');
      if (titleElement && this.gameRegistry[gameType]) {
        titleElement.textContent = this.gameRegistry[gameType].name;
      }
      
      // Restore state
      this.restoreGameState(gameType);
      
      // Get the framework reference (could be either .game or .framework)
      const gameFramework = this.activeGame?.framework || this.activeGame?.game;
      
      // Redraw the game canvas
      if (gameFramework) {
        // Try the new redrawCanvas method first
        if (typeof gameFramework.redrawCanvas === 'function') {
          gameFramework.redrawCanvas();
        } 
        // Fall back to the old drawCanvas method
        else if (typeof gameFramework.drawCanvas === 'function') {
          gameFramework.drawCanvas();
        }
        
        // Update game canvas info in settings panel if available
        if (typeof gameFramework.updateGameCanvasInfo === 'function') {
          gameFramework.updateGameCanvasInfo();
        }
      }
      
      console.log(`Successfully activated ${gameType}`);
    } catch (error) {
      console.error(`Error during game activation:`, error);
    }
  }
  
  /**
   * Standard activation method used by loadGame
   */
  activateGame(gameType) {
    console.log(`Attempting to activate game: ${gameType}`);
    
    // Make sure the game instance exists
    if (!this.gameInstances[gameType]) {
      console.error(`Cannot activate ${gameType} - game instance not found`);
      return;
    }
    
    // Make sure the game instance has a framework or game property
    if (!this.gameInstances[gameType].framework && !this.gameInstances[gameType].game) {
      console.error(`Cannot activate ${gameType} - game framework not initialized`);
      // We'll give it a bit more time to initialize
      setTimeout(() => {
        if (this.gameInstances[gameType] && 
            (this.gameInstances[gameType].framework || this.gameInstances[gameType].game)) {
          console.log(`Game ${gameType} initialized after delay, activating now`);
          this.activateGameWithEffects(gameType);
        } else {
          console.error(`Game ${gameType} failed to initialize properly`);
        }
      }, 500);
      return;
    }
    
    // Don't do anything if it's already the active game
    if (this.activeGame === this.gameInstances[gameType]) {
      console.log(`${gameType} is already the active game`);
      return;
    }

    // Use the effects method to handle the actual activation
    this.activateGameWithEffects(gameType);
  }

  /**
   * Continue game creation after dynamic import
   * @param {string} gameType - The game type
   * @param {Function} GameClass - The game constructor
   * @param {Object} framework - The framework instance
   * @private
   */
  continueGameCreation(gameType, GameClass, framework) {
    try {
      // Create a new instance of the game
      const gameInstance = new GameClass();
      
      // Get manifest if available
      const manifest = this.gameRegistry[gameType]?.manifest;
      
      // All games should now directly implement the IGame interface
      const implementsIGame = typeof gameInstance.initialize === 'function' && 
                          typeof gameInstance.start === 'function' &&
                          typeof gameInstance.destroy === 'function';
      
      if (!implementsIGame) {
        console.error(`GameLoader: Game ${gameType} does not fully implement IGame interface. This may cause issues.`);
      }
      
      // Store game instance directly
      this.gameInstances[gameType] = gameInstance;
      
      // Connect framework to the game
      if (typeof gameInstance.setFramework === 'function') {
        gameInstance.setFramework(framework);
      } else {
        // Backwards compatibility - set game property
        gameInstance.game = framework;
      }
      
      console.log(`GameLoader: Game ${gameType} loaded and connected to framework`);
      
      // Continue with game initialization
      this.initializeAndStartGame(gameType, manifest);
    } catch (error) {
      console.error(`Error in continueGameCreation for ${gameType}:`, error);
      
      // Try falling back to another game if this was meant to be active
      if (!this.activeGame) {
        const fallbackType = this.findFallbackGame(gameType);
        if (fallbackType) {
          console.log(`Falling back to ${fallbackType} after dynamic import failure`);
          // Important: Reset creation flag before recursive call
          this._creatingGame = false;
          setTimeout(() => this.forceCreateNewGame(fallbackType), 100);
        }
      }
    }
  }
  
  /**
   * Initialize and start a game instance
   * @param {string} gameType - The game type
   * @param {Object} manifest - The game manifest
   * @private
   */
  initializeAndStartGame(gameType, manifest) {
    // Initialize and start the game properly (IGame interface)
    // Using async/await pattern with proper error handling
    (async () => {
      try {
        // Initialize game with container and additional config
        const container = document.getElementById('game-container');
        if (!container) {
          throw new Error('Game container element not found');
        }
        
        // Prepare configuration for game initialization
        const initConfig = {
          container: container,
          // Pass settings from registry if available
          bet: this.bettingService ? this.bettingService.getCurrentBet(gameType) : 10,
          riskLevel: this.bettingService ? this.bettingService.getCurrentRiskLevel() : 'medium',
          theme: document.body.dataset.theme || 'default',
          layout: window.innerWidth < 768 ? 'mobile' : 'pc',
          // Add services references for direct access from the game
          services: {
            registry: this.registry,
            stateManager: this.stateManager,
            bettingService: this.bettingService
          }
        };
        
        // Add manifest configuration if available
        if (manifest) {
          initConfig.manifest = manifest;
          if (manifest.config) {
            Object.assign(initConfig, manifest.config);
          }
        }
        
        console.log(`Initializing ${gameType} with config:`, initConfig);
        
        // Call initialize method with proper config (required by IGame)
        if (typeof this.gameInstances[gameType].initialize === 'function') {
          try {
            const initPromise = this.gameInstances[gameType].initialize(initConfig);
            
            // Check if initialize returns a valid Promise
            if (initPromise && typeof initPromise.then === 'function') {
              await initPromise;
            } else {
              console.warn(`${gameType} initialize() method did not return a Promise. This may cause timing issues.`);
            }
            
            console.log(`${gameType} initialized successfully`);
          } catch (initError) {
            console.error(`Error in ${gameType} initialize() method:`, initError);
            throw initError;
          }
        } else {
          throw new Error(`Game does not implement required initialize() method`);
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
        
        // Properly start the game with await and error handling
        if (typeof this.activeGame.start === 'function') {
          try {
            const startPromise = this.activeGame.start();
            
            // Check if start returns a valid Promise
            if (startPromise && typeof startPromise.then === 'function') {
              await startPromise;
            } else {
              console.warn(`${gameType} start() method did not return a Promise. This may cause timing issues.`);
            }
            
            console.log(`${gameType} started successfully`);
          } catch (startError) {
            console.error(`Error in ${gameType} start() method:`, startError);
            // Continue even if start fails, as the game may still be partially functional
            console.warn(`Continuing despite error in ${gameType} start() method`);
          }
        } else {
          throw new Error(`Game does not implement required start() method`);
        }
        
        // Update UI elements with betting information if available
        this.updateBettingUI(gameType);
        
        // Emit game loaded event for external subscribers
        if (typeof this.emit === 'function') {
          this.emit('gameLoaded', { gameType, gameInstance: this.activeGame });
        }
      } catch (error) {
        console.error(`Error during game initialization/start:`, error);
        this.handleGameInitializationFailure(gameType);
      }
    })();
  }
  
  /**
   * Update betting UI elements
   * @param {string} gameType - The game type
   * @private
   */
  updateBettingUI(gameType) {
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
  }
  
  /**
   * Handle game initialization failure
   * @param {string} gameType - The game type that failed
   * @private
   */
  handleGameInitializationFailure(gameType) {
    // Clean up resources for failed initialization
    try {
      if (this.gameInstances[gameType] && typeof this.gameInstances[gameType].destroy === 'function') {
        this.gameInstances[gameType].destroy();
      }
    } catch (cleanupError) {
      console.warn('Error during failed game cleanup:', cleanupError);
    }
    
    // Remove from instances
    delete this.gameInstances[gameType];
    
    // Try falling back to another game if this was meant to be active
    if (!this.activeGame) {
      const fallbackType = this.findFallbackGame(gameType);
      if (fallbackType) {
        console.log(`Falling back to ${fallbackType} after initialization failure`);
        // Important: Reset creation flag before recursive call
        this._creatingGame = false;
        setTimeout(() => this.forceCreateNewGame(fallbackType), 100);
      }
    }
  }

  /**
   * Find a fallback game after initialization failure
   * @param {string} failedType - The game type that failed to initialize
   * @param {Set} [triedTypes=new Set()] - Set of game types that have already been tried
   * @returns {string|null} - A fallback game type or null if none available
   */
  findFallbackGame(failedType, triedTypes = new Set()) {
    // Add the failed type to the set of tried types
    triedTypes.add(failedType);
    
    // Get all available game types
    const gameTypes = Object.keys(this.gameRegistry);
    
    // Filter out all games that have already been tried
    const availableTypes = gameTypes.filter(type => !triedTypes.has(type));
    
    if (availableTypes.length === 0) {
      console.error('GameLoader: No more fallback games available after trying all options');
      return null;
    }
    
    console.log(`GameLoader: Finding fallback for ${failedType}, available options:`, availableTypes);
    
    // Try to find dice game as it's the most reliable
    if (availableTypes.includes('dice')) {
      return 'dice';
    }
    
    // Then try card game as the second most reliable
    if (availableTypes.includes('card')) {
      return 'card';
    }
    
    // Otherwise return the first available game
    return availableTypes[0];
  }
  
  // This method is no longer used since scripts are preloaded in index.html
  loadScript(src) {
    console.warn('loadScript is deprecated - scripts should be preloaded in index.html');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Method to register new game types at runtime
  registerGame(type, name, path, className) {
    this.gameRegistry[type] = {
      name,
      path,
      class: className
    };

    // Optionally add to selector
    const option = document.createElement('option');
    option.value = type;
    option.textContent = name;
    this.gameSelector.appendChild(option);
  }
  
  /**
   * Reset all game loader state (for debug purposes)
   */
  resetGameLoader() {
    console.log('Resetting game loader state');
    
    // Clear any pending timeouts
    if (this._activationTimeout) {
      clearTimeout(this._activationTimeout);
      this._activationTimeout = null;
    }
    
    if (this._loadingTimeout) {
      clearTimeout(this._loadingTimeout);
      this._loadingTimeout = null;
    }
    
    // Reset animation and loading flags
    this._animationInProgress = false;
    this._loadingInProgress = null;
    
    // Reset container classes if needed
    const container = document.querySelector('#game-container');
    if (container) {
      container.classList.remove('fade-out');
      container.classList.remove('fade-in');
    }
  }
  
  /**
   * Save game state using GameStateManager or legacy localStorage
   * @param {string} gameType - The game type ID
   */
  saveGameState(gameType) {
    // If state manager is available, use it
    if (this.stateManager) {
      try {
        const gameInstance = this.gameInstances[gameType];
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
            this.stateManager.setState(gameType, state);
            console.log(`GameLoader: Saved state for ${gameType} using GameStateManager`);
          }
        }
      } catch (error) {
        console.error(`GameLoader: Error saving game state with GameStateManager:`, error);
        // Fall back to legacy method
        this.saveGameStateLegacy(gameType);
      }
    } else {
      // Use legacy method
      this.saveGameStateLegacy(gameType);
    }
  }
  
  /**
   * Legacy method to save game state to local storage
   * @param {string} gameType - The game type ID
   * @private
   */
  saveGameStateLegacy(gameType) {
    const gameInstance = this.gameInstances[gameType];
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
          localStorage.setItem(`game_state_${gameType}`, JSON.stringify(gameState));
          console.log(`GameLoader: Saved state for ${gameType} using legacy storage`);
        }
      } catch (error) {
        console.error(`GameLoader: Error saving game state with legacy method:`, error);
      }
    }
  }
  
  /**
   * Restore game state using GameStateManager or legacy localStorage
   * @param {string} gameType - The game type ID
   */
  restoreGameState(gameType) {
    // If state manager is available, use it
    if (this.stateManager) {
      try {
        const gameState = this.stateManager.getState(gameType);
        if (gameState) {
          this.restoreGameStateToInstance(gameType, gameState);
          console.log(`GameLoader: Restored state for ${gameType} using GameStateManager`);
          return;
        }
      } catch (error) {
        console.error(`GameLoader: Error restoring game state with GameStateManager:`, error);
        // Fall back to legacy method
      }
    }
    
    // Use legacy method if state manager failed or is not available
    this.restoreGameStateLegacy(gameType);
  }
  
  /**
   * Legacy method to restore game state from local storage
   * @param {string} gameType - The game type ID
   * @private
   */
  restoreGameStateLegacy(gameType) {
    try {
      const savedState = localStorage.getItem(`game_state_${gameType}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.restoreGameStateToInstance(gameType, parsedState);
        console.log(`GameLoader: Restored state for ${gameType} using legacy storage`);
      }
    } catch (e) {
      console.error('GameLoader: Failed to restore game state from legacy storage:', e);
    }
  }
  
  /**
   * Apply state to a game instance
   * @param {string} gameType - The game type ID
   * @param {Object} state - The state to apply
   * @private
   */
  restoreGameStateToInstance(gameType, state) {
    if (!state) return;
    
    const gameInstance = this.gameInstances[gameType];
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

// Make the GameLoader available globally
window.GameLoader = GameLoader;