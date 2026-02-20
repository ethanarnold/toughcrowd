# toughcrowd Implementation Checklist

> **Testing Policy:** Write tests FIRST. Maintain 80%+ code coverage on every merge.

---

## Phase 0: Project Setup & Testing Infrastructure

### Project Initialization
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Create folder structure (components, hooks, services, stores, types, utils)
- [ ] Add `.env.example` with required variables
- [ ] Add `.env` and `.env.local` to `.gitignore`

### Testing Infrastructure
- [ ] Install Vitest (unit/integration testing)
- [ ] Install React Testing Library
- [ ] Install MSW (Mock Service Worker) for API mocking
- [ ] Configure coverage thresholds (80% minimum)
- [ ] Add test scripts to package.json (`test`, `test:coverage`, `test:watch`)
- [ ] Set up CI workflow (GitHub Actions) to run tests on PR
- [ ] Add coverage badge to README

### TypeScript Interfaces
- [ ] Write tests for type guards and validators
- [ ] Define `Slide` interface (number, textContent, visualDescription)
- [ ] Define `TranscriptSegment` interface (text, timestamp, slideNumber)
- [ ] Define `Question` interface (text, type, urgency, trigger, slideRef)
- [ ] Define `Session` interface (slides, transcript, questions, settings)
- [ ] Define `Persona` type (skeptical | expert | confused | adversarial)
- [ ] Define `DeliveryMode` type (interrupt | queue | hybrid)

---

## Phase 1: Foundation (PDF + Slide Viewer)

### PDF Processing Service
- [ ] Write unit tests for PDF validation (MIME type, magic bytes, size)
- [ ] Write unit tests for text extraction per page
- [ ] Write unit tests for error handling (corrupt PDF, empty PDF)
- [ ] Implement `validatePDF()` - check type, magic bytes, size limit
- [ ] Implement `extractTextFromPDF()` - return array of page text
- [ ] Implement `sanitizeFilename()` - strip path traversal chars

### PDF Upload Component
- [ ] Write component tests for drag-and-drop upload
- [ ] Write component tests for file validation feedback
- [ ] Write component tests for upload progress indicator
- [ ] Implement `FileUpload` component with drag-and-drop zone
- [ ] Add file type validation with user feedback
- [ ] Add file size validation (50MB limit)
- [ ] Add loading state during processing

### Slide Viewer Component
- [ ] Write component tests for slide rendering
- [ ] Write component tests for navigation (prev/next/keyboard)
- [ ] Write component tests for slide indicator display
- [ ] Implement `SlideViewer` component with PDF rendering
- [ ] Add prev/next navigation buttons
- [ ] Add keyboard shortcuts (arrow keys)
- [ ] Add slide indicator ("Slide 3 of 12")
- [ ] Add jump-to-slide dropdown

### Session Store (Zustand)
- [ ] Write unit tests for store actions
- [ ] Write unit tests for state selectors
- [ ] Implement `useSessionStore` with slides state
- [ ] Add actions: `setSlides`, `setCurrentSlide`, `resetSession`
- [ ] Add selectors: `getCurrentSlide`, `getSlideContent`

### Phase 1 Integration
- [ ] Write E2E test: upload PDF → view slides → navigate
- [ ] Verify text extraction accessible per slide
- [ ] Test with various PDF formats (text-heavy, image-heavy, mixed)
- [ ] **Verify 80%+ coverage before proceeding**

---

## Phase 2: Transcript Pipeline (Speech-to-Text)

### Speech Recognition Hook
- [ ] Write unit tests for hook state management
- [ ] Write unit tests for browser compatibility detection
- [ ] Write unit tests for error handling
- [ ] Implement `useSpeechToText` hook
- [ ] Handle start/stop/pause recognition
- [ ] Implement continuous recognition mode
- [ ] Add browser compatibility check (Chrome detection)
- [ ] Add graceful fallback messaging for unsupported browsers

### Transcript Management
- [ ] Write unit tests for rolling buffer (60s window)
- [ ] Write unit tests for timestamp association
- [ ] Write unit tests for segment creation
- [ ] Implement rolling buffer logic (keep last 60s)
- [ ] Implement cumulative transcript with timestamps
- [ ] Implement segment boundary detection

### Transcript Panel Component
- [ ] Write component tests for real-time updates
- [ ] Write component tests for auto-scroll behavior
- [ ] Write component tests for listening indicator
- [ ] Implement `TranscriptPanel` component
- [ ] Add real-time transcript display
- [ ] Add auto-scroll to latest content
- [ ] Add visual "listening" indicator
- [ ] Add timestamp display per segment

### Slide Transition Tracking
- [ ] Write unit tests for transition logging
- [ ] Write unit tests for transcript-slide association
- [ ] Implement slide change event tracking
- [ ] Associate transcript segments with slide numbers
- [ ] Log slide timing for session summary

### Session Store Updates
- [ ] Add transcript state to store
- [ ] Add actions: `addTranscriptSegment`, `clearTranscript`
- [ ] Add selectors: `getRecentTranscript`, `getFullTranscript`

### Phase 2 Integration
- [ ] Write E2E test: start session → speak → see transcript
- [ ] Test microphone permission flow
- [ ] Test pause/resume recognition
- [ ] Test slide transition tracking
- [ ] **Verify 80%+ coverage before proceeding**

---

## Phase 3: Question Generation Loop

### LLM Integration Service
- [ ] Write unit tests for API request formatting
- [ ] Write unit tests for response parsing
- [ ] Write unit tests for error handling (timeout, rate limit)
- [ ] Write unit tests for rate limiting logic
- [ ] Implement `generateQuestion()` API route
- [ ] Add request validation
- [ ] Add error handling with retry logic
- [ ] Add rate limiting (20 req/min)

### Context Assembly
- [ ] Write unit tests for context building
- [ ] Write unit tests for transcript summarization
- [ ] Write unit tests for question history inclusion
- [ ] Implement `assembleContext()` function
- [ ] Combine current slide content
- [ ] Include recent transcript (30-60s window)
- [ ] Summarize full transcript if > 2000 tokens
- [ ] Include previously asked questions

### Prompt Templates
- [ ] Write unit tests for prompt construction
- [ ] Write unit tests for persona variations
- [ ] Implement main question generation prompt
- [ ] Implement follow-up question prompt
- [ ] Implement persona-specific prompt variations
- [ ] Add prompt injection sanitization

### Question Generation Loop
- [ ] Write unit tests for timer-based triggers
- [ ] Write unit tests for content-based triggers
- [ ] Write unit tests for question parsing
- [ ] Implement `useQuestionGenerator` hook
- [ ] Add timer-based triggers (every 10-15s)
- [ ] Add content-based triggers (significant new content)
- [ ] Parse LLM response into Question objects

### Question Queue Management
- [ ] Write unit tests for queue operations
- [ ] Write unit tests for deduplication logic
- [ ] Write unit tests for urgency classification
- [ ] Implement question queue in store
- [ ] Add urgency classification (interrupt vs. queue)
- [ ] Add question type tagging
- [ ] Implement deduplication against previous questions

### Phase 3 Integration
- [ ] Write E2E test: speak → questions generated
- [ ] Test question relevance to slide content
- [ ] Test deduplication works correctly
- [ ] Test rate limiting prevents abuse
- [ ] **Verify 80%+ coverage before proceeding**

---

## Phase 4: Interactive Q&A Experience

### Question Panel Component
- [ ] Write component tests for question display
- [ ] Write component tests for response input
- [ ] Write component tests for skip/dismiss actions
- [ ] Implement `QuestionPanel` component
- [ ] Add current question display
- [ ] Add response input (text area)
- [ ] Add Skip/Dismiss buttons
- [ ] Add question queue indicator

### Delivery Mode Implementation
- [ ] Write unit tests for interrupt mode logic
- [ ] Write unit tests for queue mode logic
- [ ] Write unit tests for hybrid mode logic
- [ ] Implement interrupt mode (immediate display with alert)
- [ ] Implement queue mode (accumulate, show on demand)
- [ ] Implement hybrid mode (urgent interrupts only)
- [ ] Add audio/visual alerts for interruptions

### Response Handling
- [ ] Write unit tests for response capture
- [ ] Write unit tests for follow-up generation
- [ ] Write unit tests for response quality tracking
- [ ] Implement response capture and storage
- [ ] Send response to LLM for evaluation
- [ ] Generate follow-up questions when warranted
- [ ] Track response quality for summary

### Persona System
- [ ] Write unit tests for persona selection
- [ ] Write unit tests for persona-specific behavior
- [ ] Implement persona selection UI
- [ ] Apply persona-specific prompt variations
- [ ] Maintain consistent questioning style per persona

### Session Controls Component
- [ ] Write component tests for session flow
- [ ] Write component tests for time tracking
- [ ] Implement `SessionControls` component
- [ ] Add start/pause/resume/end buttons
- [ ] Add session timer display
- [ ] Add question count display

### Phase 4 Integration
- [ ] Write E2E test: full Q&A session flow
- [ ] Test all three delivery modes
- [ ] Test follow-up question generation
- [ ] Test all persona types
- [ ] **Verify 80%+ coverage before proceeding**

---

## Phase 5: Polish & Session Summary

### Session Summary Component
- [ ] Write component tests for summary display
- [ ] Write component tests for feedback rendering
- [ ] Implement `SessionSummary` component
- [ ] Display presentation duration
- [ ] Display questions generated vs. answered
- [ ] Show per-question breakdown with response quality
- [ ] Generate areas for improvement (LLM feedback)

### Export Functionality
- [ ] Write unit tests for transcript export
- [ ] Write unit tests for report generation
- [ ] Write unit tests for JSON export
- [ ] Implement transcript export (text/markdown)
- [ ] Implement Q&A report export (PDF)
- [ ] Implement session data export (JSON)

### Visual Polish
- [ ] Implement responsive design (desktop-first)
- [ ] Add loading states and transitions
- [ ] Add error states and recovery UI
- [ ] Add accessibility (ARIA labels, keyboard nav)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Landing Page
- [ ] Create landing page with value proposition
- [ ] Add "Get Started" flow
- [ ] Add sample presentation for demo

### Phase 5 Integration
- [ ] Write E2E test: full session → summary → export
- [ ] Test all export formats
- [ ] Test accessibility with screen reader
- [ ] **Verify 80%+ coverage before merge**

---

## Security Checklist

### Phase 0 Security
- [ ] Add `.env` files to `.gitignore`
- [ ] Document required environment variables

### Phase 1 Security
- [ ] Validate PDF MIME type
- [ ] Validate PDF magic bytes (`%PDF-`)
- [ ] Enforce 50MB file size limit
- [ ] Sanitize uploaded filenames

### Phase 2 Security
- [ ] Handle microphone permission gracefully
- [ ] Ensure audio stays in browser (Web Speech API)
- [ ] No server transmission of raw audio

### Phase 3 Security
- [ ] API keys only in server-side routes
- [ ] Implement rate limiting on API routes
- [ ] Sanitize transcript before LLM calls (prompt injection)
- [ ] Validate API responses before parsing

### Phase 4 Security
- [ ] Sanitize user response input
- [ ] Escape HTML in displayed content
- [ ] Use DOMPurify for any rendered HTML

### Phase 5 Security
- [ ] Add privacy notice about LLM data transmission
- [ ] Implement "Clear All Data" functionality
- [ ] Configure CSP headers
- [ ] Configure security headers (X-Frame-Options, etc.)
- [ ] Run `npm audit` and fix vulnerabilities

---

## CI/CD Checklist

- [ ] GitHub Actions workflow for tests on PR
- [ ] Coverage check (fail if < 80%)
- [ ] ESLint check (fail on errors)
- [ ] TypeScript check (fail on errors)
- [ ] Vercel preview deployments on PR
- [ ] Vercel production deployment on main merge

---

## Environment Variables

```bash
# .env.example
ANTHROPIC_API_KEY=sk-ant-xxx      # Required: Question generation
OPENAI_API_KEY=sk-xxx             # Optional: Vision features (Phase 5)
```

---

## Test Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
npm run test:ui       # Vitest UI
```

---

## Coverage Requirements

| Metric     | Minimum |
|------------|---------|
| Statements | 80%     |
| Branches   | 80%     |
| Functions  | 80%     |
| Lines      | 80%     |

---

*Last updated: 2026-02-20*
