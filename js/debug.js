/**
 * Debug utility for game framework
 * This script checks all UI elements and verifies they're properly connected
 */

(function() {
  // Create global debug namespace with utilities
  window.debug = {
    // Debug state
    isDebugEnabled: false,
    
    // Enhanced logging with different levels
    error: (message, ...data) => console.error(`[ERROR] ${message}`, ...data),
    warn: (message, ...data) => this.isDebugEnabled ? console.warn(`[WARN] ${message}`, ...data) : null,
    info: (message, ...data) => this.isDebugEnabled ? console.info(`[INFO] ${message}`, ...data) : null,
    log: (message, ...data) => this.isDebugEnabled ? console.log(`[DEBUG] ${message}`, ...data) : null,
    
    // PIXI debug utilities
    pixi: {
      // Test PIXI initialization
      testInit: function() {
        console.group('PIXI Initialization Test');
        
        // Check if PIXI is loaded
        console.log('PIXI available:', !!window.PIXI);
        if (!window.PIXI) {
          console.error('PIXI is not loaded!');
          console.groupEnd();
          return false;
        }
        
        // Log PIXI version info
        console.log('PIXI Version:', window.PIXI.VERSION);
        
        // Check for essential classes
        console.log('PIXI.Application:', !!window.PIXI.Application);
        console.log('PIXI.Container:', !!window.PIXI.Container);
        console.log('PIXI.Sprite:', !!window.PIXI.Sprite);
        console.log('PIXI.Assets:', !!window.PIXI.Assets);
        
        // Check renderer types
        console.log('PIXI.Renderer (WebGL):', !!window.PIXI.Renderer);
        console.log('PIXI.CanvasRenderer:', !!window.PIXI.CanvasRenderer);
        
        // Check for PIXI v8 specific features
        const isV8 = typeof window.PIXI.Application === 'function' && 
                    typeof window.PIXI.Application.prototype.init === 'function';
        console.log('Is PIXI v8:', isV8);
        
        // Test if PixiHelper is available
        console.log('PixiHelper available:', !!window.PixiHelper);
        
        console.groupEnd();
        return true;
      },
      
      // Test creating a simple renderer on a temporary canvas
      testRenderer: function() {
        console.group('PIXI Renderer Test');
        
        // Create a temporary canvas for testing
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        
        try {
          // Try to create a PIXI application
          console.log('Creating PIXI Application...');
          
          // Use v8 approach
          const app = new PIXI.Application();
          app.init({
            canvas: canvas,
            width: canvas.width,
            height: canvas.height,
            backgroundColor: 0x1099bb,
            // Let PIXI choose the appropriate renderer
            preference: 'webgl2,webgl,canvas'
          });
          
          console.log('PIXI Application created successfully');
          
          // Check which renderer type was chosen
          console.log('Renderer type:', app.renderer.type || 'unknown');
          
          // Create a simple container with a rect
          const container = new PIXI.Container();
          app.stage.addChild(container);
          
          const graphics = new PIXI.Graphics();
          graphics.beginFill(0xFF0000);
          graphics.drawRect(150, 100, 100, 100);
          graphics.endFill();
          container.addChild(graphics);
          
          // Try to render
          app.render();
          console.log('Rendering worked successfully');
          
          // Clean up
          app.destroy();
          console.log('PIXI Application destroyed successfully');
          
          console.groupEnd();
          return true;
        } catch (error) {
          console.error('Error in PIXI renderer test:', error);
          console.groupEnd();
          return false;
        }
      },
      
      // Test using PixiHelper
      testPixiHelper: function() {
        console.group('PixiHelper Test');
        
        if (!window.PixiHelper) {
          console.error('PixiHelper not available');
          console.groupEnd();
          return false;
        }
        
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        
        try {
          // Try to create a PIXI application using PixiHelper
          console.log('Creating PIXI app via PixiHelper...');
          const app = window.PixiHelper.initApp(canvas, {
            backgroundColor: 0x1099bb
          });
          
          if (!app) {
            console.error('PixiHelper.initApp returned null');
            console.groupEnd();
            return false;
          }
          
          console.log('PixiHelper created app successfully');
          console.log('Renderer type:', app.renderer ? app.renderer.type : 'unknown');
          
          // Clean up
          if (typeof app.destroy === 'function') {
            app.destroy();
          } else if (app.renderer && typeof app.renderer.destroy === 'function') {
            app.renderer.destroy();
          }
          
          console.log('Cleanup completed');
          console.groupEnd();
          return true;
        } catch (error) {
          console.error('Error in PixiHelper test:', error);
          console.groupEnd();
          return false;
        }
      },
      
      // Run all PIXI tests
      runTests: function() {
        console.group('PIXI Debug Tests');
        const initResult = this.testInit();
        const rendererResult = this.testRenderer();
        const helperResult = this.testPixiHelper();
        
        console.log('Tests results:');
        console.log('- Initialization:', initResult ? '✅ PASSED' : '❌ FAILED');
        console.log('- Renderer:', rendererResult ? '✅ PASSED' : '❌ FAILED');
        console.log('- PixiHelper:', helperResult ? '✅ PASSED' : '❌ FAILED');
        console.groupEnd();
        
        window.showStatusMessage(
          `PIXI Tests: ${initResult && rendererResult && helperResult ? 'All Passed' : 'Some Failed'}`, 
          !(initResult && rendererResult && helperResult)
        );
        
        return {
          initialization: initResult,
          renderer: rendererResult,
          helper: helperResult,
          allPassed: initResult && rendererResult && helperResult
        };
      }
    },
    
    // Inspect object properties
    inspect: function(obj, name = 'Object') {
      console.group(`Inspecting ${name}`);
      
      if (!obj) {
        this.error(`${name} is undefined or null`);
        console.groupEnd();
        return;
      }
      
      try {
        // Show basic info
        console.log(`Type: ${typeof obj}`);
        console.log(`Constructor: ${obj.constructor ? obj.constructor.name : 'Unknown'}`);
        
        // Show properties
        console.log('Properties:', obj);
        
        // Show prototype chain if relevant
        if (typeof obj === 'object') {
          const proto = Object.getPrototypeOf(obj);
          if (proto && proto !== Object.prototype) {
            console.log('Prototype:', proto.constructor ? proto.constructor.name : proto);
          }
        }
      } catch (e) {
        this.error(`Error inspecting ${name}:`, e);
      }
      
      console.groupEnd();
    },
    
    // Test game class initialization
    testGame: function(gameType) {
      this.info(`Testing ${gameType} game`);
      
      let gameInstance = null;
      
      try {
        switch(gameType) {
          case 'slot':
            gameInstance = new SlotGame();
            break;
          case 'dice':
            gameInstance = new DiceGame();
            break;
          case 'card':
            gameInstance = new CardGame();
            break;
          default:
            this.error(`Unknown game type: ${gameType}`);
            return null;
        }
        
        this.info(`Game instance created:`, gameInstance);
        this.inspect(gameInstance.config, `${gameType} config`);
        return gameInstance;
      } catch (e) {
        this.error(`Failed to create game instance:`, e);
        return null;
      }
    },
    
    // Test all game implementations
    testAllGames: function() {
      this.info('Testing all game implementations');
      const results = {
        slot: this.testGame('slot'),
        dice: this.testGame('dice'),
        card: this.testGame('card')
      };
      return results;
    },
    
    // Analyze current game framework state
    analyzeFramework: function() {
      this.info('Analyzing game framework state');
      
      if (!window.gameLoader) {
        this.error('GameLoader not found');
        return null;
      }
      
      if (!window.gameLoader.activeGame) {
        this.warn('No active game found');
        return null;
      }
      
      const activeGame = window.gameLoader.activeGame;
      this.info(`Active game: ${activeGame.constructor ? activeGame.constructor.name : 'Unknown'}`);
      
      if (!activeGame.game) {
        this.error('Game framework instance not found in active game');
        return activeGame;
      }
      
      const framework = activeGame.game;
      this.info('Game framework found');
      this.inspect(framework.config, 'GameFramework config');
      this.inspect(framework.state, 'GameFramework state');
      
      return framework;
    }
  };
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('%c Game Framework Debug Tool', 'background: #222; color: #bada55; font-size: 16px; padding: 10px;');
    
    // Check if key objects are available in the global scope
    console.group('Global Objects');
    console.log('GameFramework available:', typeof window.GameFramework !== 'undefined');
    console.log('BaseGame available:', typeof window.BaseGame !== 'undefined');
    console.log('GameLoader available:', typeof window.gameLoader !== 'undefined');
    console.log('SlotGame available:', typeof window.SlotGame !== 'undefined');
    console.log('DiceGame available:', typeof window.DiceGame !== 'undefined');
    console.log('CardGame available:', typeof window.CardGame !== 'undefined');
    console.log('Helpers available:', typeof window.Helpers !== 'undefined');
    console.log('Animations available:', typeof window.Animations !== 'undefined');
    console.log('GameConfig available:', typeof window.GameConfig !== 'undefined');
    console.groupEnd();
    
    // Check if main UI elements exist
    console.group('UI Elements');
    console.log('Game container:', document.getElementById('game-container') ? '✅ Found' : '❌ Missing');
    console.log('Game canvas:', document.getElementById('game-canvas') ? '✅ Found' : '❌ Missing');
    console.log('Sound button:', document.getElementById('sound-button') ? '✅ Found' : '❌ Missing');
    console.log('Menu button:', document.getElementById('menu-button') ? '✅ Found' : '❌ Missing');
    console.log('Menu overlay:', document.getElementById('menu-overlay') ? '✅ Found' : '❌ Missing');
    console.log('Game select:', document.getElementById('game-select') ? '✅ Found' : '❌ Missing');
    console.log('Desktop layout:', document.getElementById('desktop') ? '✅ Found' : '❌ Missing');
    console.log('Mobile layout:', document.getElementById('mobile') ? '✅ Found' : '❌ Missing');
    console.log('Theme select:', document.getElementById('theme-select') ? '✅ Found' : '❌ Missing');
    console.log('Decrease bet:', document.getElementById('decrease-bet') ? '✅ Found' : '❌ Missing');
    console.log('Increase bet:', document.getElementById('increase-bet') ? '✅ Found' : '❌ Missing');
    console.log('Bet input:', document.getElementById('bet-input') ? '✅ Found' : '❌ Missing');
    console.log('Spin button:', document.getElementById('spin-button') ? '✅ Found' : '❌ Missing');
    console.groupEnd();
    
    // Test event listeners on main UI controls
    console.group('Event Listeners');
    
    // Create diagnostic wrappers around key event targets
    const addDiagnosticEvents = (elementId, events) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.log(`${elementId}: ❌ Element not found`);
        return;
      }
      
      // Add diagnostic click handler
      element.addEventListener('click', function(event) {
        console.log(`${elementId} clicked ✅`);
      });
      
      console.log(`${elementId}: ✅ Diagnostic listener added`);
    };
    
    // Add diagnostic events to key UI elements
    addDiagnosticEvents('sound-button');
    addDiagnosticEvents('menu-button');
    addDiagnosticEvents('close-menu');
    addDiagnosticEvents('decrease-bet');
    addDiagnosticEvents('increase-bet');
    addDiagnosticEvents('half-bet');
    addDiagnosticEvents('max-bet');
    addDiagnosticEvents('spin-button');
    addDiagnosticEvents('manual-tab');
    addDiagnosticEvents('auto-tab');
    
    // Check if gameLoader is initialized
    if (window.gameLoader) {
      console.log('GameLoader instance: ✅ Found');
      console.log('Active game:', window.gameLoader.activeGame ? '✅ Set' : '❌ Not set');
      
      if (window.gameLoader.activeGame) {
        console.log('Active game instance:', window.gameLoader.activeGame);
        console.log('Active game framework:', window.gameLoader.activeGame.game ? '✅ Set' : '❌ Not set');
      }
    } else {
      console.log('GameLoader instance: ❌ Missing');
    }
    
    // Check if elements have event listeners (simple heuristic)
    const checkEventsAssigned = (elementId) => {
      const element = document.getElementById(elementId);
      if (!element) return false;
      
      // Clone the node to see if it has events (will lose them in cloning)
      const clone = element.cloneNode(true);
      const hasListeners = element !== clone;
      console.log(`${elementId} has event listeners:`, hasListeners ? '✅ Likely' : '❌ Unlikely');
    };
    
    // Check key elements
    checkEventsAssigned('sound-button');
    checkEventsAssigned('menu-button');
    checkEventsAssigned('game-select');
    
    console.groupEnd();
    
    console.log('%c Debug complete. Check console for issues.', 'background: #222; color: #bada55; font-size: 14px; padding: 5px;');
    
    // Helper to show status messages
    window.showStatusMessage = (message, isError = false) => {
      const statusMsg = document.createElement('div');
      statusMsg.textContent = message;
      statusMsg.style.position = 'fixed';
      statusMsg.style.bottom = '70px';
      statusMsg.style.right = '10px';
      statusMsg.style.background = isError ? 'rgba(255,0,0,0.7)' : 'rgba(0,0,0,0.7)';
      statusMsg.style.color = 'white';
      statusMsg.style.padding = '5px 10px';
      statusMsg.style.borderRadius = '4px';
      statusMsg.style.zIndex = '10000';
      
      document.body.appendChild(statusMsg);
      
      setTimeout(() => {
        statusMsg.remove();
      }, 3000);
    };
    
    // After a delay, run a full analysis
    setTimeout(() => {
      window.debug.info('Running initial framework analysis');
      window.debug.analyzeFramework();
    }, 2000);
    
    // Connect PIXI debug button
    const debugButton = document.getElementById('debug-button');
    if (debugButton) {
      debugButton.addEventListener('click', function() {
        // Run PIXI tests
        window.debug.pixi.runTests();
        // After tests, show framework analysis
        window.debug.analyzeFramework();
      });
    }
  });
})();