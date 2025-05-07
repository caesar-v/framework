#!/bin/bash

# Simple script to start the game framework server

echo "===================================="
echo "    Simple Game Framework Starter   "
echo "===================================="
echo

# Make script executable if it's not already
chmod +x simple-server.py

# Start the server
echo "Starting web server..."
python3 simple-server.py

# If the server was stopped, exit with success
echo "Server stopped. Exiting..."
exit 0