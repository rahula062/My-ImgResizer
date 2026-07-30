import { useState, useCallback } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { compressPdf } from '../utils/pdf'
import { downloadBlob, formatBytes } from '../utils/image'
import { toast } from '../utils/toast'

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null)
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      toast('Please upload a PDF document', 'error')
      return
    }
    setFile(f)
    setCompressedBlob(null)
  }, [])

  const handleCompress = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const result = await compressPdf(file)
      setCompressedBlob(result)
    } catch (e) {
      toast('Failed to compress PDF. Please try again.', 'error')
      console.error(e)
    }
    setIsProcessing(false)
  }

  const handleDownload = () => {
    if (!compressedBlob || !file) return
    downloadBlob(compressedBlob, `mediahub-compressed-${file.name}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🗜️</span> Compress PDF
        </h2>
        <div className="divider" />
        <p>Reduce PDF file size by stripping redundant structure data and compressing internal object streams.</p>
      </div>

      {!file ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            accept="application/pdf"
            icon="🗜️"
            title="Compress PDF"
            subtitle="Upload PDF document to reduce file size"
            buttonText="Choose PDF File"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row items-center">
              <div>
                <label className="lbl">Original PDF Document</label>
                <div className="font-bold text-text text-sm">{file.name}</div>
                <div className="tag tag-kb mt-1">{formatBytes(file.size)}</div>
              </div>

              <div className="flex items-end">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleCompress}
                  disabled={isProcessing}
                >
                  {isProcessing ? '⚡ Optimizing PDF Streams...' : '🗜️ Compress PDF Document'}
                </button>
              </div>
            </div>
          </div>

          {compressedBlob && (
            <div className="card mt16 bg-card2 border-border-glow flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-success font-bold">✅ PDF Compression Complete!</div>
                <div className="text-xs text-text-dim mt-1">
                  Original: {formatBytes(file.size)} → Compressed: <span className="text-cyan font-bold">{formatBytes(compressedBlob.size)}</span>
                  {file.size > 0 && (
                    <span className="ml-2 text-accent3 font-bold">
                      (Saved {Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))}%)
                    </span>
                  )}
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleDownload}>
                ⬇️ Download Compressed PDF
              </button>
            </div>
          )}

          <div className="btn-group mt16">
            <button className="btn btn-secondary" onClick={() => { setFile(null); setCompressedBlob(null); }}>
              🔄 Choose Another PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}