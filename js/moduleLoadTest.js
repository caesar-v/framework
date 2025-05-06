/**
 * Module Load Test Script
 * Tests if all modules of the refactored game framework load correctly
 */

(function() {
  // Track loaded modules
  const modules = {
    CanvasManager: typeof CanvasManager !== 'undefined',
    UIManager: typeof UIManager !== 'undefined',
    GameStateManager: typeof GameStateManager !== 'undefined',
    GameFramework: typeof GameFramework !== 'undefined',
    AbstractBaseGame: typeof AbstractBaseGame !== 'undefined',
    BaseGame: typeof BaseGame !== 'undefined',
    DiceGame: typeof DiceGame !== 'undefined',
    CardGame: typeof CardGame !== 'undefined'
  };
  
  // Log results
  console.log('%c Module Load Test Results', 'font-weight: bold; font-size: 14px; color: #3498db;');
  console.table(modules);
  
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('Module Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-moduleLoad';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }
  
  // Check for critical failures
  const criticalModules = ['GameFramework', 'AbstractBaseGame', 'BaseGame'];
  const criticalFailures = criticalModules.filter(module => !modules[module]);
  
  if (criticalFailures.length > 0) {
    console.error('%c CRITICAL ERROR: Some required modules failed to load!', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
    console.error('Missing critical modules:', criticalFailures.join(', '));
    
    // Check script order in index.html
    console.log('Please check the script loading order in index.html');
    
    // Try to identify the cause
    if (!modules.AbstractBaseGame && modules.BaseGame) {
      console.error('AbstractBaseGame must be loaded before BaseGame');
    }
    
    if (!modules.GameFramework) {
      console.error('Core framework modules may not be properly loaded. Check import order of CanvasManager, UIManager, GameStateManager');
    }
    
    // Mark test as failed
    markTestError('Critical modules failed to load: ' + criticalFailures.join(', '));
  } else {
    console.log('%c All critical modules loaded successfully!', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
    
    // Additional checks
    if (window.gameLoader && typeof window.gameLoader === 'object') {
      console.log('%c GameLoader instance exists in window', 'color: #2ecc71;');
    } else {
      console.warn('%c GameLoader instance not found in window', 'color: #f39c12;');
    }
    
    // Check inheritance
    if (modules.BaseGame && modules.AbstractBaseGame) {
      try {
        // Check inheritance relationship
        const inheritsCorrectly = BaseGame.prototype instanceof AbstractBaseGame;
        console.log('%c BaseGame inherits from AbstractBaseGame:', inheritsCorrectly ? 'Yes' : 'No', 'color:', inheritsCorrectly ? '#2ecc71' : '#e74c3c');
      } catch (e) {
        console.error('Error checking inheritance:', e);
      }
    }
  }
  
  return modules;
})();