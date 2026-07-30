import { useState, useCallback, useEffect } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'
import { toast } from '../utils/toast'

type BatchAction = 'resize' | 'convert' | 'compress' | 'rotate'

interface BatchItem {
  id: string
  file: File
  img: HTMLImageElement
  processedBlob: Blob | null
  processedUrl: string
}

export default function BatchProcessPage() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [action, setAction] = useState<BatchAction>('resize')
  
  // Params
  const [targetWidth, setTargetWidth] = useState(1280)
  const [targetFormat, setTargetFormat] = useState('image/png')
  const [quality, setQuality] = useState(80)
  const [rotateAngle, setRotateAngle] = useState(90)

  const [isProcessing, setIsProcessing] = useState(false)

  const processSingleItem = async (
    item: BatchItem,
    act: BatchAction,
    w: number,
    fmt: string,
    q: number,
    angle: number
  ): Promise<BatchItem> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return item

    let drawW = item.img.naturalWidth
    let drawH = item.img.naturalHeight

    if (act === 'resize') {
      if (drawW > w) {
        const ratio = drawW / drawH
        drawW = w
        drawH = Math.round(drawW / ratio)
      }
    }

    if (act === 'rotate') {
      const rad = (angle * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      canvas.width = Math.round(drawW * cos + drawH * sin)
      canvas.height = Math.round(drawW * sin + drawH * cos)

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)
      ctx.drawImage(item.img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()
    } else {
      canvas.width = drawW
      canvas.height = drawH
      if (fmt === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, drawW, drawH)
      }
      ctx.drawImage(item.img, 0, 0, drawW, drawH)
    }

    const mime = act === 'convert' ? fmt : item.file.type || 'image/jpeg'
    const blob = await canvasToBlob(canvas, mime, q / 100)

    if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)

    return {
      ...item,
      processedBlob: blob,
      processedUrl: URL.createObjectURL(blob),
    }
  }

  const handleFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    const newItems: BatchItem[] = []

    for (const f of files) {
      try {
        const img = await loadImageFromFile(f)
        const item: BatchItem = {
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          img,
          processedBlob: null,
          processedUrl: '',
        }
        const processed = await processSingleItem(item, action, targetWidth, targetFormat, quality, rotateAngle)
        newItems.push(processed)
      } catch (e) {
        toast(`Failed to load ${f.name}`, 'error')
      }
    }

    setItems((prev) => [...prev, ...newItems])
    setIsProcessing(false)
  }, [action, targetWidth, targetFormat, quality, rotateAngle])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.processedUrl && item.processedUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.processedUrl)
        }
      })
    }
  }, [items])

  const runBatch = async (
    act: BatchAction,
    w: number,
    fmt: string,
    q: number,
    angle: number
  ) => {
    setIsProcessing(true)
    const updated = await Promise.all(
      items.map((item) => processSingleItem(item, act, w, fmt, q, angle))
    )
    setItems(updated)
    setIsProcessing(false)
  }

  const handleDownloadZip = async () => {
    if (items.length === 0) return
    const zip = new JSZip()

    items.forEach((item, index) => {
      if (item.processedBlob) {
        const ext = item.processedBlob.type.split('/')[1] || 'jpg'
        const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name
        zip.file(`${baseName}-batch-${index + 1}.${ext}`, item.processedBlob)
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    downloadBlob(content, 'mediahub-batch-processed.zip')
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">⚡</span> Batch Process
        </h2>
        <div className="divider" />
        <p>Apply bulk transformations (Bulk Resize, Convert, Compress, or Rotate) across dozens of images at once.</p>
      </div>

      <div className="card">
        <Dropzone
          onFilesSelect={handleFiles}
          onFileSelect={(f) => handleFiles([f])}
          multiple
          icon="⚡"
          title="Batch Process Images"
          subtitle="Upload multiple images to apply bulk actions"
          buttonText="Choose Batch Images"
        />

        {items.length > 0 && (
          <div className="row mt16">
            <div>
              <label className="lbl">Batch Action</label>
              <select
                value={action}
                onChange={(e) => {
                  const act = e.target.value as BatchAction
                  setAction(act)
                  runBatch(act, targetWidth, targetFormat, quality, rotateAngle)
                }}
              >
                <option value="resize">Bulk Resize (Max Width)</option>
                <option value="convert">Bulk Format Convert</option>
                <option value="compress">Bulk Compress</option>
                <option value="rotate">Bulk Rotate</option>
              </select>
            </div>

            {action === 'resize' && (
              <div>
                <label className="lbl">Max Width (px)</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={targetWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value)
                    setTargetWidth(w)
                    runBatch(action, w, targetFormat, quality, rotateAngle)
                  }}
                />
              </div>
            )}

            {action === 'convert' && (
              <div>
                <label className="lbl">Convert All To</label>
                <select
                  value={targetFormat}
                  onChange={(e) => {
                    const fmt = e.target.value
                    setTargetFormat(fmt)
                    runBatch(action, targetWidth, fmt, quality, rotateAngle)
                  }}
                >
                  <option value="image/png">PNG (.png)</option>
                  <option value="image/jpeg">JPG (.jpg)</option>
                  <option value="image/webp">WEBP (.webp)</option>
                </select>
              </div>
            )}

            {action === 'compress' && (
              <div>
                <label className="lbl">Compression Quality: <span className="text-accent3">{quality}%</span></label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => {
                    const q = Number(e.target.value)
                    setQuality(q)
                    runBatch(action, targetWidth, targetFormat, q, rotateAngle)
                  }}
                />
              </div>
            )}

            {action === 'rotate' && (
              <div>
                <label className="lbl">Rotate Angle</label>
                <select
                  value={rotateAngle}
                  onChange={(e) => {
                    const angle = Number(e.target.value)
                    setRotateAngle(angle)
                    runBatch(action, targetWidth, targetFormat, quality, angle)
                  }}
                >
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Rotate</option>
                  <option value={270}>270° Clockwise</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">Batch Queue ({items.length} Images)</h3>
            <button className="btn btn-primary" onClick={handleDownloadZip} disabled={isProcessing}>
              📦 Download All (.ZIP)
            </button>
          </div>

          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4 p-3">
                <img
                  src={item.processedUrl || item.img.src}
                  alt={item.file.name}
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <div className="flex-1">
                  <div className="font-bold text-text text-sm">{item.file.name}</div>
                  <div className="text-xs text-text-dim">
                    Original: {formatBytes(item.file.size)} → Result: <span className="text-cyan font-bold">{formatBytes(item.processedBlob?.size || 0)}</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => item.processedBlob && downloadBlob(item.processedBlob, `processed-${item.file.name}`)}
                >
                  ⬇️ Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}