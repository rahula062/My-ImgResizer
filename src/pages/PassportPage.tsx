import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob } from '../utils/image'
import { toast } from '../utils/toast'

interface PassportPreset {
  country: string
  name: string
  widthPx: number
  heightPx: number
  desc: string
}

const presets: PassportPreset[] = [
  { country: '🇺🇸 US', name: 'USA Passport (2x2 in)', widthPx: 600, heightPx: 600, desc: '2 x 2 inches (51x51 mm)' },
  { country: '🇮🇳 IN', name: 'India Passport (3.5x4.5 cm)', widthPx: 413, heightPx: 531, desc: '35 x 45 mm (300 DPI)' },
  { country: '🇬🇧 UK', name: 'UK Passport (3.5x4.5 cm)', widthPx: 413, heightPx: 531, desc: '35 x 45 mm' },
  { country: '🇪🇺 EU', name: 'Schengen / Europe (3.5x4.5 cm)', widthPx: 413, heightPx: 531, desc: '35 x 45 mm' },
  { country: '🇨🇦 CA', name: 'Canada Passport (5x7 cm)', widthPx: 591, heightPx: 827, desc: '50 x 70 mm' },
  { country: '🇦🇺 AU', name: 'Australia Passport (3.5x4.5 cm)', widthPx: 413, heightPx: 531, desc: '35 x 45 mm' },
]

export default function PassportPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<PassportPreset>(presets[0])
  const [bgColor, setBgColor] = useState('#ffffff')
  const [showGuide, setShowGuide] = useState(true)
  const [sheetMode, setSheetMode] = useState<'single' | 'grid'>('single')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
    } catch (e) {
      toast('Failed to load image. Please try another file.', 'error')
    }
  }, [])

  const renderPassportCanvasEx = useCallback((withGuides: boolean) => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (sheetMode === 'single') {
      const w = selectedPreset.widthPx
      const h = selectedPreset.heightPx
      canvas.width = w
      canvas.height = h

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)

      // Fit face proportionally
      const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight)
      const drawW = image.naturalWidth * scale
      const drawH = image.naturalHeight * scale
      const x = (w - drawW) / 2
      const y = (h - drawH) / 2

      ctx.drawImage(image, x, y, drawW, drawH)

      if (withGuides) {
        ctx.strokeStyle = '#00f5d4'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(w / 2, h * 0.4, w * 0.25, 0, Math.PI * 2) // Head guide
        ctx.stroke()

        ctx.strokeStyle = '#ff007f'
        ctx.beginPath()
        ctx.moveTo(w * 0.2, h * 0.38)
        ctx.lineTo(w * 0.8, h * 0.38) // Eye line
        ctx.stroke()
      }
    } else {
      // 4x6 inch print sheet (1200 x 1800 px @ 300 DPI)
      const sheetW = 1200
      const sheetH = 1800
      canvas.width = sheetW
      canvas.height = sheetH

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sheetW, sheetH)

      // Draw single photo offscreen
      const singleCanvas = document.createElement('canvas')
      singleCanvas.width = selectedPreset.widthPx
      singleCanvas.height = selectedPreset.heightPx
      const sCtx = singleCanvas.getContext('2d')
      if (sCtx) {
        sCtx.fillStyle = bgColor
        sCtx.fillRect(0, 0, selectedPreset.widthPx, selectedPreset.heightPx)
        const scale = Math.min(selectedPreset.widthPx / image.naturalWidth, selectedPreset.heightPx / image.naturalHeight)
        const drawW = image.naturalWidth * scale
        const drawH = image.naturalHeight * scale
        sCtx.drawImage(image, (selectedPreset.widthPx - drawW) / 2, (selectedPreset.heightPx - drawH) / 2, drawW, drawH)
      }

      // Tile grid (e.g. 2 cols x 3 rows)
      const cols = 2
      const rows = 3
      const paddingX = (sheetW - cols * selectedPreset.widthPx) / (cols + 1)
      const paddingY = (sheetH - rows * selectedPreset.heightPx) / (rows + 1)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = paddingX + c * (selectedPreset.widthPx + paddingX)
          const y = paddingY + r * (selectedPreset.heightPx + paddingY)
          ctx.drawImage(singleCanvas, x, y)
          ctx.strokeStyle = '#cccccc'
          ctx.strokeRect(x, y, selectedPreset.widthPx, selectedPreset.heightPx)
        }
      }
    }

    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95))
  }, [image, selectedPreset, bgColor, sheetMode])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    renderPassportCanvasEx(showGuide)
  }, [renderPassportCanvasEx, showGuide])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    renderPassportCanvasEx(false) // Clean draw without guides for export
    const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.95)
    renderPassportCanvasEx(showGuide) // Restore preview state
    const countryName = selectedPreset.country.toLowerCase().replace(/[^a-z0-9]/g, '')
    downloadBlob(blob, `mediahub-passport-${countryName}-${sheetMode}.jpg`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🪪</span> Passport Photo Maker
        </h2>
        <div className="divider" />
        <p>Auto-resize photos to official country passport sizes. Generate single photos or 4x6 print sheets.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="🪪"
            title="Passport Photo Maker"
            subtitle="Upload portrait photo with plain background"
            buttonText="Choose Photo"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Country Standard Preset</label>
                <select
                  value={selectedPreset.name}
                  onChange={(e) => {
                    const found = presets.find((p) => p.name === e.target.value)
                    if (found) setSelectedPreset(found)
                  }}
                >
                  {presets.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.country} — {p.name} ({p.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="lbl">Output Layout</label>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-sm ${sheetMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSheetMode('single')}
                  >
                    👤 Single Photo
                  </button>
                  <button
                    className={`btn btn-sm ${sheetMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSheetMode('grid')}
                  >
                    🖼️ 4x6 Print Sheet Grid
                  </button>
                </div>
              </div>

              <div>
                <label className="lbl">Background Fill Color</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border border-border"
                />
              </div>

              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGuide}
                    onChange={(e) => setShowGuide(e.target.checked)}
                  />
                  Show Alignment Guide
                </label>
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">
              PREVIEW — {selectedPreset.name} ({sheetMode === 'single' ? `${selectedPreset.widthPx}×${selectedPreset.heightPx} px` : '4x6 Print Grid'})
            </div>
            {previewUrl && <img src={previewUrl} alt="Passport Preview" className="max-h-[450px] object-contain rounded border border-border" />}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Photo
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Passport Photo (JPG)
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}