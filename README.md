# Game Prototyping Framework

A lightweight framework for quickly prototyping casino-style games with a consistent UI and customizable game logic.

## Overview

This framework provides a modular structure for building game prototypes with a professional UI, allowing developers to focus on the game mechanics while reusing common UI components and functionality.

## Features

- Responsive design with PC and mobile layout options
- Multiple theme options
- Configurable betting system
- Risk level selection
- Auto-play functionality
- Customizable game canvas
- Information popup with tabs
- Debug mode toggle for easier development
- Automated testing functionality

## File Structure

- `index.html` - The HTML structure
- `css/styles.css` - All CSS styling
- `js/core/gameFramework.js` - The core framework class
- `js/core/gameLoader.js` - Game loading and switching functionality
- `games/baseGame.js` - Base abstract game class
- `games/diceGame.js` - Dice game implementation
- `games/cardGame.js` - Card game implementation
- `js/utils/debugManager.js` - Debug mode management
- `js/test.js` - Game framework testing functionality
- `js/debug.js` - Debug utilities and inspectors

## Getting Started

1. Include the required files in your HTML:

```html
<link rel="stylesheet" href="css/styles.css">
<script src="js/utils/helpers.js"></script>
<script src="js/utils/animation.js"></script>
<script src="js/core/CanvasManager.js"></script>
<script src="js/core/UIManager.js"></script>
<script src="js/core/GameStateManager.js"></script>
<script src="js/core/gameFramework.js"></script>
<script src="js/core/index.js"></script>
<script src="games/AbstractBaseGame.js"></script>
<script src="games/baseGame.js"></script>
<script src="games/yourGame.js"></script>
<script src="js/core/gameLoader.js"></script>
<script src="js/utils/debugManager.js"></script>
```

2. Create a new game implementation by extending BaseGame:

```javascript
class YourGame extends BaseGame {
  constructor(config = {}) {
    // Set up your game-specific configuration
    const gameConfig = {
      gameTitle: 'Your Game Title',
      initialBalance: 1000,
      initialBet: 10,
      maxBet: 500,
      // Additional game-specific configuration
      ...config
    };
    
    // Call parent constructor with your config
    super(gameConfig);
    
    // Set up game-specific state
    this.gameState = {
      // Your game state properties
    };
    
    // Initialize your game objects
    this.initGame();
  }
  
  // Initialize game-specific objects
  initGame() {
    // Create any game objects, initialize state, etc.
  }
  
  // Implement required methods
  
  spin(callback) {
    // Your spin logic here
    // Call callback with result when done
    setTimeout(() => {
      const result = {
        isWin: Math.random() > 0.5,
        // Other result data
      };
      callback(result);
    }, 1000);
  }
  
  calculateWin(betAmount, riskLevel, result) {
    // Calculate win amount based on game rules
    if (!result.isWin) return 0;
    
    const multiplier = this.getRiskMultiplier(riskLevel);
    return betAmount * multiplier;
  }
  
  renderGame(ctx, width, height, state) {
    // Render your game on the canvas
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, width, height);
    
    // Draw game elements
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText('Your Game', width / 2, height / 2);
  }
  
  handleWin(ctx, width, height, winAmount, result) {
    // Handle win display/animation
    ctx.fillStyle = 'gold';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`WIN: ${winAmount}`, width / 2, height / 3);
  }
  
  handleLoss(ctx, width, height, result) {
    // Handle loss display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText('Try Again', width / 2, height * 0.8);
  }
  
  // Helper methods
  getRiskMultiplier(riskLevel) {
    const multipliers = {
      'low': 1.5,
      'medium': 3,
      'high': 6
    };
    return multipliers[riskLevel] || multipliers.medium;
  }
}

// Initialize your game (can be done through GameLoader)
document.addEventListener('DOMContentLoaded', () => {
  const game = new YourGame();
});
```

## Framework Configuration

The `GameFramework` constructor accepts a configuration object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| gameTitle | string | The title of the game |
| containerSelector | string | CSS selector for the game container |
| initialBalance | number | Starting balance |
| initialBet | number | Initial bet amount |
| maxBet | number | Maximum bet amount |
| currency | string | Currency symbol |
| riskLevels | object | Multipliers for each risk level |
| defaultRiskLevel | string | Default selected risk level |
| canvasBackground | object | Gradient colors for each theme |
| themes | array | Available theme options |
| defaultTheme | string | Default selected theme |
| canvasDimensions | object | Dimensions for PC and mobile layouts |
| defaultLayout | string | Default layout ('pc' or 'mobile') |
| gameLogic | object | Custom game logic methods |

## Game Logic Interface

Your game implementation must provide these methods:

### spin(callback)
Handles the spin action and calls the callback with the result when complete.

**Parameters:**
- `callback`: Function to call with the result object when spin is complete

### calculateWin(betAmount, riskLevel, result)
Calculates the win amount based on the bet, risk level, and result.

**Parameters:**
- `betAmount`: The current bet amount
- `riskLevel`: The selected risk level ('low', 'medium', 'high')
- `result`: The result object from the spin

**Returns:**
- The calculated win amount

### renderGame(ctx, width, height, state)
Renders the game on the canvas using the Canvas 2D API.

**Parameters:**
- `ctx`: The canvas 2D context
- `width`: The canvas width
- `height`: The canvas height
- `state`: The current game state

### renderGameWithPixi (Deprecated)
This method has been deprecated in the core framework. PIXI has been removed from the core framework to simplify the codebase.

If you need PIXI rendering in your specific game, you can:
1. Import PIXI directly in your game implementation
2. Implement your own PIXI rendering logic within your game class

### handleWin(ctx, width, height, winAmount, result)
Handles displaying win animations or messages.

**Parameters:**
- `ctx`: The canvas 2D context
- `width`: The canvas width
- `height`: The canvas height
- `winAmount`: The amount won
- `result`: The result object from the spin

### handleLoss(ctx, width, height, result)
Handles displaying loss animations or messages.

**Parameters:**
- `ctx`: The canvas 2D context
- `width`: The canvas width
- `height`: The canvas height
- `result`: The result object from the spin

## Canvas 2D Rendering

The framework uses the HTML5 Canvas 2D API for rendering games, which provides a simple, well-supported way to create 2D graphics in browsers.

### Notes on PIXI Removal

As of the latest version, PIXI has been removed from the core framework to simplify the codebase and reduce dependencies. This means:

- All games now use Canvas 2D rendering by default
- The `renderGameWithPixi` method is deprecated
- The `PixiManager` class has been removed from the core framework

### Using WebGL/PIXI in Your Game (Optional)

If you still need WebGL or PIXI rendering for your specific game:

1. Import PIXI directly in your game implementation file
2. Implement your own PIXI rendering logic within your game class
3. Create a canvas and PIXI application instance specific to your game

```javascript
class YourGameWithPixi extends BaseGame {
  constructor(config = {}) {
    super(config);
    
    // Initialize PIXI specifically for this game
    this.pixiApp = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x000000,
      antialias: true
    });
    
    // Add the PIXI view to your game container
    document.getElementById('pixi-container').appendChild(this.pixiApp.view);
    
    // Game initialization
  }
  
  // Standard Canvas2D rendering (required)
  renderGame(ctx, width, height, state) {
    // Standard Canvas2D rendering implementation
  }
  
  // Your custom PIXI rendering implementation
  updatePixiScene(state) {
    // Update your PIXI scene based on game state
  }
}
```

## Example Games

The repository includes example game implementations that demonstrate how to use the framework to create different types of games.

## Customization

You can customize almost every aspect of the framework by:

1. Modifying the CSS variables in `styles.css` to change the appearance
2. Extending the `GameFramework` class to add more functionality
3. Creating your own game implementations with unique logic and visuals

## Debug and Testing Features

The framework includes built-in debug and testing capabilities to make development easier:

### Debug Mode

The debug toggle in the top control panel allows you to:

- Enable/disable console logging throughout the application
- Persist debug preference between sessions using localStorage
- See immediate visual feedback when debug mode is toggled

When debug mode is enabled, all console logs are active. When disabled, most logs are suppressed except for errors.

### Automated Testing

The "Run Tests" button in the top control panel:

- Runs a comprehensive suite of tests against the framework
- Verifies all game classes are properly defined and available
- Tests inheritance relationships between game classes
- Checks UI element references and event handlers
- Temporarily enables debug mode during tests if it's disabled
- Provides visual feedback on test progress and completion

Debug utilities found in `js/debug.js` and `js/utils/debugManager.js` provide additional tools for inspecting game state and analyzing the framework.

## License

This framework is available for use in prototyping and development.
