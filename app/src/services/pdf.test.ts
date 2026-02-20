import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validatePDF, extractTextFromPDF, sanitizeFilename, PDFValidationError } from './pdf'

// Mock pdfjs-dist
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))

// Helper to create a File with specific content and arrayBuffer support
function createMockFile(content: Uint8Array | string, name: string, type: string): File {
  const data = typeof content === 'string' ? new TextEncoder().encode(content) : content
  const file = new File([data as BlobPart], name, { type })

  // Add arrayBuffer method if not present (for jsdom compatibility)
  if (!file.arrayBuffer) {
    file.arrayBuffer = async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(file)
      })
    }
  }

  return file
}

// Helper to create a File with overridden size (for testing size limits)
function createMockFileWithSize(
  content: Uint8Array | string,
  name: string,
  type: string,
  fakeSize: number
): File {
  const data = typeof content === 'string' ? new TextEncoder().encode(content) : content
  const file = new File([data as BlobPart], name, { type })
  Object.defineProperty(file, 'size', { value: fakeSize, writable: false })
  return file
}

// Create valid PDF header content
function createValidPDFHeader(): Uint8Array {
  // %PDF-1.4\n
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a])
}

describe('PDF Processing Service', () => {
  describe('validatePDF', () => {
    it('accepts valid PDF file with correct MIME type and magic bytes', async () => {
      const content = createValidPDFHeader()
      const file = createMockFile(content, 'presentation.pdf', 'application/pdf')

      const result = await validatePDF(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects file with wrong MIME type', async () => {
      const content = createValidPDFHeader()
      const file = createMockFile(content, 'document.txt', 'text/plain')

      const result = await validatePDF(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid file type. Please upload a PDF file.')
    })

    it('rejects file missing PDF magic bytes', async () => {
      const file = createMockFile('Not a PDF file', 'fake.pdf', 'application/pdf')

      const result = await validatePDF(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File does not appear to be a valid PDF.')
    })

    it('rejects file exceeding size limit (50MB)', async () => {
      const content = createValidPDFHeader()
      const file = createMockFileWithSize(content, 'huge.pdf', 'application/pdf', 51 * 1024 * 1024)

      const result = await validatePDF(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File size exceeds 50MB limit.')
    })

    it('accepts file at exactly 50MB', async () => {
      const content = createValidPDFHeader()
      const file = createMockFileWithSize(
        content,
        'exactly50.pdf',
        'application/pdf',
        50 * 1024 * 1024
      )

      const result = await validatePDF(file)

      expect(result.valid).toBe(true)
    })

    it('rejects empty file', async () => {
      const file = createMockFile(new Uint8Array(0), 'empty.pdf', 'application/pdf')

      const result = await validatePDF(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('File is empty.')
    })
  })

  describe('sanitizeFilename', () => {
    it('preserves valid filename', () => {
      expect(sanitizeFilename('presentation.pdf')).toBe('presentation.pdf')
    })

    it('removes path traversal characters', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd')
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32')
    })

    it('removes leading/trailing dots and spaces', () => {
      expect(sanitizeFilename('...hidden.pdf')).toBe('hidden.pdf')
      expect(sanitizeFilename('  spaced.pdf  ')).toBe('spaced.pdf')
    })

    it('replaces multiple spaces/underscores with single underscore', () => {
      expect(sanitizeFilename('my   presentation.pdf')).toBe('my_presentation.pdf')
      expect(sanitizeFilename('my___file.pdf')).toBe('my_file.pdf')
    })

    it('handles empty string', () => {
      expect(sanitizeFilename('')).toBe('unnamed')
      expect(sanitizeFilename('...')).toBe('unnamed')
    })

    it('removes null bytes and control characters', () => {
      expect(sanitizeFilename('file\x00name.pdf')).toBe('filename.pdf')
      expect(sanitizeFilename('file\x1fname.pdf')).toBe('filename.pdf')
    })

    it('preserves unicode characters', () => {
      expect(sanitizeFilename('présentation.pdf')).toBe('présentation.pdf')
      expect(sanitizeFilename('プレゼン.pdf')).toBe('プレゼン.pdf')
    })
  })

  describe('extractTextFromPDF', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('throws PDFValidationError for invalid PDF', async () => {
      const file = createMockFile('Not a PDF', 'fake.pdf', 'application/pdf')

      await expect(extractTextFromPDF(file)).rejects.toThrow(PDFValidationError)
    })

    it('throws PDFValidationError for wrong MIME type', async () => {
      const content = createValidPDFHeader()
      const file = createMockFile(content, 'fake.txt', 'text/plain')

      await expect(extractTextFromPDF(file)).rejects.toThrow(PDFValidationError)
    })

    it('throws PDFValidationError for empty file', async () => {
      const file = createMockFile(new Uint8Array(0), 'empty.pdf', 'application/pdf')

      await expect(extractTextFromPDF(file)).rejects.toThrow(PDFValidationError)
    })

    it('extracts text from each page', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

      const mockPage1 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Hello' }, { str: 'World' }],
        }),
      }
      const mockPage2 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Page' }, { str: 'Two' }],
        }),
      }
      const mockPdf = {
        numPages: 2,
        getPage: vi.fn().mockImplementation((num: number) => {
          return Promise.resolve(num === 1 ? mockPage1 : mockPage2)
        }),
      }

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as unknown as ReturnType<typeof pdfjsLib.getDocument>)

      const content = createValidPDFHeader()
      const file = createMockFile(content, 'test.pdf', 'application/pdf')

      const result = await extractTextFromPDF(file)

      expect(result).toEqual(['Hello World', 'Page Two'])
      expect(mockPdf.getPage).toHaveBeenCalledTimes(2)
    })

    it('handles empty pages', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [],
        }),
      }
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      }

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as unknown as ReturnType<typeof pdfjsLib.getDocument>)

      const content = createValidPDFHeader()
      const file = createMockFile(content, 'test.pdf', 'application/pdf')

      const result = await extractTextFromPDF(file)

      expect(result).toEqual([''])
    })

    it('handles items without str property', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Text' }, { notStr: 'value' }, { str: 'More' }],
        }),
      }
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      }

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as unknown as ReturnType<typeof pdfjsLib.getDocument>)

      const content = createValidPDFHeader()
      const file = createMockFile(content, 'test.pdf', 'application/pdf')

      const result = await extractTextFromPDF(file)

      expect(result).toEqual(['Text  More'])
    })

    it('handles corrupt PDF gracefully', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

      const rejectedPromise = Promise.reject(new Error('Invalid PDF structure'))
      // Prevent unhandled rejection warning
      rejectedPromise.catch(() => {})

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: rejectedPromise,
      } as unknown as ReturnType<typeof pdfjsLib.getDocument>)

      const content = createValidPDFHeader()
      const file = createMockFile(content, 'corrupt.pdf', 'application/pdf')

      await expect(extractTextFromPDF(file)).rejects.toThrow(PDFValidationError)
    })

    it('returns empty array for PDF with zero pages', async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

      const mockPdf = {
        numPages: 0,
        getPage: vi.fn(),
      }

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as unknown as ReturnType<typeof pdfjsLib.getDocument>)

      const content = createValidPDFHeader()
      const file = createMockFile(content, 'test.pdf', 'application/pdf')

      const result = await extractTextFromPDF(file)

      expect(result).toEqual([])
      expect(mockPdf.getPage).not.toHaveBeenCalled()
    })
  })

  describe('PDFValidationError', () => {
    it('is instanceof Error', () => {
      const error = new PDFValidationError('test')
      expect(error).toBeInstanceOf(Error)
    })

    it('has correct name', () => {
      const error = new PDFValidationError('test')
      expect(error.name).toBe('PDFValidationError')
    })

    it('preserves message', () => {
      const error = new PDFValidationError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })
})
