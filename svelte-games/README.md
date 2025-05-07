# Svelte Games Framework

A modern casino-style game framework built with SvelteKit and UnoCSS.

## Features

- **Component-based architecture**: Clean separation of concerns with modular components
- **Reactive UI**: Automatic updates when state changes
- **Canvas rendering**: High-performance game rendering with HTML5 Canvas
- **UnoCSS styling**: Utility-first CSS for efficient styling
- **TypeScript**: Type safety throughout the codebase
- **Multiple games**: Easily switch between different games

## Games Included

### Dice Game
- Roll a dice and bet on the outcome
- Win when you roll 4, 5, or 6
- Payouts: 4 = 2x, 5 = 3x, 6 = 5x your bet

### Card Game
- Five-card poker style game
- Win with standard poker hands
- Payouts:
  - Four of a Kind: 100x
  - Full House: 50x
  - Three of a Kind: 30x
  - Two Pair: 20x
  - One Pair: 10x

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm (v7 or later)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd svelte-games

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser to see the application running.

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── layout/      # Layout components
│   │   ├── games/       # Game components
│   │   ├── ui/          # UI components
│   ├── stores/          # Svelte stores for state management
│   ├── services/        # Services (canvas, etc.)
├── App.svelte           # Main application
```

## Architecture

The framework uses a component-based architecture with the following key parts:

1. **Game Components**: Each game is a separate component that implements common interfaces
2. **Canvas Manager**: Handles drawing and rendering on the canvas
3. **State Management**: Stores maintain application state and game state
4. **Layout Components**: Reusable UI components for consistent layout

## Adding a New Game

To add a new game to the framework:

1. Create a new game component in `src/lib/components/games/`
2. Register the game in the games store (`src/lib/stores/game.ts`)
3. Implement the `play()` and `draw()` methods
4. Handle win/loss logic

Example template:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasManager } from '../../services/canvasManager';
  import { balance } from '../../stores/balance';
  import { bet } from '../../stores/betting';
  import { gameStatus } from '../../stores/ui';
  import { currentGame } from '../../stores/game';
  
  // Game-specific state
  let isPlaying = false;
  
  // Game methods
  function play() {
    // Game logic here
  }
  
  function draw(cm = canvasManager) {
    // Drawing logic here
  }
  
  function handleWin(amount, reason) {
    $balance += amount;
    $gameStatus.message = `You won ${amount}! (${reason})`;
    $gameStatus.isError = false;
    isPlaying = false;
  }
  
  function handleLoss(reason) {
    $gameStatus.message = `You lost your bet. (${reason})`;
    $gameStatus.isError = true;
    isPlaying = false;
  }
  
  // Register this game with the game store
  onMount(() => {
    if ($currentGame.id === 'your-game-id') {
      currentGame.update(game => ({
        ...game,
        play,
        draw
      }));
    }
    
    const unsubscribe = currentGame.subscribe(game => {
      if (game.id === 'your-game-id') {
        currentGame.update(game => ({
          ...game,
          play,
          draw
        }));
      }
    });
    
    return unsubscribe;
  });
</script>
```

## Deployment

To deploy the application:

1. Run `./deploy.sh` to build and prepare the application
2. Copy the contents of the `dist` folder to your web server
3. Alternatively, use a static site hosting service like Netlify, Vercel, or GitHub Pages

## License

[MIT](LICENSE)