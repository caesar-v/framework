#!/bin/bash

# Start-Modular.sh - Launch the modular version of the game framework
# A simple script to start a Python HTTP server and open the modular framework

echo "Starting Modular Game Framework"
echo "-------------------------------"

# Find an available port starting with 8080
PORT=8080
while [ $(lsof -i:$PORT | wc -l) -gt 0 ]; do
  PORT=$((PORT+1))
  echo "Port $PORT is in use, trying $PORT"
done

echo "Using port $PORT for the server"

# Start Python HTTP server in the background
python -m http.server $PORT &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"

# Wait for server to start
sleep 1

# Open browser
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

echo "Browser should open to http://localhost:$PORT/index-modular.html"
echo "Press Ctrl+C to stop the server"

# Wait for user to stop the server
trap "echo 'Stopping server...'; kill $SERVER_PID; exit 0" INT
wait $SERVER_PID