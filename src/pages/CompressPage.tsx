import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'

interface CompressItem {
  id: string
  file: File
  img: HTMLImageElement
  compressedBlob: Blob | null
  compressedUrl: string
  compressedSize: number
}

export default function CompressPage() {
  const [items, setItems] = useState<CompressItem[]>([])
  const [quality, setQuality] = useState(75)
  const [scale, setScale] = useState(100)
  const [targetFormat, setTargetFormat] = useState<'original' | 'image/jpeg' | 'image/webp'>('image/jpeg')
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = async (
    item: CompressItem,
    q: number,
    s: number,
    fmt: string
  ): Promise<CompressItem> => {
    const canvas = document.createElement('canvas')
    const targetW = Math.round((item.img.naturalWidth * s) / 100)
    const targetH = Math.round((item.img.naturalHeight * s) / 100)

    canvas.width = Math.max(1, targetW)
    canvas.height = Math.max(1, targetH)

    const ctx = canvas.getContext('2d')
    if (!ctx) return item

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(item.img, 0, 0, canvas.width, canvas.height)

    const mime = fmt === 'original' ? item.file.type || 'image/jpeg' : fmt
    const blob = await canvasToBlob(canvas, mime, q / 100)

    if (item.compressedUrl) {
      URL.revokeObjectURL(item.compressedUrl)
    }

    return {
      ...item,
      compressedBlob: blob,
      compressedUrl: URL.createObjectURL(blob),
      compressedSize: blob.size,
    }
  }

  const handleFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    const newItems: CompressItem[] = []

    for (const f of files) {
      try {
        const img = await loadImageFromFile(f)
        const item: CompressItem = {
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          img,
          compressedBlob: null,
          compressedUrl: '',
          compressedSize: 0,
        }
        const processed = await processFile(item, quality, scale, targetFormat)
        newItems.push(processed)
      } catch (e) {
        console.error('Failed to load image:', f.name)
      }
    }

    setItems((prev) => [...prev, ...newItems])
    setIsProcessing(false)
  }, [quality, scale, targetFormat])

  const updateAllCompressions = async (q: number, s: number, fmt: string) => {
    setIsProcessing(true)
    const updated = await Promise.all(
      items.map((item) => processFile(item, q, s, fmt))
    )
    setItems(updated)
    setIsProcessing(false)
  }

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return
    const zip = new JSZip()

    items.forEach((item, index) => {
      if (item.compressedBlob) {
        const ext = item.compressedBlob.type === 'image/webp' ? 'webp' : 'jpg'
        const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name
        zip.file(`${baseName}-compressed-${index + 1}.${ext}`, item.compressedBlob)
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    downloadBlob(content, 'mediahub-compressed-images.zip')
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">📦</span> Compress Image
        </h2>
        <div className="divider" />
        <p>Reduce image file size with custom quality & scale sliders. Live before/after file size preview.</p>
      </div>

      <div className="card">
        <Dropzone
          onFilesSelect={handleFiles}
          onFileSelect={(f) => handleFiles([f])}
          multiple
          icon="📦"
          title="Drag & Drop Images to Compress"
          subtitle="Support multiple files (JPG, PNG, WEBP)"
          buttonText="Choose Images"
        />

        {items.length > 0 && (
          <div className="mt16 row">
            <div>
              <label className="lbl">Quality: <span className="text-accent3">{quality}%</span></label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setQuality(val)
                  updateAllCompressions(val, scale, targetFormat)
                }}
              />
            </div>

            <div>
              <label className="lbl">Scale Resolution: <span className="text-cyan">{scale}%</span></label>
              <input
                type="range"
                min="10"
                max="100"
                value={scale}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setScale(val)
                  updateAllCompressions(quality, val, targetFormat)
                }}
              />
            </div>

            <div>
              <label className="lbl">Output Format</label>
              <select
                value={targetFormat}
                onChange={(e) => {
                  const fmt = e.target.value as any
                  setTargetFormat(fmt)
                  updateAllCompressions(quality, scale, fmt)
                }}
              >
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WEBP</option>
                <option value="original">Original Format</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">Compressed Files ({items.length})</h3>
            <button
              className="btn btn-primary"
              onClick={handleDownloadAllZip}
              disabled={isProcessing}
            >
              📦 Download All (.ZIP)
            </button>
          </div>

          <div className="grid gap-4">
            {items.map((item) => {
              const savedPct = item.file.size > 0
                ? Math.round(((item.file.size - item.compressedSize) / item.file.size) * 100)
                : 0

              return (
                <div key={item.id} className="card flex flex-col md:flex-row items-center gap-4">
                  <img
                    src={item.compressedUrl || item.img.src}
                    alt={item.file.name}
                    className="w-24 h-24 object-cover rounded border border-border"
                  />

                  <div className="flex-1">
                    <div className="font-bold text-text text-sm mb-1">{item.file.name}</div>
                    <div className="text-xs text-text-dim mb-2">
                      Original: {formatBytes(item.file.size)} → Compressed: {formatBytes(item.compressedSize)}
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className={`tag ${savedPct > 0 ? 'tag-kb' : 'tag-px'}`}>
                        {savedPct > 0 ? `Saved ${savedPct}%` : 'Expanded size'}
                      </span>
                      <span className="text-xs text-text-muted">
                        {item.img.naturalWidth}×{item.img.naturalHeight} px
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => item.compressedBlob && downloadBlob(item.compressedBlob, `compressed-${item.file.name}`)}
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}