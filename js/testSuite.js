/**
 * Game Framework Test Suite
 * Comprehensive test suite that runs all individual tests and reports results
 */

// Game Framework Test Suite Runner
class FrameworkTestRunner {
  constructor() {
    this.testResults = {};
    this.testsComplete = 0;
    this.totalTests = 5;
    this.startTime = 0;
    this.endTime = 0;
    
    // Create the test UI if it doesn't exist
    this.createTestUI();
  }
  
  /**
   * Create a simple test UI overlay
   */
  createTestUI() {
    // Check if test UI already exists
    if (document.getElementById('test-results-panel')) {
      return;
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'test-results-panel';
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 350px;
      max-height: 500px;
      background-color: rgba(40, 42, 54, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      color: #f8f8f2;
      font-family: monospace;
      z-index: 999;
      overflow-y: auto;
      transition: all 0.3s ease;
      pointer-events: none; /* Allow clicks to pass through when not interacting with content */
    `;
    
    // Create a container for the actual content that will receive clicks
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      pointer-events: auto; /* Re-enable pointer events for the actual content */
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background-color: #6272a4;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Framework Test Results';
    title.style.cssText = `
      margin: 0;
      color: #f8f8f2;
      font-size: 16px;
      font-weight: bold;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #f8f8f2;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    `;
    
    // Updated close behavior to hide panel instead of removing it
    // Also restore layout when closed
    closeButton.onclick = () => {
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
        // Refresh layout when closing the panel
        refreshLayout();
      }, 300);
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create content area
    const content = document.createElement('div');
    content.id = 'test-results-content';
    content.style.cssText = `
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      margin-bottom: 16px;
      background-color: #44475a;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'test-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      width: 0%;
      background-color: #50fa7b;
      transition: width 0.3s ease;
    `;
    
    progressContainer.appendChild(progressBar);
    
    // Create status text
    const status = document.createElement('div');
    status.id = 'test-status';
    status.textContent = 'Running tests...';
    status.style.cssText = `
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: bold;
    `;
    
    // Create results container
    const results = document.createElement('div');
    results.id = 'test-results';
    
    // Add components to content container in the proper order
    content.appendChild(progressContainer);
    content.appendChild(status);
    content.appendChild(results);
    
    // Add header and content to the inner container
    contentContainer.appendChild(header);
    contentContainer.appendChild(content);
    
    // Add inner container to main container
    container.appendChild(contentContainer);
    
    // Add to document
    document.body.appendChild(container);
  }
  
  /**
   * Update the test UI with current progress
   */
  updateUI() {
    const progressBar = document.getElementById('test-progress-bar');
    const status = document.getElementById('test-status');
    const results = document.getElementById('test-results');
    
    if (!progressBar || !status || !results) return;
    
    // Update progress bar
    const progress = (this.testsComplete / this.totalTests) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update status with more compact information
    status.textContent = this.testsComplete < this.totalTests 
      ? `Running tests... ${this.testsComplete}/${this.totalTests}`
      : `✅ Tests completed in ${Math.round(this.endTime - this.startTime)}ms`;
    
    if (this.testsComplete === this.totalTests) {
      // Make the panel more compact when done
      const panel = document.getElementById('test-results-panel');
      if (panel) {
        panel.style.maxHeight = '400px';
      }
      
      const content = document.getElementById('test-results-content');
      if (content) {
        content.style.maxHeight = '300px';
      }
    }
    
    // Clear results
    results.innerHTML = '';
    
    // Add test results in more compact format
    Object.entries(this.testResults).forEach(([testName, result]) => {
      const testItem = document.createElement('div');
      testItem.style.cssText = `
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        background-color: ${result.success ? 'rgba(80, 250, 123, 0.2)' : 'rgba(255, 85, 85, 0.2)'};
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const nameContainer = document.createElement('div');
      nameContainer.style.cssText = `flex: 1;`;
      
      const name = document.createElement('span');
      name.textContent = testName;
      name.style.cssText = `
        font-weight: bold;
        font-size: 13px;
      `;
      
      const indicator = document.createElement('span');
      indicator.textContent = result.success ? '✓' : '✗';
      indicator.style.cssText = `
        font-weight: bold;
        font-size: 15px;
        margin-left: 8px;
        color: ${result.success ? '#50fa7b' : '#ff5555'};
      `;
      
      nameContainer.appendChild(name);
      
      // Only show details if there was a failure 
      if (!result.success) {
        const details = document.createElement('div');
        details.style.cssText = `
          font-size: 11px;
          margin-top: 4px;
          color: #ff9580;
        `;
        details.textContent = result.details || 'Test failed';
        nameContainer.appendChild(details);
      }
      
      testItem.appendChild(nameContainer);
      testItem.appendChild(indicator);
      results.appendChild(testItem);
    });
    
    // Add summary if all tests are complete
    if (this.testsComplete === this.totalTests) {
      const allPassed = Object.values(this.testResults).every(result => result.success);
      
      const summary = document.createElement('div');
      summary.style.cssText = `
        margin-top: 10px;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        border-radius: 4px;
        background-color: ${allPassed ? 'rgba(80, 250, 123, 0.3)' : 'rgba(255, 85, 85, 0.3)'};
        color: ${allPassed ? '#50fa7b' : '#ff5555'};
      `;
      summary.textContent = allPassed ? 'All Tests Passed ✓' : 'Some Tests Failed ✗';
      
      results.appendChild(summary);
    }
  }
  
  /**
   * Run a test script and capture the result
   * @param {string} name - The name of the test
   * @param {string} scriptPath - The path to the test script
   * @returns {Promise} A promise that resolves when the test is complete
   */
  async runTest(name, scriptPath) {
    // Apply a fix for DOM hierarchy before running tests
    this.applyDOMHierarchyFix();
    return new Promise((resolve) => {
      console.log(`Running test: ${name}`);
      
      // Create a container for test markers in a way that doesn't affect layout
      if (!document.getElementById('test-markers-container')) {
        const markerContainer = document.createElement('div');
        markerContainer.id = 'test-markers-container';
        markerContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 0;
          height: 0;
          overflow: hidden;
          visibility: hidden;
        `;
        document.body.appendChild(markerContainer);
      }
      
      // Add timeout protection
      const timeoutId = setTimeout(() => {
        console.error(`Test ${name} timed out after 5 seconds`);
        
        this.testResults[name] = {
          success: false,
          details: `Test timed out after 5 seconds. This could indicate an error in the test script.`
        };
        
        // Create hidden element to track error in the marker container
        const errorMarker = document.createElement('div');
        errorMarker.className = `test-error-${name.replace(/\s/g, '')}`;
        document.getElementById('test-markers-container').appendChild(errorMarker);
        
        this.testsComplete++;
        this.updateUI();
        resolve();
      }, 5000); // 5 second timeout
      
      // Create script element
      const script = document.createElement('script');
      script.src = scriptPath;
      
      // Error handler for unhandled errors during test execution
      const errorHandler = (event) => {
        if (event.error) {
          console.error(`Unhandled error in test ${name}:`, event.error);
          
          this.testResults[name] = {
            success: false,
            details: `Unhandled error: ${event.error.message || 'Unknown error'}`
          };
          
          // Create hidden element to track error in the marker container
          const errorMarker = document.createElement('div');
          errorMarker.className = `test-error-${name.replace(/\s/g, '')}`;
          document.getElementById('test-markers-container').appendChild(errorMarker);
          
          window.removeEventListener('error', errorHandler);
          clearTimeout(timeoutId);
          this.testsComplete++;
          this.updateUI();
          resolve();
        }
      };
      
      // Listen for unhandled errors during test execution
      window.addEventListener('error', errorHandler);
      
      // Set up listener for when script is loaded
      script.onload = () => {
        console.log(`Completed test: ${name}`);
        
        // Clear timeout and error handler
        clearTimeout(timeoutId);
        window.removeEventListener('error', errorHandler);
        
        // We assume that the test script returns its results to the console
        // We can't directly access the return value of the script
        this.testResults[name] = {
          success: !document.querySelector(`.test-error-${name.replace(/\s/g, '')}`),
          details: `Successfully executed ${name} test`
        };
        
        this.testsComplete++;
        this.updateUI();
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`Failed to load test script: ${name}`, error);
        
        // Clear timeout and error handler
        clearTimeout(timeoutId);
        window.removeEventListener('error', errorHandler);
        
        this.testResults[name] = {
          success: false,
          details: `Failed to load test script: ${error.message || 'Unknown error'}`
        };
        
        // Create hidden element to track error in the marker container
        const errorMarker = document.createElement('div');
        errorMarker.className = `test-error-${name.replace(/\s/g, '')}`;
        document.getElementById('test-markers-container').appendChild(errorMarker);
        
        this.testsComplete++;
        this.updateUI();
        resolve();
      };
      
      // Add script to document to execute it
      document.body.appendChild(script);
      
      // Make sure the test UI is visible
      const panel = document.getElementById('test-results-panel');
      if (panel) {
        panel.style.display = 'block';
        setTimeout(() => {
          panel.style.opacity = '1';
        }, 10);
      }
    });
  }
  
  /**
   * Apply fix for DOM hierarchy issues during testing
   * This is needed to prevent popup from being inserted into canvas
   */
  applyDOMHierarchyFix() {
    // Fix popup modal placement if it gets moved 
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
      // Make sure overlay is a direct child of body
      const currentParent = overlay.parentElement;
      if (currentParent && currentParent.tagName !== 'BODY' && currentParent.id !== 'game-container') {
        // Move it back to body where it belongs
        document.body.appendChild(overlay);
        console.log('Fixed overlay hierarchy - moved back to body');
      }
      
      // Make sure popup is a direct child of overlay
      const popup = document.querySelector('.popup');
      if (popup && popup.parentElement !== overlay) {
        overlay.appendChild(popup);
        console.log('Fixed popup hierarchy - moved back to overlay');
      }
    }
    
    // Ensure we don't have any orphaned .popup or .overlay elements
    const orphanedPopups = document.querySelectorAll('.popup');
    orphanedPopups.forEach(popup => {
      if (popup.parentElement !== overlay && popup.parentElement !== document.body) {
        document.body.appendChild(popup);
        console.log('Fixed orphaned popup - moved to body');
      }
    });
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests() {
    // Reset state
    this.testResults = {};
    this.testsComplete = 0;
    this.startTime = performance.now();
    
    // Save original layout state before running tests
    if (typeof window.saveOriginalLayout === 'function') {
      window.saveOriginalLayout();
    }
    
    // Apply DOM hierarchy fixes before running tests
    this.applyDOMHierarchyFix();
    
    // Make sure test panel is shown with opacity transition
    const panel = document.getElementById('test-results-panel');
    if (panel) {
      panel.style.display = 'block';
      // Use setTimeout to create a smooth transition
      setTimeout(() => {
        panel.style.opacity = '1';
      }, 10);
      
      // Temporarily preserve any background elements with position:fixed
      this.preserveFixedElements();
    }
    
    this.updateUI();
    
    // Run each test in sequence
    await this.runTest('Module Loading', 'js/moduleLoadTest.js');
    await this.runTest('Canvas Manager', 'js/canvasTest.js');
    await this.runTest('UI Manager', 'js/uiTest.js');
    await this.runTest('Inheritance', 'js/inheritanceTest.js');
    await this.runTest('Game State Manager', 'js/gameStateTest.js');
    
    this.endTime = performance.now();
    
    // Summary
    const allPassed = Object.values(this.testResults).every(result => result.success);
    console.log(`%c All tests ${allPassed ? 'PASSED' : 'FAILED'}`, 
      `font-weight: bold; font-size: 16px; color: ${allPassed ? '#2ecc71' : '#e74c3c'};`);
    
    // Update UI with final results
    this.updateUI();
    
    // Restore any fixed elements we adjusted
    this.restoreFixedElements();
    
    return allPassed;
  }
  
  /**
   * Helper to preserve fixed elements during testing
   * This prevents z-index conflicts with the test panel
   */
  preserveFixedElements() {
    // Find elements that might be affected
    const fixedElements = document.querySelectorAll('.chat-panel, .settings-panel, .popup, .overlay');
    
    // Store their original z-index
    this.originalZIndexes = [];
    
    fixedElements.forEach(el => {
      // Store original state (including all style properties we'll modify)
      this.originalZIndexes.push({
        element: el,
        zIndex: el.style.zIndex,
        position: el.style.position,
        top: el.style.top,
        left: el.style.left,
        width: el.style.width,
        height: el.style.height,
        transform: el.style.transform
      });
      
      // Don't modify the overlay z-index at all - let it stay on top
      if (el.id === 'menu-overlay' || el.classList.contains('overlay')) {
        // Just ensure the popup inside isn't modified
        const popupInside = el.querySelector('.popup');
        if (popupInside) {
          this.originalZIndexes.push({
            element: popupInside,
            position: popupInside.style.position,
            top: popupInside.style.top,
            left: popupInside.style.left,
            width: popupInside.style.width,
            height: popupInside.style.height,
            transform: popupInside.style.transform
          });
        }
      } else {
        // For other elements, adjust z-index if needed
        const zIndex = parseInt(getComputedStyle(el).zIndex);
        if (!isNaN(zIndex) && zIndex > 900) {
          el.style.zIndex = '900';
        }
      }
    });
    
    // Add a special marker class to body to handle any CSS issues
    document.body.classList.add('framework-testing');
  }
  
  /**
   * Restore fixed elements to their original state
   */
  restoreFixedElements() {
    if (!this.originalZIndexes) return;
    
    this.originalZIndexes.forEach(item => {
      // Restore all saved properties
      item.element.style.zIndex = item.zIndex;
      item.element.style.position = item.position;
      item.element.style.top = item.top;
      item.element.style.left = item.left;
      item.element.style.width = item.width;
      item.element.style.height = item.height;
      item.element.style.transform = item.transform;
    });
    
    // Remove the special marker class
    document.body.classList.remove('framework-testing');
    
    // Make sure popup is properly positioned if it exists
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
      const popup = overlay.querySelector('.popup');
      if (popup) {
        // Reset position to center of overlay
        popup.style.position = '';
        popup.style.top = '';
        popup.style.left = '';
        popup.style.transform = '';
      }
    }
  }
}

// Create global instance so it can be accessed from the console
window.frameworkTestRunner = new FrameworkTestRunner();

// Helper function to refresh the layout after tests complete
function refreshLayout() {
  console.log('Refreshing layout after tests...');
  
  // Use the dedicated layout repair utility if available
  if (typeof window.repairLayout === 'function') {
    window.repairLayout();
    return; // Use the dedicated repair instead of the original code
  }
  
  // Fallback to original method if repair utility is not available
  // Access the frameworkTestRunner instance for cleanup methods
  if (window.frameworkTestRunner) {
    window.frameworkTestRunner.restoreFixedElements();
    window.frameworkTestRunner.applyDOMHierarchyFix();
  }
  // Trigger a small resize event to force layout recalculation
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  // Fix popup overlay and modal positioning
  const overlay = document.getElementById('menu-overlay');
  if (overlay) {
    // Reset the overlay styles
    overlay.style.position = '';
    overlay.style.top = '';
    overlay.style.left = '';
    overlay.style.right = '';
    overlay.style.bottom = '';
    overlay.style.width = '';
    overlay.style.height = '';
    overlay.style.transform = '';
    
    // Also fix any popup inside
    const popup = overlay.querySelector('.popup');
    if (popup) {
      popup.style.position = '';
      popup.style.top = '';
      popup.style.left = '';
      popup.style.width = '';
      popup.style.height = '';
      popup.style.transform = '';
    }
  }
  
  // Also fix any stray popups outside the overlay
  const allPopups = document.querySelectorAll('.popup');
  allPopups.forEach(popup => {
    if (!overlay || !overlay.contains(popup)) {
      popup.style.position = '';
      popup.style.top = '';
      popup.style.left = '';
      popup.style.width = '';
      popup.style.height = '';
      popup.style.transform = '';
    }
  });
  
  // Dispatch a custom resize event
  window.dispatchEvent(new Event('resize'));
  
  // If there's a responsive layout manager, explicitly call its handler
  if (window.responsiveLayoutManager && typeof window.responsiveLayoutManager.handleResize === 'function') {
    window.responsiveLayoutManager.handleResize();
  }
  
  // Ensure any game canvas is properly resized
  if (window.gameLoader && window.gameLoader.activeGame) {
    const game = window.gameLoader.activeGame.game || window.gameLoader.activeGame.framework;
    if (game) {
      if (typeof game.resizeCanvas === 'function') {
        game.resizeCanvas();
      }
      
      // If UIManager exists, rebuild popup menu
      if (game.modules && game.modules.ui) {
        // Recreate the popup tabs
        const popupTabs = document.querySelectorAll('.popup-tab');
        if (popupTabs && popupTabs.length > 0) {
          const firstTab = popupTabs[0];
          if (firstTab && typeof firstTab.dataset.tab === 'string') {
            try {
              game.modules.ui.switchTab(firstTab.dataset.tab);
            } catch (e) {
              console.error('Error resetting popup tabs:', e);
            }
          }
        }
      }
    }
  }
  
  console.log('Layout refreshed after tests');
}

// Не запускать тесты автоматически - только по нажатию кнопки
// Старый обработчик событий отключен, так как теперь используется testFramework.js

// Оставляем только функцию для восстановления лейаута для обратной совместимости
function legacyRefreshLayout() {
  console.log('Legacy layout refresh called');
  
  // First call our repair function
  refreshLayout();
  
  // Then force a full layout recalculation
  setTimeout(() => {
    // Force browser layout recalculation with a resize event
    window.dispatchEvent(new Event('resize'));
    
    // If we have responsive layout manager, call it explicitly
    if (window.responsiveLayoutManager && typeof window.responsiveLayoutManager.handleResize === 'function') {
      window.responsiveLayoutManager.handleResize();
    }
    
    // Explicitly fix popup again after a slight delay
    setTimeout(() => {
      console.log('Final popup menu fix attempt');
      if (typeof window.repairLayout === 'function') {
        window.repairLayout();
      }
      
      // Direct manual fix for popup as last resort
      const menuOverlay = document.getElementById('menu-overlay');
      if (menuOverlay) {
        // Make sure it's a direct child of body
        if (menuOverlay.parentElement !== document.body) {
          document.body.appendChild(menuOverlay);
        }
        
        // Reset all positions
        menuOverlay.style.position = 'fixed';
        menuOverlay.style.top = '0';
        menuOverlay.style.left = '0';
        menuOverlay.style.right = '0';
        menuOverlay.style.bottom = '0';
        menuOverlay.style.width = '100%';
        menuOverlay.style.height = '100%';
        
        // Find popup and reset its position
        const popup = menuOverlay.querySelector('.popup');
        if (popup) {
          popup.style.position = 'relative';
          popup.style.margin = '50px auto';
          popup.style.maxWidth = '90%';
          popup.style.transform = '';
        }
      }
      
      console.log('Layout fully repaired after tests');
    }, 200);
  }, 300);
}

// Экспортируем legacy функцию для обратной совместимости
window.legacyRefreshLayout = legacyRefreshLayout;

console.log('Test Suite module loaded (manual mode only)');

// Log setup completion
console.log('Framework Test Suite loaded');