# Game Framework Testing Guide

This document provides instructions for testing the refactored Game Framework.

## Testing Overview

The testing suite includes specialized tests for each core module:

1. **Module Loading Test** - Verifies that all modules load correctly
2. **Canvas Manager Test** - Tests canvas rendering functionality
3. **PIXI Manager Test** - Tests PIXI.js integration with fallback mechanisms
4. **UI Manager Test** - Tests UI interactions and event handling
5. **Inheritance Test** - Verifies correct inheritance from AbstractBaseGame to BaseGame
6. **Game State Manager Test** - Tests game state management functions

## Running Tests

There are several ways to run the tests:

### Method 1: Using the Test Button in Settings

1. Open the framework in a browser
2. Click the "Settings" button (gear icon)
3. In the Development section, click "Run Tests"
4. A test results panel will appear showing the progress and results

### Method 2: Using the Browser Console

You can run tests manually from the browser console:

```javascript
// Run all tests
window.frameworkTestRunner.runAllTests();

// Or run a specific test
window.frameworkTestRunner.runTest('Module Loading', 'js/moduleLoadTest.js');
```

## Test Files

All test files are located in the `js/` directory:

- `moduleLoadTest.js` - Tests correct loading of all modules
- `canvasTest.js` - Tests Canvas Manager functionality
- `pixiTest.js` - Tests PIXI Manager functionality
- `uiTest.js` - Tests UI Manager functionality
- `inheritanceTest.js` - Tests inheritance relationships
- `gameStateTest.js` - Tests Game State Manager functionality
- `testSuite.js` - Main test runner that executes all tests

## Interpreting Results

Tests will display results in two places:

1. **Test Results Panel** - Visual display of all test results with pass/fail indicators
2. **Browser Console** - Detailed test output and error messages

A green checkmark (✓) indicates a passing test, while a red X (✗) indicates a failure.

## Common Issues

If tests are failing, check the following:

- **Module Loading Failures**: Make sure all script files are being loaded in the correct order in `index.html`
- **Canvas Test Failures**: Check if the `game-canvas` element exists in the DOM
- **PIXI Test Failures**: PIXI.js may not be available or may have compatibility issues (the framework will fall back to Canvas rendering)
- **Inheritance Issues**: Ensure that BaseGame properly extends AbstractBaseGame
- **UI Test Failures**: Verify that all required DOM elements exist with the expected IDs

## Adding New Tests

To add a new test:

1. Create a new test script in the `js/` directory
2. Follow the pattern of existing test scripts
3. Add the test to the `runAllTests` method in `testSuite.js`
4. Update the `totalTests` counter in the FrameworkTestRunner constructor

## Test Architecture

The testing architecture uses:

1. Browser-based testing for DOM elements and canvas rendering
2. Modular tests that can run independently
3. A central test runner (`testSuite.js`) that organizes and displays results
4. Test isolation via anonymous immediately-invoked function expressions
5. Visual feedback through a custom UI panel