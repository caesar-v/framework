/**
 * ManifestLoader.js
 * Сервис для загрузки и валидации манифестов игр.
 */

import { GameManifestSchema } from '../interfaces/IGameManifest.js';

/**
 * Класс для загрузки и валидации манифестов игр
 */
class ManifestLoader {
  /**
   * Создает новый экземпляр загрузчика манифестов
   */
  constructor() {
    this.cache = new Map();
    this.lastModified = new Map();
  }
  
  /**
   * Загружает манифест из указанного пути
   * @param {string} manifestPath - Путь к файлу манифеста
   * @param {boolean} [forceRefresh=false] - Принудительно загрузить манифест, игнорируя кеш
   * @return {Promise<Object>} Промис, разрешающийся в объект манифеста
   * @throws {Error} Если файл манифеста не найден или имеет некорректный формат
   */
  async loadManifest(manifestPath, forceRefresh = false) {
    console.log(`ManifestLoader: Loading manifest from ${manifestPath}`);
    
    // Проверяем наличие в кеше, если не требуется принудительная загрузка
    if (!forceRefresh && this.cache.has(manifestPath)) {
      console.log(`ManifestLoader: Using cached manifest for ${manifestPath}`);
      return this.cache.get(manifestPath);
    }
    
    try {
      // Загружаем файл манифеста
      const response = await fetch(manifestPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load manifest from ${manifestPath}: ${response.status} ${response.statusText}`);
      }
      
      // Сохраняем время последней модификации
      const lastModified = response.headers.get('Last-Modified');
      if (lastModified) {
        this.lastModified.set(manifestPath, lastModified);
      }
      
      // Парсим JSON
      const manifest = await response.json();
      
      // Валидируем манифест
      this.validateManifest(manifest);
      
      // Добавляем в кеш
      this.cache.set(manifestPath, manifest);
      
      console.log(`ManifestLoader: Successfully loaded and validated manifest for ${manifest.name}`);
      return manifest;
    } catch (error) {
      console.error(`ManifestLoader: Error loading manifest from ${manifestPath}:`, error);
      throw new Error(`Failed to load or parse manifest: ${error.message}`);
    }
  }
  
  /**
   * Загружает несколько манифестов из списка путей
   * @param {string[]} manifestPaths - Массив путей к файлам манифестов
   * @param {boolean} [forceRefresh=false] - Принудительно загрузить манифесты, игнорируя кеш
   * @return {Promise<Object[]>} Промис, разрешающийся в массив объектов манифестов
   */
  async loadManifests(manifestPaths, forceRefresh = false) {
    console.log(`ManifestLoader: Loading ${manifestPaths.length} manifests`);
    
    try {
      // Загружаем все манифесты параллельно
      const manifests = await Promise.all(
        manifestPaths.map(path => this.loadManifest(path, forceRefresh).catch(error => {
          console.error(`ManifestLoader: Error loading manifest ${path}:`, error);
          return null; // Возвращаем null для некорректных манифестов
        }))
      );
      
      // Фильтруем null-значения (некорректные манифесты)
      const validManifests = manifests.filter(manifest => manifest !== null);
      
      console.log(`ManifestLoader: Successfully loaded ${validManifests.length} of ${manifestPaths.length} manifests`);
      return validManifests;
    } catch (error) {
      console.error('ManifestLoader: Error loading manifests:', error);
      throw new Error(`Failed to load manifests: ${error.message}`);
    }
  }
  
  /**
   * Проверяет, изменился ли манифест с момента последней загрузки
   * @param {string} manifestPath - Путь к файлу манифеста
   * @return {Promise<boolean>} Промис, разрешающийся в true, если манифест изменился
   */
  async checkForUpdates(manifestPath) {
    try {
      // Если манифест никогда не загружался, считаем, что он изменился
      if (!this.lastModified.has(manifestPath)) {
        return true;
      }
      
      // Получаем заголовки файла, чтобы проверить Last-Modified
      const response = await fetch(manifestPath, { method: 'HEAD' });
      
      if (!response.ok) {
        console.warn(`ManifestLoader: Failed to check for updates for ${manifestPath}`);
        return false;
      }
      
      const lastModified = response.headers.get('Last-Modified');
      
      // Если нет заголовка Last-Modified, считаем, что манифест не изменился
      if (!lastModified) {
        return false;
      }
      
      // Проверяем, изменилось ли время последней модификации
      const hasChanged = lastModified !== this.lastModified.get(manifestPath);
      
      if (hasChanged) {
        console.log(`ManifestLoader: Manifest ${manifestPath} has been modified`);
      }
      
      return hasChanged;
    } catch (error) {
      console.error(`ManifestLoader: Error checking for updates for ${manifestPath}:`, error);
      return false;
    }
  }
  
  /**
   * Проверяет наличие обновлений для всех загруженных манифестов
   * @return {Promise<Object>} Промис, разрешающийся в объект с путями обновленных манифестов
   */
  async checkAllForUpdates() {
    const manifestPaths = Array.from(this.cache.keys());
    const updatePromises = manifestPaths.map(async path => {
      const hasChanged = await this.checkForUpdates(path);
      return { path, hasChanged };
    });
    
    const results = await Promise.all(updatePromises);
    const updatedManifests = results.filter(result => result.hasChanged)
      .map(result => result.path);
    
    return {
      updatedManifests,
      hasUpdates: updatedManifests.length > 0
    };
  }
  
  /**
   * Валидирует объект манифеста на соответствие схеме
   * @param {Object} manifest - Объект манифеста
   * @throws {Error} Если манифест не соответствует схеме
   * @private
   */
  validateManifest(manifest) {
    // Базовая валидация
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be a non-null object');
    }
    
    // Проверка обязательных полей
    const requiredFields = ['id', 'version', 'name', 'main'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Проверка формата id (только латинские буквы, цифры и дефисы)
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error(`Invalid id format: ${manifest.id}. Should contain only lowercase letters, numbers, and hyphens.`);
    }
    
    // Проверка формата версии (semver)
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}. Should follow semantic versioning (e.g., 1.0.0).`);
    }
    
    // Проверка пути к основному файлу - разрешаем как файлы, так и классы
    if (typeof manifest.main !== 'string' || manifest.main.trim() === '') {
      throw new Error(`Invalid main file: ${manifest.main}. Should be a non-empty string.`);
    }
    
    // Проверка категории, если она указана
    if (manifest.category && !['dice', 'card', 'slot', 'table', 'other'].includes(manifest.category)) {
      throw new Error(`Invalid category: ${manifest.category}. Should be one of: dice, card, slot, table, other.`);
    }
    
    // Проверка конфигурации, если она указана
    if (manifest.config) {
      if (manifest.config.defaultRiskLevel && 
          !['low', 'medium', 'high'].includes(manifest.config.defaultRiskLevel)) {
        throw new Error(`Invalid defaultRiskLevel: ${manifest.config.defaultRiskLevel}. Should be one of: low, medium, high.`);
      }
      
      if (manifest.config.minBet !== undefined && 
          (typeof manifest.config.minBet !== 'number' || manifest.config.minBet < 0)) {
        throw new Error(`Invalid minBet: ${manifest.config.minBet}. Should be a non-negative number.`);
      }
      
      if (manifest.config.maxBet !== undefined && 
          (typeof manifest.config.maxBet !== 'number' || manifest.config.maxBet <= 0)) {
        throw new Error(`Invalid maxBet: ${manifest.config.maxBet}. Should be a positive number.`);
      }
      
      if (manifest.config.defaultBet !== undefined && 
          (typeof manifest.config.defaultBet !== 'number' || manifest.config.defaultBet < 0)) {
        throw new Error(`Invalid defaultBet: ${manifest.config.defaultBet}. Should be a non-negative number.`);
      }
    }
    
    // В будущем можно добавить дополнительные проверки для других полей
  }
  
  /**
   * Очищает кеш манифестов
   */
  clearCache() {
    this.cache.clear();
    this.lastModified.clear();
    console.log('ManifestLoader: Cache cleared');
  }
  
  /**
   * Удаляет манифест из кеша
   * @param {string} manifestPath - Путь к файлу манифеста
   */
  invalidateCache(manifestPath) {
    this.cache.delete(manifestPath);
    this.lastModified.delete(manifestPath);
    console.log(`ManifestLoader: Cache invalidated for ${manifestPath}`);
  }
}

export default ManifestLoader;