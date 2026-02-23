# toughcrowd Implementation Checklist

> **Testing Policy:** Write tests FIRST. Maintain 80%+ code coverage on every merge.

---

## Phase 0: Project Setup & Testing Infrastructure ✅

### Project Initialization
- [x] Initialize Vite + React + TypeScript project
- [x] Configure Tailwind CSS
- [x] Set up ESLint and Prettier
- [x] Create folder structure (components, hooks, services, stores, types, utils)
- [x] Add `.env.example` with required variables
- [x] Add `.env` and `.env.local` to `.gitignore`

### Testing Infrastructure
- [x] Install Vitest (unit/integration testing)
- [x] Install React Testing Library
- [x] Install MSW (Mock Service Worker) for API mocking
- [x] Configure coverage thresholds (80% minimum)
- [x] Add test scripts to package.json (`test`, `test:coverage`, `test:watch`)
- [x] Set up CI workflow (GitHub Actions) to run tests on PR
- [x] Add coverage badge to README (via Codecov)

### TypeScript Interfaces
- [x] Write tests for type guards and validators
- [x] Define `Slide` interface (number, textContent, visualDescription)
- [x] Define `TranscriptSegment` interface (text, timestamp, slideNumber)
- [x] Define `Question` interface (text, type, urgency, trigger, slideRef)
- [x] Define `Session` interface (slides, transcript, questions, settings)
- [x] Define `Persona` type (skeptical | expert | confused | adversarial)
- [x] Define `DeliveryMode` type (interrupt | queue | hybrid)

---

## Phase 1: Foundation (PDF + Slide Viewer) ✅

### PDF Processing Service
- [x] Write unit tests for PDF validation (MIME type, magic bytes, size)
- [x] Write unit tests for text extraction per page
- [x] Write unit tests for error handling (corrupt PDF, empty PDF)
- [x] Implement `validatePDF()` - check type, magic bytes, size limit
- [x] Implement `extractTextFromPDF()` - return array of page text
- [x] Implement `sanitizeFilename()` - strip path traversal chars

### PDF Upload Component
- [x] Write component tests for drag-and-drop upload
- [x] Write component tests for file validation feedback
- [x] Write component tests for upload progress indicator
- [x] Implement `FileUpload` component with drag-and-drop zone
- [x] Add file type validation with user feedback
- [x] Add file size validation (50MB limit)
- [x] Add loading state during processing

### Slide Viewer Component
- [x] Write component tests for slide rendering
- [x] Write component tests for navigation (prev/next/keyboard)
- [x] Write component tests for slide indicator display
- [x] Implement `SlideViewer` component with PDF rendering
- [x] Add prev/next navigation buttons
- [x] Add keyboard shortcuts (arrow keys)
- [x] Add slide indicator ("Slide 3 of 12")
- [x] Add jump-to-slide dropdown

### Session Store (Zustand)
- [x] Write unit tests for store actions
- [x] Write unit tests for state selectors
- [x] Implement `useSessionStore` with slides state
- [x] Add actions: `setSlides`, `setCurrentSlide`, `resetSession`
- [x] Add selectors: `getCurrentSlide`, `getSlideContent`

### Phase 1 Integration
- [x] Write E2E test: upload PDF → view slides → navigate
- [x] Verify text extraction accessible per slide
- [x] Test with various PDF formats (text-heavy, image-heavy, mixed)
- [x] **Verify 80%+ coverage before proceeding**

---

## Phase 2: Transcript Pipeline (Speech-to-Text) ✅

### Speech Recognition Hook
- [x] Write unit tests for hook state management
- [x] Write unit tests for browser compatibility detection
- [x] Write unit tests for error handling
- [x] Implement `useSpeechToText` hook
- [x] Handle start/stop/pause recognition
- [x] Implement continuous recognition mode
- [x] Add browser compatibility check (Chrome detection)
- [x] Add graceful fallback messaging for unsupported browsers

### Transcript Management
- [x] Write unit tests for rolling buffer (60s window)
- [x] Write unit tests for timestamp association
- [x] Write unit tests for segment creation
- [x] Implement rolling buffer logic (keep last 60s)
- [x] Implement cumulative transcript with timestamps
- [x] Implement segment boundary detection

### Transcript Panel Component
- [x] Write component tests for real-time updates
- [x] Write component tests for auto-scroll behavior
- [x] Write component tests for listening indicator
- [x] Implement `TranscriptPanel` component
- [x] Add real-time transcript display
- [x] Add auto-scroll to latest content
- [x] Add visual "listening" indicator
- [x] Add timestamp display per segment

### Slide Transition Tracking
- [x] Write unit tests for transition logging
- [x] Write unit tests for transcript-slide association
- [x] Implement slide change event tracking
- [x] Associate transcript segments with slide numbers
- [x] Log slide timing for session summary

### Session Store Updates
- [x] Add transcript state to store
- [x] Add actions: `addTranscriptSegment`, `clearTranscript`
- [x] Add selectors: `getRecentTranscript`, `getFullTranscript`

### Phase 2 Integration
- [x] Write E2E test: start session → speak → see transcript
- [x] Test microphone permission flow
- [x] Test pause/resume recognition
- [x] Test slide transition tracking
- [x] **Verify 80%+ coverage before proceeding**

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
- [x] Add `.env` files to `.gitignore`
- [x] Document required environment variables

### Phase 1 Security
- [x] Validate PDF MIME type
- [x] Validate PDF magic bytes (`%PDF-`)
- [x] Enforce 50MB file size limit
- [x] Sanitize uploaded filenames

### Phase 2 Security
- [x] Handle microphone permission gracefully
- [x] Ensure audio stays in browser (Web Speech API)
- [x] No server transmission of raw audio

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

- [x] GitHub Actions workflow for tests on PR
- [x] Coverage check (fail if < 80%)
- [x] ESLint check (fail on errors)
- [x] TypeScript check (fail on errors)
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

*Last updated: 2026-02-22*
