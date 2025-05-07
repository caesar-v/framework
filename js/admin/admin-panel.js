/**
 * Admin Panel JS
 * Provides functionality for the game framework admin interface
 */

// We're using ES modules for better organization
import { loadGames, saveGameSettings, deleteGame, uploadGame } from './game-management.js';
import { loadAnalytics, generateCharts } from './analytics.js';
import { loadSettings, saveSettings, resetSettings } from './settings-manager.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI
  initTabNavigation();
  initModals();
  
  // Load initial data
  await initGamesTab();
  initSettingsTab();
  initAnalyticsTab();
  
  // Set up event listeners
  setupFormSubmissions();
  setupControlActions();
});

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
  const tabLinks = document.querySelectorAll('.admin-nav a[data-tab]');
  const tabs = document.querySelectorAll('.admin-tab');
  
  // Add click event listener to tab links
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs and links
      tabLinks.forEach(item => item.classList.remove('active'));
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Show the corresponding tab
      const tabId = link.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      // Update URL hash
      window.location.hash = tabId;
    });
  });
  
  // Check URL hash on page load
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    tabLinks.forEach(link => {
      if (link.getAttribute('data-tab') === hash) {
        link.click();
      }
    });
  }
}

/**
 * Initialize modals
 */
function initModals() {
  // Get all modals, close buttons, and cancel buttons
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.close-modal');
  const cancelButtons = document.querySelectorAll('.cancel-upload, .cancel-edit');
  
  // Add click event listeners to close buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      modals.forEach(modal => {
        modal.classList.remove('show');
      });
    });
  });
  
  // Add click event listeners to cancel buttons
  cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
      modals.forEach(modal => {
        modal.classList.remove('show');
      });
    });
  });
  
  // Close modal when clicking outside modal content
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // Show upload modal when clicking upload button
  const uploadButton = document.getElementById('upload-game');
  if (uploadButton) {
    uploadButton.addEventListener('click', () => {
      document.getElementById('upload-modal').classList.add('show');
    });
  }
  
  // Set up modal file input functionality
  const gameFileInput = document.getElementById('game-file');
  const gameManifestTextarea = document.getElementById('game-manifest');
  
  if (gameFileInput && gameManifestTextarea) {
    gameFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target.result;
            const json = JSON.parse(content);
            gameManifestTextarea.value = JSON.stringify(json, null, 2);
          } catch (error) {
            alert('Invalid JSON file. Please check the file format.');
            console.error('File parsing error:', error);
          }
        };
        reader.readAsText(file);
      }
    });
  }
}

/**
 * Initialize games tab with data
 */
async function initGamesTab() {
  try {
    // Load games data
    const games = await loadGames();
    
    // Render game cards
    renderGameCards(games);
    
    // Set up edit game functionality
    setupGameEdit();
  } catch (error) {
    console.error('Failed to initialize games tab:', error);
    showNotification('Error loading games', 'error');
  }
}

/**
 * Initialize settings tab with data
 */
function initSettingsTab() {
  try {
    // Load settings data
    const settings = loadSettings();
    
    // Populate settings form
    populateSettingsForm(settings);
  } catch (error) {
    console.error('Failed to initialize settings tab:', error);
    showNotification('Error loading settings', 'error');
  }
}

/**
 * Initialize analytics tab with data
 */
function initAnalyticsTab() {
  try {
    // Load analytics data
    const analyticsData = loadAnalytics();
    
    // Generate charts
    generateCharts(analyticsData);
    
    // Populate analytics table
    populateAnalyticsTable(analyticsData.gameStats);
    
    // Set up date range filter
    setupDateRangeFilter();
  } catch (error) {
    console.error('Failed to initialize analytics tab:', error);
    showNotification('Error loading analytics', 'error');
  }
}

/**
 * Render game cards in the game grid
 */
function renderGameCards(games) {
  const gameGrid = document.querySelector('.game-grid');
  const template = document.getElementById('game-card-template');
  
  // Clear existing game cards
  gameGrid.innerHTML = '';
  
  // Create and append game cards
  games.forEach(game => {
    const gameCard = template.content.cloneNode(true);
    
    // Set game card data attributes
    gameCard.querySelector('.game-card').dataset.gameId = game.id;
    
    // Set game card content
    gameCard.querySelector('.game-thumbnail img').src = game.thumbnail || 'assets/images/game-placeholder.png';
    gameCard.querySelector('.game-thumbnail img').alt = `${game.name} thumbnail`;
    
    // Set status indicator
    const statusIndicator = gameCard.querySelector('.game-status');
    if (!game.enabled) {
      statusIndicator.classList.add('disabled');
    }
    
    // Set game info
    gameCard.querySelector('.game-title').textContent = game.name;
    gameCard.querySelector('.game-description').textContent = game.description || 'No description available';
    gameCard.querySelector('.game-category').textContent = game.category || 'Uncategorized';
    gameCard.querySelector('.game-version').textContent = `v${game.version || '1.0.0'}`;
    
    // Set up edit button
    gameCard.querySelector('.edit-game').addEventListener('click', () => {
      showEditGameModal(game);
    });
    
    // Set up play button
    gameCard.querySelector('.play-game').addEventListener('click', () => {
      window.location.href = `index.html?game=${game.id}`;
    });
    
    // Append card to grid
    gameGrid.appendChild(gameCard);
  });
}

/**
 * Show edit game modal with game data
 */
function showEditGameModal(game) {
  // Get the modal and form
  const modal = document.getElementById('edit-game-modal');
  const form = document.getElementById('edit-game-form');
  
  // Populate form fields
  document.getElementById('edit-game-id').value = game.id;
  document.getElementById('edit-game-name').value = game.name;
  document.getElementById('edit-game-description').value = game.description || '';
  document.getElementById('edit-game-min-bet').value = game.config?.minBet || 1;
  document.getElementById('edit-game-max-bet').value = game.config?.maxBet || 500;
  document.getElementById('edit-game-default-bet').value = game.config?.defaultBet || 10;
  document.getElementById('edit-game-risk').value = game.config?.defaultRiskLevel || 'medium';
  document.getElementById('edit-game-enabled').checked = game.enabled !== false;
  
  // Show the modal
  modal.classList.add('show');
}

/**
 * Set up game edit functionality
 */
function setupGameEdit() {
  // Set up edit game form submission
  const editGameForm = document.getElementById('edit-game-form');
  if (editGameForm) {
    editGameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form data
      const gameId = document.getElementById('edit-game-id').value;
      const name = document.getElementById('edit-game-name').value;
      const description = document.getElementById('edit-game-description').value;
      const minBet = parseInt(document.getElementById('edit-game-min-bet').value);
      const maxBet = parseInt(document.getElementById('edit-game-max-bet').value);
      const defaultBet = parseInt(document.getElementById('edit-game-default-bet').value);
      const defaultRiskLevel = document.getElementById('edit-game-risk').value;
      const enabled = document.getElementById('edit-game-enabled').checked;
      
      // Validate form data
      if (maxBet < minBet) {
        alert('Maximum bet cannot be less than minimum bet.');
        return;
      }
      
      if (defaultBet < minBet || defaultBet > maxBet) {
        alert('Default bet must be between minimum and maximum bet.');
        return;
      }
      
      // Create game config object
      const gameConfig = {
        id: gameId,
        name,
        description,
        enabled,
        config: {
          minBet,
          maxBet,
          defaultBet,
          defaultRiskLevel
        }
      };
      
      try {
        // Save game settings
        await saveGameSettings(gameConfig);
        
        // Close modal
        document.getElementById('edit-game-modal').classList.remove('show');
        
        // Refresh games list
        await initGamesTab();
        
        // Show success notification
        showNotification('Game settings saved successfully', 'success');
      } catch (error) {
        console.error('Failed to save game settings:', error);
        showNotification('Error saving game settings', 'error');
      }
    });
  }
  
  // Set up delete game button
  const deleteGameButton = document.getElementById('delete-game');
  if (deleteGameButton) {
    deleteGameButton.addEventListener('click', async () => {
      // Get game ID
      const gameId = document.getElementById('edit-game-id').value;
      
      // Confirm deletion
      if (confirm(`Are you sure you want to delete the game "${document.getElementById('edit-game-name').value}"? This action cannot be undone.`)) {
        try {
          // Delete game
          await deleteGame(gameId);
          
          // Close modal
          document.getElementById('edit-game-modal').classList.remove('show');
          
          // Refresh games list
          await initGamesTab();
          
          // Show success notification
          showNotification('Game deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete game:', error);
          showNotification('Error deleting game', 'error');
        }
      }
    });
  }
}

/**
 * Populate settings form with data
 */
function populateSettingsForm(settings) {
  // Set form field values
  document.getElementById('default-currency').value = settings.defaultCurrency || '$';
  document.getElementById('default-balance').value = settings.defaultBalance || 1000;
  document.getElementById('default-theme').value = settings.defaultTheme || 'default';
  document.getElementById('server-restart-detection').checked = settings.serverRestartDetection !== false;
  document.getElementById('auto-recovery').checked = settings.autoRecovery !== false;
  document.getElementById('debug-mode').checked = settings.debugMode === true;
}

/**
 * Populate analytics table with data
 */
function populateAnalyticsTable(gameStats) {
  const tableBody = document.querySelector('#game-stats tbody');
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Create and append rows
  gameStats.forEach(stat => {
    const row = document.createElement('tr');
    
    // Create and populate cells
    row.innerHTML = `
      <td>${stat.name}</td>
      <td>${stat.sessions}</td>
      <td>${stat.totalBets}</td>
      <td>${(stat.winRate * 100).toFixed(1)}%</td>
      <td>${stat.avgBet.toFixed(2)}</td>
      <td>${stat.totalWon.toFixed(2)}</td>
      <td>${stat.totalLost.toFixed(2)}</td>
    `;
    
    // Append row to table
    tableBody.appendChild(row);
  });
}

/**
 * Set up form submissions
 */
function setupFormSubmissions() {
  // Set up global settings form submission
  const settingsForm = document.getElementById('global-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form data
      const defaultCurrency = document.getElementById('default-currency').value;
      const defaultBalance = parseInt(document.getElementById('default-balance').value);
      const defaultTheme = document.getElementById('default-theme').value;
      const serverRestartDetection = document.getElementById('server-restart-detection').checked;
      const autoRecovery = document.getElementById('auto-recovery').checked;
      const debugMode = document.getElementById('debug-mode').checked;
      
      // Create settings object
      const settings = {
        defaultCurrency,
        defaultBalance,
        defaultTheme,
        serverRestartDetection,
        autoRecovery,
        debugMode
      };
      
      try {
        // Save settings
        await saveSettings(settings);
        
        // Show success notification
        showNotification('Settings saved successfully', 'success');
      } catch (error) {
        console.error('Failed to save settings:', error);
        showNotification('Error saving settings', 'error');
      }
    });
  }
  
  // Set up game upload form submission
  const uploadForm = document.getElementById('upload-game-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get manifest JSON
      const manifestJson = document.getElementById('game-manifest').value;
      
      try {
        // Parse manifest
        const manifest = JSON.parse(manifestJson);
        
        // Validate manifest
        if (!manifest.id || !manifest.name || !manifest.version) {
          throw new Error('Manifest must include id, name, and version properties.');
        }
        
        // Upload game
        await uploadGame(manifest);
        
        // Close modal
        document.getElementById('upload-modal').classList.remove('show');
        
        // Clear form
        document.getElementById('game-manifest').value = '';
        document.getElementById('game-file').value = '';
        
        // Refresh games list
        await initGamesTab();
        
        // Show success notification
        showNotification('Game uploaded successfully', 'success');
      } catch (error) {
        console.error('Failed to upload game:', error);
        showNotification(`Error uploading game: ${error.message}`, 'error');
      }
    });
  }
}

/**
 * Set up date range filter for analytics
 */
function setupDateRangeFilter() {
  const dateRangeSelect = document.getElementById('date-range');
  if (dateRangeSelect) {
    dateRangeSelect.addEventListener('change', async () => {
      try {
        // Get selected date range
        const dateRange = dateRangeSelect.value;
        
        // Load analytics data for selected range
        const analyticsData = loadAnalytics(dateRange);
        
        // Update charts
        generateCharts(analyticsData);
        
        // Update table
        populateAnalyticsTable(analyticsData.gameStats);
      } catch (error) {
        console.error('Failed to update analytics:', error);
        showNotification('Error updating analytics', 'error');
      }
    });
  }
}

/**
 * Set up control actions
 */
function setupControlActions() {
  // Refresh games button
  const refreshButton = document.getElementById('refresh-games');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      try {
        await initGamesTab();
        showNotification('Games refreshed successfully', 'success');
      } catch (error) {
        console.error('Failed to refresh games:', error);
        showNotification('Error refreshing games', 'error');
      }
    });
  }
  
  // Reset settings button
  const resetButton = document.getElementById('reset-settings');
  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      // Confirm reset
      if (confirm('Are you sure you want to reset all settings to their default values?')) {
        try {
          // Reset settings
          await resetSettings();
          
          // Reload settings
          const settings = loadSettings();
          populateSettingsForm(settings);
          
          // Show success notification
          showNotification('Settings reset successfully', 'success');
        } catch (error) {
          console.error('Failed to reset settings:', error);
          showNotification('Error resetting settings', 'error');
        }
      }
    });
  }
  
  // Export data button
  const exportButton = document.getElementById('export-data');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      try {
        // Get selected date range
        const dateRange = document.getElementById('date-range').value;
        
        // Load analytics data for selected range
        const analyticsData = loadAnalytics(dateRange);
        
        // Create export data
        const exportData = {
          date: new Date().toISOString(),
          range: dateRange,
          data: analyticsData
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create download link
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonData);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `game-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        // Show success notification
        showNotification('Analytics data exported successfully', 'success');
      } catch (error) {
        console.error('Failed to export analytics data:', error);
        showNotification('Error exporting analytics data', 'error');
      }
    });
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Check if notification container exists
  let container = document.querySelector('.notification-container');
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Style notification
  notification.style.backgroundColor = type === 'error' ? '#e63757' : type === 'success' ? '#00d97e' : '#2c7be5';
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.marginBottom = '10px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 4px rgba(18, 38, 63, 0.1)';
  notification.style.display = 'flex';
  notification.style.justifyContent = 'space-between';
  notification.style.alignItems = 'center';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(40px)';
  notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  // Add close button functionality
  const closeButton = notification.querySelector('.notification-close');
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '1.25rem';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginLeft = '10px';
  
  closeButton.addEventListener('click', () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(40px)';
    
    // Remove notification after animation
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Add notification to container
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    if (notification.isConnected) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(40px)';
      
      // Remove notification after animation
      setTimeout(() => {
        if (notification.isConnected) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}