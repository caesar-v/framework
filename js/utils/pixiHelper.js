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
        // Default options
        const defaultOptions = {
          width: canvas.width,
          height: canvas.height,
          backgroundColor: 0x071d2a,
          view: canvas
        };
        
        // Merge with provided options
        const appOptions = Object.assign({}, defaultOptions, options);
        
        let app;
        
        // Try to create the app using different PixiJS versions' syntax
        try {
          // Modern PIXI v5+ syntax
          app = new PIXI.Application(appOptions);
        } catch (modernError) {
          console.warn('Modern PixiJS initialization failed, trying legacy approach:', modernError);
          
          try {
            // Legacy PIXI v4 syntax (separate parameters)
            app = new PIXI.Application(
              canvas.width,
              canvas.height,
              { 
                view: canvas, 
                backgroundColor: appOptions.backgroundColor
              }
            );
          } catch (legacyError) {
            console.error('Legacy PixiJS initialization also failed:', legacyError);
            return null;
          }
        }
        
        // Setup resize handler using a compatible approach
        if (app && app.renderer) {
          const resizeHandler = () => {
            if (!app || !app.renderer || !canvas) return;
            
            try {
              // Update renderer size when canvas size changes
              if (typeof app.renderer.resize === 'function') {
                app.renderer.resize(canvas.width, canvas.height);
              }
            } catch (e) {
              console.warn('Error in resize handler:', e);
            }
          };
          
          // Watch for canvas size changes
          window.addEventListener('resize', resizeHandler);
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
        
        // Check which texture loading method is available
        if (PIXI.Assets && PIXI.Assets.load) {
          // PIXI v7 approach
          return PIXI.Assets.load(texturePath)
            .then(texture => {
              sprite = new PIXI.Sprite(texture);
              this._applySpriteOptions(sprite, options);
              return sprite;
            })
            .catch(error => {
              console.error('Error loading texture with PIXI.Assets:', error);
              return this._createFallbackSprite(options);
            });
        } else if (PIXI.Loader && PIXI.Loader.shared) {
          // PIXI v5-v6 approach
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
        } else if (PIXI.loader) {
          // PIXI v4 approach
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
        } else {
          // Fallback: Create a placeholder sprite with a colored rectangle
          console.warn('No texture loading method available, using fallback');
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
        // Load the spritesheet
        const spritesheet = await PIXI.Assets.load(spritesheetPath);
        
        // Create the animated sprite
        const animation = new PIXI.AnimatedSprite(spritesheet.animations[animationName]);
        
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