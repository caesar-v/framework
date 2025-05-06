/**
 * Repair Layout Utility
 * This is a dedicated tool to fix layout issues after tests
 */

(function() {
  // Store original layout for restoration
  let originalLayout = null;
  
  // Save the original DOM structure before tests run
  window.saveOriginalLayout = function() {
    console.log('Saving original layout state');
    
    // Store container styles
    const container = document.getElementById('game-container');
    const outerContainer = document.querySelector('.outer-container');
    
    if (!container) return;
    
    // Capture popup structure info
    const menuOverlay = document.getElementById('menu-overlay');
    const popup = menuOverlay ? menuOverlay.querySelector('.popup') : null;
    const activeTabId = popup ? popup.querySelector('.popup-tab.active')?.dataset.tab : null;
    const popupTabs = Array.from(popup?.querySelectorAll('.popup-tab') || []);
    const tabContents = Array.from(popup?.querySelectorAll('.tab-content') || []);
    
    // Store game-content layout
    const gameContent = document.querySelector('.game-content');
    const gameContentStyle = gameContent ? gameContent.getAttribute('style') : '';
    
    // Store betting-zone info
    const bettingZone = document.querySelector('.betting-zone');
    const quickBets = bettingZone ? bettingZone.querySelector('.quick-bets') : null;
    
    originalLayout = {
      container: {
        element: container,
        className: container.className,
        style: { ...container.style }
      },
      body: {
        className: document.body.className
      },
      gameContent: {
        style: gameContentStyle,
        dataBaseStyle: gameContent ? gameContent.getAttribute('data-base-style') : '',
        dataMdStyle: gameContent ? gameContent.getAttribute('data-md-style') : ''
      },
      popupState: {
        overlay: menuOverlay ? menuOverlay.className : '',
        isOpen: menuOverlay ? menuOverlay.classList.contains('active') : false,
        popup: popup ? popup.cloneNode(true) : null,
        activeTabId: activeTabId,
        popupTabsCount: popupTabs.length,
        tabContentsCount: tabContents.length
      },
      quickBets: quickBets ? quickBets.cloneNode(true) : null
    };
    
    // Store the important children elements to preserve menu structure
    if (popup) {
      // Store all popup tabs inside originalLayout
      originalLayout.popupState.tabs = popupTabs.map(tab => ({
        id: tab.dataset.tab,
        isActive: tab.classList.contains('active'),
        text: tab.textContent
      }));
    }
    
    // Mark containers to prevent modification during tests
    if (container) container.dataset.layoutProtected = 'true';
    if (outerContainer) outerContainer.dataset.layoutProtected = 'true';
    if (popup) popup.dataset.layoutProtected = 'true';
    
    console.log('Original layout saved', originalLayout);
  };
  
  // Full reset of game container and related styles
  window.repairLayout = function() {
    console.log('Repairing layout after tests');
    
    // Fix all popup and overlay elements
    fixOverlayElements();
    
    // Fix grid layout issues
    fixGridLayout();
    
    // Fix popup menu positioning and visibility
    fixPopupMenu();
    
    // Remove all classes added during testing
    document.body.classList.remove('framework-testing');
    
    // Reset any transform or position:fixed that was added during tests
    resetPositionStyles();
    
    // Force a resize event after cleanup
    window.dispatchEvent(new Event('resize'));
    
    // If we have saved the original layout, use it
    if (originalLayout) {
      console.log('Restoring layout from saved state');
      
      // Restore container class
      const container = document.getElementById('game-container');
      if (container && originalLayout.container) {
        container.className = originalLayout.container.className;
      }
      
      // Restore body class
      if (originalLayout.body) {
        document.body.className = originalLayout.body.className;
      }
      
      // Restore popup state
      restorePopupState();
      
      // Restore quick bets section
      restoreQuickBets();
    }
    
    // Clean up any test-created mock elements
    removeMockElements();
    
    console.log('Layout repair complete');
  };
  
  // Fix overlay elements that may have been moved or broken
  function fixOverlayElements() {
    const overlay = document.getElementById('menu-overlay');
    
    // If overlay exists, fix it
    if (overlay) {
      // Reset all inline styles
      overlay.setAttribute('style', '');
      
      // Make sure overlay is directly in body
      if (overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
      }
      
      // Find popup inside overlay
      const popup = overlay.querySelector('.popup');
      
      if (popup) {
        // Clear all inline styles
        popup.setAttribute('style', '');
      } else {
        // If popup is missing, try to find it elsewhere
        const orphanedPopup = document.querySelector('.popup');
        if (orphanedPopup && orphanedPopup.parentElement !== overlay) {
          // Clear styles and move back to overlay
          orphanedPopup.setAttribute('style', '');
          overlay.appendChild(orphanedPopup);
        }
      }
    }
  }
  
  // Special function to reset any position: fixed or transform styles added by tests
  function resetPositionStyles() {
    // List of elements to check and reset
    const elementsToReset = [
      '.game-content',
      '.playground-zone',
      '.betting-zone',
      '.header',
      '.footer',
      '.overlay',
      '.popup',
      '.chat-panel',
      '.settings-panel'
    ];
    
    elementsToReset.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Remove all problematic inline styles
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.right = '';
        el.style.bottom = '';
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.width = '';
        el.style.height = '';
        el.style.maxWidth = '';
        el.style.maxHeight = '';
      });
    });
  }
  
  // Fix grid layout issues
  function fixGridLayout() {
    const gameContent = document.querySelector('.game-content');
    if (!gameContent) return;
    
    // Clear all inline styles to allow CSS to take effect
    gameContent.setAttribute('style', '');
    
    // Re-add the original data-attribute styles
    if (gameContent.hasAttribute('data-md-style')) {
      const mdStyle = gameContent.getAttribute('data-md-style');
      if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        gameContent.setAttribute('style', mdStyle);
      }
    }
    
    if (gameContent.hasAttribute('data-base-style')) {
      const baseStyle = gameContent.getAttribute('data-base-style');
      if (window.innerWidth <= 768) {
        gameContent.setAttribute('style', baseStyle);
      }
    }
  }
  
  // Restore popup state from saved state
  function restorePopupState() {
    if (!originalLayout || !originalLayout.popupState) return;
    
    const overlay = document.getElementById('menu-overlay');
    if (!overlay) return;
    
    // Reset all inline styles first
    overlay.setAttribute('style', '');
    
    // Restore overlay class
    if (originalLayout.popupState.overlay) {
      overlay.className = originalLayout.popupState.overlay;
    }
    
    // Restore popup state (open or closed)
    if (originalLayout.popupState.isOpen) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
    
    // If we have a saved popup DOM element, replace the current one
    if (originalLayout.popupState.popup) {
      // First, clear any existing popup
      while (overlay.firstChild) {
        overlay.removeChild(overlay.firstChild);
      }
      
      // Then add our saved popup
      const popupClone = originalLayout.popupState.popup.cloneNode(true);
      overlay.appendChild(popupClone);
      
      // Make sure the popup has correct styles - no test leftovers
      const popup = overlay.querySelector('.popup');
      if (popup) {
        popup.setAttribute('style', '');
      }
      
      // Ensure all classes for tabs are correct
      if (originalLayout.popupState.tabs && originalLayout.popupState.tabs.length > 0) {
        const tabs = overlay.querySelectorAll('.popup-tab');
        if (tabs && tabs.length > 0) {
          // First, remove active class from all tabs
          tabs.forEach(tab => tab.classList.remove('active'));
          
          // Now set the active tab based on saved state
          const activeTabInfo = originalLayout.popupState.tabs.find(tabInfo => tabInfo.isActive);
          if (activeTabInfo) {
            const activeTab = Array.from(tabs).find(tab => tab.dataset.tab === activeTabInfo.id);
            if (activeTab) {
              activeTab.classList.add('active');
              
              // Also update tab content visibility
              const tabContents = overlay.querySelectorAll('.tab-content');
              tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${activeTabInfo.id}-tab`) {
                  content.classList.add('active');
                }
              });
            }
          } else {
            // Default to first tab if no active tab found
            tabs[0].classList.add('active');
            const firstTabId = tabs[0].dataset.tab;
            if (firstTabId) {
              const tabContents = overlay.querySelectorAll('.tab-content');
              tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${firstTabId}-tab`) {
                  content.classList.add('active');
                }
              });
            }
          }
        }
      }
    }
    
    // If we have a game class with a UI manager that handles tabs, use it
    if (window.gameLoader && window.gameLoader.activeGame) {
      const game = window.gameLoader.activeGame.game || window.gameLoader.activeGame.framework;
      if (game && game.modules && game.modules.ui && typeof game.modules.ui.switchTab === 'function') {
        // Find the active tab
        const activeTabId = originalLayout.popupState.activeTabId || 'rules'; // Default to rules if none found
        try {
          // Try to use the UI manager to switch tabs
          game.modules.ui.switchTab(activeTabId);
        } catch (e) {
          console.error('Error using UI manager to switch tabs:', e);
        }
      }
    }
  }
  
  // Restore quick bets
  function restoreQuickBets() {
    if (!originalLayout || !originalLayout.quickBets) return;
    
    // Find the betting zone
    const bettingZone = document.querySelector('.betting-zone');
    if (!bettingZone) return;
    
    // Look for quick-bets container
    const quickBetsContainer = bettingZone.querySelector('.quick-bets');
    
    // If we found a container, replace it with our saved one
    if (quickBetsContainer) {
      // First check if it has the mock bet buttons (10, 20, 50, 100)
      let hasMockBets = false;
      const buttons = quickBetsContainer.querySelectorAll('.quick-bet');
      if (buttons.length >= 4) {
        buttons.forEach(button => {
          if (button.dataset.bet === '10' || button.dataset.bet === '20' || 
              button.dataset.bet === '50' || button.dataset.bet === '100') {
            hasMockBets = true;
          }
        });
      }
      
      // If it has mock bets or looks corrupted, replace it
      if (hasMockBets || buttons.length !== 3) { // Original has 3 buttons
        // Replace with original
        const parent = quickBetsContainer.parentElement;
        parent.removeChild(quickBetsContainer);
        parent.appendChild(originalLayout.quickBets.cloneNode(true));
        console.log('Restored original quick-bets container');
      }
    } else {
      // If no container found, try to add it back
      const parent = bettingZone.querySelector('.control-panel');
      if (parent) {
        parent.appendChild(originalLayout.quickBets.cloneNode(true));
        console.log('Re-added quick-bets container');
      }
    }
  }
  
  // Remove mock elements created by tests
  function removeMockElements() {
    console.log('Cleaning up mock elements from tests');
    
    // List of potential mock elements that should be removed
    // This list is based on elements created in uiTest.js
    const mockElements = [
      // Elements created in uiTest.js
      'quick-bets', // Container for quick bet buttons
      'popup-tabs', // Container for popup tabs in tests
      'tab-contents', // Container for tab contents in tests
    ];
    
    // List of potential mock bet buttons with specific values
    const mockQuickBetSelectors = [
      '.quick-bet[data-bet="10"]',
      '.quick-bet[data-bet="20"]',
      '.quick-bet[data-bet="50"]',
      '.quick-bet[data-bet="100"]'
    ];
    
    // Try to find and remove the mock containers first
    mockElements.forEach(id => {
      // Skip container IDs that are part of the real layout
      if (id === 'game-container') return;
      
      const element = document.getElementById(id);
      if (element) {
        // Check if this element is outside the main game container
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer || !gameContainer.contains(element)) {
          console.log(`Removing mock element: #${id}`);
          element.remove();
        }
      }
    });
    
    // Remove specific quick bet buttons with test values
    mockQuickBetSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Only remove if it's not inside the proper container
        const quickBetsContainer = document.querySelector('.betting-zone .quick-bets');
        if (!quickBetsContainer || !quickBetsContainer.contains(element)) {
          console.log(`Removing mock element: ${selector}`);
          element.remove();
        }
      });
    });
    
    // Check for any orphaned popup tabs and tab content
    ['.popup-tab', '.tab-content'].forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Check if this element is outside the proper container
        const properContainer = document.querySelector('.popup');
        if (!properContainer || !properContainer.contains(element)) {
          console.log(`Removing orphaned element: ${selector}`);
          element.remove();
        }
      });
    });
  }
  
  // Special function to fix popup menu issues after tests
  function fixPopupMenu() {
    // Get the menu overlay
    const menuOverlay = document.getElementById('menu-overlay');
    if (!menuOverlay) return;
    
    // Reset the overlay's position completely
    menuOverlay.style.position = '';
    menuOverlay.style.top = '';
    menuOverlay.style.left = '';
    menuOverlay.style.right = '';
    menuOverlay.style.bottom = '';
    menuOverlay.style.width = '';
    menuOverlay.style.height = '';
    menuOverlay.style.transform = '';
    menuOverlay.style.zIndex = '';
    
    // Make sure the overlay is a direct child of the body
    if (menuOverlay.parentElement !== document.body) {
      document.body.appendChild(menuOverlay);
      console.log('Moved menu-overlay back to body element');
    }
    
    // Find the popup inside the overlay
    const popup = menuOverlay.querySelector('.popup');
    if (!popup) {
      console.log('Could not find popup element inside menu-overlay');
      
      // Search for any popup element anywhere in the DOM
      const orphanedPopup = document.querySelector('.popup');
      if (orphanedPopup) {
        // Move it to the menu overlay
        menuOverlay.appendChild(orphanedPopup);
        console.log('Found orphaned popup and moved it to menu-overlay');
      } else {
        console.log('No popup element found in the document');
        return;
      }
    }
    
    // At this point we should have a popup element
    const popupElement = menuOverlay.querySelector('.popup');
    if (popupElement) {
      // Reset all popup styles completely
      popupElement.style.position = '';
      popupElement.style.top = '';
      popupElement.style.left = '';
      popupElement.style.right = '';
      popupElement.style.bottom = '';
      popupElement.style.width = '';
      popupElement.style.height = '';
      popupElement.style.transform = '';
      popupElement.style.zIndex = '';
      popupElement.style.display = '';
      popupElement.style.visibility = '';
      
      // Add important specific styles to guarantee popup is centered
      popupElement.style.position = 'relative';
      popupElement.style.margin = '50px auto';
      popupElement.style.maxWidth = '90%';
      
      console.log('Reset popup styling completely');
      
      // Also check all popup tabs and content
      const tabs = popupElement.querySelectorAll('.popup-tab');
      const contents = popupElement.querySelectorAll('.tab-content');
      
      // Make sure at least one tab is active
      let hasActiveTab = false;
      tabs.forEach(tab => {
        if (tab.classList.contains('active')) {
          hasActiveTab = true;
        }
      });
      
      // If no active tab, activate the first one
      if (!hasActiveTab && tabs.length > 0) {
        tabs[0].classList.add('active');
        
        // Also activate the corresponding content
        if (tabs[0].dataset.tab) {
          const contentId = `${tabs[0].dataset.tab}-tab`;
          const content = popupElement.querySelector(`#${contentId}`);
          if (content) {
            content.classList.add('active');
          }
        }
      }
      
      // Make sure at least one content is active
      let hasActiveContent = false;
      contents.forEach(content => {
        if (content.classList.contains('active')) {
          hasActiveContent = true;
        }
      });
      
      // If no active content, activate the first one
      if (!hasActiveContent && contents.length > 0) {
        contents[0].classList.add('active');
      }
    }
    
    // Force DOM reflow to apply changes
    void menuOverlay.offsetWidth;
  }
})();