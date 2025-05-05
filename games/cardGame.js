/**
 * Card Game - Example implementation using GameFramework
 * 
 * This demonstrates how to create a simple card game using the framework
 */

class CardGame extends BaseGame {
    constructor(config = {}) {
      // Default card game configuration
      const cardConfig = {
        gameTitle: 'Card Master',
        initialBalance: 1000,
        initialBet: 10,
        maxBet: 500,
        numCards: 5,
        cardWidth: 120,
        cardHeight: 180,
        cardBackColor: '#3498db',
        suits: ['♥', '♦', '♠', '♣'],
        values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
        suitColors: {
          '♥': '#e74c3c',
          '♦': '#e74c3c',
          '♠': '#2c3e50',
          '♣': '#2c3e50'
        },
        winningHands: {
          // Map of winning hands and their multipliers
          'royal': 15,      // Royal flush (A, K, Q, J, 10 of same suit)
          'straight': 8,    // 5 cards in sequence
          'flush': 6,       // 5 cards of same suit
          'pair': 2,        // At least one pair
          'high': 1.5       // Just high card (A, K, Q, J)
        }
      };
      
      // Merge configs and call parent constructor
      const mergedConfig = {...cardConfig, ...config};
      super(mergedConfig);
      
      // Ensure this.config is set correctly
      this.config = mergedConfig;
      
      // Current cards
      this.cards = [];
      this.flipped = [];
      this.selectedCards = [];
      
      // Card positions and animation
      this.cardPositions = [];
      this.animationPhase = 0;
      
      // Initialize deck
      this.initDeck();
      
      // Start animation loop
      this.animate();
    }
    
    /**
     * Create a shuffled deck of cards
     */
    initDeck() {
      console.log('CardGame.initDeck - Starting initialization');

      // Add fallbacks for core card properties
      const suits = this.config && this.config.suits ? this.config.suits : ['♥', '♦', '♠', '♣'];
      const values = this.config && this.config.values ? this.config.values : ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const numCards = this.config && this.config.numCards ? this.config.numCards : 5;
      
      // Create a full deck
      const deck = [];
      
      for (const suit of suits) {
        for (const value of values) {
          deck.push({ suit, value });
        }
      }
      
      // Shuffle the deck
      this.shuffle(deck);
      
      // Initialize card state
      this.cards = [];
      this.flipped = [];
      this.selectedCards = [];
      this.cardPositions = [];
      
      // Deal initial cards
      const cardsToDeal = Math.min(numCards, deck.length);
      for (let i = 0; i < cardsToDeal; i++) {
        this.cards.push(deck.pop());
        this.flipped.push(false);
        this.selectedCards.push(false);
        
        // Set initial position
        this.cardPositions.push({
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1
        });
      }
      
      console.log('CardGame.initDeck - Deck initialized:', {
        cards: this.cards,
        positions: this.cardPositions,
        config: this.config
      });
    }
    
    /**
     * Shuffle an array in place
     * @param {Array} array - The array to shuffle
     */
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    
    /**
     * Validate the configuration
     * @param {Object} config - The configuration object
     */
    validateConfig(config) {
      // Call parent method if needed
      super.validateConfig(config);
      
      // Use the passed config object for validation
      // Add safety checks to prevent undefined access
      if (!config) {
        console.warn('Invalid configuration object passed to CardGame');
        return;
      }
      
      if (!config.suits || !Array.isArray(config.suits) || config.suits.length === 0) {
        console.warn('No suits provided in card game configuration');
      }
      
      if (!config.values || !Array.isArray(config.values) || config.values.length === 0) {
        console.warn('No card values provided in card game configuration');
      }
      
      if (!config.numCards || typeof config.numCards !== 'number' || config.numCards <= 0) {
        console.warn('Invalid numCards configuration provided');
      }
      
      if (!config.winningHands || typeof config.winningHands !== 'object') {
        console.warn('Invalid winningHands configuration provided');
      }
    }
    
    /**
     * Animation loop for cards
     */
    animate() {
      // Increment animation phase
      this.animationPhase += 0.02;
      
      // Update card positions for idle animation
      for (let i = 0; i < this.cardPositions.length; i++) {
        if (!this.flipped[i]) {
          // Subtle hovering animation for face-down cards
          this.cardPositions[i].y = 5 * Math.sin(this.animationPhase + i * 0.5);
          this.cardPositions[i].rotation = 2 * Math.sin(this.animationPhase * 0.5 + i * 0.2);
        }
      }
      
      // Request next frame
      requestAnimationFrame(() => this.animate());
      
      // Redraw only if game is initialized and not spinning
      if (this.game && !this.game.state.isSpinning) {
        this.game.drawCanvas();
      }
    }
    
    /**
     * Handle the spin action (deal new cards)
     * @param {Function} callback - Function to call when spin is complete
     */
    spin(callback) {
      // Animation phase 1: flip all cards face down
      this.flipped = Array(this.config.numCards).fill(false);
      this.selectedCards = Array(this.config.numCards).fill(false);
      
      // Scatter cards for animation
      for (let i = 0; i < this.config.numCards; i++) {
        this.cardPositions[i] = {
          x: (Math.random() - 0.5) * 500,
          y: (Math.random() - 0.5) * 300,
          rotation: Math.random() * 360 - 180,
          scale: 0.8 + Math.random() * 0.4
        };
      }
      
      // Create a new deck and shuffle
      const deck = [];
      for (const suit of this.config.suits) {
        for (const value of this.config.values) {
          deck.push({ suit, value });
        }
      }
      this.shuffle(deck);
      
      // Animation time before revealing result
      setTimeout(() => {
        // Deal new cards
        this.cards = [];
        for (let i = 0; i < this.config.numCards; i++) {
          this.cards.push(deck.pop());
        }
        
        // Reset positions
        for (let i = 0; i < this.config.numCards; i++) {
          this.cardPositions[i] = {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1
          };
        }
        
        // Flip all cards face up
        this.flipped = Array(this.config.numCards).fill(true);
        
        // Check for winning combinations
        const result = this.checkWin();
        
        // Return the result
        callback(result);
      }, 2000);
    }
    
    /**
     * Check if there are any winning hands
     * @returns {Object} Result object with win information
     */
    checkWin() {
      // Sort cards by value for easier evaluation
      const sortedCards = [...this.cards].sort((a, b) => {
        const valueA = this.getCardValue(a.value);
        const valueB = this.getCardValue(b.value);
        return valueB - valueA; // Sort descending
      });
      
      // Check for flush (all same suit)
      const isFlush = this.cards.every(card => card.suit === this.cards[0].suit);
      
      // Check for straight
      let isStraight = true;
      for (let i = 1; i < sortedCards.length; i++) {
        const prevValue = this.getCardValue(sortedCards[i-1].value);
        const currValue = this.getCardValue(sortedCards[i].value);
        if (prevValue !== currValue + 1) {
          isStraight = false;
          break;
        }
      }
      
      // Check for royal flush
      const isRoyal = isFlush && 
                      sortedCards[0].value === 'A' &&
                      sortedCards[1].value === 'K' &&
                      sortedCards[2].value === 'Q' &&
                      sortedCards[3].value === 'J' &&
                      sortedCards[4].value === '10';
      
      // Check for pairs
      const valueCounts = {};
      for (const card of this.cards) {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
      }
      const hasPair = Object.values(valueCounts).some(count => count >= 2);
      
      // Check for high card (A, K, Q, J)
      const hasHighCard = sortedCards[0].value === 'A' || 
                          sortedCards[0].value === 'K' ||
                          sortedCards[0].value === 'Q' ||
                          sortedCards[0].value === 'J';
      
      // Determine the win type (best win takes precedence)
      let winType = null;
      if (isRoyal) {
        winType = 'royal';
      } else if (isStraight && isFlush) {
        winType = 'straight';
      } else if (isFlush) {
        winType = 'flush';
      } else if (hasPair) {
        winType = 'pair';
      } else if (hasHighCard) {
        winType = 'high';
      }
      
      const isWin = winType !== null;
      
      return {
        isWin,
        winType,
        cards: this.cards
      };
    }
    
    /**
     * Get numerical value of a card
     * @param {string} value - The card value (A, 2, 3, ..., J, Q, K)
     * @returns {number} The numerical value
     */
    getCardValue(value) {
      const valueMap = {
        'A': 14,
        'K': 13,
        'Q': 12,
        'J': 11,
        '10': 10,
        '9': 9,
        '8': 8,
        '7': 7,
        '6': 6,
        '5': 5,
        '4': 4,
        '3': 3,
        '2': 2
      };
      return valueMap[value] || parseInt(value);
    }
    
    /**
     * Calculate the win amount
     * @param {number} betAmount - The bet amount
     * @param {string} riskLevel - The risk level
     * @param {Object} result - The spin result
     * @returns {number} The calculated win amount
     */
    calculateWin(betAmount, riskLevel, result) {
      const riskMultipliers = {
        'low': 1.5,
        'medium': 3,
        'high': 6
      };
      
      if (!result.isWin || !result.winType) {
        return 0;
      }
      
      // Base win is the win condition's multiplier times the bet
      const baseMultiplier = this.config.winningHands[result.winType];
      const baseWin = baseMultiplier * betAmount;
      
      // Apply risk multiplier
      return baseWin * riskMultipliers[riskLevel];
    }
    
    /**
     * Render a card
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} width - The card width
     * @param {number} height - The card height
     * @param {Object} card - The card object
     * @param {boolean} faceUp - Whether the card is face up
     * @param {boolean} selected - Whether the card is selected
     * @param {Object} position - Position and transformation data
     */
    renderCard(ctx, x, y, width, height, card, faceUp, selected, position) {
      ctx.save();
      
      // Apply position and transformation
      ctx.translate(x + position.x, y + position.y);
      ctx.rotate(position.rotation * Math.PI / 180);
      ctx.scale(position.scale, position.scale);
      
      // Draw card outline
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = selected ? '#FFD700' : '#000';
      ctx.lineWidth = selected ? 3 : 1;
      
      // Card with rounded corners
      const radius = 10;
      ctx.beginPath();
      ctx.moveTo(-width/2 + radius, -height/2);
      ctx.lineTo(width/2 - radius, -height/2);
      ctx.arcTo(width/2, -height/2, width/2, -height/2 + radius, radius);
      ctx.lineTo(width/2, height/2 - radius);
      ctx.arcTo(width/2, height/2, width/2 - radius, height/2, radius);
      ctx.lineTo(-width/2 + radius, height/2);
      ctx.arcTo(-width/2, height/2, -width/2, height/2 - radius, radius);
      ctx.lineTo(-width/2, -height/2 + radius);
      ctx.arcTo(-width/2, -height/2, -width/2 + radius, -height/2, radius);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      
      if (faceUp) {
        // Draw card face
        const suitColor = this.config.suitColors[card.suit];
        
        // Draw value and suit in corners
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = suitColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.value, -width/2 + 10, -height/2 + 10);
        ctx.fillText(card.suit, -width/2 + 10, -height/2 + 40);
        
        // Draw value and suit in opposite corner (upside down)
        ctx.save();
        ctx.translate(width/2 - 10, height/2 - 10);
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(card.value, 0, 0);
        ctx.fillText(card.suit, 0, 30);
        ctx.restore();
        
        // Draw big symbol in center
        ctx.font = '48px Arial';
        ctx.fillStyle = suitColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.suit, 0, 0);
      } else {
        // Draw card back
        ctx.fillStyle = this.config.cardBackColor;
        
        // Inner rectangle
        const innerMargin = 10;
        ctx.fillRect(
          -width/2 + innerMargin,
          -height/2 + innerMargin,
          width - innerMargin * 2,
          height - innerMargin * 2
        );
        
        // Pattern
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        // Diamond pattern
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          for (let j = -3; j <= 3; j++) {
            ctx.rect(
              i * 20 - 10,
              j * 20 - 10,
              20,
              20
            );
          }
        }
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    /**
     * Render the game on the canvas
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} state - The game state
     */
    renderGame(ctx, width, height, state) {
      // Use static flag to prevent excessive logging - log only once
      if (!this._loggedRenderInfo) {
        console.log('CardGame.renderGame - Initial render - config:', this.config);
        console.log('CardGame.renderGame - Initial render - cards:', this.cards);
        console.log('CardGame.renderGame - Initial render - cardPositions:', this.cardPositions);
        this._loggedRenderInfo = true;
      }
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw table background
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(centerX - 500, centerY - 300, 1000, 600);
      
      // Draw table border
      ctx.strokeStyle = '#1e8449';
      ctx.lineWidth = 20;
      ctx.strokeRect(centerX - 500, centerY - 300, 1000, 600);
      
      // Draw title
      ctx.font = 'bold 48px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Card Master', centerX, centerY - 350);
      
      // Add fallbacks for card dimensions
      const cardWidth = this.config && this.config.cardWidth ? this.config.cardWidth : 120;
      const cardHeight = this.config && this.config.cardHeight ? this.config.cardHeight : 180;
      const numCards = this.config && this.config.numCards ? this.config.numCards : 5;
      
      // Draw cards only if they exist
      const cardSpacing = cardWidth * 1.2;
      const startX = centerX - (cardSpacing * (numCards - 1)) / 2;
      
      // Ensure cards array exists before iterating
      if (this.cards && this.cards.length > 0) {
        for (let i = 0; i < this.cards.length; i++) {
          // Ensure position data exists or use defaults
          const position = this.cardPositions && this.cardPositions[i] ? 
                          this.cardPositions[i] : { x: 0, y: 0, rotation: 0, scale: 1 };
          
          // Ensure card data exists
          const card = this.cards[i] || { suit: '♠', value: 'A' };
          const flipped = this.flipped && this.flipped[i] !== undefined ? this.flipped[i] : false;
          const selected = this.selectedCards && this.selectedCards[i] !== undefined ? this.selectedCards[i] : false;
          
          this.renderCard(
            ctx,
            startX + i * cardSpacing,
            centerY,
            cardWidth,
            cardHeight,
            card,
            flipped,
            selected,
            position
          );
        }
      } else {
        // Draw placeholder message if no cards are available
        ctx.font = '24px Montserrat';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('Loading cards...', centerX, centerY);
      }
      
      // Draw instructions
      ctx.font = '24px Montserrat';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Deal cards and look for winning hands!', centerX, centerY + 200);
      
      // Draw winning hands table
      ctx.font = '18px Montserrat';
      ctx.textAlign = 'left';
      let y = centerY - 250;
      
      ctx.fillText('Winning Hands:', centerX + 200, y);
      y += 30;
      
      ctx.fillText('• Royal Flush: 15x', centerX + 200, y);
      y += 25;
      
      ctx.fillText('• Straight: 8x', centerX + 200, y);
      y += 25;
      
      ctx.fillText('• Flush: 6x', centerX + 200, y);
      y += 25;
      
      ctx.fillText('• Pair: 2x', centerX + 200, y);
      y += 25;
      
      ctx.fillText('• High Card (A,K,Q,J): 1.5x', centerX + 200, y);
    }
    
    /**
     * Handle win animation/display
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {number} winAmount - The win amount
     * @param {Object} result - The spin result
     */
    handleWin(ctx, width, height, winAmount, result) {
      const centerX = width / 2;
      
      // Draw win message
      ctx.font = 'bold 64px Poppins';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WIN! +${winAmount.toFixed(2)} €`, centerX, 100);
      
      // Draw the win type
      let winTypeText = '';
      switch (result.winType) {
        case 'royal':
          winTypeText = 'Royal Flush!';
          break;
        case 'straight':
          winTypeText = 'Straight Flush!';
          break;
        case 'flush':
          winTypeText = 'Flush!';
          break;
        case 'pair':
          winTypeText = 'Pair!';
          break;
        case 'high':
          winTypeText = 'High Card!';
          break;
      }
      
      ctx.font = 'bold 36px Poppins';
      ctx.fillText(winTypeText, centerX, 170);
    }
    
    /**
     * Handle loss display
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {number} width - The canvas width
     * @param {number} height - The canvas height
     * @param {Object} result - The spin result
     */
    handleLoss(ctx, width, height, result) {
      const centerX = width / 2;
      
      // Draw try again message
      ctx.font = 'bold 36px Poppins';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No winning hand. Try again!', centerX, height - 100);
    }
  }
  
// Export to global scope
window.CardGame = CardGame;
  