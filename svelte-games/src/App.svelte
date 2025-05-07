<script lang="ts">
  // Main portal component
  import Portal from './lib/components/Portal.svelte';
  
  // Game components (needed for functionality even though not directly rendered)
  import DiceGame from './lib/components/games/DiceGame.svelte';
  import CardGame from './lib/components/games/CardGame.svelte';
</script>

<div class="theme-classic">
  <!-- Game components (not visible, but needed for functionality) -->
  <DiceGame />
  <CardGame />
  
  <!-- Game Portal -->
  <Portal title="Playtagon - Game Portal" />
</div>
