<script lang="ts">
  import { canvasManager } from '../../services/canvasManager';
  import { balance } from '../../stores/balance';
  import { bet } from '../../stores/betting';
  import { gameStatus } from '../../stores/ui';
  
  // Base game properties
  export const id = '';
  export let title = '';
  
  // Game state
  export let isPlaying = false;
  
  // Methods that games will override
  export const play = () => {
    console.log(`Base game play method called for ${title}`);
    $gameStatus.message = `${title} started`;
    $gameStatus.isError = false;
    isPlaying = true;
  };
  
  export const draw = (cm = canvasManager) => {
    // Base drawing logic - should be overridden by specific games
    const { canvas } = cm;
    if (!canvas) return;
    
    // Draw title
    cm.drawText(title, canvas.width / 2, 30, {
      size: 24,
      weight: 'bold',
      color: '#58a6ff'
    });
    
    // Draw instructions
    if (!isPlaying) {
      cm.drawText('Press SPIN to play', canvas.width / 2, canvas.height - 30, {
        size: 16,
        color: '#2ea043'
      });
    }
  };
  
  // Handle win/loss
  export const handleWin = (amount: number, reason: string) => {
    $balance += amount;
    $gameStatus.message = `You won ${amount}! (${reason})`;
    $gameStatus.isError = false;
    isPlaying = false;
  };
  
  export const handleLoss = (reason: string) => {
    $gameStatus.message = `You lost your bet. (${reason})`;
    $gameStatus.isError = true;
    isPlaying = false;
  };
</script>