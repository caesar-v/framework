/**
 * IGameTester - Утилита для тестирования соответствия игры интерфейсу IGame
 * 
 * Проверяет, правильно ли реализованы все обязательные методы интерфейса IGame,
 * работоспособность игрового цикла и обработку событий.
 */

class IGameTester {
  /**
   * Создает новый экземпляр тестера
   * @param {Object} options - Настройки тестирования
   * @param {HTMLElement} options.container - Контейнер для отображения тестов и игры
   * @param {Function} options.onComplete - Колбэк, вызываемый после завершения всех тестов
   * @param {boolean} options.verbose - Выводить подробные сообщения в консоль
   * @param {number} options.timeout - Таймаут для асинхронных тестов (в мс)
   */
  constructor(options = {}) {
    // Настройки по умолчанию
    this.options = {
      container: document.body,
      onComplete: null,
      verbose: true,
      timeout: 5000,
      ...options
    };
    
    // Состояние тестов
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      testDetails: []
    };
    
    // Тестируемая игра
    this.gameInstance = null;
    this.gameConstructor = null;
    
    // Контейнер для игры
    this.gameContainer = null;
    
    // Контейнер для отображения результатов
    this.resultsContainer = null;
    
    // Текущие тесты
    this.currentTestGroup = '';
    this.currentTest = '';
    
    // Обработчики событий для отслеживания
    this.eventHandlers = {};
    this.capturedEvents = {};
    
    // Инициализация
    this.initUI();
  }
  
  /**
   * Инициализирует пользовательский интерфейс
   * @private
   */
  initUI() {
    // Очищаем контейнер
    this.options.container.innerHTML = '';
    
    // Создаем элементы интерфейса
    const wrapper = document.createElement('div');
    wrapper.className = 'igame-tester-wrapper';
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 20px; padding: 20px; font-family: Arial, sans-serif;';
    
    // Заголовок
    const header = document.createElement('h1');
    header.textContent = 'IGame Interface Compatibility Tester';
    header.style.cssText = 'margin: 0; color: #333;';
    wrapper.appendChild(header);
    
    // Контейнер для результатов
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'test-results';
    this.resultsContainer.style.cssText = 'flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 15px;';
    wrapper.appendChild(this.resultsContainer);
    
    // Контейнер для игры (будет использоваться для тестирования)
    this.gameContainer = document.createElement('div');
    this.gameContainer.className = 'game-container';
    this.gameContainer.style.cssText = 'width: 100%; height: 300px; border: 1px solid #ddd; border-radius: 4px; position: relative;';
    wrapper.appendChild(this.gameContainer);
    
    // Кнопки управления
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';
    
    // Кнопка экспорта результатов
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Results';
    exportButton.onclick = () => this.exportResults();
    exportButton.style.cssText = 'padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;';
    controlsContainer.appendChild(exportButton);
    
    // Кнопка очистки результатов
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Results';
    clearButton.onclick = () => this.clearResults();
    clearButton.style.cssText = 'padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
    controlsContainer.appendChild(clearButton);
    
    wrapper.appendChild(controlsContainer);
    
    // Добавляем всё в основной контейнер
    this.options.container.appendChild(wrapper);
  }
  
  /**
   * Настраивает тестируемую игру
   * @param {Function} GameConstructor - Конструктор игры для тестирования
   * @param {Object} gameConfig - Дополнительная конфигурация для игры
   * @returns {IGameTester} Текущий экземпляр для цепочки вызовов
   */
  setGame(GameConstructor, gameConfig = {}) {
    this.gameConstructor = GameConstructor;
    this.gameConfig = gameConfig;
    
    // Показываем информацию о тестируемой игре
    this.log(`Setting up test for ${GameConstructor.name || 'Unknown Game'}`);
    
    return this;
  }
  
  /**
   * Запускает все тесты
   * @returns {Promise<Object>} Результаты тестирования
   */
  async runAllTests() {
    this.clearResults();
    
    if (!this.gameConstructor) {
      this.log('No game set for testing. Use setGame() first.', 'error');
      return this.results;
    }
    
    // Запускаем все группы тестов последовательно
    try {
      await this.testConstructor();
      await this.testInterface();
      await this.testLifecycle();
      await this.testActions();
      await this.testEvents();
      await this.testState();
      
      // Записываем итоговый результат
      this.log(`Test completed: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`, 
               this.results.failed === 0 ? 'success' : 'error');
      
      // Вызываем колбэк завершения, если он задан
      if (typeof this.options.onComplete === 'function') {
        this.options.onComplete(this.results);
      }
    } catch (error) {
      this.log(`Fatal error during test execution: ${error.message}`, 'error');
      console.error('Test execution error:', error);
    }
    
    return this.results;
  }
  
  /**
   * Тестирует конструктор игры
   * @private
   */
  async testConstructor() {
    this.currentTestGroup = 'Constructor';
    this.logGroup('Testing constructor');
    
    // Тест: Создание экземпляра без параметров
    this.currentTest = 'Creating instance without parameters';
    try {
      const gameInstance = new this.gameConstructor();
      this.assert(gameInstance instanceof this.gameConstructor, 'Game instance should be created');
      this.pass();
    } catch (error) {
      this.fail(`Failed to create game instance: ${error.message}`);
    }
    
    // Тест: Создание экземпляра с параметрами
    this.currentTest = 'Creating instance with parameters';
    try {
      const gameInstance = new this.gameConstructor(this.gameConfig);
      this.assert(gameInstance instanceof this.gameConstructor, 'Game instance should be created with config');
      this.pass();
    } catch (error) {
      this.fail(`Failed to create game instance with config: ${error.message}`);
    }
    
    this.logGroupEnd();
  }
  
  /**
   * Тестирует наличие всех методов интерфейса IGame
   * @private
   */
  async testInterface() {
    this.currentTestGroup = 'Interface Methods';
    this.logGroup('Testing interface methods');
    
    // Создаем экземпляр для тестирования
    try {
      this.gameInstance = new this.gameConstructor(this.gameConfig);
    } catch (error) {
      this.log(`Failed to create game instance for interface testing: ${error.message}`, 'error');
      this.logGroupEnd();
      return;
    }
    
    // Список обязательных методов интерфейса IGame
    const requiredMethods = [
      'initialize',
      'start',
      'pause',
      'resume',
      'destroy',
      'performAction',
      'resize',
      'updateSettings',
      'calculatePotentialWin',
      'getState',
      'setState',
      'getInfo',
      'supportsFeature',
      'getAvailableEvents',
      'addEventListener',
      'removeEventListener'
    ];
    
    // Проверяем наличие всех методов
    for (const method of requiredMethods) {
      this.currentTest = `Has ${method}() method`;
      
      try {
        this.assert(typeof this.gameInstance[method] === 'function', 
                   `Game instance should have ${method}() method`);
        this.pass();
      } catch (error) {
        this.fail(`Missing ${method}() method: ${error.message}`);
      }
    }
    
    // Проверяем, нет ли прямого наследования от IGame
    this.currentTest = 'Not extending IGame directly';
    try {
      // Импортируем IGame
      const iGamePath = '/Users/PavloAgoshkov_1/Games Framework/framework/api/interfaces/IGame.js';
      import(iGamePath).then(module => {
        const IGame = module.default;
        this.assert(!(this.gameInstance instanceof IGame), 
                 'Game should not directly extend IGame interface');
        this.pass();
      }).catch((error) => {
        // Если не можем загрузить IGame, пропускаем тест
        this.log('Could not load IGame interface, skipping inheritance test', 'warning');
        this.skip();
      });
    } catch (error) {
      // Если что-то пошло не так, пропускаем тест
      this.log(`Error in inheritance test: ${error.message}`, 'warning');
      this.skip();
    }
    
    this.logGroupEnd();
  }
  
  /**
   * Тестирует жизненный цикл игры
   * @private
   */
  async testLifecycle() {
    this.currentTestGroup = 'Lifecycle';
    this.logGroup('Testing lifecycle methods');
    
    // Создаем экземпляр для тестирования
    try {
      this.gameInstance = new this.gameConstructor(this.gameConfig);
    } catch (error) {
      this.log(`Failed to create game instance for lifecycle testing: ${error.message}`, 'error');
      this.logGroupEnd();
      return;
    }
    
    // Тест: initialize()
    this.currentTest = 'initialize() method';
    try {
      // Подготавливаем контейнер для инициализации
      this.gameContainer.innerHTML = '';
      
      // Создаем конфигурацию
      const config = {
        container: this.gameContainer,
        bet: 10,
        riskLevel: 'medium',
        ...this.gameConfig
      };
      
      // Инициализируем игру
      await this.executeWithTimeout(
        () => this.gameInstance.initialize(config),
        'initialize() method timed out'
      );
      
      // Проверяем, добавлен ли canvas или другие элементы в контейнер
      this.assert(this.gameContainer.children.length > 0, 
                 'Game should add elements to container during initialization');
      
      this.pass();
    } catch (error) {
      this.fail(`initialize() method failed: ${error.message}`);
    }
    
    // Тест: start()
    this.currentTest = 'start() method';
    try {
      await this.executeWithTimeout(
        () => this.gameInstance.start(),
        'start() method timed out'
      );
      this.pass();
    } catch (error) {
      this.fail(`start() method failed: ${error.message}`);
    }
    
    // Тест: pause()
    this.currentTest = 'pause() method';
    try {
      this.gameInstance.pause();
      this.pass();
    } catch (error) {
      this.fail(`pause() method failed: ${error.message}`);
    }
    
    // Тест: resume()
    this.currentTest = 'resume() method';
    try {
      this.gameInstance.resume();
      this.pass();
    } catch (error) {
      this.fail(`resume() method failed: ${error.message}`);
    }
    
    // Тест: resize()
    this.currentTest = 'resize() method';
    try {
      this.gameInstance.resize(400, 300);
      this.pass();
    } catch (error) {
      this.fail(`resize() method failed: ${error.message}`);
    }
    
    // Мы тестируем destroy() в конце, когда другие тесты будут завершены
    
    this.logGroupEnd();
  }
  
  /**
   * Тестирует действия в игре
   * @private
   */
  async testActions() {
    this.currentTestGroup = 'Game Actions';
    this.logGroup('Testing game actions');
    
    if (!this.gameInstance) {
      this.log('No game instance available for action testing', 'error');
      this.logGroupEnd();
      return;
    }
    
    // Тест: performAction() с недопустимым типом
    this.currentTest = 'performAction() with invalid type';
    try {
      try {
        await this.executeWithTimeout(
          () => this.gameInstance.performAction({ type: 'invalidActionType' }),
          'performAction() with invalid type timed out'
        );
        this.fail('performAction() should reject invalid action types');
      } catch (error) {
        // Ожидается ошибка, так как тип действия недопустимый
        this.pass();
      }
    } catch (error) {
      this.fail(`performAction() with invalid type test failed: ${error.message}`);
    }
    
    // Тест: calculatePotentialWin()
    this.currentTest = 'calculatePotentialWin() method';
    try {
      const potentialWin = this.gameInstance.calculatePotentialWin(10, 'medium');
      this.assert(typeof potentialWin === 'number' && potentialWin >= 0, 
                 'calculatePotentialWin() should return a non-negative number');
      this.pass();
    } catch (error) {
      this.fail(`calculatePotentialWin() method failed: ${error.message}`);
    }
    
    // Тест: updateSettings()
    this.currentTest = 'updateSettings() method';
    try {
      this.gameInstance.updateSettings({ 
        theme: { backgroundColor: '#000000' },
        bet: 20
      });
      this.pass();
    } catch (error) {
      this.fail(`updateSettings() method failed: ${error.message}`);
    }
    
    // Тест: getInfo()
    this.currentTest = 'getInfo() method';
    try {
      const info = this.gameInstance.getInfo();
      this.assert(typeof info === 'object', 'getInfo() should return an object');
      this.assert(typeof info.id === 'string', 'Game info should have an id');
      this.assert(typeof info.name === 'string', 'Game info should have a name');
      this.assert(typeof info.version === 'string', 'Game info should have a version');
      this.pass();
    } catch (error) {
      this.fail(`getInfo() method failed: ${error.message}`);
    }
    
    // Тест: supportsFeature()
    this.currentTest = 'supportsFeature() method';
    try {
      const result = this.gameInstance.supportsFeature('unknown_feature');
      this.assert(typeof result === 'boolean', 'supportsFeature() should return a boolean');
      this.pass();
    } catch (error) {
      this.fail(`supportsFeature() method failed: ${error.message}`);
    }
    
    this.logGroupEnd();
  }
  
  /**
   * Тестирует систему событий
   * @private
   */
  async testEvents() {
    this.currentTestGroup = 'Events';
    this.logGroup('Testing event system');
    
    if (!this.gameInstance) {
      this.log('No game instance available for event testing', 'error');
      this.logGroupEnd();
      return;
    }
    
    // Тест: getAvailableEvents()
    this.currentTest = 'getAvailableEvents() method';
    try {
      const events = this.gameInstance.getAvailableEvents();
      this.assert(Array.isArray(events), 'getAvailableEvents() should return an array');
      this.assert(events.length > 0, 'Game should support at least one event');
      this.pass();
    } catch (error) {
      this.fail(`getAvailableEvents() method failed: ${error.message}`);
    }
    
    // Очищаем отслеживаемые события
    this.capturedEvents = {};
    
    // Тест: addEventListener() и removeEventListener()
    const testEvent = this.gameInstance.getAvailableEvents()[0];
    if (testEvent) {
      this.currentTest = 'addEventListener() method';
      try {
        const handler = (data) => {
          if (!this.capturedEvents[testEvent]) {
            this.capturedEvents[testEvent] = [];
          }
          this.capturedEvents[testEvent].push(data);
        };
        
        this.gameInstance.addEventListener(testEvent, handler);
        this.pass();
        
        // Сохраняем обработчик для последующего удаления
        this.eventHandlers[testEvent] = handler;
      } catch (error) {
        this.fail(`addEventListener() method failed: ${error.message}`);
      }
      
      this.currentTest = 'removeEventListener() method';
      try {
        const handler = this.eventHandlers[testEvent];
        if (handler) {
          this.gameInstance.removeEventListener(testEvent, handler);
          this.pass();
        } else {
          this.skip('No handler available to test removeEventListener()');
        }
      } catch (error) {
        this.fail(`removeEventListener() method failed: ${error.message}`);
      }
    } else {
      this.log('No events available for testing addEventListener/removeEventListener', 'warning');
      this.skip('No events available for testing');
    }
    
    this.logGroupEnd();
  }
  
  /**
   * Тестирует сохранение и восстановление состояния
   * @private
   */
  async testState() {
    this.currentTestGroup = 'State Management';
    this.logGroup('Testing state management');
    
    if (!this.gameInstance) {
      this.log('No game instance available for state testing', 'error');
      this.logGroupEnd();
      return;
    }
    
    // Тест: getState()
    this.currentTest = 'getState() method';
    try {
      const state = this.gameInstance.getState();
      this.assert(typeof state === 'object', 'getState() should return an object');
      this.state = state; // Сохраняем для теста setState
      this.pass();
    } catch (error) {
      this.fail(`getState() method failed: ${error.message}`);
    }
    
    // Тест: setState()
    this.currentTest = 'setState() method';
    try {
      if (this.state) {
        this.gameInstance.setState(this.state);
        this.pass();
      } else {
        this.skip('No state available to test setState()');
      }
    } catch (error) {
      this.fail(`setState() method failed: ${error.message}`);
    }
    
    this.logGroupEnd();
    
    // Тестируем destroy() в самом конце
    await this.testDestroy();
  }
  
  /**
   * Тестирует метод destroy()
   * @private
   */
  async testDestroy() {
    this.currentTestGroup = 'Destroy';
    this.logGroup('Testing destroy method');
    
    if (!this.gameInstance) {
      this.log('No game instance available for destroy testing', 'error');
      this.logGroupEnd();
      return;
    }
    
    this.currentTest = 'destroy() method';
    try {
      // Запоминаем количество элементов перед уничтожением
      const childrenBefore = this.gameContainer.children.length;
      
      await this.executeWithTimeout(
        () => this.gameInstance.destroy(),
        'destroy() method timed out'
      );
      
      // Проверяем, очищен ли контейнер
      const childrenAfter = this.gameContainer.children.length;
      this.assert(childrenAfter < childrenBefore, 
                 'Game should remove elements from container during destruction');
      
      this.pass();
    } catch (error) {
      this.fail(`destroy() method failed: ${error.message}`);
    }
    
    // Очищаем экземпляр игры
    this.gameInstance = null;
    
    this.logGroupEnd();
  }
  
  // --- Вспомогательные методы ---
  
  /**
   * Выполняет асинхронную операцию с таймаутом
   * @param {Function} operation - Асинхронная операция
   * @param {string} timeoutMessage - Сообщение об ошибке при таймауте
   * @returns {Promise} Результат выполнения операции
   * @private
   */
  executeWithTimeout(operation, timeoutMessage) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), this.options.timeout);
      })
    ]);
  }
  
  /**
   * Проверяет условие и выбрасывает исключение, если оно ложно
   * @param {boolean} condition - Проверяемое условие
   * @param {string} message - Сообщение об ошибке
   * @throws {Error} Если условие ложно
   * @private
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  /**
   * Отмечает текущий тест как пройденный
   * @private
   */
  pass() {
    this.results.totalTests++;
    this.results.passed++;
    this.results.testDetails.push({
      group: this.currentTestGroup,
      name: this.currentTest,
      status: 'pass',
      time: new Date()
    });
    
    this.log(`✅ PASS: ${this.currentTest}`, 'success');
  }
  
  /**
   * Отмечает текущий тест как проваленный
   * @param {string} reason - Причина провала
   * @private
   */
  fail(reason) {
    this.results.totalTests++;
    this.results.failed++;
    this.results.testDetails.push({
      group: this.currentTestGroup,
      name: this.currentTest,
      status: 'fail',
      reason,
      time: new Date()
    });
    
    this.log(`❌ FAIL: ${this.currentTest} - ${reason}`, 'error');
  }
  
  /**
   * Отмечает текущий тест как пропущенный
   * @param {string} reason - Причина пропуска
   * @private
   */
  skip(reason) {
    this.results.totalTests++;
    this.results.skipped++;
    this.results.testDetails.push({
      group: this.currentTestGroup,
      name: this.currentTest,
      status: 'skip',
      reason,
      time: new Date()
    });
    
    this.log(`⏭️ SKIP: ${this.currentTest}${reason ? ' - ' + reason : ''}`, 'warning');
  }
  
  /**
   * Очищает результаты тестирования
   */
  clearResults() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      testDetails: []
    };
    
    this.resultsContainer.innerHTML = '';
    this.gameContainer.innerHTML = '';
  }
  
  /**
   * Экспортирует результаты тестирования в JSON
   */
  exportResults() {
    const gameName = this.gameConstructor ? (this.gameConstructor.name || 'UnknownGame') : 'NoGame';
    const filename = `igame_test_${gameName}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const dataStr = JSON.stringify(this.results, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Выводит сообщение в лог
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип сообщения ('info', 'success', 'warning', 'error')
   * @private
   */
  log(message, type = 'info') {
    // Выводим в консоль, если verbose=true
    if (this.options.verbose) {
      const logMethod = {
        'info': console.log,
        'success': console.log,
        'warning': console.warn,
        'error': console.error
      }[type] || console.log;
      
      logMethod(`[IGameTester] ${message}`);
    }
    
    // Добавляем в UI
    if (this.resultsContainer) {
      const entry = document.createElement('div');
      entry.className = `log-entry log-${type}`;
      
      // Стили для разных типов сообщений
      const colors = {
        'info': '#2196F3',
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#f44336'
      };
      
      entry.style.cssText = `
        padding: 8px 12px;
        margin-bottom: 5px;
        border-left: 4px solid ${colors[type]};
        background-color: ${colors[type] + '10'};
        color: #333;
      `;
      
      entry.textContent = message;
      this.resultsContainer.appendChild(entry);
      this.resultsContainer.scrollTop = this.resultsContainer.scrollHeight;
    }
  }
  
  /**
   * Начинает группу логов
   * @param {string} label - Название группы
   * @private
   */
  logGroup(label) {
    if (this.options.verbose) {
      console.group(`[IGameTester] ${label}`);
    }
    
    // Добавляем в UI
    if (this.resultsContainer) {
      const group = document.createElement('div');
      group.className = 'log-group';
      group.style.cssText = `
        margin-top: 15px;
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 16px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      `;
      group.textContent = label;
      this.resultsContainer.appendChild(group);
    }
  }
  
  /**
   * Завершает группу логов
   * @private
   */
  logGroupEnd() {
    if (this.options.verbose) {
      console.groupEnd();
    }
  }
}

// Экспортируем тестер
window.IGameTester = IGameTester;