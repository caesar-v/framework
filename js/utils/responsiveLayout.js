/**
 * Responsive Layout Manager
 * Handles responsive layout changes for the game framework
 */

class ResponsiveLayoutManager {
  constructor() {
    // Breakpoints
    this.breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize responsive layout manager
   */
  init() {
    console.log('Initializing Responsive Layout Manager');
    
    // Handle grid layout for game content
    this.setupResponsiveGrid();
    
    // Set up window resize listener
    window.addEventListener('resize', () => this.handleResize());
    
    // Initial check
    this.handleResize();
    
    console.log('Responsive Layout Manager initialized');
  }
  
  /**
   * Set up responsive grid layout
   */
  setupResponsiveGrid() {
    // Find the game content element
    const gameContent = document.querySelector('.game-content');
    if (!gameContent) return;
    
    // Get data attributes for different layouts
    const baseStyle = gameContent.getAttribute('data-base-style');
    const mdStyle = gameContent.getAttribute('data-md-style');
    const lgStyle = gameContent.getAttribute('data-lg-style');
    
    // Store original styles
    this.gridStyles = {
      base: baseStyle || gameContent.getAttribute('style'),
      md: mdStyle,
      lg: lgStyle || gameContent.getAttribute('style')
    };
  }
  
  /**
   * Handle window resize events
   */
  handleResize() {
    const width = window.innerWidth;
    
    // Apply appropriate grid styles based on screen size
    this.updateGridLayout(width);
    
    // Update any other responsive elements
    this.updateResponsiveElements(width);
  }
  
  /**
   * Update grid layout based on screen width
   * @param {number} width - Window width
   */
  updateGridLayout(width) {
    const gameContent = document.querySelector('.game-content');
    if (!gameContent || !this.gridStyles) return;
    
    if (width >= this.breakpoints.lg && this.gridStyles.lg) {
      // Desktop layout (3 columns)
      const style = this.gridStyles.lg;
      gameContent.setAttribute('style', style);
      document.body.classList.add('layout-desktop');
      document.body.classList.remove('layout-tablet', 'layout-mobile');
    } else if (width >= this.breakpoints.md && this.gridStyles.md) {
      // Tablet layout (2 columns)
      const style = this.gridStyles.md;
      gameContent.setAttribute('style', style);
      document.body.classList.add('layout-tablet');
      document.body.classList.remove('layout-desktop', 'layout-mobile');
    } else {
      // Mobile layout (1 column)
      const style = this.gridStyles.base;
      gameContent.setAttribute('style', style);
      document.body.classList.add('layout-mobile');
      document.body.classList.remove('layout-desktop', 'layout-tablet');
    }
    
    // Update chat panel visibility - hide on mobile and tablet by default
    this.updateChatVisibility(width);
  }
  
  /**
   * Update chat panel visibility
   * @param {number} width - Window width
   */
  updateChatVisibility(width) {
    // If chat is opened, we need to adjust it for responsive layouts
    const chatPanel = document.getElementById('chat-panel');
    const gameContent = document.querySelector('.game-content');
    
    if (!chatPanel || !gameContent) return;
    
    if (width < this.breakpoints.lg) {
      // On tablet and mobile, we don't show chat by default
      if (gameContent.classList.contains('chat-open')) {
        // If chat is currently open, close it
        if (window.chatPanel && typeof window.chatPanel.closeChat === 'function') {
          window.chatPanel.closeChat();
        }
      }
    }
  }
  
  /**
   * Update various responsive elements
   * @param {number} width - Window width
   */
  updateResponsiveElements(width) {
    // Update betting zone padding based on screen size
    const bettingZone = document.querySelector('.betting-zone');
    if (bettingZone) {
      if (width < this.breakpoints.md) {
        bettingZone.classList.add('compact');
      } else {
        bettingZone.classList.remove('compact');
      }
    }
    
    // Update any other responsive elements as needed
  }
}

// Initialize responsive layout manager when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.responsiveLayoutManager = new ResponsiveLayoutManager();
  console.log('Responsive Layout Manager loaded');
});