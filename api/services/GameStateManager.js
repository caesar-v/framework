/**
 * GameStateManager.js
 * Сервис для управления состоянием игр, включая сохранение, восстановление и отслеживание истории.
 */

/**
 * Класс менеджера состояния игр
 * Управляет сохранением и восстановлением состояния игр, а также историей состояний
 */
class GameStateManager {
  /**
   * Создает экземпляр менеджера состояния
   * @param {Object} options - Опции конфигурации
   * @param {number} options.maxHistoryLength - Максимальная длина истории состояний для каждой игры
   * @param {boolean} options.autoSave - Автоматически сохранять состояние в localStorage
   * @param {number} options.autoSaveInterval - Интервал автосохранения в миллисекундах
   */
  constructor(options = {}) {
    // Опции по умолчанию
    this.options = {
      maxHistoryLength: 10,
      autoSave: true,
      autoSaveInterval: 30000, // 30 секунд
      ...options
    };
    
    // Хранилище текущих состояний игр (gameId -> состояние)
    this.gameStates = new Map();
    
    // Хранилище истории состояний (gameId -> [состояния])
    this.stateHistory = new Map();
    
    // Указатели истории для каждой игры (gameId -> текущий индекс)
    this.historyPointers = new Map();
    
    // Временные метки последних изменений (gameId -> timestamp)
    this.lastModified = new Map();
    
    // Состояние загруженности данных
    this.loaded = false;
    
    // Запускаем автосохранение, если включено
    if (this.options.autoSave) {
      this.startAutoSave();
    }
  }
  
  /**
   * Инициализирует менеджер состояния и загружает сохраненные данные
   * @return {Promise<void>} Промис, разрешающийся, когда инициализация завершена
   */
  async initialize() {
    console.log('GameStateManager: Initializing...');
    try {
      // Загружаем состояния из localStorage
      this.loadStatesFromStorage();
      
      this.loaded = true;
      console.log('GameStateManager: Initialized successfully');
    } catch (error) {
      console.error('GameStateManager: Error during initialization:', error);
      // При ошибке создаем пустое хранилище
      this.gameStates = new Map();
      this.stateHistory = new Map();
      this.historyPointers = new Map();
      this.lastModified = new Map();
      this.loaded = true;
    }
  }
  
  /**
   * Запускает интервал автосохранения
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      this.saveStatesToStorage();
    }, this.options.autoSaveInterval);
    
    console.log(`GameStateManager: Auto-save enabled with interval ${this.options.autoSaveInterval}ms`);
  }
  
  /**
   * Останавливает автосохранение
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('GameStateManager: Auto-save disabled');
    }
  }
  
  /**
   * Получает текущее состояние игры
   * @param {string} gameId - Идентификатор игры
   * @return {Object|null} Текущее состояние или null, если состояние не найдено
   */
  getState(gameId) {
    if (!gameId) {
      console.error('GameStateManager: Cannot get state without gameId');
      return null;
    }
    
    // Возвращаем копию состояния
    if (this.gameStates.has(gameId)) {
      return JSON.parse(JSON.stringify(this.gameStates.get(gameId)));
    }
    
    return null;
  }
  
  /**
   * Обновляет состояние игры
   * @param {string} gameId - Идентификатор игры
   * @param {Object} state - Новое состояние игры
   * @param {boolean} [addToHistory=true] - Добавлять ли состояние в историю
   * @return {void}
   */
  updateState(gameId, state, addToHistory = true) {
    if (!gameId) {
      console.error('GameStateManager: Cannot update state without gameId');
      return;
    }
    
    if (!state) {
      console.error('GameStateManager: Cannot update with empty state');
      return;
    }
    
    // Получаем текущее состояние
    const currentState = this.gameStates.get(gameId) || {};
    
    // Создаем новое состояние, объединяя текущее с новым
    const newState = { ...currentState, ...state };
    
    // Если нужно добавить в историю, сохраняем текущее состояние в историю
    if (addToHistory && Object.keys(currentState).length > 0) {
      this.addStateToHistory(gameId, currentState);
    }
    
    // Обновляем состояние
    this.gameStates.set(gameId, newState);
    
    // Обновляем временную метку
    this.lastModified.set(gameId, Date.now());
    
    // Если включено автосохранение, сохраняем в localStorage
    if (this.options.autoSave) {
      this.saveGameStateToStorage(gameId);
    }
  }
  
  /**
   * Полностью заменяет состояние игры
   * @param {string} gameId - Идентификатор игры
   * @param {Object} state - Новое состояние игры
   * @param {boolean} [addToHistory=true] - Добавлять ли текущее состояние в историю
   * @return {void}
   */
  setState(gameId, state, addToHistory = true) {
    if (!gameId) {
      console.error('GameStateManager: Cannot set state without gameId');
      return;
    }
    
    // Если нужно добавить в историю, сохраняем текущее состояние
    if (addToHistory && this.gameStates.has(gameId)) {
      this.addStateToHistory(gameId, this.gameStates.get(gameId));
    }
    
    // Устанавливаем новое состояние (создаем копию)
    this.gameStates.set(gameId, JSON.parse(JSON.stringify(state || {})));
    
    // Обновляем временную метку
    this.lastModified.set(gameId, Date.now());
    
    // Если включено автосохранение, сохраняем в localStorage
    if (this.options.autoSave) {
      this.saveGameStateToStorage(gameId);
    }
  }
  
  /**
   * Очищает состояние игры
   * @param {string} gameId - Идентификатор игры
   * @param {boolean} [clearHistory=false] - Очищать ли историю состояний
   * @return {void}
   */
  clearState(gameId, clearHistory = false) {
    if (!gameId) {
      console.error('GameStateManager: Cannot clear state without gameId');
      return;
    }
    
    // Очищаем состояние
    this.gameStates.delete(gameId);
    
    // Если нужно, очищаем историю
    if (clearHistory) {
      this.stateHistory.delete(gameId);
      this.historyPointers.delete(gameId);
    }
    
    // Обновляем временную метку
    this.lastModified.set(gameId, Date.now());
    
    // Если включено автосохранение, удаляем из localStorage
    if (this.options.autoSave) {
      this.removeGameStateFromStorage(gameId);
    }
  }
  
  /**
   * Добавляет состояние в историю
   * @param {string} gameId - Идентификатор игры
   * @param {Object} state - Состояние для добавления в историю
   * @return {void}
   * @private
   */
  addStateToHistory(gameId, state) {
    if (!gameId || !state) return;
    
    // Получаем текущую историю
    let history = this.stateHistory.get(gameId) || [];
    let pointer = this.historyPointers.get(gameId) || -1;
    
    // Если указатель не в конце истории, отбрасываем состояния после указателя
    if (pointer < history.length - 1) {
      history = history.slice(0, pointer + 1);
    }
    
    // Добавляем состояние в историю
    history.push(JSON.parse(JSON.stringify(state)));
    
    // Если история превышает максимальную длину, удаляем старые состояния
    if (history.length > this.options.maxHistoryLength) {
      history = history.slice(history.length - this.options.maxHistoryLength);
    }
    
    // Обновляем указатель
    pointer = history.length - 1;
    
    // Сохраняем обновленную историю и указатель
    this.stateHistory.set(gameId, history);
    this.historyPointers.set(gameId, pointer);
  }
  
  /**
   * Отменяет последнее изменение состояния
   * @param {string} gameId - Идентификатор игры
   * @return {Object|null} Предыдущее состояние или null, если история пуста
   */
  undo(gameId) {
    if (!gameId) {
      console.error('GameStateManager: Cannot undo without gameId');
      return null;
    }
    
    // Получаем историю и указатель
    const history = this.stateHistory.get(gameId) || [];
    let pointer = this.historyPointers.get(gameId) || -1;
    
    // Если история пуста или указатель в начале, невозможно отменить
    if (history.length === 0 || pointer < 0) {
      console.log(`GameStateManager: Cannot undo for ${gameId}, no history available`);
      return null;
    }
    
    // Уменьшаем указатель
    pointer--;
    this.historyPointers.set(gameId, pointer);
    
    // Получаем предыдущее состояние
    const previousState = pointer >= 0 ? history[pointer] : {};
    
    // Обновляем текущее состояние
    this.gameStates.set(gameId, JSON.parse(JSON.stringify(previousState)));
    
    // Обновляем временную метку
    this.lastModified.set(gameId, Date.now());
    
    // Если включено автосохранение, сохраняем в localStorage
    if (this.options.autoSave) {
      this.saveGameStateToStorage(gameId);
    }
    
    return previousState;
  }
  
  /**
   * Повторяет отмененное изменение состояния
   * @param {string} gameId - Идентификатор игры
   * @return {Object|null} Следующее состояние или null, если достигнут конец истории
   */
  redo(gameId) {
    if (!gameId) {
      console.error('GameStateManager: Cannot redo without gameId');
      return null;
    }
    
    // Получаем историю и указатель
    const history = this.stateHistory.get(gameId) || [];
    let pointer = this.historyPointers.get(gameId) || -1;
    
    // Если история пуста или указатель в конце, невозможно повторить
    if (history.length === 0 || pointer >= history.length - 1) {
      console.log(`GameStateManager: Cannot redo for ${gameId}, at the end of history`);
      return null;
    }
    
    // Увеличиваем указатель
    pointer++;
    this.historyPointers.set(gameId, pointer);
    
    // Получаем следующее состояние
    const nextState = history[pointer];
    
    // Обновляем текущее состояние
    this.gameStates.set(gameId, JSON.parse(JSON.stringify(nextState)));
    
    // Обновляем временную метку
    this.lastModified.set(gameId, Date.now());
    
    // Если включено автосохранение, сохраняем в localStorage
    if (this.options.autoSave) {
      this.saveGameStateToStorage(gameId);
    }
    
    return nextState;
  }
  
  /**
   * Проверяет, доступна ли отмена действия
   * @param {string} gameId - Идентификатор игры
   * @return {boolean} true, если можно отменить действие
   */
  canUndo(gameId) {
    if (!gameId) return false;
    
    const history = this.stateHistory.get(gameId) || [];
    const pointer = this.historyPointers.get(gameId) || -1;
    
    return history.length > 0 && pointer >= 0;
  }
  
  /**
   * Проверяет, доступно ли повторение действия
   * @param {string} gameId - Идентификатор игры
   * @return {boolean} true, если можно повторить действие
   */
  canRedo(gameId) {
    if (!gameId) return false;
    
    const history = this.stateHistory.get(gameId) || [];
    const pointer = this.historyPointers.get(gameId) || -1;
    
    return history.length > 0 && pointer < history.length - 1;
  }
  
  /**
   * Получает информацию о доступных действиях отмены/повтора
   * @param {string} gameId - Идентификатор игры
   * @return {Object} Объект с флагами canUndo и canRedo
   */
  getHistoryInfo(gameId) {
    return {
      canUndo: this.canUndo(gameId),
      canRedo: this.canRedo(gameId),
      historyLength: (this.stateHistory.get(gameId) || []).length,
      currentPosition: this.historyPointers.get(gameId) || -1
    };
  }
  
  /**
   * Сохраняет состояние игры в localStorage
   * @param {string} gameId - Идентификатор игры
   * @return {void}
   * @private
   */
  saveGameStateToStorage(gameId) {
    if (!gameId || !this.gameStates.has(gameId)) return;
    
    try {
      const stateKey = `gameState_${gameId}`;
      const state = this.gameStates.get(gameId);
      
      localStorage.setItem(stateKey, JSON.stringify({
        state,
        timestamp: this.lastModified.get(gameId) || Date.now()
      }));
      
      console.log(`GameStateManager: Saved state for ${gameId} to localStorage`);
    } catch (error) {
      console.error(`GameStateManager: Error saving state for ${gameId}:`, error);
    }
  }
  
  /**
   * Удаляет состояние игры из localStorage
   * @param {string} gameId - Идентификатор игры
   * @return {void}
   * @private
   */
  removeGameStateFromStorage(gameId) {
    if (!gameId) return;
    
    try {
      const stateKey = `gameState_${gameId}`;
      localStorage.removeItem(stateKey);
      
      console.log(`GameStateManager: Removed state for ${gameId} from localStorage`);
    } catch (error) {
      console.error(`GameStateManager: Error removing state for ${gameId}:`, error);
    }
  }
  
  /**
   * Загружает состояния всех игр из localStorage
   * @return {void}
   * @private
   */
  loadStatesFromStorage() {
    try {
      // Очищаем текущие состояния
      this.gameStates = new Map();
      this.stateHistory = new Map();
      this.historyPointers = new Map();
      this.lastModified = new Map();
      
      // Перебираем все ключи localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Проверяем, относится ли ключ к состоянию игры
        if (key && key.startsWith('gameState_')) {
          try {
            const gameId = key.substring('gameState_'.length);
            const data = JSON.parse(localStorage.getItem(key));
            
            if (data && data.state) {
              // Сохраняем состояние игры
              this.gameStates.set(gameId, data.state);
              
              // Сохраняем временную метку
              if (data.timestamp) {
                this.lastModified.set(gameId, data.timestamp);
              }
              
              console.log(`GameStateManager: Loaded state for ${gameId} from localStorage`);
            }
          } catch (parseError) {
            console.error(`GameStateManager: Error parsing state from localStorage:`, parseError);
          }
        }
      }
      
      console.log(`GameStateManager: Loaded states for ${this.gameStates.size} games from localStorage`);
    } catch (error) {
      console.error('GameStateManager: Error loading states from localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Сохраняет все состояния игр в localStorage
   * @return {void}
   * @private
   */
  saveStatesToStorage() {
    try {
      // Перебираем все игры и сохраняем их состояния
      for (const [gameId, state] of this.gameStates.entries()) {
        this.saveGameStateToStorage(gameId);
      }
      
      console.log(`GameStateManager: Saved all ${this.gameStates.size} game states to localStorage`);
    } catch (error) {
      console.error('GameStateManager: Error saving states to localStorage:', error);
    }
  }
  
  /**
   * Получает временную метку последнего изменения состояния игры
   * @param {string} gameId - Идентификатор игры
   * @return {number|null} Временная метка (timestamp) или null, если нет данных
   */
  getLastModified(gameId) {
    if (!gameId) return null;
    return this.lastModified.get(gameId) || null;
  }
  
  /**
   * Проверяет, было ли изменено состояние игры с момента последней проверки
   * @param {string} gameId - Идентификатор игры
   * @param {number} timestamp - Временная метка для сравнения
   * @return {boolean} true, если состояние было изменено после указанной временной метки
   */
  wasModifiedSince(gameId, timestamp) {
    if (!gameId || !timestamp) return false;
    
    const lastModified = this.getLastModified(gameId);
    if (!lastModified) return false;
    
    return lastModified > timestamp;
  }
  
  /**
   * Получает список всех игр с сохраненными состояниями
   * @return {string[]} Массив идентификаторов игр
   */
  getGamesWithSavedStates() {
    return Array.from(this.gameStates.keys());
  }
  
  /**
   * Удаляет все сохраненные состояния
   * @param {boolean} [removeFromStorage=true] - Удалять ли данные из localStorage
   * @return {void}
   */
  clearAllStates(removeFromStorage = true) {
    // Сохраняем список игр для удаления из localStorage
    const gameIds = Array.from(this.gameStates.keys());
    
    // Очищаем все состояния
    this.gameStates.clear();
    this.stateHistory.clear();
    this.historyPointers.clear();
    this.lastModified.clear();
    
    // Если нужно, удаляем данные из localStorage
    if (removeFromStorage) {
      gameIds.forEach(gameId => {
        this.removeGameStateFromStorage(gameId);
      });
    }
    
    console.log('GameStateManager: Cleared all game states');
  }
}

export default GameStateManager;