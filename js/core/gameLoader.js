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
    console.log(`Loading game: ${gameType}`);
    
    // If already loaded, just activate it
    if (this.gameInstances[gameType]) {
      console.log(`Game ${gameType} already loaded, activating it`);
      this.activateGame(gameType);
      return;
    }

    // Check if game type exists in registry
    if (!this.gameRegistry[gameType]) {
      console.error('Unknown game type:', gameType);
      return;
    }

    try {
      const className = this.gameRegistry[gameType].class;
      console.log(`Looking for game class: ${className}`);
      
      // Verify the game class exists in the global scope
      const availableClasses = Object.keys(window).filter(k => k.includes('Game'));
      console.log('Available game classes:', availableClasses);
      
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
              this.activateGame(gameType);
            } catch (retryError) {
              console.error(`Failed to create game instance on retry:`, retryError);
            }
          } else {
            console.error(`Game class ${className} still not found after retry`);
          }
        }, 500);
        
        return;
      }
      
      console.log(`Creating new instance of ${className}`);
      this.gameInstances[gameType] = new GameClass();

      // Activate the game
      this.activateGame(gameType);

      console.log(`Loaded ${gameType} game successfully`);
    } catch (error) {
      console.error(`Failed to load game ${gameType}:`, error);
      console.error('Error details:', error.message);
    }
  }

  activateGame(gameType) {
    // Don't do anything if it's already the active game
    if (this.activeGame === this.gameInstances[gameType]) {
      return;
    }

    // Save current game state if there is an active game
    if (this.activeGame) {
      // Get the current game type
      const currentGameType = Object.keys(this.gameInstances).find(
        key => this.gameInstances[key] === this.activeGame
      );
      if (currentGameType) {
        this.saveGameState(currentGameType);
      }

      // Add a fade-out animation
      const container = document.querySelector('#game-container');
      container.classList.add('fade-out');

      // Wait for animation to complete
      setTimeout(() => {
        // Set new active game
        this.activeGame = this.gameInstances[gameType];

        // Restore its state
        this.restoreGameState(gameType);

        // Update game title and reload UI
        document.querySelector('.game-title').textContent =
          this.gameRegistry[gameType].name;

        // Redraw everything
        this.activeGame.game.drawCanvas();

        // Remove fade-out and add fade-in
        container.classList.remove('fade-out');
        container.classList.add('fade-in');

        // Remove fade-in class after animation completes
        setTimeout(() => {
          container.classList.remove('fade-in');
        }, 500);
      }, 300);
    } else {
      // No active game, just set the new one
      this.activeGame = this.gameInstances[gameType];
      this.restoreGameState(gameType);
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

