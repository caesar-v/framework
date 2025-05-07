<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let categoryId = 'popular';
  export let activeSubcategory = 'all';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Subcategory definitions for game categories
  const gameSubcategories = {
    popular: [
      { id: 'all', name: 'All Popular', count: 24 },
      { id: 'trending', name: 'Trending', count: 12 },
      { id: 'new', name: 'New', count: 8 },
      { id: 'featured', name: 'Featured', count: 6 }
    ],
    casino: [
      { id: 'all', name: 'All Casino', count: 18 },
      { id: 'slots', name: 'Slots', count: 8 },
      { id: 'table', name: 'Table Games', count: 6 },
      { id: 'dice', name: 'Dice Games', count: 4 }
    ],
    card: [
      { id: 'all', name: 'All Card Games', count: 14 },
      { id: 'poker', name: 'Poker', count: 5 },
      { id: 'blackjack', name: 'Blackjack', count: 3 },
      { id: 'collectible', name: 'Collectible', count: 6 }
    ],
    arcade: [
      { id: 'all', name: 'All Arcade', count: 22 },
      { id: 'action', name: 'Action', count: 9 },
      { id: 'puzzle', name: 'Puzzle', count: 7 },
      { id: 'strategy', name: 'Strategy', count: 6 }
    ],
    sports: [
      { id: 'all', name: 'All Sports', count: 12 },
      { id: 'football', name: 'Football', count: 5 },
      { id: 'basketball', name: 'Basketball', count: 3 },
      { id: 'racing', name: 'Racing', count: 4 }
    ],
    new: [
      { id: 'all', name: 'All New Games', count: 16 },
      { id: 'this-week', name: 'This Week', count: 6 },
      { id: 'this-month', name: 'This Month', count: 10 }
    ]
  };
  
  // Subcategory definitions for user items
  const userSubcategories = {
    favorites: [
      { id: 'all', name: 'All Favorites', count: 8 },
      { id: 'recent', name: 'Recently Played', count: 3 },
      { id: 'most-played', name: 'Most Played', count: 5 }
    ],
    recent: [
      { id: 'all', name: 'All Recent', count: 10 },
      { id: 'today', name: 'Today', count: 2 },
      { id: 'this-week', name: 'This Week', count: 8 }
    ],
    challenges: [
      { id: 'all', name: 'All Challenges', count: 12 },
      { id: 'active', name: 'Active', count: 5 },
      { id: 'completed', name: 'Completed', count: 7 }
    ],
    'my-bets': [
      { id: 'all', name: 'All Bets', count: 15 },
      { id: 'active', name: 'Active', count: 3 },
      { id: 'history', name: 'History', count: 12 }
    ]
  };
  
  // Subcategory definitions for account items
  const accountSubcategories = {
    profile: [
      { id: 'overview', name: 'Overview', count: 0 },
      { id: 'settings', name: 'Settings', count: 0 },
      { id: 'security', name: 'Security', count: 0 }
    ],
    affiliate: [
      { id: 'overview', name: 'Overview', count: 0 },
      { id: 'earnings', name: 'Earnings', count: 0 },
      { id: 'referrals', name: 'Referrals', count: 0 }
    ],
    promotions: [
      { id: 'all', name: 'All Promotions', count: 7 },
      { id: 'active', name: 'Active', count: 3 },
      { id: 'upcoming', name: 'Upcoming', count: 4 }
    ],
    support: [
      { id: 'tickets', name: 'My Tickets', count: 0 },
      { id: 'faq', name: 'FAQ', count: 0 },
      { id: 'contact', name: 'Contact Us', count: 0 }
    ],
    forum: [
      { id: 'all', name: 'All Topics', count: 32 },
      { id: 'popular', name: 'Popular', count: 12 },
      { id: 'my-posts', name: 'My Posts', count: 5 }
    ],
    language: [
      { id: 'english', name: 'English', count: 0 },
      { id: 'spanish', name: 'Spanish', count: 0 },
      { id: 'french', name: 'French', count: 0 },
      { id: 'german', name: 'German', count: 0 }
    ]
  };
  
  // Combined subcategories
  const allSubcategories = {
    ...gameSubcategories,
    ...userSubcategories,
    ...accountSubcategories
  };
  
  // Handle subcategory selection
  function selectSubcategory(subcategoryId: string) {
    activeSubcategory = subcategoryId;
    dispatch('subcategorySelect', { 
      categoryId, 
      subcategoryId 
    });
  }
  
  // Determine which subcategories to show based on the current category
  $: visibleSubcategories = allSubcategories[categoryId] || allSubcategories.popular;
  
  // Determine if we should show the count
  $: showCount = categoryId !== 'profile' && 
                 categoryId !== 'language' && 
                 categoryId !== 'support';
</script>

<div class="category-nav border-b border-border">
  <div class="overflow-x-auto py-2 px-2">
    <div class="flex items-center min-w-max">
      {#each visibleSubcategories as subcategory}
        <button 
          class="subcategory-btn px-4 py-2 mx-1 text-sm transition-colors whitespace-nowrap flex items-center gap-2"
          class:active={activeSubcategory === subcategory.id} 
          on:click={() => selectSubcategory(subcategory.id)}>
          <span>{subcategory.name}</span>
          {#if showCount && subcategory.count > 0}
            <span class="count">{subcategory.count}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .category-nav {
    background-color: var(--color-primary);
  }
  
  .subcategory-btn {
    color: var(--color-text-secondary);
    border-radius: 6px;
  }
  
  .subcategory-btn:hover {
    color: var(--color-text-primary);
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .subcategory-btn.active {
    color: var(--color-text-primary);
    background-color: var(--color-secondary);
  }
  
  .count {
    font-size: 0.75rem;
    background-color: rgba(88, 166, 255, 0.2);
    color: var(--color-accent);
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
  }
  
  .active .count {
    background-color: rgba(88, 166, 255, 0.3);
  }
</style>