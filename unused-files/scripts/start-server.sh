#!/bin/bash

# Start-Server.sh - Script to run the framework with proper MIME types
# This script ensures JavaScript files are served correctly to fix browser errors

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${YELLOW}            GAME FRAMEWORK SERVER               ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed${NC}"
    echo "Please install Python 3 and try again"
    exit 1
fi

# Find an available port
PORT=8080
echo -e "${YELLOW}Checking for available port starting from $PORT...${NC}"
while ss -tln | grep -q ":$PORT "; do
    PORT=$((PORT+1))
    echo -e "Port $PORT is in use, trying next port..."
done

echo -e "${GREEN}Using port $PORT for the server${NC}"
echo ""

# Start the server
echo -e "${BLUE}Starting server with proper JavaScript MIME types...${NC}"
echo -e "${YELLOW}Server URL: http://localhost:$PORT${NC}"
echo ""
echo -e "${GREEN}Instructions:${NC}"
echo -e "1. Regular Framework: ${YELLOW}http://localhost:$PORT/index.html${NC}"
echo -e "2. Fixed Standalone: ${YELLOW}http://localhost:$PORT/standalone.html${NC} (use if main page fails)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Run the Python server with correct MIME types
exec python3 -c "
import http.server
import socketserver
import os
import mimetypes

# Register correct MIME types for JavaScript files
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

PORT = $PORT
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

print(f'Server URL: http://localhost:{PORT}')
with socketserver.TCPServer(('', PORT), CustomHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped')
"