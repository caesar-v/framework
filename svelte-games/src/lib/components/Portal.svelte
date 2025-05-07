<script lang="ts">
  import { onMount } from 'svelte';
  import ThreeColumnLayout from './layout/ThreeColumnLayout.svelte';
  import GamePage from './GamePage.svelte';
  import { currentGame, games } from '../stores/game';
  
  // Portal properties
  export let title = 'Playtagon Games';
  
  // Portal state
  let isPlaying = false; // Whether in game play mode 
  let activeCategory = 'popular';
  let activeSubcategory = 'all';
  let showChatPanel = false;
  
  // Switch to game play mode
  function startPlaying() {
    console.log('Setting isPlaying to true');
    isPlaying = true;
    
    // Ensure the reactivity is triggered
    setTimeout(() => {
      if (!isPlaying) {
        console.log('isPlaying not updated, forcing update');
        isPlaying = true;
      }
      console.log('isPlaying state after timeout:', isPlaying);
    }, 0);
  }
  
  // Switch back to category browsing
  function backToBrowsing() {
    isPlaying = false;
  }
  
  // Handle category selection
  function handleCategorySelect(event) {
    activeCategory = event.detail.categoryId;
  }
  
  onMount(() => {
    // Set document title
    document.title = title;
    
    console.log('Game Portal initialized');
    console.log(`Available games: ${$games.map(g => g.title).join(', ')}`);
  });
</script>

<ThreeColumnLayout 
  {activeCategory}
  {activeSubcategory}
  {showChatPanel}
  {isPlaying}
  on:categorySelect={handleCategorySelect}
  on:playGame={(event) => {
    console.log('Play game event received:', event.detail);
    
    const gameId = event.detail.gameId;
    const title = event.detail.title;
    
    console.log(`Starting game: ${gameId} - ${title}`);
    
    // Update current game with new game ID and appropriate title
    currentGame.update(game => {
      console.log('Updating current game:', game, 'to:', gameId, title);
      return { 
        ...game, 
        id: gameId,
        title: title || game.title
      };
    });
    
    // Show game page
    startPlaying();
    console.log('Game play mode activated, isPlaying:', isPlaying);
  }}
  on:subcategorySelect={(event) => {
    activeSubcategory = event.detail.subcategoryId;
  }}
>
  {#if isPlaying}
    <!-- Game Play View -->
    <GamePage onBack={backToBrowsing} />
  {:else}
    <!-- Placeholder to ensure slot is used when not playing -->
    <div class="hidden"></div>
  {/if}
</ThreeColumnLayout>