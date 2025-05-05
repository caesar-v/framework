/**
 * Helpers - Utility functions for the game framework
 */

class Helpers {
  /**
   * Format a number as currency
   * @param {number} amount - The amount to format
   * @param {string} currency - The currency symbol
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount, currency = '€') {
    return amount.toFixed(2) + ' ' + currency;
  }
  
  /**
   * Generate a random number between min and max
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer
   */
  static randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - The array to shuffle
   * @returns {Array} The shuffled array
   */
  static shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  /**
   * Draw text on canvas with standardized parameters
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {string} text - The text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Text options
   */
  static drawText(ctx, text, x, y, options = {}) {
    const { 
      font = 'bold 48px Poppins',
      color = '#FFD700', 
      align = 'center',
      baseline = 'middle',
      shadow = false,
      shadowColor = 'rgba(0, 0, 0, 0.5)',
      shadowBlur = 5,
      shadowOffsetX = 2,
      shadowOffsetY = 2
    } = options;
    
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    if (shadow) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
    }
    
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  
  /**
   * Create a gradient background on canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Array} colors - Array of colors for the gradient
   * @param {string} direction - Direction of gradient (vertical/horizontal)
   */
  static drawGradientBackground(ctx, width, height, colors, direction = 'vertical') {
    let gradient;
    
    if (direction === 'vertical') {
      gradient = ctx.createLinearGradient(0, 0, 0, height);
    } else {
      gradient = ctx.createLinearGradient(0, 0, width, 0);
    }
    
    // Add color stops
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

// Make available globally
window.Helpers = Helpers;