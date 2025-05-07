# Hot-Reload System

This framework includes a hot-reload system that allows developers to make changes to games and see the results immediately without having to refresh the page. This greatly speeds up development and testing.

## Features

- **Live File Monitoring**: Automatically detects changes to game files and manifests
- **State Preservation**: Maintains game state during reloads when possible
- **WebSocket Support**: Real-time updates via WebSocket connection (faster than polling)
- **Visual UI**: Status panel showing reload activity and controls
- **Notifications**: Non-intrusive notifications for reload events
- **Settings Integration**: Controls in the settings panel to enable/disable hot-reload

## How to Use

### 1. Enable Hot-Reload

Hot-reload is enabled by default. You can toggle it on/off in two ways:

- **Settings Panel**: Open the settings panel and toggle the "Hot Reload" switch in the Development section
- **Hot-Reload Panel**: Use the toggle switch in the hot-reload status panel

### 2. Make Changes

Make changes to your game files:

- Game JavaScript files (e.g., `games/diceGame.js`)
- Game manifest files (e.g., `games/manifests/dice-game.json`)
- Game assets

When you save changes, the framework will automatically detect them and reload the affected game if it's currently active. If the changed game is not currently active, the changes will be applied the next time the game is loaded.

### 3. Monitor Status

A hot-reload status panel appears in the bottom-right corner of the screen showing:

- Current monitoring status
- WebSocket connection status
- Number of manifests being monitored
- Number of reloads performed
- Recent file changes

You can minimize this panel by clicking its header.

### 4. Manual Reload

If you need to manually trigger a reload:

- Click the "Reload Now" button in the settings panel
- Click the "Refresh Now" button in the hot-reload status panel

## WebSocket Server Setup

For optimal hot-reload performance, you can run the included WebSocket server:

1. Ensure you have Node.js installed
2. Install the required packages:
   ```
   npm install ws chokidar
   ```
3. Run the server:
   ```
   node hot-reload-server.js
   ```

The server will monitor your game files and send real-time notifications to the browser when changes occur. If the WebSocket server is not running, the system will fall back to periodic polling for changes.

## Technical Implementation

The hot-reload system consists of several components:

1. **HotReloadService.js**: Core service that monitors files for changes and manages reload processes
2. **WebSocket Server**: Optional server for real-time update notifications
3. **GameAPI Integration**: Extensions to the GameAPI to handle reloading games with state preservation
4. **UI Components**: Status panel and notification system

## Customizing

You can customize the hot-reload behavior by modifying the following:

### Polling Interval

If not using WebSocket, you can change how frequently the system checks for file changes:

```javascript
// In GameAPI's initializeServices method
this.services.hotReloadService = new HotReloadService({
  pollInterval: 1000, // Check every second (default is 2000)
  // ...other options
});
```

### Monitored Paths

By default, the system monitors the game manifests. You can add additional paths:

```javascript
// After initialization
window.gameAPI.services.hotReloadService.setManifestPaths([
  '/games/manifests/dice-game.json',
  '/games/manifests/card-game.json',
  '/games/custom-game.json'
]);
```

### State Preservation

You can control whether game state is preserved during hot-reload:

```javascript
// In GameAPI's initializeServices method
this.services.hotReloadService = new HotReloadService({
  preserveStateOnReload: false, // Don't preserve state (default is true)
  // ...other options
});
```

## Troubleshooting

### Hot-Reload Not Working

1. **Check Browser Console**: Look for error messages in the browser console
2. **Verify Hot-Reload is Enabled**: Check the toggle in the settings panel
3. **WebSocket Connection**: If using WebSocket server, ensure it's running
4. **File Paths**: Make sure your file paths match the expected patterns

### Module Errors After Reload

If you encounter errors related to ES modules or missing exports after a reload:

1. Make sure your modules have proper export declarations
2. Avoid circular dependencies between modules
3. Ensure that your module imports use the correct paths

### State Not Preserving

If game state is not being preserved during reloads:

1. Implement the `getState` and `setState` methods on your game class
2. Ensure your game state is serializable (no functions, DOM elements, etc.)
3. Check for errors in the console when saving/restoring state