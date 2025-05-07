/**
 * Game Framework Configuration
 * 
 * This module provides global configuration for the framework.
 * It exports a configuration object with default settings for games.
 */

// Define the configuration internally first to prevent duplicate declaration issues
const createGameConfig = () => {
  console.log('Creating GameConfig');
  
  return {
    // Version information
    version: '1.0.0',
    
    // Default configuration for all games
    defaults: {
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      currency: 'LC',
      riskLevels: {
        low: 1.5,
        medium: 3,
        high: 6
      },
      defaultRiskLevel: 'medium',
      autoPlayIntervals: [1.5, 3, 5],  // In seconds
      defaultAutoPlayInterval: 3,      // In seconds
    },
    
    // Game registry
    games: {
      'slot': {
        name: 'Slot Game',
        path: 'games/slotGame.js',
        class: 'SlotGame',
        description: 'A classic slot machine game with various symbols and paylines.'
      },
      'dice': {
        name: 'Dice Game',
        path: 'games/diceGame.js',
        class: 'DiceGame',
        description: 'Roll the dice to match combinations and win prizes.'
      },
      'card': {
        name: 'Card Game',
        path: 'games/cardGame.js',
        class: 'CardGame',
        description: 'Poker-inspired card game with various winning hands.'
      }
    },
    
    // Theme definitions
    themes: {
      'default': {
        name: 'Dark Theme',
        colors: ['#071824', '#071d2a']
      },
      'pirate': {
        name: 'Pirate Theme',
        colors: ['#1E1B4B', '#2D2B55']
      },
      'neon': {
        name: 'Neon Theme',
        colors: ['#0D0221', '#130B2A']
      },
      'classic': {
        name: 'Classic Casino',
        colors: ['#0E0E10', '#1F1F23']
      }
    },
    
    // Layout configuration
    layouts: {
      'pc': {
        name: 'PC',
        dimensions: { width: 1920, height: 1080 }
      },
      'mobile': {
        name: 'Mobile',
        dimensions: { width: 1080, height: 1920 }
      }
    },
    
    /**
     * Gets a registered game configuration by ID
     * @param {string} gameId - The ID of the game to retrieve
     * @returns {Object|null} - Game configuration or null if not found
     */
    getGame: function(gameId) {
      return this.games[gameId] || null;
    },
    
    /**
     * Gets all registered games
     * @returns {Object[]} - Array of game objects
     */
    getAllGames: function() {
      return Object.entries(this.games).map(([id, game]) => ({
        id,
        ...game
      }));
    },
    
    /**
     * Gets a theme configuration by name
     * @param {string} themeName - The name of the theme to retrieve
     * @returns {Object} - Theme configuration or default theme if not found
     */
    getTheme: function(themeName) {
      return this.themes[themeName] || this.themes.default;
    },
    
    /**
     * Gets layout configuration by name
     * @param {string} layoutName - The name of the layout to retrieve
     * @returns {Object} - Layout configuration or pc layout if not found
     */
    getLayout: function(layoutName) {
      return this.layouts[layoutName] || this.layouts.pc;
    }
  };
};

// Only define GameConfig if it's not already defined
if (typeof window.GameConfig === 'undefined') {
  // Create the configuration
  window.GameConfig = createGameConfig();
  console.log('GameConfig: Configuration object created and exported to global scope');
} else {
  console.log('GameConfig: Configuration already defined, not overwriting');
}