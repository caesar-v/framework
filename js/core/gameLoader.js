class GameLoader {
  constructor() {
    console.log('GameLoader constructor called');
    this.gameInstances = {};
    this.activeGame = null;
    
    // Define game registry (SlotGame removed)
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
   */
  initEvents() {
    console.log('Initializing GameLoader events');
    
    // Re-get selector in case it wasn't available in constructor
    if (!this.gameSelector) {
      this.gameSelector = document.getElementById('game-select');
    }
    
    if (this.gameSelector) {
      // Set up simple event listener for game switching
      this.gameSelector.addEventListener('change', () => {
        const selectedGameType = this.gameSelector.value;
        console.log('Game selection changed to:', selectedGameType);
        
        // Use standard game creation for all games
        this.forceCreateNewGame(selectedGameType);
      });
      
      // Load the default game
      console.log('Loading default game:', this.gameSelector.value);
      this.loadGame(this.gameSelector.value);
    } else {
      console.error('Game selector not found, cannot load games');
    }
  }
  
  /**
   * Create a new game instance
   * Simplified implementation without SlotGame references
   */
  forceCreateNewGame(gameType) {
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
        
        // Remove all references to the active game
        this.activeGame = null;
      }
      
      // Remove any cached instance with additional cleanup
      if (this.gameInstances[gameType]) {
        // Special cleanup for specific game types
        try {
          const instance = this.gameInstances[gameType];
          if (instance.cleanup && typeof instance.cleanup === 'function') {
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
      
      // Get the class name from registry
      const className = this.gameRegistry[gameType].class;
      console.log(`Creating new instance of ${className}`);
      
      // Get game class constructor
      const GameClass = window[className];
      
      if (!GameClass) {
        console.error(`Game class ${className} not found!`);
        return;
      }
      
      // Create a new instance of the game
      this.gameInstances[gameType] = new GameClass();
      
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
      
      // Force a redraw of the game canvas
      if (this.activeGame && this.activeGame.game && typeof this.activeGame.game.drawCanvas === 'function') {
        setTimeout(() => {
          try {
            this.activeGame.game.drawCanvas();
          } catch (drawError) {
            console.error('Error during initial canvas draw:', drawError);
          }
        }, 100);
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
   * New method to explicitly force a game switch
   */
  switchToGame(gameType) {
    console.log(`Explicit game switch to: ${gameType}`);
    
    // Try to clean up any existing game
    this.cleanupCurrentGame();
    
    // Check if we've already loaded this game
    if (this.gameInstances[gameType]) {
      console.log(`Game ${gameType} already loaded, destroying and recreating`);
      
      // Completely remove existing instance to force a clean state
      delete this.gameInstances[gameType];
    }
    
    // Load the game as new
    this.loadGame(gameType);
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
        
        // Help with garbage collection
        if (this.activeGame.game) {
          // Clean up any animation frame requests
          if (this.activeGame.animationId) {
            cancelAnimationFrame(this.activeGame.animationId);
          }
        }
        
        this.activeGame = null;
      } catch (e) {
        console.error('Error during game cleanup:', e);
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
    
    this._loadingGame = true;
    this._loadingGameTest = false;
    console.log(`Loading game: ${gameType}`);
    
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
        this.gameInstances[gameType] = new GameClass();
        
        // Wait for a moment to allow game to fully initialize
        setTimeout(() => {
          // Update selector to match the game being loaded
          if (this.gameSelector && this.gameSelector.value !== gameType) {
            console.log(`Updating game selector to ${gameType}`);
            this.gameSelector.value = gameType;
          }
          
          // Check if game framework is ready
          if (this.gameInstances[gameType].game) {
            console.log(`${gameType} game framework initialized successfully`);
            this.activateGame(gameType);
          } else {
            console.warn(`${gameType} game framework not initialized yet, waiting...`);
            // Wait a bit more and check again
            setTimeout(() => {
              if (this.gameInstances[gameType].game) {
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
      // Reset loading flag after a delay
      setTimeout(() => {
        this._loadingGame = false;
        console.log('Game loading lock released');
      }, 500);
    }
  }

  /**
   * Simple direct activation without complex animations or state tracking
   */
  activateGameWithEffects(gameType) {
    console.log(`Activating game: ${gameType}`);
    
    // Before we start, make sure the game instance is properly initialized
    if (!this.gameInstances[gameType] || !this.gameInstances[gameType].game) {
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
      
      // Redraw the game canvas
      if (this.activeGame.game && typeof this.activeGame.game.drawCanvas === 'function') {
        this.activeGame.game.drawCanvas();
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
    
    // Make sure the game instance has a game property
    if (!this.gameInstances[gameType].game) {
      console.error(`Cannot activate ${gameType} - game framework not initialized`);
      // We'll give it a bit more time to initialize
      setTimeout(() => {
        if (this.gameInstances[gameType] && this.gameInstances[gameType].game) {
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
   * Save game state to local storage
   */
  saveGameState(gameType) {
    if (this.gameInstances[gameType] && this.gameInstances[gameType].game) {
      try {
        const gameState = this.gameInstances[gameType].game.state;
        localStorage.setItem(`game_state_${gameType}`, JSON.stringify(gameState));
        console.log(`Saved state for ${gameType}`);
      } catch (error) {
        console.error(`Error saving game state:`, error);
      }
    }
  }
  
  /**
   * Restore game state from local storage
   */
  restoreGameState(gameType) {
    try {
      const savedState = localStorage.getItem(`game_state_${gameType}`);
      if (savedState && this.gameInstances[gameType] && this.gameInstances[gameType].game) {
        const parsedState = JSON.parse(savedState);
        
        // Merge saved state with default state
        Object.assign(this.gameInstances[gameType].game.state, parsedState);

        // Update UI to reflect restored state
        if (typeof this.gameInstances[gameType].game.updateBalance === 'function') {
          this.gameInstances[gameType].game.updateBalance();
        }
        
        if (typeof this.gameInstances[gameType].game.updatePotentialWin === 'function') {
          this.gameInstances[gameType].game.updatePotentialWin();
        }
        
        console.log(`Restored state for ${gameType}`);
      }
    } catch (e) {
      console.error('Failed to restore game state:', e);
    }
  }
}

// Make the GameLoader available globally
window.GameLoader = GameLoader;

