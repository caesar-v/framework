import { writable } from 'svelte/store';

// Initial balance
const initialBalance = 1000;

// Create a writable store for the balance
export const balance = writable(initialBalance);

// Additional balance functions
export function updateBalance(amount: number, reason: string = ''): void {
  balance.update(current => {
    const newBalance = current + amount;
    console.log(`Balance updated: ${current} -> ${newBalance} (${reason})`);
    return newBalance;
  });
}

export function resetBalance(): void {
  balance.set(initialBalance);
}