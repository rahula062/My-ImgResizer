import { useState, useCallback } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { parseExif, stripExif, ExifInfo } from '../utils/exif'
import { downloadBlob } from '../utils/image'

export default function ExifViewerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [exif, setExif] = useState<ExifInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setIsProcessing(true)
    try {
      const info = await parseExif(f)
      setExif(info)
    } catch (e) {
      alert('Failed to read EXIF metadata')
    }
    setIsProcessing(false)
  }, [])

  const handleStripExif = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const cleanBlob = await stripExif(file)
      downloadBlob(cleanBlob, `mediahub-clean-${file.name}`)
    } catch (e) {
      alert('Failed to strip EXIF data')
    }
    setIsProcessing(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">📊</span> EXIF Viewer & Stripper
        </h2>
        <div className="divider" />
        <p>Inspect hidden camera and file metadata inside images. Strip EXIF data to protect your personal privacy.</p>
      </div>

      {!file ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="📊"
            title="EXIF Metadata Viewer"
            subtitle="Upload JPEG or PNG to inspect EXIF metadata"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          {exif && (
            <div className="card">
              <h3 className="text-lg font-bold text-text mb-4">Metadata Analysis for {exif.filename}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">File Name</div>
                  <div className="font-bold text-text text-sm">{exif.filename}</div>
                </div>

                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">File Size</div>
                  <div className="font-bold text-cyan text-sm">{exif.filesize}</div>
                </div>

                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">MIME Type</div>
                  <div className="font-bold text-text text-sm">{exif.filetype}</div>
                </div>

                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">Dimensions</div>
                  <div className="font-bold text-accent3 text-sm">{exif.dimensions || 'N/A'}</div>
                </div>

                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">EXIF Header Status</div>
                  <div className="font-bold text-text text-sm">{exif.make || 'Clean / Standard Header'}</div>
                </div>

                <div className="p-3 bg-card2 rounded border border-border">
                  <div className="text-xs text-text-muted">Last Modified</div>
                  <div className="font-bold text-text text-sm">{exif.dateTime || 'Unknown'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card mt16 bg-card2 border-border-glow flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="font-bold text-text text-base">🛡️ Privacy Shield</div>
              <div className="text-xs text-text-dim mt-1">
                Remove sensitive camera location, timestamp, and device metadata before sharing online.
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleStripExif}
              disabled={isProcessing}
            >
              {isProcessing ? '⚡ Stripping EXIF...' : '🧹 Strip EXIF & Download Clean Image'}
            </button>
          </div>

          <div className="btn-group mt16">
            <button className="btn btn-secondary" onClick={() => { setFile(null); setExif(null); }}>
              🔄 Inspect Another Image
            </button>
          </div>
        </>
      )}
    </div>
  )
}