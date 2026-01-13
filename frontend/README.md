# StylusArena Frontend

Next.js 14 frontend for StylusArena - AI Training Game Platform.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- 🎮 Game interface for playing training games
- 🤖 Real-time AI training visualization
- 📊 Agent performance dashboard
- 🏪 Agent marketplace
- 🏆 Tournament system

## Project Structure

```
frontend/
├── app/
│   ├── games/          # Game pages
│   ├── training/       # AI training UI
│   ├── marketplace/    # Agent marketplace
│   ├── components/     # React components
│   └── layout.tsx      # Root layout
├── lib/                # Utilities
└── package.json
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Game Engine**: Phaser.js (to be added)
- **Web3**: wagmi, viem, RainbowKit
