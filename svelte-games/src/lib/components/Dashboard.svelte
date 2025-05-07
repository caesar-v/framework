<script lang="ts">
  import GameGrid from './ui/GameGrid.svelte';
  import { balance } from '../stores/balance';
  import { currentGame } from '../stores/game';
  import { createEventDispatcher } from 'svelte';

  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Function to emit play event
  function playGame() {
    dispatch('play', { gameId: $currentGame.id });
  }
</script>

<div class="dashboard p-4 h-[calc(100vh-120px)] overflow-y-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-accent mb-2">Welcome to Playtagon</h1>
    <p class="text-text-secondary">Your ultimate game portal for casino-style games</p>
  </div>
  
  <div class="stats-row grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="stat-card bg-secondary rounded-lg p-4 shadow-md">
      <h3 class="text-text-secondary font-medium mb-1">Your Balance</h3>
      <p class="text-2xl font-bold text-success">{$balance.toFixed(2)}</p>
    </div>
    
    <div class="stat-card bg-secondary rounded-lg p-4 shadow-md">
      <h3 class="text-text-secondary font-medium mb-1">Current Game</h3>
      <p class="text-2xl font-bold text-accent">{$currentGame.title}</p>
    </div>
    
    <div class="stat-card bg-secondary rounded-lg p-4 shadow-md">
      <h3 class="text-text-secondary font-medium mb-1">Games Available</h3>
      <p class="text-2xl font-bold text-accent">2</p>
    </div>
  </div>
  
  <div class="quick-actions mb-8">
    <button 
      class="btn mr-2"
      on:click={playGame}>
      Play {$currentGame.title} Now
    </button>
    <button class="btn-outline">Deposit</button>
  </div>
  
  <GameGrid on:play={event => dispatch('play', event.detail)} />
</div>