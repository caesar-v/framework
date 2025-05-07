# Game Framework

A game prototyping framework for creating casino-style games with betting mechanics, available in two versions: a simplified stand-alone edition and a modern SvelteKit implementation.

## Available Implementations

### 1. Simplified Edition (Stand-alone)

A self-contained version with no external dependencies, ideal for quick prototyping or learning.

- **Path**: `/index.html`
- **Key Features**: Single file implementation, no build step, pure JavaScript
- **Run It**: Open `index.html` directly in a browser or use `./run-server.sh`

### 2. SvelteKit Edition (Modern)

A modern component-based implementation using SvelteKit and UnoCSS, ideal for larger projects and production use.

- **Path**: `/svelte-games/`
- **Key Features**: TypeScript, component architecture, reactive UI, utility CSS
- **Run It**: Execute `cd svelte-games && ./run.sh`

## Features (Both Versions)

- **Multiple Games**: Switch between Dice Game and Card Game
- **Betting System**: Place bets with adjustable risk levels
- **Canvas Rendering**: High-performance HTML5 Canvas rendering
- **Responsive Design**: Adapts to different screen sizes

## Games

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

## Running the Simplified Version

Simply open `index.html` in any modern browser or use the provided server script:

```bash
# Start a local HTTP server
./run-server.sh
```

## Running the SvelteKit Version

Navigate to the SvelteKit directory and use the run script:

```bash
cd svelte-games
./run.sh
```

Or manually:

```bash
cd svelte-games
npm install
npm run dev
```

Then visit http://localhost:5173 in your browser.

## Code Structure Comparison

### Simplified Version (index.html)
The framework is organized into three main components within a single file:

1. **State Management**: Handles game state, balance, and betting
2. **Canvas Manager**: Handles drawing, rendering, and animations
3. **Game Manager**: Orchestrates game logic, UI interactions, and events

### SvelteKit Version (svelte-games/)
The framework uses a modern component-based architecture:

1. **Components**: UI elements organized by responsibility
2. **Stores**: Reactive state management
3. **Services**: Shared functionality like canvas rendering
4. **TypeScript**: Type-safe interfaces and implementations

## Choosing the Right Version

- **Use the Simplified Version if**:
  - You need a quick prototype
  - You want to avoid build tools
  - You need standalone HTML with no dependencies
  - You're learning basic game development concepts
  
- **Use the SvelteKit Version if**:
  - You're building a larger application
  - You want modern development features
  - You need component reusability
  - You prefer TypeScript and reactive programming

## License

Free to use and modify for any purpose.