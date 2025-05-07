<script lang="ts">
  import { onMount } from 'svelte';
  import BaseGame from './BaseGame.svelte';
  import { canvasManager } from '../../services/canvasManager';
  import { balance } from '../../stores/balance';
  import { bet } from '../../stores/betting';
  import { gameStatus } from '../../stores/ui';
  import { currentGame } from '../../stores/game';
  
  // Game-specific state
  let diceValue = 1;
  let isRolling = false;
  let isPlaying = false;
  
  // Game methods
  function handleWin(amount, reason) {
    $balance += amount;
    $gameStatus.message = `You won ${amount}! (${reason})`;
    $gameStatus.isError = false;
    isPlaying = false;
  }
  
  function handleLoss(reason) {
    $gameStatus.message = `You lost your bet. (${reason})`;
    $gameStatus.isError = true;
    isPlaying = false;
  }
  
  function play() {
    // Check balance
    if ($balance < $bet) {
      $gameStatus.message = 'Not enough balance to play!';
      $gameStatus.isError = true;
      return;
    }
    
    console.log('Playing dice game!');
    isPlaying = true;
    
    // Deduct bet
    $balance -= $bet;
    
    // Start rolling animation
    isRolling = true;
    diceValue = Math.floor(Math.random() * 6) + 1;
    
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      diceValue = Math.floor(Math.random() * 6) + 1;
      
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        isRolling = false;
        handleDiceResult();
      }
    }, 100);
  }
  
  function handleDiceResult() {
    // Check for win (4, 5, or 6 wins)
    if (diceValue >= 4) {
      // Calculate win amount based on dice value
      const multiplier = diceValue === 4 ? 2 : diceValue === 5 ? 3 : 5;
      const winAmount = $bet * multiplier;
      
      // Update balance
      handleWin(winAmount, `rolled ${diceValue}`);
    } else {
      // Show message for loss
      handleLoss(`rolled ${diceValue}`);
    }
  }
  
  function draw(cm = canvasManager) {
    const { canvas } = cm;
    if (!canvas) return;
    
    // Draw title
    cm.drawText('Dice Game', canvas.width / 2, 30, {
      size: 24,
      weight: 'bold',
      color: '#58a6ff'
    });
    
    // Draw dice
    const size = Math.min(canvas.width, canvas.height) * 0.3;
    const x = (canvas.width - size) / 2;
    const y = (canvas.height - size) / 2;
    
    // Draw dice body
    cm.drawRect(x, y, size, size, 'white', '#0d1117', 3);
    
    // Draw dots
    const dotSize = size * 0.15;
    const padding = size * 0.2;
    
    const drawDot = (xPos: number, yPos: number) => {
      cm.drawCircle(x + xPos, y + yPos, dotSize / 2, '#0d1117');
    };
    
    // Draw dots based on dice value
    switch (diceValue) {
      case 1:
        drawDot(size / 2, size / 2);
        break;
      case 2:
        drawDot(padding, padding);
        drawDot(size - padding, size - padding);
        break;
      case 3:
        drawDot(padding, padding);
        drawDot(size / 2, size / 2);
        drawDot(size - padding, size - padding);
        break;
      case 4:
        drawDot(padding, padding);
        drawDot(padding, size - padding);
        drawDot(size - padding, padding);
        drawDot(size - padding, size - padding);
        break;
      case 5:
        drawDot(padding, padding);
        drawDot(padding, size - padding);
        drawDot(size / 2, size / 2);
        drawDot(size - padding, padding);
        drawDot(size - padding, size - padding);
        break;
      case 6:
        drawDot(padding, padding);
        drawDot(padding, size / 2);
        drawDot(padding, size - padding);
        drawDot(size - padding, padding);
        drawDot(size - padding, size / 2);
        drawDot(size - padding, size - padding);
        break;
    }
    
    // Draw instructions
    if (!isRolling && !isPlaying) {
      cm.drawText('Press SPIN to roll the dice', canvas.width / 2, canvas.height - 30, {
        size: 16,
        color: '#2ea043'
      });
      
      // Draw game rules
      cm.drawText('Rules: Roll 4, 5, or 6 to win!', canvas.width / 2, 60, {
        size: 14,
        color: '#8b949e'
      });
      
      // Draw payout info
      cm.drawText('Win: 4 = 2x, 5 = 3x, 6 = 5x bet', canvas.width / 2, 80, {
        size: 14,
        color: '#8b949e'
      });
    }
  }
  
  // Register this game with the game store
  onMount(() => {
    // Update the currentGame store with our methods
    if ($currentGame.id === 'dice') {
      currentGame.update(game => ({
        ...game,
        play,
        draw
      }));
    }
    
    // Listen for game changes
    const unsubscribe = currentGame.subscribe(game => {
      if (game.id === 'dice') {
        currentGame.update(game => ({
          ...game,
          play,
          draw
        }));
      }
    });
    
    // Clean up subscription
    return unsubscribe;
  });
</script>