/**
 * Module Path Resolver
 * Helps standardize paths for ES module imports in the framework
 */

(function() {
  console.log('Module Path Resolver: Initializing');
  
  // Get the base URL for the framework
  const getBaseUrl = () => {
    // Try to find framework script first
    const frameworkScript = document.querySelector('script[src*="modulePathResolver.js"]');
    if (frameworkScript) {
      const scriptUrl = new URL(frameworkScript.src);
      // Get the directory from the script URL
      const path = scriptUrl.pathname.split('/').slice(0, -2).join('/');
      return `${scriptUrl.origin}${path}`;
    }
    
    // Fallback to current location
    return window.location.origin;
  };
  
  const baseUrl = getBaseUrl();
  console.log(`Module Path Resolver: Base URL determined to be: ${baseUrl}`);
  
  // Add to window for global access
  window.modulePathResolver = {
    // Returns the full URL for a module path
    resolve: (path) => {
      if (path.startsWith('./') || path.startsWith('../')) {
        throw new Error('Module Path Resolver: Please use absolute paths with the resolver');
      }
      
      // Strip leading slash if exists
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      
      return `${baseUrl}/${path}`;
    },
    
    // Helper to dynamically import a module with proper path resolution
    import: async (path) => {
      const fullPath = window.modulePathResolver.resolve(path);
      console.log(`Module Path Resolver: Importing ${fullPath}`);
      try {
        return await import(fullPath);
      } catch (error) {
        console.error(`Module Path Resolver: Error importing ${fullPath}`, error);
        throw error;
      }
    },
    
    // Base URL determined by the script location
    baseUrl,
  };
  
  console.log('Module Path Resolver: Initialization complete');
})();