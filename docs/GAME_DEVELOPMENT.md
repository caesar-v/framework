# Руководство по разработке игр для Game Framework

Это руководство предназначено для разработчиков, которые хотят создавать новые игры для нашего фреймворка. В документе подробно описывается структура интерфейса IGame, приводятся примеры реализации и даются рекомендации по лучшим практикам разработки.

## Содержание

- [Введение](#введение)
- [Структура интерфейса IGame](#структура-интерфейса-igame)
- [Жизненный цикл игры](#жизненный-цикл-игры)
- [Пример реализации](#пример-реализации)
- [Управление состоянием](#управление-состоянием)
- [Система событий](#система-событий)
- [Визуализация и рендеринг](#визуализация-и-рендеринг)
- [Лучшие практики](#лучшие-практики)
- [Отладка](#отладка)
- [Часто задаваемые вопросы](#часто-задаваемые-вопросы)

## Введение

Game Framework предоставляет единый интерфейс для разработки и интеграции различных игр. Каждая игра должна реализовывать интерфейс `IGame`, который определяет стандартный набор методов для взаимодействия с фреймворком.

Раньше для адаптации существующих игр использовался паттерн Адаптер через класс `GameAdapter`. Теперь мы рекомендуем создавать игры, напрямую реализующие интерфейс `IGame`, что обеспечивает более простую интеграцию и стабильную работу игр в экосистеме фреймворка.

## Структура интерфейса IGame

Интерфейс `IGame` определен в файле `/api/interfaces/IGame.js` и включает следующие обязательные методы:

```javascript
class IGame {
  // Инициализация игры
  async initialize(config) { ... }
  
  // Запуск игры
  async start() { ... }
  
  // Приостановка игры
  pause() { ... }
  
  // Возобновление игры после паузы
  resume() { ... }
  
  // Остановка и выгрузка игры
  async destroy() { ... }
  
  // Выполнение игрового действия (например, спин в слотах)
  async performAction(params) { ... }
  
  // Обработка изменения размера контейнера
  resize(width, height) { ... }
  
  // Обновление настроек игры
  updateSettings(settings) { ... }
  
  // Расчет потенциального выигрыша
  calculatePotentialWin(betAmount, riskLevel) { ... }
  
  // Получение текущего состояния игры
  getState() { ... }
  
  // Восстановление состояния игры
  setState(state) { ... }
  
  // Получение информации об игре
  getInfo() { ... }
  
  // Проверка поддержки определенной функции
  supportsFeature(featureName) { ... }
  
  // Получение списка доступных событий
  getAvailableEvents() { ... }
  
  // Добавление обработчика события
  addEventListener(eventName, handler) { ... }
  
  // Удаление обработчика события
  removeEventListener(eventName, handler) { ... }
}
```

## Жизненный цикл игры

Игра, реализующая интерфейс `IGame`, должна корректно управлять своим жизненным циклом:

1. **Создание экземпляра игры**: При создании объекта игры выполняется конструктор, который должен установить начальные значения и подготовить объект к инициализации.

2. **Инициализация**: Метод `initialize(config)` получает конфигурацию и настраивает игру. На этом этапе создается canvas, инициализируются ресурсы, устанавливаются обработчики событий.

3. **Запуск**: Метод `start()` запускает игру после инициализации, начинает анимационные циклы, запускает игровую логику.

4. **Приостановка/Возобновление**: Методы `pause()` и `resume()` управляют состоянием активности игры без ее выгрузки.

5. **Выполнение действий**: Метод `performAction(params)` обрабатывает пользовательские действия (спин, установка ставки и т.д.).

6. **Выгрузка**: Метод `destroy()` освобождает все ресурсы, отключает обработчики событий и подготавливает игру к удалению.

## Пример реализации

Ниже приведен базовый шаблон игры, реализующей интерфейс `IGame`:

```javascript
class MyGame {
  constructor(config = {}) {
    // Установка значений по умолчанию
    this.config = {
      gameTitle: 'My Game',
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      ...config
    };
    
    // Состояние игры
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
    
    // Система событий
    this.eventListeners = {};
    
    // Ссылки на DOM и Canvas
    this.container = null;
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    
    // ID анимационного цикла для корректной остановки
    this.animationFrameId = null;
  }
  
  // Инициализация игры
  async initialize(config) {
    console.log('Initializing game with config:', config);
    
    // Сохраняем ссылку на контейнер
    this.container = config.container;
    
    // Обновляем конфигурацию
    if (config.bet) this.state.betAmount = config.bet;
    if (config.riskLevel) this.state.riskLevel = config.riskLevel;
    
    // Создаем canvas для рендеринга
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth;
    canvas.height = this.container.clientHeight;
    this.container.appendChild(canvas);
    
    // Сохраняем размеры и контекст
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    // Инициализируем игровые элементы
    this.initGameElements();
    
    // Добавляем обработчик изменения размера
    window.addEventListener('resize', () => {
      this.resize(this.container.clientWidth, this.container.clientHeight);
    });
    
    // Обновляем состояние
    this.state.initialized = true;
    
    // Генерируем событие инициализации
    this.emit('initialized', { success: true });
    
    return Promise.resolve();
  }
  
  // Запуск игры
  async start() {
    if (!this.state.initialized) {
      return Promise.reject(new Error('Game not initialized'));
    }
    
    // Обновляем состояние
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    // Запускаем анимационный цикл
    this.animate();
    
    // Генерируем событие запуска
    this.emit('started', { success: true });
    
    return Promise.resolve();
  }
  
  // Приостановка игры
  pause() {
    if (!this.state.isRunning) {
      console.warn('Cannot pause a game that is not running');
      return;
    }
    
    this.state.isPaused = true;
    
    // Останавливаем анимационный цикл
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Генерируем событие паузы
    this.emit('paused', { timestamp: Date.now() });
  }
  
  // Возобновление игры
  resume() {
    if (!this.state.isPaused) {
      console.warn('Cannot resume a game that is not paused');
      return;
    }
    
    this.state.isPaused = false;
    
    // Возобновляем анимационный цикл
    this.animate();
    
    // Генерируем событие возобновления
    this.emit('resumed', { timestamp: Date.now() });
  }
  
  // Выгрузка игры
  async destroy() {
    // Останавливаем анимационный цикл
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Удаляем обработчик изменения размера
    window.removeEventListener('resize', this.resize);
    
    // Очищаем контейнер
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Обновляем состояние
    this.state.isRunning = false;
    this.state.initialized = false;
    
    // Очищаем ссылки
    this.container = null;
    this.ctx = null;
    
    // Очищаем обработчики событий
    this.eventListeners = {};
    
    // Генерируем событие выгрузки
    this.emit('destroyed', { success: true });
    
    return Promise.resolve();
  }
  
  // Выполнение игрового действия
  async performAction(params) {
    if (!this.state.isRunning) {
      return Promise.reject(new Error('Game is not running'));
    }
    
    if (this.state.isPaused) {
      return Promise.reject(new Error('Game is paused'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      // Обработка различных типов действий
      case 'spin':
        // Реализация действия спина
        break;
        
      case 'setBet':
        // Реализация установки ставки
        break;
        
      default:
        return Promise.reject(new Error(`Unknown action type: ${type}`));
    }
  }
  
  // Обработка изменения размера
  resize(width, height) {
    if (!this.container) return;
    
    // Получаем элемент canvas
    const canvas = this.container.querySelector('canvas');
    if (!canvas) return;
    
    // Обновляем размеры canvas
    canvas.width = width;
    canvas.height = height;
    
    // Сохраняем новые размеры
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Перерисовываем игру
    this.renderGame(this.ctx, width, height, this.state);
    
    // Генерируем событие изменения размера
    this.emit('resize', { width, height });
  }
  
  // ... остальные методы интерфейса
  
  // Вспомогательные методы
  
  // Анимационный цикл
  animate() {
    // Пропускаем анимацию, если игра на паузе
    if (this.state.isPaused) return;
    
    // Обновляем игровое состояние
    
    // Рендеринг игры
    this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    
    // Запрашиваем следующий кадр
    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animate();
    });
  }
  
  // Инициализация игровых элементов
  initGameElements() {
    // Инициализация игровых элементов
  }
  
  // Рендеринг игры
  renderGame(ctx, width, height, state) {
    // Реализация рендеринга игры
  }
  
  // Система событий
  
  // Добавление обработчика события
  addEventListener(eventName, handler) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    
    // Инициализируем массив для этого события, если его нет
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    // Добавляем обработчик в массив
    this.eventListeners[eventName].push(handler);
  }
  
  // Удаление обработчика события
  removeEventListener(eventName, handler) {
    if (!this.eventListeners[eventName]) return;
    
    // Фильтруем обработчики
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      h => h !== handler
    );
  }
  
  // Генерация события
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) return;
    
    // Вызываем все обработчики с данными
    this.eventListeners[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
}
```

## Управление состоянием

Грамотное управление состоянием - одна из ключевых задач при реализации игры. Рекомендуется использовать следующую структуру состояния:

```javascript
this.state = {
  // Системное состояние
  initialized: false,    // Игра инициализирована
  isRunning: false,      // Игра запущена
  isPaused: false,       // Игра на паузе
  isSpinning: false,     // Выполняется спин или другое активное действие
  
  // Игровое состояние
  balance: 1000,         // Баланс игрока
  betAmount: 10,         // Текущая ставка
  riskLevel: 'medium',   // Уровень риска
  
  // Результаты
  lastResult: null,      // Результат последнего действия
  
  // Игровые элементы (специфичные для каждой игры)
  // ...
};
```

### Методы getState() и setState()

Для сохранения и восстановления состояния игры используются методы `getState()` и `setState()`:

```javascript
// Получение состояния для сохранения
getState() {
  return {
    balance: this.state.balance,
    betAmount: this.state.betAmount,
    riskLevel: this.state.riskLevel,
    // Копируем игровые элементы с глубоким клонированием
    gameElements: JSON.parse(JSON.stringify(this.gameElements)),
    lastResult: this.state.lastResult ? {...this.state.lastResult} : null
  };
}

// Восстановление состояния
setState(state) {
  // Восстанавливаем основные свойства состояния
  if (state.balance !== undefined) this.state.balance = state.balance;
  if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
  if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
  if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
  
  // Восстанавливаем игровые элементы
  if (state.gameElements) {
    this.gameElements = JSON.parse(JSON.stringify(state.gameElements));
  }
  
  // Перерисовываем игру
  if (this.ctx) {
    this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
  }
  
  // Генерируем событие восстановления состояния
  this.emit('stateRestored', {success: true});
}
```

## Система событий

Игра должна поддерживать систему событий для уведомления фреймворка о различных игровых действиях и изменениях состояния. Рекомендуемые события:

- `'initialized'` - игра инициализирована
- `'started'` - игра запущена
- `'paused'` - игра приостановлена
- `'resumed'` - игра возобновлена
- `'destroyed'` - игра выгружена
- `'spinStart'` - начало спина (или другого основного действия)
- `'spinEnd'` - окончание спина
- `'win'` - выигрыш
- `'loss'` - проигрыш
- `'betChanged'` - изменение ставки
- `'riskLevelChanged'` - изменение уровня риска
- `'resize'` - изменение размера
- `'stateRestored'` - состояние восстановлено

Метод `getAvailableEvents()` должен возвращать список всех событий, поддерживаемых игрой:

```javascript
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
    'stateRestored'
  ];
}
```

## Визуализация и рендеринг

Для визуализации игры рекомендуется использовать HTML5 Canvas. В методе `initialize()` создайте canvas и получите контекст для рисования:

```javascript
// Создаем canvas для рендеринга
const canvas = document.createElement('canvas');
canvas.width = this.container.clientWidth;
canvas.height = this.container.clientHeight;
this.container.appendChild(canvas);

// Сохраняем размеры и контекст
this.canvasWidth = canvas.width;
this.canvasHeight = canvas.height;
this.ctx = canvas.getContext('2d');
```

Реализуйте метод `renderGame()` для отрисовки игры:

```javascript
renderGame(ctx, width, height, state) {
  if (!ctx) return;
  
  // Очищаем canvas
  ctx.clearRect(0, 0, width, height);
  
  // Рисуем фон
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
  
  // Рисуем заголовок
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(this.config.gameTitle, width / 2, 30);
  
  // Рисуем информацию о ставке и балансе
  ctx.font = '16px Arial';
  ctx.fillText(`Ставка: ${state.betAmount} | Баланс: ${state.balance}`, width / 2, 60);
  
  // Рисуем игровые элементы
  // ...
}
```

Для анимации используйте `requestAnimationFrame`:

```javascript
animate() {
  // Пропускаем анимацию, если игра на паузе
  if (this.state.isPaused) return;
  
  // Обновляем игровое состояние
  // ...
  
  // Рендеринг игры
  this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
  
  // Запрашиваем следующий кадр
  this.animationFrameId = window.requestAnimationFrame(() => {
    this.animate();
  });
}
```

## Лучшие практики

1. **Разделение логики и представления**: Разделяйте игровую логику и визуализацию для упрощения поддержки и тестирования.

2. **Обработка ошибок**: Используйте try-catch для обработки ошибок в критических методах:

    ```javascript
    renderGame(ctx, width, height, state) {
      try {
        // Код рендеринга
      } catch (error) {
        console.error('Error in renderGame:', error);
      }
    }
    ```

3. **Адаптивный интерфейс**: Масштабируйте игровые элементы в соответствии с размером контейнера:

    ```javascript
    // Расчет размеров игровых элементов
    const elementSize = Math.min(width, height) * 0.1;
    ```

4. **Оптимизация производительности**:
   - Кэшируйте часто используемые объекты
   - Минимизируйте операции с DOM
   - Оптимизируйте циклы отрисовки

5. **Внедрение зависимостей**: Используйте конфигурацию для внедрения зависимостей:

    ```javascript
    // Возможность заменить стандартные сервисы
    if (config.services && config.services.audioService) {
      this.audioService = config.services.audioService;
    } else {
      this.audioService = new DefaultAudioService();
    }
    ```

## Отладка

Для отладки игр рекомендуется использовать:

1. **Консольные логи с префиксами**:

    ```javascript
    console.log('[MyGame:initialize] Config:', config);
    ```

2. **Визуализацию состояния игры**:

    ```javascript
    // Метод для отладки
    _debugRender(ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 300, 150);
      
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      
      let y = 30;
      ctx.fillText(`isRunning: ${this.state.isRunning}`, 20, y); y += 15;
      ctx.fillText(`isPaused: ${this.state.isPaused}`, 20, y); y += 15;
      ctx.fillText(`balance: ${this.state.balance}`, 20, y); y += 15;
      ctx.fillText(`betAmount: ${this.state.betAmount}`, 20, y); y += 15;
      // ...
    }
    ```

3. **Отслеживание событий**:

    ```javascript
    // Временная подписка на все события для отладки
    const allEvents = this.getAvailableEvents();
    allEvents.forEach(eventName => {
      this.addEventListener(eventName, data => {
        console.log(`[Event:${eventName}]`, data);
      });
    });
    ```

## Пример полной реализации: Игра в кости

Приведем пример полной реализации простой игры в кости:

```javascript
class DiceGame {
  constructor(config = {}) {
    // Конфигурация по умолчанию
    this.config = {
      gameTitle: 'Dice Game',
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      numDice: 2,
      diceSize: 80,
      diceColors: ['#e74c3c', '#3498db'],
      winningConditions: {
        'double': 2,     // Два одинаковых значения
        'sum7': 1.5,     // Сумма равна 7
        'sum11': 2.5,    // Сумма равна 11
      },
      ...config
    };
    
    // Игровое состояние
    this.state = {
      initialized: false,
      isRunning: false,
      isPaused: false,
      isSpinning: false,
      balance: this.config.initialBalance,
      betAmount: this.config.initialBet,
      riskLevel: 'medium',
      lastResult: null
    };
    
    // Игровые элементы
    this.diceValues = [];
    this.diceAnimations = [];
    
    // Система событий
    this.eventListeners = {};
    
    // Анимация
    this.animationFrameId = null;
    this.animationPhase = 0;
    
    // Canvas
    this.container = null;
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
  }
  
  // Инициализация игры
  async initialize(config) {
    console.log('[DiceGame:initialize] Starting with config:', config);
    
    // Сохраняем ссылку на контейнер
    this.container = config.container;
    
    // Обновляем конфигурацию
    if (config.bet) this.state.betAmount = config.bet;
    if (config.riskLevel) this.state.riskLevel = config.riskLevel;
    if (config.numDice) this.config.numDice = config.numDice;
    
    // Создаем canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth;
    canvas.height = this.container.clientHeight;
    this.container.appendChild(canvas);
    
    // Сохраняем размеры и контекст
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.ctx = canvas.getContext('2d');
    
    // Инициализируем кости
    this.initDice();
    
    // Обработчик изменения размера
    window.addEventListener('resize', () => {
      this.resize(this.container.clientWidth, this.container.clientHeight);
    });
    
    // Обновляем состояние
    this.state.initialized = true;
    
    // Событие инициализации
    this.emit('initialized', { success: true });
    
    return Promise.resolve();
  }
  
  // Запуск игры
  async start() {
    if (!this.state.initialized) {
      return Promise.reject(new Error('Game not initialized'));
    }
    
    // Обновляем состояние
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    // Запускаем анимацию
    this.animate();
    
    // Событие запуска
    this.emit('started', { success: true });
    
    return Promise.resolve();
  }
  
  // Пауза
  pause() {
    if (!this.state.isRunning) return;
    
    this.state.isPaused = true;
    
    // Останавливаем анимацию
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Событие паузы
    this.emit('paused', { timestamp: Date.now() });
  }
  
  // Возобновление
  resume() {
    if (!this.state.isPaused) return;
    
    this.state.isPaused = false;
    
    // Возобновляем анимацию
    this.animate();
    
    // Событие возобновления
    this.emit('resumed', { timestamp: Date.now() });
  }
  
  // Выгрузка
  async destroy() {
    // Останавливаем анимацию
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Удаляем обработчик ресайза
    window.removeEventListener('resize', this.resize);
    
    // Очищаем контейнер
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Обновляем состояние
    this.state.isRunning = false;
    this.state.initialized = false;
    
    // Очищаем ссылки
    this.container = null;
    this.ctx = null;
    
    // Очищаем слушатели событий
    this.eventListeners = {};
    
    // Событие выгрузки
    this.emit('destroyed', { success: true });
    
    return Promise.resolve();
  }
  
  // Выполнение действия
  async performAction(params) {
    if (!this.state.isRunning || this.state.isPaused) {
      return Promise.reject(new Error('Game is not in a runnable state'));
    }
    
    const { type, data = {} } = params;
    
    switch (type) {
      case 'roll':
      case 'spin':
        // Если уже выполняется бросок - отклоняем
        if (this.state.isSpinning) {
          return Promise.reject(new Error('Roll already in progress'));
        }
        
        return new Promise((resolve) => {
          // Обновляем состояние
          this.state.isSpinning = true;
          
          // Событие начала броска
          this.emit('spinStart', { timestamp: Date.now() });
          
          // Выполняем бросок костей
          this.rollDice((result) => {
            // Рассчитываем выигрыш
            let winAmount = 0;
            if (result.isWin) {
              winAmount = this.calculateWin(this.state.betAmount, this.state.riskLevel, result);
              
              // Обновляем баланс
              this.state.balance += winAmount;
              
              // Событие выигрыша
              this.emit('win', {
                amount: winAmount,
                type: result.winType,
                dice: result.diceValues
              });
            } else {
              // Вычитаем ставку из баланса
              this.state.balance -= this.state.betAmount;
              
              // Событие проигрыша
              this.emit('loss', {
                amount: this.state.betAmount,
                dice: result.diceValues
              });
            }
            
            // Обновляем состояние
            this.state.isSpinning = false;
            this.state.lastResult = { ...result, winAmount };
            
            // Событие окончания броска
            this.emit('spinEnd', {
              result,
              winAmount,
              balance: this.state.balance
            });
            
            // Резолвим промис с результатом
            resolve({
              success: true,
              result,
              winAmount,
              balance: this.state.balance
            });
          });
        });
        
      case 'setBet':
        if (data.amount === undefined) {
          return Promise.reject(new Error('No bet amount provided'));
        }
        
        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
          return Promise.reject(new Error('Invalid bet amount'));
        }
        
        // Ограничиваем ставку максимальным значением
        this.state.betAmount = Math.min(amount, this.config.maxBet);
        
        // Событие изменения ставки
        this.emit('betChanged', { amount: this.state.betAmount });
        
        return Promise.resolve({
          success: true,
          bet: this.state.betAmount
        });
        
      case 'setRiskLevel':
        if (data.level === undefined) {
          return Promise.reject(new Error('No risk level provided'));
        }
        
        const validLevels = ['low', 'medium', 'high'];
        if (!validLevels.includes(data.level)) {
          return Promise.reject(new Error('Invalid risk level'));
        }
        
        this.state.riskLevel = data.level;
        
        // Событие изменения уровня риска
        this.emit('riskLevelChanged', { level: data.level });
        
        return Promise.resolve({
          success: true,
          riskLevel: this.state.riskLevel
        });
        
      default:
        return Promise.reject(new Error(`Unknown action type: ${type}`));
    }
  }
  
  // Изменение размера
  resize(width, height) {
    if (!this.container) return;
    
    const canvas = this.container.querySelector('canvas');
    if (!canvas) return;
    
    // Обновляем размеры canvas
    canvas.width = width;
    canvas.height = height;
    
    // Сохраняем новые размеры
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Перерисовываем игру
    this.renderGame(this.ctx, width, height, this.state);
    
    // Событие изменения размера
    this.emit('resize', { width, height });
  }
  
  // Обновление настроек
  updateSettings(settings) {
    // Обновляем конфигурацию
    if (settings.numDice !== undefined) this.config.numDice = settings.numDice;
    if (settings.diceSize !== undefined) this.config.diceSize = settings.diceSize;
    if (settings.diceColors !== undefined) this.config.diceColors = settings.diceColors;
    
    // Обновляем настройки ставок
    if (settings.bet !== undefined) this.state.betAmount = settings.bet;
    if (settings.riskLevel !== undefined) this.state.riskLevel = settings.riskLevel;
    
    // Переинициализация костей если нужно
    if (settings.numDice !== undefined) {
      this.initDice();
    }
    
    // Перерисовываем игру
    if (this.ctx) {
      this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    }
    
    // Событие обновления настроек
    this.emit('settingsUpdated', { settings });
  }
  
  // Расчет потенциального выигрыша
  calculatePotentialWin(betAmount, riskLevel) {
    const riskMultipliers = {
      'low': 1.2,
      'medium': 2,
      'high': 3
    };
    
    // Берем максимальный множитель из условий выигрыша
    const maxMultiplier = Math.max(...Object.values(this.config.winningConditions));
    const riskMultiplier = riskMultipliers[riskLevel] || riskMultipliers.medium;
    
    return betAmount * maxMultiplier * riskMultiplier;
  }
  
  // Получение состояния
  getState() {
    return {
      balance: this.state.balance,
      betAmount: this.state.betAmount,
      riskLevel: this.state.riskLevel,
      diceValues: [...this.diceValues],
      lastResult: this.state.lastResult ? {...this.state.lastResult} : null
    };
  }
  
  // Установка состояния
  setState(state) {
    // Восстанавливаем основные свойства
    if (state.balance !== undefined) this.state.balance = state.balance;
    if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
    if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
    if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
    
    // Восстанавливаем значения костей
    if (state.diceValues && Array.isArray(state.diceValues)) {
      this.diceValues = [...state.diceValues];
    }
    
    // Перерисовываем игру
    if (this.ctx) {
      this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    }
    
    // Событие восстановления состояния
    this.emit('stateRestored', { success: true });
  }
  
  // Информация об игре
  getInfo() {
    return {
      id: 'dice-game',
      name: this.config.gameTitle,
      version: '1.0.0',
      type: 'dice',
      features: ['roll', 'animations', 'risk_levels'],
      author: 'Game Framework',
      description: 'Simple dice game with multiple winning conditions'
    };
  }
  
  // Проверка поддержки функции
  supportsFeature(featureName) {
    const supportedFeatures = [
      'roll',
      'animations',
      'risk_levels',
      'state_save',
      'state_restore'
    ];
    
    return supportedFeatures.includes(featureName);
  }
  
  // Получение доступных событий
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
  
  // Добавление обработчика события
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
  
  // Удаление обработчика события
  removeEventListener(eventName, handler) {
    if (!this.eventListeners[eventName]) return;
    
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      h => h !== handler
    );
  }
  
  // Генерация события
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
  
  // Вспомогательные методы
  
  // Инициализация костей
  initDice() {
    this.diceValues = [];
    this.diceAnimations = [];
    
    for (let i = 0; i < this.config.numDice; i++) {
      // Случайное начальное значение (1-6)
      this.diceValues.push(Math.floor(Math.random() * 6) + 1);
      
      // Анимационные параметры
      this.diceAnimations.push({
        rotation: Math.random() * 360,
        scale: 1,
        x: 0,
        y: 0
      });
    }
  }
  
  // Анимационный цикл
  animate() {
    if (this.state.isPaused) return;
    
    // Обновляем фазу анимации
    this.animationPhase += 0.05;
    
    // Обновляем анимацию костей
    for (let i = 0; i < this.diceAnimations.length; i++) {
      if (!this.state.isSpinning) {
        // Небольшие колебания для неактивного состояния
        this.diceAnimations[i].rotation += Math.sin(this.animationPhase + i) * 0.5;
        this.diceAnimations[i].y = Math.sin(this.animationPhase + i) * 5;
      }
    }
    
    // Рендерим игру
    this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
    
    // Запрашиваем следующий кадр
    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animate();
    });
  }
  
  // Бросок костей
  rollDice(callback) {
    // Случайные значения для анимации
    for (let i = 0; i < this.diceAnimations.length; i++) {
      this.diceAnimations[i].rotation = Math.random() * 720 - 360;
      this.diceAnimations[i].x = (Math.random() - 0.5) * 200;
      this.diceAnimations[i].y = (Math.random() - 0.5) * 200;
      this.diceAnimations[i].scale = 0.5 + Math.random() * 1;
    }
    
    // Задержка для анимации
    setTimeout(() => {
      // Генерируем новые значения костей
      this.diceValues = [];
      for (let i = 0; i < this.config.numDice; i++) {
        this.diceValues.push(Math.floor(Math.random() * 6) + 1);
      }
      
      // Сбрасываем анимационные параметры
      for (let i = 0; i < this.diceAnimations.length; i++) {
        this.diceAnimations[i].rotation = 0;
        this.diceAnimations[i].x = 0;
        this.diceAnimations[i].y = 0;
        this.diceAnimations[i].scale = 1;
      }
      
      // Проверяем выигрыш
      const result = this.checkWin();
      
      // Возвращаем результат
      callback(result);
    }, 1500);
  }
  
  // Проверка выигрыша
  checkWin() {
    // Двойка (все кости одинаковые)
    const allSame = this.diceValues.every(val => val === this.diceValues[0]);
    
    // Сумма значений
    const sum = this.diceValues.reduce((acc, val) => acc + val, 0);
    
    // Определяем тип выигрыша
    let winType = null;
    
    if (allSame) {
      winType = 'double';
    } else if (sum === 7) {
      winType = 'sum7';
    } else if (sum === 11) {
      winType = 'sum11';
    }
    
    const isWin = winType !== null;
    
    return {
      isWin,
      winType,
      diceValues: [...this.diceValues],
      sum
    };
  }
  
  // Расчет выигрыша
  calculateWin(betAmount, riskLevel, result) {
    const riskMultipliers = {
      'low': 1.2,
      'medium': 2,
      'high': 3
    };
    
    if (!result.isWin || !result.winType) {
      return 0;
    }
    
    // Базовый выигрыш = множитель условия * ставка
    const baseMultiplier = this.config.winningConditions[result.winType];
    const baseWin = baseMultiplier * betAmount;
    
    // Применяем множитель риска
    return baseWin * (riskMultipliers[riskLevel] || riskMultipliers.medium);
  }
  
  // Рендеринг игры
  renderGame(ctx, width, height, state) {
    if (!ctx) return;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);
    
    // Рисуем фон
    ctx.fillStyle = '#1a5c1a'; // Зеленый фон для игрового стола
    ctx.fillRect(0, 0, width, height);
    
    // Центр экрана
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Рисуем заголовок
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.gameTitle, centerX, 50);
    
    // Рисуем информацию о ставке и балансе
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Ставка: ${state.betAmount} | Риск: ${state.riskLevel} | Баланс: ${state.balance}`, centerX, 90);
    
    // Масштабируем размер костей в зависимости от размера экрана
    const diceSize = Math.min(this.config.diceSize, width * 0.15, height * 0.15);
    
    // Рисуем кости
    const spacing = diceSize * 1.5;
    const startX = centerX - (spacing * (this.diceValues.length - 1)) / 2;
    
    for (let i = 0; i < this.diceValues.length; i++) {
      this.renderDie(
        ctx,
        startX + i * spacing + (this.diceAnimations[i]?.x || 0),
        centerY + (this.diceAnimations[i]?.y || 0),
        diceSize * (this.diceAnimations[i]?.scale || 1),
        this.diceValues[i],
        this.diceAnimations[i]?.rotation || 0,
        this.config.diceColors[i % this.config.diceColors.length]
      );
    }
    
    // Рисуем информацию о последнем результате
    if (state.lastResult) {
      ctx.font = '20px Arial';
      if (state.lastResult.isWin) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Выигрыш: ${state.lastResult.winAmount.toFixed(2)} (${state.lastResult.winType})`, centerX, height - 80);
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`Проигрыш: сумма = ${state.lastResult.sum}`, centerX, height - 80);
      }
    }
    
    // Рисуем инструкции
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Нажмите "Roll" для броска костей', centerX, height - 40);
    
    // Рисуем таблицу выигрышей
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Выигрыши:', 20, 150);
    ctx.fillText('• Дубль: x2', 20, 170);
    ctx.fillText('• Сумма 7: x1.5', 20, 190);
    ctx.fillText('• Сумма 11: x2.5', 20, 210);
  }
  
  // Рендеринг одной кости
  renderDie(ctx, x, y, size, value, rotation, color) {
    ctx.save();
    
    // Применяем трансформации
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    
    // Рисуем тело кости
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Скругленные углы
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
    
    // Рисуем точки
    ctx.fillStyle = '#FFFFFF';
    
    const dotSize = size * 0.12;
    
    switch (value) {
      case 1:
        this.drawDot(ctx, 0, 0, dotSize);
        break;
      case 2:
        this.drawDot(ctx, -size/4, -size/4, dotSize);
        this.drawDot(ctx, size/4, size/4, dotSize);
        break;
      case 3:
        this.drawDot(ctx, -size/4, -size/4, dotSize);
        this.drawDot(ctx, 0, 0, dotSize);
        this.drawDot(ctx, size/4, size/4, dotSize);
        break;
      case 4:
        this.drawDot(ctx, -size/4, -size/4, dotSize);
        this.drawDot(ctx, -size/4, size/4, dotSize);
        this.drawDot(ctx, size/4, -size/4, dotSize);
        this.drawDot(ctx, size/4, size/4, dotSize);
        break;
      case 5:
        this.drawDot(ctx, -size/4, -size/4, dotSize);
        this.drawDot(ctx, -size/4, size/4, dotSize);
        this.drawDot(ctx, 0, 0, dotSize);
        this.drawDot(ctx, size/4, -size/4, dotSize);
        this.drawDot(ctx, size/4, size/4, dotSize);
        break;
      case 6:
        this.drawDot(ctx, -size/4, -size/4, dotSize);
        this.drawDot(ctx, -size/4, 0, dotSize);
        this.drawDot(ctx, -size/4, size/4, dotSize);
        this.drawDot(ctx, size/4, -size/4, dotSize);
        this.drawDot(ctx, size/4, 0, dotSize);
        this.drawDot(ctx, size/4, size/4, dotSize);
        break;
    }
    
    ctx.restore();
  }
  
  // Рисование точки на кости
  drawDot(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Экспорт в глобальную область видимости
window.DiceGame = DiceGame;
```

## Часто задаваемые вопросы

### 1. Как мне создать новую игру с нуля?

Создайте новый класс JavaScript, который реализует интерфейс `IGame`. Используйте приведенные в этом руководстве шаблоны и примеры. Убедитесь, что ваша игра реализует все обязательные методы интерфейса.

### 2. Как обрабатывать ошибки в игре?

Используйте try-catch блоки для критических методов, особенно связанных с рендерингом и анимацией. Логируйте ошибки в консоль и, по возможности, продолжайте выполнение. Для асинхронных методов используйте Promise с соответствующей обработкой ошибок.

### 3. Как оптимизировать производительность игры?

- Минимизируйте создание объектов в игровом цикле
- Используйте кэширование для часто используемых объектов
- Оптимизируйте рендеринг, обновляя только изменившиеся части canvas
- Используйте `requestAnimationFrame` для анимации
- Проверяйте производительность с помощью браузерных инструментов разработчика

### 4. Как тестировать игру?

Создайте тестовую страницу HTML, которая загружает вашу игру и фреймворк:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Game Test</title>
  <style>
    #game-container {
      width: 800px;
      height: 600px;
      border: 1px solid #000;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  
  <script src="/api/interfaces/IGame.js"></script>
  <script src="/api/core/GameAPI.js"></script>
  <script src="/path/to/your/game.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const container = document.getElementById('game-container');
      const game = new YourGame();
      
      try {
        await game.initialize({ container });
        await game.start();
        
        // Тестирование событий
        game.addEventListener('win', (data) => {
          console.log('Win event:', data);
        });
        
        // Тестирование действий
        document.getElementById('spin-button').addEventListener('click', () => {
          game.performAction({ type: 'spin' });
        });
      } catch (error) {
        console.error('Game initialization error:', error);
      }
    });
  </script>
</body>
</html>
```

### 5. Как добавить поддержку мобильных устройств?

Используйте адаптивный дизайн, масштабируя элементы игры в зависимости от размера контейнера. Для сенсорных устройств добавьте обработчики touch-событий:

```javascript
// В методе initialize
if ('ontouchstart' in window) {
  canvas.addEventListener('touchstart', this.handleTouch.bind(this));
}

// Обработчик сенсорных событий
handleTouch(event) {
  event.preventDefault();
  
  const touch = event.touches[0];
  const rect = this.canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // Обработка тача в игре
  this.processTouchAt(x, y);
}
```

### 6. Как интегрировать звуки в игру?

Создайте простой аудио-менеджер для вашей игры:

```javascript
class AudioManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
  }
  
  load(soundId, url) {
    const audio = new Audio(url);
    this.sounds[soundId] = audio;
    return new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve;
      audio.onerror = reject;
    });
  }
  
  play(soundId) {
    if (!this.enabled || !this.sounds[soundId]) return;
    
    // Клонируем звук для возможности параллельного воспроизведения
    const sound = this.sounds[soundId].cloneNode();
    sound.volume = 0.7;
    sound.play();
  }
  
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// В конструкторе игры
this.audioManager = new AudioManager();

// В initialize
await this.audioManager.load('win', 'sounds/win.mp3');
await this.audioManager.load('spin', 'sounds/spin.mp3');
await this.audioManager.load('loss', 'sounds/loss.mp3');

// При событиях
this.audioManager.play('spin');
```

### 7. Как обеспечить совместимость с фреймворком?

- Убедитесь, что ваша игра реализует все методы интерфейса IGame
- Генерируйте все необходимые события
- Следуйте структуре аргументов и возвращаемых значений
- Тестируйте взаимодействие с фреймворком

---

Мы надеемся, что это руководство поможет вам в разработке новых игр для нашего фреймворка. Если у вас возникнут вопросы или потребуется дополнительная помощь, обращайтесь к команде разработки.

Успехов в создании увлекательных игр!