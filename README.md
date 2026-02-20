# toughcrowd

An AI-powered tool that simulates a realistic audience listening to your presentation in real time. As you practice, the AI generates contextual questions based on what you're saying and the slides you're showing—just like a real Q&A session.

## Features

- **Live speech-to-text transcription** - Listens to your talk via microphone
- **Slide-aware questioning** - Tracks your current slide to understand visual context
- **Realistic AI committee member** - Generates questions continuously as you speak
- **Multiple question modes** - Interrupt mode, queue mode, or hybrid
- **Persona variations** - Skeptical methodologist, senior expert, devil's advocate, etc.

## How It Works

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Your Voice  │ →  │  Transcript  │ →  │   Question   │
│  (Live Mic)  │    │  Generation  │    │   Generator  │
└──────────────┘    └──────────────┘    └──────────────┘
                           ↑                    ↓
                    ┌──────────────┐    ┌──────────────┐
                    │ Current Slide│    │  AI Poses    │
                    │   Content    │    │  Questions   │
                    └──────────────┘    └──────────────┘
```

## Getting Started

```bash
cd app
npm install
npm run dev
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Vitest + React Testing Library

## Development

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run lint          # ESLint
npm run format        # Prettier
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # Required: Question generation
```

## License

MIT
