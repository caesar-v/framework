# Документация интерфейса IGame

## Содержание
- [Введение](#введение)
- [Основная структура интерфейса](#основная-структура-интерфейса)
- [Методы жизненного цикла](#методы-жизненного-цикла)
  - [initialize](#initialize)
  - [start](#start)
  - [pause](#pause)
  - [resume](#resume)
  - [destroy](#destroy)
- [Игровые действия и управление](#игровые-действия-и-управление)
  - [performAction](#performaction)
  - [updateSettings](#updatesettings)
  - [resize](#resize)
- [Работа с состоянием](#работа-с-состоянием)
  - [getState](#getstate)
  - [setState](#setstate)
- [Информационные методы](#информационные-методы)
  - [getInfo](#getinfo)
  - [supportsFeature](#supportsfeature)
  - [calculatePotentialWin](#calculatepotentialwin)
- [Система событий](#система-событий)
  - [addEventListener](#addeventlistener)
  - [removeEventListener](#removeeventlistener)
  - [getAvailableEvents](#getavailableevents)
- [Примеры использования](#примеры-использования)
- [Часто возникающие проблемы](#часто-возникающие-проблемы)

## Введение

Интерфейс `IGame` является стандартизированным контрактом между играми и фреймворком. Любая игра, которая реализует этот интерфейс, может быть интегрирована в фреймворк без дополнительных адаптеров.

Этот документ содержит подробное описание каждого метода интерфейса, примеры и рекомендации по их правильной реализации.

## Основная структура интерфейса

Интерфейс `IGame` определен в классе `IGame`, который содержит следующие методы:

```javascript
class IGame {
  async initialize(config) {}
  async start() {}
  pause() {}
  resume() {}
  async destroy() {}
  async performAction(params) {}
  resize(width, height) {}
  updateSettings(settings) {}
  calculatePotentialWin(betAmount, riskLevel) {}
  getState() {}
  setState(state) {}
  getInfo() {}
  supportsFeature(featureName) {}
  getAvailableEvents() {}
  addEventListener(eventName, handler) {}
  removeEventListener(eventName, handler) {}
}
```

## Методы жизненного цикла

### initialize

```javascript
async initialize(config)
```

Инициализирует игру с заданной конфигурацией.

**Параметры:**
- `config` (Object): Объект конфигурации, включающий:
  - `container` (HTMLElement): DOM-элемент, в котором будет отображаться игра
  - `bet` (number, опционально): Начальная ставка
  - `riskLevel` (string, опционально): Уровень риска ('low', 'medium', 'high')
  - `theme` (Object, опционально): Настройки темы оформления
  - `layout` (Object, опционально): Настройки макета
  - `custom` (Object, опционально): Пользовательские настройки для конкретной игры

**Возвращает:**
- `Promise<void>`: Промис, который разрешается, когда игра полностью инициализирована.

**Пример реализации:**
```javascript
async initialize(config) {
  // Сохраняем ссылку на контейнер
  this.container = config.container;
  
  // Применяем настройки
  if (config.bet) this.state.betAmount = config.bet;
  if (config.riskLevel) this.state.riskLevel = config.riskLevel;
  
  // Создаем canvas
  const canvas = document.createElement('canvas');
  canvas.width = this.container.clientWidth;
  canvas.height = this.container.clientHeight;
  this.container.appendChild(canvas);
  
  // Сохраняем размеры и контекст
  this.canvasWidth = canvas.width;
  this.canvasHeight = canvas.height;
  this.ctx = canvas.getContext('2d');
  
  // Инициализируем игровые ресурсы
  await this.loadResources();
  
  // Устанавливаем обработчики событий
  this.setupEventListeners();
  
  // Обновляем состояние
  this.state.initialized = true;
  
  // Генерируем событие
  this.emit('initialized', { success: true });
  
  return Promise.resolve();
}
```

**Рекомендации:**
- Всегда проверяйте параметры конфигурации перед использованием
- Асинхронная загрузка ресурсов должна быть завершена до разрешения промиса
- Обработчик изменения размера контейнера должен быть установлен здесь
- Создание canvas и получение контекста рендеринга обычно происходит на этом этапе

### start

```javascript
async start()
```

Запускает игру после инициализации.

**Параметры:** Нет

**Возвращает:**
- `Promise<void>`: Промис, разрешающийся, когда игра запущена.

**Пример реализации:**
```javascript
async start() {
  if (!this.state.initialized) {
    return Promise.reject(new Error('Game not initialized'));
  }
  
  // Обновляем состояние
  this.state.isRunning = true;
  this.state.isPaused = false;
  
  // Запускаем анимационный цикл
  this.startAnimationLoop();
  
  // Генерируем событие
  this.emit('started', { success: true });
  
  return Promise.resolve();
}
```

**Рекомендации:**
- Проверяйте, что игра инициализирована перед запуском
- Запускайте игровые циклы и анимацию
- Устанавливайте флаги состояния запуска игры

### pause

```javascript
pause()
```

Приостанавливает игру.

**Параметры:** Нет

**Возвращает:** Нет

**Пример реализации:**
```javascript
pause() {
  if (!this.state.isRunning) {
    console.warn('Cannot pause a game that is not running');
    return;
  }
  
  this.state.isPaused = true;
  
  // Останавливаем анимацию
  this.stopAnimationLoop();
  
  // Генерируем событие
  this.emit('paused', { timestamp: Date.now() });
}
```

**Рекомендации:**
- Проверяйте, что игра запущена перед паузой
- Останавливайте все анимации и игровые циклы
- Сохраняйте текущее состояние для последующего восстановления

### resume

```javascript
resume()
```

Возобновляет игру после приостановки.

**Параметры:** Нет

**Возвращает:** Нет

**Пример реализации:**
```javascript
resume() {
  if (!this.state.isPaused) {
    console.warn('Cannot resume a game that is not paused');
    return;
  }
  
  this.state.isPaused = false;
  
  // Возобновляем анимацию
  this.startAnimationLoop();
  
  // Генерируем событие
  this.emit('resumed', { timestamp: Date.now() });
}
```

**Рекомендации:**
- Проверяйте, что игра находится на паузе перед возобновлением
- Восстанавливайте анимацию и игровые циклы
- Восстанавливайте интерактивность элементов игры

### destroy

```javascript
async destroy()
```

Останавливает и выгружает игру, освобождая ресурсы.

**Параметры:** Нет

**Возвращает:**
- `Promise<void>`: Промис, разрешающийся, когда игра полностью выгружена.

**Пример реализации:**
```javascript
async destroy() {
  // Останавливаем анимацию
  this.stopAnimationLoop();
  
  // Удаляем обработчики событий
  window.removeEventListener('resize', this.resizeHandler);
  
  // Освобождаем ресурсы
  this.unloadResources();
  
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
  
  // Генерируем событие
  this.emit('destroyed', { success: true });
  
  return Promise.resolve();
}
```

**Рекомендации:**
- Освобождайте все занятые ресурсы (DOM, canvas, аудио и т.д.)
- Отменяйте запросы анимации и таймеры
- Удаляйте все обработчики событий
- Удаляйте все элементы из DOM
- Очищайте ссылки на DOM-элементы

## Игровые действия и управление

### performAction

```javascript
async performAction(params)
```

Выполняет игровое действие (например, спин, установка ставки).

**Параметры:**
- `params` (Object): Параметры действия:
  - `type` (string): Тип действия (например, 'spin', 'bet', 'double')
  - `data` (Object, опционально): Дополнительные данные для действия

**Возвращает:**
- `Promise<Object>`: Результат действия.

**Пример реализации:**
```javascript
async performAction(params) {
  if (!this.state.isRunning || this.state.isPaused) {
    return Promise.reject(new Error('Game is not in a runnable state'));
  }
  
  const { type, data = {} } = params;
  
  switch (type) {
    case 'spin':
      // Реализация спина
      return this.handleSpin();
      
    case 'setBet':
      // Реализация установки ставки
      if (data.amount === undefined) {
        return Promise.reject(new Error('No bet amount provided'));
      }
      return this.handleSetBet(data.amount);
      
    default:
      return Promise.reject(new Error(`Unknown action type: ${type}`));
  }
}

// Вспомогательные методы
async handleSpin() {
  if (this.state.isSpinning) {
    return Promise.reject(new Error('Spin already in progress'));
  }
  
  return new Promise((resolve) => {
    // Установка состояния
    this.state.isSpinning = true;
    
    // Событие начала спина
    this.emit('spinStart', { timestamp: Date.now() });
    
    // Выполнение спина
    this.spin((result) => {
      // Расчет выигрыша
      const winAmount = result.isWin 
        ? this.calculateWin(this.state.betAmount, this.state.riskLevel, result) 
        : 0;
      
      // Обновление баланса
      if (result.isWin) {
        this.state.balance += winAmount;
        this.emit('win', { amount: winAmount, result });
      } else {
        this.state.balance -= this.state.betAmount;
        this.emit('loss', { amount: this.state.betAmount, result });
      }
      
      // Обновление состояния
      this.state.isSpinning = false;
      this.state.lastResult = { ...result, winAmount };
      
      // Событие окончания спина
      this.emit('spinEnd', { result, winAmount, balance: this.state.balance });
      
      // Разрешение промиса
      resolve({
        success: true,
        result,
        winAmount,
        balance: this.state.balance
      });
    });
  });
}

async handleSetBet(amount) {
  const betAmount = Number(amount);
  if (isNaN(betAmount) || betAmount <= 0) {
    return Promise.reject(new Error('Invalid bet amount'));
  }
  
  // Ограничение ставки максимальным значением
  this.state.betAmount = Math.min(betAmount, this.config.maxBet);
  
  // Событие изменения ставки
  this.emit('betChanged', { amount: this.state.betAmount });
  
  return Promise.resolve({
    success: true,
    bet: this.state.betAmount
  });
}
```

**Рекомендации:**
- Проверяйте, что игра запущена и не на паузе
- Обрабатывайте все поддерживаемые типы действий
- Выбрасывайте ошибки для неподдерживаемых действий
- Валидируйте входные данные
- Генерируйте соответствующие события (spinStart, spinEnd, win, loss и т.д.)

### updateSettings

```javascript
updateSettings(settings)
```

Обновляет настройки игры.

**Параметры:**
- `settings` (Object): Новые настройки игры

**Возвращает:** Нет

**Пример реализации:**
```javascript
updateSettings(settings) {
  // Обновляем конфигурацию
  if (settings.theme) this.config.theme = {...this.config.theme, ...settings.theme};
  if (settings.layout) this.config.layout = {...this.config.layout, ...settings.layout};
  
  // Обновляем игровые настройки
  if (settings.bet !== undefined) this.state.betAmount = settings.bet;
  if (settings.riskLevel !== undefined) this.state.riskLevel = settings.riskLevel;
  
  // Обновляем специфичные настройки игры
  if (settings.gameSpecificSetting !== undefined) {
    this.config.gameSpecificSetting = settings.gameSpecificSetting;
    this.updateGameElement();
  }
  
  // Перерисовываем игру
  if (this.ctx) {
    this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
  }
  
  // Генерируем событие
  this.emit('settingsUpdated', { settings });
}
```

**Рекомендации:**
- Обновляйте только те настройки, которые были переданы
- Проверяйте значения настроек перед применением
- Обрабатывайте изменения визуальных настроек через перерисовку
- Генерируйте событие обновления настроек

### resize

```javascript
resize(width, height)
```

Обрабатывает изменение размера контейнера.

**Параметры:**
- `width` (number): Новая ширина
- `height` (number): Новая высота

**Возвращает:** Нет

**Пример реализации:**
```javascript
resize(width, height) {
  if (!this.container) return;
  
  // Обновляем canvas
  const canvas = this.container.querySelector('canvas');
  if (canvas) {
    canvas.width = width;
    canvas.height = height;
  }
  
  // Сохраняем новые размеры
  this.canvasWidth = width;
  this.canvasHeight = height;
  
  // Пересчитываем позиции и размеры игровых элементов
  this.recalculateLayout();
  
  // Перерисовываем игру
  if (this.ctx) {
    this.renderGame(this.ctx, width, height, this.state);
  }
  
  // Генерируем событие
  this.emit('resize', { width, height });
}
```

**Рекомендации:**
- Обновляйте размеры canvas и сохраняйте новые значения
- Пересчитывайте позиции и размеры всех игровых элементов
- Адаптируйте размеры шрифтов и элементов интерфейса
- Избегайте жестко заданных размеров, используйте относительные значения

## Работа с состоянием

### getState

```javascript
getState()
```

Получает текущее состояние игры для сохранения.

**Параметры:** Нет

**Возвращает:**
- `Object`: Состояние игры, которое можно использовать для восстановления.

**Пример реализации:**
```javascript
getState() {
  return {
    // Основные параметры
    balance: this.state.balance,
    betAmount: this.state.betAmount,
    riskLevel: this.state.riskLevel,
    
    // Игровые элементы (с глубоким копированием)
    gameElements: JSON.parse(JSON.stringify(this.gameElements)),
    
    // Последний результат
    lastResult: this.state.lastResult ? {...this.state.lastResult} : null,
    
    // Дополнительные игровые данные
    additionalData: { ...this.state.additionalData }
  };
}
```

**Рекомендации:**
- Сохраняйте все важные аспекты состояния игры
- Используйте глубокое копирование для сложных объектов
- Включайте только сериализуемые данные (без ссылок на DOM, функций и т.д.)
- Структурируйте состояние для удобства восстановления

### setState

```javascript
setState(state)
```

Восстанавливает игру из сохраненного состояния.

**Параметры:**
- `state` (Object): Сохраненное состояние, полученное через getState()

**Возвращает:** Нет

**Пример реализации:**
```javascript
setState(state) {
  // Восстанавливаем основные параметры
  if (state.balance !== undefined) this.state.balance = state.balance;
  if (state.betAmount !== undefined) this.state.betAmount = state.betAmount;
  if (state.riskLevel !== undefined) this.state.riskLevel = state.riskLevel;
  if (state.lastResult !== undefined) this.state.lastResult = {...state.lastResult};
  
  // Восстанавливаем игровые элементы
  if (state.gameElements) {
    this.gameElements = JSON.parse(JSON.stringify(state.gameElements));
  }
  
  // Восстанавливаем дополнительные данные
  if (state.additionalData) {
    this.state.additionalData = {...state.additionalData};
  }
  
  // Перерисовываем игру
  if (this.ctx) {
    this.renderGame(this.ctx, this.canvasWidth, this.canvasHeight, this.state);
  }
  
  // Генерируем событие
  this.emit('stateRestored', { success: true });
}
```

**Рекомендации:**
- Проверяйте наличие каждого параметра перед восстановлением
- Используйте глубокое копирование для сложных объектов
- Перерисовывайте игру после восстановления состояния
- Генерируйте событие восстановления состояния

## Информационные методы

### getInfo

```javascript
getInfo()
```

Получает информацию об игре.

**Параметры:** Нет

**Возвращает:**
- `Object`: Информация об игре (ID, название, версия и т.д.).

**Пример реализации:**
```javascript
getInfo() {
  return {
    id: 'dice-game',
    name: this.config.gameTitle,
    version: '1.0.0',
    type: 'dice',
    features: ['roll', 'animations', 'risk_levels'],
    author: 'Game Framework',
    description: 'Simple dice game with multiple winning conditions',
    minBet: 1,
    maxBet: this.config.maxBet,
    defaultRiskLevel: 'medium',
    supportedRiskLevels: ['low', 'medium', 'high']
  };
}
```

**Рекомендации:**
- Включайте уникальный идентификатор игры
- Предоставляйте информацию о версии, авторе и типе
- Указывайте список поддерживаемых функций
- Добавляйте информацию о минимальной/максимальной ставке
- Включайте описание игры

### supportsFeature

```javascript
supportsFeature(featureName)
```

Проверяет, поддерживает ли игра определенную функцию.

**Параметры:**
- `featureName` (string): Название функции

**Возвращает:**
- `boolean`: true, если функция поддерживается.

**Пример реализации:**
```javascript
supportsFeature(featureName) {
  const supportedFeatures = [
    'roll',
    'animations',
    'risk_levels',
    'state_save',
    'state_restore',
    'responsive',
    'touch_control'
  ];
  
  return supportedFeatures.includes(featureName);
}
```

**Рекомендации:**
- Поддерживайте стандартные функции, такие как 'state_save', 'state_restore'
- Указывайте специфичные для вашей игры функции
- Возвращайте строго булево значение (true/false)

### calculatePotentialWin

```javascript
calculatePotentialWin(betAmount, riskLevel)
```

Рассчитывает возможный выигрыш на основе ставки и уровня риска.

**Параметры:**
- `betAmount` (number): Размер ставки
- `riskLevel` (string): Уровень риска ('low', 'medium', 'high')

**Возвращает:**
- `number`: Расчетный потенциальный выигрыш.

**Пример реализации:**
```javascript
calculatePotentialWin(betAmount, riskLevel) {
  const riskMultipliers = {
    'low': 1.5,
    'medium': 3,
    'high': 6
  };
  
  // Находим максимальный множитель выигрыша в игре
  const maxWinMultiplier = Math.max(
    ...Object.values(this.config.winningConditions)
  );
  
  // Применяем множитель риска
  const riskMultiplier = riskMultipliers[riskLevel] || riskMultipliers.medium;
  
  // Рассчитываем максимально возможный выигрыш
  return betAmount * maxWinMultiplier * riskMultiplier;
}
```

**Рекомендации:**
- Учитывайте все возможные комбинации выигрыша
- Адаптируйте расчет под правила вашей игры
- Проверяйте валидность входных параметров
- Возвращайте числовое значение, представляющее возможный выигрыш

## Система событий

### addEventListener

```javascript
addEventListener(eventName, handler)
```

Добавляет обработчик события.

**Параметры:**
- `eventName` (string): Название события
- `handler` (Function): Функция-обработчик

**Возвращает:** Нет

**Пример реализации:**
```javascript
addEventListener(eventName, handler) {
  if (typeof handler !== 'function') {
    console.error('Event handler must be a function');
    return;
  }
  
  // Инициализируем массив обработчиков для события, если он не существует
  if (!this.eventListeners) {
    this.eventListeners = {};
  }
  
  if (!this.eventListeners[eventName]) {
    this.eventListeners[eventName] = [];
  }
  
  // Добавляем обработчик в массив
  this.eventListeners[eventName].push(handler);
}
```

**Рекомендации:**
- Проверяйте, что обработчик является функцией
- Поддерживайте массив обработчиков для каждого события
- Убедитесь, что eventListeners инициализирован в конструкторе

### removeEventListener

```javascript
removeEventListener(eventName, handler)
```

Удаляет обработчик события.

**Параметры:**
- `eventName` (string): Название события
- `handler` (Function): Функция-обработчик для удаления

**Возвращает:** Нет

**Пример реализации:**
```javascript
removeEventListener(eventName, handler) {
  if (!this.eventListeners || !this.eventListeners[eventName]) {
    return;
  }
  
  // Фильтруем массив обработчиков, удаляя указанный
  this.eventListeners[eventName] = this.eventListeners[eventName].filter(
    h => h !== handler
  );
}
```

**Рекомендации:**
- Проверяйте наличие массива обработчиков для этого события
- Используйте filter для удаления конкретного обработчика
- Не выбрасывайте ошибку, если обработчик не найден

### getAvailableEvents

```javascript
getAvailableEvents()
```

Получает все события, на которые можно подписаться.

**Параметры:** Нет

**Возвращает:**
- `string[]`: Список названий событий.

**Пример реализации:**
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
    'stateRestored',
    'settingsUpdated',
    // Игровые события
    'gameSpecificEvent1',
    'gameSpecificEvent2'
  ];
}
```

**Рекомендации:**
- Включайте все стандартные события жизненного цикла
- Добавляйте специфичные для игры события
- Обеспечьте соответствие возвращаемого списка фактически генерируемым событиям

## Примеры использования

### Пример создания игры

```javascript
// Создание игры и инициализация
const game = new MyGame();
const container = document.getElementById('game-container');

// Настройка игры
await game.initialize({ 
  container,
  bet: 20,
  riskLevel: 'medium'
});

// Запуск игры
await game.start();

// Подписка на события
game.addEventListener('win', (data) => {
  console.log(`Выигрыш! Сумма: ${data.amount}`);
});

// Выполнение действия
const result = await game.performAction({ type: 'spin' });
console.log(`Результат: ${result.isWin ? 'Выигрыш' : 'Проигрыш'}`);

// Изменение ставки
await game.performAction({ 
  type: 'setBet', 
  data: { amount: 50 } 
});

// Приостановка и восстановление игры
game.pause();
// ...
game.resume();

// Сохранение и восстановление состояния
const state = game.getState();
localStorage.setItem('gameState', JSON.stringify(state));

// Позже...
const savedState = JSON.parse(localStorage.getItem('gameState'));
game.setState(savedState);

// Выгрузка игры
await game.destroy();
```

### Пример реализации системы событий

```javascript
// Вспомогательный метод для генерации событий
emit(eventName, data) {
  if (!this.eventListeners || !this.eventListeners[eventName]) {
    return;
  }
  
  // Вызываем все обработчики с данными
  this.eventListeners[eventName].forEach(handler => {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in event handler for ${eventName}:`, error);
    }
  });
}

// Использование в методах
async performAction(params) {
  if (params.type === 'spin') {
    // Генерируем событие начала спина
    this.emit('spinStart', { timestamp: Date.now() });
    
    // Игровая логика...
    
    // Генерируем событие окончания спина
    this.emit('spinEnd', { result, winAmount, balance: this.state.balance });
  }
}
```

## Часто возникающие проблемы

### Проблема: Не освобождаются ресурсы при уничтожении игры

**Решение:**
```javascript
async destroy() {
  // Отменяем анимационный фрейм
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
  
  // Останавливаем все таймеры
  if (this.timers) {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }
  
  // Останавливаем все интервалы
  if (this.intervals) {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
  
  // Удаляем обработчики событий
  window.removeEventListener('resize', this.resizeHandler);
  
  if (this.canvas) {
    this.canvas.removeEventListener('click', this.clickHandler);
    this.canvas.removeEventListener('touchstart', this.touchHandler);
  }
  
  // Останавливаем все аудио
  if (this.audio) {
    Object.values(this.audio).forEach(sound => {
      if (sound && typeof sound.pause === 'function') {
        sound.pause();
        sound.currentTime = 0;
      }
    });
  }
  
  // Очищаем контейнер
  if (this.container) {
    this.container.innerHTML = '';
  }
  
  // Очищаем ссылки
  this.container = null;
  this.canvas = null;
  this.ctx = null;
  
  // Генерируем событие
  this.emit('destroyed', { success: true });
  
  return Promise.resolve();
}
```

### Проблема: Игра не адаптируется к размеру контейнера

**Решение:**
```javascript
resize(width, height) {
  if (!this.container || !this.canvas) return;
  
  // Обновляем размеры canvas
  this.canvas.width = width;
  this.canvas.height = height;
  
  // Сохраняем новые размеры
  this.canvasWidth = width;
  this.canvasHeight = height;
  
  // Рассчитываем масштаб
  const baseWidth = 800; // Базовая ширина дизайна
  const baseHeight = 600; // Базовая высота дизайна
  
  // Вычисляем коэффициент масштабирования
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;
  this.scale = Math.min(scaleX, scaleY);
  
  // Центрирование
  this.offsetX = (width - baseWidth * this.scale) / 2;
  this.offsetY = (height - baseHeight * this.scale) / 2;
  
  // Перерисовываем игру
  this.renderGame();
  
  // Генерируем событие
  this.emit('resize', { width, height });
}

// Использование в рендеринге
renderGame() {
  if (!this.ctx) return;
  
  // Очищаем canvas
  this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  
  // Применяем масштабирование и центрирование
  this.ctx.save();
  this.ctx.translate(this.offsetX, this.offsetY);
  this.ctx.scale(this.scale, this.scale);
  
  // Рисуем игровые элементы в стандартном (800x600) пространстве
  this.drawBackground(0, 0, 800, 600);
  this.drawGameElements();
  
  // Восстанавливаем контекст
  this.ctx.restore();
}
```

### Проблема: Утечки памяти при длительной работе игры

**Решение:**
```javascript
constructor() {
  // ...
  
  // Кэширование обработчиков для возможности их удаления
  this.boundHandlers = {
    resize: this.resize.bind(this),
    click: this.handleClick.bind(this),
    touch: this.handleTouch.bind(this)
  };
  
  // Отслеживание таймеров
  this.timers = [];
  this.intervals = [];
}

// Использование таймеров с отслеживанием
safeSetTimeout(callback, delay) {
  const timerId = setTimeout(() => {
    // Удаляем ID из списка при срабатывании
    const index = this.timers.indexOf(timerId);
    if (index !== -1) {
      this.timers.splice(index, 1);
    }
    callback();
  }, delay);
  
  // Добавляем ID в список для отслеживания
  this.timers.push(timerId);
  return timerId;
}

// Использование интервалов с отслеживанием
safeSetInterval(callback, delay) {
  const intervalId = setInterval(callback, delay);
  this.intervals.push(intervalId);
  return intervalId;
}

// Установка обработчиков событий
initialize(config) {
  // ...
  
  // Используем сохраненные привязанные обработчики
  window.addEventListener('resize', this.boundHandlers.resize);
  
  if (this.canvas) {
    this.canvas.addEventListener('click', this.boundHandlers.click);
    this.canvas.addEventListener('touchstart', this.boundHandlers.touch);
  }
  
  // ...
}

// Удаление обработчиков
destroy() {
  // ...
  
  // Используем сохраненные привязанные обработчики
  window.removeEventListener('resize', this.boundHandlers.resize);
  
  if (this.canvas) {
    this.canvas.removeEventListener('click', this.boundHandlers.click);
    this.canvas.removeEventListener('touchstart', this.boundHandlers.touch);
  }
  
  // Очищаем все таймеры и интервалы
  this.timers.forEach(timerId => clearTimeout(timerId));
  this.intervals.forEach(intervalId => clearInterval(intervalId));
  
  // ...
}
```

---

Этот документ предоставляет подробное руководство по реализации интерфейса IGame. При разработке игры следуйте этим рекомендациям для обеспечения совместимости с фреймворком и стабильной работы игры.