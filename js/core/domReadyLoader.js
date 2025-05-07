/**
 * DOM Ready Loader - Ensures modules are only loaded after DOM is fully loaded
 * Prevents race conditions with HTML elements needed by modules
 */

(function() {
  // Create loader if it doesn't exist
  if (typeof window.domReadyLoader !== 'undefined') {
    console.log('DOM Ready Loader already initialized, not reinitializing');
    return;
  }
  
  const domReadyLoader = {
    initialized: false,
    
    /**
     * Initialize the DOM Ready Loader
     * @returns {Promise<boolean>} Promise resolving to initialization success
     */
    init: function() {
      console.log('DOM Ready Loader: Initializing...');
      
      return new Promise((resolve) => {
        if (this.initialized) {
          console.log('DOM Ready Loader: Already initialized');
          resolve(true);
          return;
        }
        
        // Check if DOM is ready, otherwise wait for it
        if (document.readyState === 'loading') {
          console.log('DOM Ready Loader: DOM still loading, adding event listener');
          document.addEventListener('DOMContentLoaded', () => {
            this.loadModules().then(resolve);
          });
        } else {
          console.log('DOM Ready Loader: DOM already loaded, loading modules directly');
          this.loadModules().then(resolve);
        }
      });
    },
    
    /**
     * Load core framework modules in order
     * @returns {Promise<boolean>} Promise resolving to true if modules were loaded
     */
    loadModules: async function() {
      console.log('DOM Ready Loader: Loading core modules');
      
      try {
        // Mark as initialized to prevent duplicate loading
        this.initialized = true;
        
        // Try to load bootstrap modules first
        try {
          await import('../modulePathResolver.js').catch(err => {
            console.warn('DOM Ready Loader: ModulePathResolver not available, skipping');
          });
        } catch (error) {
          console.warn('DOM Ready Loader: Error loading bootstrap modules:', error);
        }
        
        // Try to load core modules
        try {
          // Import game framework core
          await import('./gameFramework.js').catch(err => {
            console.warn('DOM Ready Loader: GameFramework not available, will try fallback');
          });
          
          // Import game loader
          await import('./gameLoader.js').catch(err => {
            console.warn('DOM Ready Loader: GameLoader not available, will try fallback');
          });
          
          // Start global framework if available
          if (window.frameworkStarter && typeof window.frameworkStarter.start === 'function') {
            window.frameworkStarter.start();
          } else if (window.gameInitializer && typeof window.gameInitializer.init === 'function') {
            window.gameInitializer.init();
          } else {
            console.warn('DOM Ready Loader: Framework starter not available');
          }
        } catch (error) {
          console.error('DOM Ready Loader: Error loading core modules:', error);
          
          // Try fallback if main modules failed
          try {
            // Simple display for the canvas if modules failed
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Set canvas size
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                
                // Draw recovery message
                ctx.fillStyle = '#0d1117';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#58a6ff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Module Loading Error', canvas.width / 2, canvas.height / 2 - 30);
                
                ctx.fillStyle = '#e6edf3';
                ctx.font = '16px Arial';
                ctx.fillText('Try loading standalone.html instead', canvas.width / 2, canvas.height / 2 + 10);
                
                ctx.fillStyle = '#8b949e';
                ctx.font = '14px Arial';
                ctx.fillText('Or run ./start-server.sh for proper MIME types', canvas.width / 2, canvas.height / 2 + 40);
              }
            }
          } catch (fallbackError) {
            console.error('DOM Ready Loader: Even fallback display failed:', fallbackError);
          }
          
          return false;
        }
        
        console.log('DOM Ready Loader: All modules loaded successfully');
        return true;
      } catch (error) {
        console.error('DOM Ready Loader: Unexpected error during module loading:', error);
        return false;
      }
    },
    
    /**
     * Recovery method for error handling
     * @returns {Promise<boolean>} Promise resolving to true if recovery was successful
     */
    recover: async function() {
      console.log('DOM Ready Loader: Attempting recovery');
      
      try {
        // Reset initialization flag and try again
        this.initialized = false;
        const result = await this.init();
        return result;
      } catch (error) {
        console.error('DOM Ready Loader: Recovery failed:', error);
        return false;
      }
    }
  };
  
  // Register globally
  window.domReadyLoader = domReadyLoader;
  
  // Auto-initialize if document is ready
  if (document.readyState !== 'loading') {
    setTimeout(() => {
      domReadyLoader.init()
        .catch(error => {
          console.error('DOM Ready Loader: Auto-initialization error:', error);
        });
    }, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        domReadyLoader.init()
          .catch(error => {
            console.error('DOM Ready Loader: Auto-initialization error:', error);
          });
      }, 100);
    });
  }
  
  console.log('DOM Ready Loader module loaded');
})();