import { FileUpload } from './components/FileUpload'
import { SlideViewer } from './components/SlideViewer'
import { TranscriptPanel } from './components/TranscriptPanel'
import { useSessionStore } from './stores/session'

function App() {
  const { slides, pdfFile, resetSession } = useSessionStore()
  const hasSlides = slides.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">toughcrowd</h1>
          {hasSlides && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{pdfFile?.name}</span>
              <button
                onClick={resetSession}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                Upload New
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {hasSlides ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
            {/* Slides - 2/3 width */}
            <div className="lg:col-span-2">
              <SlideViewer />
            </div>
            {/* Transcript - 1/3 width */}
            <div className="lg:col-span-1">
              <TranscriptPanel />
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Practice Your Presentation
              </h2>
              <p className="text-gray-600">
                Upload your slides to start practicing with AI-generated questions
              </p>
            </div>
            <FileUpload />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
