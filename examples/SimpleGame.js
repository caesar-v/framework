/**
 * SimpleGame - Пример минимальной реализации IGame интерфейса
 * 
 * Демонстрирует простую игру-кликер, которая напрямую реализует интерфейс IGame
 * без использования дополнительных адаптеров или наследования.
 */

class SimpleGame {
  /**
   * Создание новой игры-кликера
   * @param {Object} config - Начальная конфигурация
   */
  constructor(config = {}) {
    // Конфигурация по умолчанию
    this.config = {
      gameTitle: 'Simple Clicker Game',
      initialBalance: 100,
      initialBet: 10,
      maxBet: 100,
      clickReward: 1,
      theme: {
        backgroundColor: '#1e1e3f',
        textColor: '#ffffff',
        buttonColor: '#ff5370',
        buttonTextColor: '#ffffff',
        counterColor: '#c3e88d'
      },
      ...config
    };
    
    // Игровое состояние
    this.state = {
      initialized: false,
      isRunning: false,
      isPaused: false,
      balance: this.config.initialBalance,
      betAmount: this.config.initialBet,
      riskLevel: 'medium',
      clickCount: 0,
      lastResult: null
    };
    
    // DOM элементы
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    
    // Слушатели событий
    this.eventListeners = {};
    this.boundHandlers = {
      click: this.handleClick.bind(this),
      resize: this.handleResize.bind(this)
    };
    
    // Анимация
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.particles = [];
  }
  
  /**
   * Инициализирует игру
   * @param {Object} config - Конфигурация игры
   * @returns {Promise<void>}
   */
  async initialize(config) {
    console.log('SimpleGame: Initializing with config:', config);
    
    // Сохраняем ссылку на контейнер
    this.container = config.container;
    
    // Применяем настройки
    if (config.bet) this.state.betAmount = config.bet;
    if (config.riskLevel) this.state.riskLevel = config.riskLevel;
    if (config.theme) this.config.theme = {...this.config.theme, ...config.theme};
    
    // Создаем canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
    
    // Сохраняем контекст и размеры
    this.ctx = this.canvas.getContext('2d');
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    
    // Добавляем обработчики событий
    this.canvas.addEventListener('click', this.boundHandlers.click);
    window.addEventListener('resize', this.boundHandlers.resize);
    
    // Обновляем состояние
    this.state.initialized = true;
    
    // Генерируем событие
    this.emit('initialized', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Запускает игру
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.state.initialized) {
      return Promise.reject(new Error('Game not initialized'));
    }
    
    console.log('SimpleGame: Starting game');
    
    // Обновляем состояние
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    // Запускаем анимацию
    this.lastFrameTime = performance.now();
    this.animate();
    
    // Генерируем событие
    this.emit('started', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Приостанавливает игру
   */
  pause() {
    if (!this.state.isRunning) {
      console.warn('Game is not running, cannot pause');
      return;
    }
    
    console.log('SimpleGame: Pausing game');
    
    // Обновляем состояние
    this.state.isPaused = true;
    
    // Останавливаем анимацию
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Генерируем событие
    this.emit('paused', {timestamp: Date.now()});
  }
  
  /**
   * Возобновляет игру
   */
  resume() {
    if (!this.state.isPaused) {
      console.warn('Game is not paused, cannot resume');
      return;
    }
    
    console.log('SimpleGame: Resuming game');
    
    // Обновляем состояние
    this.state.isPaused = false;
    
    // Перезапускаем анимацию
    this.lastFrameTime = performance.now();
    this.animate();
    
    // Генерируем событие
    this.emit('resumed', {timestamp: Date.now()});
  }
  
  /**
   * Останавливает и выгружает игру
   * @returns {Promise<void>}
   */
  async destroy() {
    console.log('SimpleGame: Destroying game');
    
    // Останавливаем анимацию
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Удаляем обработчики событий
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.boundHandlers.click);
    }
    window.removeEventListener('resize', this.boundHandlers.resize);
    
    // Очищаем контейнер
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Сбрасываем ссылки
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    
    // Очищаем слушатели событий
    this.eventListeners = {};
    
    // Обновляем состояние
    this.state.initialized = false;
    this.state.isRunning = false;
    
    // Генерируем событие
    this.emit('destroyed', {success: true});
    
    return Promise.resolve();
  }
  
  /**
   * Выполняет игровое действие
   * @param {Object} params - Параметры действия
   * @returns {Promise<Object>} - Результат действия
   */
  async performAction(params) {
    if (!this.state.isRunning || this.state.isPaused) {
      return Promise.reject(new Error('Game is not in a runnable state'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      case 'click':
        return this.handleClickAction();
        
      case 'setBet':
        if (data.amount === undefined) {
          return Promise.reject(new Error('No bet amount provided'));
        }
        return this.handleSetBet(data.amount);
        
      case 'setRiskLevel':
        if (data.level === undefined) {
          return Promise.reject(new Error('No risk level provided'));
        }
        return this.handleSetRiskLevel(data.level);
        
      default:
        return Promise.reject(new Error(`Unknown action type: ${type}`));
    }
  }
  
  /**
   * Обрабатывает изменение размера
   * @param {number} width - Новая ширина
   * @param {number} height - Новая высота
   */
  resize(width, height) {
    console.log(`SimpleGame: Resizing to ${width}x${height}`);
    
    if (!this.canvas) return;
    
    // Обновляем размеры canvas
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Сохраняем новые размеры
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Перерисовываем игру
    this.render();
    
    // Генерируем событие
    this.emit('resize', {width, height});
  }
  
  /**
   * Обновляет настройки игры
   * @param {Object} settings - Новые настройки
   */
  updateSettings(settings) {
    console.log('SimpleGame: Updating settings:', settings);
    
    // Обновляем настройки темы
    if (settings.theme) {
      this.config.theme = {...this.config.theme, ...settings.theme};
    }
    
    // Обновляем настройки ставки
    if (settings.bet !== undefined) {
      this.state.betAmount = settings.bet;
    }
    
    if (settings.riskLevel !== undefined) {
      this.state.riskLevel = settings.riskLevel;
    }
    
    // Обновляем настройки игры
    if (settings.clickReward !== undefined) {
      this.config.clickReward = settings.clickReward;
    }
    
    // Перерисовываем игру
    this.render();
    
    // Генерируем событие
    this.emit('settingsUpdated', {settings});
  }
  
  /**
   * Рассчитывает возможный выигрыш
   * @param {number} betAmount - Размер ставки
   * @param {string} riskLevel - Уровень риска
   * @returns {number} - Возможный выигрыш
   */
  calculatePotentialWin(betAmount, riskLevel) {
    const riskMultipliers = {
      'low': 1.5,
      'medium': 2,
      'high': 3
    };
    
    const baseMultiplier = 10; // Максимальный множитель в игре
    const riskMultiplier = riskMultipliers[riskLevel] || riskMultipliers.medium;
    
    return betAmount * baseMultiplier * riskMultiplier;
  }
  
  /**
   * Возвращает текущее состояние игры
   * @returns {Object} - Текущее состояние
   */
  getState() {
    return {
      balance: this.state.balance,
      betAmount: this.state.betAmount,
      riskLevel: this.state.riskLevel,
      clickCount: this.state.clickCount,
      lastResult: this.state.lastResult ? {...this.state.lastResult} : null
    };
  }
  
  /**
   * Восстанавливает состояние игры
   * @param {Object} state - Сохраненное состояние
   */
  setState(state) {
    console.log('SimpleGame: Restoring state:', state);
    
    // Восстанавливаем основные параметры
    if (state.balance !== undefined) this.state.balance = state.balance;
    if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
    if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
    if (state.clickCount !== undefined) this.state.clickCount = state.clickCount;
    if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
    
    // Перерисовываем игру
    this.render();
    
    // Генерируем событие
    this.emit('stateRestored', {success: true});
  }
  
  /**
   * Возвращает информацию об игре
   * @returns {Object} - Информация об игре
   */
  getInfo() {
    return {
      id: 'simple-clicker',
      name: this.config.gameTitle,
      version: '1.0.0',
      type: 'clicker',
      features: ['click', 'bet', 'risk_levels'],
      author: 'Game Framework',
      description: 'Simple clicker game that demonstrates IGame interface implementation',
      minBet: 1,
      maxBet: this.config.maxBet
    };
  }
  
  /**
   * Проверяет поддержку функции
   * @param {string} featureName - Название функции
   * @returns {boolean} - true, если функция поддерживается
   */
  supportsFeature(featureName) {
    const supportedFeatures = [
      'click',
      'bet',
      'risk_levels',
      'state_save',
      'state_restore',
      'responsive',
      'animations'
    ];
    
    return supportedFeatures.includes(featureName);
  }
  
  /**
   * Возвращает список доступных событий
   * @returns {string[]} - Список названий событий
   */
  getAvailableEvents() {
    return [
      'initialized',
      'started',
      'paused',
      'resumed',
      'destroyed',
      'click',
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
   */
  addEventListener(eventName, handler) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    this.eventListeners[eventName].push(handler);
  }
  
  /**
   * Удаляет обработчик события
   * @param {string} eventName - Название события
   * @param {Function} handler - Функция-обработчик
   */
  removeEventListener(eventName, handler) {
    if (!this.eventListeners[eventName]) return;
    
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      h => h !== handler
    );
  }
  
  // --- Вспомогательные методы ---
  
  /**
   * Генерирует событие
   * @param {string} eventName - Название события
   * @param {Object} data - Данные события
   * @private
   */
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) return;
    
    this.eventListeners[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
  
  /**
   * Обработчик клика по canvas
   * @param {MouseEvent} event - Событие клика
   * @private
   */
  handleClick(event) {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Проверяем, попал ли клик в центральную область
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.2;
    
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    if (distance <= radius) {
      // Клик по игровой области
      this.handleClickAction();
      
      // Добавляем частицы
      this.addParticles(x, y);
    }
  }
  
  /**
   * Обработчик действия клика
   * @returns {Promise<Object>} - Результат действия
   * @private
   */
  async handleClickAction() {
    // Увеличиваем счетчик кликов
    this.state.clickCount++;
    
    // Генерируем событие клика
    this.emit('click', {
      count: this.state.clickCount,
      timestamp: Date.now()
    });
    
    // Случайный шанс выигрыша (10%)
    const isWin = Math.random() < 0.1;
    
    // Рассчитываем выигрыш/проигрыш
    let winAmount = 0;
    if (isWin) {
      // Базовый выигрыш = ставка * множитель клика * множитель риска
      const riskMultipliers = {
        'low': 1.5,
        'medium': 2,
        'high': 3
      };
      
      const clickMultiplier = Math.min(10, Math.max(1, Math.floor(this.state.clickCount / 10)));
      const riskMultiplier = riskMultipliers[this.state.riskLevel] || riskMultipliers.medium;
      
      winAmount = this.state.betAmount * clickMultiplier * riskMultiplier;
      
      // Обновляем баланс
      this.state.balance += winAmount;
      
      // Генерируем событие выигрыша
      this.emit('win', {
        amount: winAmount,
        clickCount: this.state.clickCount
      });
    } else {
      // Вычитаем ставку из баланса
      this.state.balance -= this.state.betAmount;
      
      // Генерируем событие проигрыша
      this.emit('loss', {
        amount: this.state.betAmount,
        clickCount: this.state.clickCount
      });
    }
    
    // Сохраняем результат
    this.state.lastResult = {
      isWin,
      winAmount,
      clickCount: this.state.clickCount,
      timestamp: Date.now()
    };
    
    // Перерисовываем игру
    this.render();
    
    return Promise.resolve({
      success: true,
      isWin,
      winAmount,
      clickCount: this.state.clickCount,
      balance: this.state.balance
    });
  }
  
  /**
   * Обработчик установки ставки
   * @param {number} amount - Новая ставка
   * @returns {Promise<Object>} - Результат действия
   * @private
   */
  async handleSetBet(amount) {
    const betAmount = Number(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      return Promise.reject(new Error('Invalid bet amount'));
    }
    
    // Ограничиваем ставку максимальным значением
    this.state.betAmount = Math.min(betAmount, this.config.maxBet);
    
    // Перерисовываем игру
    this.render();
    
    // Генерируем событие
    this.emit('betChanged', {amount: this.state.betAmount});
    
    return Promise.resolve({
      success: true,
      bet: this.state.betAmount
    });
  }
  
  /**
   * Обработчик установки уровня риска
   * @param {string} level - Новый уровень риска
   * @returns {Promise<Object>} - Результат действия
   * @private
   */
  async handleSetRiskLevel(level) {
    const validLevels = ['low', 'medium', 'high'];
    if (!validLevels.includes(level)) {
      return Promise.reject(new Error('Invalid risk level'));
    }
    
    this.state.riskLevel = level;
    
    // Перерисовываем игру
    this.render();
    
    // Генерируем событие
    this.emit('riskLevelChanged', {level: this.state.riskLevel});
    
    return Promise.resolve({
      success: true,
      riskLevel: this.state.riskLevel
    });
  }
  
  /**
   * Обработчик изменения размера окна
   * @private
   */
  handleResize() {
    if (!this.container || !this.canvas) return;
    
    this.resize(this.container.clientWidth, this.container.clientHeight);
  }
  
  /**
   * Добавляет частицы для анимации клика
   * @param {number} x - Координата X клика
   * @param {number} y - Координата Y клика
   * @private
   */
  addParticles(x, y) {
    // Добавляем 20 частиц
    for (let i = 0; i < 20; i++) {
      const particle = {
        x,
        y,
        radius: 5 + Math.random() * 5,
        color: this.getRandomColor(),
        speedX: -5 + Math.random() * 10,
        speedY: -5 + Math.random() * 10,
        life: 1 // Время жизни (1 = 100%)
      };
      
      this.particles.push(particle);
    }
  }
  
  /**
   * Возвращает случайный цвет для частиц
   * @returns {string} - Цвет в формате hex
   * @private
   */
  getRandomColor() {
    const colors = [
      '#ff5370', // Красный
      '#f78c6c', // Оранжевый
      '#ffcb6b', // Желтый
      '#c3e88d', // Зеленый
      '#89ddff', // Голубой
      '#82aaff', // Синий
      '#c792ea'  // Фиолетовый
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Обновляет состояние частиц
   * @param {number} deltaTime - Время, прошедшее с предыдущего кадра
   * @private
   */
  updateParticles(deltaTime) {
    // Обновляем каждую частицу
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Перемещаем частицу
      particle.x += particle.speedX * deltaTime;
      particle.y += particle.speedY * deltaTime;
      
      // Уменьшаем время жизни
      particle.life -= 0.02 * deltaTime;
      
      // Уменьшаем скорость
      particle.speedX *= 0.99;
      particle.speedY *= 0.99;
      
      // Добавляем гравитацию
      particle.speedY += 0.1 * deltaTime;
      
      // Удаляем мертвые частицы
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  /**
   * Рисует частицы
   * @param {CanvasRenderingContext2D} ctx - Контекст рендеринга
   * @private
   */
  renderParticles(ctx) {
    ctx.save();
    
    // Рисуем каждую частицу
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Анимационный цикл
   * @private
   */
  animate() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 16.667; // Нормализация к ~60 FPS
    this.lastFrameTime = now;
    
    // Обновляем частицы
    this.updateParticles(deltaTime);
    
    // Рендерим игру
    this.render();
    
    // Запрашиваем следующий кадр
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Рендерит игру
   * @private
   */
  render() {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const theme = this.config.theme;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Рисуем фон
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Рисуем центральную кнопку
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.2;
    
    // Градиент для кнопки
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.7,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, theme.buttonColor);
    gradient.addColorStop(1, this.adjustColor(theme.buttonColor, -30));
    
    // Рисуем кнопку
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Добавляем блик
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    // Добавляем тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Рисуем текст на кнопке
    ctx.font = `bold ${radius * 0.3}px Arial`;
    ctx.fillStyle = theme.buttonTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLICK', centerX, centerY);
    
    // Сбрасываем тень
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Рисуем счетчик кликов
    ctx.font = `bold ${Math.min(width, height) * 0.08}px Arial`;
    ctx.fillStyle = theme.counterColor;
    ctx.textAlign = 'center';
    ctx.fillText(`Clicks: ${this.state.clickCount}`, centerX, height * 0.2);
    
    // Рисуем информацию о ставке и балансе
    ctx.font = `${Math.min(width, height) * 0.04}px Arial`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(`Balance: ${this.state.balance}`, centerX, height * 0.3);
    ctx.fillText(`Bet: ${this.state.betAmount} | Risk: ${this.state.riskLevel}`, centerX, height * 0.35);
    
    // Рисуем результат последнего действия
    if (this.state.lastResult) {
      ctx.font = `bold ${Math.min(width, height) * 0.05}px Arial`;
      
      if (this.state.lastResult.isWin) {
        ctx.fillStyle = '#c3e88d'; // Зеленый для выигрыша
        ctx.fillText(`WIN! +${this.state.lastResult.winAmount}`, centerX, height * 0.8);
      } else {
        ctx.fillStyle = '#ff5370'; // Красный для проигрыша
        ctx.fillText(`LOSS -${this.state.betAmount}`, centerX, height * 0.8);
      }
    }
    
    // Рисуем частицы
    this.renderParticles(ctx);
  }
  
  /**
   * Изменяет яркость цвета
   * @param {string} color - Цвет в формате hex
   * @param {number} percent - Процент изменения (-100 до 100)
   * @returns {string} - Новый цвет
   * @private
   */
  adjustColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  }
}

// Экспорт в глобальную область видимости
window.SimpleGame = SimpleGame;