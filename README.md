# Sentinel Support System

Simple transaction monitoring with a built-in knowledge base.

## Quick Start

1. Install deps:
   ```bash
   npm install
   ```

2. Start it up:
   ```bash
   node index.cjs
   ```

3. Try these:
   - Health check: `http://localhost:3001/health`
   - Search KB: `http://localhost:3001/api/kb/search?q=your+query`

## How It's Built

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │    API      │    │  SQLite DB  │
│  (React)    │◄──►│  (Node)     │◄──►│  (file)     │
└─────────────┘    └─────────────┘    └─────────────┘
                        ▲
                        │
                ┌───────┴───────┐
                │  KB Articles  │
                │  (JSON)       │
                └───────────────┘
```

## Why We Made These Choices

1. **SQLite** - Didn't want to mess with DB setup
2. **Simple Search** - Works for now, can upgrade later
3. **REST API** - Everyone knows how to use it
