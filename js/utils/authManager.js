/**
 * Authentication Manager
 * Handles user authentication UI and state management
 */

class AuthManager {
  constructor() {
    // Initialize state
    this.isLoggedIn = false;
    this.user = null;
    
    // Initialize elements
    this.elements = {
      authControls: document.getElementById('auth-controls'),
      authButtons: document.getElementById('auth-buttons'),
      userInfo: document.getElementById('user-info'),
      username: document.getElementById('username'),
      loginButton: document.getElementById('login-button'),
      signupButton: document.getElementById('signup-button'),
      logoutButton: document.getElementById('logout-button')
    };
    
    // Initialize if all required elements are found
    if (this.elements.authControls && this.elements.authButtons && this.elements.userInfo) {
      this.init();
    } else {
      console.error('Auth manager could not be initialized. Missing elements.');
    }
  }
  
  /**
   * Initialize the auth manager
   */
  init() {
    console.log('Initializing Auth Manager');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check if user is already logged in (e.g., from localStorage)
    this.checkLoggedInState();
    
    console.log('Auth Manager initialized successfully');
  }
  
  /**
   * Set up event listeners for authentication buttons
   */
  setupEventListeners() {
    // Login button
    if (this.elements.loginButton) {
      this.elements.loginButton.addEventListener('click', () => this.showLoginDialog());
    }
    
    // Signup button
    if (this.elements.signupButton) {
      this.elements.signupButton.addEventListener('click', () => this.showSignupDialog());
    }
    
    // Logout button
    if (this.elements.logoutButton) {
      this.elements.logoutButton.addEventListener('click', () => this.logout());
    }
  }
  
  /**
   * Check if the user is already logged in
   */
  checkLoggedInState() {
    // For demo purposes: Check localStorage for saved login state
    const savedUser = localStorage.getItem('luckyCoinsUser');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
        this.isLoggedIn = true;
        this.updateUI();
      } catch (e) {
        console.error('Failed to parse saved user data:', e);
        localStorage.removeItem('luckyCoinsUser');
      }
    }
  }
  
  /**
   * Show login dialog
   */
  showLoginDialog() {
    console.log('Login button clicked');
    // Simple prompt-based login for demo
    const username = prompt('Enter your username:');
    if (username) {
      const password = prompt('Enter your password:');
      if (password) {
        // Demo login: any non-empty username/password will work
        this.loginSuccess({
          username: username,
          id: Date.now().toString()
        });
      }
    }
  }
  
  /**
   * Show signup dialog
   */
  showSignupDialog() {
    console.log('Signup button clicked');
    // Simple prompt-based signup for demo
    const username = prompt('Choose a username:');
    if (username) {
      const password = prompt('Choose a password:');
      if (password) {
        const confirmPassword = prompt('Confirm your password:');
        if (password === confirmPassword) {
          // Demo signup: any matching passwords will work
          this.loginSuccess({
            username: username,
            id: Date.now().toString()
          });
        } else {
          alert('Passwords do not match!');
        }
      }
    }
  }
  
  /**
   * Handle successful login
   * @param {Object} userData - User data from the server
   */
  loginSuccess(userData) {
    this.isLoggedIn = true;
    this.user = userData;
    
    // Save to localStorage for persistence
    localStorage.setItem('luckyCoinsUser', JSON.stringify(userData));
    
    // Update UI
    this.updateUI();
    
    // Notify any listeners
    const event = new CustomEvent('userLogin', { detail: userData });
    window.dispatchEvent(event);
  }
  
  /**
   * Log the user out
   */
  logout() {
    console.log('Logout button clicked');
    
    // Clear user data
    this.isLoggedIn = false;
    this.user = null;
    
    // Clear from localStorage
    localStorage.removeItem('luckyCoinsUser');
    
    // Update UI
    this.updateUI();
    
    // Notify any listeners
    const event = new CustomEvent('userLogout');
    window.dispatchEvent(event);
  }
  
  /**
   * Update the UI based on login state
   */
  updateUI() {
    if (this.isLoggedIn && this.user) {
      // Show user info, hide auth buttons
      this.elements.authButtons.style.display = 'none';
      this.elements.userInfo.style.display = 'flex';
      
      // Update username display
      if (this.elements.username) {
        this.elements.username.textContent = this.user.username;
      }
    } else {
      // Show auth buttons, hide user info
      this.elements.authButtons.style.display = 'flex';
      this.elements.userInfo.style.display = 'none';
    }
  }
  
  /**
   * Check if the user is logged in
   * @returns {boolean} True if the user is logged in
   */
  isUserLoggedIn() {
    return this.isLoggedIn;
  }
  
  /**
   * Get the current user data
   * @returns {Object|null} User data or null if not logged in
   */
  getCurrentUser() {
    return this.user;
  }
}

// Initialize auth manager when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
  console.log('Auth Manager loaded');
});