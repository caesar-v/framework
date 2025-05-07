/**
 * IGame Interface Test Script
 * Tests that games implement the required IGame interface methods
 */

(function() {
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('IGame Interface Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-inheritanceTest';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }
  
  // Ensure classes exist
  if (typeof DiceGame === 'undefined') {
    markTestError('DiceGame not loaded - cannot run test');
    return;
  }
  
  if (typeof CardGame === 'undefined') {
    markTestError('CardGame not loaded - cannot run test');
    return;
  }
  
  console.log('%c IGame Interface Implementation Test', 'font-weight: bold; font-size: 14px; color: #3498db;');
  
  // Initialize test
  const testResults = {};
  
  // Required methods that all IGame implementations should have
  const requiredMethods = [
    'initialize',
    'start',
    'pause', 
    'resume',
    'destroy',
    'performAction',
    'resize',
    'updateSettings',
    'calculatePotentialWin',
    'getState',
    'setState',
    'getInfo',
    'supportsFeature',
    'getAvailableEvents',
    'addEventListener',
    'removeEventListener'
  ];
  
  // Test 1: Check if DiceGame implements all required methods
  try {
    const diceGame = new DiceGame();
    const diceGameMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(diceGame))
      .filter(name => typeof diceGame[name] === 'function');
    
    const missingDiceMethods = requiredMethods.filter(method => !diceGameMethods.includes(method));
    testResults.diceGameImplementsAllMethods = missingDiceMethods.length === 0;
    
    if (!testResults.diceGameImplementsAllMethods) {
      console.error('DiceGame is missing implementations for these IGame methods:', missingDiceMethods);
      testResults.missingDiceMethods = missingDiceMethods;
    } else {
      console.log('DiceGame correctly implements all IGame interface methods');
    }
  } catch (e) {
    console.error('DiceGame test failed:', e);
    testResults.diceGameError = e.message;
  }
  
  // Test 2: Check if CardGame implements all required methods
  try {
    const cardGame = new CardGame();
    const cardGameMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(cardGame))
      .filter(name => typeof cardGame[name] === 'function');
    
    const missingCardMethods = requiredMethods.filter(method => !cardGameMethods.includes(method));
    testResults.cardGameImplementsAllMethods = missingCardMethods.length === 0;
    
    if (!testResults.cardGameImplementsAllMethods) {
      console.error('CardGame is missing implementations for these IGame methods:', missingCardMethods);
      testResults.missingCardMethods = missingCardMethods;
    } else {
      console.log('CardGame correctly implements all IGame interface methods');
    }
  } catch (e) {
    console.error('CardGame test failed:', e);
    testResults.cardGameError = e.message;
  }
  
  // Log results
  console.log('IGame interface test results:');
  console.table(testResults);
  
  // Overall status
  const success = testResults.diceGameImplementsAllMethods && 
                 testResults.cardGameImplementsAllMethods && 
                 !testResults.diceGameError && 
                 !testResults.cardGameError;
  
  if (success) {
    console.log('%c IGame interface tests PASSED ✓', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
  } else {
    console.log('%c IGame interface tests FAILED ✗', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
    markTestError('Some games do not fully implement the IGame interface');
  }
  
  return testResults;
})();