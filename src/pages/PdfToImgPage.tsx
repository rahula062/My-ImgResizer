import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/ui/Dropzone'
import { pdfToImages } from '../utils/pdf'
import { downloadBlob, formatBytes } from '../utils/image'

interface PageResult {
  pageIndex: number
  blob: Blob
  url: string
}

export default function PdfToImgPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [pages, setPages] = useState<PageResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      alert('Please select a PDF document')
      return
    }
    setFile(f)
    setPages([])
  }, [])

  const handleRenderPdf = async () => {
    if (!file) return
    setIsProcessing(true)
    setPages([])
    setProgress({ current: 0, total: 0 })

    try {
      const results = await pdfToImages(file, format, (current, total) => {
        setProgress({ current, total })
      })

      const pageResults: PageResult[] = results.map((r) => ({
        pageIndex: r.pageIndex,
        blob: r.blob,
        url: URL.createObjectURL(r.blob),
      }))

      setPages(pageResults)
    } catch (e) {
      alert('Failed to render PDF pages')
      console.error(e)
    }
    setIsProcessing(false)
  }

  const handleDownloadAllZip = async () => {
    if (pages.length === 0 || !file) return
    const zip = new JSZip()
    const ext = format === 'image/png' ? 'png' : 'jpg'
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name

    pages.forEach((p) => {
      zip.file(`${baseName}-page-${p.pageIndex}.${ext}`, p.blob)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    downloadBlob(content, `${baseName}-images.zip`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🖼️</span> PDF to Images
        </h2>
        <div className="divider" />
        <p>Convert each page of a PDF document into crisp PNG or JPG images instantly.</p>
      </div>

      {!file ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            accept="application/pdf"
            icon="🖼️"
            title="PDF to Images"
            subtitle="Upload PDF document to extract page images"
            buttonText="Choose PDF File"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row items-center">
              <div>
                <label className="lbl">Selected PDF Document</label>
                <div className="font-bold text-text text-sm">{file.name} ({formatBytes(file.size)})</div>
              </div>

              <div>
                <label className="lbl">Image Output Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  <option value="image/png">PNG (.png)</option>
                  <option value="image/jpeg">JPG (.jpg)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleRenderPdf}
                  disabled={isProcessing}
                >
                  {isProcessing ? `⚡ Rendering Page ${progress.current}/${progress.total}...` : '🖼️ Convert PDF to Images'}
                </button>
              </div>
            </div>
          </div>

          {pages.length > 0 && (
            <div className="mt16">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text">Extracted Pages ({pages.length})</h3>
                <button className="btn btn-primary" onClick={handleDownloadAllZip}>
                  📦 Download All Pages (.ZIP)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pages.map((p) => (
                  <div key={p.pageIndex} className="card flex flex-col items-center p-3">
                    <div className="preview-label mb-2">PAGE {p.pageIndex}</div>
                    <img src={p.url} alt={`Page ${p.pageIndex}`} className="max-h-[300px] object-contain rounded border border-border mb-3" />
                    <button
                      className="btn btn-secondary btn-sm w-full"
                      onClick={() => downloadBlob(p.blob, `page-${p.pageIndex}.${format === 'image/png' ? 'png' : 'jpg'}`)}
                    >
                      ⬇️ Download Page {p.pageIndex}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="btn-group mt16">
            <button className="btn btn-secondary" onClick={() => { setFile(null); setPages([]); }}>
              🔄 Choose Another PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}