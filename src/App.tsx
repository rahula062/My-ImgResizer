import { useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import ResizePage from './pages/ResizePage'
import CropPage from './pages/CropPage'
import CompressPage from './pages/CompressPage'
import ConvertPage from './pages/ConvertPage'
import PassportPage from './pages/PassportPage'
import IncreaseKbPage from './pages/IncreaseKbPage'
import RemoveBgPage from './pages/RemoveBgPage'
import EnhancePage from './pages/EnhancePage'
import MergePdfPage from './pages/MergePdfPage'
import PdfToImgPage from './pages/PdfToImgPage'
import CompressPdfPage from './pages/CompressPdfPage'
import WatermarkPage from './pages/WatermarkPage'
import RotatePage from './pages/RotatePage'
import FiltersPage from './pages/FiltersPage'
import RoundCornersPage from './pages/RoundCornersPage'
import TextOverlayPage from './pages/TextOverlayPage'
import ImagesToPdfPage from './pages/ImagesToPdfPage'
import ExifViewerPage from './pages/ExifViewerPage'
import BatchProcessPage from './pages/BatchProcessPage'

type PageId = 
  | 'home' 
  | 'resize' 
  | 'crop' 
  | 'compress' 
  | 'convert'
  | 'passport'
  | 'increase-kb'
  | 'remove-bg'
  | 'enhance'
  | 'merge-pdf'
  | 'pdf-to-img'
  | 'compress-pdf'
  | 'watermark'
  | 'rotate'
  | 'filters'
  | 'round-corners'
  | 'text-overlay'
  | 'images-to-pdf'
  | 'exif-viewer'
  | 'batch-process'

const pageTitles: Record<PageId, string> = {
  home: 'Home',
  resize: 'Resize Image',
  crop: 'Crop Image',
  compress: 'Compress Image',
  convert: 'Convert Format',
  passport: 'Passport Photo',
  'increase-kb': 'Increase Size (KB)',
  'remove-bg': 'Remove Background',
  enhance: 'Enhance Quality',
  'merge-pdf': 'Merge PDFs',
  'pdf-to-img': 'PDF to Images',
  'compress-pdf': 'Compress PDF',
  watermark: 'Image Watermark',
  rotate: 'Rotate & Flip',
  filters: 'Image Filters',
  'round-corners': 'Round Corners',
  'text-overlay': 'Text Overlay',
  'images-to-pdf': 'Images to PDF',
  'exif-viewer': 'EXIF Viewer',
  'batch-process': 'Batch Process',
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={(page) => setCurrentPage(page as PageId)} />
      case 'resize':
        return <ResizePage />
      case 'crop':
        return <CropPage />
      case 'compress':
        return <CompressPage />
      case 'convert':
        return <ConvertPage />
      case 'passport':
        return <PassportPage />
      case 'increase-kb':
        return <IncreaseKbPage />
      case 'remove-bg':
        return <RemoveBgPage />
      case 'enhance':
        return <EnhancePage />
      case 'merge-pdf':
        return <MergePdfPage />
      case 'pdf-to-img':
        return <PdfToImgPage />
      case 'compress-pdf':
        return <CompressPdfPage />
      case 'watermark':
        return <WatermarkPage />
      case 'rotate':
        return <RotatePage />
      case 'filters':
        return <FiltersPage />
      case 'round-corners':
        return <RoundCornersPage />
      case 'text-overlay':
        return <TextOverlayPage />
      case 'images-to-pdf':
        return <ImagesToPdfPage />
      case 'exif-viewer':
        return <ExifViewerPage />
      case 'batch-process':
        return <BatchProcessPage />
      default:
        return <HomePage onNavigate={(page) => setCurrentPage(page as PageId)} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-deep text-text">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={(page) => setCurrentPage(page as PageId)} 
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <main className="flex-1">
        <header id="topbar">
          <button 
            id="hamburger"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden text-text text-xl p-2 mr-2 hover:bg-card2 rounded"
          >
            ☰
          </button>
          <div className="topbar-title font-display text-sm text-text-dim tracking-wider">
            {pageTitles[currentPage]}
          </div>
          <div className="topbar-badge font-mono text-xs text-accent3 bg-accent-dim px-2.5 py-1 rounded-full border border-border-glow">
            100% Client-Side
          </div>
        </header>
        <div className="page active p-8 max-w-[1100px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
    </ErrorBoundary>
  )
}

export default App
