import { useState, useCallback, useEffect, useRef } from 'react'
import { useSessionStore } from '../stores/session'

export interface SlideTransition {
  slideIndex: number
  timestamp: number
}

export interface SlideTiming {
  slideIndex: number
  startTime: number
  duration: number
}

export interface UseSlideTransitionTrackerReturn {
  transitions: SlideTransition[]
  sessionStartTime: number | null
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => void
  reset: () => void
  getSlideTimings: () => SlideTiming[]
  getCurrentSlideDuration: () => number
}

export function useSlideTransitionTracker(): UseSlideTransitionTrackerReturn {
  const { currentSlideIndex } = useSessionStore()

  const [transitions, setTransitions] = useState<SlideTransition[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  const previousSlideIndexRef = useRef<number | null>(null)

  const startTracking = useCallback(() => {
    const now = Date.now()
    setSessionStartTime(now)
    setIsTracking(true)
    setTransitions([
      {
        slideIndex: currentSlideIndex,
        timestamp: now,
      },
    ])
    previousSlideIndexRef.current = currentSlideIndex
  }, [currentSlideIndex])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  const reset = useCallback(() => {
    setTransitions([])
    setSessionStartTime(null)
    setIsTracking(false)
    previousSlideIndexRef.current = null
  }, [])

  // Track slide transitions - we need to update state when slide changes
  // This is a valid pattern for synchronizing with external state changes
  useEffect(() => {
    if (!isTracking) return

    const prevIndex = previousSlideIndexRef.current

    // Detect if slide changed
    if (prevIndex !== null && prevIndex !== currentSlideIndex) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransitions((prev) => [
        ...prev,
        {
          slideIndex: currentSlideIndex,
          timestamp: Date.now(),
        },
      ])
    }

    previousSlideIndexRef.current = currentSlideIndex
  }, [currentSlideIndex, isTracking])

  const getSlideTimings = useCallback((): SlideTiming[] => {
    if (transitions.length === 0) return []

    const timings: SlideTiming[] = []

    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i]
      const nextTransition = transitions[i + 1]

      const duration = nextTransition
        ? nextTransition.timestamp - transition.timestamp
        : Date.now() - transition.timestamp

      timings.push({
        slideIndex: transition.slideIndex,
        startTime: transition.timestamp,
        duration,
      })
    }

    return timings
  }, [transitions])

  const getCurrentSlideDuration = useCallback((): number => {
    if (!isTracking || transitions.length === 0) return 0

    const lastTransition = transitions[transitions.length - 1]
    return Date.now() - lastTransition.timestamp
  }, [isTracking, transitions])

  return {
    transitions,
    sessionStartTime,
    isTracking,
    startTracking,
    stopTracking,
    reset,
    getSlideTimings,
    getCurrentSlideDuration,
  }
}
