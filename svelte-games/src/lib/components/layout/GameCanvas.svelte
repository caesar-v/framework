<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import { currentGame } from '../../stores/game';
  import { gameStatus } from '../../stores/ui';
  
  // Canvas element reference
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrameId: number;
  let gameInitialized = false;
  
  // Initialize canvas and start game loop
  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      
      // Set canvas dimensions
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Start the animation loop
      startAnimationLoop();
      initializeGame();
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      stopAnimationLoop();
    };
  });
  
  // Update canvas when game changes
  afterUpdate(() => {
    if (ctx && $currentGame && !gameInitialized) {
      initializeGame();
    }
  });
  
  function resizeCanvas() {
    if (canvas) {
      const container = canvas.parentElement!;
      // Use fixed width of 1200px for game canvas
      canvas.width = 1200;
      canvas.height = container.clientHeight;
    }
  }
  
  function startAnimationLoop() {
    const loop = () => {
      if (ctx && canvas) {
        // Draw the game
        drawGame();
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
  }
  
  function stopAnimationLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  }
  
  function drawGame() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Choose what to draw based on game type
    if ($currentGame.id === 'dice') {
      drawDiceGame();
    } else if ($currentGame.id === 'card') {
      drawCardGame();
    } else {
      // For sample game thumbnails that were clicked
      drawSampleGame($currentGame.id);
    }
  }
  
  function initializeGame() {
    if (!ctx || !canvas) return;
    gameInitialized = true;
  }
  
  function drawDiceGame() {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Draw a simple dice game background
    ctx.fillStyle = '#1e2a38';
    ctx.fillRect(0, 0, width, height);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DICE GAME', width / 2, 50);
    
    // Draw dice
    const diceSize = Math.min(width, height) / 5;
    const dice1X = width / 2 - diceSize - 20;
    const dice2X = width / 2 + 20;
    const diceY = height / 2 - diceSize / 2;
    
    // Dice 1
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dice1X, diceY, diceSize, diceSize);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(dice1X, diceY, diceSize, diceSize);
    
    // Random dice value 1-6
    const dice1Value = Math.floor(Math.random() * 6) + 1;
    drawDiceDots(dice1X, diceY, diceSize, dice1Value);
    
    // Dice 2
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dice2X, diceY, diceSize, diceSize);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(dice2X, diceY, diceSize, diceSize);
    
    // Random dice value 1-6
    const dice2Value = Math.floor(Math.random() * 6) + 1;
    drawDiceDots(dice2X, diceY, diceSize, dice2Value);
    
    // Draw total
    const total = dice1Value + dice2Value;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Total: ${total}`, width / 2, diceY + diceSize + 50);
    
    // Draw roll button
    ctx.fillStyle = '#4a8cff';
    const buttonWidth = 120;
    const buttonHeight = 40;
    ctx.fillRect(width / 2 - buttonWidth / 2, height - 100, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('ROLL', width / 2, height - 80);
  }
  
  function drawDiceDots(x: number, y: number, size: number, value: number) {
    if (!ctx) return;
    
    const dotSize = size / 10;
    const margin = size / 5;
    
    ctx.fillStyle = '#000000';
    
    // Define dot positions based on dice value
    switch (value) {
      case 1:
        // Center dot
        drawDot(x + size / 2, y + size / 2, dotSize);
        break;
      case 2:
        // Top-left and bottom-right
        drawDot(x + margin, y + margin, dotSize);
        drawDot(x + size - margin, y + size - margin, dotSize);
        break;
      case 3:
        // Top-left, center, bottom-right
        drawDot(x + margin, y + margin, dotSize);
        drawDot(x + size / 2, y + size / 2, dotSize);
        drawDot(x + size - margin, y + size - margin, dotSize);
        break;
      case 4:
        // All corners
        drawDot(x + margin, y + margin, dotSize);
        drawDot(x + size - margin, y + margin, dotSize);
        drawDot(x + margin, y + size - margin, dotSize);
        drawDot(x + size - margin, y + size - margin, dotSize);
        break;
      case 5:
        // All corners + center
        drawDot(x + margin, y + margin, dotSize);
        drawDot(x + size - margin, y + margin, dotSize);
        drawDot(x + size / 2, y + size / 2, dotSize);
        drawDot(x + margin, y + size - margin, dotSize);
        drawDot(x + size - margin, y + size - margin, dotSize);
        break;
      case 6:
        // All corners + middle sides
        drawDot(x + margin, y + margin, dotSize);
        drawDot(x + size - margin, y + margin, dotSize);
        drawDot(x + margin, y + size / 2, dotSize);
        drawDot(x + size - margin, y + size / 2, dotSize);
        drawDot(x + margin, y + size - margin, dotSize);
        drawDot(x + size - margin, y + size - margin, dotSize);
        break;
    }
  }
  
  function drawDot(x: number, y: number, size: number) {
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawCardGame() {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Draw a simple card game background
    ctx.fillStyle = '#193324';
    ctx.fillRect(0, 0, width, height);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CARD GAME', width / 2, 50);
    
    // Draw cards
    const cardWidth = Math.min(width / 5, 120);
    const cardHeight = cardWidth * 1.5;
    const cardSpacing = cardWidth / 3;
    const startX = width / 2 - (cardWidth * 2 + cardSpacing * 1.5);
    const cardsY = height / 2 - cardHeight / 2;
    
    // Draw 4 cards in a row
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    for (let i = 0; i < 4; i++) {
      const x = startX + (cardWidth + cardSpacing) * i;
      
      // Card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, cardsY, cardWidth, cardHeight);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, cardsY, cardWidth, cardHeight);
      
      // Random card value and suit
      const randomSuit = suits[Math.floor(Math.random() * suits.length)];
      const randomValue = values[Math.floor(Math.random() * values.length)];
      const color = randomSuit === '♥' || randomSuit === '♦' ? '#ff0000' : '#000000';
      
      // Draw value and suit in corners
      ctx.fillStyle = color;
      ctx.font = `bold ${cardWidth/6}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(randomValue, x + cardWidth/12, cardsY + cardWidth/4);
      
      ctx.font = `bold ${cardWidth/4}px Arial`;
      ctx.fillText(randomSuit, x + cardWidth/12, cardsY + cardWidth/2);
      
      // Draw large center symbol
      ctx.font = `bold ${cardWidth/2}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(randomSuit, x + cardWidth/2, cardsY + cardHeight/2);
      
      // Draw bottom right value and suit (inverted)
      ctx.font = `bold ${cardWidth/6}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillText(randomValue, x + cardWidth - cardWidth/12, cardsY + cardHeight - cardWidth/4);
      
      ctx.font = `bold ${cardWidth/4}px Arial`;
      ctx.fillText(randomSuit, x + cardWidth - cardWidth/12, cardsY + cardHeight - cardWidth/2);
    }
    
    // Draw deal button
    ctx.fillStyle = '#4a8cff';
    const buttonWidth = 120;
    const buttonHeight = 40;
    ctx.fillRect(width / 2 - buttonWidth / 2, height - 100, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEAL', width / 2, height - 80);
  }
  
  function drawSampleGame(gameId: string) {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Map game IDs to visual themes
    const themes: Record<string, { bgColor: string, title: string, icon: string }> = {
      'game1': { bgColor: '#1e2a38', title: 'Dice Masters', icon: '🎲' },
      'game2': { bgColor: '#193324', title: 'Card Royale', icon: '♠️' },
      'game3': { bgColor: '#2a1e38', title: 'Slot Mania', icon: '🎰' },
      'game4': { bgColor: '#382a1e', title: 'Roulette Pro', icon: '🎯' },
      'game5': { bgColor: '#193830', title: 'Poker Night', icon: '♦️' },
      'game6': { bgColor: '#1e2a38', title: 'Blackjack Elite', icon: '♣️' },
      'game7': { bgColor: '#2a2a38', title: 'Lucky Spin', icon: '🎡' },
      'game8': { bgColor: '#38241e', title: 'Treasure Hunt', icon: '🏝️' },
      'game9': { bgColor: '#1e2438', title: 'Space Shooter', icon: '🚀' },
      'game10': { bgColor: '#382a1e', title: 'Gold Rush', icon: '💰' },
      'game11': { bgColor: '#193824', title: 'Football Stars', icon: '⚽' },
      'game12': { bgColor: '#1e3038', title: 'Tennis Pro', icon: '🎾' }
    };
    
    const theme = themes[gameId] || { bgColor: '#1a1a1a', title: 'Game', icon: '🎮' };
    
    // Draw game background
    ctx.fillStyle = theme.bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(theme.title.toUpperCase(), width / 2, 50);
    
    // Draw large icon in center
    ctx.font = `${Math.min(width, height) / 4}px Arial`;
    ctx.fillText(theme.icon, width / 2, height / 2);
    
    // Draw "Loading..." text
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Game Loading...', width / 2, height - 100);
    
    // Update game status
    gameStatus.set({ message: `${theme.title} loaded successfully!`, isError: false });
  }
</script>

<div class="game-canvas relative w-full h-full flex items-center justify-center">
  <canvas bind:this={canvas} class="w-full h-full"></canvas>
  
  <!-- Game Status Message -->
  <div class="absolute bottom-4 left-4 text-sm bg-primary/80 py-2 px-4 rounded-md shadow-md" class:text-success={!$gameStatus.isError} class:text-error={$gameStatus.isError}>
    {$gameStatus.message}
  </div>
</div>

<style>
  .game-canvas {
    background-color: #121212;
    overflow: hidden;
  }
</style>