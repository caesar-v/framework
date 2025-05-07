import { writable, readable } from 'svelte/store';

// Betting constants
export const minBet = readable(5);
export const maxBet = readable(500);

// Create a writable store for the current bet
export const bet = writable(10);

// Betting functions
export function changeBet(amount: number): void {
  bet.update(current => {
    let minBetValue = 5;
    let maxBetValue = 500;
    return Math.max(minBetValue, Math.min(maxBetValue, current + amount));
  });
}

export function setBet(amount: number): void {
  bet.update(current => {
    let minBetValue = 5;
    let maxBetValue = 500;
    return Math.max(minBetValue, Math.min(maxBetValue, amount));
  });
}

export function setBetFraction(fraction: number): void {
  bet.update(current => {
    let minBetValue = 5;
    let maxBetValue = 500;
    return Math.max(minBetValue, Math.min(maxBetValue, Math.floor(current * fraction)));
  });
}