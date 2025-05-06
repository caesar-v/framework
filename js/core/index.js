/**
 * Game Framework Core Module Index
 * 
 * This file serves as an entry point to the Game Framework core modules.
 * It exports all the core modules and provides a way to initialize them.
 */

// Ensure dependencies are loaded
(function() {
  // Core modules
  const modules = [
    'CanvasManager',
    'UIManager',
    'GameStateManager',
    'GameFramework'
  ];
  
  // Utility modules
  const utils = [
    '../utils/helpers'
  ];
  
  // Check if all modules are loaded
  const checkModules = () => {
    const missingModules = [];
    
    // Check core modules
    modules.forEach(module => {
      if (!window[module]) {
        missingModules.push(module);
      }
    });
    
    // Check utility modules
    utils.forEach(utilPath => {
      const utilName = utilPath.split('/').pop();
      // Capitalize first letter for global object name
      const objectName = utilName.charAt(0).toUpperCase() + utilName.slice(1);
      if (!window[objectName]) {
        missingModules.push(utilPath);
      }
    });
    
    return missingModules;
  };
  
  // Load a script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  };
  
  // Initialize the framework
  window.initGameFramework = async (options = {}) => {
    // Check for missing modules
    const missing = checkModules();
    
    // If there are missing modules, try to load them
    if (missing.length > 0) {
      console.log('Loading missing modules:', missing);
      
      try {
        // Load all missing modules in parallel
        await Promise.all(missing.map(module => {
          // Handle different module types
          if (module.includes('/')) {
            // Utility modules have paths
            return loadScript(`${module}.js`);
          } else {
            // Core modules are in the current directory
            return loadScript(`js/core/${module}.js`);
          }
        }));
        
        console.log('All modules loaded successfully');
      } catch (error) {
        console.error('Failed to load some modules:', error);
        throw new Error('Game Framework initialization failed: Could not load required modules');
      }
    }
    
    // Create a new game instance with the provided options
    return new window.GameFramework(options);
  };
  
  // Export the version
  window.GAME_FRAMEWORK_VERSION = '1.0.0';
  
  console.log('Game Framework Core initialized');
})();