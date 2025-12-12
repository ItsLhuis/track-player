---
sidebar_position: 2
id: installation
title: Installation
---

# Installation

```bash
npm install @track-player/web
```

## Requirements

Track Player requires:

- React 16.8+ (for Hooks support)
- A modern browser with Audio API support

## Browser Compatibility

Track Player is compatible with all modern browsers that support the Web Audio API and HTML5
`<audio>` element:

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Polyfills

For older browsers, you might need to include polyfills for:

- Promises
- Array methods
- MediaSession API (optional, only if using media controls)

## TypeScript Support

Track Player includes TypeScript definitions. No additional packages are required.
