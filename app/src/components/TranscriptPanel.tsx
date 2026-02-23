import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useSessionStore } from '../stores/session'
import { useSpeechToText } from '../hooks/useSpeechToText'
import { formatTimestamp, createTranscriptSegment } from '../utils/transcript'

interface TranscriptPanelProps {
  sessionStartTime?: number
}

export function TranscriptPanel({ sessionStartTime }: TranscriptPanelProps) {
  const {
    transcript,
    isRecording,
    currentSlideIndex,
    addTranscriptSegment,
    setIsRecording,
    clearTranscript,
  } = useSessionStore()

  const contentRef = useRef<HTMLDivElement>(null)
  const [mountTime] = useState(() => Date.now())
  const baseTime = useMemo(
    () => sessionStartTime ?? transcript[0]?.timestamp ?? mountTime,
    [sessionStartTime, transcript, mountTime]
  )
  const [interimTimestamp, setInterimTimestamp] = useState(mountTime)

  const handleResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        const segment = createTranscriptSegment(text, currentSlideIndex + 1)
        addTranscriptSegment(segment)
      }
    },
    [currentSlideIndex, addTranscriptSegment]
  )

  const { isSupported, isListening, interimTranscript, error, start, stop, resetTranscript } =
    useSpeechToText({ onResult: handleResult })

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [transcript, interimTranscript])

  // Update interim timestamp when interim transcript changes
  // This is a valid pattern for tracking when interim speech content updates
  useEffect(() => {
    if (interimTranscript) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInterimTimestamp(Date.now())
    }
  }, [interimTranscript])

  const handleStart = () => {
    start()
    setIsRecording(true)
  }

  const handleStop = () => {
    stop()
    setIsRecording(false)
  }

  const handleClear = () => {
    clearTranscript()
    resetTranscript()
  }

  const hasTranscript = transcript.length > 0

  return (
    <div
      data-testid="transcript-panel"
      className="flex flex-col h-full bg-white rounded-lg shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Transcript</h2>
          {isListening && (
            <div data-testid="listening-indicator" className="flex items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm text-red-600 font-medium">Recording</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasTranscript && !isRecording && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
          {isRecording ? (
            <button
              onClick={handleStop}
              className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!isSupported}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Transcript content */}
      <div
        ref={contentRef}
        data-testid="transcript-content"
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {!hasTranscript && !interimTranscript && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-12 h-12 mb-3 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p className="text-sm">
              {isSupported
                ? 'Click "Start" to begin recording your presentation'
                : 'Speech recognition is not supported in this browser'}
            </p>
          </div>
        )}

        {/* Finalized transcript segments */}
        {transcript.map((segment, index) => (
          <div key={`${segment.timestamp}-${index}`} className="flex gap-3 group">
            <span className="flex-shrink-0 text-xs text-gray-400 font-mono pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTimestamp(segment.timestamp, baseTime)}
            </span>
            <p className="text-gray-700 leading-relaxed">{segment.text}</p>
          </div>
        ))}

        {/* Interim transcript (currently being spoken) */}
        {interimTranscript && (
          <div data-testid="interim-transcript" className="flex gap-3 text-gray-400 italic">
            <span className="flex-shrink-0 text-xs font-mono pt-0.5">
              {formatTimestamp(interimTimestamp, baseTime)}
            </span>
            <p className="leading-relaxed">{interimTranscript}</p>
          </div>
        )}
      </div>
    </div>
  )
}
