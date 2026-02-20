# toughcrowd

AI-powered real-time presentation practice tool that simulates an audience member listening to your talk and generating contextual questions.

[![CI](https://github.com/YOUR_USERNAME/toughcrowd/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/toughcrowd/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/toughcrowd/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/toughcrowd)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Run tests with Vitest UI |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Vitest + React Testing Library + MSW (testing)

## Coverage Requirements

All code must maintain 80%+ coverage for statements, branches, functions, and lines.
