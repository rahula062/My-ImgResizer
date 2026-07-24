import { useState, useCallback, useRef, useEffect } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { loadImageFromFile, canvasToBlob, downloadBlob, applyFiltersToCanvas, FilterSettings } from '../utils/image'

const defaultFilters: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hueRotate: 0,
}

const presets: Array<{ name: string; icon: string; settings: FilterSettings }> = [
  { name: 'Original', icon: '🖼️', settings: defaultFilters },
  { name: 'Grayscale', icon: '🪙', settings: { ...defaultFilters, grayscale: 100 } },
  { name: 'Vintage Sepia', icon: '📜', settings: { ...defaultFilters, sepia: 80, contrast: 110, brightness: 95 } },
  { name: 'Cyberpunk', icon: '🌆', settings: { ...defaultFilters, hueRotate: 190, saturation: 180, contrast: 130 } },
  { name: 'Warm Summer', icon: '☀️', settings: { ...defaultFilters, sepia: 30, saturation: 140, brightness: 105 } },
  { name: 'Cool Oceanic', icon: '🌊', settings: { ...defaultFilters, hueRotate: 160, saturation: 130, contrast: 110 } },
  { name: 'Dramatic B&W', icon: '🎬', settings: { ...defaultFilters, grayscale: 100, contrast: 160 } },
  { name: 'Invert Colors', icon: '🔄', settings: { ...defaultFilters, invert: 100 } },
]

export default function FiltersPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [filters, setFilters] = useState<FilterSettings>(defaultFilters)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (f: File) => {
    try {
      const img = await loadImageFromFile(f)
      setImage(img)
      setFilters(defaultFilters)
    } catch (e) {
      alert('Failed to load image')
    }
  }, [])

  const processFilters = useCallback(() => {
    if (!image || !canvasRef.current) return
    const canvas = canvasRef.current
    applyFiltersToCanvas(canvas, image, filters)
    setPreviewUrl(canvas.toDataURL('image/png', 0.95))
  }, [image, filters])

  useEffect(() => {
    processFilters()
  }, [processFilters])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current, 'image/png', 0.95)
    downloadBlob(blob, 'pixelcraft-filtered.png')
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">🎨</span> Image Filters
        </h2>
        <div className="divider" />
        <p>Apply aesthetic filter presets or fine-tune color saturation, contrast, sepia, blur, and hue.</p>
      </div>

      {!image ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="🎨"
            title="Image Filters"
            subtitle="Upload image to apply custom filters"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          {/* Preset Buttons Grid */}
          <div className="card mb-4">
            <label className="lbl mb-2">Filter Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  className="btn btn-secondary btn-sm flex items-center justify-center gap-1 py-2 text-xs"
                  onClick={() => setFilters(p.settings)}
                >
                  <span>{p.icon}</span> {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="lbl">Brightness: <span className="text-accent3">{filters.brightness}%</span></label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="lbl">Contrast: <span className="text-cyan">{filters.contrast}%</span></label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.contrast}
                  onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="lbl">Saturation: <span className="text-accent3">{filters.saturation}%</span></label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="lbl">Blur: <span className="text-cyan">{filters.blur}px</span></label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="lbl">Grayscale: <span className="text-accent3">{filters.grayscale}%</span></label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.grayscale}
                  onChange={(e) => setFilters({ ...filters, grayscale: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="lbl">Sepia: <span className="text-cyan">{filters.sepia}%</span></label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.sepia}
                  onChange={(e) => setFilters({ ...filters, sepia: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="card mt16 flex flex-col items-center">
            <div className="preview-label mb-2">FILTERED RESULT</div>
            {previewUrl && <img src={previewUrl} alt="Filtered Preview" className="max-h-[500px] object-contain rounded border border-border" />}
          </div>

          <div className="btn-group mt16 flex gap-3">
            <button className="btn btn-secondary" onClick={() => setImage(null)}>
              🔄 Choose Another Image
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇️ Download Filtered Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}