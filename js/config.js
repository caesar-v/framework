/**
 * Global configuration for the game framework
 */

const GameConfig = {
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
  }
};

// Make available globally
window.GameConfig = GameConfig;