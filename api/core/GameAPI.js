/**
 * GameAPI.js
 * Provides a centralized interface for game management and operations.
 * Acts as the primary entry point for all game-related functionality.
 */

class GameAPI {
  /**
   * Initialize the GameAPI with optional configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    console.log('GameAPI: Initializing with config', config);
    
    // Store configuration
    this.config = {
      // Default options
      automaticInitialization: true,
      loadManifestsOnStart: true,
      multiLevelErrorRecovery: true,
      hotReloadEnabled: true,
      manifestPaths: [
        '/games/manifests/dice-game.json',
        '/games/manifests/card-game.json'
      ],
      // Merge with provided config
      ...config
    };
    
    // Initialize internal state
    this.initialized = false;
    this.initializing = false;
    this.activeGame = null;
    this.gameInstances = {};
    this.services = {};
    this.eventListeners = new Map();
    this.moduleCache = new Map(); // For tracking loaded modules
    
    // Automatic initialization if enabled
    if (this.config.automaticInitialization) {
      this.initialize();
    }
  }
  
  /**
   * Initialize the GameAPI and all required services
   * @return {Promise<void>} Promise that resolves when initialization is complete
   */
  async initialize() {
    if (this.initialized) {
      console.log('GameAPI: Already initialized');
      return;
    }
    
    if (this.initializing) {
      console.log('GameAPI: Initialization already in progress');
      return;
    }
    
    this.initializing = true;
    console.log('GameAPI: Starting initialization');
    
    try {
      // Initialize all required services
      await this.initializeServices();
      
      // Load game manifests if configured
      if (this.config.loadManifestsOnStart) {
        await this.loadManifests(this.config.manifestPaths);
      }
      
      // Initialize UI elements
      this.initializeUI();
      
      // Set up error recovery if configured
      if (this.config.multiLevelErrorRecovery) {
        this.setupErrorRecovery();
      }
      
      // Mark as initialized
      this.initialized = true;
      this.initializing = false;
      console.log('GameAPI: Initialization complete');
      
      // Trigger initialized event
      this.emit('initialized', { success: true });
    } catch (error) {
      console.error('GameAPI: Initialization failed', error);
      this.initializing = false;
      
      // Trigger error event
      this.emit('error', { 
        type: 'initialization_failed',
        error
      });
      
      // Attempt recovery if configured
      if (this.config.multiLevelErrorRecovery) {
        this.attemptRecovery('initialization', error);
      }
      
      throw error;
    }
  }
  
  /**
   * Initialize all required services
   * @private
   * @return {Promise<void>} Promise that resolves when all services are initialized
   */
  async initializeServices() {
    console.log('GameAPI: Initializing services');
    
    try {
      // Load and initialize GameRegistry
      const GameRegistryModule = await import('/api/core/GameRegistry.js');
      const GameRegistry = GameRegistryModule.default;
      
      this.services.registry = new GameRegistry();
      await this.services.registry.initialize();
      console.log('GameAPI: GameRegistry initialized');
      
      // Load and initialize GameStateManager
      const GameStateManagerModule = await import('/api/services/GameStateManager.js');
      const GameStateManager = GameStateManagerModule.default;
      
      this.services.stateManager = new GameStateManager({
        autoSave: true,
        autoSaveInterval: 10000, // 10 seconds
        maxHistoryLength: 20
      });
      await this.services.stateManager.initialize();
      console.log('GameAPI: GameStateManager initialized');
      
      // Load and initialize BettingService
      const BettingServiceModule = await import('/api/services/BettingService.js');
      const BettingService = BettingServiceModule.default;
      
      this.services.bettingService = new BettingService({
        initialBalance: 1000,
        minBet: 1,
        maxBet: 500,
        defaultBet: 10,
        currency: '$',
        persistBalance: true,
        maxHistoryEntries: 50
      });
      console.log('GameAPI: BettingService initialized');
      
      // Load and initialize HotReloadService if enabled
      if (this.config.hotReloadEnabled) {
        try {
          const HotReloadServiceModule = await import('/api/services/HotReloadService.js');
          const HotReloadService = HotReloadServiceModule.default;
          
          this.services.hotReloadService = new HotReloadService({
            enabled: true,
            pollInterval: 2000,
            preserveStateOnReload: true,
            manifestPaths: this.config.manifestPaths,
            onReload: this.handleHotReload.bind(this)
          });
          
          await this.services.hotReloadService.initialize({
            manifestLoader: this.services.registry.manifestLoader
          });
          
          console.log('GameAPI: HotReloadService initialized');
        } catch (hotReloadError) {
          console.warn('GameAPI: HotReloadService initialization failed, continuing without hot-reload:', hotReloadError);
        }
      }
      
      // Set up service event bindings
      this.setupServiceEventBindings();
      
      return true;
    } catch (error) {
      console.error('GameAPI: Failed to initialize services', error);
      throw new Error(`Failed to initialize services: ${error.message}`);
    }
  }
  
  /**
   * Set up event bindings between services
   * @private
   */
  setupServiceEventBindings() {
    // Connect BettingService with GameStateManager for state tracking
    if (this.services.bettingService && this.services.stateManager) {
      // Track betting events in state history
      this.services.bettingService.subscribe('betChange', (data) => {
        if (this.activeGame) {
          const gameId = this.getGameId(this.activeGame);
          if (gameId) {
            // Update game state with new bet amount
            const currentState = this.services.stateManager.getState(gameId) || {};
            const newState = {
              ...currentState,
              bet: data.newBet
            };
            this.services.stateManager.updateState(gameId, newState);
          }
        }
      });
      
      this.services.bettingService.subscribe('win', (data) => {
        if (data.gameId) {
          // Update game state with win information
          const currentState = this.services.stateManager.getState(data.gameId) || {};
          const newState = {
            ...currentState,
            lastWin: data.amount,
            lastWinTimestamp: Date.now()
          };
          this.services.stateManager.updateState(data.gameId, newState);
        }
      });
    }
  }
  
  /**
   * Set up error recovery mechanisms
   * @private
   */
  setupErrorRecovery() {
    // Listen for window errors
    window.addEventListener('error', (event) => {
      console.error('GameAPI: Window error detected', event);
      
      // Only handle errors that might be related to games
      if (this.activeGame && event.error) {
        this.attemptRecovery('runtime_error', event.error);
      }
    });
    
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('GameAPI: Unhandled rejection detected', event);
      
      if (this.activeGame) {
        this.attemptRecovery('unhandled_promise', event.reason);
      }
    });
  }
  
  /**
   * Initialize UI elements and event listeners
   * @private
   */
  initializeUI() {
    console.log('GameAPI: Initializing UI');
    
    // Find the game selector element
    this.gameSelector = document.getElementById('game-select');
    
    if (this.gameSelector) {
      // Update selector with available games
      this.updateGameSelector();
      
      // Add change event listener
      this.gameSelector.addEventListener('change', () => {
        const selectedGameId = this.gameSelector.value;
        if (selectedGameId) {
          this.loadGame(selectedGameId);
        }
      });
      
      console.log('GameAPI: Game selector initialized');
    } else {
      console.warn('GameAPI: Game selector element not found');
    }
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }
  
  /**
   * Set up keyboard shortcuts for game control
   * @private
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (this.activeGame) {
          const gameId = this.getGameId(this.activeGame);
          if (gameId && this.services.stateManager && this.services.stateManager.canUndo(gameId)) {
            e.preventDefault();
            this.undoGameState();
          }
        }
      }
      
      // Ctrl+Shift+Z or Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        if (this.activeGame) {
          const gameId = this.getGameId(this.activeGame);
          if (gameId && this.services.stateManager && this.services.stateManager.canRedo(gameId)) {
            e.preventDefault();
            this.redoGameState();
          }
        }
      }
    });
  }
  
  /**
   * Update the game selector with available games
   * @private
   */
  updateGameSelector() {
    if (!this.gameSelector || !this.services.registry) return;
    
    // Store current selection
    const currentSelection = this.gameSelector.value;
    
    // Clear existing options
    while (this.gameSelector.firstChild) {
      this.gameSelector.removeChild(this.gameSelector.firstChild);
    }
    
    // Add options from registry
    const games = this.services.registry.getGames();
    for (const game of games) {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = game.name;
      this.gameSelector.appendChild(option);
    }
    
    // Restore selection if possible, otherwise select first option
    if (currentSelection && games.some(g => g.id === currentSelection)) {
      this.gameSelector.value = currentSelection;
    } else if (this.gameSelector.options.length > 0) {
      this.gameSelector.value = this.gameSelector.options[0].value;
    }
    
    console.log('GameAPI: Updated game selector with', this.gameSelector.options.length, 'games');
  }
  
  /**
   * Load game manifests from specified paths
   * @param {string[]} manifestPaths - Array of paths to manifest files
   * @return {Promise<void>} Promise that resolves when manifests are loaded
   */
  async loadManifests(manifestPaths) {
    if (!this.services.registry) {
      throw new Error('GameAPI: Cannot load manifests - GameRegistry service not initialized');
    }
    
    console.log('GameAPI: Loading game manifests', manifestPaths);
    
    try {
      // Register games from manifests
      await this.services.registry.registerGamesFromManifests(manifestPaths);
      console.log('GameAPI: Game manifests loaded successfully');
      
      // Configure BettingService with game limits from manifests
      if (this.services.bettingService) {
        const games = this.services.registry.getGames();
        
        for (const game of games) {
          if (game.id && game.config) {
            const bettingConfig = {
              minBet: game.config.minBet,
              maxBet: game.config.maxBet,
              defaultBet: game.config.defaultBet
            };
            
            this.services.bettingService.setGameLimits(game.id, bettingConfig);
            this.services.bettingService.configureFromManifest(game.id, game);
            
            console.log(`GameAPI: Configured betting limits for ${game.id}`);
          }
        }
      }
      
      // Update UI with loaded games
      this.updateGameSelector();
      
      // Trigger event for manifest loading complete
      this.emit('manifestsLoaded', { 
        manifests: manifestPaths,
        games: this.services.registry.getGames()
      });
      
      return true;
    } catch (error) {
      console.error('GameAPI: Failed to load manifests', error);
      
      // Trigger error event
      this.emit('error', { 
        type: 'manifest_loading_failed',
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Get game details from registry
   * @param {string} gameId - The game ID to look up
   * @return {Object|null} Game manifest or null if not found
   */
  getGameInfo(gameId) {
    if (!this.services.registry) {
      return null;
    }
    
    try {
      // Try both getGame and getGameManifest methods
      let gameInfo = null;
      
      // First try the standard getGame method
      if (typeof this.services.registry.getGame === 'function') {
        gameInfo = this.services.registry.getGame(gameId);
      }
      
      // If that fails, try getGameManifest method
      if (!gameInfo && typeof this.services.registry.getGameManifest === 'function') {
        gameInfo = this.services.registry.getGameManifest(gameId);
      }
      
      // If both methods fail but the registry has a games array, try searching it
      if (!gameInfo && Array.isArray(this.services.registry.games)) {
        gameInfo = this.services.registry.games.find(g => g.id === gameId);
      }
      
      return gameInfo;
    } catch (error) {
      console.warn(`GameAPI: Error accessing registry for game ${gameId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all available games
   * @return {Array} Array of game manifests
   */
  getGames() {
    if (!this.services.registry) {
      return [];
    }
    
    return this.services.registry.getGames();
  }
  
  /**
   * Load and activate a game by ID
   * @param {string} gameId - The ID of the game to load
   * @param {Object} options - Options for loading the game
   * @param {boolean} options.forceReload - Whether to force reload the game instance
   * @param {boolean} options.preserveState - Whether to preserve the state when switching
   * @return {Promise<Object>} Promise that resolves with the game instance
   */
  async loadGame(gameId, options = {}) {
    console.log(`GameAPI: Loading game ${gameId}`, options);
    
    // Initialize API if not already initialized
    if (!this.initialized && !this.initializing) {
      console.log('GameAPI: Auto-initializing for loadGame call');
      try {
        await this.initialize();
      } catch (initError) {
        console.warn('GameAPI: Auto-initialization failed, continuing with limited functionality', initError);
        // Continue with limited functionality
        this.initialized = true;
      }
    }
    
    // Don't throw if initialization is in progress, just wait for it
    if (this.initializing) {
      console.log('GameAPI: Waiting for initialization to complete before loading game');
      await new Promise(resolve => {
        const checkInitialized = () => {
          if (this.initialized) {
            resolve();
          } else if (!this.initializing) {
            // Force initialized if initialization stopped but didn't complete
            this.initialized = true;
            resolve();
          } else {
            setTimeout(checkInitialized, 100);
          }
        };
        checkInitialized();
      });
    }
    
    if (!gameId) {
      throw new Error('GameAPI: Game ID is required');
    }
    
    // Get game manifest with error handling
    let gameInfo;
    try {
      gameInfo = this.getGameInfo(gameId);
    } catch (error) {
      console.warn(`GameAPI: Error getting game info for ${gameId}, will use fallback`, error);
      // Create a minimal fallback game info
      gameInfo = {
        id: gameId,
        name: gameId.charAt(0).toUpperCase() + gameId.slice(1),
        main: gameId.charAt(0).toUpperCase() + gameId.slice(1) + 'Game'
      };
    }
    
    if (!gameInfo) {
      console.warn(`GameAPI: Game ${gameId} not found in registry, will use fallback info`);
      // Create a minimal fallback game info
      gameInfo = {
        id: gameId,
        name: gameId.charAt(0).toUpperCase() + gameId.slice(1),
        main: gameId.charAt(0).toUpperCase() + gameId.slice(1) + 'Game'
      };
    }
    
    // Default options
    const defaultOptions = {
      forceReload: false,
      preserveState: true
    };
    
    // Merge with provided options
    const loadOptions = {
      ...defaultOptions,
      ...options
    };
    
    try {
      // Notify that game loading is starting
      this.emit('gameLoading', { gameId, options: loadOptions });
      
      // Save current game state if needed
      if (this.activeGame && loadOptions.preserveState) {
        const currentGameId = this.getGameId(this.activeGame);
        if (currentGameId) {
          this.saveGameState(currentGameId);
        }
      }
      
      // Clean up current game if any
      await this.cleanupCurrentGame();
      
      // Check if we need to create a new instance
      const shouldCreateNew = loadOptions.forceReload || !this.gameInstances[gameId];
      
      let gameInstance;
      
      if (shouldCreateNew) {
        // Create new game instance
        gameInstance = await this.createGameInstance(gameId, gameInfo);
      } else {
        // Use existing instance
        gameInstance = this.gameInstances[gameId];
      }
      
      // Activate the game
      await this.activateGame(gameId, gameInstance);
      
      // Update UI elements
      this.updateUI(gameId);
      
      console.log(`GameAPI: Game ${gameId} loaded successfully`);
      
      // Notify that game has been loaded
      this.emit('gameLoaded', { 
        gameId, 
        success: true,
        forceReloaded: shouldCreateNew
      });
      
      return gameInstance;
    } catch (error) {
      console.error(`GameAPI: Failed to load game ${gameId}`, error);
      
      // Notify about the error
      this.emit('error', { 
        type: 'game_loading_failed',
        gameId,
        error
      });
      
      // Attempt recovery if configured
      if (this.config.multiLevelErrorRecovery) {
        return this.attemptRecovery('game_loading', error, gameId);
      }
      
      throw error;
    }
  }
  
  /**
   * Create a new game instance
   * @private
   * @param {string} gameId - The ID of the game to create
   * @param {Object} gameInfo - The game manifest
   * @return {Promise<Object>} Promise that resolves with the game instance
   */
  async createGameInstance(gameId, gameInfo) {
    console.log(`GameAPI: Creating new instance of game ${gameId}`);
    
    try {
      // Get the class name from manifest or derive from ID
      const className = gameInfo.main || `${gameId.charAt(0).toUpperCase() + gameId.slice(1)}Game`;
      
      // Check if we need to load a script
      let GameClass;
      
      if (className.includes('/')) {
        // It's a path, try to import it
        try {
          const module = await import(className);
          GameClass = module.default;
        } catch (importError) {
          console.error(`GameAPI: Failed to import game module ${className}`, importError);
          throw importError;
        }
      } else {
        // It's a global class name, look it up on window
        GameClass = window[className];
      }
      
      if (!GameClass) {
        throw new Error(`Game class ${className} not found`);
      }
      
      // Create the game instance
      let gameInstance = new GameClass();
      
      // Check if game implements IGame interface
      const implementsIGame = this.checkImplementsIGame(gameInstance);
      
      if (!implementsIGame) {
        // All games now must implement IGame interface directly
        console.error(`GameAPI: Game ${gameId} doesn't implement IGame interface. GameAdapter has been removed.`);
        throw new Error(`Game ${gameId} does not implement required IGame interface`);
      }
      
      // Store in instances map
      this.gameInstances[gameId] = gameInstance;
      
      // Preload game assets if defined in manifest
      if (gameInfo.assets && Array.isArray(gameInfo.assets) && gameInfo.assets.length > 0) {
        this.preloadGameAssets(gameId, gameInfo.assets);
      }
      
      return gameInstance;
    } catch (error) {
      console.error(`GameAPI: Failed to create game instance ${gameId}`, error);
      throw error;
    }
  }
  
  /**
   * Check if a game instance implements the IGame interface
   * @private
   * @param {Object} gameInstance - The game instance to check
   * @return {boolean} Whether the instance implements IGame interface
   */
  checkImplementsIGame(gameInstance) {
    // Check for critical methods from IGame interface
    const requiredMethods = [
      'initialize',
      'start',
      'destroy',
      'getState',
      'setState'
    ];
    
    return requiredMethods.every(method => typeof gameInstance[method] === 'function');
  }
  
  /**
   * Activate a game instance
   * @private
   * @param {string} gameId - The ID of the game to activate
   * @param {Object} gameInstance - The game instance to activate
   * @return {Promise<void>} Promise that resolves when the game is activated
   */
  async activateGame(gameId, gameInstance) {
    console.log(`GameAPI: Activating game ${gameId}`);
    
    try {
      // Set as active game
      this.activeGame = gameInstance;
      
      // Get game container
      const container = document.getElementById('game-container');
      if (!container) {
        throw new Error('Game container element not found');
      }
      
      // Initialize game
      if (typeof gameInstance.initialize === 'function') {
        // Build config for game initialization
        const initConfig = {
          container,
          bet: this.services.bettingService ? this.services.bettingService.getCurrentBet() : 10,
          riskLevel: this.services.bettingService ? this.services.bettingService.getRiskLevel() : 'medium',
          theme: {
            name: 'default'
          },
          layout: {
            width: container.clientWidth,
            height: container.clientHeight
          },
          // Add game-specific custom config from manifest
          custom: this.getGameInfo(gameId)?.config || {}
        };
        
        await gameInstance.initialize(initConfig);
      }
      
      // Restore game state
      this.restoreGameState(gameId);
      
      // Start the game
      if (typeof gameInstance.start === 'function') {
        await gameInstance.start();
      }
      
      console.log(`GameAPI: Game ${gameId} activated successfully`);
      
      // Update selector to match current game
      if (this.gameSelector && this.gameSelector.value !== gameId) {
        this.gameSelector.value = gameId;
      }
      
      return true;
    } catch (error) {
      console.error(`GameAPI: Failed to activate game ${gameId}`, error);
      throw error;
    }
  }
  
  /**
   * Clean up the current active game
   * @private
   * @return {Promise<void>} Promise that resolves when cleanup is complete
   */
  async cleanupCurrentGame() {
    if (!this.activeGame) return;
    
    console.log('GameAPI: Cleaning up current game');
    
    try {
      // Get current game ID
      const gameId = this.getGameId(this.activeGame);
      
      // Save state before cleanup
      if (gameId) {
        this.saveGameState(gameId);
      }
      
      // Pause the game if it supports it
      if (typeof this.activeGame.pause === 'function') {
        this.activeGame.pause();
      }
      
      // Call destroy method if available
      if (typeof this.activeGame.destroy === 'function') {
        await this.activeGame.destroy();
      }
      
      // Clear reference
      this.activeGame = null;
      
      console.log('GameAPI: Current game cleaned up successfully');
    } catch (error) {
      console.error('GameAPI: Error during game cleanup', error);
      // Continue despite error - we need to clear the active game
      this.activeGame = null;
    }
  }
  
  /**
   * Update UI elements to reflect current game
   * @private
   * @param {string} gameId - The ID of the current game
   */
  updateUI(gameId) {
    // Update title
    const titleElement = document.querySelector('.game-title');
    if (titleElement) {
      const gameInfo = this.getGameInfo(gameId);
      titleElement.textContent = gameInfo ? gameInfo.name : 'Game';
    }
    
    // Update betting UI if BettingService is available
    if (this.services.bettingService) {
      // Update bet display
      const betElement = document.getElementById('current-bet');
      if (betElement) {
        betElement.textContent = this.services.bettingService.getFormattedBet();
      }
      
      // Update balance display
      const balanceElement = document.getElementById('balance');
      if (balanceElement) {
        balanceElement.textContent = this.services.bettingService.getFormattedBalance();
      }
      
      // Update potential win display
      const potentialWinElement = document.getElementById('potential-win');
      if (potentialWinElement) {
        const potentialWin = this.services.bettingService.calculatePotentialWin(null, null, gameId);
        potentialWinElement.textContent = this.services.bettingService.formatAmount(potentialWin);
      }
      
      // Update risk level display
      const riskLevelElement = document.getElementById('risk-level');
      if (riskLevelElement) {
        const riskLevel = this.services.bettingService.getRiskLevel();
        riskLevelElement.textContent = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
      }
    }
  }
  
  /**
   * Get the game ID for a game instance
   * @private
   * @param {Object} gameInstance - The game instance
   * @return {string|null} The game ID or null if not found
   */
  getGameId(gameInstance) {
    if (!gameInstance) return null;
    
    // First try to get it from the instance itself
    if (gameInstance.getInfo && typeof gameInstance.getInfo === 'function') {
      const info = gameInstance.getInfo();
      if (info && info.id) {
        return info.id;
      }
    }
    
    // Otherwise search instances map
    for (const [id, instance] of Object.entries(this.gameInstances)) {
      if (instance === gameInstance) {
        return id;
      }
    }
    
    return null;
  }
  
  /**
   * Preload game assets defined in manifest
   * @private
   * @param {string} gameId - The game ID
   * @param {Array} assets - Array of asset paths
   */
  preloadGameAssets(gameId, assets) {
    if (!assets || !Array.isArray(assets) || assets.length === 0) return;
    
    console.log(`GameAPI: Preloading ${assets.length} assets for ${gameId}`);
    
    const gameInstance = this.gameInstances[gameId];
    if (!gameInstance) return;
    
    // Check if game has asset loading capability
    if (gameInstance.loadAssets && typeof gameInstance.loadAssets === 'function') {
      // Use game's asset loader
      gameInstance.loadAssets(assets);
      return;
    }
    
    // Basic preloading for common asset types
    assets.forEach(asset => {
      try {
        if (!asset) return;
        
        // If it's an object with a path property, use that
        const assetPath = typeof asset === 'object' ? asset.path : asset;
        
        if (!assetPath) return;
        
        // Determine asset type
        const type = this.getAssetTypeFromPath(assetPath);
        
        switch (type) {
          case 'image':
            this.preloadImage(assetPath);
            break;
          case 'audio':
            this.preloadAudio(assetPath);
            break;
          case 'json':
          case 'data':
            this.preloadData(assetPath);
            break;
        }
      } catch (error) {
        console.warn(`GameAPI: Error preloading asset ${asset}`, error);
      }
    });
  }
  
  /**
   * Get asset type from file path extension
   * @private
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
   * @private
   * @param {string} path - Path to the image
   */
  preloadImage(path) {
    const img = new Image();
    img.src = path;
    console.log(`GameAPI: Preloading image: ${path}`);
  }
  
  /**
   * Preload an audio asset
   * @private
   * @param {string} path - Path to the audio file
   */
  preloadAudio(path) {
    const audio = new Audio();
    audio.src = path;
    audio.preload = 'auto';
    console.log(`GameAPI: Preloading audio: ${path}`);
  }
  
  /**
   * Preload a data asset (JSON)
   * @private
   * @param {string} path - Path to the data file
   */
  preloadData(path) {
    fetch(path)
      .then(response => response.json())
      .then(data => console.log(`GameAPI: Preloaded data: ${path}`))
      .catch(error => console.warn(`GameAPI: Error preloading data ${path}:`, error));
  }
  
  /**
   * Save game state
   * @param {string} gameId - The game ID
   * @return {boolean} Whether state was saved successfully
   */
  saveGameState(gameId) {
    if (!gameId || !this.services.stateManager) return false;
    
    console.log(`GameAPI: Saving state for game ${gameId}`);
    
    try {
      const gameInstance = this.gameInstances[gameId];
      if (!gameInstance) return false;
      
      // Get game state either from getState method or property
      let state;
      
      if (typeof gameInstance.getState === 'function') {
        // Use IGame interface method
        state = gameInstance.getState();
      } else {
        // Try direct state property access (legacy)
        if (gameInstance.state) {
          state = gameInstance.state;
        } else if (gameInstance.game && gameInstance.game.state) {
          state = gameInstance.game.state;
        }
      }
      
      if (!state) {
        console.warn(`GameAPI: No state found for game ${gameId}`);
        return false;
      }
      
      // Save state using state manager
      this.services.stateManager.setState(gameId, state);
      
      console.log(`GameAPI: State saved for game ${gameId}`);
      return true;
    } catch (error) {
      console.error(`GameAPI: Error saving state for game ${gameId}`, error);
      return false;
    }
  }
  
  /**
   * Restore game state
   * @param {string} gameId - The game ID
   * @return {boolean} Whether state was restored successfully
   */
  restoreGameState(gameId) {
    if (!gameId || !this.services.stateManager) return false;
    
    console.log(`GameAPI: Restoring state for game ${gameId}`);
    
    try {
      // Get saved state
      const state = this.services.stateManager.getState(gameId);
      if (!state) {
        console.log(`GameAPI: No saved state found for game ${gameId}`);
        return false;
      }
      
      // Get game instance
      const gameInstance = this.gameInstances[gameId];
      if (!gameInstance) return false;
      
      // Restore state
      if (typeof gameInstance.setState === 'function') {
        // Use IGame interface method
        gameInstance.setState(state);
      } else {
        // Direct property setting (legacy)
        if (gameInstance.state) {
          Object.assign(gameInstance.state, state);
        } else if (gameInstance.game && gameInstance.game.state) {
          Object.assign(gameInstance.game.state, state);
        }
      }
      
      console.log(`GameAPI: State restored for game ${gameId}`);
      return true;
    } catch (error) {
      console.error(`GameAPI: Error restoring state for game ${gameId}`, error);
      return false;
    }
  }
  
  /**
   * Undo last game state change
   * @return {boolean} Whether undo was successful
   */
  undoGameState() {
    if (!this.activeGame || !this.services.stateManager) return false;
    
    const gameId = this.getGameId(this.activeGame);
    if (!gameId) return false;
    
    console.log(`GameAPI: Undoing state for game ${gameId}`);
    
    try {
      // Check if undo is possible
      if (!this.services.stateManager.canUndo(gameId)) {
        console.log(`GameAPI: No state history to undo for game ${gameId}`);
        return false;
      }
      
      // Get previous state
      const previousState = this.services.stateManager.undo(gameId);
      
      // Apply to game
      if (typeof this.activeGame.setState === 'function') {
        this.activeGame.setState(previousState);
      } else {
        // Legacy approach
        if (this.activeGame.state) {
          Object.assign(this.activeGame.state, previousState);
        } else if (this.activeGame.game && this.activeGame.game.state) {
          Object.assign(this.activeGame.game.state, previousState);
        }
      }
      
      console.log(`GameAPI: State undo successful for game ${gameId}`);
      
      // Trigger event
      this.emit('stateUndo', { gameId, state: previousState });
      
      return true;
    } catch (error) {
      console.error(`GameAPI: Error undoing state for game ${gameId}`, error);
      return false;
    }
  }
  
  /**
   * Redo last undone game state change
   * @return {boolean} Whether redo was successful
   */
  redoGameState() {
    if (!this.activeGame || !this.services.stateManager) return false;
    
    const gameId = this.getGameId(this.activeGame);
    if (!gameId) return false;
    
    console.log(`GameAPI: Redoing state for game ${gameId}`);
    
    try {
      // Check if redo is possible
      if (!this.services.stateManager.canRedo(gameId)) {
        console.log(`GameAPI: No state history to redo for game ${gameId}`);
        return false;
      }
      
      // Get next state
      const nextState = this.services.stateManager.redo(gameId);
      
      // Apply to game
      if (typeof this.activeGame.setState === 'function') {
        this.activeGame.setState(nextState);
      } else {
        // Legacy approach
        if (this.activeGame.state) {
          Object.assign(this.activeGame.state, nextState);
        } else if (this.activeGame.game && this.activeGame.game.state) {
          Object.assign(this.activeGame.game.state, nextState);
        }
      }
      
      console.log(`GameAPI: State redo successful for game ${gameId}`);
      
      // Trigger event
      this.emit('stateRedo', { gameId, state: nextState });
      
      return true;
    } catch (error) {
      console.error(`GameAPI: Error redoing state for game ${gameId}`, error);
      return false;
    }
  }
  
  /**
   * Place a bet from the current game
   * @param {number} amount - Bet amount
   * @param {string} [gameId] - Optional game ID, uses active game if not specified
   * @return {Object} Result of the bet operation
   */
  placeBet(amount, gameId = null) {
    if (!this.services.bettingService) {
      throw new Error('GameAPI: BettingService not available');
    }
    
    // Determine gameId if not provided
    const targetGameId = gameId || (this.activeGame ? this.getGameId(this.activeGame) : null);
    
    console.log(`GameAPI: Placing bet of ${amount} for game ${targetGameId}`);
    
    return this.services.bettingService.placeBet(amount, targetGameId);
  }
  
  /**
   * Register a win for the current game
   * @param {number} amount - Win amount
   * @param {Object} details - Additional details about the win
   * @param {string} [gameId] - Optional game ID, uses active game if not specified
   * @return {Object} Result of the win operation
   */
  registerWin(amount, details = {}, gameId = null) {
    if (!this.services.bettingService) {
      throw new Error('GameAPI: BettingService not available');
    }
    
    // Determine gameId if not provided
    const targetGameId = gameId || (this.activeGame ? this.getGameId(this.activeGame) : null);
    
    console.log(`GameAPI: Registering win of ${amount} for game ${targetGameId}`);
    
    return this.services.bettingService.registerWin(amount, targetGameId, details);
  }
  
  /**
   * Register a loss for the current game
   * @param {number} amount - Loss amount (should be the bet amount)
   * @param {Object} details - Additional details about the loss
   * @param {string} [gameId] - Optional game ID, uses active game if not specified
   * @return {Object} Result of the loss operation
   */
  registerLoss(amount, details = {}, gameId = null) {
    if (!this.services.bettingService) {
      throw new Error('GameAPI: BettingService not available');
    }
    
    // Determine gameId if not provided
    const targetGameId = gameId || (this.activeGame ? this.getGameId(this.activeGame) : null);
    
    console.log(`GameAPI: Registering loss of ${amount} for game ${targetGameId}`);
    
    return this.services.bettingService.registerLoss(amount, targetGameId, details);
  }
  
  /**
   * Calculate potential win for current bet and risk level
   * @param {number} [betAmount] - Optional bet amount, uses current bet if not specified
   * @param {string} [riskLevel] - Optional risk level, uses current level if not specified
   * @param {string} [gameId] - Optional game ID, uses active game if not specified
   * @return {number} Potential win amount
   */
  calculatePotentialWin(betAmount = null, riskLevel = null, gameId = null) {
    if (!this.services.bettingService) {
      throw new Error('GameAPI: BettingService not available');
    }
    
    // Determine gameId if not provided
    const targetGameId = gameId || (this.activeGame ? this.getGameId(this.activeGame) : null);
    
    return this.services.bettingService.calculatePotentialWin(betAmount, riskLevel, targetGameId);
  }
  
  /**
   * Perform a specific action on the active game
   * @param {string} actionType - Type of action to perform
   * @param {Object} actionParams - Parameters for the action
   * @return {Promise<Object>} Result of the action
   */
  async performGameAction(actionType, actionParams = {}) {
    if (!this.activeGame) {
      throw new Error('GameAPI: No active game to perform action on');
    }
    
    console.log(`GameAPI: Performing game action ${actionType}`, actionParams);
    
    try {
      if (typeof this.activeGame.performAction === 'function') {
        // Use IGame interface method
        return await this.activeGame.performAction({
          type: actionType,
          data: actionParams
        });
      } else {
        // Try to call a method matching the action type
        if (typeof this.activeGame[actionType] === 'function') {
          return await this.activeGame[actionType](actionParams);
        } else if (this.activeGame.game && typeof this.activeGame.game[actionType] === 'function') {
          return await this.activeGame.game[actionType](actionParams);
        } else {
          throw new Error(`GameAPI: Action ${actionType} not supported by active game`);
        }
      }
    } catch (error) {
      console.error(`GameAPI: Error performing action ${actionType}`, error);
      
      // Emit error event
      this.emit('error', {
        type: 'game_action_failed',
        actionType,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Add an event listener
   * @param {string} eventName - The name of the event to listen for
   * @param {Function} handler - The handler function
   */
  on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return;
    
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    
    this.eventListeners.get(eventName).add(handler);
    console.log(`GameAPI: Added listener for event ${eventName}`);
  }
  
  /**
   * Remove an event listener
   * @param {string} eventName - The name of the event
   * @param {Function} handler - The handler function to remove
   */
  off(eventName, handler) {
    if (!eventName || !this.eventListeners.has(eventName)) return;
    
    if (handler) {
      // Remove specific handler
      this.eventListeners.get(eventName).delete(handler);
    } else {
      // Remove all handlers for this event
      this.eventListeners.delete(eventName);
    }
    
    console.log(`GameAPI: Removed listener for event ${eventName}`);
  }
  
  /**
   * Emit an event
   * @private
   * @param {string} eventName - The name of the event to emit
   * @param {Object} data - The data to pass to handlers
   */
  emit(eventName, data) {
    if (!eventName || !this.eventListeners.has(eventName)) return;
    
    // Add timestamp to all events
    const eventData = {
      ...data,
      timestamp: Date.now()
    };
    
    // Call all registered handlers
    for (const handler of this.eventListeners.get(eventName)) {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`GameAPI: Error in event handler for ${eventName}`, error);
      }
    }
  }
  
  /**
   * Attempt recovery from error
   * @private
   * @param {string} errorType - The type of error
   * @param {Error} error - The error object
   * @param {string} [gameId] - Optional game ID associated with the error
   * @return {boolean|Object} Whether recovery was successful or a recovery result
   */
  attemptRecovery(errorType, error, gameId = null) {
    console.log(`GameAPI: Attempting recovery from ${errorType} error`, error);
    
    // Emit recovery attempt event
    this.emit('recoveryAttempt', {
      errorType,
      error,
      gameId
    });
    
    try {
      switch (errorType) {
        case 'initialization':
          // Try to initialize again with minimal services
          return this.recoverFromInitializationError();
          
        case 'game_loading':
          // Try to load a different game
          return this.recoverFromGameLoadingError(gameId);
          
        case 'runtime_error':
        case 'unhandled_promise':
          // Try to reload the current game
          return this.recoverFromRuntimeError();
          
        default:
          console.warn(`GameAPI: No recovery strategy for ${errorType}`);
          return false;
      }
    } catch (recoveryError) {
      console.error(`GameAPI: Recovery attempt failed`, recoveryError);
      
      // Emit recovery failure event
      this.emit('recoveryFailed', {
        errorType,
        originalError: error,
        recoveryError
      });
      
      return false;
    }
  }
  
  /**
   * Recover from initialization error
   * @private
   * @return {boolean} Whether recovery was successful
   */
  recoverFromInitializationError() {
    console.log('GameAPI: Recovering from initialization error');
    
    // Reset initialization flags
    this.initialized = false;
    this.initializing = false;
    
    // Try to initialize with minimal functionality
    try {
      // Load GameRegistry directly
      const gameRegistry = new window.GameRegistry();
      this.services.registry = gameRegistry;
      
      // Set hardcoded games if needed
      if (!this.services.registry.getGames().length) {
        const hardcodedGames = [
          {
            id: 'dice',
            name: 'Dice Game',
            main: 'DiceGame',
            config: {
              minBet: 1,
              maxBet: 500,
              defaultBet: 10
            }
          },
          {
            id: 'card',
            name: 'Card Game',
            main: 'CardGame',
            config: {
              minBet: 1,
              maxBet: 500,
              defaultBet: 10
            }
          }
        ];
        
        for (const game of hardcodedGames) {
          this.services.registry.registerGame(game);
        }
      }
      
      // Update UI
      this.updateGameSelector();
      
      // Mark as initialized with limited functionality
      this.initialized = true;
      
      console.log('GameAPI: Recovered from initialization error with limited functionality');
      
      // Emit recovery success event
      this.emit('recoverySuccess', {
        errorType: 'initialization',
        limitedFunctionality: true
      });
      
      return true;
    } catch (error) {
      console.error('GameAPI: Failed to recover from initialization error', error);
      return false;
    }
  }
  
  /**
   * Recover from game loading error
   * @private
   * @param {string} failedGameId - The ID of the game that failed to load
   * @return {Object|boolean} The new game instance or false if recovery failed
   */
  recoverFromGameLoadingError(failedGameId) {
    console.log(`GameAPI: Recovering from game loading error for ${failedGameId}`);
    
    try {
      // Get all available games
      const games = this.services.registry ? this.services.registry.getGames() : [];
      
      if (games.length === 0) {
        console.error('GameAPI: No available games for recovery');
        return false;
      }
      
      // Find a different game to load
      const alternativeGame = games.find(game => game.id !== failedGameId);
      
      if (!alternativeGame) {
        // If only one game is available, try to force reload it
        const onlyGame = games[0];
        console.log(`GameAPI: Only one game available, trying force reload of ${onlyGame.id}`);
        
        // Force reload the game
        return this.loadGame(onlyGame.id, { forceReload: true, preserveState: false });
      }
      
      console.log(`GameAPI: Loading alternative game ${alternativeGame.id} for recovery`);
      
      // Load alternative game
      return this.loadGame(alternativeGame.id, { preserveState: false });
    } catch (error) {
      console.error('GameAPI: Failed to recover from game loading error', error);
      return false;
    }
  }
  
  /**
   * Recover from runtime error in a game
   * @private
   * @return {boolean} Whether recovery was successful
   */
  recoverFromRuntimeError() {
    if (!this.activeGame) {
      console.log('GameAPI: No active game to recover');
      return false;
    }
    
    const gameId = this.getGameId(this.activeGame);
    if (!gameId) {
      console.log('GameAPI: Cannot determine active game ID for recovery');
      return false;
    }
    
    console.log(`GameAPI: Recovering from runtime error for game ${gameId}`);
    
    try {
      // Attempt to force reload the game
      this.loadGame(gameId, { forceReload: true, preserveState: false });
      
      console.log(`GameAPI: Successfully reloaded game ${gameId} after runtime error`);
      
      // Emit recovery success event
      this.emit('recoverySuccess', {
        errorType: 'runtime_error',
        gameId
      });
      
      return true;
    } catch (error) {
      console.error(`GameAPI: Failed to recover from runtime error for game ${gameId}`, error);
      
      // Try loading a different game as last resort
      return this.recoverFromGameLoadingError(gameId);
    }
  }
  
  /**
   * Handle hot reload events from HotReloadService
   * @param {Object} reloadData - Reload event data
   * @private
   */
  handleHotReload(reloadData) {
    console.log('GameAPI: Hot reload event received', reloadData);
    
    try {
      // Handle different types of hot reload events
      if (reloadData.type === 'manifestReloaded') {
        // A manifest has been reloaded, reload the corresponding game if needed
        this.handleManifestReload(reloadData.manifestPath, reloadData.manifest);
      } else if (reloadData.type === 'fileChanged') {
        // A file has changed, check if it's related to the current game
        this.handleFileChange(reloadData.filePath, reloadData.timestamp);
      } else if (reloadData.type === 'gameReloading') {
        // A game is about to be reloaded, save its state
        this.saveGameStateBeforeReload(reloadData.gameId);
      }
      
      // Emit hot reload event
      this.emit('hotReload', reloadData);
    } catch (error) {
      console.error('GameAPI: Error handling hot reload event:', error);
    }
  }
  
  /**
   * Handle manifest reload
   * @param {string} manifestPath - Path to the reloaded manifest
   * @param {Object} manifest - Reloaded manifest data
   * @private
   */
  async handleManifestReload(manifestPath, manifest) {
    if (!manifest) return;
    
    try {
      console.log(`GameAPI: Handling reload of manifest: ${manifestPath} for game: ${manifest.id}`);
      
      // Check if the game is currently active
      const isActiveGame = this.activeGame && this.getGameId(this.activeGame) === manifest.id;
      
      // Invalidate module cache for this game
      this.invalidateGameModuleCache(manifest.id);
      
      // Emit manifest update event
      this.emit('manifestUpdated', {
        gameId: manifest.id,
        manifestPath,
        manifest,
        isActiveGame
      });
      
      // If this is the active game, reload it with state preservation
      if (isActiveGame) {
        console.log(`GameAPI: Reloading active game ${manifest.id} due to manifest change`);
        
        // Force reload the game with state preservation
        await this.loadGame(manifest.id, { 
          forceReload: true,
          preserveState: true
        });
      } else {
        // If instance exists, remove it to force recreation next time
        if (this.gameInstances[manifest.id]) {
          console.log(`GameAPI: Invalidating cached game instance: ${manifest.id}`);
          this.cleanupGameInstance(manifest.id);
          delete this.gameInstances[manifest.id];
        }
      }
    } catch (error) {
      console.error(`GameAPI: Error handling manifest reload for ${manifestPath}:`, error);
    }
  }
  
  /**
   * Handle file change event
   * @param {string} filePath - Path to the changed file
   * @param {number} timestamp - Timestamp of the change
   * @private 
   */
  handleFileChange(filePath, timestamp) {
    try {
      // Determine the game ID from the file path
      const gameId = this.getGameIdFromFilePath(filePath);
      
      if (!gameId) {
        // Not a game-specific file, no action needed
        return;
      }
      
      console.log(`GameAPI: Detected change in file ${filePath} for game ${gameId}`);
      
      // Check if this is the active game
      const isActiveGame = this.activeGame && this.getGameId(this.activeGame) === gameId;
      
      // Invalidate module cache for this game
      this.invalidateGameModuleCache(gameId);
      
      // If this is the active game, trigger a reload
      if (isActiveGame) {
        console.log(`GameAPI: Reloading active game ${gameId} due to file change`);
        
        // Delay the reload slightly to ensure file is fully written
        setTimeout(() => {
          this.loadGame(gameId, { 
            forceReload: true,
            preserveState: true
          }).catch(error => {
            console.error(`GameAPI: Error reloading game ${gameId} after file change:`, error);
          });
        }, 200);
      } else {
        // For non-active games, just invalidate the instance
        if (this.gameInstances[gameId]) {
          console.log(`GameAPI: Invalidating cached game instance: ${gameId}`);
          this.cleanupGameInstance(gameId);
          delete this.gameInstances[gameId];
        }
      }
    } catch (error) {
      console.error(`GameAPI: Error handling file change for ${filePath}:`, error);
    }
  }
  
  /**
   * Determine game ID from a file path
   * @param {string} filePath - File path
   * @return {string|null} Game ID or null if not a game file
   * @private
   */
  getGameIdFromFilePath(filePath) {
    // Normalize path to forward slashes for consistency
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Check if it's a manifest file
    if (normalizedPath.includes('/manifests/')) {
      // Extract game ID from manifest file name
      const matches = normalizedPath.match(/\/manifests\/([a-z0-9-]+)\.json$/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
    // Check if it's a game file
    if (normalizedPath.includes('/games/')) {
      // Try to determine game ID from games directory
      // For example, /games/diceGame.js -> dice-game
      // or /games/dice/main.js -> dice
      
      // Check for direct game file pattern first
      let matches = normalizedPath.match(/\/games\/([a-zA-Z0-9-]+)Game\.js$/);
      if (matches && matches[1]) {
        return matches[1].toLowerCase();
      }
      
      // Check for directory pattern
      matches = normalizedPath.match(/\/games\/([a-zA-Z0-9-]+)\//);
      if (matches && matches[1]) {
        return matches[1].toLowerCase();
      }
    }
    
    // Not a recognizable game file
    return null;
  }
  
  /**
   * Invalidate module cache for a game
   * @param {string} gameId - ID of the game to invalidate
   * @private
   */
  invalidateGameModuleCache(gameId) {
    if (!gameId) return;
    
    // Store the module paths that were invalidated
    const invalidatedModules = [];
    
    // Find the game info
    const gameInfo = this.getGameInfo(gameId);
    if (!gameInfo) return;
    
    // Add the main game file to invalidated modules
    if (gameInfo.main) {
      const mainModule = this.moduleCache.get(gameInfo.main);
      if (mainModule) {
        this.moduleCache.delete(gameInfo.main);
        invalidatedModules.push(gameInfo.main);
      }
    }
    
    // Invalidate any other modules related to this game
    for (const [path, timestamp] of this.moduleCache.entries()) {
      if (path.includes(`/${gameId}/`) || path.includes(`/${gameId}.js`)) {
        this.moduleCache.delete(path);
        invalidatedModules.push(path);
      }
    }
    
    if (invalidatedModules.length > 0) {
      console.log(`GameAPI: Invalidated ${invalidatedModules.length} modules for game ${gameId}:`, invalidatedModules);
    }
  }
  
  /**
   * Clean up a game instance and release resources
   * @param {string} gameId - ID of the game to clean up
   * @private
   */
  cleanupGameInstance(gameId) {
    if (!gameId || !this.gameInstances[gameId]) return;
    
    const instance = this.gameInstances[gameId];
    
    try {
      // Call destroy method if available
      if (typeof instance.destroy === 'function') {
        instance.destroy();
      }
      
      // Cancel animation frame if present
      if (instance.animationId) {
        cancelAnimationFrame(instance.animationId);
      }
      
      // Check for framework resources to clean up
      const framework = instance.framework || instance.game;
      if (framework) {
        // Clean up any framework resources
        if (typeof framework.cleanup === 'function') {
          framework.cleanup();
        }
        
        // Cancel active animations
        if (framework.animationId) {
          cancelAnimationFrame(framework.animationId);
        }
      }
      
      console.log(`GameAPI: Cleaned up resources for game instance ${gameId}`);
    } catch (error) {
      console.error(`GameAPI: Error cleaning up game instance ${gameId}:`, error);
    }
  }
  
  /**
   * Save game state before reloading
   * @param {string} gameId - ID of the game to save state for
   * @private
   */
  saveGameStateBeforeReload(gameId) {
    if (!gameId || !this.services.stateManager) return;
    
    try {
      console.log(`GameAPI: Saving state for game ${gameId} before reload`);
      
      // Save state using state manager
      this.saveGameState(gameId);
      
      // You could add more specific handling here if needed
    } catch (error) {
      console.error(`GameAPI: Error saving state for game ${gameId} before reload:`, error);
    }
  }
}

// Export as ES module
export default GameAPI;