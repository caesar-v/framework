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
<script src="js/core/gameFramework.js"></script>
<script src="games/baseGame.js"></script>
<script src="games/yourGame.js"></script>
<script src="js/core/gameLoader.js"></script>
<script src="js/utils/debugManager.js"></script>
```

2. Create a new game implementation:

```javascript
class YourGame {
  constructor(config = {}) {
    // Game-specific configuration and state
    
    // Initialize the framework with your custom game logic
    this.game = new GameFramework({
      gameTitle: 'Your Game Title',
      // Override any default configurations
      gameLogic: {
        spin: this.spin.bind(this),
        calculateWin: this.calculateWin.bind(this),
        renderGame: this.renderGame.bind(this),
        handleWin: this.handleWin.bind(this),
        handleLoss: this.handleLoss.bind(this)
      }
    });
  }
  
  // Implement your game logic methods
  spin(callback) {
    // Your spin logic here
    // Call callback with result when done
  }
  
  calculateWin(betAmount, riskLevel, result) {
    // Calculate win amount based on game rules
  }
  
  renderGame(ctx, width, height, state) {
    // Render your game on the canvas
  }
  
  handleWin(ctx, width, height, winAmount, result) {
    // Handle win display/animation
  }
  
  handleLoss(ctx, width, height, result) {
    // Handle loss display
  }
}

// Initialize your game
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
| usePixi | boolean | Whether to use PixiJS for rendering (if available) |
| pixiOptions | object | Additional options for PixiJS renderer |
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

### renderGameWithPixi(pixiApp, container, width, height, state)
Renders the game using PixiJS (optional, if PixiJS rendering is enabled).

**Parameters:**
- `pixiApp`: The PIXI.Application instance
- `container`: The PIXI.Container to add game elements to
- `width`: The canvas width
- `height`: The canvas height
- `state`: The current game state

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

## PixiJS Integration

The framework includes built-in support for rendering games using PixiJS, a powerful 2D WebGL renderer. This provides several benefits:

- Improved performance for complex games
- Hardware acceleration
- Advanced visual effects
- Better asset management
- Modern rendering capabilities

### Using PixiJS in Your Game

To use PixiJS in your game implementation, provide the `renderGameWithPixi` method in addition to the standard Canvas2D `renderGame` method:

```javascript
class YourGame extends BaseGame {
  constructor(config = {}) {
    super(config);
    // Game initialization
  }
  
  // Standard Canvas2D rendering (fallback)
  renderGame(ctx, width, height, state) {
    // Render using Canvas2D API
  }
  
  // PixiJS rendering (preferred if available)
  renderGameWithPixi(pixiApp, container, width, height, state) {
    // Render using PixiJS
    // container is a PIXI.Container for your game elements
    
    // Example: Create a sprite
    const sprite = new PIXI.Sprite(PIXI.Texture.from('path/to/image.png'));
    sprite.x = width / 2;
    sprite.y = height / 2;
    sprite.anchor.set(0.5);
    container.addChild(sprite);
  }
}
```

### PixiHelper Utility

The framework provides a `PixiHelper` utility to simplify common PixiJS operations:

```javascript
// Create sprites
const sprite = await PixiHelper.createSprite('path/to/image.png', {
  x: 100,
  y: 100,
  scale: 0.5,
  anchor: 0.5
});

// Create text
const text = PixiHelper.createText('Hello World', {
  fontSize: 24,
  fill: 0xFFFFFF
}, {
  x: 100,
  y: 100,
  anchor: 0.5
});

// Create animations
const animation = await PixiHelper.createAnimation('path/to/spritesheet.json', 'animationName', {
  x: 100,
  y: 100,
  animationSpeed: 0.5,
  loop: true,
  autoPlay: true
});

// Create shapes
const circle = PixiHelper.createShape('circle', {
  x: 100,
  y: 100,
  radius: 50,
  fillColor: 0xFF0000
});
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
