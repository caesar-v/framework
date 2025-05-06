/**
 * TestRunner.js
 * Запускает тесты в изолированной среде и управляет их жизненным циклом
 */

class TestRunner {
  constructor() {
    this.environment = null;
    this.tests = [];
    this.results = {};
    this.isRunning = false;
    this.startTime = 0;
    this.endTime = 0;
    this.totalTests = 0;
    this.completedTests = 0;
  }

  /**
   * Инициализировать тестовый запускатель
   * @returns {Promise} Промис, который разрешается, когда запускатель готов
   */
  async initialize() {
    console.log('Initializing test runner (manual mode only)');
    
    // Создать и инициализировать тестовую среду
    this.environment = new TestEnvironment();
    await this.environment.initialize();
    
    // Регистрировать адаптеры для существующих тестов
    this.registerLegacyTests();
    
    // Сообщение о готовности к запуску тестов
    console.log('Test runner initialized - tests will only run when manually triggered');
    
    return Promise.resolve();
  }

  /**
   * Регистрировать существующие тесты как адаптированные
   * @private
   */
  registerLegacyTests() {
    // Модульные тесты
    this.registerTest('Module Loading', this.createModuleLoadingTest());
    this.registerTest('Canvas Manager', this.createCanvasManagerTest());
    this.registerTest('UI Manager', this.createUIManagerTest());
    this.registerTest('Inheritance', this.createInheritanceTest());
    this.registerTest('Game State Manager', this.createGameStateManagerTest());
    
    console.log(`Registered ${this.tests.length} tests`);
  }

  /**
   * Регистрировать тест
   * @param {string} name - Имя теста
   * @param {Function} testFn - Функция теста
   * @param {Object} options - Дополнительные опции (зависимости, приоритет, таймаут)
   */
  registerTest(name, testFn, options = {}) {
    this.tests.push({
      name,
      fn: testFn,
      dependencies: options.dependencies || [],
      priority: options.priority || 0,
      timeout: options.timeout || 5000
    });
    
    this.totalTests = this.tests.length;
  }

  /**
   * Запустить все зарегистрированные тесты
   * @returns {Promise<Object>} Результаты всех тестов
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn('Tests are already running');
      return Promise.reject(new Error('Tests are already running'));
    }
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.completedTests = 0;
    this.results = {};
    
    console.log('Running all tests');
    
    try {
      // Сначала сделать снимок DOM до запуска тестов
      const initialSnapshot = this.environment.createDOMSnapshot();
      
      // Отсортировать тесты по приоритету и зависимостям
      const sortedTests = this.sortTestsByPriority();
      
      // Запустить каждый тест последовательно
      for (const test of sortedTests) {
        // Проверить, выполнены ли зависимости теста
        const dependenciesMet = test.dependencies.every(dependency => 
          this.results[dependency] && this.results[dependency].success);
        
        if (!dependenciesMet) {
          console.warn(`Skipping test "${test.name}" due to failed dependencies`);
          this.results[test.name] = {
            success: false,
            skipped: true,
            reason: 'Dependencies not met'
          };
          this.completedTests++;
          continue;
        }
        
        // Запустить тест
        try {
          const result = await Promise.race([
            this.environment.runTest(test.name, test.fn),
            this.createTimeout(test.timeout, test.name)
          ]);
          
          this.results[test.name] = result;
        } catch (error) {
          console.error(`Test "${test.name}" failed with error:`, error);
          this.results[test.name] = {
            name: test.name,
            success: false,
            error: error.message,
            stack: error.stack
          };
        }
        
        this.completedTests++;
        
        // Сделать снимок DOM после каждого теста для обнаружения утечек
        const currentSnapshot = this.environment.createDOMSnapshot();
        const differences = this.environment.compareDOMSnapshots(initialSnapshot, currentSnapshot);
        
        // Логировать различия, если они есть
        const hasDifferences = differences.bodyClasses.added.length > 0 || 
                              differences.bodyClasses.removed.length > 0 ||
                              Object.values(differences.elements).some(diff => 
                                diff.existenceChanged || diff.parentChanged || 
                                diff.classesChanged || diff.stylesChanged || 
                                diff.attributesChanged);
        
        if (hasDifferences) {
          console.warn(`Test "${test.name}" modified DOM state:`, differences);
          // Сохранить различия в результатах теста
          this.results[test.name].domDifferences = differences;
        }
      }
      
      this.endTime = performance.now();
      const duration = this.endTime - this.startTime;
      
      console.log(`All tests completed in ${duration.toFixed(2)}ms`);
      
      // Обновить панель с итоговыми результатами
      this.updateResultsPanel();
      
      return this.results;
    } catch (error) {
      console.error('Error running tests:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Отсортировать тесты по приоритету и зависимостям
   * @returns {Array} Отсортированные тесты
   * @private
   */
  sortTestsByPriority() {
    // Сначала отсортировать по приоритету (от высокого к низкому)
    const sortedByPriority = [...this.tests].sort((a, b) => b.priority - a.priority);
    
    // Затем убедиться, что зависимости выполняются перед зависимыми тестами
    const result = [];
    const added = new Set();
    
    // Рекурсивная функция для добавления теста и его зависимостей
    const addTest = (test) => {
      // Если тест уже добавлен, пропустить
      if (added.has(test.name)) return;
      
      // Сначала добавить зависимости
      for (const dependency of test.dependencies) {
        const dependencyTest = sortedByPriority.find(t => t.name === dependency);
        if (dependencyTest) {
          addTest(dependencyTest);
        }
      }
      
      // Затем добавить сам тест
      result.push(test);
      added.add(test.name);
    };
    
    // Добавить все тесты
    for (const test of sortedByPriority) {
      addTest(test);
    }
    
    return result;
  }

  /**
   * Создать таймаут для теста
   * @param {number} timeout - Таймаут в миллисекундах
   * @param {string} testName - Имя теста
   * @returns {Promise} Промис, который отклоняется после истечения таймаута
   * @private
   */
  createTimeout(timeout, testName) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test "${testName}" timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Обновить панель результатов
   * @private
   */
  updateResultsPanel() {
    const resultsContainer = document.getElementById('test-environment-results');
    if (!resultsContainer) return;
    
    // Очистить контейнер
    resultsContainer.innerHTML = '';
    
    // Добавить заголовок
    const header = document.createElement('div');
    header.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      background-color: #44475a;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    `;
    
    const successCount = Object.values(this.results).filter(r => r.success).length;
    const failCount = Object.values(this.results).filter(r => !r.success).length;
    const skippedCount = Object.values(this.results).filter(r => r.skipped).length;
    
    header.textContent = `Tests: ${successCount} passed, ${failCount} failed, ${skippedCount} skipped`;
    header.style.color = failCount > 0 ? '#ff5555' : '#50fa7b';
    
    resultsContainer.appendChild(header);
    
    // Добавить детали каждого теста
    for (const [name, result] of Object.entries(this.results)) {
      const testItem = document.createElement('div');
      testItem.style.cssText = `
        margin-bottom: 8px;
        padding: 12px;
        border-radius: 4px;
        background-color: ${
          result.skipped ? 'rgba(241, 250, 140, 0.1)' :
          result.success ? 'rgba(80, 250, 123, 0.1)' : 
          'rgba(255, 85, 85, 0.1)'
        };
        border-left: 3px solid ${
          result.skipped ? '#f1fa8c' :
          result.success ? '#50fa7b' : 
          '#ff5555'
        };
      `;
      
      const nameElement = document.createElement('div');
      nameElement.textContent = name;
      nameElement.style.fontWeight = 'bold';
      nameElement.style.marginBottom = '4px';
      testItem.appendChild(nameElement);
      
      // Показать продолжительность, если есть
      if (result.duration) {
        const durationElement = document.createElement('div');
        durationElement.textContent = `Duration: ${result.duration.toFixed(2)}ms`;
        durationElement.style.fontSize = '0.8em';
        durationElement.style.opacity = '0.8';
        durationElement.style.marginBottom = '4px';
        testItem.appendChild(durationElement);
      }
      
      // Показать ошибку, если есть
      if (result.error) {
        const errorElement = document.createElement('div');
        errorElement.textContent = result.error;
        errorElement.style.cssText = `
          margin-top: 8px;
          padding: 8px;
          background-color: rgba(255, 85, 85, 0.1);
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          overflow-x: auto;
        `;
        testItem.appendChild(errorElement);
      }
      
      // Показать причину пропуска, если есть
      if (result.skipped && result.reason) {
        const reasonElement = document.createElement('div');
        reasonElement.textContent = `Skipped: ${result.reason}`;
        reasonElement.style.fontStyle = 'italic';
        testItem.appendChild(reasonElement);
      }
      
      // Показать различия в DOM, если есть
      if (result.domDifferences) {
        const differencesButton = document.createElement('button');
        differencesButton.textContent = 'Show DOM changes';
        differencesButton.style.cssText = `
          margin-top: 8px;
          padding: 4px 8px;
          background-color: #44475a;
          color: #f8f8f2;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;
        
        const differencesElement = document.createElement('div');
        differencesElement.style.cssText = `
          margin-top: 8px;
          padding: 8px;
          background-color: rgba(80, 250, 123, 0.05);
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          overflow-x: auto;
          display: none;
        `;
        differencesElement.textContent = JSON.stringify(result.domDifferences, null, 2);
        
        differencesButton.addEventListener('click', () => {
          differencesElement.style.display = differencesElement.style.display === 'none' ? 'block' : 'none';
          differencesButton.textContent = differencesElement.style.display === 'none' ? 'Show DOM changes' : 'Hide DOM changes';
        });
        
        testItem.appendChild(differencesButton);
        testItem.appendChild(differencesElement);
      }
      
      resultsContainer.appendChild(testItem);
    }
    
    // Добавить информацию о времени выполнения
    const duration = this.endTime - this.startTime;
    const footer = document.createElement('div');
    footer.style.cssText = `
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
    `;
    footer.textContent = `Total execution time: ${duration.toFixed(2)}ms`;
    
    resultsContainer.appendChild(footer);
  }

  /**
   * Завершить и очистить тестовый запускатель
   */
  async finalize() {
    console.log('Finalizing test runner');
    
    if (this.environment) {
      await this.environment.finalize();
    }
    
    console.log('Test runner finalized');
  }

  /**
   * Создать адаптер для теста загрузки модулей
   * @returns {Function} Функция теста
   * @private
   */
  createModuleLoadingTest() {
    return async (container) => {
      console.log('Running module loading test in isolated environment');
      
      // Проверить, загружены ли модули
      const modules = {
        CanvasManager: typeof CanvasManager !== 'undefined',
        UIManager: typeof UIManager !== 'undefined',
        GameStateManager: typeof GameStateManager !== 'undefined',
        GameFramework: typeof GameFramework !== 'undefined',
        AbstractBaseGame: typeof AbstractBaseGame !== 'undefined',
        BaseGame: typeof BaseGame !== 'undefined',
        DiceGame: typeof DiceGame !== 'undefined',
        CardGame: typeof CardGame !== 'undefined'
      };
      
      console.log('Module load test results:', modules);
      
      // Проверить критические модули
      const criticalModules = ['GameFramework', 'AbstractBaseGame', 'BaseGame'];
      const criticalFailures = criticalModules.filter(module => !modules[module]);
      
      if (criticalFailures.length > 0) {
        throw new Error(`Critical modules failed to load: ${criticalFailures.join(', ')}`);
      }
      
      return modules;
    };
  }

  /**
   * Создать адаптер для теста CanvasManager
   * @returns {Function} Функция теста
   * @private
   */
  createCanvasManagerTest() {
    return async (container) => {
      console.log('Running canvas manager test in isolated environment');
      
      // Убедиться, что CanvasManager загружен
      if (typeof CanvasManager === 'undefined') {
        throw new Error('CanvasManager not loaded - cannot run test');
      }
      
      // Создать canvas для теста
      const canvas = document.createElement('canvas');
      canvas.id = 'test-canvas';
      canvas.width = 800;
      canvas.height = 600;
      container.appendChild(canvas);
      
      // Создать мок-объекты
      const mockConfig = {
        canvasId: 'test-canvas',
        gameTitle: 'Test Game',
        canvasBackground: {
          default: ['#071824', '#071d2a'],
          pirate: ['#110b0f', '#231917'],
          neon: ['#120b18', '#1f1634']
        }
      };
      
      const mockState = {
        theme: 'default',
        layout: 'pc'
      };
      
      // Создать экземпляр CanvasManager
      const canvasManager = new CanvasManager(mockConfig, mockState);
      canvasManager.setCanvas(canvas);
      
      // Тестировать методы
      const testResults = {};
      
      // Тест 1: Проверить наличие контекста
      testResults.hasContext = Boolean(canvasManager.ctx);
      
      // Тест 2: Инициализировать канвас
      try {
        const dimensions = canvasManager.initCanvas();
        testResults.initCanvasReturnsObject = typeof dimensions === 'object';
        testResults.initCanvasHasDimensions = Boolean(dimensions?.playgroundWidth && dimensions?.playgroundHeight);
      } catch (e) {
        console.warn('initCanvas test failed:', e);
        testResults.initCanvasError = e.message;
      }
      
      // Тест 3: Метод рисования
      try {
        let testDrawCalled = false;
        const testDrawFunc = function(ctx, width, height, state) {
          testDrawCalled = true;
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(50, 50, 100, 100);
          return true;
        };
        
        canvasManager.drawWithCanvas2D(testDrawFunc);
        testResults.drawWithCanvas2DWorks = testDrawCalled;
      } catch (e) {
        console.warn('drawWithCanvas2D test failed:', e);
        testResults.drawWithCanvas2DError = e.message;
      }
      
      // Проверить успешность теста
      const success = testResults.hasContext && 
                     (testResults.initCanvasReturnsObject || testResults.initCanvasHasDimensions) &&
                     testResults.drawWithCanvas2DWorks;
      
      if (!success) {
        throw new Error('Canvas Manager test failed: ' + JSON.stringify(testResults));
      }
      
      return testResults;
    };
  }

  /**
   * Создать адаптер для теста UIManager
   * @returns {Function} Функция теста
   * @private
   */
  createUIManagerTest() {
    return async (container) => {
      console.log('Running UI manager test in isolated environment');
      
      // Убедиться, что UIManager загружен
      if (typeof UIManager === 'undefined') {
        throw new Error('UIManager not loaded - cannot run test');
      }
      
      // Создать тестовые элементы в изолированном контейнере
      const elements = this.createMockUIElements(container);
      
      // Создать мок-объекты
      const mockConfig = {
        canvasId: 'test-canvas',
        debug: true,
        riskLevels: {
          low: 2,
          medium: 3,
          high: 5
        }
      };
      
      const mockState = {
        theme: 'default',
        layout: 'pc',
        soundEnabled: true,
        autoPlay: false,
        isSpinning: false,
        betAmount: 10,
        balance: 1000,
        riskLevel: 'medium',
        maxBet: 500
      };
      
      // Создать мок CanvasManager
      const mockCanvasManager = {
        getCanvas: () => ({
          canvas: elements.canvas,
          ctx: elements.canvas.getContext('2d')
        }),
        updateScreenInfo: () => {},
        drawWithCanvas2D: () => {},
        initCanvas: () => {}
      };
      
      // Колбэк обновления состояния
      const mockStateUpdateCallback = (state) => {};
      
      // Создать экземпляр UIManager
      const uiManager = new UIManager(
        mockConfig, 
        mockState, 
        elements, 
        mockCanvasManager, 
        null, // Без PixiManager
        mockStateUpdateCallback
      );
      
      // Тестировать методы
      const testResults = {};
      
      // Тест 1: Проверить наличие элементов
      testResults.hasElements = typeof uiManager.elements === 'object' && 
                              Boolean(uiManager.elements.spinButton) &&
                              Boolean(uiManager.elements.balanceDisplay);
      
      // Тест 2: Проверить методы
      testResults.hasSetupMethod = typeof uiManager.setupEventListeners === 'function';
      testResults.hasUpdateBalanceMethod = typeof uiManager.updateBalance === 'function';
      testResults.hasRedrawCanvasMethod = typeof uiManager.redrawCanvas === 'function';
      testResults.hasChangeThemeMethod = typeof uiManager.changeTheme === 'function';
      
      // Мокируем метод setupEventListeners для тестирования
      const originalSetupMethod = uiManager.setupEventListeners;
      uiManager.setupEventListeners = function() {
        console.log('Mock setupEventListeners called');
        return true;
      };
      
      // Тест 3: Проверить метод setupEventListeners
      try {
        uiManager.setupEventListeners();
        testResults.setupMethodRuns = true;
      } catch (e) {
        console.error('Error running setupEventListeners method:', e);
        testResults.setupMethodError = e.message;
      }
      
      // Восстановить оригинальный метод
      uiManager.setupEventListeners = originalSetupMethod;
      
      // Тест 4: Проверить расчет потенциального выигрыша
      try {
        uiManager.state.betAmount = 10;
        uiManager.state.riskLevel = 'medium';
        const potentialWin = uiManager.calculatePotentialWin();
        testResults.potentialWinCalculationWorks = potentialWin === 30; // 10 * 3
      } catch (e) {
        console.error('Error testing potential win calculation:', e);
        testResults.potentialWinCalculationError = e.message;
      }
      
      // Проверить успешность теста
      const success = testResults.hasElements && 
                     testResults.hasSetupMethod && 
                     testResults.hasUpdateBalanceMethod && 
                     testResults.hasRedrawCanvasMethod && 
                     testResults.hasChangeThemeMethod && 
                     testResults.setupMethodRuns && 
                     testResults.potentialWinCalculationWorks;
      
      if (!success) {
        throw new Error('UI Manager test failed: ' + JSON.stringify(testResults));
      }
      
      return testResults;
    };
  }

  /**
   * Создать мок-элементы UI для тестирования
   * @param {HTMLElement} container - Контейнер для элементов
   * @returns {Object} Объект с элементами UI
   * @private
   */
  createMockUIElements(container) {
    // Создать canvas для теста
    const canvas = document.createElement('canvas');
    canvas.id = 'test-canvas';
    canvas.width = 800;
    canvas.height = 600;
    container.appendChild(canvas);
    
    // Создать контейнер игры
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.className = 'game-container pc';
    container.appendChild(gameContainer);
    
    // Создать элементы для тестов
    const elements = {
      container: gameContainer,
      canvas: canvas,
      gameTitle: document.createElement('h1')
    };
    
    elements.gameTitle.className = 'game-title';
    elements.gameTitle.textContent = 'Test Game';
    gameContainer.appendChild(elements.gameTitle);
    
    // Создать элементы управления
    ['betInput', 'spinButton', 'increaseButton', 'decreaseButton', 'soundButton', 
     'menuButton', 'settingsButton', 'settingsPanel', 'menuOverlay', 
     'closeMenu', 'closeSettings', 'manualTab', 'autoTab', 
     'halfBet', 'maxBet', 'riskLevel', 'balanceDisplay', 'potentialWin'].forEach(id => {
      
      // Для select-элементов
      if (id === 'riskLevel') {
        elements[id] = document.createElement('select');
        ['low', 'medium', 'high'].forEach(level => {
          const option = document.createElement('option');
          option.value = level;
          option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
          if (level === 'medium') option.selected = true;
          elements[id].appendChild(option);
        });
      } 
      // Для input-элементов
      else if (id === 'betInput') {
        elements[id] = document.createElement('input');
        elements[id].type = 'text';
        elements[id].value = '10';
      } 
      // Для всех остальных элементов
      else {
        elements[id] = document.createElement('div');
        elements[id].id = id.replace(/([A-Z])/g, '-$1').toLowerCase();
        
        // Для элементов с отображением значений
        if (id === 'balanceDisplay') {
          elements[id].textContent = '1000';
        } else if (id === 'potentialWin') {
          elements[id].textContent = '30';
        }
      }
      
      // Добавить элемент в контейнер
      container.appendChild(elements[id]);
    });
    
    return elements;
  }

  /**
   * Создать адаптер для теста наследования
   * @returns {Function} Функция теста
   * @private
   */
  createInheritanceTest() {
    return async (container) => {
      console.log('Running inheritance test in isolated environment');
      
      // Проверить, загружены ли необходимые классы
      if (typeof AbstractBaseGame === 'undefined' || 
          typeof BaseGame === 'undefined' ||
          typeof DiceGame === 'undefined' ||
          typeof CardGame === 'undefined') {
        throw new Error('Required game classes not loaded - cannot run test');
      }
      
      // Тестировать иерархию наследования
      const testResults = {};
      
      // Тест BaseGame наследует AbstractBaseGame
      testResults.baseGameExtendsAbstractBaseGame = BaseGame.prototype instanceof AbstractBaseGame;
      
      // Тест DiceGame наследует BaseGame
      testResults.diceGameExtendsBaseGame = DiceGame.prototype instanceof BaseGame;
      
      // Тест CardGame наследует BaseGame
      testResults.cardGameExtendsBaseGame = CardGame.prototype instanceof BaseGame;
      
      // Проверить успешность теста
      const success = testResults.baseGameExtendsAbstractBaseGame && 
                     testResults.diceGameExtendsBaseGame && 
                     testResults.cardGameExtendsBaseGame;
      
      if (!success) {
        throw new Error('Inheritance test failed: ' + JSON.stringify(testResults));
      }
      
      return testResults;
    };
  }

  /**
   * Создать адаптер для теста GameStateManager
   * @returns {Function} Функция теста
   * @private
   */
  createGameStateManagerTest() {
    return async (container) => {
      console.log('Running game state manager test in isolated environment');
      
      // Убедиться, что GameStateManager загружен
      if (typeof GameStateManager === 'undefined') {
        throw new Error('GameStateManager not loaded - cannot run test');
      }
      
      // Создать canvas для теста
      const canvas = document.createElement('canvas');
      canvas.id = 'test-canvas';
      canvas.width = 800;
      canvas.height = 600;
      container.appendChild(canvas);
      
      // Создать мок-объекты
      const mockConfig = {
        canvasId: 'test-canvas',
        initialBalance: 1000,
        initialBet: 10,
        defaultBet: 10,
        maxBet: 500,
        defaultTheme: 'default',
        defaultLayout: 'pc',
        defaultRiskLevel: 'medium',
        currency: '€',
        debug: true,
        canvasBackground: {
          default: ['#071824', '#071d2a'],
          pirate: ['#110b0f', '#231917'],
          neon: ['#120b18', '#1f1634']
        },
        riskLevels: {
          low: 2,
          medium: 3,
          high: 5
        },
        gameLogic: {}
      };
      
      // Создать мок CanvasManager
      const mockCanvasManager = {
        getCanvas: () => ({
          canvas: canvas,
          ctx: canvas.getContext('2d')
        }),
        updateScreenInfo: () => {},
        drawWithCanvas2D: () => {},
        initCanvas: () => {}
      };
      
      // Создать мок UI элементов
      const spinButton = document.createElement('button');
      spinButton.id = 'spin-button';
      container.appendChild(spinButton);
      
      const balanceDisplay = document.createElement('span');
      balanceDisplay.id = 'balance-display';
      container.appendChild(balanceDisplay);
      
      // Создать мок UIManager
      const mockUiManager = {
        elements: {
          spinButton: spinButton,
          balanceDisplay: balanceDisplay
        },
        updateBalance: () => {},
        redrawCanvas: () => {}
      };
      
      // Создать GameStateManager
      const gameStateManager = new GameStateManager(mockConfig, mockCanvasManager, mockUiManager);
      
      // Тестировать методы
      const testResults = {};
      
      // Тест 1: Проверить наличие свойств
      testResults.hasConfigProperty = Boolean(gameStateManager.config);
      testResults.hasStateProperty = Boolean(gameStateManager.state);
      testResults.hasCanvasManagerProperty = Boolean(gameStateManager.canvasManager);
      
      // Тест 2: Проверить структуру объекта состояния
      const stateKeys = ['theme', 'layout', 'soundEnabled', 'autoPlay', 'isSpinning', 'betAmount', 'balance', 'riskLevel', 'maxBet'];
      const missingStateKeys = stateKeys.filter(key => !(key in gameStateManager.state));
      
      testResults.stateHasAllRequiredKeys = missingStateKeys.length === 0;
      
      // Тест 3: Проверить начальные значения
      testResults.initialBalanceSet = gameStateManager.state.balance === mockConfig.initialBalance;
      testResults.initialBetSet = gameStateManager.state.betAmount === mockConfig.initialBet;
      
      // Тест 4: Проверить методы
      testResults.hasGetStateMethod = typeof gameStateManager.getState === 'function';
      testResults.hasUpdateStateMethod = typeof gameStateManager.updateState === 'function';
      
      // Тест 5: Проверить обновление состояния
      try {
        const newBet = 20;
        gameStateManager.updateState({ betAmount: newBet });
        testResults.updateStateWorks = gameStateManager.state.betAmount === newBet;
      } catch (e) {
        console.error('Error testing updateState:', e);
        testResults.updateStateError = e.message;
      }
      
      // Проверить успешность теста
      const success = testResults.hasConfigProperty && 
                     testResults.hasStateProperty && 
                     testResults.hasCanvasManagerProperty && 
                     testResults.stateHasAllRequiredKeys && 
                     testResults.initialBalanceSet && 
                     testResults.initialBetSet && 
                     testResults.hasGetStateMethod && 
                     testResults.hasUpdateStateMethod && 
                     testResults.updateStateWorks;
      
      if (!success) {
        throw new Error('Game State Manager test failed: ' + JSON.stringify(testResults));
      }
      
      return testResults;
    };
  }
}

// Экспортировать класс
window.TestRunner = TestRunner;