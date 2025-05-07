/**
 * IGameTestRunner - Утилита для автоматического запуска тестов совместимости игр с интерфейсом IGame
 * 
 * Загружает игры и запускает тесты совместимости с IGame интерфейсом автоматически.
 * Предоставляет подробный отчет о соответствии игр требованиям интерфейса.
 */

class IGameTestRunner {
  /**
   * Создает новый экземпляр запускателя тестов IGame
   * @param {Object} options - Настройки запускателя тестов
   * @param {HTMLElement} options.container - Контейнер для отображения результатов тестов
   * @param {boolean} options.autoRun - Автоматически запускать тесты при инициализации
   * @param {Function} options.onComplete - Колбэк, вызываемый после завершения всех тестов
   * @param {boolean} options.verbose - Выводить подробные сообщения в консоль
   */
  constructor(options = {}) {
    // Настройки по умолчанию
    this.options = {
      container: document.body,
      autoRun: false,
      onComplete: null,
      verbose: true,
      ...options
    };
    
    // Состояние тестов
    this.results = {
      games: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      timestamp: null
    };
    
    // Список игр для тестирования
    this.games = [];
    
    // Тестер для проверки IGame
    this.tester = null;
    
    // Контейнер для отображения результатов
    this.resultsContainer = null;
    
    // Статус запускателя
    this.isRunning = false;
    
    // Инициализация
    this.initUI();
    
    // Автоматический запуск, если включен
    if (this.options.autoRun) {
      this.discoverAndTest();
    }
  }
  
  /**
   * Инициализирует пользовательский интерфейс
   * @private
   */
  initUI() {
    // Очищаем контейнер
    this.options.container.innerHTML = '';
    
    // Создаем оболочку
    const wrapper = document.createElement('div');
    wrapper.className = 'igame-test-runner-wrapper';
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 20px; padding: 20px; font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto;';
    
    // Заголовок
    const header = document.createElement('h1');
    header.textContent = 'IGame Compatibility Test Runner';
    header.style.cssText = 'margin: 0; color: #333; text-align: center;';
    wrapper.appendChild(header);
    
    // Описание
    const description = document.createElement('p');
    description.textContent = 'Automatically tests games for compatibility with the IGame interface.';
    description.style.cssText = 'margin: 0; color: #666; text-align: center;';
    wrapper.appendChild(description);
    
    // Контейнер для выбора игр
    const gamesSelection = document.createElement('div');
    gamesSelection.className = 'games-selection';
    gamesSelection.style.cssText = 'display: flex; flex-direction: column; gap: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;';
    
    // Заголовок раздела выбора игр
    const gamesHeader = document.createElement('h2');
    gamesHeader.textContent = 'Select Games to Test';
    gamesHeader.style.cssText = 'margin: 0; font-size: 1.2em; color: #444;';
    gamesSelection.appendChild(gamesHeader);
    
    // Чекбокс "Выбрать все"
    const selectAllContainer = document.createElement('div');
    selectAllContainer.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px;';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-games';
    selectAllCheckbox.checked = true;
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all-games';
    selectAllLabel.textContent = 'Select All Games';
    selectAllLabel.style.cssText = 'margin-left: 8px; font-weight: bold;';
    
    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    gamesSelection.appendChild(selectAllContainer);
    
    // Контейнер списка игр
    this.gamesListContainer = document.createElement('div');
    this.gamesListContainer.className = 'games-list';
    this.gamesListContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid #eee; border-radius: 4px;';
    gamesSelection.appendChild(this.gamesListContainer);
    
    // Добавляем в основной контейнер
    wrapper.appendChild(gamesSelection);
    
    // Контейнер с кнопками
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
    
    // Кнопка запуска тестов
    const runButton = document.createElement('button');
    runButton.id = 'run-igame-tests';
    runButton.textContent = 'Run Tests';
    runButton.style.cssText = 'padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
    runButton.onclick = () => this.runSelectedTests();
    
    // Кнопка сброса
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-igame-tests';
    resetButton.textContent = 'Reset';
    resetButton.style.cssText = 'padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
    resetButton.onclick = () => this.reset();
    
    // Добавляем кнопки
    buttonsContainer.appendChild(runButton);
    buttonsContainer.appendChild(resetButton);
    wrapper.appendChild(buttonsContainer);
    
    // Контейнер для результатов
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'test-results-container';
    this.resultsContainer.style.cssText = 'flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 15px;';
    
    // Начальное сообщение
    const initialMessage = document.createElement('div');
    initialMessage.className = 'initial-message';
    initialMessage.style.cssText = 'text-align: center; color: #666; padding: 20px;';
    initialMessage.textContent = 'Select games and click "Run Tests" to start testing.';
    this.resultsContainer.appendChild(initialMessage);
    
    wrapper.appendChild(this.resultsContainer);
    
    // Добавляем всё в основной контейнер
    this.options.container.appendChild(wrapper);
    
    // Настраиваем обработчики событий
    this.setupEventHandlers();
  }
  
  /**
   * Настраивает обработчики событий
   * @private
   */
  setupEventHandlers() {
    // Обработчик для чекбокса "Выбрать все"
    const selectAllCheckbox = document.getElementById('select-all-games');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = this.gamesListContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }
  }
  
  /**
   * Обнаруживает доступные игры и запускает тесты
   * @returns {Promise<Object>} Результаты тестирования
   */
  async discoverAndTest() {
    if (this.isRunning) {
      console.warn('Test runner is already running');
      return;
    }
    
    this.isRunning = true;
    this.log('Starting game discovery and testing...');
    
    try {
      // Загружаем игры
      await this.discoverGames();
      
      // Обновляем список игр в UI
      this.updateGamesList();
      
      // Если включено автозапуск, запускаем тесты
      if (this.options.autoRun) {
        await this.runAllTests();
      }
      
      this.isRunning = false;
      return this.results;
    } catch (error) {
      this.log(`Error during game discovery: ${error.message}`, 'error');
      this.isRunning = false;
      throw error;
    }
  }
  
  /**
   * Обнаруживает доступные игры
   * @returns {Promise<Array>} Список обнаруженных игр
   * @private
   */
  async discoverGames() {
    this.log('Discovering available games...');
    
    // Очищаем предыдущий список
    this.games = [];
    
    try {
      // Загружаем классы игр из глобального контекста
      const gameClasses = [];
      
      // Проверяем наличие DiceGame
      if (typeof DiceGame !== 'undefined') {
        gameClasses.push({
          name: 'Dice Game',
          constructor: DiceGame,
          id: 'dice-game'
        });
      }
      
      // Проверяем наличие CardGame
      if (typeof CardGame !== 'undefined') {
        gameClasses.push({
          name: 'Card Game',
          constructor: CardGame,
          id: 'card-game'
        });
      }
      
      // Проверяем наличие других игр
      // ... добавить проверки для других игр при необходимости ...
      
      // Загружаем игры из манифестов
      try {
        const gameRegistry = window.GameRegistry || {};
        if (gameRegistry.getRegisteredGames && typeof gameRegistry.getRegisteredGames === 'function') {
          const registeredGames = gameRegistry.getRegisteredGames();
          
          for (const gameId of Object.keys(registeredGames)) {
            const game = registeredGames[gameId];
            if (game && game.constructor) {
              gameClasses.push({
                name: game.name || gameId,
                constructor: game.constructor,
                id: gameId
              });
            }
          }
        }
      } catch (registryError) {
        console.warn('Could not load games from registry:', registryError);
      }
      
      // Добавляем обнаруженные классы игр
      this.games = gameClasses;
      
      this.log(`Discovered ${this.games.length} games: ${this.games.map(g => g.name).join(', ')}`);
      return this.games;
    } catch (error) {
      this.log(`Error discovering games: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Обновляет список игр в UI
   * @private
   */
  updateGamesList() {
    // Очищаем контейнер
    this.gamesListContainer.innerHTML = '';
    
    if (this.games.length === 0) {
      const noGamesMessage = document.createElement('div');
      noGamesMessage.textContent = 'No games discovered. Make sure games are loaded properly.';
      noGamesMessage.style.cssText = 'width: 100%; text-align: center; color: #666; padding: 20px;';
      this.gamesListContainer.appendChild(noGamesMessage);
      return;
    }
    
    // Добавляем чекбоксы для каждой игры
    for (const game of this.games) {
      const gameItem = document.createElement('div');
      gameItem.className = 'game-item';
      gameItem.style.cssText = 'display: flex; align-items: center; background-color: #f9f9f9; padding: 8px 12px; border-radius: 4px; min-width: 200px;';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `game-${game.id}`;
      checkbox.value = game.id;
      checkbox.checked = true;
      checkbox.dataset.gameIndex = this.games.indexOf(game);
      
      const label = document.createElement('label');
      label.htmlFor = `game-${game.id}`;
      label.textContent = game.name;
      label.style.cssText = 'margin-left: 8px; cursor: pointer;';
      
      gameItem.appendChild(checkbox);
      gameItem.appendChild(label);
      this.gamesListContainer.appendChild(gameItem);
    }
  }
  
  /**
   * Запускает тесты для выбранных игр
   * @returns {Promise<Object>} Результаты тестирования
   */
  async runSelectedTests() {
    if (this.isRunning) {
      console.warn('Test runner is already running');
      return;
    }
    
    // Получаем выбранные игры
    const selectedGames = [];
    const checkboxes = this.gamesListContainer.querySelectorAll('input[type="checkbox"]:checked');
    
    for (const checkbox of checkboxes) {
      const gameIndex = parseInt(checkbox.dataset.gameIndex, 10);
      if (!isNaN(gameIndex) && this.games[gameIndex]) {
        selectedGames.push(this.games[gameIndex]);
      }
    }
    
    if (selectedGames.length === 0) {
      this.log('No games selected for testing', 'warning');
      return;
    }
    
    // Запускаем тесты для выбранных игр
    return this.runTests(selectedGames);
  }
  
  /**
   * Запускает тесты для всех игр
   * @returns {Promise<Object>} Результаты тестирования
   */
  async runAllTests() {
    return this.runTests(this.games);
  }
  
  /**
   * Запускает тесты для указанных игр
   * @param {Array} games - Список игр для тестирования
   * @returns {Promise<Object>} Результаты тестирования
   * @private
   */
  async runTests(games) {
    if (this.isRunning) {
      console.warn('Test runner is already running');
      return;
    }
    
    this.isRunning = true;
    this.log(`Starting tests for ${games.length} game(s)...`);
    
    // Сбрасываем результаты
    this.results = {
      games: {},
      summary: {
        total: games.length,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      timestamp: new Date().toISOString()
    };
    
    // Очищаем контейнер результатов
    this.resultsContainer.innerHTML = '';
    
    // Создаем элемент для прогресса
    const progressContainer = document.createElement('div');
    progressContainer.className = 'test-progress';
    progressContainer.style.cssText = 'margin-bottom: 20px; text-align: center;';
    
    const progressText = document.createElement('div');
    progressText.textContent = 'Testing games...';
    progressText.style.cssText = 'margin-bottom: 10px; font-weight: bold;';
    progressContainer.appendChild(progressText);
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: 20px;
      background-color: #f1f1f1;
      border-radius: 10px;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: #4CAF50;
      transition: width 0.3s ease;
    `;
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    this.resultsContainer.appendChild(progressContainer);
    
    // Создаем контейнер для результатов игр
    const gamesResultsContainer = document.createElement('div');
    gamesResultsContainer.className = 'games-results';
    this.resultsContainer.appendChild(gamesResultsContainer);
    
    try {
      // Инициализируем IGameTester если не инициализирован
      if (!this.tester) {
        this.tester = new IGameTester({
          container: document.createElement('div'), // Временный контейнер
          verbose: this.options.verbose
        });
      }
      
      // Тестируем каждую игру
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        progressText.textContent = `Testing ${game.name} (${i + 1}/${games.length})...`;
        progressFill.style.width = `${((i + 1) / games.length) * 100}%`;
        
        // Создаем отдельный контейнер для результатов игры
        const gameResultContainer = document.createElement('div');
        gameResultContainer.className = 'game-result';
        gameResultContainer.style.cssText = `
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #ddd;
        `;
        
        const gameHeader = document.createElement('h3');
        gameHeader.textContent = game.name;
        gameHeader.style.cssText = 'margin-top: 0; margin-bottom: 10px; color: #333;';
        gameResultContainer.appendChild(gameHeader);
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.textContent = 'Testing...';
        statusIndicator.style.cssText = `
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          background-color: #f1f1f1;
        `;
        gameResultContainer.appendChild(statusIndicator);
        
        // Добавляем контейнер до выполнения теста
        gamesResultsContainer.appendChild(gameResultContainer);
        
        // Запускаем тест
        try {
          this.log(`Testing ${game.name}...`);
          
          // Конфигурация по умолчанию для игры
          const gameConfig = {
            container: document.createElement('div')
          };
          
          // Настройка тестера
          this.tester.setGame(game.constructor, gameConfig);
          
          // Запуск всех тестов для игры
          const result = await this.tester.runAllTests();
          
          // Сохраняем результат
          this.results.games[game.id] = {
            name: game.name,
            result: result,
            success: result.failed === 0,
            timestamp: new Date().toISOString()
          };
          
          // Обновляем счетчики
          if (result.failed === 0) {
            this.results.summary.passed++;
            statusIndicator.textContent = 'PASSED';
            statusIndicator.style.backgroundColor = '#e6ffec';
            statusIndicator.style.color = '#2da44e';
            gameResultContainer.style.borderColor = '#a3cfbb';
          } else {
            this.results.summary.failed++;
            statusIndicator.textContent = 'FAILED';
            statusIndicator.style.backgroundColor = '#ffebe9';
            statusIndicator.style.color = '#cf222e';
            gameResultContainer.style.borderColor = '#ffc8c8';
          }
          
          // Добавляем детали тестов
          const detailsContainer = document.createElement('div');
          detailsContainer.className = 'test-details';
          detailsContainer.style.cssText = 'margin-top: 10px;';
          
          const testSummary = document.createElement('div');
          testSummary.className = 'test-summary';
          testSummary.style.cssText = 'display: flex; gap: 15px; margin-bottom: 10px;';
          
          const createSummaryItem = (label, value, color) => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
            
            const valueEl = document.createElement('div');
            valueEl.textContent = value;
            valueEl.style.cssText = `font-size: 24px; font-weight: bold; color: ${color};`;
            
            const labelEl = document.createElement('div');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size: 12px; color: #666;';
            
            item.appendChild(valueEl);
            item.appendChild(labelEl);
            
            return item;
          };
          
          testSummary.appendChild(createSummaryItem('Total', result.totalTests, '#333'));
          testSummary.appendChild(createSummaryItem('Passed', result.passed, '#2da44e'));
          testSummary.appendChild(createSummaryItem('Failed', result.failed, '#cf222e'));
          testSummary.appendChild(createSummaryItem('Skipped', result.skipped, '#bf8700'));
          
          detailsContainer.appendChild(testSummary);
          
          // Кнопка "Показать детали"
          const detailsButton = document.createElement('button');
          detailsButton.className = 'details-button';
          detailsButton.textContent = 'Show Details';
          detailsButton.style.cssText = `
            background: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
            margin-right: 10px;
          `;
          
          // Кнопка "Перезапустить тест"
          const retestButton = document.createElement('button');
          retestButton.className = 'retest-button';
          retestButton.textContent = 'Retest';
          retestButton.style.cssText = `
            background: #ddf4ff;
            border: 1px solid #54aeff;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
          `;
          
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
          buttonContainer.appendChild(detailsButton);
          buttonContainer.appendChild(retestButton);
          
          detailsContainer.appendChild(buttonContainer);
          
          // Контейнер для деталей тестов (скрыт по умолчанию)
          const testDetails = document.createElement('div');
          testDetails.className = 'test-details-content';
          testDetails.style.cssText = `
            margin-top: 15px;
            padding: 15px;
            border: 1px solid #eaecef;
            border-radius: 4px;
            background: #f6f8fa;
            display: none;
          `;
          
          // Заполняем детали тестов
          for (const detail of result.testDetails) {
            const detailItem = document.createElement('div');
            detailItem.className = `test-detail ${detail.status}`;
            detailItem.style.cssText = `
              margin-bottom: 8px;
              padding: 8px;
              border-radius: 4px;
              background-color: ${
                detail.status === 'pass' ? '#e6ffec' :
                detail.status === 'fail' ? '#ffebe9' : '#fffbdd'
              };
            `;
            
            const detailHeader = document.createElement('div');
            detailHeader.style.cssText = 'font-weight: bold; margin-bottom: 3px;';
            
            const statusIcon = document.createElement('span');
            statusIcon.textContent = detail.status === 'pass' ? '✓' : 
                                     detail.status === 'fail' ? '✗' : '⚠';
            statusIcon.style.cssText = `
              margin-right: 5px;
              color: ${
                detail.status === 'pass' ? '#2da44e' :
                detail.status === 'fail' ? '#cf222e' : '#bf8700'
              };
            `;
            
            detailHeader.appendChild(statusIcon);
            detailHeader.appendChild(document.createTextNode(`${detail.group}: ${detail.name}`));
            detailItem.appendChild(detailHeader);
            
            if (detail.reason) {
              const reasonText = document.createElement('div');
              reasonText.textContent = detail.reason;
              reasonText.style.cssText = 'margin-top: 3px; font-size: 12px; color: #555;';
              detailItem.appendChild(reasonText);
            }
            
            testDetails.appendChild(detailItem);
          }
          
          detailsContainer.appendChild(testDetails);
          
          // Настраиваем обработчик для кнопки деталей
          detailsButton.addEventListener('click', () => {
            if (testDetails.style.display === 'none') {
              testDetails.style.display = 'block';
              detailsButton.textContent = 'Hide Details';
            } else {
              testDetails.style.display = 'none';
              detailsButton.textContent = 'Show Details';
            }
          });
          
          // Настраиваем обработчик для кнопки перетеста
          retestButton.addEventListener('click', async () => {
            // Сбрасываем статус
            statusIndicator.textContent = 'Testing...';
            statusIndicator.style.backgroundColor = '#f1f1f1';
            statusIndicator.style.color = '#333';
            gameResultContainer.style.borderColor = '#ddd';
            
            // Запускаем тест заново
            try {
              this.tester.setGame(game.constructor, gameConfig);
              const retestResult = await this.tester.runAllTests();
              
              // Обновляем результат
              this.results.games[game.id] = {
                name: game.name,
                result: retestResult,
                success: retestResult.failed === 0,
                timestamp: new Date().toISOString()
              };
              
              // Обновляем счетчики
              if (retestResult.failed === 0) {
                statusIndicator.textContent = 'PASSED';
                statusIndicator.style.backgroundColor = '#e6ffec';
                statusIndicator.style.color = '#2da44e';
                gameResultContainer.style.borderColor = '#a3cfbb';
              } else {
                statusIndicator.textContent = 'FAILED';
                statusIndicator.style.backgroundColor = '#ffebe9';
                statusIndicator.style.color = '#cf222e';
                gameResultContainer.style.borderColor = '#ffc8c8';
              }
              
              // Обновляем детали
              testSummary.innerHTML = '';
              testSummary.appendChild(createSummaryItem('Total', retestResult.totalTests, '#333'));
              testSummary.appendChild(createSummaryItem('Passed', retestResult.passed, '#2da44e'));
              testSummary.appendChild(createSummaryItem('Failed', retestResult.failed, '#cf222e'));
              testSummary.appendChild(createSummaryItem('Skipped', retestResult.skipped, '#bf8700'));
              
              // Обновляем детали тестов
              testDetails.innerHTML = '';
              for (const detail of retestResult.testDetails) {
                const detailItem = document.createElement('div');
                detailItem.className = `test-detail ${detail.status}`;
                detailItem.style.cssText = `
                  margin-bottom: 8px;
                  padding: 8px;
                  border-radius: 4px;
                  background-color: ${
                    detail.status === 'pass' ? '#e6ffec' :
                    detail.status === 'fail' ? '#ffebe9' : '#fffbdd'
                  };
                `;
                
                const detailHeader = document.createElement('div');
                detailHeader.style.cssText = 'font-weight: bold; margin-bottom: 3px;';
                
                const statusIcon = document.createElement('span');
                statusIcon.textContent = detail.status === 'pass' ? '✓' : 
                                         detail.status === 'fail' ? '✗' : '⚠';
                statusIcon.style.cssText = `
                  margin-right: 5px;
                  color: ${
                    detail.status === 'pass' ? '#2da44e' :
                    detail.status === 'fail' ? '#cf222e' : '#bf8700'
                  };
                `;
                
                detailHeader.appendChild(statusIcon);
                detailHeader.appendChild(document.createTextNode(`${detail.group}: ${detail.name}`));
                detailItem.appendChild(detailHeader);
                
                if (detail.reason) {
                  const reasonText = document.createElement('div');
                  reasonText.textContent = detail.reason;
                  reasonText.style.cssText = 'margin-top: 3px; font-size: 12px; color: #555;';
                  detailItem.appendChild(reasonText);
                }
                
                testDetails.appendChild(detailItem);
              }
              
              // Пересчитываем общие результаты
              this.updateSummary();
            } catch (error) {
              statusIndicator.textContent = 'ERROR';
              statusIndicator.style.backgroundColor = '#ffebe9';
              statusIndicator.style.color = '#cf222e';
              gameResultContainer.style.borderColor = '#ffc8c8';
              
              this.log(`Error retesting ${game.name}: ${error.message}`, 'error');
            }
          });
          
          gameResultContainer.appendChild(detailsContainer);
        } catch (error) {
          // Обработка ошибки тестирования
          this.log(`Error testing ${game.name}: ${error.message}`, 'error');
          
          statusIndicator.textContent = 'ERROR';
          statusIndicator.style.backgroundColor = '#ffebe9';
          statusIndicator.style.color = '#cf222e';
          gameResultContainer.style.borderColor = '#ffc8c8';
          
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-message';
          errorMessage.textContent = `Error: ${error.message}`;
          errorMessage.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background-color: #ffebe9;
            border-radius: 4px;
            color: #cf222e;
          `;
          gameResultContainer.appendChild(errorMessage);
          
          // Сохраняем информацию об ошибке
          this.results.games[game.id] = {
            name: game.name,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          };
          
          this.results.summary.failed++;
        }
      }
      
      // Обновляем сводку
      progressContainer.innerHTML = '';
      this.updateSummary();
      
      this.isRunning = false;
      this.log('All tests completed');
      
      // Вызываем колбэк завершения, если он задан
      if (typeof this.options.onComplete === 'function') {
        this.options.onComplete(this.results);
      }
      
      return this.results;
    } catch (error) {
      this.log(`Error running tests: ${error.message}`, 'error');
      this.isRunning = false;
      throw error;
    }
  }
  
  /**
   * Обновляет сводку по результатам тестирования
   * @private
   */
  updateSummary() {
    // Убираем прогресс-бар
    const progressContainer = this.resultsContainer.querySelector('.test-progress');
    if (progressContainer) {
      progressContainer.remove();
    }
    
    // Проверяем, есть ли уже сводка
    let summaryContainer = this.resultsContainer.querySelector('.test-summary-container');
    if (summaryContainer) {
      summaryContainer.remove();
    }
    
    // Создаем сводку
    summaryContainer = document.createElement('div');
    summaryContainer.className = 'test-summary-container';
    summaryContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 4px;
      background-color: ${this.results.summary.failed > 0 ? '#ffebe9' : '#e6ffec'};
      border: 1px solid ${this.results.summary.failed > 0 ? '#ffc8c8' : '#a3cfbb'};
      text-align: center;
    `;
    
    const summaryTitle = document.createElement('h2');
    summaryTitle.textContent = 'Test Summary';
    summaryTitle.style.cssText = 'margin-top: 0; margin-bottom: 15px; color: #333;';
    summaryContainer.appendChild(summaryTitle);
    
    const resultsContainer = document.createElement('div');
    resultsContainer.style.cssText = 'display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;';
    
    const createSummaryItem = (label, value, color) => {
      const item = document.createElement('div');
      item.className = 'summary-item';
      item.style.cssText = 'display: flex; flex-direction: column; align-items: center;';
      
      const valueEl = document.createElement('div');
      valueEl.textContent = value;
      valueEl.style.cssText = `font-size: 32px; font-weight: bold; color: ${color};`;
      
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = 'font-size: 14px; color: #666;';
      
      item.appendChild(valueEl);
      item.appendChild(labelEl);
      
      return item;
    };
    
    resultsContainer.appendChild(createSummaryItem('Total', this.results.summary.total, '#333'));
    resultsContainer.appendChild(createSummaryItem('Passed', this.results.summary.passed, '#2da44e'));
    resultsContainer.appendChild(createSummaryItem('Failed', this.results.summary.failed, '#cf222e'));
    
    summaryContainer.appendChild(resultsContainer);
    
    // Добавляем кнопки экспорта
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 10px;';
    
    const exportJSONButton = document.createElement('button');
    exportJSONButton.textContent = 'Export Results (JSON)';
    exportJSONButton.style.cssText = `
      padding: 8px 16px;
      background-color: #0969da;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    exportJSONButton.onclick = () => this.exportResults('json');
    
    const exportHTMLButton = document.createElement('button');
    exportHTMLButton.textContent = 'Export Report (HTML)';
    exportHTMLButton.style.cssText = `
      padding: 8px 16px;
      background-color: #2da44e;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    exportHTMLButton.onclick = () => this.exportResults('html');
    
    buttonsContainer.appendChild(exportJSONButton);
    buttonsContainer.appendChild(exportHTMLButton);
    
    summaryContainer.appendChild(buttonsContainer);
    
    // Добавляем в начало контейнера результатов
    this.resultsContainer.insertBefore(summaryContainer, this.resultsContainer.firstChild);
  }
  
  /**
   * Экспортирует результаты в выбранный формат
   * @param {string} format - Формат экспорта ('json' или 'html')
   */
  exportResults(format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `igame-tests-${timestamp}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(this.results, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'html') {
      // Создаем HTML отчет
      const html = this.generateHTMLReport();
      
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `${filename}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  /**
   * Генерирует HTML отчет о результатах тестирования
   * @returns {string} HTML отчет
   * @private
   */
  generateHTMLReport() {
    const timestamp = new Date().toLocaleString();
    
    // Базовый шаблон HTML страницы
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IGame Compatibility Test Report - ${timestamp}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #24292e;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          h1, h2, h3 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
          }
          
          h1 {
            padding-bottom: 0.3em;
            font-size: 2em;
            border-bottom: 1px solid #eaecef;
          }
          
          h2 {
            padding-bottom: 0.3em;
            font-size: 1.5em;
            border-bottom: 1px solid #eaecef;
          }
          
          .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            border-radius: 6px;
            background-color: #f6f8fa;
          }
          
          .summary-item {
            flex: 1;
            min-width: 150px;
            text-align: center;
            padding: 15px;
            border-radius: 6px;
          }
          
          .summary-value {
            font-size: 36px;
            font-weight: bold;
          }
          
          .summary-label {
            font-size: 14px;
            color: #586069;
          }
          
          .summary-total {
            background-color: #f6f8fa;
          }
          
          .summary-passed {
            background-color: #e6ffec;
          }
          
          .summary-failed {
            background-color: #ffebe9;
          }
          
          .game-result {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #eaecef;
          }
          
          .game-result h3 {
            margin-top: 0;
          }
          
          .passed {
            border-color: #a3cfbb;
          }
          
          .failed {
            border-color: #ffc8c8;
          }
          
          .status-indicator {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          
          .status-passed {
            background-color: #e6ffec;
            color: #2da44e;
          }
          
          .status-failed {
            background-color: #ffebe9;
            color: #cf222e;
          }
          
          .test-details {
            margin-top: 15px;
          }
          
          .test-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .test-summary-item {
            flex: 1;
            min-width: 100px;
            text-align: center;
            padding: 10px;
            border-radius: 6px;
            background-color: #f6f8fa;
          }
          
          .test-summary-value {
            font-size: 24px;
            font-weight: bold;
          }
          
          .test-summary-label {
            font-size: 12px;
            color: #586069;
          }
          
          .test-detail {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 4px;
          }
          
          .test-detail.pass {
            background-color: #e6ffec;
          }
          
          .test-detail.fail {
            background-color: #ffebe9;
          }
          
          .test-detail.skip {
            background-color: #fffbdd;
          }
          
          .timestamp {
            font-size: 12px;
            color: #586069;
            margin-top: 10px;
            text-align: center;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eaecef;
            text-align: center;
            font-size: 12px;
            color: #586069;
          }
        </style>
      </head>
      <body>
        <h1>IGame Compatibility Test Report</h1>
        
        <div class="timestamp">Generated on ${timestamp}</div>
        
        <h2>Summary</h2>
        
        <div class="summary">
          <div class="summary-item summary-total">
            <div class="summary-value">${this.results.summary.total}</div>
            <div class="summary-label">Total Games</div>
          </div>
          
          <div class="summary-item summary-passed">
            <div class="summary-value">${this.results.summary.passed}</div>
            <div class="summary-label">Passed</div>
          </div>
          
          <div class="summary-item summary-failed">
            <div class="summary-value">${this.results.summary.failed}</div>
            <div class="summary-label">Failed</div>
          </div>
        </div>
        
        <h2>Test Results</h2>
    `;
    
    // Добавляем результаты для каждой игры
    for (const gameId in this.results.games) {
      const gameResult = this.results.games[gameId];
      const success = gameResult.success;
      
      html += `
        <div class="game-result ${success ? 'passed' : 'failed'}">
          <h3>${gameResult.name}</h3>
          
          <div class="status-indicator status-${success ? 'passed' : 'failed'}">
            ${success ? 'PASSED' : 'FAILED'}
          </div>
      `;
      
      if (gameResult.error) {
        html += `
          <div class="error-message test-detail fail">
            Error: ${gameResult.error}
          </div>
        `;
      } else if (gameResult.result) {
        const result = gameResult.result;
        
        html += `
          <div class="test-details">
            <div class="test-summary">
              <div class="test-summary-item">
                <div class="test-summary-value">${result.totalTests}</div>
                <div class="test-summary-label">Total</div>
              </div>
              
              <div class="test-summary-item" style="background-color: #e6ffec;">
                <div class="test-summary-value" style="color: #2da44e;">${result.passed}</div>
                <div class="test-summary-label">Passed</div>
              </div>
              
              <div class="test-summary-item" style="background-color: #ffebe9;">
                <div class="test-summary-value" style="color: #cf222e;">${result.failed}</div>
                <div class="test-summary-label">Failed</div>
              </div>
              
              <div class="test-summary-item" style="background-color: #fffbdd;">
                <div class="test-summary-value" style="color: #bf8700;">${result.skipped}</div>
                <div class="test-summary-label">Skipped</div>
              </div>
            </div>
            
            <h4>Test Details</h4>
        `;
        
        // Группируем детали тестов по группам
        const testGroups = {};
        for (const detail of result.testDetails) {
          if (!testGroups[detail.group]) {
            testGroups[detail.group] = [];
          }
          testGroups[detail.group].push(detail);
        }
        
        // Выводим детали по группам
        for (const group in testGroups) {
          html += `<h5>${group}</h5>`;
          
          for (const detail of testGroups[group]) {
            const icon = detail.status === 'pass' ? '✓' : 
                         detail.status === 'fail' ? '✗' : '⚠';
            
            const iconColor = detail.status === 'pass' ? '#2da44e' :
                             detail.status === 'fail' ? '#cf222e' : '#bf8700';
            
            html += `
              <div class="test-detail ${detail.status}">
                <div style="font-weight: bold; margin-bottom: 3px;">
                  <span style="margin-right: 5px; color: ${iconColor};">${icon}</span>
                  ${detail.name}
                </div>
            `;
            
            if (detail.reason) {
              html += `
                <div style="margin-top: 3px; font-size: 12px; color: #555;">
                  ${detail.reason}
                </div>
              `;
            }
            
            html += `</div>`;
          }
        }
        
        html += `</div>`;
      }
      
      html += `
        <div style="font-size: 12px; color: #586069; margin-top: 10px; text-align: right;">
          Tested on ${new Date(gameResult.timestamp).toLocaleString()}
        </div>
      </div>
      `;
    }
    
    // Завершаем HTML страницу
    html += `
        <div class="footer">
          Generated by IGame Test Runner
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
  
  /**
   * Сбрасывает тестовый запускатель
   */
  reset() {
    // Очищаем результаты
    this.results = {
      games: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      timestamp: null
    };
    
    // Очищаем контейнер результатов
    this.resultsContainer.innerHTML = '';
    
    // Начальное сообщение
    const initialMessage = document.createElement('div');
    initialMessage.className = 'initial-message';
    initialMessage.style.cssText = 'text-align: center; color: #666; padding: 20px;';
    initialMessage.textContent = 'Select games and click "Run Tests" to start testing.';
    this.resultsContainer.appendChild(initialMessage);
    
    // Сбрасываем отметки "выбрать все"
    const selectAllCheckbox = document.getElementById('select-all-games');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = true;
    }
    
    // Сбрасываем чекбоксы игр
    const gameCheckboxes = this.gamesListContainer.querySelectorAll('input[type="checkbox"]');
    gameCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    
    this.log('Test runner reset');
  }
  
  /**
   * Выводит сообщение в лог
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип сообщения ('info', 'success', 'warning', 'error')
   * @private
   */
  log(message, type = 'info') {
    if (this.options.verbose) {
      const logMethod = {
        'info': console.log,
        'success': console.log,
        'warning': console.warn,
        'error': console.error
      }[type] || console.log;
      
      logMethod(`[IGameTestRunner] ${message}`);
    }
  }
}

// Экспортируем класс
window.IGameTestRunner = IGameTestRunner;