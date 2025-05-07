
#!/usr/bin/env python3
"""
Simple HTTP Server for Game Framework
------------------------------------
This script starts a simple HTTP server on port 8080 
to serve the game framework files.
"""

import http.server
import socketserver
import os
import sys

# Configuration
PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Print server information
print(f"Starting server on port {PORT}")
print(f"Serving files from: {DIRECTORY}")
print(f"Open your browser and navigate to: http://localhost:{PORT}/simple-start.html")
print("Press Ctrl+C to stop the server")

# Change to the directory where the script is located
os.chdir(DIRECTORY)

# Custom request handler to add CORS headers
class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format with timestamp
        sys.stderr.write(f"{self.log_date_time_string()}: {format % args}\n")

# Start the server
try:
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print("Server started successfully. Press Ctrl+C to stop.")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped by user.")
except Exception as e:
    print(f"Error starting server: {e}")