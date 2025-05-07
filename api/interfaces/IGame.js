/**
 * IGame.js
 * Определяет интерфейс, который должны реализовывать все игры в новой архитектуре.
 * Этот интерфейс обеспечивает стандартизированный способ взаимодействия с играми.
 */

/**
 * @interface IGame
 * Интерфейс, определяющий стандартные методы для всех игр.
 * Все игры должны реализовывать этот интерфейс для корректной работы с GameAPI.
 */
class IGame {
  /**
   * Инициализирует игру с конфигурацией
   * @param {Object} config - Конфигурация игры
   * @param {HTMLElement} config.container - DOM-элемент контейнера для игры
   * @param {number} config.bet - Начальная ставка
   * @param {string} config.riskLevel - Уровень риска
   * @param {Object} config.theme - Настройки темы
   * @param {Object} config.layout - Настройки макета
   * @param {Object} config.custom - Пользовательские настройки игры
   * @return {Promise<void>} Промис, который разрешается, когда игра полностью инициализирована
   */
  async initialize(config) {
    throw new Error('Method initialize() must be implemented');
  }
  
  /**
   * Запускает игру после инициализации
   * @return {Promise<void>} Промис, разрешающийся, когда игра запущена
   */
  async start() {
    throw new Error('Method start() must be implemented');
  }
  
  /**
   * Приостанавливает игру
   * @return {void}
   */
  pause() {
    throw new Error('Method pause() must be implemented');
  }
  
  /**
   * Возобновляет игру после приостановки
   * @return {void}
   */
  resume() {
    throw new Error('Method resume() must be implemented');
  }
  
  /**
   * Останавливает и выгружает игру, освобождая ресурсы
   * @return {Promise<void>} Промис, разрешающийся, когда игра полностью выгружена
   */
  async destroy() {
    throw new Error('Method destroy() must be implemented');
  }
  
  /**
   * Выполняет игровое действие (например, спин)
   * @param {Object} params - Параметры действия
   * @param {string} params.type - Тип действия (например, 'spin', 'bet', 'double')
   * @param {Object} params.data - Дополнительные данные для действия
   * @return {Promise<Object>} Результат действия
   */
  async performAction(params) {
    throw new Error('Method performAction() must be implemented');
  }
  
  /**
   * Обрабатывает изменение размера контейнера
   * @param {number} width - Новая ширина
   * @param {number} height - Новая высота
   * @return {void}
   */
  resize(width, height) {
    throw new Error('Method resize() must be implemented');
  }
  
  /**
   * Обновляет настройки игры
   * @param {Object} settings - Новые настройки
   * @return {void}
   */
  updateSettings(settings) {
    throw new Error('Method updateSettings() must be implemented');
  }
  
  /**
   * Рассчитывает возможный выигрыш на основе ставки и уровня риска
   * @param {number} betAmount - Размер ставки
   * @param {string} riskLevel - Уровень риска
   * @return {number} Расчетный потенциальный выигрыш
   */
  calculatePotentialWin(betAmount, riskLevel) {
    throw new Error('Method calculatePotentialWin() must be implemented');
  }
  
  /**
   * Получает текущее состояние игры для сохранения
   * @return {Object} Состояние игры
   */
  getState() {
    throw new Error('Method getState() must be implemented');
  }
  
  /**
   * Восстанавливает игру из сохраненного состояния
   * @param {Object} state - Сохраненное состояние
   * @return {void}
   */
  setState(state) {
    throw new Error('Method setState() must be implemented');
  }
  
  /**
   * Получает информацию об игре
   * @return {Object} Информация об игре (ID, название, версия и т.д.)
   */
  getInfo() {
    throw new Error('Method getInfo() must be implemented');
  }
  
  /**
   * Проверяет, поддерживает ли игра определенную функцию
   * @param {string} featureName - Название функции
   * @return {boolean} true, если функция поддерживается
   */
  supportsFeature(featureName) {
    throw new Error('Method supportsFeature() must be implemented');
  }
  
  /**
   * Получает все события, на которые можно подписаться
   * @return {string[]} Список названий событий
   */
  getAvailableEvents() {
    throw new Error('Method getAvailableEvents() must be implemented');
  }
  
  /**
   * Добавляет обработчик события
   * @param {string} eventName - Название события
   * @param {Function} handler - Функция-обработчик
   * @return {void}
   */
  addEventListener(eventName, handler) {
    throw new Error('Method addEventListener() must be implemented');
  }
  
  /**
   * Удаляет обработчик события
   * @param {string} eventName - Название события
   * @param {Function} handler - Функция-обработчик
   * @return {void}
   */
  removeEventListener(eventName, handler) {
    throw new Error('Method removeEventListener() must be implemented');
  }
}

export default IGame;