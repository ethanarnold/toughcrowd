import { useState, useCallback, useRef, useEffect } from 'react'

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseSpeechToTextOptions {
  onResult?: (transcript: string, isFinal: boolean) => void
  lang?: string
}

export interface UseSpeechToTextReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  start: () => void
  stop: () => void
  resetTranscript: () => void
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.'
    case 'audio-capture':
      return 'No microphone detected. Please check your microphone.'
    case 'not-allowed':
      return 'Microphone permission denied. Please allow microphone access.'
    case 'network':
      return 'Network error. Please check your connection.'
    default:
      return `Speech recognition error: ${error}`
  }
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onResult, lang = 'en-US' } = options

  const SpeechRecognitionClass = getSpeechRecognition()
  const isSupported = SpeechRecognitionClass !== null

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(
    isSupported
      ? null
      : 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
  )

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldRestartRef = useRef(false)
  const isStoppingRef = useRef(false)

  // Initialize recognition instance
  useEffect(() => {
    if (!SpeechRecognitionClass) return

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [SpeechRecognitionClass, lang])

  // Set up event handlers
  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
        setInterimTranscript('')
        onResult?.(finalTranscript, true)
      } else {
        setInterimTranscript(interim)
        onResult?.(interim, false)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(getErrorMessage(event.error))
      // Don't restart on errors
      shouldRestartRef.current = false
    }

    recognition.onend = () => {
      setIsListening(false)

      // Restart if we should still be listening (unexpected end)
      if (shouldRestartRef.current && !isStoppingRef.current) {
        try {
          recognition.start()
        } catch {
          // Ignore start errors during restart
        }
      }
    }
  }, [onResult])

  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return

    setError(null)
    shouldRestartRef.current = true
    isStoppingRef.current = false

    try {
      recognitionRef.current.start()
    } catch {
      // Recognition may already be running
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return

    shouldRestartRef.current = false
    isStoppingRef.current = true
    recognitionRef.current.stop()
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    resetTranscript,
  }
}
