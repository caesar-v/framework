/**
 * hot-reload-server.js
 * WebSocket server for hot-reload functionality.
 * 
 * This server watches for file changes and sends notifications to connected clients.
 * Run with: node hot-reload-server.js
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');
const chokidar = require('chokidar'); // You may need to install this: npm install chokidar

// Configuration
const PORT = process.env.PORT || 8080;
const WATCH_PATHS = ['./games', './games/manifests', './js/games'];

// Create HTTP server and WebSocket server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hot-Reload Server\n');
});

const wss = new WebSocket.Server({ server });

// File watchers
const watchers = new Map();
let globalWatcher = null;

// Track connected clients
const clients = new Set();

// Start file watching
function initializeFileWatching() {
  // Create global watcher for common paths
  globalWatcher = chokidar.watch(WATCH_PATHS, {
    ignored: /(^|[\/\\])\../, // Ignore dot files
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  console.log(`Watching paths: ${WATCH_PATHS.join(', ')}`);

  // Handle file changes
  globalWatcher.on('change', (filePath) => {
    const normalizedPath = normalizeFilePath(filePath);
    handleFileChange(normalizedPath);
  });

  globalWatcher.on('add', (filePath) => {
    const normalizedPath = normalizeFilePath(filePath);
    handleFileChange(normalizedPath);
  });

  globalWatcher.on('error', (error) => {
    console.error(`Watcher error: ${error}`);
  });
}

// Normalize file path for consistency
function normalizeFilePath(filePath) {
  // Convert to forward slashes for consistency
  return filePath.replace(/\\/g, '/');
}

// Handle file changes
function handleFileChange(filePath) {
  console.log(`File changed: ${filePath}`);
  
  // Determine file type
  const isManifest = filePath.endsWith('.json');
  const isScript = filePath.endsWith('.js');
  
  // Create message based on file type
  const message = {
    type: isManifest ? 'manifestChanged' : 'fileChanged',
    path: filePath,
    timestamp: Date.now()
  };
  
  // Broadcast to all clients
  broadcastMessage(message);
}

// Broadcast message to all connected clients
function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Add a specific path to watch
function addWatchPath(watchPath) {
  if (globalWatcher && !WATCH_PATHS.includes(watchPath)) {
    console.log(`Adding watch path: ${watchPath}`);
    globalWatcher.add(watchPath);
    WATCH_PATHS.push(watchPath);
  }
}

// Set up WebSocket server
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`Client connected: ${clientIp}`);
  
  // Add to clients set
  clients.add(ws);
  
  // Send initial message to confirm connection
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to hot-reload server',
    timestamp: Date.now()
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'monitor' && Array.isArray(data.paths)) {
        // Add paths to watch
        data.paths.forEach(pathToWatch => {
          addWatchPath(pathToWatch);
        });
        
        ws.send(JSON.stringify({
          type: 'monitoringPaths',
          paths: WATCH_PATHS,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error(`Error handling message: ${error}`);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientIp}`);
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
    clients.delete(ws);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Hot-reload server running on port ${PORT}`);
  initializeFileWatching();
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down hot-reload server...');
  
  // Close all watchers
  if (globalWatcher) {
    globalWatcher.close();
  }
  
  watchers.forEach(watcher => {
    watcher.close();
  });
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});