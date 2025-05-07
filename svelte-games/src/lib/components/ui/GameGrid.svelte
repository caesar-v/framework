<script lang="ts">
  import { games, currentGame, setCurrentGame } from '../../stores/game';
  import { createEventDispatcher } from 'svelte';
  
  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Optional props
  export let showPlayButton = true;
  
  // Methods
  function selectGame(gameId: string) {
    setCurrentGame(gameId);
  }
  
  function playGame(gameId: string) {
    setCurrentGame(gameId);
    dispatch('play', { gameId });
  }
</script>

<div class="game-grid">
  <h2 class="text-2xl font-bold text-accent mb-4">Available Games</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each $games as game}
      <div 
        class="game-card bg-secondary rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer" 
        class:selected={$currentGame.id === game.id}
        role="button"
        tabindex="0"
        on:click={() => selectGame(game.id)}
        on:keydown={e => e.key === 'Enter' && selectGame(game.id)}>
        <div class="game-image aspect-video bg-gradient-to-b from-accent/20 to-primary flex items-center justify-center">
          {#if game.id === 'dice'}
            <!-- Dice Game Image -->
            <div class="w-20 h-20 bg-white rounded-lg shadow-lg relative">
              <div class="absolute top-2 left-2 w-3 h-3 rounded-full bg-primary"></div>
              <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary"></div>
              <div class="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-primary"></div>
              <div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-primary"></div>
              <div class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary"></div>
            </div>
          {:else if game.id === 'card'}
            <!-- Card Game Image -->
            <div class="flex">
              <div class="w-12 h-16 bg-white rounded-md shadow-lg -rotate-6 relative">
                <div class="absolute top-1 left-1 text-red-600 text-sm font-bold">A</div>
                <div class="absolute bottom-1 right-1 text-red-600 text-sm font-bold">♥</div>
              </div>
              <div class="w-12 h-16 bg-white rounded-md shadow-lg rotate-6 relative ml-1">
                <div class="absolute top-1 left-1 text-primary text-sm font-bold">K</div>
                <div class="absolute bottom-1 right-1 text-primary text-sm font-bold">♠</div>
              </div>
            </div>
          {:else}
            <!-- Generic Game Image -->
            <div class="text-4xl text-accent">
              <span class="icon">🎮</span>
            </div>
          {/if}
        </div>
        <div class="p-4">
          <h3 class="text-lg font-semibold">{game.title}</h3>
          <p class="text-text-secondary text-sm mt-1">
            {#if game.id === 'dice'}
              Roll dice and win on 4, 5, or 6!
            {:else if game.id === 'card'}
              Get winning poker hands to earn big!
            {:else}
              A fun and exciting game of chance!
            {/if}
          </p>
          {#if showPlayButton}
            <button 
              class="mt-3 w-full py-2 px-4 bg-accent text-white rounded font-semibold hover:bg-accent/90 transition-colors"
              on:click|stopPropagation={() => playGame(game.id)}>
              {$currentGame.id === game.id ? 'Currently Playing' : 'Play Now'}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .game-card.selected {
    box-shadow: 0 0 0 2px var(--color-accent);
  }
</style>