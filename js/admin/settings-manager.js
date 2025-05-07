/**
 * Settings Manager Module
 * Handles loading, saving, and resetting framework settings
 */

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'gameFramework_settings';

// Default settings
const DEFAULT_SETTINGS = {
  defaultCurrency: '$',
  defaultBalance: 1000,
  defaultTheme: 'default',
  serverRestartDetection: true,
  autoRecovery: true,
  debugMode: false
};

/**
 * Load settings from storage
 * @returns {Object} Settings object
 */
export function loadSettings() {
  try {
    // Try to get settings from GameAPI if available
    if (window.gameAPI && window.gameAPI.getSettings) {
      return window.gameAPI.getSettings();
    }
    
    // Fall back to loading from localStorage
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    
    // If no settings found, return defaults
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error loading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to storage
 * @param {Object} settings Settings object to save
 * @returns {Promise<void>} Promise that resolves when settings are saved
 */
export async function saveSettings(settings) {
  try {
    // Validate settings
    validateSettings(settings);
    
    // Try to save settings using GameAPI if available
    if (window.gameAPI && window.gameAPI.saveSettings) {
      await window.gameAPI.saveSettings(settings);
      return;
    }
    
    // Fall back to saving in localStorage
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    
    // Apply settings to the framework
    applySettings(settings);
    
    console.log('Settings saved successfully:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 * @returns {Promise<void>} Promise that resolves when settings are reset
 */
export async function resetSettings() {
  try {
    // Try to reset settings using GameAPI if available
    if (window.gameAPI && window.gameAPI.resetSettings) {
      await window.gameAPI.resetSettings();
      return;
    }
    
    // Fall back to saving defaults in localStorage
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    
    // Apply default settings to the framework
    applySettings(DEFAULT_SETTINGS);
    
    console.log('Settings reset to defaults');
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

/**
 * Validate settings object
 * @param {Object} settings Settings object to validate
 * @throws {Error} If settings are invalid
 */
function validateSettings(settings) {
  // Validate currency
  if (!settings.defaultCurrency || typeof settings.defaultCurrency !== 'string') {
    throw new Error('Invalid currency setting');
  }
  
  // Validate balance
  if (isNaN(settings.defaultBalance) || settings.defaultBalance < 0) {
    throw new Error('Invalid balance setting - must be a non-negative number');
  }
  
  // Validate theme
  const validThemes = ['default', 'classic', 'neon', 'pirate'];
  if (!validThemes.includes(settings.defaultTheme)) {
    throw new Error(`Invalid theme setting - must be one of: ${validThemes.join(', ')}`);
  }
  
  // Validate boolean settings
  if (typeof settings.serverRestartDetection !== 'boolean') {
    throw new Error('Invalid server restart detection setting - must be a boolean');
  }
  
  if (typeof settings.autoRecovery !== 'boolean') {
    throw new Error('Invalid auto recovery setting - must be a boolean');
  }
  
  if (typeof settings.debugMode !== 'boolean') {
    throw new Error('Invalid debug mode setting - must be a boolean');
  }
}

/**
 * Apply settings to the framework
 * @param {Object} settings Settings to apply
 */
function applySettings(settings) {
  // Apply settings to GameAPI if available
  if (window.gameAPI) {
    // Set debug mode
    if (window.gameAPI.setDebugMode) {
      window.gameAPI.setDebugMode(settings.debugMode);
    }
    
    // Set restart detection
    if (window.gameAPI.setServerRestartDetection) {
      window.gameAPI.setServerRestartDetection(settings.serverRestartDetection);
    }
    
    // Set auto recovery
    if (window.gameAPI.setAutoRecovery) {
      window.gameAPI.setAutoRecovery(settings.autoRecovery);
    }
    
    // Set currency
    if (window.gameAPI.setCurrency) {
      window.gameAPI.setCurrency(settings.defaultCurrency);
    }
    
    // Set default balance
    if (window.gameAPI.setDefaultBalance) {
      window.gameAPI.setDefaultBalance(settings.defaultBalance);
    }
    
    // Set theme
    if (window.gameAPI.setTheme) {
      window.gameAPI.setTheme(settings.defaultTheme);
    }
  }
  
  // Apply settings to legacy framework components
  
  // Set debug mode in debug manager
  if (window.debugManager && typeof window.debugManager.setDebugMode === 'function') {
    window.debugManager.setDebugMode(settings.debugMode);
  }
  
  // Set theme
  const themeLink = document.querySelector('link[data-theme]');
  if (themeLink) {
    const themeName = settings.defaultTheme;
    themeLink.href = `css/themes/${themeName}.css`;
    document.body.setAttribute('data-theme', themeName);
  }
  
  // Set currency and balance in game framework
  if (window.gameFramework) {
    if (window.gameFramework.setCurrency) {
      window.gameFramework.setCurrency(settings.defaultCurrency);
    }
    
    if (window.gameFramework.setDefaultBalance) {
      window.gameFramework.setDefaultBalance(settings.defaultBalance);
    }
  }
  
  // Set server restart detection in game initializer
  if (window.gameInitializer) {
    window.gameInitializer.serverRestartDetection = settings.serverRestartDetection;
  }
}