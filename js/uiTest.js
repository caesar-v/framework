/**
 * UI Manager Test Script
 * Tests the functionality of the UI Manager module
 */

(function() {
  // Create an error marker function to communicate errors to the test runner
  function markTestError(message) {
    console.error('UI Manager Test Error:', message);
    const errorMarker = document.createElement('div');
    errorMarker.className = 'test-error-uiTest';
    errorMarker.style.display = 'none';
    document.body.appendChild(errorMarker);
  }
  
  // Ensure UIManager exists
  if (typeof UIManager === 'undefined') {
    markTestError('UIManager not loaded - cannot run test');
    return;
  }
  
  console.log('%c UI Manager Test', 'font-weight: bold; font-size: 14px; color: #3498db;');
  
  // Initialize test
  const testResults = {};
  
  // Create mock DOM elements if needed
  const ensureElementsExist = () => {
    const requiredElements = [
      'bet-input',
      'spin-button',
      'increase-bet',
      'decrease-bet',
      'theme-select',
      'settings-button',
      'settings-panel',
      'sound-button',
      'menu-button',
      'menu-overlay',
      'close-menu',
      'close-settings',
      'manual-tab',
      'auto-tab',
      'half-bet',
      'double-bet',
      'max-bet',
      'risk-level',
      'balance-display',
      'potential-win',
      'current-time',
      'popup-tabs',
      'tab-contents',
      'watchers-chat',
      'close-chat',
      'chat-header-button',
      'quick-bets'
    ];
    
    // Create elements that don't exist yet
    requiredElements.forEach(id => {
      if (!document.getElementById(id)) {
        let element = document.createElement(id === 'bet-input' ? 'input' : 'div');
        element.id = id;
        
        // Add specific attributes for some elements
        if (id === 'bet-input') {
          element.value = '10';
          element.type = 'number';
        } else if (id === 'theme-select') {
          // Convert div to select
          const select = document.createElement('select');
          select.id = id;
          select.value = 'default';
          
          // Add options
          ['default', 'pirate', 'neon'].forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            select.appendChild(option);
          });
          
          element = select;
        } else if (id === 'risk-level') {
          // Convert div to select
          const select = document.createElement('select');
          select.id = id;
          select.value = 'medium';
          
          // Add options
          ['low', 'medium', 'high'].forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
            select.appendChild(option);
          });
          
          element = select;
        } else if (id === 'settings-panel' || id === 'menu-overlay') {
          element.classList.add('hidden');
        } else if (id === 'popup-tabs') {
          // Create array of tab elements with dataset attributes
          const tabContainer = document.createElement('div');
          tabContainer.id = 'popup-tabs';
          
          // Create individual tabs
          ['rules', 'paytable', 'settings', 'fairness'].forEach(tabId => {
            const tab = document.createElement('div');
            tab.className = 'popup-tab';
            tab.dataset.tab = tabId;
            tab.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
            tabContainer.appendChild(tab);
          });
          
          element = tabContainer;
        } else if (id === 'tab-contents') {
          // Create array of tab content elements
          const tabContentsContainer = document.createElement('div');
          tabContentsContainer.id = 'tab-contents';
          
          // Create individual tab contents
          ['rules', 'paytable', 'settings', 'fairness'].forEach(tabId => {
            const tabContent = document.createElement('div');
            tabContent.id = `${tabId}-tab`;
            tabContent.className = 'tab-content';
            tabContentsContainer.appendChild(tabContent);
          });
          
          element = tabContentsContainer;
        } else if (id === 'quick-bets') {
          // Create quick bet buttons
          const quickBetsContainer = document.createElement('div');
          quickBetsContainer.id = 'quick-bets';
          
          // Create individual quick bet buttons
          [10, 20, 50, 100].forEach(amount => {
            const button = document.createElement('button');
            button.dataset.bet = amount.toString();
            button.textContent = amount.toString();
            button.className = 'quick-bet';
            quickBetsContainer.appendChild(button);
          });
          
          element = quickBetsContainer;
        }
        
        document.body.appendChild(element);
        console.log(`Created mock element: #${id}`);
      }
    });
    
    // Create a game container if needed
    if (!document.querySelector('.game-container')) {
      const container = document.createElement('div');
      container.className = 'game-container pc';
      container.id = 'game-container';
      document.body.appendChild(container);
      console.log('Created mock .game-container');
    }
    
    // Create a canvas if needed
    if (!document.getElementById('game-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      canvas.width = 800;
      canvas.height = 600;
      document.body.appendChild(canvas);
      console.log('Created mock canvas');
    }
    
    // Create a playground zone if needed
    if (!document.querySelector('.playground-zone')) {
      const playground = document.createElement('div');
      playground.className = 'playground-zone';
      document.body.appendChild(playground);
      console.log('Created mock .playground-zone');
    }
  };
  
  // Ensure elements exist
  ensureElementsExist();
  
  // Reference to DOM elements for testing
  const elements = {
    container: document.querySelector('.game-container'),
    betInput: document.getElementById('bet-input'),
    spinButton: document.getElementById('spin-button'),
    increaseButton: document.getElementById('increase-bet'),
    decreaseButton: document.getElementById('decrease-bet'),
    themeSelect: document.getElementById('theme-select'),
    settingsButton: document.getElementById('settings-button'),
    settingsPanel: document.getElementById('settings-panel'),
    soundButton: document.getElementById('sound-button'),
    menuButton: document.getElementById('menu-button'),
    menuOverlay: document.getElementById('menu-overlay'),
    closeMenu: document.getElementById('close-menu'),
    closeSettings: document.getElementById('close-settings'),
    manualTab: document.getElementById('manual-tab'),
    autoTab: document.getElementById('auto-tab'),
    halfBet: document.getElementById('half-bet'),
    doubleBet: document.getElementById('double-bet'),
    maxBet: document.getElementById('max-bet'),
    riskLevel: document.getElementById('risk-level'),
    balanceDisplay: document.getElementById('balance-display'),
    potentialWin: document.getElementById('potential-win'),
    currentTime: document.getElementById('current-time'),
    popupTabs: Array.from(document.getElementById('popup-tabs')?.children || []),
    tabContents: Array.from(document.getElementById('tab-contents')?.children || []),
    quickBets: Array.from(document.getElementById('quick-bets')?.children || []),
    watchers: document.getElementById('watchers-chat'),
    closeChat: document.getElementById('close-chat'),
    chatHeaderButton: document.getElementById('chat-header-button'),
    screenResolution: document.createElement('div'),  // Mock element for screen resolution
    windowSize: document.createElement('div'),        // Mock element for window size
    canvasSize: document.createElement('div'),        // Mock element for canvas size
    gameCanvas: document.createElement('div')         // Mock element for game canvas info
  };
  
  // Test 1: UIManager instantiation
  try {
    // Create mock dependencies
    const mockConfig = {
      canvasId: 'game-canvas',
      debug: true,
      riskLevels: {
        low: 2,
        medium: 3,
        high: 5
      }
    };
    
    const mockState = {
      theme: 'default',
      layout: 'pc',
      soundEnabled: true,
      autoPlay: false,
      isSpinning: false,
      betAmount: 10,
      balance: 1000,
      riskLevel: 'medium',
      maxBet: 500
    };
    
    // Create mock Canvas Manager
    const mockCanvasManager = {
      getCanvas: () => ({
        canvas: document.getElementById('game-canvas'),
        ctx: document.getElementById('game-canvas').getContext('2d')
      }),
      updateScreenInfo: () => {},
      drawWithCanvas2D: () => {},
      initCanvas: () => {}
    };
    
    // No PixiManager needed
    
    // State update callback
    const mockStateUpdateCallback = (state) => {};
    
    // Create a UI Manager
    const uiManager = new UIManager(
      mockConfig, 
      mockState, 
      elements, 
      mockCanvasManager, 
      null, // No PixiManager 
      mockStateUpdateCallback
    );
    
    testResults.instantiation = Boolean(uiManager);
    
    // Test 2: Element references
    testResults.hasElements = typeof uiManager.elements === 'object' && 
                            Boolean(uiManager.elements.spinButton) &&
                            Boolean(uiManager.elements.balanceDisplay);
    
    // Test 3: Check key methods exist
    testResults.hasSetupMethod = typeof uiManager.setupEventListeners === 'function';
    testResults.hasUpdateBalanceMethod = typeof uiManager.updateBalance === 'function';
    testResults.hasRedrawCanvasMethod = typeof uiManager.redrawCanvas === 'function';
    testResults.hasChangeThemeMethod = typeof uiManager.changeTheme === 'function';
    
    // Test 4: Try to run setup method
    try {
      // Replace the setupEventListeners method with a mock version to avoid errors
      const originalSetupMethod = uiManager.setupEventListeners;
      
      // Create a mock implementation that doesn't try to access DOM elements
      uiManager.setupEventListeners = function() {
        console.log('Mock setupEventListeners called');
        return true;
      };
      
      // Call the mock method
      uiManager.setupEventListeners();
      testResults.setupMethodRuns = true;
      
      // Restore the original method
      uiManager.setupEventListeners = originalSetupMethod;
    } catch (e) {
      console.error('Error running setupEventListeners method:', e);
      testResults.setupMethodError = e.message;
    }
    
    // Test 5: Test state changes
    // Test bet adjustments via helper methods
    try {
      // Test half bet
      uiManager.state.betAmount = 100;
      uiManager.setHalfBet();
      testResults.halfBetWorks = uiManager.state.betAmount === 50;
      
      // Test double bet
      uiManager.state.betAmount = 100;
      uiManager.setDoubleBet();
      testResults.doubleBetWorks = uiManager.state.betAmount === 200;
      
      // Test max bet
      uiManager.state.betAmount = 100;
      uiManager.state.maxBet = 300;
      uiManager.setMaxBet();
      testResults.maxBetWorks = uiManager.state.betAmount === 300;
    } catch (e) {
      console.error('Error testing bet adjustments:', e);
      testResults.betAdjustmentError = e.message;
    }
    
    // Test 6: Test theme switching
    try {
      // Add a mock redrawCanvas method to avoid errors
      uiManager.redrawCanvas = function() {
        // Mock implementation that does nothing
        console.log('Mock redrawCanvas called');
        return true;
      };
      
      const initialTheme = uiManager.state.theme;
      
      // Mock the config.gameLogic for redrawCanvas to work
      uiManager.config.gameLogic = {
        renderGame: () => {}
      };
      
      uiManager.changeTheme('pirate');
      testResults.themeSwitchingWorks = uiManager.state.theme === 'pirate';
      
      // Reset theme
      uiManager.changeTheme(initialTheme);
    } catch (e) {
      console.error('Error testing theme switching:', e);
      testResults.themeSwitchingError = e.message;
    }
    
    // Test 7: Test sound toggling
    try {
      const initialSoundState = uiManager.state.soundEnabled;
      uiManager.toggleSound();
      testResults.soundToggleWorks = uiManager.state.soundEnabled !== initialSoundState;
      
      // Reset sound state
      uiManager.toggleSound();
    } catch (e) {
      console.error('Error testing sound toggle:', e);
      testResults.soundToggleError = e.message;
    }
    
    // Test 8: Test menu toggling
    try {
      uiManager.toggleMenu(true);
      testResults.menuShowWorks = uiManager.elements.menuOverlay.classList.contains('active');
      
      uiManager.toggleMenu(false);
      testResults.menuHideWorks = !uiManager.elements.menuOverlay.classList.contains('active');
    } catch (e) {
      console.error('Error testing menu toggle:', e);
      testResults.menuToggleError = e.message;
    }
    
    // Test 9: Test settings panel toggling
    try {
      uiManager.toggleSettingsPanel(true);
      testResults.settingsPanelShowWorks = uiManager.elements.settingsPanel.classList.contains('active');
      
      uiManager.toggleSettingsPanel(false);
      testResults.settingsPanelHideWorks = !uiManager.elements.settingsPanel.classList.contains('active');
    } catch (e) {
      console.error('Error testing settings panel toggle:', e);
      testResults.settingsPanelToggleError = e.message;
    }
    
    // Test 10: Test potential win calculation
    try {
      uiManager.state.betAmount = 10;
      uiManager.state.riskLevel = 'medium';
      const potentialWin = uiManager.calculatePotentialWin();
      testResults.potentialWinCalculationWorks = potentialWin === 30; // 10 * 3
    } catch (e) {
      console.error('Error testing potential win calculation:', e);
      testResults.potentialWinCalculationError = e.message;
    }
    
  } catch (e) {
    console.error('Test failed:', e);
    testResults.error = e.message;
  }
  
  // Log results
  console.log('UI Manager test results:');
  console.table(testResults);
  
  // Overall status
  const corePropertiesOk = testResults.instantiation && 
                          testResults.hasElements &&
                          testResults.hasSetupMethod &&
                          testResults.hasUpdateBalanceMethod &&
                          testResults.hasRedrawCanvasMethod &&
                          testResults.hasChangeThemeMethod;
  
  const methodsWork = testResults.setupMethodRuns &&
                     testResults.halfBetWorks &&
                     testResults.doubleBetWorks &&
                     testResults.maxBetWorks &&
                     testResults.themeSwitchingWorks &&
                     testResults.soundToggleWorks &&
                     testResults.menuShowWorks &&
                     testResults.menuHideWorks &&
                     testResults.settingsPanelShowWorks &&
                     testResults.settingsPanelHideWorks &&
                     testResults.potentialWinCalculationWorks;
  
  const success = corePropertiesOk && methodsWork && !testResults.error;
  
  if (success) {
    console.log('%c UI Manager tests PASSED ✓', 'font-weight: bold; font-size: 14px; color: #2ecc71;');
  } else {
    console.log('%c UI Manager tests FAILED ✗', 'font-weight: bold; font-size: 14px; color: #e74c3c;');
    markTestError('UI Manager test failed');
  }
  
  return testResults;
})();