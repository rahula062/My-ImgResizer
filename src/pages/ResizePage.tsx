import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, drawImageToCanvas, canvasToBlob, downloadBlob, formatBytes } from '../utils/image'
import { toast } from '../utils/toast'

export default function ResizePage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [aspectLock, setAspectLock] = useState(true)
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(92)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [origSize, setOrigSize] = useState(0)
  const [previewSize, setPreviewSize] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setFile(f)
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
      setOrigSize(f.size)
      setPreviewUrl(img.src)
    } catch (e) {
      toast('Failed to load image. Please try another file.', 'error')
    }
  }, [])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const updatePreview = useCallback(async () => {
    if (!image) return
    const canvas = canvasRef.current
    if (!canvas) return
    const w = parseInt(String(width)) || 1
    const h = parseInt(String(height)) || 1
    drawImageToCanvas(canvas, image, w, h)
    setPreviewUrl(canvas.toDataURL(format, quality / 100))
    canvas.toBlob(
      (blob) => {
        if (blob) setPreviewSize(blob.size)
      },
      format,
      quality / 100
    )
  }, [image, width, height, format, quality])

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value) || 1
    setWidth(w)
    if (aspectLock && image) {
      const ratio = image.naturalWidth / image.naturalHeight
      setHeight(Math.round(w / ratio))
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value) || 1
    setHeight(h)
    if (aspectLock && image) {
      const ratio = image.naturalWidth / image.naturalHeight
      setWidth(Math.round(h * ratio))
    }
  }

  const handleDownload = async () => {
    if (!image) return
    const canvas = canvasRef.current
    if (!canvas) return
    const w = parseInt(String(width)) || 1
    const h = parseInt(String(height)) || 1
    drawImageToCanvas(canvas, image, w, h)
    const blob = await canvasToBlob(canvas, format, quality / 100)
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg'
    downloadBlob(blob, `mediahub-resized-${w}x${h}.${ext}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">↔️</span> Resize Image
        </h2>
        <div className="divider" />
        <p>Resize to exact pixel dimensions. Lock aspect ratio to avoid distortion.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="🖼️"
            title="Resize Image"
            subtitle="JPG, PNG, WEBP, GIF supported"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Width (px)</label>
                <input
                  type="number"
                  value={width}
                  min="1"
                  max="10000"
                  onChange={handleWidthChange}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', flex: 0 }}>
                <div className="toggle-wrap">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={aspectLock}
                      onChange={(e) => setAspectLock(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <span style={{ fontSize: '1.4rem' }} title="Lock Aspect Ratio">
                    🔒
                  </span>
                </div>
              </div>
              <div>
                <label className="lbl">Height (px)</label>
                <input
                  type="number"
                  value={height}
                  min="1"
                  max="10000"
                  onChange={handleHeightChange}
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: '4px' }}>
              <div>
                <label className="lbl">Output Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label className="lbl">
                  Quality: <span style={{ color: 'var(--accent3)' }}>{quality}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="size-compare">
            <div className="size-row">
              <span>Original</span>
              <span className="tag tag-kb">{formatBytes(origSize)}</span>
            </div>
            <div className="size-bar">
              <div className="size-bar-fill" style={{ width: '100%' }} />
            </div>
            <div className="size-row">
              <span>Output (estimated)</span>
              <span className="tag tag-kb">
                {(previewSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="size-bar">
              <div
                className="size-bar-fill target"
                style={{
                  width: `${Math.min(100, (previewSize / Math.max(1, origSize)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="card-2col mt16">
            <div>
              <div className="preview-wrap">
                <div className="preview-label">ORIGINAL</div>
                <img src={previewUrl} alt="" />
              </div>
            </div>
            <div>
              <div className="preview-wrap">
                <div className="preview-label">PREVIEW</div>
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-secondary btn-sm" onClick={updatePreview}>
              🔄 Preview
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Resized
            </button>
          </div>
        </>
      )}

    </div>
  )
}
