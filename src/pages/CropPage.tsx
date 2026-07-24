import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'

type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2'

export default function CropPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aspect, setAspect] = useState<AspectRatio>('free')
  const [mode, setMode] = useState<'crop' | 'pad'>('crop')
  const [padColor, setPadColor] = useState('#ffffff')
  const [format, setFormat] = useState('image/png')
  
  // Crop coordinates (normalized 0 to 1)
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [outputSize, setOutputSize] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setFile(f)
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
    } catch (e) {
      alert('Failed to load image')
    }
  }, [])

  const updateCropByRatio = (ratioStr: AspectRatio) => {
    setAspect(ratioStr)
    if (!image) return

    if (ratioStr === 'free') {
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
      return
    }

    const [rW, rH] = ratioStr.split(':').map(Number)
    const targetRatio = rW / rH

    let w = 0.8
    let h = w / targetRatio * (image.naturalWidth / image.naturalHeight)

    if (h > 0.8) {
      h = 0.8
      w = h * targetRatio / (image.naturalWidth / image.naturalHeight)
    }

    const x = (1 - w) / 2
    const y = (1 - h) / 2
    setCropBox({ x, y, w, h })
  }

  const renderOutput = useCallback(async () => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const origW = image.naturalWidth
    const origH = image.naturalHeight

    if (mode === 'crop') {
      const srcX = Math.round(cropBox.x * origW)
      const srcY = Math.round(cropBox.y * origH)
      const srcW = Math.max(1, Math.round(cropBox.w * origW))
      const srcH = Math.max(1, Math.round(cropBox.h * origH))

      canvas.width = srcW
      canvas.height = srcH

      ctx.clearRect(0, 0, srcW, srcH)
      ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
    } else {
      // Pad to ratio
      let targetRatio = 1
      if (aspect !== 'free') {
        const [rW, rH] = aspect.split(':').map(Number)
        targetRatio = rW / rH
      } else {
        targetRatio = origW / origH
      }

      let outW = origW
      let outH = Math.round(outW / targetRatio)

      if (outH < origH) {
        outH = origH
        outW = Math.round(outH * targetRatio)
      }

      canvas.width = outW
      canvas.height = outH

      ctx.fillStyle = padColor
      ctx.fillRect(0, 0, outW, outH)

      const drawX = Math.round((outW - origW) / 2)
      const drawY = Math.round((outH - origH) / 2)
      ctx.drawImage(image, drawX, drawY)
    }

    setPreviewUrl(canvas.toDataURL(format, 0.92))
    canvas.toBlob((b) => b && setOutputSize(b.size), format, 0.92)
  }, [image, cropBox, mode, aspect, padColor, format])

  useEffect(() => {
    renderOutput()
  }, [renderOutput])

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return
    const blob = await canvasToBlob(canvasRef.current, format, 0.92)
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg'
    downloadBlob(blob, `mediahub-cropped.${ext}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">✂️</span> Crop Image
        </h2>
        <div className="divider" />
        <p>Crop image with aspect ratio presets or add padded borders to fit target ratios.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="✂️"
            title="Crop Image"
            subtitle="JPG, PNG, WEBP, GIF supported"
            buttonText="Choose Image to Crop"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row" style={{ marginBottom: '16px' }}>
              <div>
                <label className="lbl">Operation Mode</label>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-sm ${mode === 'crop' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMode('crop')}
                  >
                    ✂️ Crop Image
                  </button>
                  <button
                    className={`btn btn-sm ${mode === 'pad' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMode('pad')}
                  >
                    🖼️ Pad to Ratio
                  </button>
                </div>
              </div>

              <div>
                <label className="lbl">Aspect Ratio</label>
                <select value={aspect} onChange={(e) => updateCropByRatio(e.target.value as AspectRatio)}>
                  <option value="free">Free / Custom</option>
                  <option value="1:1">1:1 Square (Instagram)</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="16:9">16:9 Widescreen (YouTube/Header)</option>
                  <option value="9:16">9:16 Vertical (Stories/Reels)</option>
                  <option value="3:2">3:2 DSLR</option>
                </select>
              </div>

              {mode === 'pad' && (
                <div>
                  <label className="lbl">Pad Background Color</label>
                  <input
                    type="color"
                    value={padColor}
                    onChange={(e) => setPadColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer rounded border border-border"
                  />
                </div>
              )}

              <div>
                <label className="lbl">Output Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
            </div>

            {mode === 'crop' && (
              <div className="row" style={{ marginTop: '12px' }}>
                <div>
                  <label className="lbl">Crop Area Width (%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(cropBox.w * 100)}
                    onChange={(e) => {
                      const w = Number(e.target.value) / 100
                      setCropBox((prev) => ({
                        ...prev,
                        w,
                        x: Math.min(prev.x, 1 - w),
                      }))
                    }}
                  />
                </div>
                <div>
                  <label className="lbl">Crop Area Height (%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(cropBox.h * 100)}
                    onChange={(e) => {
                      const h = Number(e.target.value) / 100
                      setCropBox((prev) => ({
                        ...prev,
                        h,
                        y: Math.min(prev.y, 1 - h),
                      }))
                    }}
                  />
                </div>
              </div>
            )}
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
                  OUTPUT ({canvasRef.current?.width || 0}×{canvasRef.current?.height || 0} px · {formatBytes(outputSize)})
                </div>
                {previewUrl && <img src={previewUrl} alt="Cropped Preview" />}
              </div>
            </div>
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Reset / Choose New File
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Cropped Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}