import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob } from '../utils/image'
import { toast } from '../utils/toast'

type Position = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'tile'

export default function WatermarkPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [wmText, setWmText] = useState('© MediaHub Watermark')
  const [position, setPosition] = useState<Position>('bottom-right')
  const [opacity, setOpacity] = useState(60)
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#ffffff')
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

  const processWatermark = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const w = image.naturalWidth
    const h = image.naturalHeight

    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(image, 0, 0, w, h)

    ctx.save()
    ctx.globalAlpha = opacity / 100
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 4

    const textMetrics = ctx.measureText(wmText)
    const textW = textMetrics.width
    const textH = fontSize

    if (position === 'tile') {
      ctx.rotate((-30 * Math.PI) / 180)
      for (let x = -w; x < w * 2; x += textW + 100) {
        for (let y = -h; y < h * 2; y += textH + 100) {
          ctx.fillText(wmText, x, y)
        }
      }
    } else {
      let x = 40
      let y = h - 40

      if (position === 'top-left') { x = 40; y = 40 + textH; }
      else if (position === 'top-center') { x = (w - textW) / 2; y = 40 + textH; }
      else if (position === 'top-right') { x = w - textW - 40; y = 40 + textH; }
      else if (position === 'center') { x = (w - textW) / 2; y = (h + textH) / 2; }
      else if (position === 'bottom-left') { x = 40; y = h - 40; }
      else if (position === 'bottom-center') { x = (w - textW) / 2; y = h - 40; }
      else if (position === 'bottom-right') { x = w - textW - 40; y = h - 40; }

      ctx.fillText(wmText, x, y)
    }

    ctx.restore()

    setPreviewUrl(canvas.toDataURL('image/png'))
  }, [image, wmText, position, opacity, fontSize, textColor])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    processWatermark()
  }, [processWatermark])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current, 'image/png', 0.95)
    downloadBlob(blob, 'mediahub-watermarked.png')
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">💧</span> Image Watermark
        </h2>
        <div className="divider" />
        <p>Add text or tiled watermarks to protect your photos with custom opacity and positioning.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="💧"
            title="Image Watermark"
            subtitle="Upload image to add watermark"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div style={{ flex: 2 }}>
                <label className="lbl">Watermark Text</label>
                <input
                  type="text"
                  value={wmText}
                  onChange={(e) => setWmText(e.target.value)}
                  placeholder="Enter watermark text..."
                />
              </div>

              <div>
                <label className="lbl">Position</label>
                <select value={position} onChange={(e) => setPosition(e.target.value as Position)}>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="tile">Tile Pattern (Full Image)</option>
                </select>
              </div>

              <div>
                <label className="lbl">Opacity: <span className="text-cyan">{opacity}%</span></label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Font Size (px)</label>
                <input
                  type="number"
                  min="12"
                  max="200"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Text Color</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border border-border"
                />
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">WATERMARKED PREVIEW</div>
            {previewUrl && <img src={previewUrl} alt="Watermark Preview" className="max-h-[500px] object-contain rounded border border-border" />}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Watermarked Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}