/**
 * Search Manager
 * Handles game search functionality
 */

class SearchManager {
  constructor() {
    // Initialize elements
    this.elements = {
      searchInput: document.getElementById('game-search'),
      clearButton: document.getElementById('clear-search')
    };
    
    // Game data - will be populated from the game registry
    this.games = [];
    
    // Initialize if elements are found
    if (this.elements.searchInput && this.elements.clearButton) {
      this.init();
    } else {
      console.error('Search Manager could not be initialized. Missing elements.');
    }
  }
  
  /**
   * Initialize the search manager
   */
  init() {
    console.log('Initializing Search Manager');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load games from the game registry when available
    this.loadGames();
    
    console.log('Search Manager initialized successfully');
  }
  
  /**
   * Load games from the game registry
   */
  loadGames() {
    // Wait for gameLoader to be available
    if (window.gameLoader && window.gameLoader.gameRegistry) {
      this.games = Object.keys(window.gameLoader.gameRegistry).map(key => ({
        id: key,
        name: window.gameLoader.gameRegistry[key].name || key
      }));
      console.log('Games loaded for search:', this.games);
    } else {
      // If not available yet, wait and try again
      setTimeout(() => this.loadGames(), 500);
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', () => this.handleSearch());
      this.elements.searchInput.addEventListener('focus', () => this.handleFocus());
    }
    
    // Clear button
    if (this.elements.clearButton) {
      this.elements.clearButton.addEventListener('click', () => this.clearSearch());
    }
    
    // Listen for game registry updates
    window.addEventListener('gamesLoaded', () => this.loadGames());
  }
  
  /**
   * Handle search input changes
   */
  handleSearch() {
    const query = this.elements.searchInput.value.trim().toLowerCase();
    
    // Show/hide clear button based on input
    if (query.length > 0) {
      this.elements.clearButton.style.display = 'flex';
    } else {
      this.elements.clearButton.style.display = 'none';
    }
    
    // If search is empty, skip filtering
    if (query.length === 0) {
      this.resetGameFilter();
      return;
    }
    
    // Filter games based on search query
    const results = this.games.filter(game => 
      game.name.toLowerCase().includes(query)
    );
    
    // Do something with results (like showing suggestions)
    console.log('Search results:', results);
    
    // If we have an exact match and Enter is pressed, load that game
    if (this.elements.searchInput.addEventListener) {
      this.elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const exactMatch = results.find(game => 
            game.name.toLowerCase() === query
          );
          
          if (exactMatch) {
            console.log('Loading game:', exactMatch.id);
            if (window.gameLoader) {
              window.gameLoader.loadGame(exactMatch.id);
              this.clearSearch();
            }
          }
        }
      }, { once: true });
    }
  }
  
  /**
   * Handle input focus
   */
  handleFocus() {
    // Additional behavior when search is focused
    console.log('Search focused');
  }
  
  /**
   * Clear the search input
   */
  clearSearch() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
      this.elements.clearButton.style.display = 'none';
      this.resetGameFilter();
    }
  }
  
  /**
   * Reset any game filtering
   */
  resetGameFilter() {
    // Reset any filter effects on the game display
    console.log('Search filter reset');
  }
  
  /**
   * Search for games
   * @param {string} query - The search query
   * @returns {Array} - Array of matching games
   */
  searchGames(query) {
    if (!query || query.trim().length === 0) {
      return this.games;
    }
    
    query = query.trim().toLowerCase();
    
    return this.games.filter(game => 
      game.name.toLowerCase().includes(query)
    );
  }
}

// Initialize search manager when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.searchManager = new SearchManager();
  console.log('Search Manager loaded');
});