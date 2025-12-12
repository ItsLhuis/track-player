---
sidebar_position: 1
id: introduction
title: Introduction
slug: /
---

# Introduction to Track Player

Welcome to **Track Player**, a complete audio library designed for building rich music experiences.
It provides audio playback, playlist management, audio effects, and more, all built upon a unified
core API with platform-specific implementations.

## Our Vision

To offer a robust, feature-rich, and easy-to-use audio playback solution that can be seamlessly
integrated into various environments. By separating the core logic from platform-specific adapters,
we ensure flexibility, maintainability, and consistent behavior across different targets.

## Core Principles

- **Modularity:** A clear separation between the core logic and platform-specific implementations.
- **Extensibility:** Designed to easily add new platform adapters (e.g., native mobile, desktop).
- **Feature-Rich:** Includes advanced audio processing capabilities like equalizers and audio
  visualization.
- **Developer-Friendly:** Provides intuitive APIs and React hooks for rapid development.

## Packages

This monorepo currently contains the following packages:

- **`@track-player/core`**: The foundational package containing all platform-agnostic logic, types,
  and event management for the Track Player.
- **`@track-player/web`**: The web-specific implementation of the Track Player, built for React web
  applications, leveraging HTML5 Audio and the Web Audio API for advanced features.

## Getting Started

To learn more about implementing the web player, please refer to the
[Web Player Installation Guide](./docs/web/installation).

Ready to build your next audio application? Let's get started!
