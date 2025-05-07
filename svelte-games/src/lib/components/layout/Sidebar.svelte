<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let activeCategory = 'popular';
  export let collapsed = false;
  
  // User zone items with flat icons
  const userItems = [
    { id: 'favorites', name: 'Favorites', icon: '★' },
    { id: 'recent', name: 'Recent Games', icon: '⏱' },
    { id: 'challenges', name: 'Challenges', icon: '◆' },
    { id: 'my-bets', name: 'My Bets', icon: '⊕' }
  ];
  
  // Categories of games with flat icons
  const gameCategories = [
    { id: 'popular', name: 'Popular', icon: '⋆' },
    { id: 'casino', name: 'Casino', icon: '◉' },
    { id: 'card', name: 'Card Games', icon: '♠' },
    { id: 'arcade', name: 'Arcade', icon: '▣' },
    { id: 'sports', name: 'Sports', icon: '◎' },
    { id: 'new', name: 'New Games', icon: '✧' }
  ];
  
  // Account and service items with flat icons
  const accountItems = [
    { id: 'profile', name: 'Profile', icon: '◯' },
    { id: 'affiliate', name: 'Affiliate', icon: '⊞' },
    { id: 'promotions', name: 'Promotions', icon: '✦' },
    { id: 'support', name: 'Support', icon: '◸' },
    { id: 'forum', name: 'Forum', icon: '◔' },
    { id: 'language', name: 'Language', icon: '◌' }
  ];
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Handle category selection
  function selectCategory(categoryId: string) {
    activeCategory = categoryId;
    dispatch('categorySelect', { categoryId });
  }
</script>

<div class="sidebar h-full w-full flex flex-col">  
  <!-- User Zone -->
  <div class="sidebar-section">
    {#if !collapsed}
    <div class="section-header px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
      User Zone
    </div>
    {/if}
    <div class="section-content bg-primary/20 mx-2 rounded-xl mb-3">
      <ul class="nav-list py-2">
        {#each userItems as item}
          <li>
            <button 
              class="nav-item w-full text-left px-4 py-2 flex items-center gap-3 transition-colors"
              class:active={activeCategory === item.id}
              class:collapsed-item={collapsed}
              title={collapsed ? item.name : ''}
              on:click={() => selectCategory(item.id)}>
              <span class="item-icon text-lg opacity-80">{item.icon}</span>
              {#if !collapsed}
              <span class="item-name text-sm">{item.name}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  
  <!-- Games Zone -->
  <div class="sidebar-section">
    {#if !collapsed}
    <div class="section-header px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
      Games
    </div>
    {/if}
    <div class="section-content bg-primary/20 mx-2 rounded-xl mb-3">
      <ul class="nav-list py-2">
        {#each gameCategories as category}
          <li>
            <button 
              class="nav-item w-full text-left px-4 py-2 flex items-center gap-3 transition-colors"
              class:active={activeCategory === category.id}
              class:collapsed-item={collapsed}
              title={collapsed ? category.name : ''}
              on:click={() => selectCategory(category.id)}>
              <span class="item-icon text-lg opacity-80">{category.icon}</span>
              {#if !collapsed}
              <span class="item-name text-sm">{category.name}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  
  <!-- Account Zone -->
  <div class="sidebar-section mt-auto">
    {#if !collapsed}
    <div class="section-header px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
      Account & Services
    </div>
    {/if}
    <div class="section-content bg-primary/20 mx-2 rounded-xl mb-3">
      <ul class="nav-list py-2">
        {#each accountItems as item}
          <li>
            <button 
              class="nav-item w-full text-left px-4 py-2 flex items-center gap-3 transition-colors"
              class:active={activeCategory === item.id}
              class:collapsed-item={collapsed}
              title={collapsed ? item.name : ''}
              on:click={() => selectCategory(item.id)}>
              <span class="item-icon text-lg opacity-80">{item.icon}</span>
              {#if !collapsed}
              <span class="item-name text-sm">{item.name}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
  .sidebar-section:not(:last-child) {
    margin-bottom: 0.5rem;
  }
  
  .section-content {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  /* Navigation items */
  .nav-item {
    color: var(--color-text-secondary);
    border-radius: 0.5rem;
    font-size: 0.9rem;
    margin: 0 0.5rem;
  }
  
  .nav-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }
  
  .nav-item.active {
    background-color: rgba(255, 204, 0, 0.1);
    color: var(--color-accent);
    box-shadow: 0 0 0 1px rgba(255, 204, 0, 0.2);
  }
  
  /* Items when sidebar is collapsed */
  .collapsed-item {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
    margin: 0 0.25rem;
  }
  
  .collapsed-item.active {
    background-color: rgba(255, 204, 0, 0.1);
    box-shadow: 0 0 0 1px rgba(255, 204, 0, 0.2);
  }
  
  /* Icon styling */
  .item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
  }
  
  .nav-item:hover .item-icon {
    color: var(--color-accent);
  }
  
  .nav-item.active .item-icon {
    color: var(--color-accent);
  }
</style>