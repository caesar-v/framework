class GameLoader {
  constructor() {
    console.log('GameLoader constructor called');
    this.gameInstances = {};
    this.activeGame = null;
    
    // Define game registry
    this.gameRegistry = {
      'slot': {
        name: 'Slot Game',
        class: 'SlotGame'
      },
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
      // Set up event listener for game switching
      this.gameSelector.addEventListener('change', () => {
        console.log('Game selection changed to:', this.gameSelector.value);
        this.loadGame(this.gameSelector.value);
      });
      
      // Load the default game
      console.log('Loading default game:', this.gameSelector.value);
      this.loadGame(this.gameSelector.value);
    } else {
      console.error('Game selector not found, cannot load games');
    }
  }

  loadGame(gameType) {
    // Prevent loading in progress from being triggered multiple times
    if (this._loadingInProgress === gameType) {
      console.log(`Already loading ${gameType}, ignoring duplicate request`);
      return;
    }
    
    console.log(`Loading game: ${gameType}`);
    
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
        
        // Try to wait and retry once if game classes might be loading
        setTimeout(() => {
          const retryGameClass = window[className];
          if (retryGameClass) {
            console.log(`Game class ${className} found after retry!`);
            try {
              this.gameInstances[gameType] = new retryGameClass();
              // Clear the loading flag
              this._loadingInProgress = null;
              // Activate the game after a short delay to let it initialize
              setTimeout(() => this.activateGame(gameType), 100);
            } catch (retryError) {
              console.error(`Failed to create game instance on retry:`, retryError);
              this._loadingInProgress = null;
            }
          } else {
            console.error(`Game class ${className} still not found after retry`);
            this._loadingInProgress = null;
          }
        }, 500);
        
        return;
      }
      
      console.log(`Creating new instance of ${className}`);
      
      // Create a try/catch block for each game initialization
      try {
        this.gameInstances[gameType] = new GameClass();
        
        // Wait for a moment to allow game to fully initialize
        setTimeout(() => {
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
    }
  }

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
      // Try to load it again
      setTimeout(() => this.loadGame(gameType), 300);
      return;
    }
    
    // Don't do anything if it's already the active game
    if (this.activeGame === this.gameInstances[gameType]) {
      console.log(`${gameType} is already the active game`);
      return;
    }

    // Save current game state if there is an active game
    if (this.activeGame) {
      console.log(`Switching from existing game to ${gameType}`);
      
      try {
        // Get the current game type
        const currentGameType = Object.keys(this.gameInstances).find(
          key => this.gameInstances[key] === this.activeGame
        );
        
        if (currentGameType) {
          this.saveGameState(currentGameType);
        }

        // Add a fade-out animation
        const container = document.querySelector('#game-container');
        if (container) {
          container.classList.add('fade-out');
        }

        // Wait for animation to complete
        setTimeout(() => {
          try {
            // Set new active game
            this.activeGame = this.gameInstances[gameType];

            // Restore its state
            this.restoreGameState(gameType);

            // Update game title and reload UI
            const titleElement = document.querySelector('.game-title');
            if (titleElement) {
              titleElement.textContent = this.gameRegistry[gameType].name;
            }

            // Redraw everything if game has a drawCanvas method
            if (this.activeGame.game && typeof this.activeGame.game.drawCanvas === 'function') {
              this.activeGame.game.drawCanvas();
            } else {
              console.warn(`${gameType} game doesn't have a drawCanvas method`);
            }

            // Remove fade-out and add fade-in
            if (container) {
              container.classList.remove('fade-out');
              container.classList.add('fade-in');

              // Remove fade-in class after animation completes
              setTimeout(() => {
                container.classList.remove('fade-in');
              }, 500);
            }
            
            console.log(`Successfully activated ${gameType}`);
            
            // Update the game selector value to match the current game
            if (this.gameSelector && this.gameSelector.value !== gameType) {
              this.gameSelector.value = gameType;
            }
          } catch (error) {
            console.error(`Error during game activation phase 2:`, error);
          }
        }, 300);
      } catch (error) {
        console.error(`Error during game activation phase 1:`, error);
      }
    } else {
      // No active game, just set the new one
      console.log(`No active game, setting ${gameType} as active`);
      try {
        this.activeGame = this.gameInstances[gameType];
        this.restoreGameState(gameType);
        
        // Update the game selector value to match the current game
        if (this.gameSelector && this.gameSelector.value !== gameType) {
          this.gameSelector.value = gameType;
        }
        
        console.log(`Successfully activated ${gameType} (no previous game)`);
      } catch (error) {
        console.error(`Error during initial game activation:`, error);
      }
    }
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
  saveGameState(gameType) {
    if (this.gameInstances[gameType] && this.gameInstances[gameType].game) {
      const gameState = this.gameInstances[gameType].game.state;
      localStorage.setItem(`game_state_${gameType}`, JSON.stringify(gameState));
    }
  }
  restoreGameState(gameType) {
    const savedState = localStorage.getItem(`game_state_${gameType}`);
    if (savedState && this.gameInstances[gameType] && this.gameInstances[gameType].game) {
      try {
        const parsedState = JSON.parse(savedState);
        // Merge saved state with default state
        Object.assign(this.gameInstances[gameType].game.state, parsedState);

        // Update UI to reflect restored state
        this.gameInstances[gameType].game.updateBalance();
        this.gameInstances[gameType].game.updatePotentialWin();
      } catch (e) {
        console.error('Failed to restore game state:', e);
      }
    }
  }
}

// Make the GameLoader available globally
window.GameLoader = GameLoader;

