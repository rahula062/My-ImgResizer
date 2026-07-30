import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, removeBackgroundColor } from '../utils/image'
import { toast } from '../utils/toast'

export default function RemoveBgPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [targetColor, setTargetColor] = useState<[number, number, number]>([255, 255, 255])
  const [tolerance, setTolerance] = useState(30)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setFile(f)
    } catch (e) {
      toast('Failed to load image. Please try another file.', 'error')
    }
  }, [])

  const processRemoveBg = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    removeBackgroundColor(canvas, image, targetColor, tolerance)
    setPreviewUrl(canvas.toDataURL('image/png'))
  }, [image, targetColor, tolerance])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    processRemoveBg()
  }, [processRemoveBg])

  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!image) return
    const imgEl = e.currentTarget
    const rect = imgEl.getBoundingClientRect()
    const scaleX = image.naturalWidth / rect.width
    const scaleY = image.naturalHeight / rect.height

    const clickX = Math.floor((e.clientX - rect.left) * scaleX)
    const clickY = Math.floor((e.clientY - rect.top) * scaleY)

    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = image.naturalWidth
    tmpCanvas.height = image.naturalHeight
    const ctx = tmpCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(image, 0, 0)
    const pixel = ctx.getImageData(clickX, clickY, 1, 1).data
    setTargetColor([pixel[0], pixel[1], pixel[2]])
  }

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return
    const blob = await canvasToBlob(canvasRef.current, 'image/png', 1)
    downloadBlob(blob, `mediahub-bg-removed-${file.name.split('.')[0]}.png`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🪄</span> Remove Background
        </h2>
        <div className="divider" />
        <p>100% Client-Side background remover. Click any color on the original image to select target background to erase.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="🪄"
            title="Remove Background"
            subtitle="Upload image with solid or distinct background color"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Target Removal Color</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: `rgb(${targetColor.join(',')})` }}
                  />
                  <span className="font-mono text-xs text-text-dim">
                    RGB({targetColor.join(', ')})
                  </span>
                  <span className="text-xs text-cyan">👈 Click image below to pick color</span>
                </div>
              </div>

              <div>
                <label className="lbl">Color Tolerance: <span className="text-accent3">{tolerance}</span></label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="card-2col mt16">
            <div>
              <div className="preview-wrap">
                <div className="preview-label">CLICK ORIGINAL TO PICK BG COLOR</div>
                <img
                  src={image.src}
                  alt="Original"
                  onClick={handleCanvasClick}
                  className="cursor-crosshair"
                />
              </div>
            </div>

            <div>
              <div className="preview-wrap">
                <div className="preview-label">TRANSPARENT RESULT (PNG)</div>
                {previewUrl && (
                  <div
                    className="w-full h-full min-h-[250px] flex items-center justify-center rounded"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  >
                    <img src={previewUrl} alt="Background Removed" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Transparent PNG
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}