<script lang="ts">
  import { currentGame } from '../stores/game';
  import { balance } from '../stores/balance';
  import GameCanvas from './layout/GameCanvas.svelte';
  import BettingPanel from './layout/BettingPanel.svelte';
  
  // Props
  export let onBack = () => {};
  
  // Game stats
  let gameStats = {
    playCount: 253,
    wins: 112,
    bestWin: 500,
    avgBet: 25
  };
</script>

<div class="game-page flex flex-col h-full w-full mx-auto" style="height: 100%; width: 1200px; max-width: 1200px;">
  <!-- Game Header -->
  <div class="game-header px-4 py-2 border-b border-border flex items-center justify-between">
    <div class="flex items-center">
      <button 
        class="flex items-center text-sm text-text-secondary hover:text-accent mr-3"
        on:click={onBack}>
        <span class="mr-2">←</span> Back to Games
      </button>
      <span class="text-accent font-medium">{$currentGame.title}</span>
    </div>
    
    <div class="game-controls flex items-center gap-3">
      <button class="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-accent/20" aria-label="Game info">
        <span class="text-sm">ℹ</span>
      </button>
      <button class="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-accent/20" aria-label="Game settings">
        <span class="text-sm">⚙</span>
      </button>
      <button class="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-accent/20" aria-label="Game fullscreen">
        <span class="text-sm">⛶</span>
      </button>
    </div>
  </div>
  
  <div class="game-content flex-1 flex flex-col md:flex-row overflow-hidden">
    <!-- Game Layout with betting panel at bottom -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Main Game Area -->
      <div class="flex flex-row h-full">
        <!-- Left Betting Panel -->
        <div class="w-[200px] bg-secondary p-4 shadow-lg overflow-y-auto border-r border-border">
          <div class="mb-4">
            <span class="block mb-2 text-accent font-bold text-sm">Game Options</span>
            <div class="space-y-2">
              <button class="btn-outline w-full text-sm py-1.5">Auto Play</button>
              <button class="btn-outline w-full text-sm py-1.5">Game Rules</button>
              <button class="btn-outline w-full text-sm py-1.5">Game History</button>
            </div>
          </div>
          
          <div class="my-4 border-t border-border pt-4">
            <span class="block mb-2 text-accent font-bold text-sm">Betting Options</span>
            <BettingPanel />
          </div>
        </div>
      
        <!-- Game Canvas - Main Area -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Game Canvas for rendering games -->
          <div class="flex-1 p-2 overflow-hidden bg-primary">
            <GameCanvas />
          </div>
        </div>
      </div>
      
      <!-- Game Stats Bar -->
      <div class="game-stats grid grid-cols-5 bg-secondary/30 border-t border-border">
        <div class="stat-item p-3 text-center">
          <div class="text-xs text-text-secondary">Plays</div>
          <div class="text-sm font-medium">{gameStats.playCount}</div>
        </div>
        <div class="stat-item p-3 text-center">
          <div class="text-xs text-text-secondary">Wins</div>
          <div class="text-sm font-medium">{gameStats.wins}</div>
        </div>
        <div class="stat-item p-3 text-center">
          <div class="text-xs text-text-secondary">Best Win</div>
          <div class="text-sm font-medium text-success">{gameStats.bestWin}</div>
        </div>
        <div class="stat-item p-3 text-center">
          <div class="text-xs text-text-secondary">Avg Bet</div>
          <div class="text-sm font-medium">{gameStats.avgBet}</div>
        </div>
        <div class="stat-item p-3 text-center">
          <div class="text-xs text-text-secondary">Win Rate</div>
          <div class="text-sm font-medium text-accent">{Math.round((gameStats.wins / gameStats.playCount) * 100)}%</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .game-stats {
    border-top: 1px solid var(--color-border);
  }
  
  .stat-item:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }
</style>