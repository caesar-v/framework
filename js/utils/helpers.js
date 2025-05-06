/**
 * Helpers - Utility functions for the game framework
 * 
 * This class provides standardized utility methods that can be used
 * across different parts of the framework and game implementations.
 */

class Helpers {
  /**
   * Format a number as currency
   * @param {number} amount - The amount to format
   * @param {string} currency - The currency symbol
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount, currency = '€', decimals = 2) {
    return amount.toFixed(decimals) + ' ' + currency;
  }
  
  /**
   * Generate a random number between min and max (inclusive)
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
   * @returns {Array} The shuffled array (doesn't modify the original)
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
      shadowOffsetY = 2,
      maxWidth = undefined
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
    
    if (maxWidth !== undefined) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
    
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
  
  /**
   * Draw a grid on the canvas (useful for debugging layouts)
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} gridSize - Size of each grid cell (default: 100)
   * @param {string} color - Grid line color (default: rgba(255, 255, 255, 0.1))
   * @param {boolean} showCenter - Whether to draw center markers (default: true)
   */
  static drawGrid(ctx, width, height, gridSize = 100, color = 'rgba(255, 255, 255, 0.1)', showCenter = true) {
    // Adjust grid spacing to avoid too many lines on large canvases
    const maxGridLines = 30; // Maximum number of grid lines in either direction
    
    if (width / gridSize > maxGridLines) {
      gridSize = Math.ceil(width / maxGridLines / 100) * 100;
    }
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw center marker
    if (showCenter) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.lineWidth = 2;
      
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(centerX - 50, centerY);
      ctx.lineTo(centerX + 50, centerY);
      ctx.stroke();
      
      // Vertical center line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 50);
      ctx.lineTo(centerX, centerY + 50);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a rounded rectangle
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} radius - Corner radius
   * @param {boolean} fill - Whether to fill the rectangle
   * @param {boolean} stroke - Whether to stroke the rectangle
   */
  static drawRoundedRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fill();
    }
    
    if (stroke) {
      ctx.stroke();
    }
  }
  
  /**
   * Convert a hex color to RGB
   * @param {string} hex - Hex color string (e.g. "#FFFFFF")
   * @returns {Object} RGB object with r, g, b properties
   */
  static hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }
  
  /**
   * Convert a hex color to a number
   * @param {string} hex - Hex color string (e.g. "#FFFFFF")
   * @returns {number} Color as a number
   * @deprecated This was previously used for PIXI color conversion
   */
  static hexToColor(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    return parseInt(hex, 16);
  }
}

// Make available globally
window.Helpers = Helpers;