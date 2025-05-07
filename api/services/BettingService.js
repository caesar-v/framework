/**
 * BettingService.js
 * Централизованный сервис для управления ставками, балансом и расчетами выигрышей
 */

/**
 * Класс сервиса ставок
 * Управляет ставками, балансом, историей ставок и выигрышами
 */
class BettingService {
  /**
   * Создает экземпляр сервиса ставок
   * @param {Object} options - Опции конфигурации
   * @param {number} options.initialBalance - Начальный баланс
   * @param {number} options.minBet - Минимальная ставка
   * @param {number} options.maxBet - Максимальная ставка
   * @param {number} options.defaultBet - Ставка по умолчанию
   * @param {string} options.currency - Валюта
   * @param {boolean} options.persistBalance - Сохранять ли баланс в localStorage
   * @param {number} options.maxHistoryEntries - Максимальное количество записей в истории
   */
  constructor(options = {}) {
    // Опции по умолчанию
    this.options = {
      initialBalance: 1000,
      minBet: 1,
      maxBet: 100,
      defaultBet: 10,
      currency: '$',
      persistBalance: true,
      maxHistoryEntries: 100,
      ...options
    };
    
    // Текущие значения
    this.balance = this.options.initialBalance;
    this.currentBet = this.options.defaultBet;
    this.currentRiskLevel = 'medium'; // low, medium, high
    
    // Мультипликаторы для уровней риска
    this.riskMultipliers = {
      low: 1.5,
      medium: 3,
      high: 6
    };
    
    // История ставок и выигрышей
    this.history = [];
    
    // Лимиты для конкретных игр (gameId -> { minBet, maxBet, defaultBet })
    this.gameLimits = new Map();
    
    // Загружаем сохраненные данные
    this.loadPersistedData();
    
    // Подписчики на события
    this.subscribers = {
      balanceChange: [],
      betChange: [],
      riskLevelChange: [],
      win: [],
      loss: []
    };
    
    console.log('BettingService: Initialized with balance', this.formatAmount(this.balance));
  }
  
  /**
   * Загружает сохраненные данные из localStorage
   * @private
   */
  loadPersistedData() {
    if (this.options.persistBalance) {
      try {
        const savedBalance = localStorage.getItem('betting_balance');
        if (savedBalance !== null) {
          this.balance = parseFloat(savedBalance);
          console.log('BettingService: Loaded balance from storage:', this.formatAmount(this.balance));
        }
        
        const savedBet = localStorage.getItem('betting_current_bet');
        if (savedBet !== null) {
          this.currentBet = parseFloat(savedBet);
        }
        
        const savedRiskLevel = localStorage.getItem('betting_risk_level');
        if (savedRiskLevel !== null) {
          this.currentRiskLevel = savedRiskLevel;
        }
        
        const savedHistory = localStorage.getItem('betting_history');
        if (savedHistory !== null) {
          this.history = JSON.parse(savedHistory);
        }
      } catch (error) {
        console.error('BettingService: Error loading persisted data:', error);
      }
    }
  }
  
  /**
   * Сохраняет данные в localStorage
   * @private
   */
  persistData() {
    if (this.options.persistBalance) {
      try {
        localStorage.setItem('betting_balance', this.balance.toString());
        localStorage.setItem('betting_current_bet', this.currentBet.toString());
        localStorage.setItem('betting_risk_level', this.currentRiskLevel);
        localStorage.setItem('betting_history', JSON.stringify(this.history));
      } catch (error) {
        console.error('BettingService: Error persisting data:', error);
      }
    }
  }
  
  /**
   * Форматирует сумму с символом валюты
   * @param {number} amount - Сумма для форматирования
   * @return {string} Форматированная строка
   */
  formatAmount(amount) {
    return `${this.options.currency}${amount.toFixed(2)}`;
  }
  
  /**
   * Получает текущий баланс
   * @return {number} Текущий баланс
   */
  getBalance() {
    return this.balance;
  }
  
  /**
   * Получает текущий баланс в форматированном виде
   * @return {string} Форматированный баланс
   */
  getFormattedBalance() {
    return this.formatAmount(this.balance);
  }
  
  /**
   * Устанавливает новый баланс
   * @param {number} amount - Новый баланс
   * @param {boolean} [notify=true] - Отправлять ли уведомления
   * @return {number} Новый баланс
   */
  setBalance(amount, notify = true) {
    const oldBalance = this.balance;
    this.balance = amount;
    
    // Сохраняем в localStorage
    this.persistData();
    
    // Уведомляем подписчиков
    if (notify) {
      this.notifySubscribers('balanceChange', {
        oldBalance,
        newBalance: this.balance,
        difference: this.balance - oldBalance
      });
    }
    
    return this.balance;
  }
  
  /**
   * Обновляет баланс (добавляет или вычитает)
   * @param {number} amount - Сумма для добавления (положительное) или вычитания (отрицательное)
   * @param {string} [reason='adjustment'] - Причина изменения баланса
   * @param {Object} [metadata={}] - Дополнительные данные
   * @return {number} Новый баланс
   */
  updateBalance(amount, reason = 'adjustment', metadata = {}) {
    const oldBalance = this.balance;
    this.balance += amount;
    
    // Записываем в историю
    this.addToHistory({
      type: amount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      balance: this.balance,
      reason,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Сохраняем в localStorage
    this.persistData();
    
    // Уведомляем подписчиков
    this.notifySubscribers('balanceChange', {
      oldBalance,
      newBalance: this.balance,
      difference: amount,
      reason,
      metadata
    });
    
    return this.balance;
  }
  
  /**
   * Получает текущую ставку
   * @return {number} Текущая ставка
   */
  getBet() {
    return this.currentBet;
  }
  
  /**
   * Получает текущую ставку в форматированном виде
   * @return {string} Форматированная ставка
   */
  getFormattedBet() {
    return this.formatAmount(this.currentBet);
  }
  
  /**
   * Устанавливает новую ставку с валидацией
   * @param {number} amount - Новая ставка
   * @param {string} [gameId=null] - ID игры для проверки лимитов
   * @return {Object} Результат операции { success, bet, message }
   */
  setBet(amount, gameId = null) {
    // Получаем лимиты для игры или глобальные
    const limits = this.getLimitsForGame(gameId);
    
    // Валидация
    if (isNaN(amount) || amount <= 0) {
      return { 
        success: false, 
        bet: this.currentBet, 
        message: 'Ставка должна быть положительным числом' 
      };
    }
    
    if (amount < limits.minBet) {
      return { 
        success: false, 
        bet: this.currentBet, 
        message: `Ставка не может быть меньше ${this.formatAmount(limits.minBet)}` 
      };
    }
    
    if (amount > limits.maxBet) {
      return { 
        success: false, 
        bet: this.currentBet, 
        message: `Ставка не может быть больше ${this.formatAmount(limits.maxBet)}` 
      };
    }
    
    if (amount > this.balance) {
      return { 
        success: false, 
        bet: this.currentBet, 
        message: 'Недостаточно средств для такой ставки' 
      };
    }
    
    // Если все проверки пройдены, устанавливаем новую ставку
    const oldBet = this.currentBet;
    this.currentBet = amount;
    
    // Сохраняем в localStorage
    this.persistData();
    
    // Уведомляем подписчиков
    this.notifySubscribers('betChange', {
      oldBet,
      newBet: this.currentBet,
      gameId
    });
    
    return { 
      success: true, 
      bet: this.currentBet, 
      message: 'Ставка успешно изменена' 
    };
  }
  
  /**
   * Увеличивает ставку на указанную сумму или процент
   * @param {number|string} amount - Сумма или процент для увеличения
   * @param {string} [gameId=null] - ID игры для проверки лимитов
   * @return {Object} Результат операции { success, bet, message }
   */
  increaseBet(amount, gameId = null) {
    let newBet = this.currentBet;
    
    // Проверяем, является ли amount процентом
    if (typeof amount === 'string' && amount.endsWith('%')) {
      const percent = parseFloat(amount);
      if (!isNaN(percent)) {
        newBet += (this.currentBet * percent / 100);
      }
    } else {
      // Иначе просто добавляем сумму
      newBet += parseFloat(amount);
    }
    
    // Округляем до 2 знаков после запятой
    newBet = Math.round(newBet * 100) / 100;
    
    return this.setBet(newBet, gameId);
  }
  
  /**
   * Уменьшает ставку на указанную сумму или процент
   * @param {number|string} amount - Сумма или процент для уменьшения
   * @param {string} [gameId=null] - ID игры для проверки лимитов
   * @return {Object} Результат операции { success, bet, message }
   */
  decreaseBet(amount, gameId = null) {
    let newBet = this.currentBet;
    
    // Проверяем, является ли amount процентом
    if (typeof amount === 'string' && amount.endsWith('%')) {
      const percent = parseFloat(amount);
      if (!isNaN(percent)) {
        newBet -= (this.currentBet * percent / 100);
      }
    } else {
      // Иначе просто вычитаем сумму
      newBet -= parseFloat(amount);
    }
    
    // Округляем до 2 знаков после запятой
    newBet = Math.round(newBet * 100) / 100;
    
    return this.setBet(newBet, gameId);
  }
  
  /**
   * Устанавливает максимальную ставку
   * @param {string} [gameId=null] - ID игры для проверки лимитов
   * @return {Object} Результат операции { success, bet, message }
   */
  setMaxBet(gameId = null) {
    const limits = this.getLimitsForGame(gameId);
    const maxPossibleBet = Math.min(limits.maxBet, this.balance);
    return this.setBet(maxPossibleBet, gameId);
  }
  
  /**
   * Устанавливает минимальную ставку
   * @param {string} [gameId=null] - ID игры для проверки лимитов
   * @return {Object} Результат операции { success, bet, message }
   */
  setMinBet(gameId = null) {
    const limits = this.getLimitsForGame(gameId);
    return this.setBet(limits.minBet, gameId);
  }
  
  /**
   * Получает текущий уровень риска
   * @return {string} Текущий уровень риска
   */
  getRiskLevel() {
    return this.currentRiskLevel;
  }
  
  /**
   * Устанавливает новый уровень риска
   * @param {string} level - Новый уровень риска ('low', 'medium', 'high')
   * @return {boolean} Успешность операции
   */
  setRiskLevel(level) {
    if (!['low', 'medium', 'high'].includes(level)) {
      console.error(`BettingService: Invalid risk level: ${level}`);
      return false;
    }
    
    const oldLevel = this.currentRiskLevel;
    this.currentRiskLevel = level;
    
    // Сохраняем в localStorage
    this.persistData();
    
    // Уведомляем подписчиков
    this.notifySubscribers('riskLevelChange', {
      oldLevel,
      newLevel: this.currentRiskLevel
    });
    
    return true;
  }
  
  /**
   * Получает множитель для текущего уровня риска
   * @return {number} Множитель риска
   */
  getCurrentRiskMultiplier() {
    return this.riskMultipliers[this.currentRiskLevel] || this.riskMultipliers.medium;
  }
  
  /**
   * Устанавливает множители риска
   * @param {Object} multipliers - Объект с множителями { low, medium, high }
   */
  setRiskMultipliers(multipliers) {
    this.riskMultipliers = { ...this.riskMultipliers, ...multipliers };
  }
  
  /**
   * Рассчитывает потенциальный выигрыш
   * @param {number} [betAmount=null] - Сумма ставки (если не указана, используется текущая)
   * @param {string} [riskLevel=null] - Уровень риска (если не указан, используется текущий)
   * @param {string} [gameId=null] - ID игры для дополнительных расчетов
   * @return {number} Потенциальный выигрыш
   */
  calculatePotentialWin(betAmount = null, riskLevel = null, gameId = null) {
    // Используем переданные значения или текущие
    const bet = betAmount !== null ? betAmount : this.currentBet;
    const level = riskLevel !== null ? riskLevel : this.currentRiskLevel;
    
    // Получаем множитель
    const multiplier = this.riskMultipliers[level] || this.riskMultipliers.medium;
    
    // Базовый расчет
    let potentialWin = bet * multiplier;
    
    // Если указан gameId, проверяем, есть ли специфичный калькулятор для этой игры
    if (gameId && this.gameCalculators.has(gameId)) {
      const calculator = this.gameCalculators.get(gameId);
      try {
        potentialWin = calculator(bet, level, multiplier);
      } catch (error) {
        console.error(`BettingService: Error in game calculator for ${gameId}:`, error);
      }
    }
    
    // Округляем до 2 знаков после запятой
    return Math.round(potentialWin * 100) / 100;
  }
  
  /**
   * Регистрирует выигрыш
   * @param {number} amount - Сумма выигрыша
   * @param {string} gameId - ID игры
   * @param {Object} [metadata={}] - Дополнительные данные о выигрыше
   * @return {Object} Информация о выигрыше
   */
  registerWin(amount, gameId, metadata = {}) {
    // Обновляем баланс
    this.updateBalance(amount, 'win', { gameId, ...metadata });
    
    // Создаем объект с информацией о выигрыше
    const winInfo = {
      amount,
      gameId,
      bet: this.currentBet,
      riskLevel: this.currentRiskLevel,
      multiplier: amount / this.currentBet,
      timestamp: Date.now(),
      ...metadata
    };
    
    // Уведомляем подписчиков
    this.notifySubscribers('win', winInfo);
    
    return winInfo;
  }
  
  /**
   * Регистрирует проигрыш
   * @param {string} gameId - ID игры
   * @param {Object} [metadata={}] - Дополнительные данные о проигрыше
   * @return {Object} Информация о проигрыше
   */
  registerLoss(gameId, metadata = {}) {
    // Вычитаем ставку из баланса
    this.updateBalance(-this.currentBet, 'loss', { gameId, ...metadata });
    
    // Создаем объект с информацией о проигрыше
    const lossInfo = {
      amount: this.currentBet,
      gameId,
      bet: this.currentBet,
      riskLevel: this.currentRiskLevel,
      timestamp: Date.now(),
      ...metadata
    };
    
    // Уведомляем подписчиков
    this.notifySubscribers('loss', lossInfo);
    
    return lossInfo;
  }
  
  /**
   * Размещает ставку (вычитает из баланса)
   * @param {number} [amount=null] - Сумма ставки (если не указана, используется текущая)
   * @param {string} [gameId=null] - ID игры
   * @param {Object} [metadata={}] - Дополнительные данные
   * @return {Object} Результат операции
   */
  placeBet(amount = null, gameId = null, metadata = {}) {
    // Используем переданную сумму или текущую ставку
    const betAmount = amount !== null ? amount : this.currentBet;
    
    // Проверяем, достаточно ли средств
    if (betAmount > this.balance) {
      return {
        success: false,
        message: 'Недостаточно средств для размещения ставки',
        balance: this.balance,
        bet: betAmount
      };
    }
    
    // Вычитаем ставку из баланса
    this.updateBalance(-betAmount, 'bet', { gameId, ...metadata });
    
    return {
      success: true,
      message: 'Ставка размещена',
      balance: this.balance,
      bet: betAmount
    };
  }
  
  /**
   * Устанавливает лимиты для конкретной игры
   * @param {string} gameId - ID игры
   * @param {Object} limits - Объект с лимитами { minBet, maxBet, defaultBet }
   */
  setGameLimits(gameId, limits) {
    if (!gameId) return;
    
    this.gameLimits.set(gameId, {
      minBet: limits.minBet !== undefined ? limits.minBet : this.options.minBet,
      maxBet: limits.maxBet !== undefined ? limits.maxBet : this.options.maxBet,
      defaultBet: limits.defaultBet !== undefined ? limits.defaultBet : this.options.defaultBet
    });
    
    console.log(`BettingService: Set limits for ${gameId}:`, this.gameLimits.get(gameId));
  }
  
  /**
   * Получает лимиты для игры или глобальные
   * @param {string} [gameId=null] - ID игры
   * @return {Object} Объект с лимитами
   */
  getLimitsForGame(gameId) {
    if (gameId && this.gameLimits.has(gameId)) {
      return this.gameLimits.get(gameId);
    }
    
    return {
      minBet: this.options.minBet,
      maxBet: this.options.maxBet,
      defaultBet: this.options.defaultBet
    };
  }
  
  /**
   * Добавляет запись в историю и ограничивает ее размер
   * @param {Object} entry - Запись для добавления
   * @private
   */
  addToHistory(entry) {
    this.history.unshift(entry);
    
    // Ограничиваем размер истории
    if (this.history.length > this.options.maxHistoryEntries) {
      this.history = this.history.slice(0, this.options.maxHistoryEntries);
    }
  }
  
  /**
   * Получает историю ставок и выигрышей
   * @param {number} [limit=10] - Максимальное количество записей
   * @param {string} [type=null] - Тип записей ('win', 'loss', 'bet', 'credit', 'debit')
   * @param {string} [gameId=null] - Фильтр по ID игры
   * @return {Array} Массив записей истории
   */
  getHistory(limit = 10, type = null, gameId = null) {
    let filteredHistory = [...this.history];
    
    // Фильтрация по типу
    if (type) {
      filteredHistory = filteredHistory.filter(entry => entry.type === type || entry.reason === type);
    }
    
    // Фильтрация по ID игры
    if (gameId) {
      filteredHistory = filteredHistory.filter(entry => entry.gameId === gameId);
    }
    
    // Ограничение количества записей
    return filteredHistory.slice(0, limit);
  }
  
  /**
   * Очищает историю
   */
  clearHistory() {
    this.history = [];
    this.persistData();
  }
  
  /**
   * Сбрасывает баланс до начального
   */
  resetBalance() {
    this.setBalance(this.options.initialBalance);
  }
  
  /**
   * Подписывает на события
   * @param {string} event - Название события
   * @param {Function} callback - Функция обратного вызова
   * @return {Function} Функция для отписки
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    
    this.subscribers[event].push(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      this.unsubscribe(event, callback);
    };
  }
  
  /**
   * Отписывает от события
   * @param {string} event - Название события
   * @param {Function} callback - Функция обратного вызова
   */
  unsubscribe(event, callback) {
    if (!this.subscribers[event]) return;
    
    this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
  }
  
  /**
   * Уведомляет подписчиков о событии
   * @param {string} event - Название события
   * @param {Object} data - Данные события
   * @private
   */
  notifySubscribers(event, data) {
    if (!this.subscribers[event]) return;
    
    for (const callback of this.subscribers[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`BettingService: Error in subscriber callback for ${event}:`, error);
      }
    }
  }
  
  // Map для хранения калькуляторов выигрыша для конкретных игр
  gameCalculators = new Map();
  
  /**
   * Регистрирует калькулятор выигрыша для конкретной игры
   * @param {string} gameId - ID игры
   * @param {Function} calculator - Функция расчета (bet, riskLevel, baseMultiplier) => winAmount
   */
  registerGameCalculator(gameId, calculator) {
    if (typeof calculator !== 'function') {
      console.error('BettingService: Calculator must be a function');
      return;
    }
    
    this.gameCalculators.set(gameId, calculator);
    console.log(`BettingService: Registered custom calculator for ${gameId}`);
  }
  
  /**
   * Удаляет калькулятор выигрыша для игры
   * @param {string} gameId - ID игры
   */
  removeGameCalculator(gameId) {
    this.gameCalculators.delete(gameId);
  }
  
  /**
   * Анализирует и конфигурирует сервис на основе манифеста игры
   * @param {string} gameId - ID игры
   * @param {Object} manifest - Объект манифеста
   */
  configureFromManifest(gameId, manifest) {
    if (!gameId || !manifest) return;
    
    try {
      // Устанавливаем лимиты из манифеста, если они есть
      if (manifest.config) {
        const limits = {
          minBet: manifest.config.minBet,
          maxBet: manifest.config.maxBet,
          defaultBet: manifest.config.defaultBet
        };
        
        this.setGameLimits(gameId, limits);
        
        // Если есть настройки для уровней риска, устанавливаем их
        if (manifest.config.riskLevels) {
          this.setRiskMultipliers(manifest.config.riskLevels);
        }
        
        // Если указан уровень риска по умолчанию, устанавливаем его
        if (manifest.config.defaultRiskLevel) {
          this.setRiskLevel(manifest.config.defaultRiskLevel);
        }
      }
      
      console.log(`BettingService: Configured for ${gameId} from manifest`);
    } catch (error) {
      console.error(`BettingService: Error configuring from manifest for ${gameId}:`, error);
    }
  }
}

export default BettingService;