import { useState, useCallback } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { mergePdfs } from '../utils/pdf'
import { downloadBlob, formatBytes } from '../utils/image'

interface PdfItem {
  id: string
  file: File
}

export default function MergePdfPage() {
  const [items, setItems] = useState<PdfItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    const pdfs = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) {
      alert('Please upload PDF documents')
      return
    }
    const newItems: PdfItem[] = pdfs.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
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

  const handleMerge = async () => {
    if (items.length < 2) {
      alert('Please add at least 2 PDF files to merge')
      return
    }
    setIsProcessing(true)
    try {
      const pdfFiles = items.map((i) => i.file)
      const mergedBlob = await mergePdfs(pdfFiles)
      downloadBlob(mergedBlob, 'pixelcraft-merged-documents.pdf')
    } catch (e) {
      alert('Failed to merge PDFs')
      console.error(e)
    }
    setIsProcessing(false)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🗂️</span> Merge PDFs
        </h2>
        <div className="divider" />
        <p>Combine multiple PDF documents into a single unified PDF file. 100% Client-Side & Private.</p>
      </div>

      <div className="card">
        <Dropzone
          onFilesSelect={handleFiles}
          onFileSelect={(f) => handleFiles([f])}
          accept="application/pdf"
          multiple
          icon="🗂️"
          title="Drag & Drop PDFs to Merge"
          subtitle="Support multiple PDF files. Reorder files before merging."
          buttonText="Choose PDF Files"
        />
      </div>

      {items.length > 0 && (
        <div className="mt16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">PDF Files Queue ({items.length})</h3>
            <button
              className="btn btn-primary"
              onClick={handleMerge}
              disabled={isProcessing || items.length < 2}
            >
              {isProcessing ? '⚡ Merging PDFs...' : '🗂️ Merge & Download PDF'}
            </button>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="card flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-cyan font-bold w-6">#{index + 1}</span>
                  <div className="text-2xl">📄</div>
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
                    ⬆️ Up
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    ⬇️ Down
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