import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechToText } from './useSpeechToText'

// Mock SpeechRecognition
const mockStart = vi.fn()
const mockStop = vi.fn()
const mockAbort = vi.fn()

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
  abort: typeof mockAbort
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
  start = mockStart
  stop = mockStop
  abort = mockAbort

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockRecognitionInstance = this
  }
}

describe('useSpeechToText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  afterEach(() => {
    // Clean up
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

  describe('browser compatibility', () => {
    it('detects when speech recognition is supported', () => {
      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.isSupported).toBe(true)
    })

    it('detects when speech recognition is not supported', () => {
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

      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.isSupported).toBe(false)
    })

    it('returns error message for unsupported browsers', () => {
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

      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.error).toBe(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      )
    })
  })

  describe('state management', () => {
    it('starts with isListening false', () => {
      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.isListening).toBe(false)
    })

    it('starts with empty transcript', () => {
      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.transcript).toBe('')
    })

    it('starts with empty interimTranscript', () => {
      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.interimTranscript).toBe('')
    })

    it('starts with no error', () => {
      const { result } = renderHook(() => useSpeechToText())

      expect(result.current.error).toBeNull()
    })
  })

  describe('start/stop recognition', () => {
    it('starts recognition when start is called', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      expect(mockStart).toHaveBeenCalled()
    })

    it('sets isListening to true when recognition starts', async () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      // Simulate onstart callback
      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      expect(result.current.isListening).toBe(true)
    })

    it('stops recognition when stop is called', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      act(() => {
        result.current.stop()
      })

      expect(mockStop).toHaveBeenCalled()
    })

    it('sets isListening to false when recognition stops', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      act(() => {
        result.current.stop()
      })

      act(() => {
        mockRecognitionInstance?.onend?.()
      })

      expect(result.current.isListening).toBe(false)
    })

    it('does nothing when starting in unsupported browser', () => {
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

      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      expect(mockStart).not.toHaveBeenCalled()
    })
  })

  describe('transcript handling', () => {
    it('updates transcript on final result', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      // Simulate speech result event
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(mockEvent)
      })

      expect(result.current.transcript).toBe('Hello world')
    })

    it('updates interimTranscript on interim result', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello wor' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(mockEvent)
      })

      expect(result.current.interimTranscript).toBe('Hello wor')
    })

    it('clears interimTranscript when result is final', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      // First, an interim result
      const interimEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello wor' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(interimEvent)
      })

      expect(result.current.interimTranscript).toBe('Hello wor')

      // Then, a final result
      const finalEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(finalEvent)
      })

      expect(result.current.interimTranscript).toBe('')
      expect(result.current.transcript).toBe('Hello world')
    })

    it('accumulates multiple final transcripts', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      const firstResult = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(firstResult)
      })

      const secondResult = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: ' world' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(secondResult)
      })

      expect(result.current.transcript).toBe('Hello world')
    })

    it('calls onResult callback when provided', () => {
      const onResult = vi.fn()
      const { result } = renderHook(() => useSpeechToText({ onResult }))

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Test transcript' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(mockEvent)
      })

      expect(onResult).toHaveBeenCalledWith('Test transcript', true)
    })
  })

  describe('error handling', () => {
    it('sets error on recognition error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'no-speech' })
      })

      expect(result.current.error).toBe('No speech detected. Please try again.')
    })

    it('handles audio-capture error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'audio-capture' })
      })

      expect(result.current.error).toBe('No microphone detected. Please check your microphone.')
    })

    it('handles not-allowed error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'not-allowed' })
      })

      expect(result.current.error).toBe(
        'Microphone permission denied. Please allow microphone access.'
      )
    })

    it('handles network error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'network' })
      })

      expect(result.current.error).toBe('Network error. Please check your connection.')
    })

    it('handles unknown errors', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'some-unknown-error' })
      })

      expect(result.current.error).toBe('Speech recognition error: some-unknown-error')
    })

    it('sets isListening to false on error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'no-speech' })
      })

      act(() => {
        mockRecognitionInstance?.onend?.()
      })

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('continuous recognition', () => {
    it('enables continuous mode by default', () => {
      renderHook(() => useSpeechToText())

      expect(mockRecognitionInstance?.continuous).toBe(true)
    })

    it('enables interim results by default', () => {
      renderHook(() => useSpeechToText())

      expect(mockRecognitionInstance?.interimResults).toBe(true)
    })

    it('restarts recognition on unexpected end when listening', async () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      expect(result.current.isListening).toBe(true)

      // Simulate unexpected end (without stop being called)
      act(() => {
        mockRecognitionInstance?.onend?.()
      })

      // Should attempt to restart
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('resetTranscript', () => {
    it('clears the transcript', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(mockEvent)
      })

      expect(result.current.transcript).toBe('Hello world')

      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.transcript).toBe('')
    })

    it('clears the interim transcript', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onstart?.()
      })

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello' },
            length: 1,
          },
        ],
      }

      act(() => {
        mockRecognitionInstance?.onresult?.(mockEvent)
      })

      expect(result.current.interimTranscript).toBe('Hello')

      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.interimTranscript).toBe('')
    })

    it('clears any error', () => {
      const { result } = renderHook(() => useSpeechToText())

      act(() => {
        result.current.start()
      })

      act(() => {
        mockRecognitionInstance?.onerror?.({ error: 'no-speech' })
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
