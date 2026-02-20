# Real-Time Presentation Practice with AI Audience

## Overview

An AI-powered tool that simulates a realistic audience or committee member listening to your talk in real time. As you practice your presentation, the AI generates contextual questions based on what you're saying and the slides you're showing—just like a real Q&A session.

## Solution

A **real-time audience simulation** that:

1. **Listens to your talk** via live speech-to-text transcription
2. **Tracks your current slide** to understand visual context
3. **Generates realistic questions** continuously as you speak, based on both transcript and slide content
4. **Interrupts naturally** at appropriate moments (or queues questions for after)

## Core Feature: Real-Time AI Committee Member

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PRACTICE SESSION                         │
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Your Voice  │ →  │  Transcript  │ →  │   Question   │  │
│   │  (Live Mic)  │    │  Generation  │    │   Generator  │  │
│   └──────────────┘    └──────────────┘    └──────────────┘  │
│                              ↑                    ↓         │
│                       ┌──────────────┐    ┌──────────────┐  │
│                       │ Current Slide│    │  AI Poses    │  │
│                       │   Content    │    │  Questions   │  │
│                       └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Input Requirements

1. **Slides** (uploaded beforehand)
   - PDF or image sequence
   - Text extracted and indexed by slide number
   - Visual content described/parsed for reference

2. **Live Audio**
   - Real-time speech-to-text transcription
   - Running transcript with timestamps
   - Slide transitions tracked (manual or automatic)

### Real-Time Question Generation

The system makes **repeated LLM calls** as you speak to generate contextual questions:

**Every N seconds (e.g., 10-15s) or after key statements:**
```
Context provided to LLM:
- Current slide content (text + visual description)
- Recent transcript segment (last 30-60 seconds)
- Full transcript so far (summarized if long)
- Previous questions already asked (to avoid repetition)
- Audience persona (committee member, investor, peer, etc.)

LLM generates:
- 0-2 candidate questions triggered by recent content
- Each tagged with urgency (ask now vs. save for later)
- Reference to specific slide content or spoken claim
```

**Example Generated Question:**
```
You just said: "Our model achieves 94% accuracy on the benchmark..."
Current slide: Shows comparison table with competitors

Question: "Your table shows Method X at 91%—that's only a 3% improvement.
          Is that difference statistically significant?"

Reference: Slide 12, spoken claim at 4:32
Urgency: High (directly challenges a claim you just made)
```

### Question Delivery Modes

1. **Interrupt Mode** (realistic committee simulation)
   - AI can interject with questions mid-presentation
   - Simulates aggressive or engaged committee members
   - User must handle interruptions gracefully

2. **Queue Mode** (end-of-section Q&A)
   - Questions accumulate silently during presentation
   - Delivered at natural breakpoints or end
   - More like conference talk Q&A

3. **Hybrid Mode**
   - Critical/urgent questions interrupt
   - Others saved for later

### Slide-Aware Questions

Questions should directly reference slide content:

- "On this slide, you show X but earlier you said Y—can you reconcile that?"
- "Your diagram suggests A connects to B, but you haven't explained how."
- "This graph is hard to read—what's the key takeaway?"
- "You skipped over the third bullet point. Is that intentional?"

## Question Taxonomy

### By Type
| Type | Description | Example |
|------|-------------|---------|
| Clarification | "What do you mean by X?" | "Can you define what you mean by 'scalable' in this context?" |
| Technical | Deep dive into methods/implementation | "Walk me through the math behind equation 3." |
| Conceptual | Understanding and framing | "Why is this problem important?" |
| Methodology | Choices and tradeoffs | "Why did you choose method A over method B?" |
| Adversarial | Challenge assumptions or validity | "Couldn't this result be explained by confound Z?" |
| Big Picture | Broader implications | "How does this change how we think about the field?" |
| Scope | Boundaries of the work | "What does your approach NOT address?" |

### By Difficulty
| Level | Characteristics |
|-------|-----------------|
| Softball | Lets presenter showcase strengths, easy to answer well |
| Moderate | Requires solid understanding, reasonable prep handles it |
| Challenging | Exposes weaknesses, requires thinking on feet |

## Technical Architecture

### Real-Time Processing Stack
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│   - Slide viewer with current slide tracking                │
│   - Audio capture (microphone access)                       │
│   - Question display panel                                  │
│   - Session controls (start/pause/end)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REAL-TIME PIPELINE                        │
│                                                              │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐ │
│  │ Speech-to-Text│ →  │  Transcript   │ →  │  Question   │ │
│  │ (Whisper API/ │    │   Buffer +    │    │  Generator  │ │
│  │  Deepgram/    │    │   Manager     │    │  (LLM Loop) │ │
│  │  Web Speech)  │    │               │    │             │ │
│  └───────────────┘    └───────────────┘    └─────────────┘ │
│                              ↑                              │
│                       ┌──────────────┐                      │
│                       │ Slide State  │                      │
│                       │ (current +   │                      │
│                       │  content)    │                      │
│                       └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        LLM API                               │
│   OpenAI / Anthropic / etc.                                 │
│   - Repeated calls every 10-15 seconds during talk          │
│   - Context: transcript chunk + current slide + history     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Slide Processor** (Pre-session)
   - Extract text from PDF slides
   - Generate descriptions of visual content (charts, diagrams)
   - Index content by slide number for quick lookup
   - Identify key claims, data points, and potential question triggers

2. **Transcript Engine** (Real-time)
   - Continuous speech-to-text transcription
   - Maintain rolling buffer of recent speech (last 60s)
   - Track cumulative transcript with timestamps
   - Detect slide transitions (voice cues or manual advance)

3. **Question Generation Loop** (Real-time)
   - Triggered every N seconds or on significant new content
   - Combines current slide + recent transcript + session context
   - Deduplicates against previously generated questions
   - Classifies question urgency and type
   - Manages question queue for delivery

4. **Session Manager**
   - Orchestrates the real-time pipeline
   - Handles question delivery timing
   - Tracks user responses and follow-ups
   - Aggregates session data for summary

## Prompt Engineering Notes

### Real-Time Question Generation Prompt
```
You are a committee member listening to a presentation in real time.

CURRENT SLIDE (Slide {N} of {total}):
{slide_text_content}
{slide_visual_description}

WHAT THE PRESENTER JUST SAID (last 30 seconds):
"{recent_transcript}"

FULL CONTEXT SO FAR:
{summarized_transcript_or_key_points}

QUESTIONS ALREADY ASKED THIS SESSION:
{list_of_previous_questions}

YOUR PERSONA: {committee_type} (e.g., skeptical methodologist, supportive but curious, adversarial devil's advocate)

---

Based on what the presenter just said and the current slide, generate 0-2 questions that would naturally arise for someone listening critically.

For each question:
- The question itself (phrased naturally, as you would actually ask it)
- What triggered it (specific claim, slide content, or gap)
- Urgency: "interrupt" (ask now) or "queue" (save for Q&A)
- Type: Clarification / Technical / Conceptual / Methodology / Adversarial / Big Picture

Only generate a question if there's genuinely something worth asking about. Not every segment needs a question.

If the presenter made a specific claim, reference it directly. If the slide shows data, ask about it specifically. Be concrete, not generic.
```

### Follow-Up Question Prompt (After User Responds)
```
You asked: "{your_question}"

The presenter responded: "{presenter_response}"

Current slide for reference:
{slide_content}

As a committee member, evaluate this response:
- Did they answer what you asked?
- Did they dodge or deflect?
- Did their answer reveal something worth probing?

Then either:
1. Ask a pointed follow-up that digs deeper
2. Push back on a weak point or unsupported claim
3. Accept the answer and move on (if genuinely satisfied)

Be realistic—don't accept vague answers, but don't be unreasonably aggressive either. Match your persona.
```

### Persona Variations
```
SKEPTICAL METHODOLOGIST:
- Focuses on validity, statistical rigor, experimental design
- "How do you know X isn't confounded by Y?"
- "What's your sample size for that claim?"

SENIOR DOMAIN EXPERT:
- Deep knowledge of field, asks about positioning and novelty
- "How does this relate to [famous work]?"
- "The field moved past this approach in 2018—why revisit it?"

CONFUSED BUT ENGAGED:
- Represents audience members who got lost
- "I'm not sure I followed the transition from A to B."
- "Can you explain what this axis represents?"

ADVERSARIAL DEVIL'S ADVOCATE:
- Actively tries to poke holes
- "Couldn't you achieve the same result by just doing X?"
- "This seems like a lot of machinery for a small improvement."
```

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                      LANDING PAGE                        │
│                                                          │
│   "Practice your presentation with a live AI audience"  │
│                                                          │
│   [Upload Slides & Start]                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SETUP                                 │
│                                                          │
│   1. Upload slides (PDF)                                │
│   2. Select audience persona:                           │
│      [ ] Skeptical methodologist                        │
│      [ ] Senior domain expert                           │
│      [ ] Curious generalist                             │
│      [ ] Adversarial devil's advocate                   │
│   3. Select mode:                                       │
│      ( ) Interrupt mode - questions during talk         │
│      ( ) Queue mode - questions at end                  │
│      ( ) Hybrid - urgent questions interrupt            │
│   4. Grant microphone access                            │
│                                                          │
│   [Begin Practice Session]                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              LIVE PRACTICE SESSION                       │
│                                                          │
│   ┌─────────────────────┬─────────────────────────────┐ │
│   │                     │                             │ │
│   │   CURRENT SLIDE     │   AI COMMITTEE MEMBER       │ │
│   │   [Slide 3 of 12]   │                             │ │
│   │                     │   🎙️ Listening...            │ │
│   │   [slide content]   │                             │ │
│   │                     │   ─────────────────────     │ │
│   │                     │   Recent transcript:        │ │
│   │   [◀ Prev] [Next ▶] │   "...and so our model      │ │
│   │                     │   achieves 94% accuracy..." │ │
│   │                     │                             │ │
│   │                     │   ─────────────────────     │ │
│   │                     │   💬 QUESTION:              │ │
│   │                     │   "Is that improvement      │ │
│   │                     │   statistically significant │ │
│   │                     │   over the baseline?"       │ │
│   │                     │                             │ │
│   │                     │   [Respond] [Skip] [Pause]  │ │
│   └─────────────────────┴─────────────────────────────┘ │
│                                                          │
│   [End Session]                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 SESSION SUMMARY                          │
│                                                          │
│   Presentation length: 12 minutes                       │
│   Questions generated: 8                                │
│   Questions answered: 6                                  │
│                                                          │
│   QUESTION BREAKDOWN:                                   │
│   ✓ "Is that statistically significant?" - Good answer  │
│   ⚠ "How does this compare to X?" - Vague, needs work   │
│   ✓ "What about edge case Y?" - Handled well            │
│   ...                                                    │
│                                                          │
│   AREAS TO STRENGTHEN:                                  │
│   - Be more specific when citing comparisons            │
│   - Slide 7 consistently triggers confusion             │
│                                                          │
│   [Full Transcript] [Export Report] [Practice Again]    │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements (Beyond MVP)

### Multi-Persona Panel
- Simulate multiple committee members with different styles
- "Good cop / bad cop" dynamics
- Domain-specific expertise personas

### Learning Loop
- Post-presentation: user logs actual questions received
- Correlate predictions vs. reality
- Improve question generation accuracy over time

### Advanced Slide Understanding
- Vision model integration for charts/diagrams
- "I notice your graph shows X, but you said Y"
- Detect when presenter skips content

### Voice Output
- AI asks questions via text-to-speech
- More immersive simulation
- Practice handling verbal interruptions

### Integration
- Connect to Google Slides / PowerPoint for auto slide tracking
- Calendar integration for pre-defense practice reminders

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Speech-to-text latency/accuracy | Use streaming APIs (Deepgram, Whisper streaming); tolerate minor errors since context helps |
| LLM call latency (questions feel delayed) | Pre-generate candidate questions, use faster models for real-time, queue questions for natural pauses |
| Too many API calls (cost) | Batch context, only call when meaningful new content, use smaller models where possible |
| Questions feel generic/disconnected | Always include specific slide content and transcript quotes in prompts; require concrete references |
| Interruptions feel unnatural | Tune timing, offer queue-only mode as fallback, let user control interruption frequency |
| PDF parsing issues | Start with simple text extraction, add visual parsing later |

## Development Phases

### Phase 1: Foundation
- PDF slide upload and text extraction
- Basic slide viewer with navigation
- Slide content indexing

### Phase 2: Transcript Pipeline
- Integrate speech-to-text (Web Speech API or Whisper)
- Real-time transcript display
- Slide transition tracking

### Phase 3: Question Generation Loop
- Implement periodic LLM calls during presentation
- Context assembly (slide + transcript + history)
- Question deduplication and queue management

### Phase 4: Interactive Q&A
- Question delivery UI (interrupt vs. queue modes)
- Response capture and follow-up generation
- Persona-based questioning styles

### Phase 5: Polish & Demo
- Session summary and feedback
- Export functionality
- Sample presentations for demo

## Speech-to-Text Options

| Option | Pros | Cons |
|--------|------|------|
| **Web Speech API** | Free, built into browsers | Accuracy varies, Chrome-only really works well |
| **Whisper API (OpenAI)** | High accuracy, handles accents well | Cost per minute, adds latency for API calls |
| **Deepgram** | Real-time streaming, good accuracy | Cost, requires account |
| **Local Whisper** | Free after setup, privacy | Requires local compute, setup complexity |

**Recommendation:** Start with Web Speech API for MVP (free, simple), upgrade to Deepgram or Whisper for production quality.