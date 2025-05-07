import { writable, readable } from 'svelte/store';
import type { Writable } from 'svelte/store';

// Game interfaces
interface Game {
  id: string;
  title: string;
  play?: () => void;
  draw?: (canvasManager: any) => void;
}

// Risk level types
interface RiskLevels {
  [key: string]: number;
}

// Available games
export const games = readable<Game[]>([
  { id: 'dice', title: 'Dice Game' },
  { id: 'card', title: 'Card Game' }
]);

// Current game
export const currentGame: Writable<Game> = writable({
  id: 'dice',
  title: 'Dice Game'
});

// Risk levels with multipliers
export const riskLevels = readable<RiskLevels>({
  low: 1.5,
  medium: 3,
  high: 6
});

// Current risk level
export const riskLevel = writable<string>('medium');

// Set the current game
export function setCurrentGame(gameId: string): void {
  games.subscribe(availableGames => {
    const game = availableGames.find(g => g.id === gameId) || availableGames[0];
    currentGame.set(game);
  })();
}

// Get game title for any game ID (including thumbnail games)
export function getGameTitle(gameId: string): string {
  // Map of thumbnail game IDs to titles
  const thumbnailGames: Record<string, string> = {
    'game1': 'Dice Masters',
    'game2': 'Card Royale',
    'game3': 'Slot Mania',
    'game4': 'Roulette Pro',
    'game5': 'Poker Night',
    'game6': 'Blackjack Elite',
    'game7': 'Lucky Spin',
    'game8': 'Treasure Hunt',
    'game9': 'Space Shooter',
    'game10': 'Gold Rush',
    'game11': 'Football Stars',
    'game12': 'Tennis Pro'
  };
  
  // For thumbnail games, return their title
  if (gameId.startsWith('game') && thumbnailGames[gameId]) {
    return thumbnailGames[gameId];
  }
  
  // For core games, find them in the games store
  let title = '';
  games.subscribe(availableGames => {
    const game = availableGames.find(g => g.id === gameId);
    if (game) {
      title = game.title;
    }
  })();
  
  return title || 'Unknown Game';
}