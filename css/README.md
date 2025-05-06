# CSS Architecture

This document describes the CSS architecture used in the Games Framework project.

## Overview

The CSS has been modularized for better maintainability, organization, and reuse. We follow a component-based approach with clear separation of concerns.

## Directory Structure

```
css/
│
├── base/               # Base styles, variables, and resets
│   ├── animations.css  # Animation keyframes and classes
│   ├── reset.css       # CSS resets and base styles
│   └── variables.css   # CSS variables/custom properties
│
├── components/         # UI component styles
│   ├── auth.css        # Authentication related components
│   ├── betting.css     # Betting panel styles
│   ├── buttons.css     # Button styles
│   ├── chat.css        # Chat panel styles
│   ├── footer.css      # Footer styles
│   ├── forms.css       # Form elements styles
│   ├── game.css        # Game-specific component styles
│   ├── header.css      # Header styles
│   ├── playground.css  # Game playground (canvas) styles
│   ├── popups.css      # Popup and modal styles
│   └── settings.css    # Settings panel styles
│
├── layout/             # Layout structures
│   ├── containers.css  # Main container styles
│   ├── grid.css        # Grid layout styles
│   └── responsive.css  # Media queries and responsive adjustments
│
├── themes/             # Theme variations
│   ├── classic.css     # Classic theme
│   ├── default.css     # Default theme
│   ├── neon.css        # Neon theme
│   └── pirate.css      # Pirate theme
│
├── main.css            # Main file that imports all modules
└── styles.css          # Legacy file (preserved for reference)
```

## Usage

### Importing CSS

All CSS modules are imported through the `main.css` file. To use the CSS, simply include the main file in your HTML:

```html
<link rel="stylesheet" href="css/main.css">
```

### Adding New Components

1. Create a new CSS file in the appropriate directory
2. Add your component styles
3. Import the new file in `main.css`

### Themes

Themes can be applied by adding the theme class to the root element. For example:

```html
<body class="theme-pirate">
```

## Naming Conventions

- We use kebab-case for class names (e.g., `.header-controls`)
- Component classes are named semantically based on their purpose
- BEM (Block Element Modifier) pattern is used for more complex components

## CSS Variables

Global design tokens are defined in `base/variables.css` and can be used throughout the codebase:

```css
color: var(--color-primary);
margin: var(--spacing-md);
```

## Responsive Design

Media queries are organized in `layout/responsive.css` and follow a mobile-first approach with breakpoints at:

- 480px: Very small devices
- 768px: Mobile/tablets
- 900px: Small desktops
- 1200px: Large desktops