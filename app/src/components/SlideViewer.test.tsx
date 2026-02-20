import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlideViewer } from './SlideViewer'
import type { Slide } from '../types'

// Mock the session store
const mockNextSlide = vi.fn()
const mockPreviousSlide = vi.fn()
const mockSetCurrentSlide = vi.fn()

vi.mock('../stores/session', () => ({
  useSessionStore: vi.fn(() => ({
    slides: [],
    currentSlideIndex: 0,
    pdfFile: null,
    nextSlide: mockNextSlide,
    previousSlide: mockPreviousSlide,
    setCurrentSlide: mockSetCurrentSlide,
    getCurrentSlide: vi.fn(),
    getTotalSlides: vi.fn(() => 0),
  })),
}))

import { useSessionStore } from '../stores/session'

describe('SlideViewer', () => {
  const mockSlides: Slide[] = [
    { number: 1, textContent: 'Introduction', visualDescription: 'Title slide', imageUrl: '' },
    { number: 2, textContent: 'Main Point', visualDescription: 'Bullet points', imageUrl: '' },
    { number: 3, textContent: 'Conclusion', visualDescription: 'Summary', imageUrl: '' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSessionStore).mockReturnValue({
      slides: mockSlides,
      currentSlideIndex: 0,
      pdfFile: null,
      nextSlide: mockNextSlide,
      previousSlide: mockPreviousSlide,
      setCurrentSlide: mockSetCurrentSlide,
      getCurrentSlide: vi.fn(() => mockSlides[0]),
      getTotalSlides: vi.fn(() => 3),
    })
  })

  describe('rendering', () => {
    it('shows empty state when no slides', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: [],
        currentSlideIndex: 0,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => undefined),
        getTotalSlides: vi.fn(() => 0),
      })

      render(<SlideViewer />)

      expect(screen.getByText(/no slides/i)).toBeInTheDocument()
    })

    it('displays current slide number and total', () => {
      render(<SlideViewer />)

      expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()
    })

    it('renders slide content', () => {
      render(<SlideViewer />)

      expect(screen.getByTestId('slide-content')).toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('shows previous and next buttons', () => {
      render(<SlideViewer />)

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('disables previous button on first slide', () => {
      render(<SlideViewer />)

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('disables next button on last slide', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 2,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[2]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })

    it('calls nextSlide when next button clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(mockNextSlide).toHaveBeenCalled()
    })

    it('calls previousSlide when previous button clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      await user.click(screen.getByRole('button', { name: /previous/i }))

      expect(mockPreviousSlide).toHaveBeenCalled()
    })
  })

  describe('keyboard navigation', () => {
    it('advances slide on right arrow key', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      fireEvent.keyDown(document, { key: 'ArrowRight' })

      expect(mockNextSlide).toHaveBeenCalled()
    })

    it('goes back on left arrow key', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      fireEvent.keyDown(document, { key: 'ArrowLeft' })

      expect(mockPreviousSlide).toHaveBeenCalled()
    })

    it('does not navigate on other keys', () => {
      render(<SlideViewer />)

      fireEvent.keyDown(document, { key: 'Enter' })

      expect(mockNextSlide).not.toHaveBeenCalled()
      expect(mockPreviousSlide).not.toHaveBeenCalled()
    })
  })

  describe('jump-to-slide dropdown', () => {
    it('renders dropdown with all slides', () => {
      render(<SlideViewer />)

      const dropdown = screen.getByRole('combobox', { name: /jump to slide/i })
      expect(dropdown).toBeInTheDocument()

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
    })

    it('shows current slide as selected', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      const dropdown = screen.getByRole('combobox', { name: /jump to slide/i })
      expect(dropdown).toHaveValue('1')
    })

    it('calls setCurrentSlide when dropdown changes', async () => {
      const user = userEvent.setup()

      render(<SlideViewer />)

      const dropdown = screen.getByRole('combobox', { name: /jump to slide/i })
      await user.selectOptions(dropdown, '2')

      expect(mockSetCurrentSlide).toHaveBeenCalledWith(2)
    })
  })

  describe('slide indicator display', () => {
    it('shows slide number correctly at different positions', () => {
      vi.mocked(useSessionStore).mockReturnValue({
        slides: mockSlides,
        currentSlideIndex: 1,
        pdfFile: null,
        nextSlide: mockNextSlide,
        previousSlide: mockPreviousSlide,
        setCurrentSlide: mockSetCurrentSlide,
        getCurrentSlide: vi.fn(() => mockSlides[1]),
        getTotalSlides: vi.fn(() => 3),
      })

      render(<SlideViewer />)

      expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument()
    })
  })
})
