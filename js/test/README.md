# Модульный тестовый фреймворк

Современный тестовый фреймворк для игрового движка с изолированным окружением, защитой DOM и надежным восстановлением состояния.

## Особенности

- **Полная изоляция тестов** от основного UI
- **Защита DOM-структуры** от нежелательных изменений
- **Надежное восстановление состояния** после тестов
- **Высокая производительность** за счет оптимизации выполнения
- **Подробная отчетность** о результатах тестов
- **Совместимость** с существующими тестами

## Структура фреймворка

Фреймворк состоит из трех основных компонентов:

1. **TestEnvironment** (`js/test/TestEnvironment.js`) - создает изолированную среду для выполнения тестов
2. **TestRunner** (`js/test/TestRunner.js`) - управляет выполнением тестов и их жизненным циклом
3. **testFramework** (`js/testFramework.js`) - предоставляет API для работы с фреймворком

## Использование

### Запуск тестов через UI

Для запуска тестов через пользовательский интерфейс просто нажмите кнопку "Run Framework Tests" в панели настроек:

1. Откройте панель настроек, нажав на кнопку настроек в правом верхнем углу
2. В разделе "Development" нажмите на кнопку "Run Framework Tests"
3. Дождитесь завершения тестов и просмотрите результаты в тестовой панели

### Запуск тестов из консоли

Фреймворк предоставляет глобальную функцию для запуска тестов из консоли браузера:

```javascript
// Запустить все тесты
window.runFrameworkTests().then(results => {
  console.log('Test results:', results);
});

// Или с использованием API фреймворка
window.testFramework.runAllTests().then(results => {
  console.log('Test results:', results);
});
```

### Отмена выполнения тестов

Во время выполнения тестов появляется кнопка "Отменить тесты", которая позволяет прервать процесс тестирования и перезагрузить страницу для восстановления состояния.

## Добавление новых тестов

### Создание теста с нуля

Для создания нового теста используйте следующий шаблон:

```javascript
// Создать новый файл в директории js/test/
// Например: js/test/MyNewTest.js

/**
 * Тест для компонента MyComponent
 */
class MyComponentTest {
  constructor() {
    this.name = 'My Component Test';
    this.dependencies = []; // Зависимости от других тестов
  }

  /**
   * Запустить тест
   * @param {HTMLElement} container - Изолированный контейнер для теста
   * @returns {Promise<Object>} Результаты теста
   */
  async run(container) {
    // Создать тестовые элементы
    const testElement = document.createElement('div');
    testElement.id = 'test-element';
    container.appendChild(testElement);
    
    // Выполнить тестирование
    const results = {
      testPassed: true,
      // Другие результаты...
    };
    
    // Проверить результаты
    if (!results.testPassed) {
      throw new Error('Test failed');
    }
    
    return results;
  }
}

// Регистрация теста в фреймворке
if (window.testFramework && window.TestRunner) {
  window.TestRunner.prototype.registerTest('My Component', (container) => {
    const test = new MyComponentTest();
    return test.run(container);
  }, { 
    dependencies: [], 
    priority: 0 
  });
}
```

### Добавление теста через API

Можно добавить тест программно через API тестового запускателя:

```javascript
// Получить экземпляр TestRunner
const runner = window.testRunner;

// Зарегистрировать новый тест
runner.registerTest('My Component', async (container) => {
  // Логика теста
  return { success: true };
}, { 
  dependencies: ['Canvas Manager'], // Зависимости от других тестов
  priority: 10, // Приоритет (выше приоритет - раньше выполнение)
  timeout: 3000 // Таймаут в миллисекундах
});
```

## Интеграция с существующими тестами

Фреймворк автоматически адаптирует существующие тесты из файлов:

- `js/moduleLoadTest.js`
- `js/canvasTest.js`
- `js/uiTest.js`
- `js/inheritanceTest.js`
- `js/gameStateTest.js`

Никаких изменений в существующие тесты вносить не нужно. Фреймворк будет выполнять их в изолированной среде.

## Отладка тестов

Для отладки тестов можно использовать следующие методы:

### Захват состояния DOM

```javascript
// Создать снимок DOM перед тестом
const beforeSnapshot = window.testEnvironment.createDOMSnapshot();

// Выполнить тест...

// Создать снимок DOM после теста
const afterSnapshot = window.testEnvironment.createDOMSnapshot();

// Сравнить различия
const differences = window.testEnvironment.compareDOMSnapshots(beforeSnapshot, afterSnapshot);
console.log('DOM differences:', differences);
```

### Инспекция тестового контейнера

Для инспекции тестового контейнера во время выполнения теста:

```javascript
// Получить ссылку на изолированный контейнер
const container = document.getElementById('test-environment-container');

// Временно сделать контейнер видимым для отладки
container.style.position = 'fixed';
container.style.left = '0';
container.style.top = '0';
container.style.width = '100%';
container.style.height = '100%';
container.style.zIndex = '9999';
container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
container.style.visibility = 'visible';
container.style.pointerEvents = 'auto';

// Не забудьте вернуть контейнер в исходное состояние после отладки!
```

## Преимущества нового подхода

1. **Предотвращение побочных эффектов**: тесты не влияют на основной UI
2. **Стабильная работа попапов**: специальные механизмы защиты для меню и попапов
3. **Высокая производительность**: оптимизированное выполнение тестов
4. **Изоляция ресурсов**: каждый тест получает свой изолированный контейнер
5. **Надежное восстановление**: полное восстановление DOM после тестов
6. **Подробная отчетность**: детальная информация о результатах и ошибках
7. **Возможность отмены**: остановка тестов в любой момент

## Примеры использования

### Тестирование компонента с изолированными DOM элементами

```javascript
// Пример теста для компонента UI
runner.registerTest('UI Component', async (container) => {
  // Создать изолированные элементы для теста
  const button = document.createElement('button');
  button.id = 'test-button';
  button.textContent = 'Click me';
  container.appendChild(button);
  
  // Создать экземпляр компонента
  const component = new UIComponent(button);
  
  // Проверить работу компонента
  let clicked = false;
  component.onClick = () => {
    clicked = true;
  };
  
  // Симулировать клик
  button.click();
  
  // Проверить результат
  if (!clicked) {
    throw new Error('Button click event not handled');
  }
  
  return { clicked };
});
```

### Тестирование взаимодействия с канвасом

```javascript
// Пример теста для CanvasManager
runner.registerTest('Canvas Drawing', async (container) => {
  // Создать канвас для теста
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  container.appendChild(canvas);
  
  // Создать экземпляр CanvasManager
  const canvasManager = new CanvasManager({
    canvasId: canvas.id
  });
  
  // Тестировать рисование
  let drawCalled = false;
  canvasManager.drawWithCanvas2D((ctx) => {
    drawCalled = true;
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
  });
  
  // Проверить, был ли вызван метод рисования
  if (!drawCalled) {
    throw new Error('Draw method was not called');
  }
  
  return { success: true };
});
```

## Расширенные функции

### Сохранение состояния между тестами

Если необходимо сохранить состояние между тестами, используйте глобальную переменную для хранения данных:

```javascript
window.testState = window.testState || {};

// В первом тесте
runner.registerTest('First Test', async (container) => {
  // Выполнить тест...
  window.testState.firstResult = { value: 42 };
  return { success: true };
});

// Во втором тесте
runner.registerTest('Second Test', async (container) => {
  // Получить данные из первого теста
  const firstResult = window.testState.firstResult;
  // Использовать данные...
  return { success: true };
});
```