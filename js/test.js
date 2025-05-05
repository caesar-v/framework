/**
 * Test script for game framework
 * This runs comprehensive tests on all UI elements and game functions
 */

(function() {
  // Define logger
  const log = (message, color = 'black') => {
    console.log(`%c [TEST] ${message}`, `color: ${color}`);
  };
  
  // Add enhanced test utility functions
  window.test = {
    // Test initialization of individual games
    initializeGame: function(gameType) {
      log(`=== Testing game initialization: ${gameType}`, 'blue');
      let gameInstance = null;
      
      try {
        switch(gameType) {
          case 'dice':
            log('Creating DiceGame instance...', 'orange');
            gameInstance = new DiceGame();
            break;
            
          case 'card':
            log('Creating CardGame instance...', 'orange');
            gameInstance = new CardGame();
            break;
            
          default:
            log(`Unknown game type: ${gameType}`, 'red');
            return null;
        }
        
        log(`Game instance created successfully: ${gameInstance.constructor.name}`, 'green');
        log(`Config:`, 'green');
        console.log(gameInstance.config);
        return gameInstance;
      } catch (e) {
        log(`Failed to create game instance: ${e.message}`, 'red');
        console.error(e);
        return null;
      }
    },
    
    // Test game switching
    switchGame: function(gameType) {
      log(`=== Testing game switching to: ${gameType}`, 'blue');
      if (window.gameLoader) {
        window.gameLoader.loadGame(gameType);
      } else {
        log('GameLoader not initialized', 'red');
      }
    },
    
    // Test class hierarchy
    checkInheritance: function() {
      log('=== Testing class inheritance', 'blue');
      
      try {
        // Test DiceGame
        const diceGame = new DiceGame();
        log(`DiceGame instanceof BaseGame: ${diceGame instanceof BaseGame}`, 
            diceGame instanceof BaseGame ? 'green' : 'red');
        
        // Test CardGame
        const cardGame = new CardGame();
        log(`CardGame instanceof BaseGame: ${cardGame instanceof BaseGame}`, 
            cardGame instanceof BaseGame ? 'green' : 'red');
      } catch (e) {
        log(`Error during inheritance check: ${e.message}`, 'red');
        console.error(e);
      }
    },
    
    // Run all tests
    runAllTests: function() {
      log('======== RUNNING ALL TESTS ========', 'blue');
      
      // Confirm all game classes are available
      log('Verifying game classes are available', 'blue');
      const verifyClasses = {
        'BaseGame': typeof BaseGame !== 'undefined',
        'DiceGame': typeof DiceGame !== 'undefined',
        'CardGame': typeof CardGame !== 'undefined'
      };
      
      let allClassesAvailable = true;
      for (const [className, isAvailable] of Object.entries(verifyClasses)) {
        log(`${className} available: ${isAvailable}`, isAvailable ? 'green' : 'red');
        if (!isAvailable) {
          allClassesAvailable = false;
        }
      }
      
      if (!allClassesAvailable) {
        log('Some required game classes are missing! Aborting tests', 'red');
        return;
      }
      
      // Run tests sequentially with delays to prevent race conditions
      this.runTestsSequentially();
    },
    
    // Run tests in sequence with delays
    runTestsSequentially: function() {
      // Start with inheritance check
      this.checkInheritance();
      
      // Sequential execution with delays to prevent race conditions
      setTimeout(() => {
        // Test dice game initialization
        this.initializeGame('dice');
        
        setTimeout(() => {
          // Test card game initialization
          this.initializeGame('card');
          
          setTimeout(() => {
            // Test game switching
            if (window.gameLoader && (window.gameLoader._loadingGame || window.gameLoader._loadingGameTest)) {
              log('Game loader is busy, waiting before testing game switching...', 'orange');
              setTimeout(() => {
                // Double check if still busy
                if (window.gameLoader && (window.gameLoader._loadingGame || window.gameLoader._loadingGameTest)) {
                  log('Game loader still busy, skipping game switching test', 'orange');
                } else {
                  this.switchGame('dice');
                }
              }, 1000); 
            } else {
              this.switchGame('dice');
            }
            
            setTimeout(() => {
              log('======== ALL TESTS COMPLETE ========', 'blue');
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }
  };
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    log('Starting comprehensive framework test', 'blue');
    
    // Run enhanced tests after a delay to allow normal initialization
    setTimeout(() => window.test.runAllTests(), 2000);
    
    // Then run basic UI tests
    testGameLoader();
  });
  
  function testGameLoader() {
    log('Testing game loader initialization');
    
    // Check if game loader exists
    if (!window.gameLoader) {
      log('GameLoader not found, waiting 1s...', 'orange');
      setTimeout(testGameLoader, 1000);
      return;
    }
    
    log('GameLoader found', 'green');
    
    // Check if active game exists
    if (!window.gameLoader.activeGame) {
      log('No active game yet, waiting 1s...', 'orange');
      setTimeout(testGameLoader, 1000);
      return;
    }
    
    log('Active game found', 'green');
    log(`Active game: ${window.gameLoader.activeGame.constructor.name}`, 'green');
    
    // Once game is loaded, test game framework
    testGameFramework();
  }
  
  function testGameFramework() {
    log('Testing game framework initialization');
    
    // Get references to game framework and active game
    const activeGame = window.gameLoader.activeGame;
    const framework = activeGame.game;
    
    if (!framework) {
      log('Game framework not found!', 'red');
      return;
    }
    
    log('Game framework found', 'green');
    
    // Test elements object
    if (!framework.elements) {
      log('Elements object not found!', 'red');
      return;
    }
    
    log('Elements object found', 'green');
    
    // Test UI element references
    const elementTests = [
      'container', 'gameTitle', 'canvas', 'themeSelect', 'soundButton', 
      'menuButton', 'menuOverlay', 'closeMenu', 'spinButton', 'betInput',
      'decreaseBet', 'increaseBet', 'manualTab', 'autoTab'
    ];
    
    let allElementsFound = true;
    
    elementTests.forEach(element => {
      if (!framework.elements[element]) {
        log(`Missing element reference: ${element}`, 'red');
        allElementsFound = false;
      }
    });
    
    if (allElementsFound) {
      log('All UI element references found', 'green');
    } else {
      log('Some UI element references are missing!', 'red');
      // Try to fix missing elements
      fixElementReferences(framework);
      return;
    }
    
    // Continue with testing event handlers
    testEventHandlers(framework);
  }
  
  function fixElementReferences(framework) {
    log('Attempting to fix missing element references', 'orange');
    
    // These are the essential elements to check
    const elementSelectors = {
      'container': '#game-container',
      'gameTitle': '.game-title',
      'canvas': '#game-canvas',
      'themeSelect': '#theme-select',
      'soundButton': '#sound-button',
      'menuButton': '#menu-button',
      'menuOverlay': '#menu-overlay',
      'closeMenu': '#close-menu',
      'spinButton': '#spin-button',
      'betInput': '#bet-input',
      'decreaseBet': '#decrease-bet',
      'increaseBet': '#increase-bet',
      'manualTab': '#manual-tab',
      'autoTab': '#auto-tab',
      'popupTabs': '.popup-tab',
      'tabContents': '.tab-content',
      'riskLevel': '#risk-level',
      'halfBet': '#half-bet',
      'maxBet': '#max-bet',
      'quickBets': '.quick-bet',
      'currentTime': '#current-time',
      'dimensionsDisplay': '#dimensions-display',
      'potentialWin': '#potential-win',
      'balanceDisplay': '#balance-display',
      'desktopLayout': '#desktop',
      'mobileLayout': '#mobile'
    };
    
    framework.elements = framework.elements || {};
    
    for (const [key, selector] of Object.entries(elementSelectors)) {
      if (!framework.elements[key]) {
        try {
          if (selector.includes('.') && !selector.includes('#')) {
            framework.elements[key] = document.querySelectorAll(selector);
          } else {
            framework.elements[key] = document.querySelector(selector);
          }
          
          log(`Fixed ${key} element reference`, 'green');
        } catch (e) {
          log(`Could not fix ${key} element reference: ${e.message}`, 'red');
        }
      }
    }
    
    // Re-attach event listeners
    framework.setupEventListeners();
    
    // Continue testing
    testEventHandlers(framework);
  }
  
  function testEventHandlers(framework) {
    log('Testing event handlers', 'blue');
    
    // Add test clicks to main UI elements and log results
    const testClick = (elementName, delay = 0) => {
      if (!framework.elements[elementName]) {
        log(`Cannot test ${elementName} - element reference is missing`, 'red');
        return;
      }
      
      setTimeout(() => {
        log(`Simulating click on ${elementName}`);
        try {
          // Create and dispatch click event
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          
          framework.elements[elementName].dispatchEvent(event);
          log(`Click event dispatched to ${elementName}`, 'green');
        } catch (e) {
          log(`Error clicking ${elementName}: ${e.message}`, 'red');
        }
      }, delay);
    };
    
    // Test bet controls
    testClick('decreaseBet', 100);
    testClick('increaseBet', 500);
    testClick('halfBet', 900);
    testClick('maxBet', 1300);
    
    // Test sound and menu
    testClick('soundButton', 1700);
    testClick('menuButton', 2100);
    
    // Test menu closing
    setTimeout(() => {
      testClick('closeMenu', 100);
    }, 2500);
    
    // Test spin button
    setTimeout(() => {
      testClick('spinButton', 100);
    }, 3000);
    
    // Test play mode tabs
    setTimeout(() => {
      testClick('autoTab', 100);
      setTimeout(() => testClick('manualTab', 100), 500);
    }, 4000);
    
    log('All event handler tests dispatched', 'blue');
  }
})();