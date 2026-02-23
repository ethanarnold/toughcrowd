import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideTransitionTracker } from './useSlideTransitionTracker'

// Mock the session store
vi.mock('../stores/session', () => ({
  useSessionStore: vi.fn(() => ({
    currentSlideIndex: 0,
  })),
}))

import { useSessionStore } from '../stores/session'

describe('useSlideTransitionTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-22T12:00:00.000Z'))
    vi.clearAllMocks()

    vi.mocked(useSessionStore).mockReturnValue({
      currentSlideIndex: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with empty transitions array', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      expect(result.current.transitions).toEqual([])
    })

    it('starts with null session start time', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      expect(result.current.sessionStartTime).toBeNull()
    })

    it('starts as not tracking', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      expect(result.current.isTracking).toBe(false)
    })
  })

  describe('startTracking', () => {
    it('sets session start time to current time', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.sessionStartTime).toBe(Date.now())
    })

    it('sets isTracking to true', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.isTracking).toBe(true)
    })

    it('records initial slide transition', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.transitions).toHaveLength(1)
      expect(result.current.transitions[0]).toEqual({
        slideIndex: 0,
        timestamp: Date.now(),
      })
    })
  })

  describe('stopTracking', () => {
    it('sets isTracking to false', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.isTracking).toBe(true)

      act(() => {
        result.current.stopTracking()
      })

      expect(result.current.isTracking).toBe(false)
    })

    it('preserves session start time after stopping', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      const startTime = result.current.sessionStartTime

      act(() => {
        result.current.stopTracking()
      })

      expect(result.current.sessionStartTime).toBe(startTime)
    })

    it('preserves transitions after stopping', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      const transitionsCount = result.current.transitions.length

      act(() => {
        result.current.stopTracking()
      })

      expect(result.current.transitions.length).toBe(transitionsCount)
    })
  })

  describe('slide transition detection', () => {
    it('records transition when slide changes', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      // Advance time
      vi.advanceTimersByTime(5000)

      // Simulate slide change
      vi.mocked(useSessionStore).mockReturnValue({
        currentSlideIndex: 1,
      })

      rerender()

      expect(result.current.transitions).toHaveLength(2)
      expect(result.current.transitions[1]).toEqual({
        slideIndex: 1,
        timestamp: Date.now(),
      })
    })

    it('does not record transition when not tracking', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())

      // Simulate slide change without starting tracking
      vi.mocked(useSessionStore).mockReturnValue({
        currentSlideIndex: 1,
      })

      rerender()

      expect(result.current.transitions).toHaveLength(0)
    })

    it('records multiple transitions in order', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      // First transition
      vi.advanceTimersByTime(3000)
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 1 })
      rerender()

      // Second transition
      vi.advanceTimersByTime(4000)
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 2 })
      rerender()

      expect(result.current.transitions).toHaveLength(3)
      expect(result.current.transitions.map((t) => t.slideIndex)).toEqual([0, 1, 2])
    })
  })

  describe('getSlideTimings', () => {
    it('returns empty array when no transitions', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      expect(result.current.getSlideTimings()).toEqual([])
    })

    it('calculates time spent on each slide', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())
      const baseTime = Date.now()

      act(() => {
        result.current.startTracking()
      })

      // Stay on slide 0 for 5 seconds
      vi.advanceTimersByTime(5000)
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 1 })
      rerender()

      // Stay on slide 1 for 3 seconds
      vi.advanceTimersByTime(3000)
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 2 })
      rerender()

      const timings = result.current.getSlideTimings()

      expect(timings).toHaveLength(3)
      expect(timings[0]).toEqual({
        slideIndex: 0,
        startTime: baseTime,
        duration: 5000,
      })
      expect(timings[1]).toEqual({
        slideIndex: 1,
        startTime: baseTime + 5000,
        duration: 3000,
      })
      // Last slide has no end time yet, duration is calculated to now
      expect(timings[2].slideIndex).toBe(2)
      expect(timings[2].startTime).toBe(baseTime + 8000)
    })
  })

  describe('getCurrentSlideDuration', () => {
    it('returns 0 when not tracking', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      expect(result.current.getCurrentSlideDuration()).toBe(0)
    })

    it('returns time spent on current slide', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      vi.advanceTimersByTime(5000)

      expect(result.current.getCurrentSlideDuration()).toBe(5000)
    })

    it('resets when slide changes', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      vi.advanceTimersByTime(5000)
      expect(result.current.getCurrentSlideDuration()).toBe(5000)

      // Change slide
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 1 })
      rerender()

      // Just after transition, duration should be close to 0
      expect(result.current.getCurrentSlideDuration()).toBe(0)

      // Advance time on new slide
      vi.advanceTimersByTime(2000)
      expect(result.current.getCurrentSlideDuration()).toBe(2000)
    })
  })

  describe('reset', () => {
    it('clears all transitions', () => {
      const { result, rerender } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      vi.advanceTimersByTime(5000)
      vi.mocked(useSessionStore).mockReturnValue({ currentSlideIndex: 1 })
      rerender()

      expect(result.current.transitions.length).toBeGreaterThan(0)

      act(() => {
        result.current.reset()
      })

      expect(result.current.transitions).toEqual([])
    })

    it('clears session start time', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.sessionStartTime).not.toBeNull()

      act(() => {
        result.current.reset()
      })

      expect(result.current.sessionStartTime).toBeNull()
    })

    it('stops tracking', () => {
      const { result } = renderHook(() => useSlideTransitionTracker())

      act(() => {
        result.current.startTracking()
      })

      expect(result.current.isTracking).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.isTracking).toBe(false)
    })
  })
})
