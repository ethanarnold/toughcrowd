import { useState, useCallback, useRef } from 'react'
import { validatePDF, extractTextFromPDF, renderPDFPagesAsImages } from '../services/pdf'
import { useSessionStore } from '../stores/session'
import type { Slide } from '../types'

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setSlides, setLoading, setError, setPdfFile, isLoading, error } = useSessionStore()

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      setLoading(true)

      try {
        // Validate the PDF
        const validation = await validatePDF(file)
        if (!validation.valid) {
          setError(validation.error || 'Invalid PDF file')
          setLoading(false)
          return
        }

        // Extract text and render images from PDF in parallel
        const [pageTexts, pageImages] = await Promise.all([
          extractTextFromPDF(file),
          renderPDFPagesAsImages(file),
        ])

        // Convert to Slide objects
        const slides: Slide[] = pageTexts.map((textContent, index) => ({
          number: index + 1,
          textContent,
          visualDescription: '', // Visual descriptions will be added in Phase 5
          imageUrl: pageImages[index] || '',
        }))

        // Update store
        setPdfFile(file)
        setSlides(slides)
        setLoading(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to process PDF: ${message}`)
        setLoading(false)
      }
    },
    [setSlides, setLoading, setError, setPdfFile]
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragOver(false)

      const file = event.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div
        data-testid="drop-zone"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          disabled={isLoading}
          data-testid="file-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-2">
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-10 w-10 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-gray-600">Processing PDF...</p>
            </>
          ) : (
            <>
              <svg
                className="h-10 w-10 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">PDF files up to 50MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
