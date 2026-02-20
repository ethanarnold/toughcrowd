import { FileUpload } from './components/FileUpload'
import { SlideViewer } from './components/SlideViewer'
import { useSessionStore } from './stores/session'

function App() {
  const { slides, pdfFile, resetSession } = useSessionStore()
  const hasSlides = slides.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {hasSlides ? (
          <div className="h-[calc(100vh-200px)]">
            <SlideViewer />
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
