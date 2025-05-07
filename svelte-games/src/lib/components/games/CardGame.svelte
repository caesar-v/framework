<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasManager } from '../../services/canvasManager';
  import { balance } from '../../stores/balance';
  import { bet } from '../../stores/betting';
  import { gameStatus } from '../../stores/ui';
  import { currentGame } from '../../stores/game';
  
  // Game-specific state
  let cards = [];
  let isDealing = false;
  let currentCardIndex = 0;
  let dealingComplete = false;
  let isPlaying = false;
  
  // Card type definition
  interface Card {
    suit: string;
    value: string;
  }
  
  // Game methods
  function handleWin(amount: number, reason: string) {
    $balance += amount;
    $gameStatus.message = `You won ${amount}! (${reason})`;
    $gameStatus.isError = false;
    isPlaying = false;
  }
  
  function handleLoss(reason: string) {
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
    
    console.log('Playing card game!');
    isPlaying = true;
    
    // Deduct bet
    $balance -= $bet;
    
    // Reset card state
    isDealing = true;
    dealingComplete = false;
    currentCardIndex = 0;
    cards = [];
    
    // Define card suits and values
    const suits = ['♥', '♦', '♠', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    // Create deck
    const deck: Card[] = [];
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
    
    // Deal cards with animation
    const dealInterval = setInterval(() => {
      if (currentCardIndex < 5) {
        cards.push(deck.pop());
        currentCardIndex++;
      } else {
        clearInterval(dealInterval);
        isDealing = false;
        dealingComplete = true;
        handleCardResult();
      }
    }, 300);
  }
  
  function handleCardResult() {
    // Check for combinations
    const valueCounts = {};
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    // Get highest counts
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
    
    // Determine win amount
    let winAmount = 0;
    let message = '';
    
    if (maxCount === 4) {
      winAmount = $bet * 100;
      message = 'Four of a Kind';
    } else if (maxCount === 3 && pairs === 1) {
      winAmount = $bet * 50;
      message = 'Full House';
    } else if (maxCount === 3) {
      winAmount = $bet * 30;
      message = 'Three of a Kind';
    } else if (pairs === 2) {
      winAmount = $bet * 20;
      message = 'Two Pair';
    } else if (pairs === 1) {
      winAmount = $bet * 10;
      message = 'One Pair';
    } else {
      message = 'No winning combination';
    }
    
    // Update balance if win
    if (winAmount > 0) {
      handleWin(winAmount, message);
    } else {
      handleLoss(message);
    }
  }
  
  function draw(cm = canvasManager) {
    const { canvas } = cm;
    if (!canvas) return;
    
    // Draw title
    cm.drawText('Card Game', canvas.width / 2, 30, {
      size: 24,
      weight: 'bold',
      color: '#58a6ff'
    });
    
    // Draw cards
    const cardWidth = 80;
    const cardHeight = 120;
    const cardSpacing = 20;
    const totalWidth = cardWidth * 5 + cardSpacing * 4;
    const startX = (canvas.width - totalWidth) / 2;
    const y = (canvas.height - cardHeight) / 2;
    
    for (let i = 0; i < 5; i++) {
      const x = startX + i * (cardWidth + cardSpacing);
      
      if (i < cards.length) {
        // Draw card front
        const card = cards[i];
        
        // Draw card background
        cm.drawRect(x, y, cardWidth, cardHeight, 'white', '#0d1117', 2);
        
        // Determine card color (red for hearts/diamonds, black for clubs/spades)
        const color = (card.suit === '♥' || card.suit === '♦') ? '#e63946' : '#0d1117';
        
        // Draw value
        cm.drawText(card.value, x + 15, y + 25, {
          size: 24,
          weight: 'bold',
          color,
          align: 'left',
          baseline: 'middle'
        });
        
        // Draw suit
        cm.drawText(card.suit, x + 15, y + 70, {
          size: 36,
          color,
          align: 'left',
          baseline: 'middle'
        });
        
        // Draw small corner value and suit
        cm.drawText(card.value, x + cardWidth - 15, y + cardHeight - 15, {
          size: 14,
          weight: 'bold',
          color,
          align: 'right',
          baseline: 'middle'
        });
        
        cm.drawText(card.suit, x + cardWidth - 15, y + cardHeight - 35, {
          size: 14,
          color,
          align: 'right',
          baseline: 'middle'
        });
      } else {
        // Draw card back
        cm.drawRect(x, y, cardWidth, cardHeight, '#58a6ff', '#0d1117', 2);
        
        // Draw pattern
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            cm.drawRect(x + 15 + col * 20, y + 15 + row * 20, 10, 10, '#0d1117');
          }
        }
      }
    }
    
    // Draw instructions or results
    if (!isDealing && cards.length === 0) {
      cm.drawText('Press SPIN to deal cards', canvas.width / 2, canvas.height - 30, {
        size: 16,
        color: '#2ea043'
      });
      
      // Draw game rules
      cm.drawText('Rules: Make poker combinations to win!', canvas.width / 2, 60, {
        size: 14,
        color: '#8b949e'
      });
      
      // Draw payout info
      cm.drawText('Payouts: 4-Kind: 100x, Full House: 50x, 3-Kind: 30x', canvas.width / 2, 80, {
        size: 14,
        color: '#8b949e'
      });
      
      cm.drawText('Two Pair: 20x, Pair: 10x', canvas.width / 2, 100, {
        size: 14,
        color: '#8b949e'
      });
    } else if (dealingComplete) {
      // Identify hand type
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
      
      let resultText = 'No winning combination';
      
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
      
      cm.drawText(resultText, canvas.width / 2, canvas.height - 30, {
        size: 18,
        weight: 'bold',
        color: resultText === 'No winning combination' ? '#f85149' : '#2ea043'
      });
    }
  }
  
  // Register this game with the game store
  onMount(() => {
    // Update the currentGame store with our methods
    if ($currentGame.id === 'card') {
      currentGame.update(game => ({
        ...game,
        play,
        draw
      }));
    }
    
    // Listen for game changes
    const unsubscribe = currentGame.subscribe(game => {
      if (game.id === 'card') {
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