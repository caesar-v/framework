/**
 * Card Game - Simple Game Framework
 * 
 * A simple card game where players draw cards and win based on poker-style combinations.
 */

/**
 * Create a new Card Game
 * @param {CanvasManager} canvasManager - Canvas manager instance
 * @param {Object} gameState - Shared game state
 * @returns {Object} Card game instance
 */
function createCardGame(canvasManager, gameState) {
  // Game properties
  let cards = [];
  let isDealing = false;
  let animationCallbackId = -1;
  let currentCardIndex = 0;
  let dealingComplete = false;
  
  // Card suits and values
  const suits = ['♥', '♦', '♠', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  // Game configuration (publicly accessible to allow bet updates)
  const config = {
    betAmount: 10,
    numCards: 5,
    cardWidth: 80,
    cardHeight: 120,
    cardSpacing: 20,
    cardBackColor: '#58a6ff',
    cardRadius: 10,
    dealDelay: 300, // ms between dealing cards
    payouts: {
      fourOfKind: 100,
      fullHouse: 50,
      threeOfKind: 30,
      twoPair: 20,
      onePair: 10
    }
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
    // Only redraw during dealing animation
    if (isDealing) {
      draw();
    }
  }
  
  /**
   * Deal cards
   */
  function dealCards() {
    if (isDealing) return;
    
    isDealing = true;
    dealingComplete = false;
    currentCardIndex = 0;
    
    // Check if we have enough balance
    if (gameState.balance < config.betAmount) {
      if (typeof gameState.showStatus === 'function') {
        gameState.showStatus('Not enough balance to play!', true);
      }
      isDealing = false;
      return;
    }
    
    // Deduct bet
    if (typeof gameState.updateBalance === 'function') {
      gameState.updateBalance(-config.betAmount, 'card bet');
    }
    
    // Create new deck
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Reset cards array
    cards = [];
    
    // Deal cards with animation
    const dealInterval = setInterval(() => {
      if (currentCardIndex < config.numCards) {
        cards.push(deck.pop());
        currentCardIndex++;
        
        // Redraw will happen in animation loop
      } else {
        clearInterval(dealInterval);
        isDealing = false;
        dealingComplete = true;
        handleResult();
      }
    }, config.dealDelay);
  }
  
  /**
   * Handle the result
   */
  function handleResult() {
    // Check for combinations
    const valueCounts = {};
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    // Get the highest pair or three/four of a kind
    let maxCount = 0;
    let pairs = 0;
    
    for (const value in valueCounts) {
      if (valueCounts[value] > maxCount) {
        maxCount = valueCounts[value];
      }
      if (valueCounts[value] === 2) {
        pairs++;
      }
    }
    
    // Calculate winnings
    let winAmount = 0;
    let message = '';
    
    if (maxCount === 4) {
      winAmount = config.payouts.fourOfKind;
      message = `Four of a Kind! You won ${winAmount}!`;
    } else if (maxCount === 3 && pairs === 1) {
      winAmount = config.payouts.fullHouse;
      message = `Full House! You won ${winAmount}!`;
    } else if (maxCount === 3) {
      winAmount = config.payouts.threeOfKind;
      message = `Three of a Kind! You won ${winAmount}!`;
    } else if (pairs === 2) {
      winAmount = config.payouts.twoPair;
      message = `Two Pair! You won ${winAmount}!`;
    } else if (pairs === 1) {
      winAmount = config.payouts.onePair;
      message = `One Pair! You won ${winAmount}!`;
    } else {
      message = 'No winning combination. Try again!';
    }
    
    // Update balance and show message
    if (winAmount > 0) {
      if (typeof gameState.updateBalance === 'function') {
        gameState.updateBalance(winAmount, `card win (${message})`);
      }
    }
    
    if (typeof gameState.showStatus === 'function') {
      gameState.showStatus(message, winAmount === 0);
    }
    
    // Redraw with final result
    draw();
  }
  
  /**
   * Draw the card game
   */
  function draw() {
    const { ctx, canvas } = canvasManager;
    if (!ctx || !canvas) return;
    
    // Clear canvas with background
    canvasManager.clear();
    canvasManager.drawBackground();
    
    // Draw game title
    canvasManager.drawText('Card Game', canvas.width / 2, 30, {
      size: 24,
      weight: 'bold',
      color: '#58a6ff'
    });
    
    // Draw cards
    const totalWidth = config.cardWidth * config.numCards + config.cardSpacing * (config.numCards - 1);
    const startX = (canvas.width - totalWidth) / 2;
    const y = (canvas.height - config.cardHeight) / 2;
    
    for (let i = 0; i < config.numCards; i++) {
      const x = startX + i * (config.cardWidth + config.cardSpacing);
      
      // Draw card back or front
      if (i < cards.length) {
        // Draw card front
        const card = cards[i];
        
        // Draw card background
        canvasManager.drawRoundedRect(
          x, y, config.cardWidth, config.cardHeight, 
          config.cardRadius, 'white', '#0d1117', 2
        );
        
        // Determine card color (red for hearts/diamonds, black for clubs/spades)
        const color = (card.suit === '♥' || card.suit === '♦') ? '#e63946' : '#0d1117';
        
        // Draw value
        canvasManager.drawText(card.value, x + 15, y + 25, {
          size: 24,
          weight: 'bold',
          color,
          align: 'left',
          baseline: 'middle'
        });
        
        // Draw suit
        canvasManager.drawText(card.suit, x + 15, y + 70, {
          size: 36,
          color,
          align: 'left',
          baseline: 'middle'
        });
        
        // Draw small corner value and suit
        canvasManager.drawText(card.value, x + config.cardWidth - 15, y + config.cardHeight - 15, {
          size: 14,
          weight: 'bold',
          color,
          align: 'right',
          baseline: 'middle'
        });
        
        canvasManager.drawText(card.suit, x + config.cardWidth - 15, y + config.cardHeight - 35, {
          size: 14,
          color,
          align: 'right',
          baseline: 'middle'
        });
      } else {
        // Draw card back
        canvasManager.drawRoundedRect(
          x, y, config.cardWidth, config.cardHeight, 
          config.cardRadius, config.cardBackColor, '#0d1117', 2
        );
        
        // Draw pattern
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            canvasManager.drawRoundedRect(
              x + 15 + col * 20, y + 15 + row * 20, 10, 10, 3, '#0d1117'
            );
          }
        }
      }
    }
    
    // Draw instructions or results
    if (!isDealing && cards.length === 0) {
      canvasManager.drawText('Press SPIN to deal cards', canvas.width / 2, canvas.height - 30, {
        size: 16,
        color: '#2ea043'
      });
      
      // Draw game rules
      canvasManager.drawText('Rules: Make poker combinations to win!', canvas.width / 2, 60, {
        size: 14,
        color: '#8b949e'
      });
      
      // Draw payout info
      canvasManager.drawText(`Payouts: 4-Kind: ${config.payouts.fourOfKind}, Full House: ${config.payouts.fullHouse}, 3-Kind: ${config.payouts.threeOfKind}`, 
        canvas.width / 2, 80, {
          size: 14,
          color: '#8b949e'
        });
      
      canvasManager.drawText(`Two Pair: ${config.payouts.twoPair}, Pair: ${config.payouts.onePair}`, 
        canvas.width / 2, 100, {
          size: 14,
          color: '#8b949e'
        });
    } else if (dealingComplete) {
      // Draw message about the hand
      let resultText = 'No winning combination';
      
      // Identify the hand
      const valueCounts = {};
      for (const card of cards) {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
      }
      
      let maxCount = 0;
      let pairs = 0;
      
      for (const value in valueCounts) {
        if (valueCounts[value] > maxCount) {
          maxCount = valueCounts[value];
        }
        if (valueCounts[value] === 2) {
          pairs++;
        }
      }
      
      if (maxCount === 4) {
        resultText = 'Four of a Kind!';
      } else if (maxCount === 3 && pairs === 1) {
        resultText = 'Full House!';
      } else if (maxCount === 3) {
        resultText = 'Three of a Kind!';
      } else if (pairs === 2) {
        resultText = 'Two Pair!';
      } else if (pairs === 1) {
        resultText = 'One Pair!';
      }
      
      canvasManager.drawText(resultText, canvas.width / 2, canvas.height - 30, {
        size: 18,
        weight: 'bold',
        color: resultText === 'No winning combination' ? '#f85149' : '#2ea043'
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
    name: 'Card Game',
    id: 'card',
    init,
    dealCards,
    spin: dealCards, // Alias for consistent interface
    play: dealCards, // Alias for consistent interface
    draw,
    cleanup,
    config // Expose config to allow bet updates
  };
}

// Export the game factory
if (typeof window !== 'undefined') {
  window.createCardGame = createCardGame;
}