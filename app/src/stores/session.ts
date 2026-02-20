import { create } from 'zustand'
import type { Slide } from '../types'

export interface SessionState {
  // State
  slides: Slide[]
  currentSlideIndex: number
  isLoading: boolean
  error: string | null
  pdfFile: File | null

  // Actions
  setSlides: (slides: Slide[]) => void
  setCurrentSlide: (index: number) => void
  nextSlide: () => void
  previousSlide: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setPdfFile: (file: File | null) => void
  resetSession: () => void

  // Selectors
  getCurrentSlide: () => Slide | undefined
  getSlideContent: (index: number) => string | undefined
  getTotalSlides: () => number
}

export function createInitialState() {
  return {
    slides: [],
    currentSlideIndex: 0,
    isLoading: false,
    error: null,
    pdfFile: null,
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  ...createInitialState(),

  // Actions
  setSlides: (slides) =>
    set({
      slides,
      currentSlideIndex: 0,
      error: null,
    }),

  setCurrentSlide: (index) => {
    const { slides } = get()
    if (slides.length === 0) {
      set({ currentSlideIndex: 0 })
      return
    }
    const clampedIndex = Math.max(0, Math.min(index, slides.length - 1))
    set({ currentSlideIndex: clampedIndex })
  },

  nextSlide: () => {
    const { currentSlideIndex, slides } = get()
    if (currentSlideIndex < slides.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1 })
    }
  },

  previousSlide: () => {
    const { currentSlideIndex } = get()
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1 })
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setPdfFile: (pdfFile) => set({ pdfFile }),

  resetSession: () => set(createInitialState()),

  // Selectors
  getCurrentSlide: () => {
    const { slides, currentSlideIndex } = get()
    return slides[currentSlideIndex]
  },

  getSlideContent: (index) => {
    const { slides } = get()
    return slides[index]?.textContent
  },

  getTotalSlides: () => {
    return get().slides.length
  },
}))
