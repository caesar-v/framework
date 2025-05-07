<script lang="ts">
  import { balance } from '../../stores/balance';
</script>

<header class="flex justify-between items-center px-6 py-3 border-b border-border">
  <!-- Logo and tagline -->
  <div class="header-left flex items-center">
    <div class="logo-container">
      <h1 class="text-accent font-bold text-xl">Playtagon</h1>
    </div>
  </div>
  
  <!-- Right side with account info -->
  <div class="header-right flex items-center gap-3">
    <!-- Notification indicator -->
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
    
    <!-- Profile menu trigger -->
    <div class="profile-menu">
      <button class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-accent hover:bg-secondary/70">
        <span>👤</span>
      </button>
    </div>
  </div>
</header>