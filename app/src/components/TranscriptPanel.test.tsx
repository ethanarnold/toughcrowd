import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TranscriptPanel } from './TranscriptPanel'
import type { TranscriptSegment } from '../types'

// Mock the session store
vi.mock('../stores/session', () => ({
  useSessionStore: vi.fn(() => ({
    transcript: [],
    isRecording: false,
    getFullTranscript: vi.fn(() => []),
  })),
}))

// Mock the useSpeechToText hook
vi.mock('../hooks/useSpeechToText', () => ({
  useSpeechToText: vi.fn(() => ({
    isSupported: true,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    resetTranscript: vi.fn(),
  })),
}))

import { useSessionStore } from '../stores/session'
import { useSpeechToText } from '../hooks/useSpeechToText'

describe('TranscriptPanel', () => {
  const mockAddTranscriptSegment = vi.fn()
  const mockSetIsRecording = vi.fn()
  const mockClearTranscript = vi.fn()
  const mockStart = vi.fn()
  const mockStop = vi.fn()
  const mockResetTranscript = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useSessionStore).mockReturnValue({
      transcript: [],
      isRecording: false,
      currentSlideIndex: 0,
      addTranscriptSegment: mockAddTranscriptSegment,
      setIsRecording: mockSetIsRecording,
      clearTranscript: mockClearTranscript,
      getFullTranscript: vi.fn(() => []),
    })

    vi.mocked(useSpeechToText).mockReturnValue({
      isSupported: true,
      isListening: false,
      transcript: '',
      interimTranscript: '',
      error: null,
      start: mockStart,
      stop: mockStop,
      resetTranscript: mockResetTranscript,
    })
  })

  describe('rendering', () => {
    it('renders the transcript panel', () => {
      render(<TranscriptPanel />)

      expect(screen.getByTestId('transcript-panel')).toBeInTheDocument()
    })

    it('renders panel header', () => {
      render(<TranscriptPanel />)

      expect(screen.getByText('Transcript')).toBeInTheDocument()
    })

    it('renders start recording button when not recording', () => {
      render(<TranscriptPanel />)

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })

    it('renders stop recording button when recording', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        transcript: [],
        isRecording: true,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => []),
      })

      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: true,
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })
  })

  describe('listening indicator', () => {
    it('shows listening indicator when recording', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        transcript: [],
        isRecording: true,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => []),
      })

      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: true,
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      expect(screen.getByTestId('listening-indicator')).toBeInTheDocument()
    })

    it('hides listening indicator when not recording', () => {
      render(<TranscriptPanel />)

      expect(screen.queryByTestId('listening-indicator')).not.toBeInTheDocument()
    })
  })

  describe('transcript display', () => {
    it('shows empty state when no transcript', () => {
      render(<TranscriptPanel />)

      expect(screen.getByText(/click "start" to begin recording/i)).toBeInTheDocument()
    })

    it('displays transcript segments', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Hello world', timestamp: 1000, slideNumber: 1 },
        { text: 'This is a test', timestamp: 2000, slideNumber: 1 },
      ]

      vi.mocked(useSessionStore).mockReturnValue({
        transcript: segments,
        isRecording: false,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => segments),
      })

      render(<TranscriptPanel />)

      expect(screen.getByText('Hello world')).toBeInTheDocument()
      expect(screen.getByText('This is a test')).toBeInTheDocument()
    })

    it('displays interim transcript with different styling', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        transcript: [],
        isRecording: true,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => []),
      })

      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: true,
        isListening: true,
        transcript: '',
        interimTranscript: 'typing in progress',
        error: null,
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      const interimElement = screen.getByTestId('interim-transcript')
      expect(interimElement).toHaveTextContent('typing in progress')
    })
  })

  describe('recording controls', () => {
    it('starts recording when start button clicked', () => {
      render(<TranscriptPanel />)

      fireEvent.click(screen.getByRole('button', { name: /start/i }))

      expect(mockStart).toHaveBeenCalled()
      expect(mockSetIsRecording).toHaveBeenCalledWith(true)
    })

    it('stops recording when stop button clicked', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        transcript: [],
        isRecording: true,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => []),
      })

      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: true,
        isListening: true,
        transcript: '',
        interimTranscript: '',
        error: null,
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      fireEvent.click(screen.getByRole('button', { name: /stop/i }))

      expect(mockStop).toHaveBeenCalled()
      expect(mockSetIsRecording).toHaveBeenCalledWith(false)
    })

    it('shows clear button when transcript exists', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Some content', timestamp: 1000, slideNumber: 1 },
      ]

      vi.mocked(useSessionStore).mockReturnValue({
        transcript: segments,
        isRecording: false,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => segments),
      })

      render(<TranscriptPanel />)

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('clears transcript when clear button clicked', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Some content', timestamp: 1000, slideNumber: 1 },
      ]

      vi.mocked(useSessionStore).mockReturnValue({
        transcript: segments,
        isRecording: false,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => segments),
      })

      render(<TranscriptPanel />)

      fireEvent.click(screen.getByRole('button', { name: /clear/i }))

      expect(mockClearTranscript).toHaveBeenCalled()
      expect(mockResetTranscript).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('displays error message when speech recognition fails', () => {
      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: true,
        isListening: false,
        transcript: '',
        interimTranscript: '',
        error: 'Microphone permission denied',
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      expect(screen.getByText('Microphone permission denied')).toBeInTheDocument()
    })

    it('shows browser not supported message', () => {
      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: false,
        isListening: false,
        transcript: '',
        interimTranscript: '',
        error: 'Speech recognition is not supported',
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      // Both error banner and empty state show not supported message
      const notSupportedElements = screen.getAllByText(/not supported/i)
      expect(notSupportedElements.length).toBeGreaterThanOrEqual(1)
    })

    it('disables start button when not supported', () => {
      vi.mocked(useSpeechToText).mockReturnValue({
        isSupported: false,
        isListening: false,
        transcript: '',
        interimTranscript: '',
        error: 'Speech recognition is not supported',
        start: mockStart,
        stop: mockStop,
        resetTranscript: mockResetTranscript,
      })

      render(<TranscriptPanel />)

      expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
    })
  })

  describe('auto-scroll behavior', () => {
    it('transcript container has auto-scroll enabled', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Content 1', timestamp: 1000, slideNumber: 1 },
        { text: 'Content 2', timestamp: 2000, slideNumber: 1 },
      ]

      vi.mocked(useSessionStore).mockReturnValue({
        transcript: segments,
        isRecording: false,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => segments),
      })

      render(<TranscriptPanel />)

      const container = screen.getByTestId('transcript-content')
      expect(container).toHaveClass('overflow-y-auto')
    })
  })

  describe('timestamp display', () => {
    it('shows relative timestamps for segments', () => {
      const baseTime = Date.now() - 65000 // 65 seconds ago
      const segments: TranscriptSegment[] = [
        { text: 'First segment', timestamp: baseTime, slideNumber: 1 },
      ]

      vi.mocked(useSessionStore).mockReturnValue({
        transcript: segments,
        isRecording: false,
        currentSlideIndex: 0,
        addTranscriptSegment: mockAddTranscriptSegment,
        setIsRecording: mockSetIsRecording,
        clearTranscript: mockClearTranscript,
        getFullTranscript: vi.fn(() => segments),
      })

      render(<TranscriptPanel sessionStartTime={baseTime} />)

      expect(screen.getByText('00:00')).toBeInTheDocument()
    })
  })
})
