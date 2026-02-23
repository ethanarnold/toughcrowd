import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createTranscriptSegment,
  getRollingBuffer,
  getSegmentsForSlide,
  formatTimestamp,
  calculateSpeakingDuration,
  mergeConsecutiveSegments,
} from './transcript'
import type { TranscriptSegment } from '../types'

describe('transcript utilities', () => {
  describe('createTranscriptSegment', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-22T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('creates a segment with the given text and slide number', () => {
      const segment = createTranscriptSegment('Hello world', 1)

      expect(segment.text).toBe('Hello world')
      expect(segment.slideNumber).toBe(1)
    })

    it('uses current timestamp if not provided', () => {
      const segment = createTranscriptSegment('Test', 1)

      expect(segment.timestamp).toBe(Date.now())
    })

    it('uses provided timestamp', () => {
      const customTimestamp = 1234567890000
      const segment = createTranscriptSegment('Test', 2, customTimestamp)

      expect(segment.timestamp).toBe(customTimestamp)
    })

    it('trims whitespace from text', () => {
      const segment = createTranscriptSegment('  trimmed text  ', 1)

      expect(segment.text).toBe('trimmed text')
    })
  })

  describe('getRollingBuffer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-22T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns segments within the default 60-second window', () => {
      const now = Date.now()
      const segments: TranscriptSegment[] = [
        { text: 'Old', timestamp: now - 90000, slideNumber: 1 }, // 90s ago
        { text: 'Recent 1', timestamp: now - 30000, slideNumber: 1 }, // 30s ago
        { text: 'Recent 2', timestamp: now - 10000, slideNumber: 1 }, // 10s ago
      ]

      const buffer = getRollingBuffer(segments)

      expect(buffer).toHaveLength(2)
      expect(buffer[0].text).toBe('Recent 1')
      expect(buffer[1].text).toBe('Recent 2')
    })

    it('returns segments within custom time window', () => {
      const now = Date.now()
      const segments: TranscriptSegment[] = [
        { text: 'Old', timestamp: now - 40000, slideNumber: 1 }, // 40s ago
        { text: 'Recent', timestamp: now - 20000, slideNumber: 1 }, // 20s ago
      ]

      const buffer = getRollingBuffer(segments, 30000) // 30s window

      expect(buffer).toHaveLength(1)
      expect(buffer[0].text).toBe('Recent')
    })

    it('returns empty array when no segments are within window', () => {
      const now = Date.now()
      const segments: TranscriptSegment[] = [
        { text: 'Very old', timestamp: now - 120000, slideNumber: 1 },
      ]

      const buffer = getRollingBuffer(segments)

      expect(buffer).toEqual([])
    })

    it('returns all segments when all are within window', () => {
      const now = Date.now()
      const segments: TranscriptSegment[] = [
        { text: 'First', timestamp: now - 5000, slideNumber: 1 },
        { text: 'Second', timestamp: now - 3000, slideNumber: 1 },
        { text: 'Third', timestamp: now - 1000, slideNumber: 1 },
      ]

      const buffer = getRollingBuffer(segments)

      expect(buffer).toHaveLength(3)
    })

    it('handles empty segments array', () => {
      const buffer = getRollingBuffer([])

      expect(buffer).toEqual([])
    })
  })

  describe('getSegmentsForSlide', () => {
    it('returns segments for specific slide', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Slide 1 content', timestamp: 1000, slideNumber: 1 },
        { text: 'Slide 2 content', timestamp: 2000, slideNumber: 2 },
        { text: 'More slide 1', timestamp: 3000, slideNumber: 1 },
      ]

      const slide1Segments = getSegmentsForSlide(segments, 1)

      expect(slide1Segments).toHaveLength(2)
      expect(slide1Segments[0].text).toBe('Slide 1 content')
      expect(slide1Segments[1].text).toBe('More slide 1')
    })

    it('returns empty array when no segments match', () => {
      const segments: TranscriptSegment[] = [{ text: 'Slide 1', timestamp: 1000, slideNumber: 1 }]

      const slide5Segments = getSegmentsForSlide(segments, 5)

      expect(slide5Segments).toEqual([])
    })

    it('handles empty segments array', () => {
      const result = getSegmentsForSlide([], 1)

      expect(result).toEqual([])
    })
  })

  describe('formatTimestamp', () => {
    it('formats timestamp as mm:ss', () => {
      const baseTime = Date.now()
      const timestamp = baseTime + 65000 // 1 minute 5 seconds later

      const formatted = formatTimestamp(timestamp, baseTime)

      expect(formatted).toBe('01:05')
    })

    it('formats zero as 00:00', () => {
      const baseTime = Date.now()

      const formatted = formatTimestamp(baseTime, baseTime)

      expect(formatted).toBe('00:00')
    })

    it('formats hours when needed', () => {
      const baseTime = Date.now()
      const timestamp = baseTime + 3661000 // 1 hour, 1 minute, 1 second

      const formatted = formatTimestamp(timestamp, baseTime)

      expect(formatted).toBe('01:01:01')
    })

    it('pads single digits with zeros', () => {
      const baseTime = Date.now()
      const timestamp = baseTime + 5000 // 5 seconds

      const formatted = formatTimestamp(timestamp, baseTime)

      expect(formatted).toBe('00:05')
    })
  })

  describe('calculateSpeakingDuration', () => {
    it('calculates duration from first to last segment', () => {
      const segments: TranscriptSegment[] = [
        { text: 'First', timestamp: 1000, slideNumber: 1 },
        { text: 'Middle', timestamp: 5000, slideNumber: 1 },
        { text: 'Last', timestamp: 10000, slideNumber: 1 },
      ]

      const duration = calculateSpeakingDuration(segments)

      expect(duration).toBe(9000) // 10000 - 1000
    })

    it('returns 0 for empty segments', () => {
      const duration = calculateSpeakingDuration([])

      expect(duration).toBe(0)
    })

    it('returns 0 for single segment', () => {
      const segments: TranscriptSegment[] = [{ text: 'Only one', timestamp: 1000, slideNumber: 1 }]

      const duration = calculateSpeakingDuration(segments)

      expect(duration).toBe(0)
    })

    it('handles unsorted segments correctly', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Middle', timestamp: 5000, slideNumber: 1 },
        { text: 'First', timestamp: 1000, slideNumber: 1 },
        { text: 'Last', timestamp: 10000, slideNumber: 1 },
      ]

      const duration = calculateSpeakingDuration(segments)

      expect(duration).toBe(9000)
    })
  })

  describe('mergeConsecutiveSegments', () => {
    it('merges segments on same slide within threshold', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Hello', timestamp: 1000, slideNumber: 1 },
        { text: 'world', timestamp: 2000, slideNumber: 1 }, // 1 second later
      ]

      const merged = mergeConsecutiveSegments(segments, 3000) // 3 second threshold

      expect(merged).toHaveLength(1)
      expect(merged[0].text).toBe('Hello world')
      expect(merged[0].timestamp).toBe(1000)
    })

    it('does not merge segments on different slides', () => {
      const segments: TranscriptSegment[] = [
        { text: 'Slide 1', timestamp: 1000, slideNumber: 1 },
        { text: 'Slide 2', timestamp: 2000, slideNumber: 2 },
      ]

      const merged = mergeConsecutiveSegments(segments, 3000)

      expect(merged).toHaveLength(2)
      expect(merged[0].text).toBe('Slide 1')
      expect(merged[1].text).toBe('Slide 2')
    })

    it('does not merge segments outside threshold', () => {
      const segments: TranscriptSegment[] = [
        { text: 'First', timestamp: 1000, slideNumber: 1 },
        { text: 'Second', timestamp: 10000, slideNumber: 1 }, // 9 seconds later
      ]

      const merged = mergeConsecutiveSegments(segments, 3000) // 3 second threshold

      expect(merged).toHaveLength(2)
    })

    it('merges multiple consecutive segments', () => {
      const segments: TranscriptSegment[] = [
        { text: 'One', timestamp: 1000, slideNumber: 1 },
        { text: 'two', timestamp: 2000, slideNumber: 1 },
        { text: 'three', timestamp: 3000, slideNumber: 1 },
      ]

      const merged = mergeConsecutiveSegments(segments, 2000)

      expect(merged).toHaveLength(1)
      expect(merged[0].text).toBe('One two three')
    })

    it('handles empty array', () => {
      const merged = mergeConsecutiveSegments([], 3000)

      expect(merged).toEqual([])
    })

    it('handles single segment', () => {
      const segments: TranscriptSegment[] = [{ text: 'Only one', timestamp: 1000, slideNumber: 1 }]

      const merged = mergeConsecutiveSegments(segments, 3000)

      expect(merged).toHaveLength(1)
      expect(merged[0].text).toBe('Only one')
    })
  })
})
