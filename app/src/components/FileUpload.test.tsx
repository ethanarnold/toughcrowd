import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from './FileUpload'

// Mock the PDF service
vi.mock('../services/pdf', () => ({
  validatePDF: vi.fn(),
  extractTextFromPDF: vi.fn(),
  renderPDFPagesAsImages: vi.fn(),
  sanitizeFilename: vi.fn((name: string) => name),
  PDFValidationError: class PDFValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'PDFValidationError'
    }
  },
}))

// Mock the session store
vi.mock('../stores/session', () => ({
  useSessionStore: vi.fn(() => ({
    setSlides: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setPdfFile: vi.fn(),
    isLoading: false,
    error: null,
  })),
}))

import { validatePDF, extractTextFromPDF, renderPDFPagesAsImages } from '../services/pdf'
import { useSessionStore } from '../stores/session'

describe('FileUpload', () => {
  const mockSetSlides = vi.fn()
  const mockSetLoading = vi.fn()
  const mockSetError = vi.fn()
  const mockSetPdfFile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSessionStore).mockReturnValue({
      setSlides: mockSetSlides,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setPdfFile: mockSetPdfFile,
      isLoading: false,
      error: null,
    })
  })

  it('renders upload zone', () => {
    render(<FileUpload />)

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
  })

  it('accepts PDF file via click upload', async () => {
    const user = userEvent.setup()
    vi.mocked(validatePDF).mockResolvedValue({ valid: true })
    vi.mocked(extractTextFromPDF).mockResolvedValue(['Page 1 content', 'Page 2 content'])
    vi.mocked(renderPDFPagesAsImages).mockResolvedValue([
      'data:image/png;base64,page1',
      'data:image/png;base64,page2',
    ])

    render(<FileUpload />)

    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(true)
    })

    await waitFor(() => {
      expect(mockSetSlides).toHaveBeenCalledWith([
        {
          number: 1,
          textContent: 'Page 1 content',
          visualDescription: '',
          imageUrl: 'data:image/png;base64,page1',
        },
        {
          number: 2,
          textContent: 'Page 2 content',
          visualDescription: '',
          imageUrl: 'data:image/png;base64,page2',
        },
      ])
    })
  })

  it('shows error for invalid file type', async () => {
    vi.mocked(validatePDF).mockResolvedValue({
      valid: false,
      error: 'Invalid file type. Please upload a PDF file.',
    })

    render(<FileUpload />)

    // Use drop instead of file input to bypass accept attribute
    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['not a pdf'], 'test.txt', { type: 'text/plain' })

    const dataTransfer = {
      files: [file],
      types: ['Files'],
    }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Invalid file type. Please upload a PDF file.')
    })
  })

  it('handles drag enter/leave for visual feedback', () => {
    render(<FileUpload />)

    const dropZone = screen.getByTestId('drop-zone')

    fireEvent.dragEnter(dropZone)
    expect(dropZone).toHaveClass('border-blue-500')

    fireEvent.dragLeave(dropZone)
    expect(dropZone).not.toHaveClass('border-blue-500')
  })

  it('handles file drop', async () => {
    vi.mocked(validatePDF).mockResolvedValue({ valid: true })
    vi.mocked(extractTextFromPDF).mockResolvedValue(['Dropped content'])
    vi.mocked(renderPDFPagesAsImages).mockResolvedValue(['data:image/png;base64,dropped'])

    render(<FileUpload />)

    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['%PDF-1.4'], 'dropped.pdf', { type: 'application/pdf' })

    const dataTransfer = {
      files: [file],
      types: ['Files'],
    }

    fireEvent.drop(dropZone, { dataTransfer })

    await waitFor(() => {
      expect(mockSetSlides).toHaveBeenCalled()
    })
  })

  it('shows loading state while processing', async () => {
    vi.mocked(useSessionStore).mockReturnValue({
      setSlides: mockSetSlides,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setPdfFile: mockSetPdfFile,
      isLoading: true,
      error: null,
    })

    render(<FileUpload />)

    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })

  it('displays error message when error exists', () => {
    vi.mocked(useSessionStore).mockReturnValue({
      setSlides: mockSetSlides,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setPdfFile: mockSetPdfFile,
      isLoading: false,
      error: 'Something went wrong',
    })

    render(<FileUpload />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('clears error when attempting new upload', async () => {
    const user = userEvent.setup()
    vi.mocked(validatePDF).mockResolvedValue({ valid: true })
    vi.mocked(extractTextFromPDF).mockResolvedValue(['Content'])
    vi.mocked(renderPDFPagesAsImages).mockResolvedValue(['data:image/png;base64,content'])

    render(<FileUpload />)

    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(null)
    })
  })

  it('enforces 50MB file size limit', async () => {
    const user = userEvent.setup()
    vi.mocked(validatePDF).mockResolvedValue({
      valid: false,
      error: 'File size exceeds 50MB limit.',
    })

    render(<FileUpload />)

    const file = new File(['%PDF-1.4'], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 })
    const input = screen.getByTestId('file-input')

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('File size exceeds 50MB limit.')
    })
  })

  it('handles PDF extraction error', async () => {
    const user = userEvent.setup()
    vi.mocked(validatePDF).mockResolvedValue({ valid: true })
    vi.mocked(extractTextFromPDF).mockRejectedValue(new Error('Extraction failed'))
    vi.mocked(renderPDFPagesAsImages).mockResolvedValue([])

    render(<FileUpload />)

    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Failed to process PDF: Extraction failed')
    })
  })

  it('stores PDF file in session', async () => {
    const user = userEvent.setup()
    vi.mocked(validatePDF).mockResolvedValue({ valid: true })
    vi.mocked(extractTextFromPDF).mockResolvedValue(['Content'])
    vi.mocked(renderPDFPagesAsImages).mockResolvedValue(['data:image/png;base64,content'])

    render(<FileUpload />)

    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockSetPdfFile).toHaveBeenCalledWith(file)
    })
  })

  it('disables input while loading', () => {
    vi.mocked(useSessionStore).mockReturnValue({
      setSlides: mockSetSlides,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setPdfFile: mockSetPdfFile,
      isLoading: true,
      error: null,
    })

    render(<FileUpload />)

    const input = screen.getByTestId('file-input')
    expect(input).toBeDisabled()
  })
})
