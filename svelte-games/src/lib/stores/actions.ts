import { get } from 'svelte/store';
import { currentGame } from './game';
import { balance } from './balance';
import { bet } from './betting';
import { gameStatus } from './ui';

// Spin/play the current game
export function spin(): void {
  const game = get(currentGame);
  const currentBalance = get(balance);
  const currentBet = get(bet);
  
  // Check if we have enough balance
  if (currentBalance < currentBet) {
    gameStatus.set({
      message: 'Not enough balance to play!',
      isError: true
    });
    return;
  }
  
  // Call the game's play function if available
  if (game && game.play) {
    game.play();
  } else {
    console.error(`No play function found for game: ${game.title}`);
    gameStatus.set({
      message: 'Error starting game',
      isError: true
    });
  }
}