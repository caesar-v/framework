/**
 * UIManager - Handles UI interactions and event listeners
 */
class UIManager {
  /**
   * Initialize the UI manager
   * @param {Object} config - Configuration object
   * @param {Object} state - Current game state
   * @param {Object} elements - DOM elements
   * @param {CanvasManager} canvasManager - Reference to the canvas manager
   * @param {Function} stateUpdateCallback - Function to call when state is updated
   */
  constructor(config, state, elements, canvasManager, _, stateUpdateCallback) {
    this.config = config;
    this.state = state;
    this.elements = elements;
    this.canvasManager = canvasManager;
    this.stateUpdateCallback = stateUpdateCallback;
    this._resizeTimeout = null;
    this._resizeTimeoutObserver = null;
    this._resizeObserver = null;
  }

  /**
   * Set up event listeners for all interactive elements
   */
  setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Helper function to safely add event listeners
    const safeAddEventListener = (element, event, handler) => {
      if (!element) {
        console.error(`Cannot add ${event} listener - element is undefined`);
        return false;
      }
      
      try {
        element.addEventListener(event, handler);
        return true;
      } catch (e) {
        console.error(`Error adding ${event} listener:`, e);
        return false;
      }
    };
    
    // Theme selection
    safeAddEventListener(this.elements.themeSelect, 'change', () => {
      this.changeTheme(this.elements.themeSelect.value);
    });

    // Sound toggle
    safeAddEventListener(this.elements.soundButton, 'click', () => this.toggleSound());

    // Menu handling
    safeAddEventListener(this.elements.menuButton, 'click', () => this.toggleMenu(true));
    safeAddEventListener(this.elements.closeMenu, 'click', () => this.toggleMenu(false));
    safeAddEventListener(this.elements.menuOverlay, 'click', (e) => {
      if (e.target === this.elements.menuOverlay) {
        this.toggleMenu(false);
      }
    });
    
    // Settings panel handling
    safeAddEventListener(this.elements.settingsButton, 'click', () => this.toggleSettingsPanel(true));
    safeAddEventListener(this.elements.closeSettings, 'click', () => this.toggleSettingsPanel(false));
    
    // Close settings panel when clicking Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.settingsPanel.classList.contains('active')) {
        this.toggleSettingsPanel(false);
      }
    });

    // Tab navigation
    if (this.elements.popupTabs) {
      this.elements.popupTabs.forEach(tab => {
        safeAddEventListener(tab, 'click', () => {
          this.switchTab(tab.dataset.tab);
        });
      });
    }

    // Play mode tabs
    safeAddEventListener(this.elements.manualTab, 'click', () => {
      this.state.autoPlay = false;
      this.elements.manualTab.classList.add('active');
      this.elements.autoTab.classList.remove('active');
      this.elements.spinButton.textContent = 'SPIN';
      if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    });

    safeAddEventListener(this.elements.autoTab, 'click', () => {
      this.state.autoPlay = true;
      this.elements.autoTab.classList.add('active');
      this.elements.manualTab.classList.remove('active');
      this.elements.spinButton.textContent = 'AUTO SPIN';
      if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    });

    // Spin button - handled by the game framework directly
    safeAddEventListener(this.elements.spinButton, 'click', () => {
      if (typeof this.config.gameLogic.spin === 'function' && !this.state.isSpinning) {
        // Set spinning state
        this.state.isSpinning = true;
        this.elements.spinButton.textContent = 'SPINNING...';
        
        // Update state
        if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
        
        // Trigger the spin operation
        if (typeof this.config.onSpin === 'function') {
          this.config.onSpin();
        }
      }
    });

    // Bet controls
    safeAddEventListener(this.elements.decreaseBet, 'click', () => {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.max(1, this.state.betAmount - 1);
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
      if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    });

    safeAddEventListener(this.elements.increaseBet, 'click', () => {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.min(this.state.maxBet, this.state.betAmount + 1);
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
      if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    });

    safeAddEventListener(this.elements.halfBet, 'click', () => this.setHalfBet());
    safeAddEventListener(this.elements.doubleBet, 'click', () => this.setDoubleBet());
    safeAddEventListener(this.elements.maxBet, 'click', () => this.setMaxBet());

    // Quick bet buttons
    if (this.elements.quickBets) {
      this.elements.quickBets.forEach(button => {
        safeAddEventListener(button, 'click', () => {
          if (this.state.isSpinning || !button.dataset.bet) return;
          this.state.betAmount = parseInt(button.dataset.bet);
          this.elements.betInput.value = this.state.betAmount;
          this.updatePotentialWin();
          if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
        });
      });
    }

    // Risk level change
    safeAddEventListener(this.elements.riskLevel, 'change', () => {
      if (this.state.isSpinning) return;
      this.state.riskLevel = this.elements.riskLevel.value;
      this.updatePotentialWin();
      if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    });
    
    console.log('All event listeners set up successfully');

    // Set up window resize handling
    this.setupResizeHandlers();
  }

  /**
   * Set up window resize event handlers
   */
  setupResizeHandlers() {
    // Window resize handler - recalculate canvas dimensions
    window.addEventListener('resize', () => {
      // Debounce resize events to avoid performance issues
      if (this._resizeTimeout) {
        clearTimeout(this._resizeTimeout);
      }
      
      this._resizeTimeout = setTimeout(() => {
        console.log('Window resized, updating canvas dimensions');
        
        // Get new viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Get actual screen dimensions when available
        const screenWidth = window.screen ? window.screen.width : viewportWidth;
        const screenHeight = window.screen ? window.screen.height : viewportHeight;
        
        // Get the playground element to calculate canvas dimensions
        const playgroundElement = document.querySelector('.playground-zone');
        
        // Calculate canvas dimensions based on the playground area
        let playgroundWidth = viewportWidth;
        let playgroundHeight = viewportHeight;
        
        if (playgroundElement) {
          // Get the actual available space in the playground (accounting for padding, margin)
          const playgroundRect = playgroundElement.getBoundingClientRect();
          playgroundWidth = playgroundRect.width;
          playgroundHeight = playgroundRect.height;
          
          console.log(`Playground dimensions after resize: ${playgroundWidth}×${playgroundHeight}`);
        } else {
          console.warn('Playground element not found, using viewport dimensions as fallback');
        }
        
        // Update the config with current playground dimensions
        this.config.canvasDimensions = {
          pc: { 
            width: playgroundWidth,
            height: playgroundHeight
          },
          mobile: { 
            width: playgroundWidth,
            height: playgroundHeight
          }
        };
        
        // Get canvas
        const canvas = this.canvasManager.getCanvas().canvas;
        
        // Update canvas size
        const targetDims = this.config.canvasDimensions[this.state.layout];
        
        // Force canvas to fill the entire playground zone
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = targetDims.width;
        canvas.height = targetDims.height;
        
        // Update screen resolution information in settings panel
        this.canvasManager.updateScreenInfo(
          this.elements,
          screenWidth, 
          screenHeight, 
          viewportWidth, 
          viewportHeight
        );
        
        // Redraw canvas with new dimensions
        this.redrawCanvas();
        
        console.log(`Canvas resized to: ${canvas.width}×${canvas.height}`);
        this._resizeTimeout = null;
      }, 150); // debounce delay
    });
    
    // Also add a ResizeObserver to detect size changes in the playground area
    if (window.ResizeObserver) {
      this.setupResizeObserver();
    }
  }

  /**
   * Set up ResizeObserver for the playground area
   */
  setupResizeObserver() {
    const playgroundElement = document.querySelector('.playground-zone');
    if (!playgroundElement) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      // Only proceed if not already handling a resize
      if (this._resizeTimeout) return;
      
      for (const entry of entries) {
        if (entry.target === playgroundElement) {
          // Playground size has changed, update canvas
          const playgroundRect = playgroundElement.getBoundingClientRect();
          const playgroundWidth = playgroundRect.width;
          const playgroundHeight = playgroundRect.height;
          
          console.log(`Playground resized (observer): ${playgroundWidth}×${playgroundHeight}`);
          
          // Use debounce to avoid too many updates
          if (this._resizeTimeoutObserver) {
            clearTimeout(this._resizeTimeoutObserver);
          }
          
          this._resizeTimeoutObserver = setTimeout(() => {
            // Get canvas
            const canvas = this.canvasManager.getCanvas().canvas;
            
            // Update canvas dimensions
            // Force canvas to fill the entire playground zone
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.width = playgroundWidth;
            canvas.height = playgroundHeight;
            
            // Update canvas size in settings panel with playground dimensions
            if (this.elements.canvasSize) {
              this.elements.canvasSize.textContent = `Canvas: ${canvas.width}×${canvas.height} | Playground: ${playgroundWidth}×${playgroundHeight}`;
            }
            
            
            // Redraw canvas
            this.redrawCanvas();
            
            this._resizeTimeoutObserver = null;
          }, 100);
        }
      }
    });
    
    // Start observing the playground
    resizeObserver.observe(playgroundElement);
    
    // Store the observer for cleanup if needed
    this._resizeObserver = resizeObserver;
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    // Clean up ResizeObserver if it exists
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    
    // Clear any pending timeouts
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = null;
    }
    
    if (this._resizeTimeoutObserver) {
      clearTimeout(this._resizeTimeoutObserver);
      this._resizeTimeoutObserver = null;
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    this.elements.soundButton.classList.toggle('active');
    this.elements.soundButton.textContent = this.state.soundEnabled ? '🔊' : '🔈';
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
  }

  /**
   * Toggle the menu overlay
   * @param {boolean} show - Whether to show or hide the menu
   */
  toggleMenu(show) {
    if (show) {
      this.elements.menuOverlay.classList.add('active');
      
      // Close settings panel if it's open
      if (this.elements.settingsPanel.classList.contains('active')) {
        this.toggleSettingsPanel(false);
      }
    } else {
      this.elements.menuOverlay.classList.remove('active');
    }
  }
  
  /**
   * Toggle the settings panel
   * @param {boolean} show - Whether to show or hide the settings panel
   */
  toggleSettingsPanel(show) {
    if (show) {
      this.elements.settingsPanel.classList.add('active');
      
      // Close menu if it's open
      if (this.elements.menuOverlay.classList.contains('active')) {
        this.toggleMenu(false);
      }
    } else {
      this.elements.settingsPanel.classList.remove('active');
    }
  }

  /**
   * Switch between tabs in the popup menu
   * @param {string} tabId - The ID of the tab to switch to
   */
  switchTab(tabId) {
    // Update tab styling
    this.elements.popupTabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update content visibility
    this.elements.tabContents.forEach(content => {
      if (content.id === tabId + '-tab') {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  /**
   * Change the theme of the game
   * @param {string} themeName - The name of the theme to apply
   */
  changeTheme(themeName) {
    this.elements.container.className = `game-container ${this.state.layout}`;
    
    if (themeName !== 'default') {
      this.elements.container.classList.add(`theme-${themeName}`);
    }
    
    this.state.theme = themeName;
    this.redrawCanvas();
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
  }

  /**
   * Switch between PC and mobile layouts
   * @param {string} layout - The layout to switch to ('pc' or 'mobile')
   */
  switchLayout(layout) {
    // Only proceed if layout is actually changing
    if (this.state.layout === layout) {
      console.log(`Already using ${layout} layout, no change needed`);
      return;
    }
    
    console.log(`Switching layout from ${this.state.layout} to ${layout}`);
    this.state.layout = layout;
    
    // Update container classes
    if (layout === 'pc') {
      this.elements.container.classList.remove('mobile');
      this.elements.container.classList.add('pc');
    } else {
      this.elements.container.classList.remove('pc');
      this.elements.container.classList.add('mobile');
    }
    
    // Reinitialize canvas for new dimensions
    this.canvasManager.initCanvas();
    
    // Redraw canvas
    this.redrawCanvas();
    
    // Update state
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
    
    console.log(`Layout switched to ${layout}`);
  }

  /**
   * Set the bet to half of the current bet
   */
  setHalfBet() {
    if (this.state.isSpinning) return;
    this.state.betAmount = Math.max(1, Math.floor(this.state.betAmount / 2));
    this.elements.betInput.value = this.state.betAmount;
    this.updatePotentialWin();
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
  }
  
  /**
   * Double the current bet amount
   */
  setDoubleBet() {
    if (this.state.isSpinning) return;
    // Double the current bet, but don't exceed max bet or current balance
    const doubled = this.state.betAmount * 2;
    this.state.betAmount = Math.min(doubled, this.state.maxBet, this.state.balance);
    this.elements.betInput.value = this.state.betAmount;
    this.updatePotentialWin();
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
  }

  /**
   * Set the bet to the maximum allowed
   */
  setMaxBet() {
    if (this.state.isSpinning) return;
    this.state.betAmount = Math.min(this.state.maxBet, this.state.balance);
    this.elements.betInput.value = this.state.betAmount;
    this.updatePotentialWin();
    if (this.stateUpdateCallback) this.stateUpdateCallback(this.state);
  }

  /**
   * Update the current time display
   */
  updateTime() {
    const now = new Date();
    this.elements.currentTime.textContent = now.toLocaleTimeString();
  }

  /**
   * Calculate the potential win based on bet and risk level
   * @returns {number} - The potential win amount
   */
  calculatePotentialWin() {
    const multiplier = this.config.riskLevels[this.state.riskLevel];
    return this.state.betAmount * multiplier;
  }

  /**
   * Update the potential win display
   */
  updatePotentialWin() {
    this.elements.potentialWin.textContent = this.calculatePotentialWin().toFixed(2);
  }

  /**
   * Update the balance display
   */
  updateBalance() {
    // Format balance (currency icon is now in the HTML)
    this.elements.balanceDisplay.textContent = this.state.balance.toFixed(2);
  }

  /**
   * Redraw the canvas
   */
  redrawCanvas() {
    this.canvasManager.drawWithCanvas2D(this.config.gameLogic.renderGame);
  }
}

// Export the UI manager
window.UIManager = UIManager;