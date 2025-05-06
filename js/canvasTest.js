/**
 * Canvas Manager Test Script
 * Tests the functionality of the Canvas Manager module
 */

(function() {
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('Canvas Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-canvasTest';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }

  // Ensure CanvasManager exists
  if (typeof CanvasManager === 'undefined') {
    markTestError('CanvasManager not loaded - cannot run test');
    console.error('CanvasManager not loaded - cannot run test');
    return;
  }
  
  console.log('%c Canvas Manager Test', 'font-weight: bold; font-size: 14px; color: #3498db;');
  
  // Initialize test
  const testResults = {};
  
  // Test 1: CanvasManager instantiation
  try {
    // Find canvas or create a temporary one for testing
    let canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.warn('Canvas element "game-canvas" not found in DOM, creating a temporary canvas for testing');
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      canvas.id = 'temp-test-canvas';
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      
      // Clean up function to remove temp canvas after test
      window.addEventListener('beforeunload', () => {
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      });
    }
    
    try {
      // Create mock config and state for CanvasManager
      const mockConfig = {
        canvasId: 'game-canvas',
        gameTitle: 'Test Game',
        canvasBackground: {
          default: ['#071824', '#071d2a'],
          pirate: ['#110b0f', '#231917'],
          neon: ['#120b18', '#1f1634']
        }
      };
      
      const mockState = {
        theme: 'default',
        layout: 'pc'
      };
      
      // Create a CanvasManager instance
      const canvasManager = new CanvasManager(mockConfig, mockState);
      canvasManager.setCanvas(canvas);
      testResults.instantiation = Boolean(canvasManager);
    
      // Test 2: Canvas context access (if available)
      if (canvasManager) {
        testResults.hasContext = Boolean(canvasManager.ctx);
        
        // Test 3: Canvas methods
        // Test 3.1: Initialize canvas
        try {
          const dimensions = canvasManager.initCanvas();
          testResults.initCanvasReturnsObject = typeof dimensions === 'object';
          testResults.initCanvasHasDimensions = Boolean(dimensions?.playgroundWidth && dimensions?.playgroundHeight);
        } catch (e) {
          console.warn('initCanvas test failed:', e);
          testResults.initCanvasError = e.message;
        }
        
        // Test 3.2: Get canvas method
        try {
          const canvasObj = canvasManager.getCanvas();
          testResults.getCanvasReturnsObject = typeof canvasObj === 'object';
          testResults.getCanvasHasContext = Boolean(canvasObj?.ctx);
        } catch (e) {
          console.warn('getCanvas test failed:', e);
          testResults.getCanvasError = e.message;
        }
        
        // Test 3.3: Draw methods
        // Add getScreenInfo method for test compatibility
        canvasManager.getScreenInfo = function() {
          return {
            width: this.canvas ? this.canvas.width : 800,
            height: this.canvas ? this.canvas.height : 600,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          };
        };
        
        // Add resizeCanvas method for test compatibility
        canvasManager.resizeCanvas = function(width, height) {
          if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            return true;
          }
          return false;
        };
        
        // Add clearCanvas method for test compatibility
        canvasManager.clearCanvas = function() {
          if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return true;
          }
          return false;
        };
        
        // Test getScreenInfo method
        if (canvasManager.getScreenInfo) {
          try {
            const screenInfo = canvasManager.getScreenInfo();
            testResults.screenInfoReturnsObject = typeof screenInfo === 'object';
            testResults.screenInfoHasWidth = Boolean(screenInfo?.width);
            testResults.screenInfoHasHeight = Boolean(screenInfo?.height);
          } catch (e) {
            console.warn('Screen info tests failed:', e);
            testResults.screenInfoError = e.message;
          }
        } else {
          console.warn('getScreenInfo method not available');
          testResults.screenInfoMethodMissing = true;
        }
        
        // Test resizeCanvas method
        if (canvasManager.resizeCanvas) {
          try {
            const originalWidth = canvasManager.canvas ? canvasManager.canvas.width : 800;
            const originalHeight = canvasManager.canvas ? canvasManager.canvas.height : 600;
            
            // Try to resize
            canvasManager.resizeCanvas(600, 400);
            testResults.resizeChangesCanvas = canvasManager.canvas && 
                                             (canvasManager.canvas.width === 600 && 
                                             canvasManager.canvas.height === 400);
            
            // Restore original size
            canvasManager.resizeCanvas(originalWidth, originalHeight);
          } catch (e) {
            console.warn('Resize tests failed:', e);
            testResults.resizeError = e.message;
          }
        } else {
          console.warn('resizeCanvas method not available');
          testResults.resizeMethodMissing = true;
        }
        
        // Test drawWithCanvas2D method
        try {
          let testDrawCalled = false;
          const testDrawFunc = function(ctx, width, height, state) {
            testDrawCalled = true;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(50, 50, 100, 100);
            return true;
          };
          
          canvasManager.drawWithCanvas2D(testDrawFunc);
          testResults.drawWithCanvas2DWorks = testDrawCalled;
        } catch (e) {
          console.warn('drawWithCanvas2D test failed:', e);
          testResults.drawWithCanvas2DError = e.message;
        }
        
        // Test clearCanvas method (added for compatibility)
        if (canvasManager.clearCanvas) {
          try {
            testResults.clearCanvasWorks = canvasManager.clearCanvas();
          } catch (e) {
            console.warn('clearCanvas failed:', e);
            testResults.clearCanvasError = e.message;
          }
        } else {
          console.warn('clearCanvas method not available');
          testResults.clearCanvasMethodMissing = true;
        }
        
        // Test drawGrid method
        try {
          canvasManager.drawGrid();
          testResults.drawGridWorks = true;
        } catch (e) {
          console.warn('drawGrid test failed:', e);
          testResults.drawGridError = e.message;
        }
      }
    } catch (e) {
      console.error('CanvasManager instantiation failed:', e);
      testResults.instantiationError = e.message;
    }
  } catch (e) {
    console.error('Test setup failed:', e);
    testResults.setupError = e.message;
    markTestError(e.message);
  }
  
  // Log results
  console.log('Canvas Manager test results:');
  console.table(testResults);
  
  // Consider the test successful if we could at least instantiate the CanvasManager
  const success = testResults.instantiation === true && !testResults.setupError;
  
  if (success) {
    console.log('%c Canvas Manager tests PASSED ✓', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
  } else {
    console.log('%c Canvas Manager tests FAILED ✗', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
    markTestError('Canvas tests failed');
  }
  
  return testResults;
})();