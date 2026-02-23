/**
 * Phase 2 Integration Tests
 *
 * Tests the full transcript pipeline:
 * - Speech-to-text integration
 * - Transcript management
 * - Slide transition tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useSessionStore, createInitialState } from '../stores/session'
import { TranscriptPanel } from '../components/TranscriptPanel'
import { createTranscriptSegment, getRollingBuffer, formatTimestamp } from '../utils/transcript'
import type { TranscriptSegment, Slide } from '../types'

// Mock SpeechRecognition
const mockStart = vi.fn()
const mockStop = vi.fn()

interface MockSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: typeof mockStart
  stop: typeof mockStop
  abort: () => void
}

let mockRecognitionInstance: MockSpeechRecognition | null = null

class MockSpeechRecognitionClass implements MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null
  start = mockStart.mockImplementation(() => {
    // Simulate async start
    setTimeout(() => this.onstart?.(), 0)
  })
  stop = mockStop.mockImplementation(() => {
    setTimeout(() => this.onend?.(), 0)
  })
  abort = vi.fn()

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockRecognitionInstance = this
  }
}

describe('Phase 2 Integration: Transcript Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockRecognitionInstance = null

    // Set up SpeechRecognition mock
    Object.defineProperty(window, 'SpeechRecognition', {
      value: MockSpeechRecognitionClass,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: MockSpeechRecognitionClass,
      writable: true,
      configurable: true,
    })

    // Reset session store
    useSessionStore.setState(createInitialState())
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  describe('Session Store Transcript Management', () => {
    it('stores and retrieves transcript segments', () => {
      const segment1 = createTranscriptSegment('Hello world', 1, Date.now())
      const segment2 = createTranscriptSegment('This is a test', 1, Date.now() + 1000)

      useSessionStore.getState().addTranscriptSegment(segment1)
      useSessionStore.getState().addTranscriptSegment(segment2)

      const fullTranscript = useSessionStore.getState().getFullTranscript()
      expect(fullTranscript).toHaveLength(2)
      expect(fullTranscript[0].text).toBe('Hello world')
      expect(fullTranscript[1].text).toBe('This is a test')
    })

    it('gets recent transcript within time window', () => {
      const now = Date.now()

      // Add old segment (outside window)
      useSessionStore.getState().addTranscriptSegment({
        text: 'Old segment',
        timestamp: now - 90000, // 90 seconds ago
        slideNumber: 1,
      })

      // Add recent segments
      useSessionStore.getState().addTranscriptSegment({
        text: 'Recent segment',
        timestamp: now - 30000, // 30 seconds ago
        slideNumber: 1,
      })

      const recent = useSessionStore.getState().getRecentTranscript(60000)
      expect(recent).toHaveLength(1)
      expect(recent[0].text).toBe('Recent segment')
    })

    it('combines transcript text correctly', () => {
      useSessionStore.getState().addTranscriptSegment({
        text: 'Hello',
        timestamp: 1000,
        slideNumber: 1,
      })
      useSessionStore.getState().addTranscriptSegment({
        text: 'world',
        timestamp: 2000,
        slideNumber: 1,
      })

      const text = useSessionStore.getState().getTranscriptText()
      expect(text).toBe('Hello world')
    })

    it('clears transcript on session reset', () => {
      useSessionStore.getState().addTranscriptSegment({
        text: 'Some text',
        timestamp: 1000,
        slideNumber: 1,
      })

      expect(useSessionStore.getState().transcript.length).toBeGreaterThan(0)

      useSessionStore.getState().resetSession()

      expect(useSessionStore.getState().transcript).toEqual([])
    })
  })

  describe('Transcript Panel Integration', () => {
    it('renders and allows starting recording', async () => {
      render(<TranscriptPanel />)

      expect(screen.getByTestId('transcript-panel')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      expect(mockStart).toHaveBeenCalled()
    })

    it('shows transcript segments from session store', () => {
      // Pre-populate transcript
      useSessionStore.getState().addTranscriptSegment({
        text: 'Pre-existing transcript',
        timestamp: Date.now(),
        slideNumber: 1,
      })

      render(<TranscriptPanel />)

      expect(screen.getByText('Pre-existing transcript')).toBeInTheDocument()
    })

    it('displays interim transcript while speaking', async () => {
      render(<TranscriptPanel />)

      // Start recording
      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      // Simulate interim result
      const interimEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Speaking now...' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(interimEvent)
      })

      expect(screen.getByTestId('interim-transcript')).toHaveTextContent('Speaking now...')
    })

    it('adds final transcript to session store', async () => {
      render(<TranscriptPanel />)

      // Start recording
      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      // Simulate final result
      const finalEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Final transcript text' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(finalEvent)
      })

      const transcript = useSessionStore.getState().getFullTranscript()
      expect(transcript).toHaveLength(1)
      expect(transcript[0].text).toBe('Final transcript text')
    })

    it('stops recording and preserves transcript', async () => {
      render(<TranscriptPanel />)

      // Start recording
      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      // Add some transcript
      const finalEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Recorded content' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(finalEvent)
      })

      // Stop recording
      fireEvent.click(screen.getByRole('button', { name: /stop/i }))

      await vi.runAllTimersAsync()

      expect(mockStop).toHaveBeenCalled()
      expect(screen.getByText('Recorded content')).toBeInTheDocument()
    })

    it('clears transcript when clear button clicked', async () => {
      // Pre-populate transcript
      useSessionStore.getState().addTranscriptSegment({
        text: 'Content to clear',
        timestamp: Date.now(),
        slideNumber: 1,
      })

      render(<TranscriptPanel />)

      expect(screen.getByText('Content to clear')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /clear/i }))

      expect(screen.queryByText('Content to clear')).not.toBeInTheDocument()
      expect(useSessionStore.getState().transcript).toEqual([])
    })
  })

  describe('Slide Transition and Transcript Association', () => {
    const mockSlides: Slide[] = [
      { number: 1, textContent: 'Slide 1 content', visualDescription: '', imageUrl: '' },
      { number: 2, textContent: 'Slide 2 content', visualDescription: '', imageUrl: '' },
      { number: 3, textContent: 'Slide 3 content', visualDescription: '', imageUrl: '' },
    ]

    beforeEach(() => {
      useSessionStore.getState().setSlides(mockSlides)
    })

    it('associates transcript segments with correct slide number', () => {
      // On slide 1 (index 0)
      useSessionStore.getState().setCurrentSlide(0)

      const segment1 = createTranscriptSegment('Content for slide 1', 1)
      useSessionStore.getState().addTranscriptSegment(segment1)

      // Move to slide 2
      useSessionStore.getState().setCurrentSlide(1)

      const segment2 = createTranscriptSegment('Content for slide 2', 2)
      useSessionStore.getState().addTranscriptSegment(segment2)

      const transcript = useSessionStore.getState().getFullTranscript()

      expect(transcript[0].slideNumber).toBe(1)
      expect(transcript[1].slideNumber).toBe(2)
    })

    it('maintains transcript across slide navigation', () => {
      useSessionStore.getState().setCurrentSlide(0)
      useSessionStore.getState().addTranscriptSegment({
        text: 'First slide content',
        timestamp: 1000,
        slideNumber: 1,
      })

      useSessionStore.getState().nextSlide()
      useSessionStore.getState().addTranscriptSegment({
        text: 'Second slide content',
        timestamp: 2000,
        slideNumber: 2,
      })

      useSessionStore.getState().previousSlide()

      // Transcript should still contain both segments
      const transcript = useSessionStore.getState().getFullTranscript()
      expect(transcript).toHaveLength(2)
    })
  })

  describe('Transcript Utilities Integration', () => {
    it('getRollingBuffer returns correct segments', () => {
      const now = Date.now()
      const segments: TranscriptSegment[] = [
        { text: 'Very old', timestamp: now - 120000, slideNumber: 1 },
        { text: 'Old', timestamp: now - 70000, slideNumber: 1 },
        { text: 'Recent', timestamp: now - 30000, slideNumber: 1 },
        { text: 'Very recent', timestamp: now - 5000, slideNumber: 2 },
      ]

      const rolling60s = getRollingBuffer(segments, 60000)
      expect(rolling60s).toHaveLength(2)
      expect(rolling60s[0].text).toBe('Recent')
      expect(rolling60s[1].text).toBe('Very recent')

      const rolling45s = getRollingBuffer(segments, 45000)
      expect(rolling45s).toHaveLength(2)

      const rolling10s = getRollingBuffer(segments, 10000)
      expect(rolling10s).toHaveLength(1)
      expect(rolling10s[0].text).toBe('Very recent')
    })

    it('formatTimestamp displays correct relative time', () => {
      const baseTime = 1000000
      expect(formatTimestamp(baseTime, baseTime)).toBe('00:00')
      expect(formatTimestamp(baseTime + 65000, baseTime)).toBe('01:05')
      expect(formatTimestamp(baseTime + 3661000, baseTime)).toBe('01:01:01')
    })
  })

  describe('Error Handling', () => {
    it('handles speech recognition errors gracefully', async () => {
      render(<TranscriptPanel />)

      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      // Simulate error
      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'no-speech' })
      })

      expect(screen.getByText(/no speech detected/i)).toBeInTheDocument()
    })

    it('handles microphone permission denied', async () => {
      render(<TranscriptPanel />)

      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      await vi.runAllTimersAsync()

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'not-allowed' })
      })

      expect(screen.getByText(/microphone permission denied/i)).toBeInTheDocument()
    })
  })

  describe('Full Session Flow', () => {
    const mockSlides: Slide[] = [
      { number: 1, textContent: 'Introduction', visualDescription: '', imageUrl: '' },
      { number: 2, textContent: 'Main Content', visualDescription: '', imageUrl: '' },
    ]

    it('simulates complete presentation practice session', async () => {
      // Setup session with slides
      useSessionStore.getState().setSlides(mockSlides)

      render(<TranscriptPanel />)

      // 1. Start recording on slide 1
      fireEvent.click(screen.getByRole('button', { name: /start/i }))
      await vi.runAllTimersAsync()

      // 2. Simulate speaking on slide 1
      act(() => {
        mockRecognitionInstance?.onresult?.({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              0: { transcript: 'Welcome to my presentation' },
              length: 1,
            },
          ],
        })
      })

      expect(screen.getByText('Welcome to my presentation')).toBeInTheDocument()

      // 3. Navigate to slide 2
      useSessionStore.getState().nextSlide()

      // 4. Simulate speaking on slide 2
      act(() => {
        mockRecognitionInstance?.onresult?.({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              0: { transcript: 'Here is the main content' },
              length: 1,
            },
          ],
        })
      })

      expect(screen.getByText('Here is the main content')).toBeInTheDocument()

      // 5. Stop recording
      fireEvent.click(screen.getByRole('button', { name: /stop/i }))
      await vi.runAllTimersAsync()

      // Verify all transcript is preserved
      const transcript = useSessionStore.getState().getFullTranscript()
      expect(transcript).toHaveLength(2)
      expect(transcript[0].text).toBe('Welcome to my presentation')
      expect(transcript[1].text).toBe('Here is the main content')
    })
  })
})
