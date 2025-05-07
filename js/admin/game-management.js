/**
 * Game Management Module
 * Handles game loading, saving, and other game-related functionality
 */

/**
 * Load all available games
 * @returns {Promise<Array>} Promise that resolves with array of game objects
 */
export async function loadGames() {
  try {
    // First try to load from the GameAPI if available
    if (window.gameAPI) {
      const games = window.gameAPI.getGames();
      return games.map(game => transformGameObject(game));
    }
    
    // Fall back to loading from localStorage or manifest files
    const games = await loadGamesFromStorage();
    return games;
  } catch (error) {
    console.error('Error loading games:', error);
    // Return default games for demo purposes if all else fails
    return getDefaultGames();
  }
}

/**
 * Load games from local storage or manifest files
 * @returns {Promise<Array>} Promise that resolves with array of game objects
 */
async function loadGamesFromStorage() {
  // Try to load from localStorage first
  const storedGames = localStorage.getItem('gameFramework_games');
  if (storedGames) {
    try {
      return JSON.parse(storedGames);
    } catch (error) {
      console.error('Error parsing stored games:', error);
    }
  }
  
  // If no stored games, load from manifest files
  try {
    const manifestPaths = [
      '/games/manifests/dice-game.json',
      '/games/manifests/card-game.json'
    ];
    
    const games = await Promise.all(
      manifestPaths.map(async path => {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load manifest: ${path}`);
          }
          const manifest = await response.json();
          return transformGameObject(manifest);
        } catch (error) {
          console.error(`Error loading manifest ${path}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null entries
    return games.filter(game => game !== null);
  } catch (error) {
    console.error('Error loading games from manifests:', error);
    throw error;
  }
}

/**
 * Transform a game manifest or object into the standard format
 * @param {Object} game Game object or manifest
 * @returns {Object} Standardized game object
 */
function transformGameObject(game) {
  return {
    id: game.id,
    name: game.name,
    version: game.version || '1.0.0',
    description: game.description || '',
    category: game.category || 'game',
    thumbnail: game.thumbnail || '',
    main: game.main || '',
    tags: game.tags || [],
    dependencies: game.dependencies || [],
    assets: game.assets || [],
    config: {
      minBet: game.config?.minBet || 1,
      maxBet: game.config?.maxBet || 500,
      defaultBet: game.config?.defaultBet || 10,
      defaultRiskLevel: game.config?.defaultRiskLevel || 'medium'
    },
    enabled: game.enabled !== false,
    stats: game.stats || {
      plays: 0,
      wins: 0,
      losses: 0,
      totalBet: 0,
      totalWon: 0
    }
  };
}

/**
 * Save game settings
 * @param {Object} gameConfig Game configuration to save
 * @returns {Promise<void>} Promise that resolves when settings are saved
 */
export async function saveGameSettings(gameConfig) {
  try {
    // First try to save using GameAPI if available
    if (window.gameAPI && window.gameAPI.updateGameConfig) {
      await window.gameAPI.updateGameConfig(gameConfig.id, gameConfig);
      return;
    }
    
    // Fall back to saving in localStorage
    let games = [];
    
    // Get existing games
    const storedGames = localStorage.getItem('gameFramework_games');
    if (storedGames) {
      games = JSON.parse(storedGames);
    } else {
      // If no games in storage, load default ones
      games = await loadGames();
    }
    
    // Find and update the specified game
    const gameIndex = games.findIndex(game => game.id === gameConfig.id);
    if (gameIndex !== -1) {
      // Update existing game
      games[gameIndex] = {
        ...games[gameIndex],
        name: gameConfig.name,
        description: gameConfig.description,
        enabled: gameConfig.enabled,
        config: gameConfig.config
      };
    } else {
      // Add new game
      games.push(transformGameObject(gameConfig));
    }
    
    // Save updated games
    localStorage.setItem('gameFramework_games', JSON.stringify(games));
    
    // Attempt to update manifest file (this is a simulated operation)
    console.log(`Game settings for "${gameConfig.name}" saved.`);
  } catch (error) {
    console.error('Error saving game settings:', error);
    throw error;
  }
}

/**
 * Delete a game
 * @param {string} gameId ID of the game to delete
 * @returns {Promise<void>} Promise that resolves when game is deleted
 */
export async function deleteGame(gameId) {
  try {
    // First try to delete using GameAPI if available
    if (window.gameAPI && window.gameAPI.deleteGame) {
      await window.gameAPI.deleteGame(gameId);
      return;
    }
    
    // Fall back to removing from localStorage
    const storedGames = localStorage.getItem('gameFramework_games');
    if (storedGames) {
      let games = JSON.parse(storedGames);
      
      // Filter out the game with the specified ID
      games = games.filter(game => game.id !== gameId);
      
      // Save updated games
      localStorage.setItem('gameFramework_games', JSON.stringify(games));
    }
    
    // Attempt to delete manifest file (this is a simulated operation)
    console.log(`Game with ID "${gameId}" deleted.`);
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
}

/**
 * Upload a new game
 * @param {Object} manifest Game manifest to upload
 * @returns {Promise<void>} Promise that resolves when game is uploaded
 */
export async function uploadGame(manifest) {
  try {
    // First try to upload using GameAPI if available
    if (window.gameAPI && window.gameAPI.uploadGame) {
      await window.gameAPI.uploadGame(manifest);
      return;
    }
    
    // Validate manifest
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: missing required fields (id, name, version)');
    }
    
    // Transform manifest to standard game object
    const gameObject = transformGameObject(manifest);
    
    // Add to localStorage
    let games = [];
    const storedGames = localStorage.getItem('gameFramework_games');
    if (storedGames) {
      games = JSON.parse(storedGames);
      
      // Check if game with same ID already exists
      const existingIndex = games.findIndex(game => game.id === gameObject.id);
      if (existingIndex !== -1) {
        // Update existing game
        games[existingIndex] = gameObject;
      } else {
        // Add new game
        games.push(gameObject);
      }
    } else {
      // No existing games, create new array
      games = [gameObject];
    }
    
    // Save updated games
    localStorage.setItem('gameFramework_games', JSON.stringify(games));
    
    // Attempt to save manifest file (this is a simulated operation)
    console.log(`Game "${manifest.name}" uploaded successfully.`);
  } catch (error) {
    console.error('Error uploading game:', error);
    throw error;
  }
}

/**
 * Get default games for demo purposes
 * @returns {Array} Array of default game objects
 */
function getDefaultGames() {
  return [
    {
      id: 'dice-game',
      name: 'Dice Game',
      version: '1.0.0',
      description: 'A classic dice rolling game where players bet on the outcome of dice rolls',
      category: 'dice',
      thumbnail: 'assets/images/games/dice-thumbnail.png',
      main: 'games/diceGame.js',
      tags: ['dice', 'simple', 'beginner'],
      dependencies: [],
      assets: [
        'assets/images/dice/dice1.png',
        'assets/images/dice/dice2.png',
        'assets/images/dice/dice3.png',
        'assets/images/dice/dice4.png',
        'assets/images/dice/dice5.png',
        'assets/images/dice/dice6.png'
      ],
      config: {
        minBet: 1,
        maxBet: 500,
        defaultBet: 10,
        defaultRiskLevel: 'medium'
      },
      enabled: true,
      stats: {
        plays: 125,
        wins: 52,
        losses: 73,
        totalBet: 1250,
        totalWon: 980
      }
    },
    {
      id: 'card-game',
      name: 'Card Game',
      version: '1.0.0',
      description: 'A simple card game with animated dealing and interactive gameplay',
      category: 'card',
      thumbnail: 'assets/images/games/card-thumbnail.png',
      main: 'games/cardGame.js',
      tags: ['cards', 'poker', 'strategy'],
      dependencies: [],
      assets: [
        'assets/images/cards/deck.png',
        'assets/images/cards/back.png'
      ],
      config: {
        minBet: 5,
        maxBet: 1000,
        defaultBet: 25,
        defaultRiskLevel: 'medium'
      },
      enabled: true,
      stats: {
        plays: 87,
        wins: 32,
        losses: 55,
        totalBet: 2175,
        totalWon: 1600
      }
    },
    {
      id: 'slot-game',
      name: 'Slot Machine',
      version: '0.9.0',
      description: 'A colorful slot machine game with multiple paylines and bonus features',
      category: 'slot',
      thumbnail: 'assets/images/games/slot-thumbnail.png',
      main: 'games/slotGame.js',
      tags: ['slots', 'jackpot', 'casual'],
      dependencies: [],
      assets: [
        'assets/images/slots/reel1.png',
        'assets/images/slots/reel2.png',
        'assets/images/slots/reel3.png'
      ],
      config: {
        minBet: 1,
        maxBet: 100,
        defaultBet: 5,
        defaultRiskLevel: 'high'
      },
      enabled: false,
      stats: {
        plays: 0,
        wins: 0,
        losses: 0,
        totalBet: 0,
        totalWon: 0
      }
    }
  ];
}