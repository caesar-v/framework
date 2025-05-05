/**
 * Debug Manager
 * Manages debug state and logging for the game framework
 */

(function() {
  // Create a global debug manager object
  window.debugManager = {
    // Default debug state
    isDebugEnabled: false,
    
    // Original console methods
    originalConsole: {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    },
    
    // Initialize the debug manager
    init: function() {
      this.setupToggle();
      this.setupTestButton();
      this.setupDebugButton();
      this.applyDebugState();
    },
    
    // Set up the debug toggle button
    setupToggle: function() {
      const debugToggle = document.getElementById('debug-toggle');
      if (!debugToggle) {
        return;
      }
      
      // Set initial state based on localStorage (if available)
      if (localStorage.getItem('debugEnabled') === 'true') {
        debugToggle.checked = true;
        this.isDebugEnabled = true;
      }
      
      // Add event listener to toggle
      debugToggle.addEventListener('change', () => {
        this.isDebugEnabled = debugToggle.checked;
        
        // Save state to localStorage
        try {
          localStorage.setItem('debugEnabled', this.isDebugEnabled);
        } catch (e) {
          // Ignore storage errors
        }
        
        this.applyDebugState();
        
        // Show status message
        this.showStatusMessage(`Debug mode ${this.isDebugEnabled ? 'enabled' : 'disabled'}`);
      });
    },
    
    // Set up the autotest button
    setupTestButton: function() {
      const autotestButton = document.getElementById('autotest-button');
      if (!autotestButton) {
        return;
      }
      
      // Add event listener to button
      autotestButton.addEventListener('click', () => {
        // Show status message
        this.showStatusMessage('Running tests...');
        
        // Enable debug mode temporarily if not enabled
        const wasDebugEnabled = this.isDebugEnabled;
        if (!wasDebugEnabled) {
          this.isDebugEnabled = true;
          this.applyDebugState();
        }
        
        // Run tests
        if (window.test && typeof window.test.runAllTests === 'function') {
          window.test.runAllTests();
          this.showStatusMessage('Tests completed!');
        } else {
          this.showStatusMessage('Test module not available!', true);
        }
        
        // Restore debug state if we changed it
        if (!wasDebugEnabled) {
          setTimeout(() => {
            this.isDebugEnabled = wasDebugEnabled;
            this.applyDebugState();
          }, 5000); // Delay to allow test output to be visible
        }
      });
    },
    
    // Set up the debug analysis button
    setupDebugButton: function() {
      const debugButton = document.getElementById('debug-button');
      if (!debugButton) {
        return;
      }
      
      // Add event listener to button
      debugButton.addEventListener('click', () => {
        // Clear console and run analysis
        console.clear();
        console.log('%c Debug Analysis', 'background: #222; color: #bada55; font-size: 16px; padding: 10px;');
        
        // Enable debug mode temporarily if not enabled
        const wasDebugEnabled = this.isDebugEnabled;
        if (!wasDebugEnabled) {
          this.isDebugEnabled = true;
          this.applyDebugState();
        }
        
        // Run framework analysis
        if (window.debug && typeof window.debug.analyzeFramework === 'function') {
          window.debug.analyzeFramework();
          this.showStatusMessage('Debug analysis complete!');
        } else {
          this.showStatusMessage('Debug module not available!', true);
        }
        
        // Restore debug state if we changed it
        if (!wasDebugEnabled) {
          setTimeout(() => {
            this.isDebugEnabled = wasDebugEnabled;
            this.applyDebugState();
          }, 5000); // Delay to allow debug output to be visible
        }
      });
    },
    
    // Apply the current debug state to the console methods
    applyDebugState: function() {
      if (this.isDebugEnabled) {
        // Restore original console methods
        console.log = this.originalConsole.log;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
      } else {
        // Override console methods to suppress output
        console.log = function() {};
        console.info = function() {};
        console.warn = function() {};
        // Keep error logging active for critical issues
        console.error = this.originalConsole.error;
      }
      
      console.error = this.originalConsole.error;
      
      // Let the game know about debug state
      if (window.debug) {
        window.debug.isDebugEnabled = this.isDebugEnabled;
      }
    },
    
    // Show a status message to the user
    showStatusMessage: function(message, isError = false) {
      // Use the global showStatusMessage if available, otherwise use local implementation
      if (window.showStatusMessage && typeof window.showStatusMessage === 'function') {
        window.showStatusMessage(message, isError);
        return;
      }
      
      // Local implementation as fallback
      const statusMsg = document.createElement('div');
      statusMsg.textContent = message;
      statusMsg.style.position = 'fixed';
      statusMsg.style.bottom = '70px';
      statusMsg.style.right = '10px';
      statusMsg.style.background = isError ? 'rgba(255,0,0,0.7)' : 'rgba(0,0,0,0.7)';
      statusMsg.style.color = 'white';
      statusMsg.style.padding = '5px 10px';
      statusMsg.style.borderRadius = '4px';
      statusMsg.style.zIndex = '10000';
      
      document.body.appendChild(statusMsg);
      
      setTimeout(() => {
        statusMsg.remove();
      }, 3000);
    }
  };
  
  // Initialize when the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    window.debugManager.init();
  });
})();