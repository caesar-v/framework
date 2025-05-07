/**
 * Модульный тестовый фреймворк для игрового движка
 * Запускает тесты в изолированной среде, предотвращая влияние на реальный UI
 */

(function() {
  // Статус, указывающий, инициализирован ли фреймворк
  let initialized = false;
  
  // Экземпляр запускателя тестов
  let testRunner = null;
  
  /**
   * Инициализировать тестовый фреймворк
   * @returns {Promise} Промис, который разрешается, когда фреймворк готов
   */
  async function initialize() {
    if (initialized) {
      console.log('Test framework already initialized');
      return Promise.resolve();
    }
    
    console.log('Initializing test framework...');
    
    try {
      // Загрузить необходимые скрипты
      await loadTestScripts();
      
      // Создать и инициализировать запускатель тестов
      testRunner = new TestRunner();
      await testRunner.initialize();
      
      // Добавить глобальную функцию для запуска тестов из консоли
      window.runFrameworkTests = runAllTests;
      
      initialized = true;
      console.log('Test framework initialized successfully');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize test framework:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Загрузить тестовые скрипты
   * @returns {Promise} Промис, который разрешается, когда скрипты загружены
   */
  function loadTestScripts() {
    return new Promise((resolve, reject) => {
      console.log('Loading test scripts...');
      
      // Проверить, загружены ли уже скрипты
      if (window.TestEnvironment && window.TestRunner) {
        console.log('Test scripts already loaded');
        resolve();
        return;
      }
      
      // Функция для загрузки скрипта
      const loadScript = (src) => {
        return new Promise((resolveScript, rejectScript) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          
          script.onload = () => {
            console.log(`Script loaded: ${src}`);
            resolveScript();
          };
          
          script.onerror = (error) => {
            console.error(`Failed to load script: ${src}`, error);
            rejectScript(new Error(`Failed to load ${src}`));
          };
          
          document.head.appendChild(script);
        });
      };
      
      // Загрузить скрипты параллельно
      Promise.all([
        loadScript('js/test/TestEnvironment.js'),
        loadScript('js/test/TestRunner.js'),
        loadScript('js/test/IGameTester.js').catch(err => {
          console.warn('IGameTester script not loaded, IGame compatibility tests will be skipped', err);
          return Promise.resolve(); // Продолжаем даже если IGameTester не загружен
        })
      ])
      .then(() => {
        console.log('All test scripts loaded');
        resolve();
      })
      .catch(reject);
    });
  }
  
  /**
   * Запустить все тесты
   * @returns {Promise} Промис, который разрешается с результатами тестов
   */
  async function runAllTests() {
    if (!initialized) {
      await initialize();
    }
    
    console.log('Running all tests...');
    
    try {
      // Показать кнопку "Отмена" в UI
      showCancelButton();
      
      // Запустить все тесты
      const results = await testRunner.runAllTests();
      
      // Скрыть кнопку "Отмена"
      hideCancelButton();
      
      console.log('All tests completed:', results);
      return results;
    } catch (error) {
      console.error('Failed to run tests:', error);
      // Скрыть кнопку "Отмена"
      hideCancelButton();
      throw error;
    }
  }
  
  /**
   * Создать и показать кнопку "Отмена" для тестов
   */
  function showCancelButton() {
    // Удалить существующую кнопку, если она есть
    const existingButton = document.getElementById('cancel-tests-button');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Создать кнопку
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-tests-button';
    cancelButton.textContent = 'Отменить тесты';
    cancelButton.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background-color: #ff5555;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    // Добавить обработчик события
    cancelButton.addEventListener('click', async () => {
      console.log('Tests cancelled by user');
      
      // Скрыть кнопку
      hideCancelButton();
      
      // Завершить запускатель тестов
      if (testRunner) {
        await testRunner.finalize();
      }
      
      // Перезагрузить страницу, чтобы очистить все эффекты от тестов
      location.reload();
    });
    
    // Добавить кнопку в DOM
    document.body.appendChild(cancelButton);
  }
  
  /**
   * Скрыть кнопку "Отмена"
   */
  function hideCancelButton() {
    const cancelButton = document.getElementById('cancel-tests-button');
    if (cancelButton) {
      cancelButton.remove();
    }
  }
  
  /**
   * Завершить и очистить тестовый фреймворк
   */
  async function finalize() {
    if (!initialized) {
      console.log('Test framework not initialized, nothing to finalize');
      return;
    }
    
    console.log('Finalizing test framework...');
    
    // Завершить запускатель тестов
    if (testRunner) {
      await testRunner.finalize();
      testRunner = null;
    }
    
    // Сбросить инициализацию
    initialized = false;
    
    // Удалить глобальную функцию
    delete window.runFrameworkTests;
    
    console.log('Test framework finalized');
  }
  
  // Настроить глобальный объект для тестового фреймворка
  window.testFramework = {
    initialize: initialize,
    runAllTests: runAllTests,
    finalize: finalize
  };
  
  // Добавить обработчик событий только для кнопки запуска тестов
  document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.getElementById('autotest-button');
    if (testButton) {
      // Переименуем кнопку для ясности
      testButton.textContent = 'Run Tests (Safe Mode)';
      testButton.title = 'Запустить тесты в безопасном изолированном режиме';
      
      testButton.addEventListener('click', async () => {
        try {
          await runAllTests();
          console.log('Tests completed from button click');
        } catch (error) {
          console.error('Error running tests from button click:', error);
        }
      });
    }
  });
  
  console.log('Test framework module loaded');
})();