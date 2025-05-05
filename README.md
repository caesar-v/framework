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

## File Structure

- `index.html` - The HTML structure
- `styles.css` - All CSS styling
- `gameFramework.js` - The core framework
- `slotGame.js` - An example game implementation

## Getting Started

1. Include the required files in your HTML:

```html
<link rel="stylesheet" href="styles.css">
<script src="gameFramework.js"></script>
<script src="yourGame.js"></script>
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
Renders the game on the canvas.

**Parameters:**
- `ctx`: The canvas 2D context
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

## Example Games

The repository includes an example slot game implementation (`slotGame.js`) that demonstrates how to use the framework to create a simple slot machine game.

## Customization

You can customize almost every aspect of the framework by:

1. Modifying the CSS variables in `styles.css` to change the appearance
2. Extending the `GameFramework` class to add more functionality
3. Creating your own game implementations with unique logic and visuals

## License

This framework is available for use in prototyping and development.
