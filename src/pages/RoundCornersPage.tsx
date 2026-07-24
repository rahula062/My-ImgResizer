import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, drawRoundedCorners } from '../utils/image'

export default function RoundCornersPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [radius, setRadius] = useState<number>(40)
  const [isCircle, setIsCircle] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>('transparent')
  const [format, setFormat] = useState('image/png')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
    } catch (e) {
      alert('Failed to load image')
    }
  }, [])

  const processCorners = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    drawRoundedCorners(canvas, image, radius, isCircle, bgColor)
    setPreviewUrl(canvas.toDataURL(format, 0.95))
  }, [image, radius, isCircle, bgColor, format])

  useEffect(() => {
    processCorners()
  }, [processCorners])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current, format, 0.95)
    const ext = format.split('/')[1] || 'png'
    downloadBlob(blob, `mediahub-rounded.${ext}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">💎</span> Round Corners
        </h2>
        <div className="divider" />
        <p>Smooth out image corners with custom radius sliders or create perfect circular crop profile photos.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="💎"
            title="Round Corners"
            subtitle="Upload image to round corners or circle crop"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Corner Mode</label>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-sm ${!isCircle ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsCircle(false)}
                  >
                    🔳 Rounded Rect
                  </button>
                  <button
                    className={`btn btn-sm ${isCircle ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsCircle(true)}
                  >
                    ⚪ Circle Crop
                  </button>
                </div>
              </div>

              {!isCircle && (
                <div>
                  <label className="lbl">Corner Radius: <span className="text-accent3">{radius}px</span></label>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(Math.min(image.naturalWidth, image.naturalHeight) / 2)}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                  />
                </div>
              )}

              <div>
                <label className="lbl">Background Fill</label>
                <select value={bgColor} onChange={(e) => setBgColor(e.target.value)}>
                  <option value="transparent">Transparent (PNG)</option>
                  <option value="#ffffff">White (#FFFFFF)</option>
                  <option value="#05050f">Dark Deep (#05050F)</option>
                  <option value="#7c3aed">Purple Accent</option>
                </select>
              </div>

              <div>
                <label className="lbl">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WEBP</option>
                  <option value="image/jpeg">JPG</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">ROUNDED PREVIEW</div>
            {previewUrl && (
              <div
                className="w-full min-h-[300px] flex items-center justify-center p-4 rounded"
                style={{
                  backgroundImage:
                    bgColor === 'transparent'
                      ? 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)'
                      : 'none',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              >
                <img src={previewUrl} alt="Rounded Preview" className="max-h-[450px] object-contain" />
              </div>
            )}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Rounded Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}