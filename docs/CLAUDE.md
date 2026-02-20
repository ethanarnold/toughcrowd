# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

toughcrowd is an AI-powered real-time presentation practice tool. It simulates an audience or committee member listening to a talk, generating contextual questions based on live speech and slide content.

## Tech Stack (Planned)

- Vite + React + TypeScript
- Tailwind CSS
- Zustand for state management
- Vitest + React Testing Library + MSW for testing

## Build & Test Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
npm run test:ui       # Vitest UI
```

Coverage requirement: 80% minimum for statements, branches, functions, and lines.

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # Required: Question generation
OPENAI_API_KEY=sk-xxx         # Optional: Vision features (Phase 5)
```

## Architecture (Planned)

The system has four main components:

1. **Slide Processor** - Pre-session PDF text extraction, visual content description, and indexing by slide number
2. **Transcript Engine** - Real-time speech-to-text with rolling buffer (last 60s) and cumulative transcript with timestamps
3. **Question Generation Loop** - Periodic LLM calls (every 10-15s) combining slide context + transcript + session history to generate relevant questions
4. **Session Manager** - Orchestrates pipeline, handles question delivery timing, tracks responses

## Key Design Decisions

- Three question delivery modes: Interrupt (real-time), Queue (end of section), Hybrid (urgent interrupts only)
- Multiple persona types for the AI questioner: skeptical methodologist, senior domain expert, confused-but-engaged, adversarial devil's advocate
- Questions tagged with urgency level and type (Clarification/Technical/Conceptual/Methodology/Adversarial/Big Picture)
- Write tests first, maintain 80%+ code coverage on every merge

## Speech-to-Text Strategy

Start with Web Speech API for MVP (free, browser-built-in), plan to upgrade to Deepgram or Whisper API for production quality.

## Development Phases

1. Foundation: PDF upload, text extraction, slide viewer
2. Transcript Pipeline: Speech-to-text integration, real-time display
3. Question Generation: Periodic LLM calls, context assembly, deduplication
4. Interactive Q&A: Delivery UI, response capture, follow-ups
5. Polish: Session summary, export, demo materials

See `IMPLEMENTATION_CHECKLIST.md` for detailed task breakdown per phase.
