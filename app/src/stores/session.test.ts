import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore, createInitialState } from './session'
import type { Slide } from '../types'

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
})
