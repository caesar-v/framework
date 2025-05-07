#!/bin/bash

# Simple HTTP server for the game framework
# Uses Python's built-in HTTP server

# ANSI color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Game Framework server...${NC}"

# Find available Python version
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python not found. Please install Python to run the server.${NC}"
    exit 1
fi

# Find an available port
PORT=8000
echo -e "${YELLOW}Checking available port...${NC}"
while netstat -tuln | grep -q ":$PORT " || lsof -i ":$PORT" > /dev/null 2>&1; do
    echo -e "Port $PORT is in use, trying next port..."
    PORT=$((PORT+1))
done

echo -e "${GREEN}Starting HTTP server on port $PORT${NC}"
echo -e "${BLUE}Open your browser to ${YELLOW}http://localhost:$PORT${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Start server with the correct Python command
$PYTHON_CMD -m http.server $PORT