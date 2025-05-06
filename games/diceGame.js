/**
 * Dice Game - Direct implementation of IGame interface
 * 
 * This demonstrates how to create a dice game directly implementing IGame interface
 * without requiring the GameAdapter
 */

class DiceGame {
  /**
   * Create a new instance of DiceGame
   * @param {Object} config - Configuration object for the game
   */
  constructor(config = {}) {
    // Default dice configuration
    const diceConfig = {
      gameTitle: 'Lucky Dice',
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      numDice: 3,
      diceSize: 80,
      diceColors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'],
      winningConditions: {
        // Map of win conditions and their multipliers
        'allSame': 5,       // All dice show the same value
        'straight': 3,      // Consecutive values (e.g., 1-2-3 or 4-5-6)
        'onePair': 1.5,     // At least two dice show the same value
      }
    };
    
    // Merge configs
    this.config = {...diceConfig, ...config};
    
    // Current dice values
    this.diceValues = [];
    this.diceRotations = [];
    this.animationPhase = 0;
    
    // Random dice positions for animation
    this.dicePositions = [];
    
    // Game state
    this.state = {
      initialized: false,
      isRunning: false,
      isPaused: false,
      isSpinning: false,
      balance: this.config.initialBalance || 1000,
      betAmount: this.config.initialBet || 10,
      riskLevel: 'medium',
      lastResult: null
    };
    
    // Keep track of event listeners
    this.eventListeners = {};
    
    // Animation frame request ID for cleanup
    this.animationFrameId = null;
    
    // Reference to container
    this.container = null;
    
    // Canvas context
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
  }
  
  /**
   * Инициализирует игру с конфигурацией
   * @param {Object} config - Конфигурация игры
   * @param {HTMLElement} config.container - DOM-элемент контейнера для игры
   * @param {number} config.bet - Начальная ставка
   * @param {string} config.riskLevel - Уровень риска
   * @param {Object} config.theme - Настройки темы
   * @param {Object} config.layout - Настройки макета
   * @param {Object} config.custom - Пользовательские настройки игры
   * @return {Promise<void>} Промис, который разрешается, когда игра полностью инициализирована
   */
  async initialize(config) {
    console.log('DiceGame.initialize - Starting initialization with config:', config);
    
    // Store container reference
    this.container = config.container;
    
    // Update config with initialization parameters
    if (config.bet) this.state.betAmount = config.bet;
    if (config.riskLevel) this.state.riskLevel = config.riskLevel;
    if (config.theme) this.config.theme = config.theme;
    if (config.layout) this.config.layout = config.layout;
    if (config.custom) {
      // Merge custom config
      this.config = {...this.config, ...config.custom};
    }
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth;
    canvas.height = this.container.clientHeight;
    this.container.appendChild(canvas);
    
    // Store canvas dimensions
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    
    // Get rendering context
    this.ctx = canvas.getContext('2d');
    
    // Initialize game elements
    this.initDice();
    
    // Handle resize events
    window.addEventListener('resize', () => {
      this.resize(this.container.clientWidth, this.container.clientHeight);
    });
    
    // Mark as initialized
    this.state.initialized = true;
    
    // Emit initialized event
    this.emit('initialized', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Запускает игру после инициализации
   * @return {Promise<void>} Промис, разрешающийся, когда игра запущена
   */
  async start() {
    console.log('DiceGame.start - Starting game');
    
    if (!this.state.initialized) {
      console.error('Cannot start game that has not been initialized');
      return Promise.reject(new Error('Game not initialized'));
    }
    
    // Update state
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    // Start animation loop
    this.animate();
    
    // Emit started event
    this.emit('started', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Приостанавливает игру
   * @return {void}
   */
  pause() {
    console.log('DiceGame.pause - Pausing game');
    
    if (!this.state.isRunning) {
      console.warn('Cannot pause a game that is not running');
      return;
    }
    
    this.state.isPaused = true;
    
    // Stop animation loop
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Emit paused event
    this.emit('paused', {timestamp: Date.now()});
  }
  
  /**
   * Возобновляет игру после приостановки
   * @return {void}
   */
  resume() {
    console.log('DiceGame.resume - Resuming game');
    
    if (!this.state.isPaused) {
      console.warn('Cannot resume a game that is not paused');
      return;
    }
    
    this.state.isPaused = false;
    
    // Restart animation loop
    this.animate();
    
    // Emit resumed event
    this.emit('resumed', {timestamp: Date.now()});
  }
  
  /**
   * Останавливает и выгружает игру, освобождая ресурсы
   * @return {Promise<void>} Промис, разрешающийся, когда игра полностью выгружена
   */
  async destroy() {
    console.log('DiceGame.destroy - Destroying game');
    
    // Stop animation loop
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove resize listener
    window.removeEventListener('resize', this.resize);
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Reset state
    this.state.isRunning = false;
    this.state.initialized = false;
    
    // Clear references
    this.container = null;
    this.ctx = null;
    
    // Clear event listeners
    this.eventListeners = {};
    
    // Emit destroyed event
    this.emit('destroyed', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Выполняет игровое действие (например, спин)
   * @param {Object} params - Параметры действия
   * @param {string} params.type - Тип действия (например, 'spin', 'bet', 'double')
   * @param {Object} params.data - Дополнительные данные для действия
   * @return {Promise<Object>} Результат действия
   */
  async performAction(params) {
    console.log('DiceGame.performAction - Performing action:', params);
    
    if (!this.state.isRunning) {
      return Promise.reject(new Error('Game is not running'));
    }
    
    if (this.state.isPaused) {
      return Promise.reject(new Error('Game is paused'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      case 'spin':
        return new Promise((resolve) => {
          // Update state
          this.state.isSpinning = true;
          
          // Emit spin start event
          this.emit('spinStart', {timestamp: Date.now()});
          
          // Perform the spin
          this.spin((result) => {
            // Calculate win amount if it's a win
            let winAmount = 0;
            if (result.isWin) {
              winAmount = this.calculateWin(this.state.betAmount, this.state.riskLevel, result);
              
              // Update balance
              this.state.balance += winAmount;
              
              // Handle win display
              if (this.ctx) {
                this.handleWin(this.ctx, this.canvasWidth, this.canvasHeight, winAmount, result);
              }
              
              // Emit win event
              this.emit('win', {
                amount: winAmount,
                type: result.winType,
                diceValues: result.diceValues
              });
            } else {
              // Deduct bet from balance
              this.state.balance -= this.state.betAmount;
              
              // Handle loss display
              if (this.ctx) {
                this.handleLoss(this.ctx, this.canvasWidth, this.canvasHeight, result);
              }
              
              // Emit loss event
              this.emit('loss', {
                amount: this.state.betAmount,
                diceValues: result.diceValues
              });
            }
            
            // Update state
            this.state.isSpinning = false;
            this.state.lastResult = {...result, winAmount};
            
            // Emit spin end event
            this.emit('spinEnd', {
              result,
              winAmount,
              balance: this.state.balance
            });
            
            // Resolve the promise with the result
            resolve({
              success: true,
              result,
              winAmount,
              balance: this.state.balance
            });
          });
        });
        
      case 'setBet':
        if (data.amount !== undefined) {
          const amount = Number(data.amount);
          if (isNaN(amount) || amount <= 0) {
            return Promise.reject(new Error('Invalid bet amount'));
          }
          
          // Ensure bet doesn't exceed max bet
          const maxBet = this.config.maxBet || 500;
          this.state.betAmount = Math.min(amount, maxBet);
          
          // Emit bet changed event
          this.emit('betChanged', {amount: this.state.betAmount});
          
          return Promise.resolve({
            success: true,
            bet: this.state.betAmount
          });
        }
        return Promise.reject(new Error('No bet amount provided'));
        
      case 'setRiskLevel':
        if (data.level !== undefined) {
          const validLevels = ['low', 'medium', 'high'];
          if (!validLevels.includes(data.level)) {
            return Promise.reject(new Error('Invalid risk level'));
          }
          
          this.state.riskLevel = data.level;
          
          // Emit risk level changed event
          this.emit('riskLevelChanged', {level: data.level});
          
          return Promise.resolve({
            success: true,
            riskLevel: this.state.riskLevel
          });
        }
        return Promise.reject(new Error('No risk level provided'));
        
      default:
        return Promise.reject(new Error(`Unknown action type: ${type}`));
    }
  }
  
  /**
   * Обрабатывает изменение размера контейнера
   * @param {number} width - Новая ширина
   * @param {number} height - Новая высота
   * @return {void}
   */
  resize(width, height) {
    console.log(`DiceGame.resize - Resizing to ${width}x${height}`);
    
    if (!this.container) return;
    
    // Get the canvas element
    const canvas = this.container.querySelector('canvas');
    if (!canvas) return;
    
    // Update canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Store new dimensions
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Force redraw
    this.renderGame(this.ctx, width, height, this.state);
    
    // Emit resize event
    this.emit('resize', {width, height});
  }
  
  /**
   * Обновляет настройки игры
   * @param {Object} settings - Новые настройки
   * @return {void}
   */
  updateSettings(settings) {
    console.log('DiceGame.updateSettings - Updating settings:', settings);
    
    // Update configuration
    if (settings.theme) this.config.theme = {...this.config.theme, ...settings.theme};
    if (settings.layout) this.config.layout = {...this.config.layout, ...settings.layout};
    
    // Update game-specific settings
    if (settings.numDice !== undefined) this.config.numDice = settings.numDice;
    if (settings.diceSize !== undefined) this.config.diceSize = settings.diceSize;
    if (settings.diceColors !== undefined) this.config.diceColors = settings.diceColors;
    
    // Update bet settings
    if (settings.bet !== undefined) this.state.betAmount = settings.bet;
    if (settings.riskLevel !== undefined) this.state.riskLevel = settings.riskLevel;
    
    // Reinitialize dice if needed
    if (settings.numDice !== undefined) {
      this.initDice();
    }
    
    // Force redraw
    if (this.ctx) {
      this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    }
    
    // Emit settings updated event
    this.emit('settingsUpdated', {settings});
  }
  
  /**
   * Рассчитывает возможный выигрыш на основе ставки и уровня риска
   * @param {number} betAmount - Размер ставки
   * @param {string} riskLevel - Уровень риска
   * @return {number} Расчетный потенциальный выигрыш
   */
  calculatePotentialWin(betAmount, riskLevel) {
    const riskMultipliers = {
      'low': 1.5,
      'medium': 3,
      'high': 6
    };
    
    // Calculate max possible win (all same - highest multiplier)
    const baseMultiplier = this.config.winningConditions.allSame;
    const riskMultiplier = riskMultipliers[riskLevel] || riskMultipliers.medium;
    
    return betAmount * baseMultiplier * riskMultiplier;
  }
  
  /**
   * Получает текущее состояние игры для сохранения
   * @return {Object} Состояние игры
   */
  getState() {
    return {
      balance: this.state.balance,
      betAmount: this.state.betAmount,
      riskLevel: this.state.riskLevel,
      diceValues: [...this.diceValues],
      lastResult: this.state.lastResult ? {...this.state.lastResult} : null
    };
  }
  
  /**
   * Восстанавливает игру из сохраненного состояния
   * @param {Object} state - Сохраненное состояние
   * @return {void}
   */
  setState(state) {
    console.log('DiceGame.setState - Restoring state:', state);
    
    // Restore basic state properties
    if (state.balance !== undefined) this.state.balance = state.balance;
    if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
    if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
    if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
    
    // Restore dice values
    if (state.diceValues && Array.isArray(state.diceValues)) {
      this.diceValues = [...state.diceValues];
      
      // Ensure dice positions and rotations are updated
      for (let i = 0; i < this.diceValues.length; i++) {
        // Set position to center (no animation offset)
        this.dicePositions[i] = {x: 0, y: 0};
        
        // Set rotation based on dice value
        this.diceRotations[i] = this.getDiceRotation(this.diceValues[i]);
      }
    }
    
    // Force redraw
    if (this.ctx) {
      this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    }
    
    // Emit state restored event
    this.emit('stateRestored', {success: true});
  }
  
  /**
   * Получает информацию об игре
   * @return {Object} Информация об игре (ID, название, версия и т.д.)
   */
  getInfo() {
    return {
      id: 'dice-game',
      name: this.config.gameTitle || 'Lucky Dice',
      version: '2.0.0',
      type: 'dice',
      features: ['spin', 'risk_levels', 'animations'],
      author: 'Game Framework',
      description: 'A dice game where players roll dice for matching combinations'
    };
  }
  
  /**
   * Проверяет, поддерживает ли игра определенную функцию
   * @param {string} featureName - Название функции
   * @return {boolean} true, если функция поддерживается
   */
  supportsFeature(featureName) {
    // List of supported features
    const supportedFeatures = [
      'spin',
      'risk_levels',
      'animations',
      'state_save',
      'state_restore',
      'responsive'
    ];
    
    return supportedFeatures.includes(featureName);
  }
  
  /**
   * Получает все события, на которые можно подписаться
   * @return {string[]} Список названий событий
   */
  getAvailableEvents() {
    return [
      'initialized',
      'started',
      'paused',
      'resumed',
      'destroyed',
      'spinStart',
      'spinEnd',
      'win',
      'loss',
      'betChanged',
      'riskLevelChanged',
      'resize',
      'stateRestored',
      'settingsUpdated'
    ];
  }
  
  /**
   * Добавляет обработчик события
   * @param {string} eventName - Название события
   * @param {Function} handler - Функция-обработчик
   * @return {void}
   */
  addEventListener(eventName, handler) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    
    // Initialize array for this event if not exists
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    // Add handler to array
    this.eventListeners[eventName].push(handler);
  }
  
  /**
   * Удаляет обработчик события
   * @param {string} eventName - Название события
   * @param {Function} handler - Функция-обработчик
   * @return {void}
   */
  removeEventListener(eventName, handler) {
    if (!this.eventListeners[eventName]) return;
    
    // Filter out the handler
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      h => h !== handler
    );
  }
  
  /**
   * Emit an event to all registered listeners
   * @param {string} eventName - The name of the event
   * @param {Object} data - Data to pass to listeners
   * @private
   */
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) return;
    
    // Call all handlers with the data
    this.eventListeners[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
  
  /**
   * Initialize dice with random values
   * @private
   */
  initDice() {
    console.log('DiceGame.initDice - Starting initialization');
    
    // Add fallback for numDice
    const numDice = this.config && this.config.numDice ? this.config.numDice : 3;
    
    // Initialize arrays
    this.diceValues = [];
    this.diceRotations = [];
    this.dicePositions = [];
    
    for (let i = 0; i < numDice; i++) {
      // Random initial value (1-6)
      this.diceValues.push(Math.floor(Math.random() * 6) + 1);
      
      // Random rotation for animation
      this.diceRotations.push({
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360
      });
      
      // Random position offset for animation
      this.dicePositions.push({
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100
      });
    }
    
    console.log('DiceGame.initDice - Dice initialized:', {
      values: this.diceValues,
      positions: this.dicePositions,
      config: this.config
    });
  }
  
  /**
   * Animation loop for dice
   * @private
   */
  animate() {
    // Skip animation if game is paused
    if (this.state.isPaused) return;
    
    // Increment animation phase
    this.animationPhase += 0.02;
    
    // Make sure diceRotations is initialized
    if (this.diceRotations && this.diceRotations.length > 0) {
      // Update dice rotations for idle animation
      for (let i = 0; i < this.diceRotations.length; i++) {
        if (this.diceRotations[i]) {
          // Gentle rotation for idle animation
          this.diceRotations[i].x += 0.2 * Math.sin(this.animationPhase + i);
          this.diceRotations[i].y += 0.3 * Math.cos(this.animationPhase * 0.7 + i);
        }
      }
    }
    
    // Redraw only if game is initialized and not spinning
    if (this.state.initialized && !this.state.isSpinning && this.ctx) {
      try {
        this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
      } catch (drawError) {
        console.error("Error drawing canvas:", drawError);
      }
    }
    
    // Request next frame - using a more stable approach with error handling
    try {
      if (window.requestAnimationFrame) {
        this.animationFrameId = window.requestAnimationFrame(() => {
          try {
            this.animate();
          } catch (animError) {
            console.error("Animation loop error:", animError);
          }
        });
      }
    } catch (rafError) {
      console.error("Error requesting animation frame:", rafError);
    }
  }
  
  /**
   * Handle the spin action
   * @param {Function} callback - Function to call when spin is complete
   * @private
   */
  spin(callback) {
    // Reset dice positions for animation
    for (let i = 0; i < this.config.numDice; i++) {
      this.dicePositions[i] = {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200
      };
      
      // Fast rotation during spin
      this.diceRotations[i] = {
        x: Math.random() * 720 - 360,
        y: Math.random() * 720 - 360,
        z: Math.random() * 720 - 360
      };
    }
    
    // Animation time before revealing result
    setTimeout(() => {
      // Generate new dice values
      this.diceValues = [];
      for (let i = 0; i < this.config.numDice; i++) {
        this.diceValues.push(Math.floor(Math.random() * 6) + 1);
      }
      
      // Reset positions for result display
      for (let i = 0; i < this.config.numDice; i++) {
        this.dicePositions[i] = {
          x: 0,
          y: 0
        };
        
        // Set final rotation based on dice value
        // This creates the illusion that specific faces are showing
        this.diceRotations[i] = this.getDiceRotation(this.diceValues[i]);
      }
      
      // Check for winning combinations
      const result = this.checkWin();
      
      // Return the result
      callback(result);
    }, 2000);
  }
  
  /**
   * Get the rotation values to show a specific dice face
   * @param {number} value - The dice value (1-6)
   * @returns {Object} Rotation values for x, y, z axes
   * @private
   */
  getDiceRotation(value) {
    // Different rotations to show different faces of a dice
    switch (value) {
      case 1: return { x: 0, y: 0, z: 0 }; // Front face (1)
      case 2: return { x: 0, y: -90, z: 0 }; // Right face (2)
      case 3: return { x: -90, y: 0, z: 0 }; // Top face (3)
      case 4: return { x: 90, y: 0, z: 0 }; // Bottom face (4)
      case 5: return { x: 0, y: 90, z: 0 }; // Left face (5)
      case 6: return { x: 180, y: 0, z: 0 }; // Back face (6)
      default: return { x: 0, y: 0, z: 0 };
    }
  }
  
  /**
   * Check if there are any winning combinations
   * @returns {Object} Result object with win information
   * @private
   */
  checkWin() {
    // Check for winning combinations
    const sortedValues = [...this.diceValues].sort((a, b) => a - b);
    
    // Check for "all same"
    const allSame = sortedValues.every(value => value === sortedValues[0]);
    
    // Check for straight (consecutive values)
    let isStraight = true;
    for (let i = 1; i < sortedValues.length; i++) {
      if (sortedValues[i] !== sortedValues[i-1] + 1) {
        isStraight = false;
        break;
      }
    }
    
    // Check for at least one pair
    let hasPair = false;
    for (let i = 1; i < sortedValues.length; i++) {
      if (sortedValues[i] === sortedValues[i-1]) {
        hasPair = true;
        break;
      }
    }
    
    // Determine the win type (best win takes precedence)
    let winType = null;
    if (allSame) {
      winType = 'allSame';
    } else if (isStraight) {
      winType = 'straight';
    } else if (hasPair) {
      winType = 'onePair';
    }
    
    const isWin = winType !== null;
    
    return {
      isWin,
      winType,
      diceValues: this.diceValues
    };
  }
  
  /**
   * Calculate the win amount
   * @param {number} betAmount - The bet amount
   * @param {string} riskLevel - The risk level
   * @param {Object} result - The spin result
   * @returns {number} The calculated win amount
   * @private
   */
  calculateWin(betAmount, riskLevel, result) {
    const riskMultipliers = {
      'low': 1.5,
      'medium': 3,
      'high': 6
    };
    
    if (!result.isWin || !result.winType) {
      return 0;
    }
    
    // Base win is the win condition's multiplier times the bet
    const baseMultiplier = this.config.winningConditions[result.winType];
    const baseWin = baseMultiplier * betAmount;
    
    // Apply risk multiplier
    return baseWin * riskMultipliers[riskLevel];
  }
  
  /**
   * Render a single die
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} size - The die size
   * @param {number} value - The die value (1-6)
   * @param {Object} rotation - Rotation values for x, y, z axes
   * @param {string} color - The die color
   * @private
   */
  renderDie(ctx, x, y, size, value, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    
    // Apply pseudo-3D rotation (simplified)
    // This is a very basic approximation of 3D rotation
    const scale = 0.8 + 0.2 * Math.cos(rotation.x * Math.PI / 180);
    ctx.scale(scale, scale);
    
    // Draw die body
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Die with rounded corners
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(-size/2 + radius, -size/2);
    ctx.lineTo(size/2 - radius, -size/2);
    ctx.arcTo(size/2, -size/2, size/2, -size/2 + radius, radius);
    ctx.lineTo(size/2, size/2 - radius);
    ctx.arcTo(size/2, size/2, size/2 - radius, size/2, radius);
    ctx.lineTo(-size/2 + radius, size/2);
    ctx.arcTo(-size/2, size/2, -size/2, size/2 - radius, radius);
    ctx.lineTo(-size/2, -size/2 + radius);
    ctx.arcTo(-size/2, -size/2, -size/2 + radius, -size/2, radius);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw dots based on value and rotation
    ctx.fillStyle = '#fff';
    
    // Simplified dot drawing - normally you'd account for 3D rotation,
    // but we'll just draw the dots for the face value
    switch (value) {
      case 1:
        this.drawDot(ctx, 0, 0, size * 0.12);
        break;
      case 2:
        this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
        break;
      case 3:
        this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, 0, 0, size * 0.12);
        this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
        break;
      case 4:
        this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
        break;
      case 5:
        this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
        this.drawDot(ctx, 0, 0, size * 0.12);
        this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
        break;
      case 6:
        this.drawDot(ctx, -size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, -size * 0.25, 0, size * 0.12);
        this.drawDot(ctx, -size * 0.25, size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, -size * 0.25, size * 0.12);
        this.drawDot(ctx, size * 0.25, 0, size * 0.12);
        this.drawDot(ctx, size * 0.25, size * 0.25, size * 0.12);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a dot on the die
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} radius - The dot radius
   * @private
   */
  drawDot(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Render the game on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} state - The game state
   * @private
   */
  renderGame(ctx, width, height, state) {
    if (!ctx) return;
    
    // Use static flag to prevent excessive logging - log only once
    if (!this._loggedRenderInfo) {
      console.log('DiceGame.renderGame - Initial render - config:', this.config);
      console.log('DiceGame.renderGame - Initial render - diceValues:', this.diceValues);
      console.log('DiceGame.renderGame - Initial render - dicePositions:', this.dicePositions);
      this._loggedRenderInfo = true;
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient background that fills the entire canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0e3c0a'); // Dark green at top
    gradient.addColorStop(1, '#195c1a'); // Slightly lighter green at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw gambling table with felt that completely fills the canvas
    // Table size exactly matches the canvas dimensions
    const tableWidth = width; // 100% of width
    const tableHeight = height; // 100% of height
    
    // Draw table background
    ctx.fillStyle = '#1a5d1a';
    ctx.fillRect(
      centerX - tableWidth/2, 
      centerY - tableHeight/2, 
      tableWidth, 
      tableHeight
    );
    
    // Draw table border with width proportional to table size
    const borderWidth = Math.max(5, Math.floor(tableWidth * 0.015));
    ctx.strokeStyle = '#0d3d0d';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      centerX - tableWidth/2, 
      centerY - tableHeight/2, 
      tableWidth, 
      tableHeight
    );
    
    // Draw title with font size proportional to canvas width
    const titleFontSize = Math.max(24, Math.min(48, width * 0.05));
    ctx.font = `bold ${titleFontSize}px Poppins, Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.config.gameTitle || 'Lucky Dice',
      centerX,
      centerY - tableHeight * 0.4
    );
    
    // Add fallbacks for dice properties
    const diceSize = this.config && this.config.diceSize ? this.config.diceSize : 80;
    const numDice = this.config && this.config.numDice ? this.config.numDice : 3;
    const diceColors = this.config && this.config.diceColors ? this.config.diceColors : 
        ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    
    // Adjust dice size based on canvas size
    const scaledDiceSize = Math.max(40, Math.min(diceSize, width * 0.08, height * 0.12));
    
    // Draw dice
    const spacing = scaledDiceSize * 1.5;
    const startX = centerX - (spacing * (numDice - 1)) / 2;
    
    // Make sure dice values and positions are initialized
    if (this.diceValues && this.diceRotations && this.dicePositions) {
      for (let i = 0; i < numDice; i++) {
        // Use fallbacks for all values
        const value = this.diceValues[i] !== undefined ? this.diceValues[i] : Math.floor(Math.random() * 6) + 1;
        const rotation = this.diceRotations[i] || { x: 0, y: 0, z: 0 };
        const position = this.dicePositions[i] || { x: 0, y: 0 };
        const color = diceColors[i % diceColors.length];
        
        this.renderDie(
          ctx,
          startX + i * spacing + position.x,
          centerY + position.y,
          scaledDiceSize,
          value,
          rotation,
          color
        );
      }
    } else {
      // Draw placeholder message if dice data isn't ready
      const msgFontSize = Math.max(16, Math.min(24, width * 0.025));
      ctx.font = `${msgFontSize}px Montserrat, Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Loading dice...', centerX, centerY);
    }
    
    // Draw instructions - font size scales with canvas width
    const instructionsFontSize = Math.max(16, Math.min(24, width * 0.025));
    ctx.font = `${instructionsFontSize}px Montserrat, Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Roll the dice and match winning combinations!', 
      centerX, 
      centerY + tableHeight * 0.3
    );
    
    // Draw bet and balance info
    ctx.fillText(
      `Bet: ${state.betAmount.toFixed(2)} € | Risk: ${state.riskLevel} | Balance: ${state.balance.toFixed(2)} €`,
      centerX,
      centerY + tableHeight * 0.38
    );
    
    // Draw winning combinations table - font size scales with canvas width
    const winTextSize = Math.max(12, Math.min(18, width * 0.018));
    ctx.font = `${winTextSize}px Montserrat, Arial`;
    ctx.textAlign = 'left';
    
    // Position relative to table size
    const winX = centerX - tableWidth * 0.45;
    let winY = centerY - tableHeight * 0.3;
    
    ctx.fillText('Winning Combinations:', winX, winY);
    winY += winTextSize * 1.5;
    
    ctx.fillText('• All Same: 5x', winX, winY);
    winY += winTextSize * 1.3;
    
    ctx.fillText('• Straight: 3x', winX, winY);
    winY += winTextSize * 1.3;
    
    ctx.fillText('• One Pair: 1.5x', winX, winY);
  }
  
  /**
   * Handle win animation/display
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {number} winAmount - The win amount
   * @param {Object} result - The spin result
   * @private
   */
  handleWin(ctx, width, height, winAmount, result) {
    const centerX = width / 2;
    
    // Scale font sizes based on canvas dimensions
    const winFontSize = Math.max(32, Math.min(64, width * 0.065));
    const winTypeFontSize = Math.max(24, Math.min(36, width * 0.035));
    
    // Draw win message - position relative to canvas height
    ctx.font = `bold ${winFontSize}px Poppins, Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, height * 0.15);
    
    // Draw the win type
    let winTypeText = '';
    switch (result.winType) {
      case 'allSame':
        winTypeText = 'All Same Numbers!';
        break;
      case 'straight':
        winTypeText = 'Straight Combination!';
        break;
      case 'onePair':
        winTypeText = 'Matching Pair!';
        break;
    }
    
    ctx.font = `bold ${winTypeFontSize}px Poppins, Arial`;
    ctx.fillText(winTypeText, centerX, height * 0.22);
  }
  
  /**
   * Handle loss display
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} width - The canvas width
   * @param {number} height - The canvas height
   * @param {Object} result - The spin result
   * @private
   */
  handleLoss(ctx, width, height, result) {
    const centerX = width / 2;
    
    // Scale font size based on canvas dimensions
    const lossFontSize = Math.max(24, Math.min(36, width * 0.035));
    
    // Draw try again message - position relative to canvas height
    ctx.font = `bold ${lossFontSize}px Poppins, Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No winning combination. Try again!', centerX, height * 0.9);
  }
}

// Export to global scope
window.DiceGame = DiceGame;