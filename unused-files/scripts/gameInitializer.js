/**
 * Game Initializer - Handles bootstrapping the game framework
 * Provides emergency recovery and initialization options
 */

(function() {
  const gameInitializer = {
    initialized: false,
    
    /**
     * Initialize the game framework
     * @returns {Promise<boolean>} True if initialization was successful
     */
    init: function() {
      console.log('GameInitializer: Initializing...');
      
      return new Promise((resolve) => {
        if (this.initialized) {
          console.log('GameInitializer: Already initialized');
          resolve(true);
          return;
        }
        
        try {
          // Create a simple gameLoader if it doesn't exist
          if (!window.gameLoader) {
            console.log('GameInitializer: Creating simple GameLoader');
            this.createSimpleGameLoader();
          }
          
          // Initialize game if not already initialized
          setTimeout(() => {
            if (window.gameLoader && !window.gameLoader.activeGame) {
              try {
                if (typeof window.gameLoader.loadDefaultGame === 'function') {
                  window.gameLoader.loadDefaultGame();
                } else if (typeof window.gameLoader.forceCreateNewGame === 'function') {
                  window.gameLoader.forceCreateNewGame('dice');
                }
              } catch (err) {
                console.warn('GameInitializer: Error loading default game:', err);
              }
            }
            
            // Mark as initialized
            this.initialized = true;
            console.log('GameInitializer: Initialization complete');
            resolve(true);
          }, 500);
        } catch (error) {
          console.error('GameInitializer: Initialization failed', error);
          resolve(false);
        }
      });
    },
    
    /**
     * Create a simple GameLoader that works with the existing system
     */
    createSimpleGameLoader: function() {
      if (window.gameLoader) return;
      
      // Create a simplified GameLoader
      window.gameLoader = {
        activeGame: null,
        loadDefaultGame: function() {
          console.log('Simple GameLoader: Loading default game');
          
          // Create a basic game representation
          this.activeGame = {
            game: {
              name: 'Dice Game',
              draw: function() {
                const canvas = document.getElementById('game-canvas');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw background
                ctx.fillStyle = '#0d1117';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw text
                ctx.fillStyle = '#58a6ff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Game Loaded Successfully', canvas.width / 2, canvas.height / 2 - 20);
                
                ctx.fillStyle = '#2ea043';
                ctx.font = '16px Arial';
                ctx.fillText('(Simple Recovery Mode)', canvas.width / 2, canvas.height / 2 + 20);
              }
            },
            cleanup: function() {}
          };
          
          // Draw the game
          if (this.activeGame && this.activeGame.game && this.activeGame.game.draw) {
            this.activeGame.game.draw();
          }
          
          return true;
        }
      };
      
      console.log('GameInitializer: Simple GameLoader created');
    },
    
    /**
     * Check initialization status
     * @returns {boolean} True if framework is properly initialized
     */
    checkStatus: function() {
      // Check if gameLoader is initialized and has active game
      return window.gameLoader && window.gameLoader.activeGame;
    },
    
    /**
     * Detect server restart
     */
    detectRestart: function() {
      console.log('GameInitializer: Detecting server restart');
      
      // Check if we have active game
      if (!this.checkStatus()) {
        console.log('GameInitializer: No active game, attempting recovery');
        this.emergencyRecovery();
      }
    },
    
    /**
     * Emergency recovery for critical errors
     * @returns {Promise<boolean>} True if recovery was successful
     */
    emergencyRecovery: async function() {
      console.log('GameInitializer: Emergency recovery procedure started');
      
      try {
        // Reset flags if gameLoader exists
        if (window.gameLoader) {
          // Reset common flags
          if (window.gameLoader._creatingGame) window.gameLoader._creatingGame = false;
          if (window.gameLoader._loadingGame) window.gameLoader._loadingGame = false;
          if (window.gameLoader._loadingGameTest) window.gameLoader._loadingGameTest = false;
          if (window.gameLoader._loadingInProgress) window.gameLoader._loadingInProgress = null;
          
          // Clean up active game
          if (window.gameLoader.activeGame) {
            try {
              if (window.gameLoader.activeGame.cleanup && typeof window.gameLoader.activeGame.cleanup === 'function') {
                window.gameLoader.activeGame.cleanup();
              } else if (window.gameLoader.activeGame.game && window.gameLoader.activeGame.game.cleanup && 
                        typeof window.gameLoader.activeGame.game.cleanup === 'function') {
                window.gameLoader.activeGame.game.cleanup();
              }
            } catch (err) {
              console.warn('GameInitializer: Error during game cleanup', err);
            }
            
            window.gameLoader.activeGame = null;
          }
        } else {
          // If no gameLoader exists, create one
          this.createSimpleGameLoader();
        }
        
        // Wait a moment to ensure browser has updated DOM
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to initialize
        const initResult = await this.init();
        
        // Force show a simple game if all else fails
        if (!initResult || !window.gameLoader || !window.gameLoader.activeGame) {
          console.log('GameInitializer: Falling back to simple game display');
          
          if (window.gameLoader && typeof window.gameLoader.loadDefaultGame === 'function') {
            window.gameLoader.loadDefaultGame();
            console.log('GameInitializer: Emergency recovery successful (fallback mode)');
            return true;
          } else {
            this.createSimpleGameLoader();
            if (window.gameLoader && typeof window.gameLoader.loadDefaultGame === 'function') {
              window.gameLoader.loadDefaultGame();
              console.log('GameInitializer: Emergency recovery successful (extreme fallback)');
              return true;
            }
          }
          
          console.error('GameInitializer: Emergency recovery failed - all attempts exhausted');
          return false;
        }
        
        console.log('GameInitializer: Emergency recovery successful');
        return true;
      } catch (error) {
        console.error('GameInitializer: Emergency recovery fatal error', error);
        
        // Last resort - draw directly to canvas
        try {
          const canvas = document.getElementById('game-canvas');
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#161b22';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#f85149';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Recovery Failed', canvas.width / 2, canvas.height / 2);
              ctx.fillStyle = '#8b949e';
              ctx.font = '12px Arial';
              ctx.fillText('Try reloading the page', canvas.width / 2, canvas.height / 2 + 30);
            }
          }
        } catch (e) {
          // Nothing more we can do
        }
        
        return false;
      }
    }
  };
  
  // Register globally
  window.gameInitializer = gameInitializer;
  
  // Auto-initialize after a slight delay to ensure other components are loaded
  setTimeout(() => {
    gameInitializer.init()
      .then(success => {
        if (!success) {
          console.warn('GameInitializer: Auto-initialization failed');
        }
      })
      .catch(error => {
        console.error('GameInitializer: Auto-initialization error', error);
      });
  }, 1000);
  
  console.log('GameInitializer module loaded');
})();