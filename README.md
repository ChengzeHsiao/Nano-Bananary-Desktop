<div align="center">

# 🍌 Nano Bananary Desktop

**AI-Powered Image Editor Desktop App**

[![GitHub release](https://img.shields.io/github/v/release/ChengzeHsiao/Nano-Bananary)](https://github.com/ChengzeHsiao/Nano-Bananary/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful desktop application for AI image editing and video generation, powered by Google Gemini API.

</div>

## Features

- 🎨 **50+ Creative Effects** - One-click image transformations without complex prompts
- 🖌️ **Mask Editing** - Select specific areas to edit
- 🎬 **Video Generation** - Transform images into videos
- 🔄 **Continuous Editing** - Use generated results as input for next generation
- 📜 **History Panel** - Quick access to previous generations
- 🌓 **Dark/Light Theme** - Switch between themes
- 🌍 **Bilingual** - English and Chinese interface

## Installation

### macOS (Apple Silicon)

1. Download the latest DMG from [Releases](https://github.com/ChengzeHsiao/Nano-Bananary/releases)
2. Open the DMG file
3. Drag `Nano Bananary.app` to Applications folder
4. On first launch, right-click the app and select "Open" to bypass Gatekeeper

### Build from Source

**Prerequisites:**
- Node.js 18+
- Rust (for Tauri)

```bash
# Clone the repository
git clone https://github.com/ChengzeHsiao/Nano-Bananary.git
cd Nano-Bananary

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Configuration

On first launch, you'll be prompted to enter your **Gemini API Key**:

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Enter the key in the settings dialog
3. The key is stored securely on your device

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri 2.x
- **AI**: Google Gemini API (@google/genai)
- **Styling**: Tailwind CSS

## License

MIT License

## Acknowledgments

- **Original Project**: This project is forked from [ZHO-ZHO-ZHO/Nano-Bananary](https://github.com/ZHO-ZHO-ZHO/Nano-Bananary). Special thanks to [@ZHO-ZHO-ZHO](https://github.com/ZHO-ZHO-ZHO) for the original creative work.
- Powered by [Google Gemini](https://gemini.google.com/)
- Built with [Tauri](https://tauri.app/)
