/**
 * TestEnvironment.js
 * Создает изолированную тестовую среду, предотвращающую влияние тестов на основной UI
 */

class TestEnvironment {
  constructor() {
    this.originalState = null;
    this.testContainer = null;
    this.observers = [];
    this.testElements = new Map();
    this.originalStyles = new Map();
    this.eventListeners = new Map();
  }

  /**
   * Инициализировать тестовую среду
   * @returns {Promise} Промис, который разрешается, когда среда готова
   */
  async initialize() {
    console.log('Initializing test environment');
    
    // Сохранить оригинальное состояние DOM и CSS перед тестами
    this.captureOriginalState();
    
    // Создать изолированный контейнер для тестов
    this.createTestContainer();
    
    // Создать наблюдатели за изменениями DOM
    this.setupObservers();
    
    // Применить защитные CSS-правила
    this.applyProtectiveStyles();
    
    // Добавить тестовую панель
    this.createTestPanel();
    
    return Promise.resolve();
  }

  /**
   * Сохранить оригинальное состояние DOM и CSS
   * @private
   */
  captureOriginalState() {
    // Сохранить классы элементов body
    this.originalState = {
      bodyClasses: [...document.body.classList],
      cssVariables: {},
      overlayState: {}
    };
    
    // Сохранить текущие значения CSS-переменных
    const rootStyle = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyle.length; i++) {
      const property = rootStyle[i];
      if (property.startsWith('--')) {
        this.originalState.cssVariables[property] = rootStyle.getPropertyValue(property);
      }
    }
    
    // Сохранить состояние оверлея меню и попапа
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
      this.originalState.overlayState = {
        classes: [...menuOverlay.classList],
        isActive: menuOverlay.classList.contains('active'),
        HTML: menuOverlay.innerHTML,
        parent: menuOverlay.parentElement
      };
      
      // Сохранить все стили
      this.originalStyles.set(menuOverlay, {
        cssText: menuOverlay.style.cssText,
        computedStyle: {}
      });
      
      const computedOverlayStyle = getComputedStyle(menuOverlay);
      for (const property of ['position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'z-index', 'opacity', 'visibility']) {
        this.originalStyles.get(menuOverlay).computedStyle[property] = computedOverlayStyle[property];
      }
      
      // Сохранить попап внутри оверлея
      const popup = menuOverlay.querySelector('.popup');
      if (popup) {
        this.originalStyles.set(popup, {
          cssText: popup.style.cssText,
          computedStyle: {}
        });
        
        const computedPopupStyle = getComputedStyle(popup);
        for (const property of ['position', 'top', 'left', 'margin', 'width', 'max-width', 'transform', 'z-index']) {
          this.originalStyles.get(popup).computedStyle[property] = computedPopupStyle[property];
        }
      }
    }
    
    // Сохранить другие важные элементы
    ['game-container', 'playground-zone', 'betting-zone', 'header', 'footer', 'chat-panel', 'settings-panel'].forEach(id => {
      const element = document.getElementById(id) || document.querySelector(`.${id}`);
      if (element) {
        this.originalStyles.set(element, {
          cssText: element.style.cssText,
          computedStyle: {}
        });
        
        const computedStyle = getComputedStyle(element);
        for (const property of ['position', 'display', 'grid-template-areas', 'grid-template-columns']) {
          this.originalStyles.get(element).computedStyle[property] = computedStyle[property];
        }
      }
    });
    
    console.log('Original state captured', this.originalState);
  }

  /**
   * Создать изолированный контейнер для тестов
   * @private
   */
  createTestContainer() {
    // Проверить, существует ли уже контейнер
    let existingContainer = document.getElementById('test-environment-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Создать контейнер
    this.testContainer = document.createElement('div');
    this.testContainer.id = 'test-environment-container';
    this.testContainer.setAttribute('aria-hidden', 'true');
    this.testContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 800px;
      height: 600px;
      overflow: hidden;
      visibility: hidden;
      pointer-events: none;
      contain: strict;
    `;
    
    // Добавить в DOM
    document.body.appendChild(this.testContainer);
    console.log('Test container created');
  }

  /**
   * Настроить наблюдатели за изменениями DOM
   * @private
   */
  setupObservers() {
    // Наблюдать за изменениями в теле документа
    const bodyObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Отслеживать новые элементы, добавленные тестами
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                node.id !== 'test-environment-container' && 
                !this.testContainer.contains(node) &&
                !node.classList.contains('test-panel') &&
                !document.getElementById('test-environment-container')?.contains(node)) {
              
              // Сохранить элемент для последующей очистки
              if (node.id) {
                console.log(`Tracking test-added element: #${node.id}`);
                this.testElements.set(node.id, node);
              } else if (node.className) {
                console.log(`Tracking test-added element: .${node.className.split(' ')[0]}`);
                this.testElements.set(node.className.split(' ')[0], node);
              }
            }
          }
          
          // Проверить, не удалил ли тест важные элементы
          for (const node of mutation.removedNodes) {
            if (node.id === 'menu-overlay' || 
                (node.nodeType === Node.ELEMENT_NODE && node.querySelector('.popup'))) {
              console.warn('Critical UI element was removed during test: ', node.id || node.className);
              // Очередь для восстановления в конце теста
              this.restoreElement(node);
            }
          }
        }
      }
    });
    
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: false
    });
    
    this.observers.push(bodyObserver);
    
    // Наблюдать за изменениями атрибутов в ключевых элементах
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
      const overlayObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            console.log('Menu overlay style modified by test');
          }
        }
      });
      
      overlayObserver.observe(menuOverlay, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      this.observers.push(overlayObserver);
    }
  }

  /**
   * Применить защитные CSS-правила
   * @private
   */
  applyProtectiveStyles() {
    const styleId = 'test-environment-protective-styles';
    
    // Удалить существующие стили, если они есть
    const existingStyles = document.getElementById(styleId);
    if (existingStyles) {
      existingStyles.remove();
    }
    
    // Создать элемент стиля
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Защитить важные элементы от изменений во время тестов */
      body.test-environment-active #menu-overlay {
        position: fixed !important;
        z-index: 1000 !important;
      }
      
      body.test-environment-active .popup {
        position: relative !important;
        margin: 50px auto !important;
        max-width: 90% !important;
        z-index: 1001 !important;
      }
      
      body.test-environment-active #test-environment-container {
        isolation: isolate;
      }
      
      /* Сохранить правильное расположение при возобновлении активности после тестов */
      #menu-overlay {
        transition: none !important;
      }
      
      /* Предотвратить влияние тестов на текущую сетку */
      body.test-environment-active .game-content {
        contain: layout style;
      }
    `;
    
    // Добавить в DOM
    document.head.appendChild(style);
    console.log('Protective styles applied');
  }

  /**
   * Создать тестовую панель
   * @private
   */
  createTestPanel() {
    const panelId = 'test-environment-panel';
    
    // Удалить существующую панель, если она есть
    const existingPanel = document.getElementById(panelId);
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Создать панель
    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'test-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 350px;
      max-height: 80vh;
      background-color: rgba(40, 42, 54, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      color: #f8f8f2;
      font-family: monospace;
      z-index: 999;
      overflow-y: auto;
      transition: all 0.3s ease;
      opacity: 0;
      pointer-events: none;
    `;
    
    // Добавить заголовок
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background-color: #6272a4;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Framework Test Environment';
    title.style.cssText = `
      margin: 0;
      color: #f8f8f2;
      font-size: 16px;
      font-weight: bold;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #f8f8f2;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    `;
    
    closeButton.addEventListener('click', () => {
      this.hidePanel();
      
      // Сохраняем колбэк и удаляем его после использования
      this.eventListeners.set('panel-close', closeButton);
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Добавить содержимое
    const content = document.createElement('div');
    content.id = 'test-environment-content';
    content.style.cssText = `
      padding: 16px;
      max-height: calc(80vh - 44px);
      overflow-y: auto;
    `;
    
    // Добавить контейнер для результатов
    const results = document.createElement('div');
    results.id = 'test-environment-results';
    content.appendChild(results);
    
    // Собрать панель
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Добавить панель в DOM (вне тестового контейнера)
    document.body.appendChild(panel);
    console.log('Test panel created');
  }

  /**
   * Показать тестовую панель
   */
  showPanel() {
    const panel = document.getElementById('test-environment-panel');
    if (panel) {
      panel.style.opacity = '1';
      panel.style.pointerEvents = 'auto';
    }
  }

  /**
   * Скрыть тестовую панель
   */
  hidePanel() {
    const panel = document.getElementById('test-environment-panel');
    if (panel) {
      panel.style.opacity = '0';
      panel.style.pointerEvents = 'none';
    }
  }

  /**
   * Запустить тест в изолированной среде
   * @param {string} name - Имя теста
   * @param {Function} testFn - Функция теста
   * @returns {Promise<Object>} Результаты теста
   */
  async runTest(name, testFn) {
    console.log(`Starting test in isolated environment: ${name}`);
    
    // Указать, что тесты активны
    document.body.classList.add('test-environment-active');
    
    try {
      // Показать тестовую панель
      this.showPanel();
      
      // Обновить статус в панели
      this.updatePanelStatus(`Running test: ${name}...`, 'running');
      
      // Создать временный контейнер для этого конкретного теста
      const testInstanceContainer = document.createElement('div');
      testInstanceContainer.className = `test-instance ${name.replace(/\s/g, '-').toLowerCase()}`;
      testInstanceContainer.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      `;
      
      // Добавить контейнер теста в основной тестовый контейнер
      this.testContainer.appendChild(testInstanceContainer);
      
      // Запустить тест
      const startTime = performance.now();
      let result;
      
      try {
        result = await Promise.resolve(testFn(testInstanceContainer));
        const endTime = performance.now();
        
        console.log(`Test completed: ${name} (${(endTime - startTime).toFixed(2)}ms)`);
        
        // Обновить статус в панели
        this.updatePanelStatus(`Test passed: ${name}`, 'success', {
          duration: (endTime - startTime).toFixed(2)
        });
        
        return {
          name,
          success: true,
          duration: endTime - startTime,
          result
        };
      } catch (error) {
        const endTime = performance.now();
        
        console.error(`Test failed: ${name}`, error);
        
        // Обновить статус в панели
        this.updatePanelStatus(`Test failed: ${name}`, 'error', {
          duration: (endTime - startTime).toFixed(2),
          error: error.message
        });
        
        return {
          name,
          success: false,
          duration: endTime - startTime,
          error: error.message,
          stack: error.stack
        };
      } finally {
        // Очистить контейнер этого теста
        testInstanceContainer.remove();
      }
    } finally {
      // Восстановить состояние после теста
      await this.cleanupAfterTest();
    }
  }

  /**
   * Обновить статус в тестовой панели
   * @param {string} message - Сообщение о статусе
   * @param {string} status - Статус (running, success, error)
   * @param {Object} data - Дополнительные данные для отображения
   */
  updatePanelStatus(message, status, data = {}) {
    const resultsContainer = document.getElementById('test-environment-results');
    if (!resultsContainer) return;
    
    // Создать элемент статуса
    const statusElement = document.createElement('div');
    statusElement.style.cssText = `
      margin-bottom: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      background-color: ${
        status === 'running' ? 'rgba(80, 250, 123, 0.1)' : 
        status === 'success' ? 'rgba(80, 250, 123, 0.2)' :
        'rgba(255, 85, 85, 0.2)'
      };
      border-left: 3px solid ${
        status === 'running' ? '#50fa7b' : 
        status === 'success' ? '#50fa7b' :
        '#ff5555'
      };
    `;
    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.fontWeight = 'bold';
    statusElement.appendChild(messageElement);
    
    // Добавить дополнительную информацию, если есть
    if (data.duration) {
      const durationElement = document.createElement('div');
      durationElement.textContent = `Duration: ${data.duration}ms`;
      durationElement.style.fontSize = '0.8em';
      durationElement.style.opacity = '0.8';
      statusElement.appendChild(durationElement);
    }
    
    if (data.error) {
      const errorElement = document.createElement('div');
      errorElement.textContent = data.error;
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
      statusElement.appendChild(errorElement);
    }
    
    // Добавить в контейнер результатов
    resultsContainer.appendChild(statusElement);
    
    // Прокрутить к новому элементу
    statusElement.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Создать мок-элемент для теста
   * @param {string} id - ID элемента
   * @param {string} tagName - Имя тега
   * @param {Object} options - Дополнительные опции (className, attributes, style)
   * @returns {HTMLElement} Созданный элемент
   */
  createMockElement(id, tagName = 'div', options = {}) {
    const element = document.createElement(tagName);
    element.id = id;
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        element.setAttribute(key, value);
      }
    }
    
    if (options.style) {
      for (const [property, value] of Object.entries(options.style)) {
        element.style[property] = value;
      }
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    // Добавить элемент в тестовый контейнер
    this.testContainer.appendChild(element);
    
    // Отслеживать элемент для очистки
    this.testElements.set(id, element);
    
    return element;
  }

  /**
   * Получить реальный или создать мок-элемент для теста
   * @param {string} selector - CSS-селектор элемента
   * @param {Object} mockOptions - Опции для создания мок-элемента при отсутствии реального
   * @returns {HTMLElement} Элемент
   */
  getOrCreateElement(selector, mockOptions = {}) {
    // Попробовать найти реальный элемент
    const realElement = document.querySelector(selector);
    
    if (realElement) {
      // Создать клон реального элемента для использования в тестах
      const clone = realElement.cloneNode(true);
      const id = clone.id || `mock-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`;
      clone.id = id;
      
      // Добавить клон в тестовый контейнер
      this.testContainer.appendChild(clone);
      
      // Отслеживать элемент для очистки
      this.testElements.set(id, clone);
      
      return clone;
    }
    
    // Создать мок-элемент
    const id = mockOptions.id || `mock-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`;
    return this.createMockElement(id, mockOptions.tagName || 'div', mockOptions);
  }

  /**
   * Восстановить элемент в DOM
   * @param {HTMLElement} element - Элемент для восстановления
   * @private
   */
  restoreElement(element) {
    // Проверить, существует ли уже элемент с таким ID
    if (element.id && document.getElementById(element.id)) {
      console.log(`Element #${element.id} already exists in DOM, no need to restore`);
      return;
    }
    
    // Для элементов, которые должны быть внутри body
    if (element.id === 'menu-overlay') {
      document.body.appendChild(element);
      console.log(`Restored element #${element.id} to body`);
      return;
    }
    
    // Восстановить элемент в его родителе, если известно где
    if (this.originalState.overlayState?.parent) {
      if (element.id === 'menu-overlay') {
        this.originalState.overlayState.parent.appendChild(element);
        console.log(`Restored element #${element.id} to its original parent`);
        return;
      }
    }
    
    // Для других элементов - просто добавить в body
    document.body.appendChild(element);
    console.log(`Restored element to body (no parent info)`, element);
  }

  /**
   * Очистить среду после тестов
   */
  async cleanupAfterTest() {
    console.log('Cleaning up after test...');
    
    // Остановить все наблюдатели
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    
    // Удалить все элементы, добавленные тестами
    for (const [id, element] of this.testElements.entries()) {
      // Не удалять элементы, которые могли быть частью оригинального DOM
      const importantIds = ['menu-overlay', 'game-container', 'playground-zone', 'betting-zone', 'header', 'footer'];
      if (!importantIds.includes(id)) {
        try {
          if (element.parentNode) {
            element.remove();
          }
          console.log(`Removed test element: ${id}`);
        } catch (error) {
          console.warn(`Failed to remove test element: ${id}`, error);
        }
      }
    }
    
    // Очистить карту отслеживаемых элементов
    this.testElements.clear();
    
    // Восстановить оригинальный DOM
    await this.restoreOriginalState();
    
    // Запустить потенциальную анимацию
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Удалить класс активных тестов
        document.body.classList.remove('test-environment-active');
        
        console.log('Cleanup completed');
      });
    });
  }

  /**
   * Восстановить оригинальное состояние
   * @private
   */
  async restoreOriginalState() {
    console.log('Restoring original state...');
    
    // Восстановить классы body
    if (this.originalState?.bodyClasses) {
      document.body.className = this.originalState.bodyClasses.join(' ');
    }
    
    // Восстановить CSS-переменные
    if (this.originalState?.cssVariables) {
      for (const [property, value] of Object.entries(this.originalState.cssVariables)) {
        document.documentElement.style.setProperty(property, value);
      }
    }
    
    // Восстановить состояние оверлея меню
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay && this.originalState?.overlayState) {
      // Восстановить классы
      menuOverlay.className = this.originalState.overlayState.classes.join(' ');
      
      // Восстановить состояние активности
      if (this.originalState.overlayState.isActive) {
        menuOverlay.classList.add('active');
      } else {
        menuOverlay.classList.remove('active');
      }
      
      // Восстановить стили для оверлея
      if (this.originalStyles.has(menuOverlay)) {
        menuOverlay.style.cssText = this.originalStyles.get(menuOverlay).cssText;
      }
      
      // Восстановить попап, если он был
      const popup = menuOverlay.querySelector('.popup');
      if (popup && this.originalStyles.has(popup)) {
        popup.style.cssText = this.originalStyles.get(popup).cssText;
      }
    }
    
    // Восстановить стили других важных элементов
    for (const [element, styles] of this.originalStyles.entries()) {
      if (element && element !== menuOverlay) {
        element.style.cssText = styles.cssText;
      }
    }
    
    // Запустить событие resize для пересчета макета
    window.dispatchEvent(new Event('resize'));
    
    // Ждать два кадра для стабилизации
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
    
    console.log('Original state restored');
  }

  /**
   * Завершить и очистить тестовую среду
   */
  async finalize() {
    console.log('Finalizing test environment...');
    
    // Очистить после тестов
    await this.cleanupAfterTest();
    
    // Удалить тестовый контейнер
    if (this.testContainer && this.testContainer.parentNode) {
      this.testContainer.remove();
    }
    
    // Удалить тестовую панель
    const testPanel = document.getElementById('test-environment-panel');
    if (testPanel) {
      testPanel.remove();
    }
    
    // Удалить защитные стили
    const protectiveStyles = document.getElementById('test-environment-protective-styles');
    if (protectiveStyles) {
      protectiveStyles.remove();
    }
    
    // Удалить добавленные слушатели событий
    for (const [event, element] of this.eventListeners.entries()) {
      // Удаление конкретных слушателей сложно без информации о функциях
      // Поэтому просто очищаем карту
    }
    this.eventListeners.clear();
    
    console.log('Test environment finalized');
  }

  /**
   * Создать снимок DOM
   * @returns {Object} Снимок состояния DOM
   */
  createDOMSnapshot() {
    const snapshot = {
      bodyClasses: [...document.body.classList],
      elementStates: {}
    };
    
    // Сохранить состояние важных элементов
    ['menu-overlay', 'game-container', 'playground-zone', 'betting-zone', 'header', 'footer', 'chat-panel', 'settings-panel'].forEach(id => {
      const element = document.getElementById(id) || document.querySelector(`.${id}`);
      if (element) {
        snapshot.elementStates[id] = {
          exists: true,
          parentId: element.parentElement ? (element.parentElement.id || element.parentElement.className) : 'unknown',
          classes: [...element.classList],
          styles: element.style.cssText,
          attributes: {}
        };
        
        // Сохранить атрибуты
        for (const attr of element.attributes) {
          snapshot.elementStates[id].attributes[attr.name] = attr.value;
        }
      } else {
        snapshot.elementStates[id] = {
          exists: false
        };
      }
    });
    
    return snapshot;
  }

  /**
   * Сравнить два снимка DOM и найти различия
   * @param {Object} snapshot1 - Первый снимок
   * @param {Object} snapshot2 - Второй снимок
   * @returns {Object} Различия между снимками
   */
  compareDOMSnapshots(snapshot1, snapshot2) {
    const differences = {
      bodyClasses: {
        added: snapshot2.bodyClasses.filter(cls => !snapshot1.bodyClasses.includes(cls)),
        removed: snapshot1.bodyClasses.filter(cls => !snapshot2.bodyClasses.includes(cls))
      },
      elements: {}
    };
    
    // Сравнить элементы
    for (const id in snapshot1.elementStates) {
      differences.elements[id] = {
        existenceChanged: snapshot1.elementStates[id].exists !== snapshot2.elementStates[id]?.exists,
        parentChanged: snapshot1.elementStates[id].parentId !== snapshot2.elementStates[id]?.parentId,
        classesChanged: false,
        stylesChanged: false,
        attributesChanged: false
      };
      
      // Если элемент существует в обоих снимках
      if (snapshot1.elementStates[id].exists && snapshot2.elementStates[id]?.exists) {
        // Сравнить классы
        const classes1 = snapshot1.elementStates[id].classes;
        const classes2 = snapshot2.elementStates[id].classes;
        differences.elements[id].classesChanged = !classes1.every(cls => classes2.includes(cls)) || 
                                                 !classes2.every(cls => classes1.includes(cls));
        
        // Сравнить стили
        differences.elements[id].stylesChanged = snapshot1.elementStates[id].styles !== snapshot2.elementStates[id].styles;
        
        // Сравнить атрибуты
        const attrs1 = Object.entries(snapshot1.elementStates[id].attributes);
        const attrs2 = Object.entries(snapshot2.elementStates[id].attributes);
        differences.elements[id].attributesChanged = attrs1.length !== attrs2.length ||
                                                   !attrs1.every(([key, value]) => 
                                                    snapshot2.elementStates[id].attributes[key] === value);
      }
    }
    
    return differences;
  }
}

// Экспортировать класс
window.TestEnvironment = TestEnvironment;