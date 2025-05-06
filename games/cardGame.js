/**
 * Card Game - Direct implementation of IGame interface
 * 
 * This demonstrates how to create a simple card game directly implementing IGame interface
 * without requiring the GameAdapter
 */

class CardGame {
  /**
   * Create a new instance of CardGame
   * @param {Object} config - Configuration object for the game
   */
  constructor(config = {}) {
    // Default card game configuration
    const cardConfig = {
      gameTitle: 'Card Master',
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      numCards: 5,
      cardWidth: 120,
      cardHeight: 180,
      cardBackColor: '#3498db',
      suits: ['♥', '♦', '♠', '♣'],
      values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
      suitColors: {
        '♥': '#e74c3c',
        '♦': '#e74c3c',
        '♠': '#2c3e50',
        '♣': '#2c3e50'
      },
      winningHands: {
        // Map of winning hands and their multipliers
        'royal': 15,      // Royal flush (A, K, Q, J, 10 of same suit)
        'straight': 8,    // 5 cards in sequence
        'flush': 6,       // 5 cards of same suit
        'pair': 2,        // At least one pair
        'high': 1.5       // Just high card (A, K, Q, J)
      }
    };
    
    // Merge configs
    this.config = {...cardConfig, ...config};
    
    // Current cards
    this.cards = [];
    this.flipped = [];
    this.selectedCards = [];
    
    // Card positions and animation
    this.cardPositions = [];
    this.animationPhase = 0;
    
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
    console.log('CardGame.initialize - Starting initialization with config:', config);
    
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
    
    // Initialize deck
    this.initDeck();
    
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
    console.log('CardGame.start - Starting game');
    
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
    console.log('CardGame.pause - Pausing game');
    
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
    console.log('CardGame.resume - Resuming game');
    
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
    console.log('CardGame.destroy - Destroying game');
    
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
    console.log('CardGame.performAction - Performing action:', params);
    
    if (!this.state.isRunning) {
      return Promise.reject(new Error('Game is not running'));
    }
    
    if (this.state.isPaused) {
      return Promise.reject(new Error('Game is paused'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      case 'deal':
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
                cards: result.cards
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
                cards: result.cards
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
        
      case 'selectCard':
        if (data.index !== undefined) {
          const index = Number(data.index);
          if (isNaN(index) || index < 0 || index >= this.cards.length) {
            return Promise.reject(new Error('Invalid card index'));
          }
          
          // Toggle selection
          this.selectedCards[index] = !this.selectedCards[index];
          
          // Redraw
          if (this.ctx) {
            this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
          }
          
          // Emit card selected event
          this.emit('cardSelected', {
            index,
            selected: this.selectedCards[index]
          });
          
          return Promise.resolve({
            success: true,
            cardIndex: index,
            selected: this.selectedCards[index]
          });
        }
        return Promise.reject(new Error('No card index provided'));
        
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
    console.log(`CardGame.resize - Resizing to ${width}x${height}`);
    
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
    console.log('CardGame.updateSettings - Updating settings:', settings);
    
    // Update configuration
    if (settings.theme) this.config.theme = {...this.config.theme, ...settings.theme};
    if (settings.layout) this.config.layout = {...this.config.layout, ...settings.layout};
    
    // Update game-specific settings
    if (settings.numCards !== undefined) this.config.numCards = settings.numCards;
    if (settings.cardWidth !== undefined) this.config.cardWidth = settings.cardWidth;
    if (settings.cardHeight !== undefined) this.config.cardHeight = settings.cardHeight;
    if (settings.cardBackColor !== undefined) this.config.cardBackColor = settings.cardBackColor;
    
    // Update bet settings
    if (settings.bet !== undefined) this.state.betAmount = settings.bet;
    if (settings.riskLevel !== undefined) this.state.riskLevel = settings.riskLevel;
    
    // Reinitialize deck if needed
    if (settings.numCards !== undefined) {
      this.initDeck();
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
    
    // Calculate max possible win (royal flush - highest multiplier)
    const baseMultiplier = this.config.winningHands.royal;
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
      cards: this.cards.map(card => ({...card})),
      flipped: [...this.flipped],
      selectedCards: [...this.selectedCards],
      lastResult: this.state.lastResult ? {...this.state.lastResult} : null
    };
  }
  
  /**
   * Восстанавливает игру из сохраненного состояния
   * @param {Object} state - Сохраненное состояние
   * @return {void}
   */
  setState(state) {
    console.log('CardGame.setState - Restoring state:', state);
    
    // Restore basic state properties
    if (state.balance !== undefined) this.state.balance = state.balance;
    if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
    if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
    if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
    
    // Restore cards
    if (state.cards && Array.isArray(state.cards)) {
      this.cards = state.cards.map(card => ({...card}));
    }
    
    // Restore flipped state
    if (state.flipped && Array.isArray(state.flipped)) {
      this.flipped = [...state.flipped];
    }
    
    // Restore selected state
    if (state.selectedCards && Array.isArray(state.selectedCards)) {
      this.selectedCards = [...state.selectedCards];
    }
    
    // Reset card positions
    this.cardPositions = [];
    for (let i = 0; i < this.cards.length; i++) {
      this.cardPositions.push({
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1
      });
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
      id: 'card-game',
      name: this.config.gameTitle || 'Card Master',
      version: '2.0.0',
      type: 'cards',
      features: ['deal', 'card_selection', 'risk_levels', 'animations'],
      author: 'Game Framework',
      description: 'A card game where players draw cards for winning combinations'
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
      'deal',
      'card_selection',
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
      'cardSelected',
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
   * Create a shuffled deck of cards
   * @private
   */
  initDeck() {
    console.log('CardGame.initDeck - Starting initialization');

    // Add fallbacks for core card properties
    const suits = this.config && this.config.suits ? this.config.suits : ['♥', '♦', '♠', '♣'];
    const values = this.config && this.config.values ? this.config.values : ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const numCards = this.config && this.config.numCards ? this.config.numCards : 5;
    
    // Create a full deck
    const deck = [];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    
    // Shuffle the deck
    this.shuffle(deck);
    
    // Initialize card state
    this.cards = [];
    this.flipped = [];
    this.selectedCards = [];
    this.cardPositions = [];
    
    // Deal initial cards
    const cardsToDeal = Math.min(numCards, deck.length);
    for (let i = 0; i < cardsToDeal; i++) {
      this.cards.push(deck.pop());
      this.flipped.push(false);
      this.selectedCards.push(false);
      
      // Set initial position
      this.cardPositions.push({
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1
      });
    }
    
    console.log('CardGame.initDeck - Deck initialized:', {
      cards: this.cards,
      positions: this.cardPositions,
      config: this.config
    });
  }
  
  /**
   * Shuffle an array in place
   * @param {Array} array - The array to shuffle
   * @private
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * Animation loop for cards
   * @private
   */
  animate() {
    // Skip animation if game is paused
    if (this.state.isPaused) return;
    
    // Increment animation phase
    this.animationPhase += 0.02;
    
    // Update card positions for idle animation
    for (let i = 0; i < this.cardPositions.length; i++) {
      if (!this.flipped[i]) {
        // Subtle hovering animation for face-down cards
        this.cardPositions[i].y = 5 * Math.sin(this.animationPhase + i * 0.5);
        this.cardPositions[i].rotation = 2 * Math.sin(this.animationPhase * 0.5 + i * 0.2);
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
   * Handle the spin action (deal new cards)
   * @param {Function} callback - Function to call when spin is complete
   * @private
   */
  spin(callback) {
    // Animation phase 1: flip all cards face down
    this.flipped = Array(this.config.numCards).fill(false);
    this.selectedCards = Array(this.config.numCards).fill(false);
    
    // Scatter cards for animation
    for (let i = 0; i < this.config.numCards; i++) {
      this.cardPositions[i] = {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 300,
        rotation: Math.random() * 360 - 180,
        scale: 0.8 + Math.random() * 0.4
      };
    }
    
    // Create a new deck and shuffle
    const deck = [];
    for (const suit of this.config.suits) {
      for (const value of this.config.values) {
        deck.push({ suit, value });
      }
    }
    this.shuffle(deck);
    
    // Animation time before revealing result
    setTimeout(() => {
      // Deal new cards
      this.cards = [];
      for (let i = 0; i < this.config.numCards; i++) {
        this.cards.push(deck.pop());
      }
      
      // Reset positions
      for (let i = 0; i < this.config.numCards; i++) {
        this.cardPositions[i] = {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1
        };
      }
      
      // Flip all cards face up
      this.flipped = Array(this.config.numCards).fill(true);
      
      // Check for winning combinations
      const result = this.checkWin();
      
      // Return the result
      callback(result);
    }, 2000);
  }
  
  /**
   * Check if there are any winning hands
   * @returns {Object} Result object with win information
   * @private
   */
  checkWin() {
    // Sort cards by value for easier evaluation
    const sortedCards = [...this.cards].sort((a, b) => {
      const valueA = this.getCardValue(a.value);
      const valueB = this.getCardValue(b.value);
      return valueB - valueA; // Sort descending
    });
    
    // Check for flush (all same suit)
    const isFlush = this.cards.every(card => card.suit === this.cards[0].suit);
    
    // Check for straight
    let isStraight = true;
    for (let i = 1; i < sortedCards.length; i++) {
      const prevValue = this.getCardValue(sortedCards[i-1].value);
      const currValue = this.getCardValue(sortedCards[i].value);
      if (prevValue !== currValue + 1) {
        isStraight = false;
        break;
      }
    }
    
    // Check for royal flush
    const isRoyal = isFlush && 
                    sortedCards[0].value === 'A' &&
                    sortedCards[1].value === 'K' &&
                    sortedCards[2].value === 'Q' &&
                    sortedCards[3].value === 'J' &&
                    sortedCards[4].value === '10';
    
    // Check for pairs
    const valueCounts = {};
    for (const card of this.cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    const hasPair = Object.values(valueCounts).some(count => count >= 2);
    
    // Check for high card (A, K, Q, J)
    const hasHighCard = sortedCards[0].value === 'A' || 
                        sortedCards[0].value === 'K' ||
                        sortedCards[0].value === 'Q' ||
                        sortedCards[0].value === 'J';
    
    // Determine the win type (best win takes precedence)
    let winType = null;
    if (isRoyal) {
      winType = 'royal';
    } else if (isStraight && isFlush) {
      winType = 'straight';
    } else if (isFlush) {
      winType = 'flush';
    } else if (hasPair) {
      winType = 'pair';
    } else if (hasHighCard) {
      winType = 'high';
    }
    
    const isWin = winType !== null;
    
    return {
      isWin,
      winType,
      cards: this.cards
    };
  }
  
  /**
   * Get numerical value of a card
   * @param {string} value - The card value (A, 2, 3, ..., J, Q, K)
   * @returns {number} The numerical value
   * @private
   */
  getCardValue(value) {
    const valueMap = {
      'A': 14,
      'K': 13,
      'Q': 12,
      'J': 11,
      '10': 10,
      '9': 9,
      '8': 8,
      '7': 7,
      '6': 6,
      '5': 5,
      '4': 4,
      '3': 3,
      '2': 2
    };
    return valueMap[value] || parseInt(value);
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
    const baseMultiplier = this.config.winningHands[result.winType];
    const baseWin = baseMultiplier * betAmount;
    
    // Apply risk multiplier
    return baseWin * riskMultipliers[riskLevel];
  }
  
  /**
   * Render a card
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} width - The card width
   * @param {number} height - The card height
   * @param {Object} card - The card object
   * @param {boolean} faceUp - Whether the card is face up
   * @param {boolean} selected - Whether the card is selected
   * @param {Object} position - Position and transformation data
   * @private
   */
  renderCard(ctx, x, y, width, height, card, faceUp, selected, position) {
    ctx.save();
    
    // Apply position and transformation
    ctx.translate(x + position.x, y + position.y);
    ctx.rotate(position.rotation * Math.PI / 180);
    ctx.scale(position.scale, position.scale);
    
    // Draw card outline
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = selected ? '#FFD700' : '#000';
    ctx.lineWidth = selected ? 3 : 1;
    
    // Card with rounded corners
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(-width/2 + radius, -height/2);
    ctx.lineTo(width/2 - radius, -height/2);
    ctx.arcTo(width/2, -height/2, width/2, -height/2 + radius, radius);
    ctx.lineTo(width/2, height/2 - radius);
    ctx.arcTo(width/2, height/2, width/2 - radius, height/2, radius);
    ctx.lineTo(-width/2 + radius, height/2);
    ctx.arcTo(-width/2, height/2, -width/2, height/2 - radius, radius);
    ctx.lineTo(-width/2, -height/2 + radius);
    ctx.arcTo(-width/2, -height/2, -width/2 + radius, -height/2, radius);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    if (faceUp) {
      // Draw card face
      const suitColor = this.config.suitColors[card.suit];
      
      // Draw value and suit in corners
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = suitColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(card.value, -width/2 + 10, -height/2 + 10);
      ctx.fillText(card.suit, -width/2 + 10, -height/2 + 40);
      
      // Draw value and suit in opposite corner (upside down)
      ctx.save();
      ctx.translate(width/2 - 10, height/2 - 10);
      ctx.rotate(Math.PI);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(card.value, 0, 0);
      ctx.fillText(card.suit, 0, 30);
      ctx.restore();
      
      // Draw big symbol in center
      ctx.font = '48px Arial';
      ctx.fillStyle = suitColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.suit, 0, 0);
    } else {
      // Draw card back
      ctx.fillStyle = this.config.cardBackColor;
      
      // Inner rectangle
      const innerMargin = 10;
      ctx.fillRect(
        -width/2 + innerMargin,
        -height/2 + innerMargin,
        width - innerMargin * 2,
        height - innerMargin * 2
      );
      
      // Pattern
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      
      // Diamond pattern
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        for (let j = -3; j <= 3; j++) {
          ctx.rect(
            i * 20 - 10,
            j * 20 - 10,
            20,
            20
          );
        }
      }
      ctx.stroke();
    }
    
    ctx.restore();
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
      console.log('CardGame.renderGame - Initial render - config:', this.config);
      console.log('CardGame.renderGame - Initial render - cards:', this.cards);
      console.log('CardGame.renderGame - Initial render - cardPositions:', this.cardPositions);
      this._loggedRenderInfo = true;
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear the entire canvas first
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient background that fills the entire canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0E5A3C'); // Dark green at top
    gradient.addColorStop(1, '#215E3F'); // Slightly lighter green at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw poker table with felt that completely fills the canvas
    // Table size exactly matches the canvas dimensions
    const tableWidth = width; // 100% of width
    const tableHeight = height; // 100% of height
    
    // Draw felt
    ctx.fillStyle = '#27ae60'; // Felt green
    ctx.fillRect(
      centerX - tableWidth/2, 
      centerY - tableHeight/2, 
      tableWidth, 
      tableHeight
    );
    
    // Draw table border
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = Math.max(10, tableWidth * 0.02); // Proportional border
    ctx.strokeRect(
      centerX - tableWidth/2, 
      centerY - tableHeight/2, 
      tableWidth, 
      tableHeight
    );
    
    // Draw title - positioned proportionally to the canvas height
    const titleFontSize = Math.max(32, Math.min(48, height * 0.06));
    ctx.font = `bold ${titleFontSize}px Poppins`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Card Master', centerX, centerY - tableHeight * 0.45);
    
    // Draw bet and balance info
    const infoFontSize = Math.max(16, Math.min(24, height * 0.03));
    ctx.font = `${infoFontSize}px Montserrat`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(
      `Bet: ${state.betAmount.toFixed(2)} € | Risk: ${state.riskLevel} | Balance: ${state.balance.toFixed(2)} €`,
      centerX,
      centerY - tableHeight * 0.35
    );
    
    // Calculate card dimensions proportional to the table size
    const numCards = this.config && this.config.numCards ? this.config.numCards : 5;
    const cardWidth = Math.min(120, tableWidth / (numCards * 1.5));
    const cardHeight = cardWidth * 1.5; // Standard card ratio
    
    // Draw cards only if they exist
    const cardSpacing = cardWidth * 1.2;
    const startX = centerX - (cardSpacing * (numCards - 1)) / 2;
    
    // Ensure cards array exists before iterating
    if (this.cards && this.cards.length > 0) {
      for (let i = 0; i < this.cards.length; i++) {
        // Ensure position data exists or use defaults
        const position = this.cardPositions && this.cardPositions[i] ? 
                        this.cardPositions[i] : { x: 0, y: 0, rotation: 0, scale: 1 };
        
        // Ensure card data exists
        const card = this.cards[i] || { suit: '♠', value: 'A' };
        const flipped = this.flipped && this.flipped[i] !== undefined ? this.flipped[i] : false;
        const selected = this.selectedCards && this.selectedCards[i] !== undefined ? this.selectedCards[i] : false;
        
        this.renderCard(
          ctx,
          startX + i * cardSpacing,
          centerY,
          cardWidth,
          cardHeight,
          card,
          flipped,
          selected,
          position
        );
      }
    } else {
      // Draw placeholder message if no cards are available
      ctx.font = '24px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Loading cards...', centerX, centerY);
    }
    
    // Draw instructions - positioned proportionally to the table
    const instructionsFontSize = Math.max(16, Math.min(24, height * 0.03));
    ctx.font = `${instructionsFontSize}px Montserrat`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('Deal cards and look for winning hands!', centerX, centerY + tableHeight * 0.35);
    
    // Draw winning hands table - positioned proportionally
    const handsFontSize = Math.max(14, Math.min(18, height * 0.022));
    ctx.font = `${handsFontSize}px Montserrat`;
    ctx.textAlign = 'left';
    
    const winningsX = centerX + tableWidth * 0.25;
    let y = centerY - tableHeight * 0.25;
    
    ctx.fillText('Winning Hands:', winningsX, y);
    y += handsFontSize * 1.5;
    
    ctx.fillText('• Royal Flush: 15x', winningsX, y);
    y += handsFontSize * 1.4;
    
    ctx.fillText('• Straight: 8x', winningsX, y);
    y += handsFontSize * 1.4;
    
    ctx.fillText('• Flush: 6x', winningsX, y);
    y += handsFontSize * 1.4;
    
    ctx.fillText('• Pair: 2x', winningsX, y);
    y += handsFontSize * 1.4;
    
    ctx.fillText('• High Card (A,K,Q,J): 1.5x', winningsX, y);
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
    
    // Calculate proportional font sizes
    const winFontSize = Math.max(32, Math.min(64, width * 0.065));
    const winTypeFontSize = Math.max(24, Math.min(36, width * 0.035));
    
    // Draw win message
    ctx.font = `bold ${winFontSize}px Poppins`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, height * 0.15);
    
    // Draw the win type
    let winTypeText = '';
    switch (result.winType) {
      case 'royal':
        winTypeText = 'Royal Flush!';
        break;
      case 'straight':
        winTypeText = 'Straight Flush!';
        break;
      case 'flush':
        winTypeText = 'Flush!';
        break;
      case 'pair':
        winTypeText = 'Pair!';
        break;
      case 'high':
        winTypeText = 'High Card!';
        break;
    }
    
    ctx.font = `bold ${winTypeFontSize}px Poppins`;
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
    
    // Calculate proportional font size
    const lossFontSize = Math.max(24, Math.min(36, width * 0.035));
    
    // Draw try again message
    ctx.font = `bold ${lossFontSize}px Poppins`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No winning hand. Try again!', centerX, height - height * 0.1);
  }
}

// Export to global scope
window.CardGame = CardGame;