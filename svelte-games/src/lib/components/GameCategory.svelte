<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GameGrid from './ui/GameGrid.svelte';
  import CategoryNav from './layout/CategoryNav.svelte';
  import { games } from '../stores/game';
  
  // Props
  export let categoryId = 'popular';
  
  // State
  let activeSubcategory = 'all';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Category titles
  const categoryTitles = {
    popular: 'Popular Games',
    casino: 'Casino Games',
    card: 'Card Games',
    arcade: 'Arcade Games',
    sports: 'Sports Games',
    new: 'New Games'
  };
  
  // Pass play events up
  function handlePlay(event) {
    dispatch('play', event.detail);
  }
  
  // Handle subcategory selection
  function handleSubcategorySelect(event) {
    activeSubcategory = event.detail.subcategoryId;
  }
  
  // Get current category title
  $: categoryTitle = categoryTitles[categoryId] || 'Games';
</script>

<div class="game-category h-full flex flex-col">
  <!-- Category Navigation -->
  <CategoryNav {categoryId} {activeSubcategory} on:subcategorySelect={handleSubcategorySelect} />
  
  <!-- Category Content -->
  <div class="category-content flex-1 overflow-y-auto p-4">
    <h1 class="text-2xl font-bold text-accent mb-4">{categoryTitle}</h1>
    
    <!-- Featured Game (only on popular) -->
    {#if categoryId === 'popular' && activeSubcategory === 'all'}
      <div class="featured-game bg-secondary rounded-lg overflow-hidden mb-6 shadow-lg">
        <div class="relative">
          <div class="aspect-[21/9] bg-gradient-to-r from-accent/30 to-primary flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">🎲</div>
              <h2 class="text-xl font-bold text-white mb-2">Dice Challenge</h2>
              <p class="text-text-secondary mb-4">Try your luck with our premium dice game</p>
              <button class="btn" on:click={() => dispatch('play', { gameId: 'dice' })}>
                Play Now
              </button>
            </div>
          </div>
          <div class="absolute top-2 left-2 bg-accent/80 text-white text-xs py-1 px-2 rounded">
            FEATURED
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Games Grid -->
    <GameGrid showPlayButton={true} on:play={handlePlay} />
  </div>
</div>