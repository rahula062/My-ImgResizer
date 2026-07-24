import { useState, useCallback } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { imagesToPdf } from '../utils/pdf'
import { downloadBlob, formatBytes } from '../utils/image'

interface ImageFileItem {
  id: string
  file: File
  previewUrl: string
}

export default function ImagesToPdfPage() {
  const [items, setItems] = useState<ImageFileItem[]>([])
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto')
  const [margin, setMargin] = useState<number>(20)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    const newItems: ImageFileItem[] = files.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  const handleCreatePdf = async () => {
    if (items.length === 0) return
    setIsProcessing(true)
    try {
      const files = items.map((i) => i.file)
      const pdfBlob = await imagesToPdf(files, pageSize, orientation, margin)
      downloadBlob(pdfBlob, 'mediahub-converted-images.pdf')
    } catch (e) {
      alert('Failed to generate PDF')
      console.error(e)
    }
    setIsProcessing(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">📄</span> Images to PDF
        </h2>
        <div className="divider" />
        <p>Convert multiple JPG, PNG, WEBP images into a single professional PDF document.</p>
      </div>

      <div className="card">
        <Dropzone
          onFilesSelect={handleFiles}
          onFileSelect={(f) => handleFiles([f])}
          multiple
          icon="📄"
          title="Drag & Drop Images for PDF"
          subtitle="Support multiple images. Drag to reorder pages."
          buttonText="Choose Images"
        />

        {items.length > 0 && (
          <div className="row mt16">
            <div>
              <label className="lbl">Page Size</label>
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value as any)}>
                <option value="a4">A4 (Standard Document)</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit Original Image Dimensions</option>
              </select>
            </div>

            <div>
              <label className="lbl">Page Orientation</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                <option value="auto">Auto (Best Fit)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="lbl">Page Margins: <span className="text-cyan">{margin}px</span></label>
              <input
                type="range"
                min="0"
                max="50"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">PDF Page Sequence ({items.length} Pages)</h3>
            <button className="btn btn-primary" onClick={handleCreatePdf} disabled={isProcessing}>
              {isProcessing ? '⚡ Generating PDF...' : '📄 Generate & Download PDF'}
            </button>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="card flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-cyan font-bold w-6">#{index + 1}</span>
                  <img src={item.previewUrl} alt={`Page ${index + 1}`} className="w-16 h-16 object-cover rounded border border-border" />
                  <div>
                    <div className="font-bold text-text text-sm">{item.file.name}</div>
                    <div className="text-xs text-text-dim">{formatBytes(item.file.size)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    ⬆️ Move Up
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    ⬇️ Move Down
                  </button>
                  <button
                    className="btn btn-secondary btn-sm text-error"
                    onClick={() => removeItem(item.id)}
                  >
                    ❌ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}