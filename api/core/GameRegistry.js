/**
 * GameRegistry.js
 * Реестр доступных игр и их метаданных.
 * Управляет регистрацией игр и доступом к ним.
 */

import ManifestLoader from '../services/ManifestLoader.js';

/**
 * Класс реестра игр
 */
class GameRegistry {
  /**
   * Создает экземпляр реестра игр
   */
  constructor() {
    this.games = new Map(); // Карта id игры -> манифест
    this.manifestPaths = new Map(); // Карта id игры -> путь к манифесту
    this.manifestLoader = new ManifestLoader();
  }
  
  /**
   * Инициализирует реестр
   * @return {Promise<void>} Промис, разрешающийся когда реестр инициализирован
   */
  async initialize() {
    console.log('GameRegistry: Initializing...');
    try {
      // В будущем здесь можно добавить загрузку предыдущих манифестов из localStorage
      console.log('GameRegistry: Initialized successfully');
    } catch (error) {
      console.error('GameRegistry: Error during initialization:', error);
      throw new Error(`Failed to initialize GameRegistry: ${error.message}`);
    }
  }
  
  /**
   * Регистрирует игру по манифесту
   * @param {Object} manifest - Объект манифеста
   * @param {string} manifestPath - Путь к файлу манифеста (для обновления)
   * @return {void}
   * @throws {Error} Если игра с таким ID уже зарегистрирована
   */
  registerGame(manifest, manifestPath) {
    if (!manifest || !manifest.id) {
      throw new Error('Invalid manifest: missing ID');
    }
    
    if (this.games.has(manifest.id)) {
      // Если игра уже зарегистрирована, проверяем версию
      const existingManifest = this.games.get(manifest.id);
      
      // Сравниваем версии семантически
      if (this.compareVersions(existingManifest.version, manifest.version) >= 0) {
        console.log(`GameRegistry: Game ${manifest.id} already registered with same or newer version`);
        return; // Не обновляем, если текущая версия выше или равна новой
      }
      
      console.log(`GameRegistry: Updating game ${manifest.id} from version ${existingManifest.version} to ${manifest.version}`);
    } else {
      console.log(`GameRegistry: Registering new game ${manifest.id} (${manifest.name}) version ${manifest.version}`);
    }
    
    // Сохраняем манифест и путь
    this.games.set(manifest.id, manifest);
    if (manifestPath) {
      this.manifestPaths.set(manifest.id, manifestPath);
    }
    
    // Вызываем событие регистрации игры (в будущем можно добавить систему событий)
    console.log(`GameRegistry: Game ${manifest.id} (${manifest.name}) registered successfully`);
  }
  
  /**
   * Регистрирует игры из массива манифестов
   * @param {Object[]} manifests - Массив объектов манифестов
   * @return {void}
   */
  registerGames(manifests) {
    console.log(`GameRegistry: Registering ${manifests.length} games`);
    
    for (const manifest of manifests) {
      try {
        this.registerGame(manifest);
      } catch (error) {
        console.error(`GameRegistry: Error registering game ${manifest?.id || 'unknown'}:`, error);
      }
    }
  }
  
  /**
   * Загружает и регистрирует игру из файла манифеста
   * @param {string} manifestPath - Путь к файлу манифеста
   * @param {boolean} [forceRefresh=false] - Принудительно загрузить манифест
   * @return {Promise<Object>} Промис, разрешающийся в объект манифеста
   */
  async registerGameFromManifest(manifestPath, forceRefresh = false) {
    try {
      const manifest = await this.manifestLoader.loadManifest(manifestPath, forceRefresh);
      this.registerGame(manifest, manifestPath);
      return manifest;
    } catch (error) {
      console.error(`GameRegistry: Error registering game from manifest ${manifestPath}:`, error);
      throw new Error(`Failed to register game from manifest: ${error.message}`);
    }
  }
  
  /**
   * Загружает и регистрирует игры из списка файлов манифестов
   * @param {string[]} manifestPaths - Массив путей к файлам манифестов
   * @param {boolean} [forceRefresh=false] - Принудительно загрузить манифесты
   * @return {Promise<Object[]>} Промис, разрешающийся в массив объектов манифестов
   */
  async registerGamesFromManifests(manifestPaths, forceRefresh = false) {
    try {
      console.log(`GameRegistry: Registering games from ${manifestPaths.length} manifests`);
      
      const manifests = await this.manifestLoader.loadManifests(manifestPaths, forceRefresh);
      
      for (let i = 0; i < manifests.length; i++) {
        try {
          this.registerGame(manifests[i], manifestPaths[i]);
        } catch (error) {
          console.error(`GameRegistry: Error registering game from manifest ${manifestPaths[i]}:`, error);
        }
      }
      
      return manifests;
    } catch (error) {
      console.error('GameRegistry: Error registering games from manifests:', error);
      throw new Error(`Failed to register games from manifests: ${error.message}`);
    }
  }
  
  /**
   * Отменяет регистрацию игры
   * @param {string} gameId - ID игры
   * @return {boolean} true, если игра была удалена
   */
  unregisterGame(gameId) {
    if (!this.games.has(gameId)) {
      console.warn(`GameRegistry: Game ${gameId} not found, cannot unregister`);
      return false;
    }
    
    const gameName = this.games.get(gameId).name;
    
    this.games.delete(gameId);
    this.manifestPaths.delete(gameId);
    
    console.log(`GameRegistry: Game ${gameId} (${gameName}) unregistered`);
    return true;
  }
  
  /**
   * Получает манифест игры по ID
   * @param {string} gameId - ID игры
   * @return {Object|null} Манифест игры или null, если игра не найдена
   */
  getGameManifest(gameId) {
    return this.games.get(gameId) || null;
  }
  
  /**
   * Получает список всех зарегистрированных игр
   * @param {Object} [filters={}] - Фильтры для игр
   * @param {string} [filters.category] - Фильтр по категории
   * @param {string} [filters.tag] - Фильтр по тегу
   * @param {string} [filters.query] - Поисковый запрос для названия/описания
   * @return {Object[]} Массив манифестов игр
   */
  getGames(filters = {}) {
    let games = Array.from(this.games.values());
    
    // Применяем фильтры, если есть
    if (filters.category) {
      games = games.filter(game => game.category === filters.category);
    }
    
    if (filters.tag) {
      games = games.filter(game => game.tags && game.tags.includes(filters.tag));
    }
    
    if (filters.query) {
      const query = filters.query.toLowerCase();
      games = games.filter(game => 
        game.name.toLowerCase().includes(query) || 
        (game.description && game.description.toLowerCase().includes(query))
      );
    }
    
    return games;
  }
  
  /**
   * Проверяет наличие обновлений для всех игр
   * @return {Promise<Object>} Промис, разрешающийся в объект с обновленными играми
   */
  async checkForUpdates() {
    try {
      const result = await this.manifestLoader.checkAllForUpdates();
      
      if (!result.hasUpdates) {
        console.log('GameRegistry: No updates found for any games');
        return { hasUpdates: false, updatedGames: [] };
      }
      
      console.log(`GameRegistry: Found updates for ${result.updatedManifests.length} games`);
      
      // Загружаем обновленные манифесты и обновляем игры
      const updatedManifests = await Promise.all(
        result.updatedManifests.map(path => this.registerGameFromManifest(path, true))
      );
      
      const updatedGames = updatedManifests.map(manifest => ({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version
      }));
      
      return {
        hasUpdates: true,
        updatedGames
      };
    } catch (error) {
      console.error('GameRegistry: Error checking for updates:', error);
      return { hasUpdates: false, updatedGames: [] };
    }
  }
  
  /**
   * Сравнивает две версии в формате semver
   * @param {string} version1 - Первая версия
   * @param {string} version2 - Вторая версия
   * @return {number} -1 если version1 < version2, 0 если version1 = version2, 1 если version1 > version2
   * @private
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    
    return 0; // Версии равны
  }
  
  /**
   * Сериализует состояние реестра для сохранения
   * @return {Object} Сериализованное состояние
   */
  serialize() {
    return {
      games: Array.from(this.games.entries()),
      manifestPaths: Array.from(this.manifestPaths.entries())
    };
  }
  
  /**
   * Восстанавливает состояние реестра из сериализованных данных
   * @param {Object} state - Сериализованное состояние
   * @return {void}
   */
  deserialize(state) {
    if (!state || !state.games) return;
    
    this.games = new Map(state.games);
    
    if (state.manifestPaths) {
      this.manifestPaths = new Map(state.manifestPaths);
    }
    
    console.log(`GameRegistry: Restored ${this.games.size} games from saved state`);
  }
}

export default GameRegistry;