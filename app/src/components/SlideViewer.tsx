import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../stores/session'

export function SlideViewer() {
  const {
    slides,
    currentSlideIndex,
    nextSlide,
    previousSlide,
    setCurrentSlide,
    getCurrentSlide,
    getTotalSlides,
  } = useSessionStore()

  const currentSlide = getCurrentSlide()
  const totalSlides = getTotalSlides()

  const isFirstSlide = currentSlideIndex === 0
  const isLastSlide = currentSlideIndex === totalSlides - 1

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        nextSlide()
      } else if (event.key === 'ArrowLeft') {
        previousSlide()
      }
    },
    [nextSlide, previousSlide]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const handleDropdownChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const index = parseInt(event.target.value, 10)
      setCurrentSlide(index)
    },
    [setCurrentSlide]
  )

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg
          className="h-16 w-16 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>No slides loaded</p>
        <p className="text-sm text-gray-400">Upload a PDF to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Slide image area */}
      <div
        data-testid="slide-content"
        className="flex-1 bg-gray-100 border border-gray-200 rounded-lg overflow-auto flex items-center justify-center mb-4 min-h-0"
      >
        {currentSlide?.imageUrl ? (
          <img
            src={currentSlide.imageUrl}
            alt={`Slide ${currentSlide.number}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-gray-400">No image available</div>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous button */}
        <button
          onClick={previousSlide}
          disabled={isFirstSlide}
          aria-label="Previous slide"
          className={`
            px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
            ${
              isFirstSlide
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        {/* Slide indicator and jump-to dropdown */}
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </span>

          <select
            value={currentSlideIndex}
            onChange={handleDropdownChange}
            aria-label="Jump to slide"
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {slides.map((slide, index) => (
              <option key={slide.number} value={index}>
                Slide {slide.number}
              </option>
            ))}
          </select>
        </div>

        {/* Next button */}
        <button
          onClick={nextSlide}
          disabled={isLastSlide}
          aria-label="Next slide"
          className={`
            px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
            ${
              isLastSlide
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          Next
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
