/**
 * IGameManifest.js
 * Определяет интерфейс и структуру манифест-файла для игр.
 * Манифесты используются для регистрации и инициализации игр в фреймворке.
 */

/**
 * @typedef {Object} GameManifest
 * @property {string} id - Уникальный идентификатор игры
 * @property {string} version - Версия игры в формате semver
 * @property {string} name - Отображаемое название игры
 * @property {string} description - Описание игры
 * @property {string} author - Автор игры
 * @property {string} main - Путь к основному файлу игры
 * @property {string} thumbnail - Путь к миниатюре игры
 * @property {string} category - Категория игры (dice, card, slot и т.д.)
 * @property {string[]} tags - Теги для поиска и фильтрации
 * @property {string[]} dependencies - Зависимости (другие игры или модули)
 * @property {string[]} assets - Пути к ресурсам игры (изображениям, звукам и т.д.)
 * @property {Object} config - Конфигурация игры
 * @property {string} config.defaultRiskLevel - Уровень риска по умолчанию
 * @property {number} config.minBet - Минимальная ставка
 * @property {number} config.maxBet - Максимальная ставка
 * @property {number} config.defaultBet - Ставка по умолчанию
 */

/**
 * Схема валидации для манифест-файла
 */
const GameManifestSchema = {
  type: 'object',
  required: ['id', 'version', 'name', 'main'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      description: 'Уникальный идентификатор игры (только строчные буквы, цифры и дефисы)'
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Версия игры в формате semver (например, 1.0.0)'
    },
    name: {
      type: 'string',
      minLength: 1,
      description: 'Отображаемое название игры'
    },
    description: {
      type: 'string',
      description: 'Описание игры'
    },
    author: {
      type: 'string',
      description: 'Автор игры'
    },
    main: {
      type: 'string',
      description: 'Путь к основному файлу игры'
    },
    thumbnail: {
      type: 'string',
      description: 'Путь к миниатюре игры'
    },
    category: {
      type: 'string',
      enum: ['dice', 'card', 'slot', 'table', 'other'],
      description: 'Категория игры'
    },
    tags: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Теги для поиска и фильтрации'
    },
    dependencies: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Зависимости (другие игры или модули)'
    },
    assets: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Пути к ресурсам игры (изображениям, звукам и т.д.)'
    },
    config: {
      type: 'object',
      properties: {
        defaultRiskLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          default: 'medium',
          description: 'Уровень риска по умолчанию'
        },
        minBet: {
          type: 'number',
          minimum: 0,
          description: 'Минимальная ставка'
        },
        maxBet: {
          type: 'number',
          minimum: 1,
          description: 'Максимальная ставка'
        },
        defaultBet: {
          type: 'number',
          minimum: 0,
          description: 'Ставка по умолчанию'
        }
      }
    }
  }
};

// Экспортируем схему для использования в валидаторе
export { GameManifestSchema };