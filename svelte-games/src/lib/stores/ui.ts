import { writable } from 'svelte/store';

// Game status interface
interface GameStatus {
  message: string;
  isError: boolean;
}

// Create a store for game status messages
export const gameStatus = writable<GameStatus>({
  message: 'Game ready!',
  isError: false
});

// Show a status message
export function showStatus(message: string, isError: boolean = false): void {
  gameStatus.set({
    message,
    isError
  });
}

// Clear status message
export function clearStatus(): void {
  gameStatus.set({
    message: '',
    isError: false
  });
}