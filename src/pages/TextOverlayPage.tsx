import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob } from '../utils/image'
import { toast } from '../utils/toast'

export default function TextOverlayPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [text, setText] = useState('Media Hub Text Overlay')
  const [fontFamily, setFontFamily] = useState('sans-serif')
  const [fontSize, setFontSize] = useState(42)
  const [textColor, setTextColor] = useState('#00f5d4')
  const [posX, setPosX] = useState(50) // %
  const [posY, setPosY] = useState(50) // %
  const [showBgBox, setShowBgBox] = useState(true)
  const [boxColor] = useState('rgba(5, 5, 15, 0.75)')
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

  const renderTextOverlay = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const w = image.naturalWidth
    const h = image.naturalHeight
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(image, 0, 0, w, h)

    ctx.font = `bold ${fontSize}px ${fontFamily}`
    const metrics = ctx.measureText(text)
    const textW = metrics.width
    const textH = fontSize

    const drawX = Math.round((w * posX) / 100 - textW / 2)
    const drawY = Math.round((h * posY) / 100 + textH / 3)

    if (showBgBox) {
      const pad = 16
      ctx.fillStyle = boxColor
      ctx.fillRect(drawX - pad, drawY - textH, textW + pad * 2, textH + pad)
    }

    ctx.fillStyle = textColor
    ctx.fillText(text, drawX, drawY)

    setPreviewUrl(canvas.toDataURL('image/png'))
  }, [image, text, fontFamily, fontSize, textColor, posX, posY, showBgBox, boxColor])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    renderTextOverlay()
  }, [renderTextOverlay])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current, 'image/png', 0.95)
    downloadBlob(blob, 'mediahub-text-overlay.png')
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">📝</span> Text Overlay
        </h2>
        <div className="divider" />
        <p>Add custom text headers, captions, or typography overlays with customizable fonts, colors, and positioning.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="📝"
            title="Text Overlay"
            subtitle="Upload image to add custom text"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div style={{ flex: 2 }}>
                <label className="lbl">Text Content</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type overlay text here..."
                />
              </div>

              <div>
                <label className="lbl">Font Family</label>
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="Orbitron">Orbitron (Futuristic)</option>
                  <option value="Rajdhani">Rajdhani (Modern)</option>
                  <option value="Share Tech Mono">Monospace</option>
                  <option value="serif">Serif Classic</option>
                </select>
              </div>

              <div>
                <label className="lbl">Font Size (px)</label>
                <input
                  type="number"
                  min="12"
                  max="300"
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

            <div className="row mt16">
              <div>
                <label className="lbl">Horizontal Position (X %): <span className="text-cyan">{posX}%</span></label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Vertical Position (Y %): <span className="text-accent3">{posY}%</span></label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBgBox}
                    onChange={(e) => setShowBgBox(e.target.checked)}
                  />
                  Background Box
                </label>
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">TEXT OVERLAY PREVIEW</div>
            {previewUrl && <img src={previewUrl} alt="Text Overlay Preview" className="max-h-[500px] object-contain rounded border border-border" />}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Image with Text
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}