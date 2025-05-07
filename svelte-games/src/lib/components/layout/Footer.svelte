<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentGame } from '../../stores/game';
  
  let currentTime = '';
  let interval: number;
  
  // Update time every second
  function updateTime() {
    currentTime = new Date().toLocaleTimeString();
  }
  
  // Set up interval when component mounts
  onMount(() => {
    updateTime();
    interval = setInterval(updateTime, 1000) as unknown as number;
  });
  
  // Clean up interval when component unmounts
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<footer class="flex justify-between py-2 border-t border-border text-xs text-text-secondary">
  <div>Game Framework</div>
  <div>{currentTime}</div>
  <div>{$currentGame.title}</div>
</footer>