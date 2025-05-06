/**
 * Inheritance Test Script
 * Tests the inheritance relationship between AbstractBaseGame and BaseGame
 */

(function() {
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('Inheritance Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-inheritanceTest';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }
  
  // Ensure both classes exist
  if (typeof AbstractBaseGame === 'undefined') {
    markTestError('AbstractBaseGame not loaded - cannot run test');
    return;
  }
  
  if (typeof BaseGame === 'undefined') {
    markTestError('BaseGame not loaded - cannot run test');
    return;
  }
  
  console.log('%c Game Class Inheritance Test', 'font-weight: bold; font-size: 14px; color: #3498db;');
  
  // Initialize test
  const testResults = {};
  
  // Test 1: Check inheritance relationship
  try {
    // Check BaseGame extends AbstractBaseGame using constructor check
    testResults.inheritsCorrectly = Object.getPrototypeOf(BaseGame) === AbstractBaseGame;
    
    // Also verify instance inheritance for instance objects
    const mockConfig = { canvasId: 'game-canvas' };
    const fakeInstance = Object.create(BaseGame.prototype);
    testResults.instanceInheritsCorrectly = fakeInstance instanceof AbstractBaseGame;
    
    // Report the result
    console.log(
      testResults.inheritsCorrectly || testResults.instanceInheritsCorrectly
        ? 'BaseGame correctly inherits from AbstractBaseGame'
        : 'ERROR: BaseGame does not inherit from AbstractBaseGame'
    );
    
  } catch (e) {
    console.error('Inheritance check failed:', e);
    testResults.inheritanceCheckError = e.message;
  }
  
  // Test 2: Verify AbstractBaseGame cannot be instantiated directly
  try {
    // This should throw an error about instantiating an abstract class
    const abstractInstance = new AbstractBaseGame();
    testResults.abstractClassPreventsInstantiation = false;
    console.error('ERROR: Was able to instantiate AbstractBaseGame!');
  } catch (e) {
    // This is expected behavior - it should throw an error
    testResults.abstractClassPreventsInstantiation = true;
    testResults.abstractClassErrorMessage = e.message;
    console.log('Correctly prevented direct instantiation of AbstractBaseGame');
  }
  
  // Test 3: Check if BaseGame can be instantiated 
  try {
    // Get canvas element (or create one if needed)
    let canvas = document.getElementById('game-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      document.body.appendChild(canvas);
      console.warn('Created temporary canvas for testing');
    }
    
    // Define a fake GameFramework constructor if it doesn't exist
    if (typeof GameFramework === 'undefined') {
      window.GameFramework = function(config) {
        this.config = config;
        this.elements = {};
        this.setupEventListeners = function() {};
        console.log('Created mock GameFramework for testing');
        return this;
      };
    }
    
    // Create a config object for BaseGame
    const mockConfig = {
      canvasId: 'game-canvas',
      gameTitle: 'Test Game',
      usePixi: false,
      debug: true
    };
    
    // Instantiate BaseGame
    const baseGameInstance = new BaseGame(mockConfig);
    testResults.baseGameCanBeInstantiated = Boolean(baseGameInstance);
    
    // Check if instance has expected properties
    testResults.hasExpectedProperties = Boolean(
      baseGameInstance.config && 
      typeof baseGameInstance.spin === 'function' &&
      typeof baseGameInstance.calculateWin === 'function' &&
      typeof baseGameInstance.renderGame === 'function'
    );
    
  } catch (e) {
    console.error('BaseGame instantiation failed:', e);
    testResults.baseGameError = e.message;
  }
  
  // Test 4: Method override testing
  try {
    // Get all method names from AbstractBaseGame prototype
    const abstractMethods = Object.getOwnPropertyNames(AbstractBaseGame.prototype)
      .filter(name => typeof AbstractBaseGame.prototype[name] === 'function' && name !== 'constructor');
    
    // Check that BaseGame implements or inherits all abstract methods
    const baseGameMethods = Object.getOwnPropertyNames(BaseGame.prototype)
      .filter(name => typeof BaseGame.prototype[name] === 'function' && name !== 'constructor');
    
    // All abstract methods should be available in BaseGame
    const missingMethods = abstractMethods.filter(method => !baseGameMethods.includes(method));
    testResults.implementsAllAbstractMethods = missingMethods.length === 0;
    
    if (!testResults.implementsAllAbstractMethods) {
      console.error('BaseGame is missing implementations for these abstract methods:', missingMethods);
      testResults.missingMethods = missingMethods;
    } else {
      console.log('BaseGame correctly implements all AbstractBaseGame methods');
    }
    
  } catch (e) {
    console.error('Method check failed:', e);
    testResults.methodCheckError = e.message;
  }
  
  // Log results
  console.log('Inheritance test results:');
  console.table(testResults);
  
  // Overall status
  const success = (testResults.inheritsCorrectly || testResults.instanceInheritsCorrectly) && 
                  testResults.abstractClassPreventsInstantiation && 
                  testResults.baseGameCanBeInstantiated && 
                  testResults.implementsAllAbstractMethods && 
                  !testResults.inheritanceCheckError && 
                  !testResults.methodCheckError;
  
  if (success) {
    console.log('%c Inheritance tests PASSED ✓', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
  } else {
    console.log('%c Inheritance tests FAILED ✗', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
  }
  
  return testResults;
})();