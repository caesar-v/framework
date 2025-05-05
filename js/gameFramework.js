/**
 * GameFramework - Lightweight framework for game prototyping
 * 
 * This framework provides a structure for quickly prototyping casino-style games
 * with a consistent UI and customizable game logic.
 */

class GameFramework {
    /**
     * Initialize the game framework
     * @param {Object} config - Configuration object for the game
     */
    constructor(config = {}) {
      // Default configuration
      this.config = {
        gameTitle: 'Game Prototype',
        containerSelector: '#game-container',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        currency: '€',
        riskLevels: {
          low: 1.5,
          medium: 3,
          high: 6
        },
        defaultRiskLevel: 'medium',
        canvasBackground: {
          default: ['#071824', '#071d2a'],
          pirate: ['#1E1B4B', '#2D2B55'],
          neon: ['#0D0221', '#130B2A'],
          classic: ['#0E0E10', '#1F1F23']
        },
        themes: ['default', 'pirate', 'neon', 'classic'],
        defaultTheme: 'default',
        canvasDimensions: {
          pc: { width: 1920, height: 1080 },
          mobile: { width: 1080, height: 1920 }
        },
        defaultLayout: 'pc',
        // Default game logic - can be overridden
        gameLogic: {
          spin: null,  // Will be set to this.defaultSpin if not provided
          calculateWin: null,  // Will be set to this.defaultCalculateWin if not provided
          renderGame: null,  // Will be set to this.defaultRenderGame if not provided
          handleWin: null,  // Will be set to this.defaultHandleWin if not provided
          handleLoss: null  // Will be set to this.defaultHandleLoss if not provided
        },
        ...config
      };
  
      // Set default game logic functions if not provided
      if (!this.config.gameLogic.spin) this.config.gameLogic.spin = this.defaultSpin.bind(this);
      if (!this.config.gameLogic.calculateWin) this.config.gameLogic.calculateWin = this.defaultCalculateWin.bind(this);
      if (!this.config.gameLogic.renderGame) this.config.gameLogic.renderGame = this.defaultRenderGame.bind(this);
      if (!this.config.gameLogic.handleWin) this.config.gameLogic.handleWin = this.defaultHandleWin.bind(this);
      if (!this.config.gameLogic.handleLoss) this.config.gameLogic.handleLoss = this.defaultHandleLoss.bind(this);
  
      // Game state
      this.state = {
        theme: this.config.defaultTheme,
        layout: this.config.defaultLayout,
        soundEnabled: true,
        autoPlay: false,
        isSpinning: false,
        betAmount: this.config.initialBet,
        balance: this.config.initialBalance,
        riskLevel: this.config.defaultRiskLevel,
        maxBet: this.config.maxBet
      };
  
      // Canvas context
      this.canvas = null;
      this.ctx = null;
  
      // Initialize the game
      this.init();
    }
  
    /**
     * Initialize the game
     * Set up DOM elements and event listeners
     */
    init() {
      // Set the game title
      document.title = this.config.gameTitle;
      
      // Get references to DOM elements
      this.elements = {
        container: document.querySelector(this.config.containerSelector),
        gameTitle: document.querySelector('.game-title'),
        canvas: document.getElementById('game-canvas'),
        themeSelect: document.getElementById('theme-select'),
        desktopLayout: document.getElementById('desktop'),
        mobileLayout: document.getElementById('mobile'),
        soundButton: document.getElementById('sound-button'),
        menuButton: document.getElementById('menu-button'),
        menuOverlay: document.getElementById('menu-overlay'),
        closeMenu: document.getElementById('close-menu'),
        popupTabs: document.querySelectorAll('.popup-tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        manualTab: document.getElementById('manual-tab'),
        autoTab: document.getElementById('auto-tab'),
        spinButton: document.getElementById('spin-button'),
        currentTime: document.getElementById('current-time'),
        dimensionsDisplay: document.getElementById('dimensions-display'),
        betInput: document.getElementById('bet-input'),
        decreaseBet: document.getElementById('decrease-bet'),
        increaseBet: document.getElementById('increase-bet'),
        halfBet: document.getElementById('half-bet'),
        maxBet: document.getElementById('max-bet'),
        quickBets: document.querySelectorAll('.quick-bet'),
        riskLevel: document.getElementById('risk-level'),
        potentialWin: document.getElementById('potential-win'),
        balanceDisplay: document.getElementById('balance-display')
      };
  
      // Set game title
      if (this.elements.gameTitle) {
        this.elements.gameTitle.textContent = this.config.gameTitle;
      }
  
      // Initialize canvas
      this.canvas = this.elements.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.initCanvas();
  
      // Set up event listeners
      this.setupEventListeners();
  
      // Initialize displays
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);
      this.updatePotentialWin();
      this.updateBalance();
    }
  
    /**
     * Set up event listeners for all interactive elements
     */
    setupEventListeners() {
      // Theme selection
      this.elements.themeSelect.addEventListener('change', () => {
        this.changeTheme(this.elements.themeSelect.value);
      });
  
      // Layout selection
      this.elements.desktopLayout.addEventListener('change', () => {
        if (this.elements.desktopLayout.checked) {
          this.switchLayout('pc');
        }
      });
  
      this.elements.mobileLayout.addEventListener('change', () => {
        if (this.elements.mobileLayout.checked) {
          this.switchLayout('mobile');
        }
      });
  
      // Sound toggle
      this.elements.soundButton.addEventListener('click', () => this.toggleSound());
  
      // Menu handling
      this.elements.menuButton.addEventListener('click', () => this.toggleMenu(true));
      this.elements.closeMenu.addEventListener('click', () => this.toggleMenu(false));
      this.elements.menuOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.menuOverlay) {
          this.toggleMenu(false);
        }
      });
  
      // Tab navigation
      this.elements.popupTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.switchTab(tab.dataset.tab);
        });
      });
  
      // Play mode tabs
      this.elements.manualTab.addEventListener('click', () => {
        this.state.autoPlay = false;
        this.elements.manualTab.classList.add('active');
        this.elements.autoTab.classList.remove('active');
        this.elements.spinButton.textContent = 'SPIN';
      });
  
      this.elements.autoTab.addEventListener('click', () => {
        this.state.autoPlay = true;
        this.elements.autoTab.classList.add('active');
        this.elements.manualTab.classList.remove('active');
        this.elements.spinButton.textContent = 'AUTO SPIN';
      });
  
      // Spin button
      this.elements.spinButton.addEventListener('click', () => this.spin());
  
      // Bet controls
      this.elements.decreaseBet.addEventListener('click', () => {
        if (this.state.isSpinning) return;
        this.state.betAmount = Math.max(1, this.state.betAmount - 1);
        this.elements.betInput.value = this.state.betAmount;
        this.updatePotentialWin();
      });
  
      this.elements.increaseBet.addEventListener('click', () => {
        if (this.state.isSpinning) return;
        this.state.betAmount = Math.min(this.state.maxBet, this.state.betAmount + 1);
        this.elements.betInput.value = this.state.betAmount;
        this.updatePotentialWin();
      });
  
      this.elements.halfBet.addEventListener('click', () => this.setHalfBet());
      this.elements.maxBet.addEventListener('click', () => this.setMaxBet());
  
      // Quick bet buttons
      this.elements.quickBets.forEach(button => {
        button.addEventListener('click', () => {
          if (this.state.isSpinning || !button.dataset.bet) return;
          this.state.betAmount = parseInt(button.dataset.bet);
          this.elements.betInput.value = this.state.betAmount;
          this.updatePotentialWin();
        });
      });
  
      // Risk level change
      this.elements.riskLevel.addEventListener('change', () => {
        if (this.state.isSpinning) return;
        this.state.riskLevel = this.elements.riskLevel.value;
        this.updatePotentialWin();
      });
  
      // Window resize
      window.addEventListener('resize', () => {
        this.drawCanvas();
      });
    }
  
    /**
     * Initialize the canvas with the correct dimensions
     */
    initCanvas() {
      // Set canvas dimensions based on layout
      const targetDims = this.config.canvasDimensions[this.state.layout];
      this.canvas.width = targetDims.width;
      this.canvas.height = targetDims.height;
      
      // Update dimensions display
      this.elements.dimensionsDisplay.textContent = `${this.canvas.width}×${this.canvas.height}`;
      
      // Draw canvas content
      this.drawCanvas();
    }
  
    /**
     * Draw the canvas with the appropriate theme and layout
     */
    drawCanvas() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Create gradient based on theme and layout
      let gradient;
      if (this.state.layout === 'pc') {
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      } else {
        gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
      }
      
      // Set colors based on theme
      const colors = this.config.canvasBackground[this.state.theme];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      // Fill background
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw grid for reference
      this.drawGrid();
      
      // Call the game's render function
      this.config.gameLogic.renderGame(this.ctx, this.canvas.width, this.canvas.height, this.state);
    }
  
    /**
     * Draw a reference grid on the canvas
     */
    drawGrid() {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x < this.canvas.width; x += 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < this.canvas.height; y += 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
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
     */
    calculatePotentialWin() {
      const multiplier = this.config.riskLevels[this.state.riskLevel];
      return this.state.betAmount * multiplier;
    }
  
    /**
     * Update the potential win display
     */
    updatePotentialWin() {
      this.elements.potentialWin.textContent = this.calculatePotentialWin().toFixed(2) + ` ${this.config.currency}`;
    }
  
    /**
     * Update the balance display
     */
    updateBalance() {
      this.elements.balanceDisplay.textContent = this.state.balance.toFixed(2) + ` ${this.config.currency}`;
    }
  
    /**
     * Toggle sound on/off
     */
    toggleSound() {
      this.state.soundEnabled = !this.state.soundEnabled;
      this.elements.soundButton.classList.toggle('active');
      this.elements.soundButton.textContent = this.state.soundEnabled ? '🔊' : '🔈';
    }
  
    /**
     * Begin the game spin process
     */
    spin() {
      if (this.state.isSpinning) return;
      if (this.state.balance < this.state.betAmount) {
        alert("Insufficient balance!");
        return;
      }
      
      this.state.isSpinning = true;
      this.state.balance -= this.state.betAmount;
      this.updateBalance();
      this.elements.spinButton.textContent = 'SPINNING...';
      
      // Use the game-specific spin logic
      this.config.gameLogic.spin(this.onSpinComplete.bind(this));
    }
  
    /**
     * Handle the completion of a spin
     * @param {Object} result - Result of the spin
     */
    onSpinComplete(result) {
      if (result.isWin) {
        const winAmount = this.config.gameLogic.calculateWin(
          this.state.betAmount, 
          this.state.riskLevel,
          result
        );
        
        this.state.balance += winAmount;
        this.updateBalance();
        
        // Call the game's win handler
        this.config.gameLogic.handleWin(this.ctx, this.canvas.width, this.canvas.height, winAmount, result);
      } else {
        // Call the game's loss handler
        this.config.gameLogic.handleLoss(this.ctx, this.canvas.width, this.canvas.height, result);
      }
      
      this.state.isSpinning = false;
      this.elements.spinButton.textContent = this.state.autoPlay ? 'AUTO SPIN' : 'SPIN';
      
      // If auto play is enabled, continue spinning after a delay
      if (this.state.autoPlay && this.state.balance >= this.state.betAmount) {
        setTimeout(() => this.spin(), 1500);
      } else {
        // Redraw canvas after a short delay to clear any win/loss messages
        setTimeout(() => this.drawCanvas(), 2000);
      }
    }
  
    /**
     * Set the bet to half of the current bet
     */
    setHalfBet() {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.max(1, Math.floor(this.state.betAmount / 2));
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
    }
  
    /**
     * Set the bet to the maximum allowed
     */
    setMaxBet() {
      if (this.state.isSpinning) return;
      this.state.betAmount = Math.min(this.state.maxBet, this.state.balance);
      this.elements.betInput.value = this.state.betAmount;
      this.updatePotentialWin();
    }
  
    /**
     * Switch between PC and mobile layouts
     * @param {string} layout - The layout to switch to ('pc' or 'mobile')
     */
    switchLayout(layout) {
      this.state.layout = layout;
      
      if (layout === 'pc') {
        this.elements.container.classList.remove('mobile');
        this.elements.container.classList.add('pc');
      } else {
        this.elements.container.classList.remove('pc');
        this.elements.container.classList.add('mobile');
      }
      
      // Reinitialize canvas for new dimensions
      this.initCanvas();
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
      this.drawCanvas();
    }
  
    /**
     * Toggle the menu overlay
     * @param {boolean} show - Whether to show or hide the menu
     */
    toggleMenu(show) {
      if (show) {
        this.elements.menuOverlay.classList.add('active');
      } else {
        this.elements.menuOverlay.classList.remove('active');
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
  
    /* DEFAULT GAME LOGIC METHODS */
    
    /**
     * Default implementation of the spin function
     * @param {Function} callback - Function to call when spin is complete
     */
    defaultSpin(callback) {
      // Simulate a delay for the spin animation
      setTimeout(() => {
        // 30% chance to win by default
        const isWin = Math.random() > 0.7;
        callback({ isWin });
      }, 2000);
    }
  
    /**
     * Default implementation of win calculation
     * @param {number} betAmount - The bet amount
     * @param {string} riskLevel - The risk level ('low', 'medium', 'high')
     * @param {Object} result - The result of the spin
     * @returns {number} - The calculated win amount
     */
    defaultCalculateWin(betAmount, riskLevel, result) {
      return betAmount * this.config.riskLevels[riskLevel];
    }
  
    /**
     * Default implementation of the game rendering
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} state - The current game state
     */
    defaultRenderGame(ctx, width, height, state) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw center marker
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(centerX - 50, centerY);
      ctx.lineTo(centerX + 50, centerY);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 50);
      ctx.lineTo(centerX, centerY + 50);
      ctx.stroke();
      
      // Draw text
      ctx.font = 'bold 48px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.config.gameTitle, centerX, centerY - 80);
      
      ctx.font = '24px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Game Canvas Area', centerX, centerY);
      
      ctx.font = '18px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(`${width}×${height}`, centerX, centerY + 40);
    }
  
    /**
     * Default implementation of win handling
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {number} winAmount - The amount won
     * @param {Object} result - The result of the spin
     */
    defaultHandleWin(ctx, width, height, winAmount, result) {
      // Flash win message on canvas
      ctx.font = 'bold 64px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} ${this.config.currency}`, width / 2, height / 2);
    }
  
    /**
     * Default implementation of loss handling
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} result - The result of the spin
     */
    defaultHandleLoss(ctx, width, height, result) {
      // Optionally show a loss message
      ctx.font = 'bold 64px Poppins';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Try again!', width / 2, height / 2);
    }
  }
  
  // Export the framework
  window.GameFramework = GameFramework;