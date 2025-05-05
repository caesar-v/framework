/**
 * PixiJS Helper Utilities
 * Provides integration between the Game Framework and PixiJS
 */

(function() {
  // Create a global object to hold Pixi helper methods
  window.PixiHelper = {
    /**
     * Initialize a PIXI application with the given canvas
     * @param {HTMLCanvasElement} canvas - The canvas element to use
     * @param {Object} options - Options for the PIXI application
     * @returns {PIXI.Application} - The PIXI application instance
     */
    initApp: function(canvas, options = {}) {
      if (!canvas) {
        console.error('PixiHelper.initApp: Canvas element not provided');
        return null;
      }
      
      // Make sure PIXI is available
      if (!window.PIXI) {
        console.error('PixiHelper.initApp: PIXI is not loaded');
        return null;
      }

      try {
        // Default options - PIXI v8 format
        const defaultOptions = {
          width: canvas.width,
          height: canvas.height,
          backgroundColor: 0x071d2a,
          canvas: canvas, // PIXI v8 uses canvas instead of view
          resolution: window.devicePixelRatio || 1,
          antialias: true,
          // For PIXI v8, explicitly set preference to allow canvas fallback
          preference: 'webgl2,webgl,canvas'
        };
        
        // Merge with provided options
        const appOptions = Object.assign({}, defaultOptions, options);
        
        let app;
        let initSuccess = false;
        
        // Try to create the app using PIXI v8 syntax first
        try {
          console.log('Attempting PIXI v8 initialization (2-step init)');
          // PIXI v8 syntax - separate creation and init
          app = new PIXI.Application();
          app.init(appOptions);
          console.log('PIXI v8 initialization successful');
          initSuccess = true;
        } catch (v8Error) {
          console.warn('PIXI v8 initialization failed:', v8Error);
        }
        
        // If v8 style failed, try a simple Canvas-only renderer
        if (!initSuccess) {
          try {
            console.log('Creating Canvas renderer directly');
            
            // Try to create a Canvas renderer for PIXI v8
            if (PIXI.CanvasRenderer) {
              // Some versions of PIXI v8 handle options differently, need to be careful
              const rendererOptions = {
                width: canvas.width,
                height: canvas.height,
                backgroundAlpha: 1.0
              };
              
              // For v8+, canvas param might be different from older versions
              if (PIXI.VERSION && PIXI.VERSION.startsWith('8')) {
                rendererOptions.canvas = canvas; // v8 style
              } else {
                rendererOptions.view = canvas; // older style
              }
              
              // Add background color if provided
              if (appOptions.backgroundColor !== undefined) {
                rendererOptions.background = appOptions.backgroundColor;
              }
              
              const renderer = new PIXI.CanvasRenderer(rendererOptions);
              
              // Create a manual app-like object with this renderer
              app = {
                renderer: renderer,
                stage: new PIXI.Container(),
                render: function() {
                  if (this.renderer && this.stage) {
                    this.renderer.render(this.stage);
                  }
                },
                // Add basic destroy method
                destroy: function() {
                  try {
                    if (this.stage) {
                      this.stage.destroy({ children: true });
                    }
                    if (this.renderer) {
                      this.renderer.destroy();
                    }
                  } catch(e) {
                    console.warn('Error destroying manual PIXI app:', e);
                  }
                }
              };
              
              console.log('Manual Canvas renderer created successfully');
              initSuccess = true;
            } else {
              console.warn('PIXI.CanvasRenderer not available, trying fallback...');
              throw new Error('CanvasRenderer not available');
            }
          } catch (canvasError) {
            console.warn('Canvas renderer failed:', canvasError);
          }
        }
        
        // If all PIXI v8 approaches failed, try modern then legacy syntax
        if (!initSuccess) {
          try {
            console.log('Trying modern PIXI v5-v7 syntax');
            // Convert options for v5-v7
            const modernOptions = {...appOptions};
            modernOptions.view = canvas; // v5-v7 uses view instead of canvas
            delete modernOptions.canvas;
            
            app = new PIXI.Application(modernOptions);
            console.log('PIXI v5-v7 initialization successful');
            initSuccess = true;
          } catch (modernError) {
            console.warn('Modern PixiJS initialization failed:', modernError);
            
            try {
              console.log('Trying legacy PIXI v4 syntax');
              // Legacy PIXI v4 syntax (separate parameters)
              app = new PIXI.Application(
                canvas.width,
                canvas.height,
                { 
                  view: canvas, 
                  backgroundColor: appOptions.backgroundColor
                }
              );
              console.log('PIXI v4 initialization successful');
              initSuccess = true;
            } catch (legacyError) {
              console.error('All PIXI initialization approaches failed:', legacyError);
              return null;
            }
          }
        }
        
        // If we have a valid app, set up resize handlers
        if (app && (app.renderer || app.view || app.canvas)) {
          const resizeHandler = () => {
            if (!app || (!app.renderer && !app.resize) || !canvas) return;
            
            try {
              console.log('Resizing PIXI renderer to', canvas.width, 'x', canvas.height);
              
              // Handle different PIXI versions
              if (typeof app.resize === 'function') {
                // PIXI v8 app.resize method
                app.resize(canvas.width, canvas.height);
              } else if (app.renderer && typeof app.renderer.resize === 'function') {
                // Common renderer resize method
                app.renderer.resize(canvas.width, canvas.height);
              }
              
              // Force a render after resize if method exists
              if (typeof app.render === 'function') {
                app.render();
              }
            } catch (e) {
              console.warn('Error in PIXI resize handler:', e);
            }
          };
          
          // Watch for canvas size changes
          window.addEventListener('resize', resizeHandler);
          
          // Create a ResizeObserver to detect canvas size changes without window resize
          if (window.ResizeObserver) {
            const observer = new ResizeObserver(entries => {
              for (const entry of entries) {
                if (entry.target === canvas) {
                  resizeHandler();
                  break;
                }
              }
            });
            
            observer.observe(canvas);
            
            // Store observer on app for cleanup
            app._resizeObserver = observer;
          }
        }
        
        return app;
      } catch (error) {
        console.error('PixiHelper.initApp: Error creating PIXI application', error);
        return null;
      }
    },
    
    /**
     * Create a basic sprite with the given texture
     * @param {string} texturePath - Path to the texture 
     * @param {Object} options - Options for the sprite (x, y, scale, etc.)
     * @returns {Promise<PIXI.Sprite>} - The sprite instance
     */
    createSprite: function(texturePath, options = {}) {
      try {
        let sprite = null;
        
        // Check if the texturePath is valid
        if (!texturePath || typeof texturePath !== 'string') {
          console.warn('Invalid texture path:', texturePath);
          return Promise.resolve(this._createFallbackSprite(options));
        }
        
        // PIXI v8 texture loading approach
        if (PIXI.Assets) {
          console.log('Using PIXI.Assets.load for texture:', texturePath);
          
          // First check if the texture is already loaded/cached
          const existingTexture = PIXI.Assets.cache.has?.(texturePath);
          if (existingTexture) {
            console.log('Texture already in cache, using cached version');
            try {
              const texture = PIXI.Assets.cache.get(texturePath);
              sprite = new PIXI.Sprite(texture);
              this._applySpriteOptions(sprite, options);
              return Promise.resolve(sprite);
            } catch (cacheError) {
              console.warn('Error using cached texture:', cacheError);
              // Continue to normal loading
            }
          }
          
          // Load the texture
          return PIXI.Assets.load(texturePath)
            .then(texture => {
              // Handle different texture formats in PIXI v8
              try {
                // Create the sprite - handle different return formats from PIXI.Assets.load
                if (texture.baseTexture || texture.source) {
                  // Regular texture object
                  sprite = new PIXI.Sprite(texture);
                } else if (texture.texture) {
                  // Some versions return a wrapper object
                  sprite = new PIXI.Sprite(texture.texture);
                } else {
                  // Asset data or direct image/resource
                  sprite = PIXI.Sprite.from(texture);
                }
                
                // Apply standard options
                this._applySpriteOptions(sprite, options);
                return sprite;
              } catch (spriteError) {
                console.error('Error creating sprite from loaded texture:', spriteError);
                return this._createFallbackSprite(options);
              }
            })
            .catch(error => {
              console.error('Error loading texture with PIXI.Assets:', error);
              return this._createFallbackSprite(options);
            });
        } 
        // Fallback for PIXI v5-v7
        else if (PIXI.Loader && PIXI.Loader.shared) {
          console.log('Using PIXI.Loader.shared (v5-v7) for texture:', texturePath);
          return new Promise((resolve, reject) => {
            PIXI.Loader.shared.add(texturePath).load((loader, resources) => {
              try {
                sprite = new PIXI.Sprite(resources[texturePath].texture);
                this._applySpriteOptions(sprite, options);
                resolve(sprite);
              } catch (e) {
                console.error('Error creating sprite with PIXI.Loader:', e);
                resolve(this._createFallbackSprite(options));
              }
            });
          });
        } 
        // Legacy fallback for PIXI v4
        else if (PIXI.loader) {
          console.log('Using PIXI.loader (v4) for texture:', texturePath);
          return new Promise((resolve, reject) => {
            PIXI.loader.add(texturePath).load((loader, resources) => {
              try {
                sprite = new PIXI.Sprite(resources[texturePath].texture);
                this._applySpriteOptions(sprite, options);
                resolve(sprite);
              } catch (e) {
                console.error('Error creating sprite with PIXI.loader:', e);
                resolve(this._createFallbackSprite(options));
              }
            });
          });
        } 
        // Last resort - try to create a sprite directly
        else if (PIXI.Sprite && PIXI.Sprite.from) {
          console.log('Attempting direct sprite creation with PIXI.Sprite.from');
          try {
            // Try to create sprite directly using from method
            sprite = PIXI.Sprite.from(texturePath);
            this._applySpriteOptions(sprite, options);
            return Promise.resolve(sprite);
          } catch (directError) {
            console.error('Error creating sprite directly:', directError);
            return Promise.resolve(this._createFallbackSprite(options));
          }
        }
        // Complete fallback
        else {
          console.warn('No suitable texture loading method found, using colored placeholder');
          return Promise.resolve(this._createFallbackSprite(options));
        }
      } catch (error) {
        console.error('PixiHelper.createSprite: Error creating sprite', error);
        return Promise.resolve(this._createFallbackSprite(options));
      }
    },
    
    /**
     * Apply common options to a sprite
     * @private
     */
    _applySpriteOptions: function(sprite, options = {}) {
      if (!sprite) return;
      
      if (options.x !== undefined) sprite.x = options.x;
      if (options.y !== undefined) sprite.y = options.y;
      if (options.scale !== undefined) {
        sprite.scale.x = options.scale;
        sprite.scale.y = options.scale;
      } else {
        if (options.scaleX !== undefined) sprite.scale.x = options.scaleX;
        if (options.scaleY !== undefined) sprite.scale.y = options.scaleY;
      }
      if (options.anchor !== undefined) {
        sprite.anchor.set(options.anchor);
      } else {
        if (options.anchorX !== undefined) sprite.anchor.x = options.anchorX;
        if (options.anchorY !== undefined) sprite.anchor.y = options.anchorY;
      }
      if (options.alpha !== undefined) sprite.alpha = options.alpha;
      if (options.rotation !== undefined) sprite.rotation = options.rotation;
      if (options.visible !== undefined) sprite.visible = options.visible;
      if (options.tint !== undefined) sprite.tint = options.tint;
      
      return sprite;
    },
    
    /**
     * Create a fallback sprite when texture loading fails
     * @private
     */
    _createFallbackSprite: function(options = {}) {
      try {
        // Create a Graphics object instead of a Sprite
        const graphics = new PIXI.Graphics();
        graphics.beginFill(options.color || 0xFF0000);
        graphics.drawRect(0, 0, options.width || 50, options.height || 50);
        graphics.endFill();
        
        // Apply common options
        this._applySpriteOptions(graphics, options);
        
        return graphics;
      } catch (e) {
        console.error('Failed to create fallback sprite:', e);
        return null;
      }
    },
    
    /**
     * Create a simple text object
     * @param {string} text - The text to display
     * @param {Object} style - The style options for the text
     * @param {Object} options - Position and other options for the text
     * @returns {PIXI.Text} - The text object
     */
    createText: function(text, style = {}, options = {}) {
      // Default style
      const defaultStyle = {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'center'
      };
      
      // Merge with provided style
      const textStyle = Object.assign({}, defaultStyle, style);
      
      // Create the text object
      const textObj = new PIXI.Text(text, textStyle);
      
      // Apply options
      if (options.x !== undefined) textObj.x = options.x;
      if (options.y !== undefined) textObj.y = options.y;
      if (options.anchor !== undefined) {
        textObj.anchor.set(options.anchor);
      } else {
        if (options.anchorX !== undefined) textObj.anchor.x = options.anchorX;
        if (options.anchorY !== undefined) textObj.anchor.y = options.anchorY;
      }
      if (options.alpha !== undefined) textObj.alpha = options.alpha;
      if (options.rotation !== undefined) textObj.rotation = options.rotation;
      if (options.visible !== undefined) textObj.visible = options.visible;
      
      return textObj;
    },
    
    /**
     * Create a simple animation from a spritesheet
     * @param {string} spritesheetPath - Path to the spritesheet json file
     * @param {string} animationName - Name of the animation sequence
     * @param {Object} options - Options for the animated sprite
     * @returns {Promise<PIXI.AnimatedSprite>} - The animated sprite
     */
    createAnimation: async function(spritesheetPath, animationName, options = {}) {
      try {
        console.log('Loading spritesheet for animation:', spritesheetPath, animationName);
        
        // Load the spritesheet with PIXI v8 Assets
        const spritesheet = await PIXI.Assets.load(spritesheetPath);
        
        if (!spritesheet) {
          console.error('Failed to load spritesheet:', spritesheetPath);
          return null;
        }
        
        // Handle different PIXI versions' spritesheet formats
        let textures;
        
        if (spritesheet.animations && spritesheet.animations[animationName]) {
          // PIXI v7/v8 format
          textures = spritesheet.animations[animationName];
        } else if (spritesheet.data && spritesheet.data.animations && spritesheet.data.animations[animationName]) {
          // Alternative format sometimes seen
          textures = spritesheet.data.animations[animationName];
        } else if (Array.isArray(spritesheet)) {
          // Sometimes Assets.load returns an array of textures directly
          textures = spritesheet;
        } else {
          console.error('Could not find animation in spritesheet:', animationName, spritesheet);
          return null;
        }
        
        console.log('Creating AnimatedSprite with textures:', textures);
        
        // Create the animated sprite
        const animation = new PIXI.AnimatedSprite(textures);
        
        // Apply options
        if (options.x !== undefined) animation.x = options.x;
        if (options.y !== undefined) animation.y = options.y;
        if (options.scale !== undefined) {
          animation.scale.x = options.scale;
          animation.scale.y = options.scale;
        } else {
          if (options.scaleX !== undefined) animation.scale.x = options.scaleX;
          if (options.scaleY !== undefined) animation.scale.y = options.scaleY;
        }
        if (options.anchor !== undefined) {
          animation.anchor.set(options.anchor);
        } else {
          if (options.anchorX !== undefined) animation.anchor.x = options.anchorX;
          if (options.anchorY !== undefined) animation.anchor.y = options.anchorY;
        }
        if (options.animationSpeed !== undefined) animation.animationSpeed = options.animationSpeed;
        if (options.loop !== undefined) animation.loop = options.loop;
        if (options.autoPlay !== undefined && options.autoPlay) animation.play();
        
        return animation;
      } catch (error) {
        console.error('PixiHelper.createAnimation: Error creating animation', error);
        return null;
      }
    },
    
    /**
     * Create a graphics object with a drawn shape
     * @param {string} shape - The shape to draw ('circle', 'rect', 'rounded-rect', 'line', etc.)
     * @param {Object} options - Options for the shape
     * @returns {PIXI.Graphics} - The graphics object
     */
    createShape: function(shape, options = {}) {
      const graphics = new PIXI.Graphics();
      
      // Set fill style
      if (options.fillColor !== undefined) {
        graphics.beginFill(options.fillColor, options.fillAlpha !== undefined ? options.fillAlpha : 1);
      }
      
      // Set line style
      if (options.lineWidth !== undefined && options.lineColor !== undefined) {
        graphics.lineStyle(
          options.lineWidth, 
          options.lineColor, 
          options.lineAlpha !== undefined ? options.lineAlpha : 1
        );
      }
      
      // Draw the shape
      switch (shape.toLowerCase()) {
        case 'circle':
          graphics.drawCircle(
            options.x || 0, 
            options.y || 0, 
            options.radius || 50
          );
          break;
          
        case 'rect':
        case 'rectangle':
          graphics.drawRect(
            options.x || 0, 
            options.y || 0, 
            options.width || 100, 
            options.height || 100
          );
          break;
          
        case 'rounded-rect':
        case 'roundedrect':
          graphics.drawRoundedRect(
            options.x || 0, 
            options.y || 0, 
            options.width || 100, 
            options.height || 100, 
            options.radius || 10
          );
          break;
          
        case 'line':
          graphics.moveTo(options.x1 || 0, options.y1 || 0);
          graphics.lineTo(options.x2 || 100, options.y2 || 100);
          break;
          
        case 'polygon':
          if (options.points && Array.isArray(options.points)) {
            graphics.drawPolygon(options.points);
          }
          break;
          
        default:
          console.warn('PixiHelper.createShape: Unknown shape type:', shape);
      }
      
      // End the fill
      graphics.endFill();
      
      // Position and other options
      if (options.position) {
        graphics.position.set(options.position.x || 0, options.position.y || 0);
      }
      if (options.rotation !== undefined) graphics.rotation = options.rotation;
      if (options.scale) {
        graphics.scale.set(options.scale.x || 1, options.scale.y || 1);
      }
      if (options.alpha !== undefined) graphics.alpha = options.alpha;
      if (options.visible !== undefined) graphics.visible = options.visible;
      
      return graphics;
    },
    
    /**
     * Create a container for grouping display objects
     * @param {Object} options - Options for the container
     * @returns {PIXI.Container} - The container
     */
    createContainer: function(options = {}) {
      const container = new PIXI.Container();
      
      // Apply options
      if (options.x !== undefined) container.x = options.x;
      if (options.y !== undefined) container.y = options.y;
      if (options.scale !== undefined) {
        container.scale.x = options.scale;
        container.scale.y = options.scale;
      } else {
        if (options.scaleX !== undefined) container.scale.x = options.scaleX;
        if (options.scaleY !== undefined) container.scale.y = options.scaleY;
      }
      if (options.rotation !== undefined) container.rotation = options.rotation;
      if (options.alpha !== undefined) container.alpha = options.alpha;
      if (options.visible !== undefined) container.visible = options.visible;
      
      return container;
    }
  };
})();