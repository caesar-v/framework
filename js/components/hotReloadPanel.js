/**
 * Hot Reload Panel Component
 * Provides UI for controlling hot-reload functionality and displaying status
 */

class HotReloadPanel {
  /**
   * Create a new hot reload panel
   * @param {Object} options - Configuration options
   * @param {Object} options.gameAPI - GameAPI instance
   * @param {boolean} options.minimized - Whether panel starts minimized
   * @param {boolean} options.showNotifications - Whether to show notifications
   */
  constructor(options = {}) {
    this.options = {
      minimized: false,
      showNotifications: true,
      notificationDuration: 3000, // ms
      ...options
    };
    
    this.gameAPI = this.options.gameAPI;
    this.hotReloadService = this.gameAPI?.services?.hotReloadService;
    this.panel = null;
    this.isMinimized = this.options.minimized;
    this.activeNotifications = new Set();
    this.notificationCounter = 0;
    
    // Create and initialize the UI
    this.createPanel();
    this.initEventListeners();
    
    console.log('HotReloadPanel: Initialized');
  }
  
  /**
   * Create the hot reload panel in the DOM
   * @private
   */
  createPanel() {
    // Create root element
    this.panel = document.createElement('div');
    this.panel.className = `hot-reload-panel${this.isMinimized ? ' minimized' : ''}`;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'hot-reload-header';
    header.addEventListener('click', () => this.toggleMinimize());
    
    // Create status indicator and title
    const title = document.createElement('div');
    title.className = 'hot-reload-title';
    
    const indicator = document.createElement('span');
    indicator.className = 'hot-reload-indicator';
    this.indicator = indicator;
    
    const titleText = document.createElement('span');
    titleText.textContent = 'Hot Reload';
    
    title.appendChild(indicator);
    title.appendChild(titleText);
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'hot-reload-actions';
    
    // Minimize/Maximize button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'hot-reload-action';
    toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click
      this.toggleMinimize();
    });
    this.toggleBtn = toggleBtn;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'hot-reload-action';
    closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click
      this.remove();
    });
    
    actions.appendChild(toggleBtn);
    actions.appendChild(closeBtn);
    
    // Add elements to header
    header.appendChild(title);
    header.appendChild(actions);
    
    // Create panel content
    const content = document.createElement('div');
    content.className = 'hot-reload-content';
    
    // Add toggle section
    const toggleSection = document.createElement('div');
    toggleSection.className = 'hot-reload-section';
    
    const enableToggle = document.createElement('div');
    enableToggle.className = 'hot-reload-toggle';
    
    const enableLabel = document.createElement('span');
    enableLabel.textContent = 'Enable Hot Reload';
    
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'hot-reload-toggle-switch';
    
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = this.hotReloadService?.options?.enabled || false;
    toggleInput.addEventListener('change', () => this.toggleHotReload(toggleInput.checked));
    this.toggleInput = toggleInput;
    
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'hot-reload-toggle-slider';
    
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);
    
    enableToggle.appendChild(enableLabel);
    enableToggle.appendChild(toggleSwitch);
    
    // Add status section
    const statusSection = document.createElement('div');
    statusSection.className = 'hot-reload-section';
    
    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Status';
    
    const statusInfo = document.createElement('div');
    statusInfo.className = 'hot-reload-info';
    
    // Create status items (monitoring status, WebSocket status, etc.)
    const monitoringStatus = this.createInfoItem('Monitoring', 'Inactive');
    this.monitoringStatus = monitoringStatus.valueElement;
    
    const wsStatus = this.createInfoItem('WebSocket', 'Disconnected');
    this.wsStatus = wsStatus.valueElement;
    
    const manifestCount = this.createInfoItem('Manifests', '0');
    this.manifestCount = manifestCount.valueElement;
    
    const reloadCount = this.createInfoItem('Reloads', '0');
    this.reloadCount = reloadCount.valueElement;
    
    statusInfo.appendChild(monitoringStatus.item);
    statusInfo.appendChild(wsStatus.item);
    statusInfo.appendChild(manifestCount.item);
    statusInfo.appendChild(reloadCount.item);
    
    statusSection.appendChild(statusTitle);
    statusSection.appendChild(statusInfo);
    
    // Add action buttons
    const actionsSection = document.createElement('div');
    actionsSection.className = 'hot-reload-section';
    
    const actionButtons = document.createElement('div');
    actionButtons.style.display = 'flex';
    actionButtons.style.gap = '8px';
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'hot-reload-btn';
    refreshBtn.textContent = 'Refresh Now';
    refreshBtn.addEventListener('click', () => this.manualRefresh());
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'hot-reload-btn';
    clearBtn.textContent = 'Clear Stats';
    clearBtn.addEventListener('click', () => this.clearStats());
    
    actionButtons.appendChild(refreshBtn);
    actionButtons.appendChild(clearBtn);
    
    actionsSection.appendChild(actionButtons);
    
    // Add recent changes section
    const changesSection = document.createElement('div');
    changesSection.className = 'hot-reload-section';
    
    const changesTitle = document.createElement('h3');
    changesTitle.textContent = 'Recent Changes';
    
    const changesContainer = document.createElement('div');
    changesContainer.className = 'hot-reload-changes';
    this.changesContainer = changesContainer;
    
    changesSection.appendChild(changesTitle);
    changesSection.appendChild(changesContainer);
    
    // Add sections to content
    content.appendChild(toggleSection);
    content.appendChild(statusSection);
    content.appendChild(actionsSection);
    content.appendChild(changesSection);
    
    // Combine elements
    toggleSection.appendChild(enableToggle);
    this.panel.appendChild(header);
    this.panel.appendChild(content);
    
    // Add to DOM
    document.body.appendChild(this.panel);
    
    // Update status
    this.updateStatus();
  }
  
  /**
   * Create info item for the status section
   * @param {string} label - Label text
   * @param {string} value - Initial value
   * @return {Object} Object containing item element and value element
   * @private
   */
  createInfoItem(label, value) {
    const item = document.createElement('div');
    item.className = 'hot-reload-info-item';
    
    const labelElement = document.createElement('span');
    labelElement.className = 'hot-reload-info-label';
    labelElement.textContent = label;
    
    const valueElement = document.createElement('span');
    valueElement.textContent = value;
    
    item.appendChild(labelElement);
    item.appendChild(valueElement);
    
    return { item, valueElement };
  }
  
  /**
   * Initialize event listeners for hot-reload service
   * @private
   */
  initEventListeners() {
    if (!this.hotReloadService) return;
    
    // Set up listeners for hot-reload events
    const listeners = [
      { event: 'manifestReloaded', handler: this.onManifestReloaded.bind(this) },
      { event: 'fileChanged', handler: this.onFileChanged.bind(this) },
      { event: 'gameReloaded', handler: this.onGameReloaded.bind(this) },
      { event: 'monitoringStarted', handler: this.onMonitoringStarted.bind(this) },
      { event: 'monitoringStopped', handler: this.onMonitoringStopped.bind(this) },
      { event: 'wsConnected', handler: this.onWebSocketConnected.bind(this) },
      { event: 'wsClosed', handler: this.onWebSocketClosed.bind(this) }
    ];
    
    // Add listeners to hot-reload service
    this.listeners = listeners.map(({ event, handler }) => {
      const listenerId = this.hotReloadService.addChangeListener(event, handler);
      return { event, listenerId };
    });
    
    // Set up interval to periodically update status
    this.statusInterval = setInterval(() => {
      this.updateStatus();
    }, 5000);
  }
  
  /**
   * Update the panel with current hot-reload status
   * @private
   */
  updateStatus() {
    if (!this.hotReloadService) return;
    
    const status = this.hotReloadService.getStatus();
    
    // Update status indicator
    if (status.monitoring) {
      this.indicator.className = 'hot-reload-indicator';
    } else if (status.enabled) {
      this.indicator.className = 'hot-reload-indicator loading';
    } else {
      this.indicator.className = 'hot-reload-indicator inactive';
    }
    
    // Update toggle
    this.toggleInput.checked = status.enabled;
    
    // Update status text
    this.monitoringStatus.textContent = status.monitoring ? 'Active' : 'Inactive';
    this.wsStatus.textContent = status.webSocketActive ? 'Connected' : 'Disconnected';
    this.manifestCount.textContent = status.manifestPaths.length.toString();
    this.reloadCount.textContent = status.stats.reloads.toString();
    
    // Update changes
    this.updateChangesDisplay(status.stats.changedFiles);
  }
  
  /**
   * Update the changes display
   * @param {Array} changes - Array of change entries
   * @private
   */
  updateChangesDisplay(changes) {
    if (!changes || !changes.length) {
      this.changesContainer.innerHTML = '<div style="color: #6272a4; padding: 8px 0;">No changes detected yet</div>';
      return;
    }
    
    // Sort changes by timestamp (newest first)
    const sortedChanges = [...changes].sort((a, b) => b.timestamp - a.timestamp);
    
    // Clear container
    this.changesContainer.innerHTML = '';
    
    // Add change items
    sortedChanges.forEach(change => {
      const item = document.createElement('div');
      item.className = 'hot-reload-change-item';
      
      const path = document.createElement('div');
      path.className = 'hot-reload-change-path';
      path.textContent = change.path;
      
      const time = document.createElement('div');
      time.className = 'hot-reload-change-time';
      time.textContent = this.formatTime(change.timestamp);
      
      item.appendChild(path);
      item.appendChild(time);
      
      this.changesContainer.appendChild(item);
    });
  }
  
  /**
   * Format a timestamp into a readable string
   * @param {number} timestamp - Timestamp in milliseconds
   * @return {string} Formatted time string
   * @private
   */
  formatTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
  
  /**
   * Toggle minimized state of the panel
   * @private
   */
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      this.panel.classList.add('minimized');
      this.toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    } else {
      this.panel.classList.remove('minimized');
      this.toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
    }
  }
  
  /**
   * Toggle hot-reload service on/off
   * @param {boolean} enabled - Whether to enable hot-reload
   * @private
   */
  toggleHotReload(enabled) {
    if (!this.hotReloadService) return;
    
    this.hotReloadService.setEnabled(enabled);
    
    // Show notification
    if (enabled) {
      this.showNotification('Hot Reload Enabled', 'File changes will be automatically detected and applied');
    } else {
      this.showNotification('Hot Reload Disabled', 'Automatic reloading is now turned off');
    }
    
    // Update status
    this.updateStatus();
  }
  
  /**
   * Manually refresh/reload the current game
   * @private
   */
  manualRefresh() {
    if (!this.hotReloadService || !this.gameAPI || !this.gameAPI.activeGame) return;
    
    // Get active game ID
    const gameId = this.gameAPI.getGameId(this.gameAPI.activeGame);
    if (!gameId) return;
    
    // Show loading indicator
    this.indicator.className = 'hot-reload-indicator loading';
    
    // Reload game
    this.gameAPI.loadGame(gameId, { forceReload: true, preserveState: true })
      .then(() => {
        this.showNotification('Game Reloaded', `Successfully reloaded game: ${gameId}`);
        this.updateStatus();
      })
      .catch(error => {
        console.error('Error during manual refresh:', error);
        this.showNotification('Reload Failed', 'Failed to reload the game. Check console for details.', 'error');
        this.updateStatus();
      });
  }
  
  /**
   * Clear hot-reload statistics
   * @private
   */
  clearStats() {
    if (!this.hotReloadService) return;
    
    this.hotReloadService.clearStats();
    this.showNotification('Stats Cleared', 'Hot-reload statistics have been reset');
    this.updateStatus();
  }
  
  /**
   * Remove the panel from the DOM
   * @public
   */
  remove() {
    // Clear interval
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    
    // Remove event listeners
    if (this.hotReloadService && this.listeners) {
      this.listeners.forEach(({ event, listenerId }) => {
        this.hotReloadService.removeChangeListener(event, listenerId);
      });
    }
    
    // Remove from DOM
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    // Remove active notifications
    this.activeNotifications.forEach(notificationId => {
      const notification = document.getElementById(`hot-reload-notification-${notificationId}`);
      if (notification) {
        notification.parentNode.removeChild(notification);
      }
    });
    
    console.log('HotReloadPanel: Removed');
  }
  
  /**
   * Show a notification popup
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} [type='info'] - Notification type (info, success, error)
   * @public
   */
  showNotification(title, message, type = 'info') {
    if (!this.options.showNotifications) return;
    
    // Generate unique ID for this notification
    const notificationId = ++this.notificationCounter;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'hot-reload-notification';
    notification.id = `hot-reload-notification-${notificationId}`;
    
    // Add indicator color based on type
    const indicator = document.createElement('div');
    indicator.className = 'hot-reload-notification-indicator';
    switch (type) {
      case 'error':
        indicator.style.backgroundColor = '#ff5555';
        break;
      case 'success':
        indicator.style.backgroundColor = '#50fa7b';
        break;
      default:
        indicator.style.backgroundColor = '#8be9fd';
    }
    
    // Create content
    const content = document.createElement('div');
    content.className = 'hot-reload-notification-content';
    
    const titleElement = document.createElement('div');
    titleElement.className = 'hot-reload-notification-title';
    titleElement.textContent = title;
    
    const messageElement = document.createElement('p');
    messageElement.className = 'hot-reload-notification-message';
    messageElement.textContent = message;
    
    content.appendChild(titleElement);
    content.appendChild(messageElement);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'hot-reload-notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      this.removeNotification(notificationId);
    });
    
    // Assemble notification
    notification.appendChild(indicator);
    notification.appendChild(content);
    notification.appendChild(closeButton);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Track this notification
    this.activeNotifications.add(notificationId);
    
    // Set auto-close timeout
    setTimeout(() => {
      this.removeNotification(notificationId);
    }, this.options.notificationDuration);
    
    return notificationId;
  }
  
  /**
   * Remove a notification by ID
   * @param {number} notificationId - Notification ID to remove
   * @private
   */
  removeNotification(notificationId) {
    const notification = document.getElementById(`hot-reload-notification-${notificationId}`);
    if (!notification) return;
    
    // Start slide-out animation
    notification.classList.add('slide-out');
    
    // Remove after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.activeNotifications.delete(notificationId);
    }, 300);
  }
  
  // Event handlers for hot-reload service events
  onManifestReloaded(data) {
    this.updateStatus();
    this.showNotification('Manifest Updated', `Game manifest updated: ${data.manifest.name}`);
  }
  
  onFileChanged(data) {
    this.updateStatus();
    // Extract filename from path for cleaner notification
    const filename = data.filePath.split('/').pop();
    this.showNotification('File Changed', `Detected changes in: ${filename}`);
  }
  
  onGameReloaded(data) {
    this.updateStatus();
    this.showNotification('Game Reloaded', `Successfully reloaded game: ${data.gameId}`, 'success');
  }
  
  onMonitoringStarted() {
    this.updateStatus();
  }
  
  onMonitoringStopped() {
    this.updateStatus();
  }
  
  onWebSocketConnected() {
    this.updateStatus();
    this.showNotification('WebSocket Connected', 'Connected to hot-reload server for real-time updates', 'success');
  }
  
  onWebSocketClosed() {
    this.updateStatus();
    this.showNotification('WebSocket Disconnected', 'Falling back to file polling for change detection');
  }
}

// Export as global and module
window.HotReloadPanel = HotReloadPanel;
export default HotReloadPanel;