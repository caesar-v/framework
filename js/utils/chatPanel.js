/**
 * Chat Panel Manager
 * Handles the sliding chat panel with watchers.io integration
 */

class ChatPanelManager {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      watchersUrl: 'https://chat.watchers.io/?roomId=1234&userId=player&apikey=2d632551-ab91-49cd-862f-b1770c28acab&branding=%7B%22branding%22%3A%7B%22value%22%3A%22rgba(252%2C%20227%2C%203%2C%201)%22%7D%2C%22background%22%3A%7B%22chat%22%3A%7B%22value%22%3A%22rgba(255%2C%20255%2C%20255%2C%201)%22%7D%2C%22panel%22%3A%7B%22value%22%3A%22rgba(248%2C%20248%2C%20248%2C%201)%22%7D%7D%2C%22button%22%3A%7B%22primary%22%3A%7B%22background%22%3A%7B%22default%22%3A%7B%22value%22%3A%22rgba(252%2C%20227%2C%203%2C%201)%22%7D%7D%7D%7D%7D', // Watchers.io URL with provided API key and branding
      panelSelector: '#chat-panel',
      toggleSelector: '#chat-toggle',
      headerChatSelector: '#chat-header-button',
      closeSelector: '#close-chat',
      playgroundSelector: '.playground-zone',
      iframeSelector: '#watchers-chat',
      chatOpenClass: 'chat-open',
      activePanelClass: 'active',
      activeButtonClass: 'active',
      ...options
    };
    
    // Initialize state
    this.isChatOpen = false;
    
    // Initialize elements
    this.elements = {
      panel: document.querySelector(this.config.panelSelector),
      toggle: document.querySelector(this.config.toggleSelector),
      headerChat: document.querySelector(this.config.headerChatSelector),
      close: document.querySelector(this.config.closeSelector),
      playground: document.querySelector(this.config.playgroundSelector),
      gameContent: document.querySelector('.game-content'),
      iframe: document.querySelector(this.config.iframeSelector)
    };
    
    // Initialize if all required elements are found
    if (this.elements.panel && this.elements.playground && this.elements.headerChat && this.elements.gameContent) {
      this.init();
    } else {
      console.error('Chat panel could not be initialized. Missing elements:', 
        !this.elements.panel ? 'panel' : '',
        !this.elements.playground ? 'playground' : '',
        !this.elements.headerChat ? 'header chat button' : '',
        !this.elements.gameContent ? 'game content' : '');
    }
  }
  
  /**
   * Initialize the chat panel
   */
  init() {
    console.log('Initializing Chat Panel');
    
    // Set up iframe src with properly encoded parameters
    if (this.elements.iframe) {
      // Parse the URL to encode parameters properly
      const url = this.parseWatchersUrl(this.config.watchersUrl);
      this.elements.iframe.src = url;
      
      // Set required iframe attributes
      this.elements.iframe.setAttribute('frameborder', '0');
      this.elements.iframe.setAttribute('allow', 'clipboard-read; clipboard-write; microphone;');
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Listen for window resize to adjust panel
    window.addEventListener('resize', () => this.handleResize());
    
    // Ensure chat is initially closed
    this.closeChat();
    
    // Check if auth is already available and user logged in
    setTimeout(() => {
      if (window.authManager && window.authManager.isUserLoggedIn()) {
        // Make panel visible (but not open) for logged-in users
        if (this.elements.panel) {
          this.elements.panel.style.display = '';
          this.elements.panel.style.opacity = '0';
          this.elements.panel.style.maxWidth = '0';
        }
      }
    }, 500);
    
    console.log('Chat Panel initialized successfully');
  }
  
  /**
   * Parse and encode watchers.io URL parameters
   * @param {string} url - The raw URL
   * @returns {string} - The encoded URL
   */
  parseWatchersUrl(url) {
    try {
      // Extract base URL and parameters
      const [baseUrl, queryParams] = url.split('?');
      
      if (!queryParams) return url;
      
      // Parse parameters
      const params = new URLSearchParams(queryParams);
      const encodedParams = new URLSearchParams();
      
      // Encode each parameter
      for (const [key, value] of params.entries()) {
        encodedParams.append(key, encodeURIComponent(value));
      }
      
      return `${baseUrl}?${encodedParams.toString()}`;
    } catch (error) {
      console.error('Error encoding watchers.io URL:', error);
      return url;
    }
  }
  
  /**
   * Set up event listeners for chat toggle and close buttons
   */
  setupEventListeners() {
    // Header chat button
    this.elements.headerChat.addEventListener('click', () => this.toggleChat());
    
    // Close chat button
    if (this.elements.close) {
      this.elements.close.addEventListener('click', () => this.closeChat());
    }
    
    // Escape key to close chat
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isChatOpen) {
        this.closeChat();
      }
    });
    
    // Listen for login/logout events to show/hide chat
    window.addEventListener('userLogin', () => {
      // Make chat panel available but don't open it automatically
      if (this.elements.panel) {
        // Keep the panel collapsed but make it available
        this.elements.panel.style.display = '';
        this.elements.panel.style.opacity = '0';
        this.elements.panel.style.maxWidth = '0';
      }
    });
    
    window.addEventListener('userLogout', () => {
      // Close chat if open and hide panel
      this.closeChat();
      if (this.elements.panel) {
        // Completely hide the panel for logged out users
        this.elements.panel.style.display = 'none';
      }
    });
  }
  
  /**
   * Toggle the chat panel open/closed
   */
  toggleChat() {
    if (this.isChatOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  /**
   * Open the chat panel
   */
  openChat() {
    // First check if user is logged in
    if (window.authManager && !window.authManager.isUserLoggedIn()) {
      console.log('Cannot open chat - user not logged in');
      return; // Don't open chat if user is not logged in
    }
    
    if (this.elements.panel) {
      this.elements.panel.classList.add(this.config.activePanelClass);
      // Force display and opacity for the panel
      this.elements.panel.style.display = '';
      this.elements.panel.style.opacity = '1';
      this.elements.panel.style.maxWidth = '350px';
    }
    
    if (this.elements.playground) {
      this.elements.playground.classList.add(this.config.chatOpenClass);
    }
    
    // Add the chat-open class to the game-content for the three-column layout
    if (this.elements.gameContent) {
      this.elements.gameContent.classList.add(this.config.chatOpenClass);
    }
    
    // Update button states
    if (this.elements.headerChat) {
      this.elements.headerChat.classList.add(this.config.activeButtonClass);
    }
    
    this.isChatOpen = true;
    
    // If iframe exists and not already loaded, load it now
    if (this.elements.iframe && this.elements.iframe.src === 'about:blank') {
      const encodedUrl = this.parseWatchersUrl(this.config.watchersUrl);
      this.elements.iframe.src = encodedUrl;
    }
    
    // Trigger window resize to update canvas sizing
    window.dispatchEvent(new Event('resize'));
  }
  
  /**
   * Close the chat panel
   */
  closeChat() {
    if (this.elements.panel) {
      this.elements.panel.classList.remove(this.config.activePanelClass);
      // For logged in users, we keep the panel available but collapsed
      if (window.authManager && window.authManager.isUserLoggedIn()) {
        this.elements.panel.style.display = '';
        this.elements.panel.style.opacity = '0';
        this.elements.panel.style.maxWidth = '0';
      } else {
        // For logged out users, hide it completely
        this.elements.panel.style.display = 'none';
      }
    }
    
    if (this.elements.playground) {
      this.elements.playground.classList.remove(this.config.chatOpenClass);
    }
    
    // Remove the chat-open class from the game-content
    if (this.elements.gameContent) {
      this.elements.gameContent.classList.remove(this.config.chatOpenClass);
    }
    
    // Update button states
    if (this.elements.headerChat) {
      this.elements.headerChat.classList.remove(this.config.activeButtonClass);
    }
    
    this.isChatOpen = false;
    
    // Trigger window resize to update canvas sizing
    window.dispatchEvent(new Event('resize'));
  }
  
  /**
   * Handle window resize events
   */
  handleResize() {
    // Force a redraw of the game canvas to handle new dimensions
    if (window.gameLoader && window.gameLoader.activeGame && 
        window.gameLoader.activeGame.game && 
        typeof window.gameLoader.activeGame.game.drawCanvas === 'function') {
      setTimeout(() => {
        window.gameLoader.activeGame.game.drawCanvas();
      }, 300); // Delay slightly to allow transition to complete
    }
    
    // Update layout classes based on screen width
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      // Apply appropriate layout class based on screen width
      if (window.innerWidth < 768) {
        if (!gameContainer.classList.contains('mobile')) {
          gameContainer.classList.remove('pc');
          gameContainer.classList.add('mobile');
        }
      } else {
        if (!gameContainer.classList.contains('pc')) {
          gameContainer.classList.remove('mobile');
          gameContainer.classList.add('pc');
        }
      }
    }
  }
  
  /**
   * Update the watchers.io URL
   * @param {string} url - The new URL for the watchers.io iframe
   */
  updateWatchersUrl(url) {
    this.config.watchersUrl = url;
    
    // Update iframe src if it's already loaded
    if (this.elements.iframe && this.isChatOpen) {
      const encodedUrl = this.parseWatchersUrl(url);
      this.elements.iframe.src = encodedUrl;
    }
  }
  
  /**
   * Update chat theme to match current framework theme
   * @param {string} themeName - The theme name (default, pirate, neon, classic)
   */
  updateChatTheme(themeName) {
    // Get theme-specific colors to match with chat
    let brandingColor = '#1475e1'; // Default blue
    
    // Match theme with appropriate branding color
    switch(themeName) {
      case 'pirate':
        brandingColor = '#4A3AFF'; // Pirate theme primary color
        break;
      case 'neon':
        brandingColor = '#00FFDD'; // Neon theme primary color
        break;
      case 'classic':
        brandingColor = '#B8860B'; // Classic theme primary color
        break;
      default:
        brandingColor = '#1475e1'; // Default theme primary color
    }
    
    // Convert to rgba format expected by watchers.io
    const brandingRgba = `rgba(${parseInt(brandingColor.slice(1, 3), 16)}, ${parseInt(brandingColor.slice(3, 5), 16)}, ${parseInt(brandingColor.slice(5, 7), 16)}, 1)`;
    
    // Update URL with new branding color
    try {
      // Extract base URL and parameters
      const [baseUrl, queryParams] = this.config.watchersUrl.split('?');
      const params = new URLSearchParams(queryParams);
      
      // Decode the branding parameter
      let brandingParam = params.get('branding') || '{}';
      brandingParam = decodeURIComponent(brandingParam);
      
      // Parse the branding JSON
      let branding = {};
      try {
        branding = JSON.parse(brandingParam);
      } catch (e) {
        branding = {};
      }
      
      // Update the branding primary color
      if (!branding.branding) {
        branding.branding = {};
      }
      branding.branding.value = brandingRgba;
      
      // Re-encode and update the URL
      params.set('branding', JSON.stringify(branding));
      this.config.watchersUrl = `${baseUrl}?${params.toString()}`;
      
      // Update iframe if it's already loaded
      if (this.elements.iframe && this.isChatOpen) {
        const encodedUrl = this.parseWatchersUrl(this.config.watchersUrl);
        this.elements.iframe.src = encodedUrl;
      }
    } catch (error) {
      console.error('Error updating chat theme:', error);
    }
  }
  
  /**
   * Set user ID for the chat room
   * @param {string} userId - The user ID to set in the chat
   */
  setUserId(userId) {
    try {
      // Parse current URL
      const [baseUrl, queryParams] = this.config.watchersUrl.split('?');
      const params = new URLSearchParams(queryParams);
      
      // Update userId parameter
      params.set('userId', userId);
      
      // Update full URL
      this.config.watchersUrl = `${baseUrl}?${params.toString()}`;
      
      // Update iframe if already loaded
      if (this.elements.iframe && this.isChatOpen) {
        const encodedUrl = this.parseWatchersUrl(this.config.watchersUrl);
        this.elements.iframe.src = encodedUrl;
      }
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }
}

// Initialize chat panel when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create the chat panel manager with your API key
  window.chatPanel = new ChatPanelManager({
    // Watchers.io chat embed URL with your API key, room ID and branding
    watchersUrl: 'https://chat.watchers.io/?roomId=1234&userId=player&apikey=2d632551-ab91-49cd-862f-b1770c28acab&branding=%7B%22branding%22%3A%7B%22value%22%3A%22rgba(252%2C%20227%2C%203%2C%201)%22%7D%2C%22background%22%3A%7B%22chat%22%3A%7B%22value%22%3A%22rgba(255%2C%20255%2C%20255%2C%201)%22%7D%2C%22panel%22%3A%7B%22value%22%3A%22rgba(248%2C%20248%2C%20248%2C%201)%22%7D%7D%2C%22button%22%3A%7B%22primary%22%3A%7B%22background%22%3A%7B%22default%22%3A%7B%22value%22%3A%22rgba(252%2C%20227%2C%203%2C%201)%22%7D%7D%7D%7D%7D'
  });
  
  console.log('Chat Panel Manager loaded');
});