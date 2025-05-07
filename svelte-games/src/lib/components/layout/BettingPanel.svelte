<script lang="ts">
  import { bet, minBet, maxBet, changeBet, setBetFraction } from '../../stores/betting';
  import { riskLevel, riskLevels } from '../../stores/game';
  import { currentGame, games, setCurrentGame } from '../../stores/game';
  import { spin } from '../../stores/actions';
</script>

<!-- Bet Amount Panel -->
<div class="mb-4">
  <span class="block mb-2 text-text-secondary text-xs font-medium">Bet Amount</span>
  <div class="flex gap-2 items-center">
    <button class="btn-outline py-1 px-2 text-sm" on:click={() => changeBet(-5)}>-</button>
    <input type="text" class="input text-sm h-8" value={$bet} readonly>
    <button class="btn-outline py-1 px-2 text-sm" on:click={() => changeBet(5)}>+</button>
  </div>
  <div class="flex gap-1 mt-2 text-xs">
    <button class="quick-bet text-xs py-1" on:click={() => setBetFraction(0.5)}>1/2</button>
    <button class="quick-bet text-xs py-1" on:click={() => setBetFraction(2)}>×2</button>
    <button class="quick-bet text-xs py-1" on:click={() => changeBet($maxBet - $bet)}>Max</button>
  </div>
</div>

<!-- Risk Level Panel -->
<div class="mb-4">
  <span class="block mb-2 text-text-secondary text-xs font-medium">Risk Level</span>
  <div class="select-wrapper">
    <select 
      class="w-full p-1 text-sm bg-primary text-text-primary border border-border rounded"
      bind:value={$riskLevel}
    >
      {#each Object.keys($riskLevels) as level}
        <option value={level}>{level.charAt(0).toUpperCase() + level.slice(1)} Risk</option>
      {/each}
    </select>
  </div>
</div>

<!-- Play Controls -->
<div class="play-controls mb-4">
  <button class="spin-btn text-sm py-2 px-4" on:click={spin}>SPIN</button>
</div>

<!-- Quick Stats -->
<div class="quick-stats mb-4 grid grid-cols-2 gap-2">
  <div class="stat-item bg-primary/50 rounded p-2 text-center">
    <div class="text-xs text-text-secondary">Current Bet</div>
    <div class="text-accent text-sm font-medium">{$bet}</div>
  </div>
  <div class="stat-item bg-primary/50 rounded p-2 text-center">
    <div class="text-xs text-text-secondary">Max Win</div>
    <div class="text-success text-sm font-medium">{$bet * 5}</div>
  </div>
</div>

<!-- Hot Number Panel (for game-specific betting) -->
{#if $currentGame.id === 'dice'}
  <div class="mb-4">
    <span class="block mb-2 text-text-secondary text-xs font-medium">Hot Numbers</span>
    <div class="hot-numbers grid grid-cols-3 gap-1">
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">1</button>
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">2</button>
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">3</button>
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">4</button>
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">5</button>
      <button class="hot-number bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">6</button>
    </div>
  </div>
{:else if $currentGame.id === 'card'}
  <div class="mb-4">
    <span class="block mb-2 text-text-secondary text-xs font-medium">Card Selection</span>
    <div class="card-selection grid grid-cols-2 gap-1">
      <button class="card-option bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">High Cards</button>
      <button class="card-option bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">Low Cards</button>
      <button class="card-option bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">Red Only</button>
      <button class="card-option bg-primary/50 p-1 rounded text-center text-sm hover:bg-accent/20">Black Only</button>
    </div>
  </div>
{/if}

<!-- Auto Betting Options -->
<div class="auto-options mb-4">
  <span class="block mb-2 text-text-secondary text-xs font-medium">Auto Betting</span>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <span class="text-xs">Auto Spins</span>
      <input type="number" min="1" max="100" value="10" class="bg-primary text-text-primary border border-border rounded w-16 text-xs p-1">
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs">Stop if Win</span>
      <input type="checkbox" class="accent-accent">
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs">Stop if Loss</span>
      <input type="checkbox" class="accent-accent">
    </div>
  </div>
</div>