import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore, createInitialState } from './session'
import type { Slide, TranscriptSegment } from '../types'

describe('Session Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSessionStore.setState(createInitialState())
  })

  describe('initial state', () => {
    it('has empty slides array', () => {
      const state = useSessionStore.getState()
      expect(state.slides).toEqual([])
    })

    it('has currentSlideIndex of 0', () => {
      const state = useSessionStore.getState()
      expect(state.currentSlideIndex).toBe(0)
    })

    it('has isLoading false', () => {
      const state = useSessionStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('has error null', () => {
      const state = useSessionStore.getState()
      expect(state.error).toBeNull()
    })

    it('has pdfFile null', () => {
      const state = useSessionStore.getState()
      expect(state.pdfFile).toBeNull()
    })
  })

  describe('setSlides', () => {
    it('sets slides array', () => {
      const slides: Slide[] = [
        { number: 1, textContent: 'Slide 1', visualDescription: '', imageUrl: '' },
        { number: 2, textContent: 'Slide 2', visualDescription: '', imageUrl: '' },
      ]

      useSessionStore.getState().setSlides(slides)

      expect(useSessionStore.getState().slides).toEqual(slides)
    })

    it('resets currentSlideIndex to 0 when setting new slides', () => {
      useSessionStore.setState({ currentSlideIndex: 5 })

      const slides: Slide[] = [
        { number: 1, textContent: 'New', visualDescription: '', imageUrl: '' },
      ]
      useSessionStore.getState().setSlides(slides)

      expect(useSessionStore.getState().currentSlideIndex).toBe(0)
    })

    it('clears error when setting slides', () => {
      useSessionStore.setState({ error: 'Previous error' })

      const slides: Slide[] = [
        { number: 1, textContent: 'Test', visualDescription: '', imageUrl: '' },
      ]
      useSessionStore.getState().setSlides(slides)

      expect(useSessionStore.getState().error).toBeNull()
    })
  })

  describe('setCurrentSlide', () => {
    beforeEach(() => {
      const slides: Slide[] = [
        { number: 1, textContent: 'Slide 1', visualDescription: '', imageUrl: '' },
        { number: 2, textContent: 'Slide 2', visualDescription: '', imageUrl: '' },
        { number: 3, textContent: 'Slide 3', visualDescription: '', imageUrl: '' },
      ]
      useSessionStore.getState().setSlides(slides)
    })

    it('sets current slide index to valid value', () => {
      useSessionStore.getState().setCurrentSlide(1)
      expect(useSessionStore.getState().currentSlideIndex).toBe(1)
    })

    it('clamps index to 0 when negative', () => {
      useSessionStore.getState().setCurrentSlide(-5)
      expect(useSessionStore.getState().currentSlideIndex).toBe(0)
    })

    it('clamps index to last slide when exceeding length', () => {
      useSessionStore.getState().setCurrentSlide(100)
      expect(useSessionStore.getState().currentSlideIndex).toBe(2)
    })

    it('handles empty slides array', () => {
      useSessionStore.setState({ slides: [] })
      useSessionStore.getState().setCurrentSlide(5)
      expect(useSessionStore.getState().currentSlideIndex).toBe(0)
    })
  })

  describe('nextSlide', () => {
    beforeEach(() => {
      const slides: Slide[] = [
        { number: 1, textContent: 'Slide 1', visualDescription: '', imageUrl: '' },
        { number: 2, textContent: 'Slide 2', visualDescription: '', imageUrl: '' },
        { number: 3, textContent: 'Slide 3', visualDescription: '', imageUrl: '' },
      ]
      useSessionStore.getState().setSlides(slides)
    })

    it('advances to next slide', () => {
      useSessionStore.getState().nextSlide()
      expect(useSessionStore.getState().currentSlideIndex).toBe(1)
    })

    it('does not exceed last slide', () => {
      useSessionStore.setState({ currentSlideIndex: 2 })
      useSessionStore.getState().nextSlide()
      expect(useSessionStore.getState().currentSlideIndex).toBe(2)
    })
  })

  describe('previousSlide', () => {
    beforeEach(() => {
      const slides: Slide[] = [
        { number: 1, textContent: 'Slide 1', visualDescription: '', imageUrl: '' },
        { number: 2, textContent: 'Slide 2', visualDescription: '', imageUrl: '' },
        { number: 3, textContent: 'Slide 3', visualDescription: '', imageUrl: '' },
      ]
      useSessionStore.getState().setSlides(slides)
      useSessionStore.setState({ currentSlideIndex: 2 })
    })

    it('goes to previous slide', () => {
      useSessionStore.getState().previousSlide()
      expect(useSessionStore.getState().currentSlideIndex).toBe(1)
    })

    it('does not go below 0', () => {
      useSessionStore.setState({ currentSlideIndex: 0 })
      useSessionStore.getState().previousSlide()
      expect(useSessionStore.getState().currentSlideIndex).toBe(0)
    })
  })

  describe('setLoading', () => {
    it('sets loading state to true', () => {
      useSessionStore.getState().setLoading(true)
      expect(useSessionStore.getState().isLoading).toBe(true)
    })

    it('sets loading state to false', () => {
      useSessionStore.setState({ isLoading: true })
      useSessionStore.getState().setLoading(false)
      expect(useSessionStore.getState().isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      useSessionStore.getState().setError('Something went wrong')
      expect(useSessionStore.getState().error).toBe('Something went wrong')
    })

    it('clears error with null', () => {
      useSessionStore.setState({ error: 'Previous error' })
      useSessionStore.getState().setError(null)
      expect(useSessionStore.getState().error).toBeNull()
    })
  })

  describe('setPdfFile', () => {
    it('sets PDF file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      useSessionStore.getState().setPdfFile(file)
      expect(useSessionStore.getState().pdfFile).toBe(file)
    })

    it('clears PDF file with null', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      useSessionStore.setState({ pdfFile: file })
      useSessionStore.getState().setPdfFile(null)
      expect(useSessionStore.getState().pdfFile).toBeNull()
    })
  })

  describe('resetSession', () => {
    it('resets all state to initial values', () => {
      // Set up some state
      const slides: Slide[] = [
        { number: 1, textContent: 'Test', visualDescription: '', imageUrl: '' },
      ]
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      useSessionStore.setState({
        slides,
        currentSlideIndex: 5,
        isLoading: true,
        error: 'Some error',
        pdfFile: file,
      })

      // Reset
      useSessionStore.getState().resetSession()

      // Verify initial state
      const state = useSessionStore.getState()
      expect(state.slides).toEqual([])
      expect(state.currentSlideIndex).toBe(0)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.pdfFile).toBeNull()
    })
  })

  describe('selectors', () => {
    describe('getCurrentSlide', () => {
      it('returns current slide', () => {
        const slides: Slide[] = [
          { number: 1, textContent: 'Slide 1', visualDescription: 'Desc 1', imageUrl: '' },
          { number: 2, textContent: 'Slide 2', visualDescription: 'Desc 2', imageUrl: '' },
        ]
        useSessionStore.setState({ slides, currentSlideIndex: 1 })

        const currentSlide = useSessionStore.getState().getCurrentSlide()

        expect(currentSlide).toEqual({
          number: 2,
          textContent: 'Slide 2',
          visualDescription: 'Desc 2',
          imageUrl: '',
        })
      })

      it('returns undefined when slides are empty', () => {
        const currentSlide = useSessionStore.getState().getCurrentSlide()
        expect(currentSlide).toBeUndefined()
      })
    })

    describe('getSlideContent', () => {
      it('returns text content of specific slide', () => {
        const slides: Slide[] = [
          { number: 1, textContent: 'First content', visualDescription: '', imageUrl: '' },
          { number: 2, textContent: 'Second content', visualDescription: '', imageUrl: '' },
        ]
        useSessionStore.setState({ slides })

        const content = useSessionStore.getState().getSlideContent(1)

        expect(content).toBe('Second content')
      })

      it('returns undefined for invalid index', () => {
        const slides: Slide[] = [
          { number: 1, textContent: 'Content', visualDescription: '', imageUrl: '' },
        ]
        useSessionStore.setState({ slides })

        expect(useSessionStore.getState().getSlideContent(-1)).toBeUndefined()
        expect(useSessionStore.getState().getSlideContent(10)).toBeUndefined()
      })
    })

    describe('getTotalSlides', () => {
      it('returns total number of slides', () => {
        const slides: Slide[] = [
          { number: 1, textContent: 'Slide 1', visualDescription: '', imageUrl: '' },
          { number: 2, textContent: 'Slide 2', visualDescription: '', imageUrl: '' },
          { number: 3, textContent: 'Slide 3', visualDescription: '', imageUrl: '' },
        ]
        useSessionStore.setState({ slides })

        expect(useSessionStore.getState().getTotalSlides()).toBe(3)
      })

      it('returns 0 for empty slides', () => {
        expect(useSessionStore.getState().getTotalSlides()).toBe(0)
      })
    })
  })

  // Phase 2: Transcript State Tests
  describe('transcript state', () => {
    describe('initial state', () => {
      it('has empty transcript array', () => {
        const state = useSessionStore.getState()
        expect(state.transcript).toEqual([])
      })

      it('has isRecording false', () => {
        const state = useSessionStore.getState()
        expect(state.isRecording).toBe(false)
      })
    })

    describe('addTranscriptSegment', () => {
      it('adds a segment to the transcript', () => {
        const segment: TranscriptSegment = {
          text: 'Hello world',
          timestamp: 1000,
          slideNumber: 1,
        }

        useSessionStore.getState().addTranscriptSegment(segment)

        expect(useSessionStore.getState().transcript).toHaveLength(1)
        expect(useSessionStore.getState().transcript[0]).toEqual(segment)
      })

      it('appends multiple segments in order', () => {
        const segment1: TranscriptSegment = {
          text: 'First',
          timestamp: 1000,
          slideNumber: 1,
        }
        const segment2: TranscriptSegment = {
          text: 'Second',
          timestamp: 2000,
          slideNumber: 1,
        }

        useSessionStore.getState().addTranscriptSegment(segment1)
        useSessionStore.getState().addTranscriptSegment(segment2)

        expect(useSessionStore.getState().transcript).toHaveLength(2)
        expect(useSessionStore.getState().transcript[0].text).toBe('First')
        expect(useSessionStore.getState().transcript[1].text).toBe('Second')
      })
    })

    describe('clearTranscript', () => {
      it('clears all transcript segments', () => {
        const segment: TranscriptSegment = {
          text: 'Some text',
          timestamp: 1000,
          slideNumber: 1,
        }
        useSessionStore.getState().addTranscriptSegment(segment)
        expect(useSessionStore.getState().transcript).toHaveLength(1)

        useSessionStore.getState().clearTranscript()

        expect(useSessionStore.getState().transcript).toEqual([])
      })
    })

    describe('setIsRecording', () => {
      it('sets recording state to true', () => {
        useSessionStore.getState().setIsRecording(true)
        expect(useSessionStore.getState().isRecording).toBe(true)
      })

      it('sets recording state to false', () => {
        useSessionStore.setState({ isRecording: true })
        useSessionStore.getState().setIsRecording(false)
        expect(useSessionStore.getState().isRecording).toBe(false)
      })
    })

    describe('getRecentTranscript', () => {
      it('returns segments within the specified time window', () => {
        const now = Date.now()
        const segments: TranscriptSegment[] = [
          { text: 'Old segment', timestamp: now - 70000, slideNumber: 1 }, // 70 seconds ago
          { text: 'Recent segment 1', timestamp: now - 30000, slideNumber: 1 }, // 30 seconds ago
          { text: 'Recent segment 2', timestamp: now - 10000, slideNumber: 2 }, // 10 seconds ago
        ]
        segments.forEach((s) => useSessionStore.getState().addTranscriptSegment(s))

        const recent = useSessionStore.getState().getRecentTranscript(60000) // 60 seconds

        expect(recent).toHaveLength(2)
        expect(recent[0].text).toBe('Recent segment 1')
        expect(recent[1].text).toBe('Recent segment 2')
      })

      it('returns empty array when no segments in window', () => {
        const now = Date.now()
        const segment: TranscriptSegment = {
          text: 'Very old',
          timestamp: now - 120000, // 2 minutes ago
          slideNumber: 1,
        }
        useSessionStore.getState().addTranscriptSegment(segment)

        const recent = useSessionStore.getState().getRecentTranscript(60000)

        expect(recent).toEqual([])
      })

      it('returns all segments when all are within window', () => {
        const now = Date.now()
        const segments: TranscriptSegment[] = [
          { text: 'Segment 1', timestamp: now - 5000, slideNumber: 1 },
          { text: 'Segment 2', timestamp: now - 3000, slideNumber: 1 },
          { text: 'Segment 3', timestamp: now - 1000, slideNumber: 1 },
        ]
        segments.forEach((s) => useSessionStore.getState().addTranscriptSegment(s))

        const recent = useSessionStore.getState().getRecentTranscript(60000)

        expect(recent).toHaveLength(3)
      })
    })

    describe('getFullTranscript', () => {
      it('returns all transcript segments', () => {
        const segments: TranscriptSegment[] = [
          { text: 'Segment 1', timestamp: 1000, slideNumber: 1 },
          { text: 'Segment 2', timestamp: 2000, slideNumber: 2 },
          { text: 'Segment 3', timestamp: 3000, slideNumber: 2 },
        ]
        segments.forEach((s) => useSessionStore.getState().addTranscriptSegment(s))

        const full = useSessionStore.getState().getFullTranscript()

        expect(full).toHaveLength(3)
        expect(full).toEqual(segments)
      })

      it('returns empty array when no segments exist', () => {
        const full = useSessionStore.getState().getFullTranscript()
        expect(full).toEqual([])
      })
    })

    describe('getTranscriptText', () => {
      it('returns combined text from all segments', () => {
        const segments: TranscriptSegment[] = [
          { text: 'Hello', timestamp: 1000, slideNumber: 1 },
          { text: 'world', timestamp: 2000, slideNumber: 1 },
        ]
        segments.forEach((s) => useSessionStore.getState().addTranscriptSegment(s))

        const text = useSessionStore.getState().getTranscriptText()

        expect(text).toBe('Hello world')
      })

      it('returns empty string when no segments', () => {
        const text = useSessionStore.getState().getTranscriptText()
        expect(text).toBe('')
      })
    })
  })

  describe('resetSession with transcript', () => {
    it('clears transcript when resetting session', () => {
      const segment: TranscriptSegment = {
        text: 'Some transcript',
        timestamp: 1000,
        slideNumber: 1,
      }
      useSessionStore.getState().addTranscriptSegment(segment)
      useSessionStore.getState().setIsRecording(true)

      useSessionStore.getState().resetSession()

      expect(useSessionStore.getState().transcript).toEqual([])
      expect(useSessionStore.getState().isRecording).toBe(false)
    })
  })
})
