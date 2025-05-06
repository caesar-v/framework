/**
 * Game State Manager Test Script
 * Tests the functionality of the Game State Manager module
 */

(function() {
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('Game State Manager Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-gameStateTest';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }
  
  // Ensure GameStateManager exists
  if (typeof GameStateManager === 'undefined') {
    markTestError('GameStateManager not loaded - cannot run test');
    return;
  }
  
  console.log('%c Game State Manager Test', 'font-weight: bold; font-size: 14px; color: #3498db;');
  
  // Initialize test
  const testResults = {};
  
  // Test 1: GameStateManager instantiation
  try {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      throw new Error('Canvas element "game-canvas" not found in DOM');
    }
    
    // Create a mock config
    const mockConfig = {
      canvasId: 'game-canvas',
      initialBalance: 1000,
      initialBet: 10,
      defaultBet: 10,
      maxBet: 500,
      defaultTheme: 'default',
      defaultLayout: 'pc',
      defaultRiskLevel: 'medium',
      currency: '€',
      debug: true,
      canvasBackground: {
        default: ['#071824', '#071d2a'],
        pirate: ['#110b0f', '#231917'],
        neon: ['#120b18', '#1f1634']
      },
      riskLevels: {
        low: 2,
        medium: 3,
        high: 5
      },
      gameLogic: {}
    };
    
    // Create a mock canvas manager
    const mockCanvasManager = {
      getCanvas: () => ({
        canvas: canvas,
        ctx: canvas.getContext('2d')
      }),
      updateScreenInfo: () => {},
      drawWithCanvas2D: () => {},
      initCanvas: () => {}
    };
    
    // Create a mock UI manager with element references
    const mockUiManager = {
      elements: {
        spinButton: document.getElementById('spin-button') || document.createElement('button'),
        balanceDisplay: document.getElementById('balance-display') || document.createElement('span')
      },
      updateBalance: () => {},
      redrawCanvas: () => {}
    };
    
    // Create a game state manager with the mocks
    const gameStateManager = new GameStateManager(mockConfig, mockCanvasManager, mockUiManager);
    testResults.instantiation = Boolean(gameStateManager);
    
    // Test 2: Check key properties
    testResults.hasConfigProperty = Boolean(gameStateManager.config);
    testResults.hasStateProperty = Boolean(gameStateManager.state);
    testResults.hasCanvasManagerProperty = Boolean(gameStateManager.canvasManager);
    
    // Test 3: Check game state object structure
    const stateKeys = ['theme', 'layout', 'soundEnabled', 'autoPlay', 'isSpinning', 'betAmount', 'balance', 'riskLevel', 'maxBet'];
    const missingStateKeys = stateKeys.filter(key => !(key in gameStateManager.state));
    
    testResults.stateHasAllRequiredKeys = missingStateKeys.length === 0;
    if (!testResults.stateHasAllRequiredKeys) {
      console.error('Missing required state keys:', missingStateKeys);
      testResults.missingStateKeys = missingStateKeys;
    }
    
    // Test 4: Initial state values
    testResults.initialBalanceSet = gameStateManager.state.balance === mockConfig.initialBalance;
    testResults.initialBetSet = gameStateManager.state.betAmount === mockConfig.initialBet;
    testResults.initialSpinningStateFalse = gameStateManager.state.isSpinning === false;
    
    // Test 5: Check key methods
    testResults.hasSpinMethod = typeof gameStateManager.spin === 'function';
    testResults.hasOnSpinCompleteMethod = typeof gameStateManager.onSpinComplete === 'function';
    testResults.hasGetStateMethod = typeof gameStateManager.getState === 'function';
    testResults.hasUpdateStateMethod = typeof gameStateManager.updateState === 'function';
    
    // Test 6: Test state changes
    // Test state update
    try {
      const newBet = 20;
      gameStateManager.updateState({ betAmount: newBet });
      testResults.updateStateWorks = gameStateManager.state.betAmount === newBet;
    } catch (e) {
      console.error('Error testing updateState:', e);
      testResults.updateStateError = e.message;
    }
    
    // Test spin functionality
    try {
      // Store original method to restore later
      const originalSpin = gameStateManager.config.gameLogic.spin;
      
      // Replace spin method with test stub
      gameStateManager.config.gameLogic.spin = (callback) => {
        setTimeout(() => {
          callback({ isWin: true, payout: 100 });
        }, 10);
      };
      
      // Start spin
      const initialBalance = gameStateManager.state.balance;
      const betAmount = gameStateManager.state.betAmount;
      
      // Make sure we have enough balance
      gameStateManager.updateState({ balance: 1000 });
      
      // Execute spin
      gameStateManager.spin();
      testResults.spinWorks = gameStateManager.state.isSpinning === true;
      
      // Restore original method
      gameStateManager.config.gameLogic.spin = originalSpin;
    } catch (e) {
      console.error('Error testing spin:', e);
      testResults.spinError = e.message;
    }
    
    // Test state property access
    try {
      const state = gameStateManager.getState();
      testResults.getStateWorks = typeof state === 'object' && state === gameStateManager.state;
    } catch (e) {
      console.error('Error testing getState:', e);
      testResults.getStateError = e.message;
    }
    
  } catch (e) {
    console.error('Test failed:', e);
    testResults.error = e.message;
  }
  
  // Log results
  console.log('Game State Manager test results:');
  console.table(testResults);
  
  // Overall status
  const corePropertiesOk = testResults.instantiation && 
                          testResults.hasConfigProperty &&
                          testResults.hasStateProperty &&
                          testResults.hasCanvasManagerProperty &&
                          testResults.stateHasAllRequiredKeys;
  
  const methodsWork = testResults.hasSpinMethod &&
                     testResults.hasOnSpinCompleteMethod &&
                     testResults.hasGetStateMethod &&
                     testResults.hasUpdateStateMethod &&
                     testResults.updateStateWorks &&
                     testResults.spinWorks &&
                     testResults.getStateWorks;
  
  const success = corePropertiesOk && methodsWork && !testResults.error;
  
  if (success) {
    console.log('%c Game State Manager tests PASSED ✓', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
  } else {
    console.log('%c Game State Manager tests FAILED ✗', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
    markTestError('Game State Manager test failed');
  }
  
  return testResults;
})();