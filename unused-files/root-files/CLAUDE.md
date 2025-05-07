# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- **Run local server**: Run `python -m http.server` in the project root to serve files locally
- **Test individual games**: Load the framework in a browser and select the game from dropdown
- **Validate HTML/CSS**: Use browser developer tools to check for errors

## Code Style Guidelines
- **JS Classes**: Use ES6 class syntax with descriptive method names
- **Comments**: JSDoc style for all methods and classes
- **DOM Elements**: Store references in an `elements` object
- **Error Handling**: Use clear error messages, especially in game logic
- **Whitespace**: 2-space indentation for all files
- **Naming**: camelCase for variables/methods, PascalCase for classes
- **Constants**: Use upper case with underscores for constants
- **Initialization**: Initialize instances in constructors
- **CSS Variables**: Use the established CSS variables in styles.css
- **Events**: Centralize event listeners in a setup method
- **Animation**: Always use requestAnimationFrame for animations