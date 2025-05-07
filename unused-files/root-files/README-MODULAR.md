# Modular Game Framework

This is a modular implementation of the Game Framework that provides a simpler, more maintainable architecture while preserving all the features of the original framework.

## Key Benefits

- **Simplified Architecture**: Clean separation of concerns with modular components
- **Better Stability**: Each component has a clear, focused responsibility
- **Easier Development**: Add new games without worrying about complex initialization sequences
- **Canvas-Based Rendering**: Uses standard Canvas2D rendering for better compatibility
- **Full Feature Support**: Includes all the features of the original framework

## Components

The modular framework is built with these core components:

1. **CanvasManager**: Handles canvas rendering, animations, and drawing primitives
2. **FullGameManager**: Manages game state, UI interactions, and game switching
3. **Game Implementations**: Individual game modules that use the framework (e.g., DiceGame, CardGame)

## How to Run

### Quick Start

Run the included start script:

```bash
./start-modular.sh
```

This will:
1. Start a Python HTTP server on port 8080 (or the next available port)
2. Open the modular framework in your default browser

### Manual Start

Alternatively, you can start the server manually:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080/index-modular.html](http://localhost:8080/index-modular.html) in your browser.

## Features

The modular framework supports all the features of the original framework:

- **Game Selection**: Switch between different games
- **Betting Controls**: Place bets and track balance
- **Theme Support**: Multiple visual themes
- **Layout Options**: Desktop and mobile layouts
- **Settings Panel**: Configure game options
- **Debug Tools**: Debug mode and game analysis

## Creating Custom Games

To create a new game for the modular framework:

1. Create a new JS file (e.g., `js/simple/myGame.js`)
2. Implement a factory function that returns a game object with the standard interface
3. Register the game with the GameManager

### Example Game Template

```javascript
/**
 * Create a new Custom Game
 * @param {CanvasManager} canvasManager - Canvas manager instance
 * @param {Object} gameState - Shared game state
 * @returns {Object} Game instance
 */
function createMyGame(canvasManager, gameState) {
  // Game properties and state
  let gameVariable = initialValue;
  
  // Game configuration
  const config = {
    betAmount: 10,
    // Other game settings
  };
  
  // Initialize the game
  function init() {
    // Setup game
    draw();
  }
  
  // Main game action
  function play(betAmount) {
    // Game logic
  }
  
  // Draw the game
  function draw() {
    // Render the game
  }
  
  // Clean up resources
  function cleanup() {
    // Remove any event listeners, etc.
  }
  
  // Return the game interface
  return {
    name: 'My Game',
    id: 'myGame',
    init,
    play,
    spin: play, // Alias for consistent interface
    draw,
    cleanup,
    config
  };
}

// Export the game factory
if (typeof window !== 'undefined') {
  window.createMyGame = createMyGame;
}
```

## Adding Your Game to the Framework

To add your game to the framework:

1. Add your game script to `index-modular.html`:

```html
<script src="js/simple/myGame.js"></script>
```

2. Register your game in the initialization code:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const gameManager = new FullGameManager();
  
  // Register games
  gameManager.registerGame('dice', createDiceGame);
  gameManager.registerGame('card', createCardGame);
  gameManager.registerGame('myGame', createMyGame); // Add your game
  
  // Initialize
  if (gameManager.init()) {
    // Load default game
    gameManager.loadGame('dice');
  }
});
```

3. Add your game to the game selection dropdown in HTML:

```html
<select id="game-select" class="control-select">
  <option value="dice">Dice Game</option>
  <option value="card">Card Game</option>
  <option value="myGame">My Game</option> <!-- Add your game -->
</select>
```