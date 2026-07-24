import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'

export default function EnhancePage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [upscale, setUpscale] = useState<number>(2) // 1x, 2x, 4x
  const [contrast, setContrast] = useState<number>(115)
  const [brightness, setBrightness] = useState<number>(105)
  const [format, setFormat] = useState('image/png')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [outputSize, setOutputSize] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setFile(f)
    } catch (e) {
      alert('Failed to load image')
    }
  }, [])

  const processEnhance = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const targetW = image.naturalWidth * upscale
    const targetH = image.naturalHeight * upscale

    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
    ctx.drawImage(image, 0, 0, targetW, targetH)
    ctx.filter = 'none'

    setPreviewUrl(canvas.toDataURL(format, 0.92))
    canvas.toBlob((b) => b && setOutputSize(b.size), format, 0.92)
  }, [image, upscale, brightness, contrast, format])

  useEffect(() => {
    processEnhance()
  }, [processEnhance])

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return
    const blob = await canvasToBlob(canvasRef.current, format, 0.92)
    const ext = format.split('/')[1] || 'png'
    downloadBlob(blob, `pixelcraft-enhanced-${upscale}x-${file.name.split('.')[0]}.${ext}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">✨</span> Enhance Image Quality
        </h2>
        <div className="divider" />
        <p>Upscale low-resolution images 2x or 4x with automatic contrast and sharpness enhancements.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="✨"
            title="Enhance Quality"
            subtitle="Upscale and sharpen blurry or low-res images"
            buttonText="Choose Image to Enhance"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Upscale Resolution</label>
                <div className="flex gap-2">
                  {[1, 2, 4].map((factor) => (
                    <button
                      key={factor}
                      className={`btn btn-sm ${upscale === factor ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setUpscale(factor)}
                    >
                      {factor}x Upscale
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="lbl">Contrast Boost: <span className="text-accent3">{contrast}%</span></label>
                <input
                  type="range"
                  min="80"
                  max="160"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Brightness: <span className="text-cyan">{brightness}%</span></label>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="lbl">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-2col mt16">
            <div>
              <div className="preview-wrap">
                <div className="preview-label">ORIGINAL ({image.naturalWidth}×{image.naturalHeight} px)</div>
                <img src={image.src} alt="Original" />
              </div>
            </div>

            <div>
              <div className="preview-wrap">
                <div className="preview-label">
                  ENHANCED RESULT ({image.naturalWidth * upscale}×{image.naturalHeight * upscale} px · {formatBytes(outputSize)})
                </div>
                {previewUrl && <img src={previewUrl} alt="Enhanced" />}
              </div>
            </div>
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Enhanced Image ({upscale}x)
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}