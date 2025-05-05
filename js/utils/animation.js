/**
 * Animations - Utility functions for handling animations
 */
class Animations {
  /**
   * Create a pulse animation on an element
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  static pulse(element, duration = 1000) {
    return new Promise(resolve => {
      // Store original transform
      const originalTransform = element.style.transform;
      
      // Add scale animation
      element.style.transition = `transform ${duration}ms ease-in-out`;
      element.style.transform = `${originalTransform} scale(1.1)`;
      
      // Return to original scale
      setTimeout(() => {
        element.style.transform = originalTransform;
        setTimeout(resolve, duration / 2);
      }, duration / 2);
    });
  }

  /**
   * Fade in an element
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in ms 
   * @returns {Promise} Promise that resolves when animation completes
   */
  static fadeIn(element, duration = 500) {
    return new Promise(resolve => {
      // Store original opacity
      const originalOpacity = element.style.opacity || '1';
      
      // Set initial state
      element.style.opacity = '0';
      element.style.display = 'block';
      
      // Set transition
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        element.style.opacity = originalOpacity;
        setTimeout(resolve, duration);
      });
    });
  }

  /**
   * Fade out an element
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in ms
   * @param {boolean} hideAfter - Whether to hide the element after fading
   * @returns {Promise} Promise that resolves when animation completes
   */
  static fadeOut(element, duration = 500, hideAfter = true) {
    return new Promise(resolve => {
      // Store original opacity
      const originalOpacity = element.style.opacity || '1';
      
      // Set transition
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      
      // Trigger animation
      element.style.opacity = '0';
      
      // Hide element after animation if requested
      setTimeout(() => {
        if (hideAfter) {
          element.style.display = 'none';
        }
        resolve();
      }, duration);
    });
  }

  /**
   * Rotate an element
   * @param {HTMLElement} element - Element to animate
   * @param {number} degrees - Degrees to rotate
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  static rotateElement(element, degrees, duration = 300) {
    return new Promise(resolve => {
      // Set transition
      element.style.transition = `transform ${duration}ms ease-in-out`;
      
      // Apply rotation
      element.style.transform = `rotate(${degrees}deg)`;
      
      // Resolve when complete
      setTimeout(resolve, duration);
    });
  }
  
  /**
   * Create a sprite sheet animation on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement} spritesheet - Spritesheet image
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @param {number} totalFrames - Total number of frames
   * @param {number} x - X position to draw at
   * @param {number} y - Y position to draw at
   * @param {number} fps - Frames per second
   * @returns {Object} Animation controller
   */
  static spriteAnimation(ctx, spritesheet, frameWidth, frameHeight, totalFrames, x, y, fps = 24) {
    let currentFrame = 0;
    let animationId = null;
    
    const animate = () => {
      // Clear the area where the sprite will be drawn
      ctx.clearRect(x, y, frameWidth, frameHeight);
      
      // Calculate the position of the current frame in the spritesheet
      const frameX = currentFrame % totalFrames;
      const frameY = 0;
      
      // Draw the current frame
      ctx.drawImage(
        spritesheet,
        frameX * frameWidth, frameY * frameHeight, frameWidth, frameHeight,
        x, y, frameWidth, frameHeight
      );
      
      // Increment the frame
      currentFrame = (currentFrame + 1) % totalFrames;
    };
    
    // Start the animation
    const start = () => {
      if (animationId) return; // Already running
      
      const frameInterval = 1000 / fps;
      let lastTimestamp = 0;
      
      const loop = (timestamp) => {
        animationId = requestAnimationFrame(loop);
        
        // Only draw if enough time has passed
        if (timestamp - lastTimestamp >= frameInterval) {
          animate();
          lastTimestamp = timestamp;
        }
      };
      
      animationId = requestAnimationFrame(loop);
    };
    
    // Stop the animation
    const stop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };
    
    return { start, stop };
  }
}

// Make available globally
window.Animations = Animations;