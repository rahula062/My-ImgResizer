import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, rotateAndFlip } from '../utils/image'

export default function RotatePage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [angle, setAngle] = useState<number>(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [format, setFormat] = useState('image/png')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setAngle(0)
      setFlipH(false)
      setFlipV(false)
    } catch (e) {
      alert('Failed to load image')
    }
  }, [])

  const renderRotateCanvas = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    rotateAndFlip(canvas, image, angle, flipH, flipV)
    setPreviewUrl(canvas.toDataURL(format, 0.95))
  }, [image, angle, flipH, flipV, format])

  useEffect(() => {
    renderRotateCanvas()
  }, [renderRotateCanvas])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current, format, 0.95)
    const ext = format.split('/')[1] || 'png'
    downloadBlob(blob, `pixelcraft-rotated-${angle}deg.${ext}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🔄</span> Rotate & Flip
        </h2>
        <div className="divider" />
        <p>Rotate image 90°, 180°, or any custom angle with automatic bounding box expansion. Flip horizontally or vertically.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="🔄"
            title="Rotate & Flip Image"
            subtitle="Upload image to rotate or mirror"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAngle((prev) => (prev + 90) % 360)}
              >
                ↻ Rotate 90° CW
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAngle((prev) => (prev - 90 + 360) % 360)}
              >
                ↺ Rotate 90° CCW
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAngle((prev) => (prev + 180) % 360)}
              >
                🔄 Rotate 180°
              </button>
              <button
                className={`btn btn-sm ${flipH ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFlipH(!flipH)}
              >
                ↔️ Flip Horizontal
              </button>
              <button
                className={`btn btn-sm ${flipV ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFlipV(!flipV)}
              >
                ↕️ Flip Vertical
              </button>
            </div>

            <div className="row">
              <div style={{ flex: 2 }}>
                <label className="lbl">Custom Rotation Angle: <span className="text-accent3">{angle}°</span></label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">ROTATED PREVIEW ({canvasRef.current?.width || 0}×{canvasRef.current?.height || 0} px)</div>
            {previewUrl && <img src={previewUrl} alt="Rotated Preview" className="max-h-[500px] object-contain rounded border border-border" />}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Rotated Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}