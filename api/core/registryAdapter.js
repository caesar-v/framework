/**
 * Registry Adapter - A simple adapter that provides compatibility between 
 * GameAPI and GameRegistry by adding missing methods
 */

import GameRegistry from './GameRegistry.js';

/**
 * Enhanced GameRegistry with additional compatibility methods
 * @extends GameRegistry
 */
class EnhancedGameRegistry extends GameRegistry {
  /**
   * Create a new EnhancedGameRegistry
   * @param {Object} options - Registry options
   */
  constructor(options) {
    super(options);
    console.log('EnhancedGameRegistry created: Adding compatibility methods');
  }
  
  /**
   * Get game manifest by ID - compatibility method for GameAPI
   * @param {string} gameId - The game ID to retrieve
   * @returns {Object|null} Game manifest or null if not found
   */
  getGame(gameId) {
    console.log(`EnhancedGameRegistry: getGame called for ${gameId}`);
    // Delegates to the getGameManifest method
    return this.getGameManifest(gameId);
  }
  
  /**
   * Get game manifest by ID - ensures both method names work
   * @param {string} gameId - The game ID to retrieve
   * @returns {Object|null} Game manifest or null if not found
   */
  getGameManifest(gameId) {
    console.log(`EnhancedGameRegistry: getGameManifest called for ${gameId}`);
    
    // First try to use parent method
    const manifest = super.getGameManifest ? super.getGameManifest(gameId) : null;
    
    // If that doesn't work, try our own implementation
    if (!manifest && this.games) {
      // Try to find by exact ID
      const game = this.games.find(g => g.id === gameId);
      if (game) {
        return game;
      }
      
      // Try to find by ID with Game suffix
      const suffixedId = gameId + 'Game';
      const suffixedGame = this.games.find(g => g.id === suffixedId);
      if (suffixedGame) {
        return suffixedGame;
      }
      
      // Try to find by ID without Game suffix
      if (gameId.endsWith('Game')) {
        const baseId = gameId.substring(0, gameId.length - 4);
        const baseGame = this.games.find(g => g.id === baseId);
        if (baseGame) {
          return baseGame;
        }
      }
    }
    
    return manifest;
  }
}

export default EnhancedGameRegistry;