/**
 * Dice Game - Simple Game Framework
 * 
 * A simple dice rolling game where players bet and win based on the dice value.
 */

/**
 * Create a new Dice Game
 * @param {CanvasManager} canvasManager - Canvas manager instance
 * @param {Object} gameState - Shared game state
 * @returns {Object} Dice game instance
 */
function createDiceGame(canvasManager, gameState) {
  // Game properties
  let diceValue = 1;
  let isRolling = false;
  let animationCallbackId = -1;
  
  // Game configuration (publicly accessible to allow bet updates)
  const config = {
    betAmount: 10,
    minWinValue: 4, // Values 4, 5, 6 win
    payoutMultiplier: {
      4: 2, // 2x bet
      5: 3, // 3x bet
      6: 5  // 5x bet
    },
    rollAnimationDuration: 1000,
    rollFrames: 20
  };
  
  /**
   * Initialize the game
   */
  function init() {
    // Initial draw
    draw();
    
    // Add animation callback
    animationCallbackId = canvasManager.addRenderCallback(animate);
  }
  
  /**
   * Animation callback
   * @param {number} deltaTime - Time since last frame
   */
  function animate(deltaTime) {
    // Only redraw during rolling animation
    if (isRolling) {
      draw();
    }
  }
  
  /**
   * Roll the dice
   */
  function rollDice() {
    if (isRolling) return;
    
    isRolling = true;
    
    // Check if we have enough balance
    if (gameState.balance < config.betAmount) {
      if (typeof gameState.showStatus === 'function') {
        gameState.showStatus('Not enough balance to play!', true);
      }
      isRolling = false;
      return;
    }
    
    // Deduct bet
    if (typeof gameState.updateBalance === 'function') {
      gameState.updateBalance(-config.betAmount, 'dice bet');
    }
    
    // Simulate dice rolling animation
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      diceValue = Math.floor(Math.random() * 6) + 1;
      rollCount++;
      
      if (rollCount >= config.rollFrames) {
        clearInterval(rollInterval);
        isRolling = false;
        handleResult(diceValue);
      }
    }, config.rollAnimationDuration / config.rollFrames);
  }
  
  /**
   * Handle the roll result
   * @param {number} value - Dice value
   */
  function handleResult(value) {
    // Check if win
    if (value >= config.minWinValue) {
      // Calculate win amount
      const multiplier = config.payoutMultiplier[value] || 1;
      const winAmount = config.betAmount * multiplier;
      
      // Update balance
      if (typeof gameState.updateBalance === 'function') {
        gameState.updateBalance(winAmount, `dice win (rolled ${value})`);
      }
      
      // Show message
      if (typeof gameState.showStatus === 'function') {
        gameState.showStatus(`You rolled ${value} and won ${winAmount}!`);
      }
    } else {
      // Show message
      if (typeof gameState.showStatus === 'function') {
        gameState.showStatus(`You rolled ${value} and lost your bet.`);
      }
    }
    
    // Redraw with final result
    draw();
  }
  
  /**
   * Draw the dice game
   */
  function draw() {
    const { ctx, canvas } = canvasManager;
    if (!ctx || !canvas) return;
    
    // Clear canvas with background
    canvasManager.clear();
    canvasManager.drawBackground();
    
    // Draw game title
    canvasManager.drawText('Dice Game', canvas.width / 2, 30, {
      size: 24,
      weight: 'bold',
      color: '#58a6ff'
    });
    
    // Draw dice
    const size = Math.min(canvas.width, canvas.height) * 0.3;
    const x = (canvas.width - size) / 2;
    const y = (canvas.height - size) / 2;
    
    // Draw dice body
    canvasManager.drawRoundedRect(x, y, size, size, 15, 'white', '#0d1117', 3);
    
    // Draw dots
    const dotSize = size * 0.15;
    const padding = size * 0.2;
    
    function drawDot(xPos, yPos) {
      canvasManager.drawCircle(x + xPos, y + yPos, dotSize / 2, '#0d1117');
    }
    
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
    if (!isRolling) {
      canvasManager.drawText('Press SPIN to roll the dice', canvas.width / 2, canvas.height - 30, {
        size: 16,
        color: '#2ea043'
      });
      
      // Draw game rules
      canvasManager.drawText('Rules: Roll 4, 5, or 6 to win!', canvas.width / 2, 60, {
        size: 14,
        color: '#8b949e'
      });
      
      // Draw payout info
      canvasManager.drawText(`Win: 4 = ${config.payoutMultiplier[4]}x, 5 = ${config.payoutMultiplier[5]}x, 6 = ${config.payoutMultiplier[6]}x bet`, 
        canvas.width / 2, 80, {
          size: 14,
          color: '#8b949e'
        });
    }
  }
  
  /**
   * Clean up resources
   */
  function cleanup() {
    // Remove animation callback
    if (animationCallbackId >= 0) {
      canvasManager.removeRenderCallback(animationCallbackId);
    }
  }
  
  // Return the game interface
  return {
    name: 'Dice Game',
    id: 'dice',
    init,
    rollDice,
    spin: rollDice, // Alias for consistent interface
    play: rollDice, // Alias for consistent interface
    draw,
    cleanup,
    config // Expose config to allow bet updates
  };
}

// Export the game factory
if (typeof window !== 'undefined') {
  window.createDiceGame = createDiceGame;
}