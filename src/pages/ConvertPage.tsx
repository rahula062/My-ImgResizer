import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'

interface ConvertItem {
  id: string
  file: File
  img: HTMLImageElement
  convertedBlob: Blob | null
  convertedUrl: string
}

export default function ConvertPage() {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [targetFormat, setTargetFormat] = useState('image/png')
  const [quality, setQuality] = useState(92)
  const [isProcessing, setIsProcessing] = useState(false)

  const processConvert = async (item: ConvertItem, format: string, q: number): Promise<ConvertItem> => {
    const canvas = document.createElement('canvas')
    canvas.width = item.img.naturalWidth
    canvas.height = item.img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return item

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(item.img, 0, 0)
    const blob = await canvasToBlob(canvas, format, q / 100)

    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl)

    return {
      ...item,
      convertedBlob: blob,
      convertedUrl: URL.createObjectURL(blob),
    }
  }

  const handleFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    const newItems: ConvertItem[] = []

    for (const f of files) {
      try {
        const img = await loadImageFromFile(f)
        const item: ConvertItem = {
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          img,
          convertedBlob: null,
          convertedUrl: '',
        }
        const converted = await processConvert(item, targetFormat, quality)
        newItems.push(converted)
      } catch (e) {
        console.error('Failed to load image for conversion:', f)
      }
    }

    setItems((prev) => [...prev, ...newItems])
    setIsProcessing(false)
  }, [targetFormat, quality])

  const updateFormat = async (fmt: string, q: number) => {
    setIsProcessing(true)
    const updated = await Promise.all(items.map((item) => processConvert(item, fmt, q)))
    setItems(updated)
    setIsProcessing(false)
  }

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return
    const zip = new JSZip()
    const ext = targetFormat.split('/')[1] || 'png'

    items.forEach((item) => {
      if (item.convertedBlob) {
        const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name
        zip.file(`${baseName}.${ext}`, item.convertedBlob)
      }
    })

    const content = await zip.generateAsync({ type: 'blob' })
    downloadBlob(content, `pixelcraft-converted-${ext}.zip`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🔄</span> Convert Format
        </h2>
        <div className="divider" />
        <p>Convert your images to JPG, PNG, WEBP, BMP, GIF instantly in your browser.</p>
      </div>

      <div className="card">
        <Dropzone
          onFilesSelect={handleFiles}
          onFileSelect={(f) => handleFiles([f])}
          multiple
          icon="🔄"
          title="Convert Format"
          subtitle="Support batch conversion across formats"
          buttonText="Choose Images to Convert"
        />

        {items.length > 0 && (
          <div className="row mt16">
            <div>
              <label className="lbl">Target Output Format</label>
              <select
                value={targetFormat}
                onChange={(e) => {
                  setTargetFormat(e.target.value)
                  updateFormat(e.target.value, quality)
                }}
              >
                <option value="image/png">PNG (.png)</option>
                <option value="image/jpeg">JPG / JPEG (.jpg)</option>
                <option value="image/webp">WEBP (.webp)</option>
                <option value="image/bmp">BMP (.bmp)</option>
              </select>
            </div>

            <div>
              <label className="lbl">Quality: <span className="text-accent3">{quality}%</span></label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => {
                  const q = Number(e.target.value)
                  setQuality(q)
                  updateFormat(targetFormat, q)
                }}
              />
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">Converted Images ({items.length})</h3>
            <button className="btn btn-primary" onClick={handleDownloadAllZip} disabled={isProcessing}>
              📦 Download All (.ZIP)
            </button>
          </div>

          <div className="grid gap-4">
            {items.map((item) => {
              const ext = targetFormat.split('/')[1] || 'png'
              const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name

              return (
                <div key={item.id} className="card flex items-center gap-4">
                  <img
                    src={item.convertedUrl || item.img.src}
                    alt={item.file.name}
                    className="w-20 h-20 object-cover rounded border border-border"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-text text-sm mb-1">{item.file.name}</div>
                    <div className="text-xs text-text-dim">
                      Format: {item.file.type || 'image'} → <span className="text-accent3 font-bold">{ext.toUpperCase()}</span> ({formatBytes(item.convertedBlob?.size || 0)})
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => item.convertedBlob && downloadBlob(item.convertedBlob, `${baseName}.${ext}`)}
                  >
                    ⬇️ Download .{ext}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}