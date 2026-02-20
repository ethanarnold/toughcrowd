import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useSessionStore, createInitialState } from './stores/session'

// Mock the PDF service
vi.mock('./services/pdf', () => ({
  validatePDF: vi.fn().mockResolvedValue({ valid: true }),
  extractTextFromPDF: vi
    .fn()
    .mockResolvedValue([
      'Welcome to my presentation',
      'Main topic discussion',
      'Conclusion and next steps',
    ]),
  renderPDFPagesAsImages: vi
    .fn()
    .mockResolvedValue([
      'data:image/png;base64,slide1',
      'data:image/png;base64,slide2',
      'data:image/png;base64,slide3',
    ]),
  sanitizeFilename: vi.fn((name: string) => name),
  PDFValidationError: class PDFValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'PDFValidationError'
    }
  },
}))

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useSessionStore.setState(createInitialState())
  })

  describe('initial state', () => {
    it('renders app header', () => {
      render(<App />)

      expect(screen.getByText('toughcrowd')).toBeInTheDocument()
    })

    it('shows upload prompt when no slides', () => {
      render(<App />)

      expect(screen.getByText('Practice Your Presentation')).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    })

    it('does not show Upload New button when no slides', () => {
      render(<App />)

      expect(screen.queryByText('Upload New')).not.toBeInTheDocument()
    })
  })

  describe('upload flow', () => {
    it('transitions to slide viewer after PDF upload', async () => {
      render(<App />)

      // Upload PDF
      const dropZone = screen.getByTestId('drop-zone')
      const file = new File(['%PDF-1.4'], 'presentation.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file], types: ['Files'] },
      })

      // Wait for transition to slide viewer
      await waitFor(() => {
        expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()
      })

      // Should show slide content
      expect(screen.getByTestId('slide-content')).toBeInTheDocument()

      // Upload area should be gone
      expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument()
    })

    it('shows filename and Upload New button after upload', async () => {
      render(<App />)

      const dropZone = screen.getByTestId('drop-zone')
      const file = new File(['%PDF-1.4'], 'my-slides.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file], types: ['Files'] },
      })

      await waitFor(() => {
        expect(screen.getByText('my-slides.pdf')).toBeInTheDocument()
        expect(screen.getByText('Upload New')).toBeInTheDocument()
      })
    })
  })

  describe('slide navigation', () => {
    beforeEach(async () => {
      render(<App />)

      // Upload a PDF first
      const dropZone = screen.getByTestId('drop-zone')
      const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file], types: ['Files'] },
      })

      await waitFor(() => {
        expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()
      })
    })

    it('navigates with next/previous buttons', async () => {
      const user = userEvent.setup()

      // Initially on slide 1
      expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()

      // Click next
      await user.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument()

      // Click next again
      await user.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByText('Slide 3 of 3')).toBeInTheDocument()

      // Click previous
      await user.click(screen.getByRole('button', { name: /previous/i }))
      expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument()
    })

    it('navigates with arrow keys', async () => {
      // Initially on slide 1
      expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()

      // Press right arrow
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument()

      // Press left arrow
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()
    })

    it('navigates with dropdown', async () => {
      const user = userEvent.setup()

      const dropdown = screen.getByRole('combobox', { name: /jump to slide/i })
      await user.selectOptions(dropdown, '2')

      expect(screen.getByText('Slide 3 of 3')).toBeInTheDocument()
    })
  })

  describe('reset session', () => {
    it('returns to upload screen when clicking Upload New', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Upload a PDF first
      const dropZone = screen.getByTestId('drop-zone')
      const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file], types: ['Files'] },
      })

      await waitFor(() => {
        expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument()
      })

      // Click Upload New
      await user.click(screen.getByText('Upload New'))

      // Should return to upload screen
      expect(screen.getByText('Practice Your Presentation')).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    })
  })
})
