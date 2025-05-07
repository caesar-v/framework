#!/bin/bash

# demo.sh - Launch the full-featured demo of the modular game framework
# Shows a more user-friendly startup experience

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Clear screen and show title
clear
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${YELLOW}             GAME FRAMEWORK DEMO             ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Starting up the modular framework with all features...${NC}"
echo ""

# Find an available port starting with 8080
PORT=8080
while [ $(lsof -i:$PORT | wc -l) -gt 0 ]; do
  PORT=$((PORT+1))
  echo -e "${YELLOW}Port $PORT is in use, trying $PORT${NC}"
done

echo -e "${GREEN}Using port $PORT for the game server${NC}"
echo ""

# ASCII art loading animation
function loading_animation() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  
  echo -e "${YELLOW}Starting server...${NC}"
  while kill -0 $pid 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# Start Python HTTP server in the background
python -m http.server $PORT > /dev/null 2>&1 &
SERVER_PID=$!

# Display loading animation for 2 seconds
loading_animation_pid=$SERVER_PID
sleep 2

echo -e "${GREEN}✓ Server started successfully${NC}"
echo ""
echo -e "${CYAN}Featured enabled in this demo:${NC}"
echo -e "  ${GREEN}✓${NC} User profile and balance"
echo -e "  ${GREEN}✓${NC} Live chat panel"
echo -e "  ${GREEN}✓${NC} Game menu and information"
echo -e "  ${GREEN}✓${NC} Betting controls"
echo -e "  ${GREEN}✓${NC} Multiple games (Dice and Card)"
echo -e "  ${GREEN}✓${NC} Theme selection"
echo -e "  ${GREEN}✓${NC} Layout switching (PC/Mobile)"
echo ""

# Opening browser
echo -e "${YELLOW}Opening browser to http://localhost:$PORT/index-modular.html${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "http://localhost:$PORT/index-modular.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open "http://localhost:$PORT/index-modular.html"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # Windows
  start "http://localhost:$PORT/index-modular.html"
fi

echo ""
echo -e "${CYAN}Your game framework is running! ${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when you're done.${NC}"
echo ""

# Wait for user to stop the server
trap "echo -e '${RED}Stopping server...${NC}'; kill $SERVER_PID; exit 0" INT
wait $SERVER_PID