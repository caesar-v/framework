#!/bin/bash

# Svelte Games Framework Run Script
# This script starts the development server

# ANSI color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. Please check your npm installation.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Dependencies installed successfully.${NC}"
fi

# Start the development server
echo -e "${BLUE}Starting development server...${NC}"
echo -e "${YELLOW}The application will be available at http://localhost:5173${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

npm run dev -- --open