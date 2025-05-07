#!/bin/bash

# Setup script for Games Framework
# Creates necessary directories and ensures correct permissions

echo "Setting up Games Framework..."

# Create necessary directories if they don't exist
mkdir -p api/core
mkdir -p api/interfaces
mkdir -p api/services
mkdir -p games/manifests

# Check if manifest files exist and create them if needed
if [ ! -f games/manifests/dice-game.json ]; then
  echo "Creating dice game manifest..."
  cat > games/manifests/dice-game.json << EOL
{
  "id": "dice",
  "version": "1.0.0",
  "name": "Dice Game",
  "description": "A classic dice rolling game where players bet on the outcome of dice rolls",
  "author": "Framework Developer",
  "main": "games/diceGame.js",
  "thumbnail": "assets/images/games/dice-thumbnail.png",
  "category": "dice",
  "tags": ["dice", "simple", "beginner"],
  "dependencies": [],
  "assets": [
    "assets/images/dice/dice1.png",
    "assets/images/dice/dice2.png",
    "assets/images/dice/dice3.png",
    "assets/images/dice/dice4.png",
    "assets/images/dice/dice5.png",
    "assets/images/dice/dice6.png"
  ],
  "config": {
    "defaultRiskLevel": "medium",
    "minBet": 1,
    "maxBet": 500,
    "defaultBet": 10
  }
}
EOL
fi

if [ ! -f games/manifests/card-game.json ]; then
  echo "Creating card game manifest..."
  cat > games/manifests/card-game.json << EOL
{
  "id": "card",
  "version": "1.0.0",
  "name": "Card Game",
  "description": "A simple card game where players bet on high/low outcomes",
  "author": "Framework Developer",
  "main": "games/cardGame.js",
  "thumbnail": "assets/images/games/card-thumbnail.png",
  "category": "card",
  "tags": ["card", "simple", "beginner"],
  "dependencies": [],
  "assets": [
    "assets/images/cards/card-back.png",
    "assets/images/cards/hearts-a.png",
    "assets/images/cards/hearts-k.png",
    "assets/images/cards/hearts-q.png",
    "assets/images/cards/hearts-j.png",
    "assets/images/cards/spades-a.png",
    "assets/images/cards/spades-k.png",
    "assets/images/cards/spades-q.png",
    "assets/images/cards/spades-j.png"
  ],
  "config": {
    "defaultRiskLevel": "medium",
    "minBet": 5,
    "maxBet": 1000,
    "defaultBet": 20
  }
}
EOL
fi

# Ensure execute permission on scripts
chmod +x setup.sh

echo "Setup complete! Now you can run 'python3 -m http.server' to start the server"