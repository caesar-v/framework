# Running the Games Framework

Follow these steps to properly run the Games Framework:

## 1. Setup the project

First, run the setup script to ensure all directories are properly created:

```bash
./setup.sh
```

This script will create necessary directories and ensure the manifest files exist.

## 2. Start the server

Start a local HTTP server to host the files:

```bash
python3 -m http.server
```

This will start a server on port 8000 by default.

## 3. Access the framework

Open your browser and navigate to:

```
http://localhost:8000/
```

## Troubleshooting

If you encounter issues:

1. **Check the browser console for errors**
   - Open your browser's developer tools (F12 in most browsers)
   - Look for errors in the console tab

2. **Module loading issues**
   - If you see import errors, check that the paths in the code match your directory structure
   - Make sure the server is running and responding to requests

3. **Path resolution problems**
   - The framework now uses relative paths for ES module imports
   - If you see 404 errors for certain files, verify they exist at the expected locations

4. **Game loading issues**
   - Check that your game manifest files are valid JSON
   - Verify that the game class files are in the expected locations
   - Make sure the game IDs in the manifests match what the code expects

## Emergency Fix

If everything fails, you can try accessing the emergency recovery page:

```
http://localhost:8000/emergency.html
```

This page provides a minimal version of the framework that loads only essential components.

## Alternative Loading

You can also try the core test page to check individual framework components:

```
http://localhost:8000/core-test.html
```

This allows you to load specific components one by one to identify where issues might be occurring.