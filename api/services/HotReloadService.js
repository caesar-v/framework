/**
 * HotReloadService.js
 * Service for hot-reloading games and assets without page refresh.
 * 
 * This service monitors game files and manifests for changes and
 * provides mechanisms to reload them dynamically while preserving
 * game state.
 */

/**
 * Hot Reload Service class
 * Enables hot-reloading of games and assets without refreshing the page
 */
class HotReloadService {
  /**
   * Create a new instance of HotReloadService
   * @param {Object} options - Configuration options
   * @param {boolean} options.enabled - Whether hot-reload is enabled
   * @param {number} options.pollInterval - Poll interval in milliseconds
   * @param {boolean} options.preserveStateOnReload - Whether to preserve game state when reloading
   * @param {Array} options.manifestPaths - Paths to manifests to monitor
   * @param {Function} options.onReload - Callback function when a reload occurs
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      enabled: true,
      pollInterval: 2000, // 2 seconds
      preserveStateOnReload: true,
      manifestPaths: [],
      onReload: null,
      ...options
    };
    
    // State
    this.isInitialized = false;
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.lastModified = new Map();
    this.changeListeners = new Map();
    this.wsConnection = null;
    this.wsReconnectTimer = null;
    
    // Statistics
    this.stats = {
      reloads: 0,
      lastReload: null,
      changedFiles: []
    };
    
    // Services
    this.manifestLoader = null;
    
    // Auto-initialize if enabled
    if (this.options.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize the service
   * @param {Object} services - External services to use
   * @param {Object} services.manifestLoader - ManifestLoader instance
   * @return {Promise<void>} Promise that resolves when initialization is complete
   */
  async initialize(services = {}) {
    if (this.isInitialized) {
      console.log('HotReloadService: Already initialized');
      return;
    }
    
    console.log('HotReloadService: Initializing...');
    
    try {
      // Store external services or import if needed
      if (services.manifestLoader) {
        this.manifestLoader = services.manifestLoader;
      } else {
        try {
          const ManifestLoaderModule = await import('./ManifestLoader.js');
          const ManifestLoader = ManifestLoaderModule.default;
          this.manifestLoader = new ManifestLoader();
        } catch (error) {
          console.error('HotReloadService: Failed to import ManifestLoader:', error);
          throw new Error('Failed to initialize HotReloadService: ManifestLoader not available');
        }
      }
      
      // Initialize WebSocket connection if supported
      this.initializeWebSocket();
      
      // Start monitoring if enabled
      if (this.options.enabled) {
        this.startMonitoring();
      }
      
      this.isInitialized = true;
      console.log('HotReloadService: Initialized successfully');
    } catch (error) {
      console.error('HotReloadService: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Start file monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('HotReloadService: Already monitoring');
      return;
    }
    
    console.log('HotReloadService: Starting file monitoring');
    
    // Start polling interval if WebSocket is not available
    if (!this.wsConnection) {
      this.monitorInterval = setInterval(() => {
        this.checkForChanges();
      }, this.options.pollInterval);
    }
    
    this.isMonitoring = true;
    
    // Emit monitoring start event
    this.emitEvent('monitoringStarted', { timestamp: Date.now() });
  }
  
  /**
   * Stop file monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('HotReloadService: Stopping file monitoring');
    
    // Clear polling interval
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    // Close WebSocket connection
    this.closeWebSocket();
    
    this.isMonitoring = false;
    
    // Emit monitoring stop event
    this.emitEvent('monitoringStopped', { timestamp: Date.now() });
  }
  
  /**
   * Initialize WebSocket connection for real-time updates
   * @private
   */
  initializeWebSocket() {
    // Only use WebSocket in supported environments
    if (!window.WebSocket) {
      console.log('HotReloadService: WebSocket not supported in this environment');
      return;
    }
    
    try {
      // Determine WebSocket URL - can be configured by the server
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/hot-reload`;
      
      console.log(`HotReloadService: Attempting to connect to WebSocket at ${wsUrl}`);
      
      // Create WebSocket connection
      this.wsConnection = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.wsConnection.onopen = this.handleWebSocketOpen.bind(this);
      this.wsConnection.onmessage = this.handleWebSocketMessage.bind(this);
      this.wsConnection.onclose = this.handleWebSocketClose.bind(this);
      this.wsConnection.onerror = this.handleWebSocketError.bind(this);
    } catch (error) {
      console.error('HotReloadService: Error initializing WebSocket:', error);
      this.wsConnection = null;
    }
  }
  
  /**
   * Handle WebSocket open event
   * @private
   */
  handleWebSocketOpen() {
    console.log('HotReloadService: WebSocket connection established');
    
    // Clear reconnect timer if any
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    
    // Send current manifest paths to monitor
    if (this.options.manifestPaths.length > 0) {
      this.wsConnection.send(JSON.stringify({
        type: 'monitor',
        paths: this.options.manifestPaths
      }));
    }
    
    // Emit connection event
    this.emitEvent('wsConnected', { timestamp: Date.now() });
  }
  
  /**
   * Handle WebSocket message event
   * @param {MessageEvent} event - WebSocket message event
   * @private
   */
  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'fileChanged') {
        console.log(`HotReloadService: File change detected via WebSocket: ${message.path}`);
        
        // Handle changed file
        this.handleFileChange(message.path, message.timestamp);
      } else if (message.type === 'manifestChanged') {
        console.log(`HotReloadService: Manifest change detected via WebSocket: ${message.path}`);
        
        // Reload manifest
        this.reloadManifest(message.path);
      }
      
      // Emit message event
      this.emitEvent('wsMessage', message);
    } catch (error) {
      console.error('HotReloadService: Error handling WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   * @private
   */
  handleWebSocketClose(event) {
    console.log(`HotReloadService: WebSocket connection closed: ${event.code} ${event.reason}`);
    
    this.wsConnection = null;
    
    // Start polling as fallback
    if (this.isMonitoring && !this.monitorInterval) {
      this.monitorInterval = setInterval(() => {
        this.checkForChanges();
      }, this.options.pollInterval);
    }
    
    // Attempt to reconnect
    this.wsReconnectTimer = setTimeout(() => {
      if (this.isMonitoring) {
        console.log('HotReloadService: Attempting to reconnect WebSocket');
        this.initializeWebSocket();
      }
    }, 5000); // 5 second delay before reconnect
    
    // Emit close event
    this.emitEvent('wsClosed', {
      code: event.code,
      reason: event.reason,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle WebSocket error event
   * @param {Event} event - WebSocket error event
   * @private
   */
  handleWebSocketError(event) {
    console.error('HotReloadService: WebSocket error:', event);
    
    // Emit error event
    this.emitEvent('wsError', {
      timestamp: Date.now(),
      event
    });
  }
  
  /**
   * Close WebSocket connection
   * @private
   */
  closeWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Hot reload monitoring stopped');
      this.wsConnection = null;
    }
    
    // Clear reconnect timer if any
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
  }
  
  /**
   * Check for file changes
   * @return {Promise<Object>} Promise resolving to an object with change information
   */
  async checkForChanges() {
    if (!this.isInitialized || !this.manifestLoader) {
      return { hasChanges: false };
    }
    
    try {
      // Check for manifest updates
      const manifestResults = await this.checkManifestsForChanges();
      
      // If changes were found, handle them
      if (manifestResults.hasUpdates) {
        for (const manifestPath of manifestResults.updatedManifests) {
          await this.reloadManifest(manifestPath);
        }
      }
      
      return {
        hasChanges: manifestResults.hasUpdates,
        changedManifests: manifestResults.updatedManifests
      };
    } catch (error) {
      console.error('HotReloadService: Error checking for changes:', error);
      return { hasChanges: false, error };
    }
  }
  
  /**
   * Check if any monitored manifests have changed
   * @return {Promise<Object>} Promise resolving to an object with update information
   * @private
   */
  async checkManifestsForChanges() {
    if (!this.manifestLoader) {
      return { hasUpdates: false, updatedManifests: [] };
    }
    
    try {
      // If no specific manifest paths are provided, check all loaded manifests
      if (this.options.manifestPaths.length === 0) {
        return await this.manifestLoader.checkAllForUpdates();
      }
      
      // Check only specific manifest paths
      const updatePromises = this.options.manifestPaths.map(async path => {
        const hasChanged = await this.manifestLoader.checkForUpdates(path);
        return { path, hasChanged };
      });
      
      const results = await Promise.all(updatePromises);
      const updatedManifests = results.filter(result => result.hasChanged)
        .map(result => result.path);
      
      return {
        updatedManifests,
        hasUpdates: updatedManifests.length > 0
      };
    } catch (error) {
      console.error('HotReloadService: Error checking manifests for changes:', error);
      return { hasUpdates: false, updatedManifests: [] };
    }
  }
  
  /**
   * Reload a manifest and trigger game reload if needed
   * @param {string} manifestPath - Path to the manifest file
   * @return {Promise<Object>} Promise resolving to the reloaded manifest
   */
  async reloadManifest(manifestPath) {
    if (!this.manifestLoader) {
      throw new Error('ManifestLoader is not available');
    }
    
    console.log(`HotReloadService: Reloading manifest: ${manifestPath}`);
    
    try {
      // Force reload the manifest
      const manifest = await this.manifestLoader.loadManifest(manifestPath, true);
      
      // Update last modified timestamp
      this.lastModified.set(manifestPath, Date.now());
      
      // Update stats
      this.stats.reloads++;
      this.stats.lastReload = Date.now();
      this.stats.changedFiles.push({ path: manifestPath, timestamp: Date.now() });
      
      // Limit the history size
      if (this.stats.changedFiles.length > 50) {
        this.stats.changedFiles = this.stats.changedFiles.slice(-50);
      }
      
      // Emit manifest reload event
      this.emitEvent('manifestReloaded', {
        manifestPath,
        manifest,
        timestamp: Date.now()
      });
      
      return manifest;
    } catch (error) {
      console.error(`HotReloadService: Error reloading manifest ${manifestPath}:`, error);
      
      // Emit error event
      this.emitEvent('reloadError', {
        manifestPath,
        error,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Handle a file change
   * @param {string} filePath - Path to the changed file
   * @param {number} timestamp - Timestamp of the change
   * @private
   */
  handleFileChange(filePath, timestamp) {
    // Update last modified timestamp
    this.lastModified.set(filePath, timestamp || Date.now());
    
    // Check if this is a manifest file
    const isManifest = filePath.endsWith('.json');
    
    if (isManifest) {
      // Reload manifest
      this.reloadManifest(filePath).catch(error => {
        console.error(`HotReloadService: Error reloading manifest ${filePath}:`, error);
      });
    } else {
      // For JS files, we need to trigger module reloading
      // This will be handled by the game reload process
      this.emitEvent('fileChanged', {
        filePath,
        timestamp: timestamp || Date.now()
      });
    }
  }
  
  /**
   * Reload a specific game
   * @param {string} gameId - ID of the game to reload
   * @param {Object} options - Reload options
   * @param {boolean} options.preserveState - Whether to preserve the game state
   * @return {Promise<boolean>} Promise resolving to true if reload was successful
   */
  async reloadGame(gameId, options = {}) {
    const reloadOptions = {
      preserveState: this.options.preserveStateOnReload,
      ...options
    };
    
    console.log(`HotReloadService: Reloading game ${gameId}`, reloadOptions);
    
    try {
      // Update stats
      this.stats.reloads++;
      this.stats.lastReload = Date.now();
      
      // Emit game reload event
      this.emitEvent('gameReloading', {
        gameId,
        options: reloadOptions,
        timestamp: Date.now()
      });
      
      // The actual reload will be performed by GameAPI
      // We return true to indicate that the event was emitted
      return true;
    } catch (error) {
      console.error(`HotReloadService: Error reloading game ${gameId}:`, error);
      
      // Emit error event
      this.emitEvent('reloadError', {
        gameId,
        error,
        timestamp: Date.now()
      });
      
      return false;
    }
  }
  
  /**
   * Add a change listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} callback - Callback function
   * @return {string} Listener ID
   */
  addChangeListener(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    // Generate unique ID for the listener
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create event type entry if it doesn't exist
    if (!this.changeListeners.has(eventType)) {
      this.changeListeners.set(eventType, new Map());
    }
    
    // Add listener
    this.changeListeners.get(eventType).set(listenerId, callback);
    
    return listenerId;
  }
  
  /**
   * Remove a change listener
   * @param {string} eventType - Type of event
   * @param {string} listenerId - ID of the listener to remove
   * @return {boolean} True if the listener was removed
   */
  removeChangeListener(eventType, listenerId) {
    if (!this.changeListeners.has(eventType)) {
      return false;
    }
    
    return this.changeListeners.get(eventType).delete(listenerId);
  }
  
  /**
   * Emit an event to all registered listeners
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @private
   */
  emitEvent(eventType, data) {
    if (!this.changeListeners.has(eventType)) {
      return;
    }
    
    // Call all registered listeners
    for (const callback of this.changeListeners.get(eventType).values()) {
      try {
        callback(data);
      } catch (error) {
        console.error(`HotReloadService: Error in event listener for ${eventType}:`, error);
      }
    }
    
    // Also call onReload callback if this is a reload event
    if ((eventType === 'manifestReloaded' || eventType === 'gameReloaded') && 
        typeof this.options.onReload === 'function') {
      try {
        this.options.onReload({
          type: eventType,
          ...data
        });
      } catch (error) {
        console.error('HotReloadService: Error in onReload callback:', error);
      }
    }
  }
  
  /**
   * Set manifest paths to monitor
   * @param {string[]} paths - Array of manifest paths
   */
  setManifestPaths(paths) {
    if (!Array.isArray(paths)) {
      throw new Error('Paths must be an array');
    }
    
    this.options.manifestPaths = paths;
    
    // If WebSocket is connected, send updated paths
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'monitor',
        paths
      }));
    }
    
    console.log(`HotReloadService: Now monitoring ${paths.length} manifest paths`);
  }
  
  /**
   * Get current monitoring status
   * @return {Object} Status object with monitoring information
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      initialized: this.isInitialized,
      monitoring: this.isMonitoring,
      webSocketActive: this.wsConnection !== null && this.wsConnection.readyState === WebSocket.OPEN,
      pollInterval: this.options.pollInterval,
      manifestPaths: this.options.manifestPaths,
      stats: { ...this.stats },
      lastModified: Array.from(this.lastModified.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})
    };
  }
  
  /**
   * Enable or disable hot reload
   * @param {boolean} enabled - Whether to enable hot reload
   */
  setEnabled(enabled) {
    this.options.enabled = !!enabled;
    
    if (this.options.enabled) {
      if (!this.isInitialized) {
        this.initialize();
      } else if (!this.isMonitoring) {
        this.startMonitoring();
      }
    } else if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    console.log(`HotReloadService: Hot reload ${this.options.enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Clear monitoring statistics
   */
  clearStats() {
    this.stats = {
      reloads: 0,
      lastReload: null,
      changedFiles: []
    };
    
    console.log('HotReloadService: Stats cleared');
  }
}

export default HotReloadService;