import type { TranscriptSegment } from '../types'

const DEFAULT_ROLLING_BUFFER_MS = 60000 // 60 seconds

/**
 * Creates a new transcript segment with the given text and slide number.
 */
export function createTranscriptSegment(
  text: string,
  slideNumber: number,
  timestamp?: number
): TranscriptSegment {
  return {
    text: text.trim(),
    timestamp: timestamp ?? Date.now(),
    slideNumber,
  }
}

/**
 * Returns segments within the specified time window from now.
 * Default window is 60 seconds.
 */
export function getRollingBuffer(
  segments: TranscriptSegment[],
  windowMs: number = DEFAULT_ROLLING_BUFFER_MS
): TranscriptSegment[] {
  const cutoffTime = Date.now() - windowMs
  return segments.filter((segment) => segment.timestamp >= cutoffTime)
}

/**
 * Returns all segments associated with a specific slide number.
 */
export function getSegmentsForSlide(
  segments: TranscriptSegment[],
  slideNumber: number
): TranscriptSegment[] {
  return segments.filter((segment) => segment.slideNumber === slideNumber)
}

/**
 * Formats a timestamp relative to a base time as mm:ss or hh:mm:ss.
 */
export function formatTimestamp(timestamp: number, baseTime: number): string {
  const diffMs = timestamp - baseTime
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Calculates the total speaking duration from first to last segment.
 */
export function calculateSpeakingDuration(segments: TranscriptSegment[]): number {
  if (segments.length <= 1) return 0

  const timestamps = segments.map((s) => s.timestamp)
  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)

  return maxTimestamp - minTimestamp
}

/**
 * Merges consecutive segments on the same slide within a time threshold.
 * This reduces fragmentation from continuous speech recognition.
 */
export function mergeConsecutiveSegments(
  segments: TranscriptSegment[],
  thresholdMs: number
): TranscriptSegment[] {
  if (segments.length === 0) return []

  const result: TranscriptSegment[] = []
  let current = { ...segments[0] }

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i]

    // Check if same slide and within time threshold
    if (
      next.slideNumber === current.slideNumber &&
      next.timestamp - current.timestamp <= thresholdMs
    ) {
      // Merge: append text
      current.text = `${current.text} ${next.text}`
    } else {
      // Different slide or too much time has passed - push current and start new
      result.push(current)
      current = { ...next }
    }
  }

  // Don't forget the last segment
  result.push(current)

  return result
}
