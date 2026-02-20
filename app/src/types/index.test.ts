import { describe, it, expect } from 'vitest'
import {
  isSlide,
  isTranscriptSegment,
  isQuestion,
  isPersona,
  isDeliveryMode,
  isSessionSettings,
  isSession,
  type Slide,
  type TranscriptSegment,
  type Question,
  type SessionSettings,
  type Session,
} from './index'

describe('Type Guards', () => {
  describe('isSlide', () => {
    it('returns true for valid Slide objects', () => {
      const validSlide: Slide = {
        number: 1,
        textContent: 'Introduction to AI',
        visualDescription: 'Title slide with company logo',
      }
      expect(isSlide(validSlide)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isSlide(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isSlide(undefined)).toBe(false)
    })

    it('returns false for primitives', () => {
      expect(isSlide('string')).toBe(false)
      expect(isSlide(123)).toBe(false)
      expect(isSlide(true)).toBe(false)
    })

    it('returns false for objects missing required properties', () => {
      expect(isSlide({ number: 1 })).toBe(false)
      expect(isSlide({ number: 1, textContent: 'text' })).toBe(false)
      expect(isSlide({ textContent: 'text', visualDescription: 'desc' })).toBe(false)
    })

    it('returns false for objects with wrong property types', () => {
      expect(isSlide({ number: '1', textContent: 'text', visualDescription: 'desc' })).toBe(false)
      expect(isSlide({ number: 1, textContent: 123, visualDescription: 'desc' })).toBe(false)
      expect(isSlide({ number: 1, textContent: 'text', visualDescription: null })).toBe(false)
    })
  })

  describe('isTranscriptSegment', () => {
    it('returns true for valid TranscriptSegment objects', () => {
      const validSegment: TranscriptSegment = {
        text: 'And so our model achieves 94% accuracy',
        timestamp: 125000,
        slideNumber: 5,
      }
      expect(isTranscriptSegment(validSegment)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isTranscriptSegment(null)).toBe(false)
    })

    it('returns false for objects missing required properties', () => {
      expect(isTranscriptSegment({ text: 'hello' })).toBe(false)
      expect(isTranscriptSegment({ text: 'hello', timestamp: 1000 })).toBe(false)
    })

    it('returns false for objects with wrong property types', () => {
      expect(isTranscriptSegment({ text: 123, timestamp: 1000, slideNumber: 1 })).toBe(false)
      expect(isTranscriptSegment({ text: 'hello', timestamp: '1000', slideNumber: 1 })).toBe(false)
    })
  })

  describe('isQuestion', () => {
    it('returns true for valid Question objects', () => {
      const validQuestion: Question = {
        id: 'q1',
        text: 'Is that improvement statistically significant?',
        type: 'technical',
        urgency: 'interrupt',
        trigger: 'Presenter claimed 94% accuracy',
        slideRef: 5,
        answered: false,
      }
      expect(isQuestion(validQuestion)).toBe(true)
    })

    it('returns true for Question with optional response', () => {
      const questionWithResponse: Question = {
        id: 'q2',
        text: 'What is your sample size?',
        type: 'methodology',
        urgency: 'queue',
        trigger: 'Statistical claim made',
        slideRef: 7,
        answered: true,
        response: 'We used 10,000 samples',
      }
      expect(isQuestion(questionWithResponse)).toBe(true)
    })

    it('returns false for invalid question type', () => {
      expect(
        isQuestion({
          id: 'q1',
          text: 'Question',
          type: 'invalid',
          urgency: 'interrupt',
          trigger: 'trigger',
          slideRef: 1,
          answered: false,
        })
      ).toBe(false)
    })

    it('returns false for invalid urgency', () => {
      expect(
        isQuestion({
          id: 'q1',
          text: 'Question',
          type: 'technical',
          urgency: 'invalid',
          trigger: 'trigger',
          slideRef: 1,
          answered: false,
        })
      ).toBe(false)
    })

    it('returns false for null', () => {
      expect(isQuestion(null)).toBe(false)
    })
  })

  describe('isPersona', () => {
    it('returns true for valid personas', () => {
      expect(isPersona('skeptical')).toBe(true)
      expect(isPersona('expert')).toBe(true)
      expect(isPersona('confused')).toBe(true)
      expect(isPersona('adversarial')).toBe(true)
    })

    it('returns false for invalid personas', () => {
      expect(isPersona('friendly')).toBe(false)
      expect(isPersona('')).toBe(false)
      expect(isPersona(null)).toBe(false)
      expect(isPersona(123)).toBe(false)
    })
  })

  describe('isDeliveryMode', () => {
    it('returns true for valid delivery modes', () => {
      expect(isDeliveryMode('interrupt')).toBe(true)
      expect(isDeliveryMode('queue')).toBe(true)
      expect(isDeliveryMode('hybrid')).toBe(true)
    })

    it('returns false for invalid delivery modes', () => {
      expect(isDeliveryMode('batch')).toBe(false)
      expect(isDeliveryMode('')).toBe(false)
      expect(isDeliveryMode(null)).toBe(false)
    })
  })

  describe('isSessionSettings', () => {
    it('returns true for valid session settings', () => {
      const validSettings: SessionSettings = {
        persona: 'skeptical',
        deliveryMode: 'hybrid',
      }
      expect(isSessionSettings(validSettings)).toBe(true)
    })

    it('returns false for invalid persona', () => {
      expect(isSessionSettings({ persona: 'invalid', deliveryMode: 'queue' })).toBe(false)
    })

    it('returns false for invalid delivery mode', () => {
      expect(isSessionSettings({ persona: 'expert', deliveryMode: 'invalid' })).toBe(false)
    })

    it('returns false for null', () => {
      expect(isSessionSettings(null)).toBe(false)
    })
  })

  describe('isSession', () => {
    it('returns true for valid Session objects', () => {
      const validSession: Session = {
        id: 'session-1',
        slides: [
          { number: 1, textContent: 'Intro', visualDescription: 'Title' },
          { number: 2, textContent: 'Methods', visualDescription: 'Diagram' },
        ],
        transcript: [{ text: 'Hello everyone', timestamp: 0, slideNumber: 1 }],
        questions: [
          {
            id: 'q1',
            text: 'Question?',
            type: 'clarification',
            urgency: 'queue',
            trigger: 'statement',
            slideRef: 1,
            answered: false,
          },
        ],
        settings: {
          persona: 'expert',
          deliveryMode: 'hybrid',
        },
        startTime: Date.now(),
        endTime: null,
      }
      expect(isSession(validSession)).toBe(true)
    })

    it('returns true for session with empty arrays', () => {
      const emptySession: Session = {
        id: 'session-2',
        slides: [],
        transcript: [],
        questions: [],
        settings: {
          persona: 'confused',
          deliveryMode: 'queue',
        },
        startTime: null,
        endTime: null,
      }
      expect(isSession(emptySession)).toBe(true)
    })

    it('returns false for session with invalid slides', () => {
      expect(
        isSession({
          id: 'session-3',
          slides: [{ invalid: true }],
          transcript: [],
          questions: [],
          settings: { persona: 'expert', deliveryMode: 'queue' },
          startTime: null,
          endTime: null,
        })
      ).toBe(false)
    })

    it('returns false for session with invalid transcript segments', () => {
      expect(
        isSession({
          id: 'session-4',
          slides: [],
          transcript: [{ invalid: true }],
          questions: [],
          settings: { persona: 'expert', deliveryMode: 'queue' },
          startTime: null,
          endTime: null,
        })
      ).toBe(false)
    })

    it('returns false for session with invalid questions', () => {
      expect(
        isSession({
          id: 'session-5',
          slides: [],
          transcript: [],
          questions: [{ invalid: true }],
          settings: { persona: 'expert', deliveryMode: 'queue' },
          startTime: null,
          endTime: null,
        })
      ).toBe(false)
    })

    it('returns false for session with invalid settings', () => {
      expect(
        isSession({
          id: 'session-6',
          slides: [],
          transcript: [],
          questions: [],
          settings: { persona: 'invalid', deliveryMode: 'queue' },
          startTime: null,
          endTime: null,
        })
      ).toBe(false)
    })

    it('returns false for null', () => {
      expect(isSession(null)).toBe(false)
    })
  })
})
