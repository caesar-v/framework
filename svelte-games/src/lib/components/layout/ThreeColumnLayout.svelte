<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import ChatPanel from './ChatPanel.svelte';
  import { currentGame } from '../../stores/game';
  import { balance } from '../../stores/balance';
  
  // Props
  export let showChatPanel = false;
  export let activeCategory = 'popular';
  export let activeSubcategory = 'all';
  export let isPlaying = false;
  
  // State variables
  let sidebarCollapsed = false;
  let searchQuery = '';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Toggle chat panel
  function toggleChatPanel() {
    showChatPanel = !showChatPanel;
  }
  
  // Toggle sidebar collapse
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
  
  // Category selection handling
  function handleCategorySelect(event) {
    activeCategory = event.detail.categoryId;
    dispatch('categorySelect', event.detail);
  }
  
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Sample game sections
  const gameSections = [
    { id: 'trending', title: 'Trending Now', count: 12, currentPage: 0, totalPages: 3 },
    { id: 'new-releases', title: 'New Releases', count: 8, currentPage: 0, totalPages: 2 },
    { id: 'recommended', title: 'Recommended for You', count: 6, currentPage: 0, totalPages: 2 },
    { id: 'most-played', title: 'Most Played', count: 15, currentPage: 0, totalPages: 3 }
  ];
  
  // Sample games for each section (expanded with more games)
  const sampleGames = [
    { id: 'game1', title: 'Dice Masters', image: '🎲', category: 'casino' },
    { id: 'game2', title: 'Card Royale', image: '♠️', category: 'card' },
    { id: 'game3', title: 'Slot Mania', image: '🎰', category: 'casino' },
    { id: 'game4', title: 'Roulette Pro', image: '🎯', category: 'casino' },
    { id: 'game5', title: 'Poker Night', image: '♦️', category: 'card' },
    { id: 'game6', title: 'Blackjack Elite', image: '♣️', category: 'card' },
    { id: 'game7', title: 'Lucky Spin', image: '🎡', category: 'casino' },
    { id: 'game8', title: 'Treasure Hunt', image: '🏝️', category: 'arcade' },
    { id: 'game9', title: 'Space Shooter', image: '🚀', category: 'arcade' },
    { id: 'game10', title: 'Gold Rush', image: '💰', category: 'casino' },
    { id: 'game11', title: 'Football Stars', image: '⚽', category: 'sports' },
    { id: 'game12', title: 'Tennis Pro', image: '🎾', category: 'sports' }
  ];
  
  // Handle slider navigation
  function nextSlide(sectionId) {
    const section = gameSections.find(s => s.id === sectionId);
    if (section && section.currentPage < section.totalPages - 1) {
      section.currentPage++;
    }
  }
  
  function prevSlide(sectionId) {
    const section = gameSections.find(s => s.id === sectionId);
    if (section && section.currentPage > 0) {
      section.currentPage--;
    }
  }
  
  // Get games for current page
  function getGamesForSection(sectionId) {
    const section = gameSections.find(s => s.id === sectionId);
    const pageSize = 7; // 7 games per page
    const startIndex = section ? section.currentPage * pageSize : 0;
    return sampleGames.slice(startIndex, startIndex + pageSize);
  }
  
  // Handle search
  function handleSearch() {
    console.log('Searching for:', searchQuery);
  }
  
  // Subcategories for popular games
  const popularSubcategories = [
    { id: 'all', name: 'All Games' },
    { id: 'featured', name: 'Featured' },
    { id: 'recommended', name: 'Recommended' },
    { id: 'new', name: 'New Arrivals' },
    { id: 'slots', name: 'Slots' },
    { id: 'table', name: 'Table Games' },
    { id: 'cards', name: 'Card Games' },
    { id: 'arcade', name: 'Arcade' }
  ];
  
  // Select subcategory
  function selectSubcategory(subcategoryId: string) {
    activeSubcategory = subcategoryId;
    dispatch('subcategorySelect', { subcategoryId });
  }
</script>

<div class="three-column-layout h-screen w-screen overflow-hidden flex max-w-full">
  <!-- Left Column - Sidebar -->
  <div 
    class="column left-column h-full flex flex-col bg-secondary transition-all duration-300 overflow-hidden"
    style="width: {sidebarCollapsed ? '80px' : '250px'}; min-width: {sidebarCollapsed ? '80px' : '250px'}; flex-shrink: 0;">
    
    <!-- Sidebar Header -->
    <div class="column-header h-16 border-b border-border flex items-center px-4">
      <button 
        class="sidebar-toggle w-8 h-8 flex items-center justify-center text-text-secondary hover:text-accent rounded"
        on:click={toggleSidebar}>
        {#if sidebarCollapsed}
        <span>→</span>
        {:else}
        <span>←</span>
        {/if}
      </button>
      
      {#if !sidebarCollapsed}
      <div class="ml-3 text-sm font-medium text-text-secondary">Menu</div>
      {/if}
    </div>
    
    <!-- Sidebar Content -->
    <div class="column-content flex-1 overflow-hidden">
      <Sidebar 
        {activeCategory} 
        collapsed={sidebarCollapsed}
        on:categorySelect={handleCategorySelect} 
      />
    </div>
  </div>
  
  <!-- Middle Column - Main Content -->
  <div class="column middle-column h-full flex flex-col flex-1 min-w-0 bg-primary">
    <!-- Main Header -->
    <div class="column-header h-16 flex justify-between items-center px-6 border-b border-border">
      <!-- Logo -->
      <div class="logo-container">
        <h1 class="text-accent font-bold text-xl">Playtagon</h1>
        <p class="text-text-secondary text-xs italic">Playtime is money</p>
      </div>
      
      <!-- Right Side Controls -->
      <div class="flex items-center gap-3">
        <!-- Notification -->
        <div class="notification-icon relative">
          <button class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-text-secondary hover:text-accent">
            <span>🔔</span>
          </button>
          <span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
        </div>
        
        <!-- Balance/Wallet -->
        <div class="flex items-center gap-2 bg-secondary p-1.5 px-3 rounded shadow-md">
          <span class="text-text-secondary text-sm">💰</span>
          <div class="balance-value-container">
            <span class="text-success font-bold">{$balance.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Profile -->
        <div class="profile-menu">
          <button class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-accent hover:bg-secondary/70">
            <span>👤</span>
          </button>
        </div>
        
        <!-- Chat Toggle -->
        <button 
          class="chat-toggle w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-text-secondary hover:text-accent ml-2 z-10"
          class:active={showChatPanel}
          on:click={toggleChatPanel}>
          <span>💬</span>
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="column-content flex-1 overflow-auto flex justify-center">
      {#if !isPlaying}
        <!-- Canvas container with fixed 1200px width -->
        <div class="canvas-container w-[1200px] mx-auto flex-shrink-0" style="width: 1200px; min-width: 1200px;">
          <!-- Home Page Content -->
          <!-- Two Promotion Banners side by side -->
          <div class="promo-banners w-full p-4 grid grid-cols-2 gap-4">
            <!-- Banner 1 -->
            <div class="banner-container h-48 bg-gradient-to-r from-accent/20 to-accent/5 rounded-lg overflow-hidden relative">
              <div class="banner-content absolute inset-0 flex flex-col justify-center px-6">
                <div class="badge bg-accent/80 text-white text-xs py-1 px-2 rounded inline-block mb-2 w-fit">NEW RELEASE</div>
                <h2 class="banner-title text-xl font-bold mb-2">Fortune Island</h2>
                <p class="banner-text text-text-secondary mb-4 text-sm">Discover hidden treasures and win massive rewards!</p>
                <button 
                  class="btn w-fit"
                  on:click|preventDefault|stopPropagation={() => {
                    console.log('Banner 1 button clicked');
                    dispatch('playGame', { gameId: 'game8', title: 'Treasure Hunt' });
                  }}
                >Play Now</button>
              </div>
              <div class="banner-image absolute right-4 top-1/2 -translate-y-1/2 text-5xl">
                🏝️
              </div>
            </div>
            
            <!-- Banner 2 -->
            <div class="banner-container h-48 bg-gradient-to-r from-success/20 to-success/5 rounded-lg overflow-hidden relative">
              <div class="banner-content absolute inset-0 flex flex-col justify-center px-6">
                <div class="badge bg-success/80 text-white text-xs py-1 px-2 rounded inline-block mb-2 w-fit">TOP RATED</div>
                <h2 class="banner-title text-xl font-bold mb-2">Space Adventure</h2>
                <p class="banner-text text-text-secondary mb-4 text-sm">Blast off into space with our new shooter game!</p>
                <button 
                  class="btn w-fit bg-success"
                  on:click|preventDefault|stopPropagation={() => {
                    console.log('Banner 2 button clicked');
                    dispatch('playGame', { gameId: 'game9', title: 'Space Shooter' });
                  }}
                >Play Now</button>
              </div>
              <div class="banner-image absolute right-4 top-1/2 -translate-y-1/2 text-5xl">
                🚀
              </div>
            </div>
          </div>
          
          <!-- Search Bar -->
          <div class="search-container px-4 mb-6 relative">
            <!-- Width is calculated based on 7 game thumbnails (160px each) plus gaps (24px total) -->
            <div class="mx-auto" style="width: calc(7 * 160px + 6 * 4px); max-width: 100%;">
              <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Search games, categories, or features..."
                class="w-full bg-secondary border border-border rounded-lg py-2 px-4 pr-10 text-text-primary"
                on:keydown={e => e.key === 'Enter' && handleSearch()}
              />
              <button 
                class="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-secondary hover:text-accent"
                on:click={handleSearch}>
                🔍
              </button>
            </div>
          </div>
          
          <!-- Game Sections -->
          <div class="game-sections px-4 space-y-6">
            {#each gameSections as section}
              <div class="game-section">
                <div class="section-header flex justify-between items-center mb-3">
                  <h3 class="text-base font-medium">{section.title}</h3>
                  <div class="flex items-center gap-3">
                    <!-- Navigation Controls Group -->
                    <div class="navigation-controls flex border border-border/50 bg-secondary/30 rounded-full p-1">
                      <button 
                        class="slider-arrow-small w-6 h-6 rounded-full flex items-center justify-center hover:bg-accent/20 disabled:opacity-30"
                        disabled={section.currentPage === 0}
                        on:click={() => prevSlide(section.id)}
                        aria-label="Previous page"
                      >
                        <span class="text-sm">◀</span>
                      </button>
                      <button 
                        class="slider-arrow-small w-6 h-6 rounded-full flex items-center justify-center hover:bg-accent/20 disabled:opacity-30"
                        disabled={section.currentPage === section.totalPages - 1}
                        on:click={() => nextSlide(section.id)}
                        aria-label="Next page"
                      >
                        <span class="text-sm">▶</span>
                      </button>
                    </div>
                    <button class="text-accent text-xs px-2 py-1 hover:underline">View All</button>
                  </div>
                </div>
                
                <!-- Horizontal scrolling games layout with controls only at top -->
                <div class="games-section-container relative w-full">
                  <div class="games-grid w-full overflow-x-auto"> <!-- Remove padding since we removed side arrows -->
                    <div class="flex gap-4 pb-4">
                      {#each getGamesForSection(section.id) as game}
                        <div 
                          class="game-card flex-shrink-0 bg-secondary rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105 cursor-pointer"
                          style="width: 160px; height: 208px; min-width: 160px; min-height: 208px;"
                          on:click={() => {
                            console.log('Clicking game:', game.id, game.title);
                            dispatch('playGame', { gameId: game.id, title: game.title });
                          }}
                          on:keydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              dispatch('playGame', { gameId: game.id, title: game.title });
                            }
                          }}
                          tabindex="0"
                          role="button"
                          aria-label={`Play ${game.title}`}
                        >
                          <div class="game-image h-full bg-gradient-to-b from-accent/20 to-primary flex items-center justify-center">
                            <span class="text-6xl">{game.image}</span>
                          </div>
                          <!-- Game title tooltip -->
                          <div class="game-title absolute bottom-0 left-0 w-full bg-secondary/80 backdrop-blur-sm p-2 text-center">
                            <span class="text-sm font-medium">{game.title}</span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Game Play Content (rendered via slot) -->
        <div class="h-full w-full flex-1 bg-primary">
          <slot></slot>
        </div>
      {/if}
      
      <!-- No footer -->
    </div>
  </div>
  
  <!-- Right Column - Chat Panel -->
  <div 
    class="column right-column h-full flex flex-col bg-secondary transition-all duration-300 overflow-hidden"
    style="width: {showChatPanel ? '320px' : '0'}; min-width: {showChatPanel ? '320px' : '0'}; max-width: {showChatPanel ? '320px' : '0'}; flex-shrink: 0;">
    
    {#if showChatPanel}
      <!-- Chat Header -->
      <div class="column-header h-16 border-b border-border flex justify-between items-center px-4">
        <div class="text-sm font-medium text-text-secondary">Live Chat</div>
        <button 
          class="close-btn w-8 h-8 flex items-center justify-center text-text-secondary hover:text-accent"
          on:click={toggleChatPanel}>
          ✕
        </button>
      </div>
      
      <!-- Chat Content -->
      <div class="column-content flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    {/if}
  </div>
</div>

<style>
  .chat-toggle.active {
    color: var(--color-accent);
    background-color: rgba(88, 166, 255, 0.2);
  }
  
  /* Navigation */
  :global(.nav-item) {
    color: var(--color-text-secondary);
    border-bottom: 2px solid transparent;
  }
  
  :global(.nav-item:hover) {
    color: var(--color-text-primary);
  }
  
  :global(.nav-item.active) {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }
  
  /* Custom scrollbar */
  .games-grid::-webkit-scrollbar {
    height: 4px;
  }
  
  .games-grid::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .games-grid::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  /* Search input */
  input {
    background-color: var(--color-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }
  
  input:focus {
    outline: none;
    border-color: var(--color-accent);
  }
  
  input::placeholder {
    color: var(--color-text-secondary);
  }
  
  /* Game cards */
  .game-card {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-in-out;
    position: relative;
    flex-shrink: 0; /* Ensure thumbnails don't compress */
    width: 160px;
    height: 208px;
  }
  
  .game-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  }
  
  /* Game title tooltip */
  .game-title {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  
  .game-card:hover .game-title {
    opacity: 1;
  }
  
  /* Slider controls */
  .slider-dot {
    transition: all 0.2s ease;
  }
  
  .slider-dot:hover {
    transform: scale(1.2);
  }
  
  /* Slider arrows */
  .slider-arrow {
    opacity: 0.9;
    transition: all 0.2s ease;
  }
  
  .slider-arrow:hover:not(:disabled) {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
    background-color: var(--color-accent);
    color: white;
  }
  
  .slider-arrow:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  /* Games section container */
  .games-section-container {
    position: relative;
  }
  
  /* Game cards */
  .game-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
  
  /* Game images */
  .game-image {
    min-height: 208px;
    height: 100%;
    width: 100%;
  }
</style>