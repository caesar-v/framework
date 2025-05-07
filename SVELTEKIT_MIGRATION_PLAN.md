# SvelteKit Migration Plan

## Overview
This document outlines the plan to migrate our current single-file game framework to a modern SvelteKit application with UnoCSS for styling.

## Why SvelteKit + UnoCSS?
- **SvelteKit**: Provides a component-based architecture, file-based routing, and great performance
- **UnoCSS**: Atomic CSS engine with faster build times than Tailwind, but with similar utility classes
- **Combined benefits**: Modern developer experience, proper code organization, and easier maintenance

## Migration Steps

### 1. Initial Setup
- Create a new SvelteKit project
- Add UnoCSS to the project
- Set up basic folder structure
- Configure deployment settings

### 2. Component Architecture
- **Layout components**:
  - MainLayout (overall app structure)
  - Header (with balance display)
  - BettingPanel (controls)
  - GameCanvas (rendering area)
  - Footer (with time display)

- **Game components**:
  - BaseGame (abstract component with common functionality)
  - DiceGame (extends BaseGame)
  - CardGame (extends BaseGame)

- **Utility components**:
  - BalanceDisplay
  - BetControls
  - GameSelector
  - StatusMessage

### 3. State Management
- Create Svelte stores for:
  - User state (balance, bet amount)
  - Game state (current game, game-specific state)
  - UI state (animations, messages)
- Implement actions for game interactions

### 4. Canvas Management
- Create a canvas manager service using Svelte's lifecycle hooks
- Implement reactive drawing based on state changes
- Support different game renderers

### 5. Game Logic
- Implement game logic as separate services
- Connect games to the UI components through stores
- Ensure games follow a consistent interface

### 6. Styling with UnoCSS
- Define custom theme colors matching our current theme
- Create base styles for layout and components
- Apply responsive design rules

### 7. Testing & Deployment
- Set up unit tests for game logic
- Configure build process
- Set up automatic deployment

## Component Structure
```
src/
├── routes/
│   ├── +page.svelte (Main game screen)
│   ├── +layout.svelte (Main layout)
├── lib/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── BettingPanel.svelte
│   │   ├── games/
│   │   │   ├── BaseGame.svelte
│   │   │   ├── DiceGame.svelte
│   │   │   ├── CardGame.svelte
│   │   ├── ui/
│   │   │   ├── BalanceDisplay.svelte
│   │   │   ├── BetControls.svelte
│   │   │   ├── GameSelector.svelte
│   ├── stores/
│   │   ├── balance.js
│   │   ├── game.js
│   │   ├── betting.js
│   ├── services/
│   │   ├── canvasManager.js
│   │   ├── gameLogic.js
```

## Benefits Over Current Implementation
1. **Proper component isolation**: Each part of the UI is self-contained and reusable
2. **Reactive by default**: Svelte's reactivity system updates the UI automatically when state changes
3. **Modern tooling**: Access to the rich ecosystem of modern web development
4. **Better maintainability**: Easier to add new games and features
5. **Performance**: Still high-performance with Svelte's compilation step

## Timeline Estimate
- Initial setup and configuration: 1-2 hours
- Component structure and layouts: 2-3 hours
- State management implementation: 1-2 hours
- Canvas manager service: 2-3 hours
- Game logic implementation: 2-3 hours per game
- Styling and UI refinement: 2-3 hours
- Testing and deployment: 1-2 hours

Total estimated time: 12-18 hours development time