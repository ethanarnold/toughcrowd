import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Configure PDF.js worker - use legacy build for Node.js compatibility
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
} else {
  // In Node.js/test environment, disable worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''
}

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-

/**
 * Helper to read a slice of a file using FileReader (better cross-environment support)
 */
function readFileSlice(file: File, start: number, end: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file.slice(start, end))
  })
}

// Validation result type
export interface ValidationResult {
  valid: boolean
  error?: string
}

// Custom error for PDF validation issues
export class PDFValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PDFValidationError'
  }
}

/**
 * Validates a PDF file by checking MIME type, magic bytes, and size
 */
export async function validatePDF(file: File): Promise<ValidationResult> {
  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  // Check file size limit
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit.' }
  }

  // Check MIME type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Invalid file type. Please upload a PDF file.' }
  }

  // Check magic bytes
  try {
    const buffer = await readFileSlice(file, 0, 5)
    const bytes = new Uint8Array(buffer)

    const hasMagicBytes = PDF_MAGIC_BYTES.every((byte, index) => bytes[index] === byte)

    if (!hasMagicBytes) {
      return { valid: false, error: 'File does not appear to be a valid PDF.' }
    }
  } catch {
    return { valid: false, error: 'Unable to read file.' }
  }

  return { valid: true }
}

/**
 * Sanitizes a filename by removing path traversal characters and other dangerous patterns
 */
export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    // Remove null bytes and control characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f]/g, '')
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove path traversal patterns
    .replace(/\.\./g, '')
    // Trim whitespace
    .trim()
    // Remove leading dots
    .replace(/^\.+/, '')
    // Replace multiple spaces/underscores with single underscore
    .replace(/[\s_]+/g, '_')
    // Remove trailing underscores
    .replace(/_+$/, '')

  // If filename is empty after sanitization, provide a default
  if (!sanitized) {
    return 'unnamed'
  }

  return sanitized
}

/**
 * Renders all pages of a PDF as images
 * Returns an array of data URLs, one per page
 */
export async function renderPDFPagesAsImages(file: File, scale: number = 1.5): Promise<string[]> {
  // Validate the file first
  const validation = await validatePDF(file)
  if (!validation.valid) {
    throw new PDFValidationError(validation.error || 'Invalid PDF file')
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const imageUrls: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      // Create a canvas element
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render the page to canvas
      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png')
      imageUrls.push(dataUrl)
    }

    return imageUrls
  } catch (error) {
    if (error instanceof PDFValidationError) {
      throw error
    }
    throw new PDFValidationError(
      `Failed to render PDF pages: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extracts text content from each page of a PDF file
 * Returns an array of strings, one per page
 */
export async function extractTextFromPDF(file: File): Promise<string[]> {
  // Validate the file first
  const validation = await validatePDF(file)
  if (!validation.valid) {
    throw new PDFValidationError(validation.error || 'Invalid PDF file')
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pageTexts: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine all text items into a single string
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')
        .trim()

      pageTexts.push(pageText)
    }

    return pageTexts
  } catch (error) {
    if (error instanceof PDFValidationError) {
      throw error
    }
    throw new PDFValidationError(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
