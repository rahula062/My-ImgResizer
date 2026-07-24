import { useState, useCallback } from 'react'
import Dropzone from '../components/ui/Dropzone'
import { boostImageKb, formatBytes, downloadBlob } from '../utils/image'

export default function IncreaseKbPage() {
  const [file, setFile] = useState<File | null>(null)
  const [targetKb, setTargetKb] = useState<number>(100)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    const currentKb = Math.ceil(f.size / 1024)
    setTargetKb(Math.max(currentKb + 50, 100))
  }, [])

  const handleIncreaseSize = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const padded = await boostImageKb(file, targetKb)
      setResultBlob(padded)
    } catch (e) {
      alert('Failed to increase file size')
    }
    setIsProcessing(false)
  }

  const handleDownload = () => {
    if (!resultBlob || !file) return
    downloadBlob(resultBlob, `pixelcraft-${targetKb}kb-${file.name}`)
  }

  return (
    <div>
      <div className="section-header">
        <h2>
          <span className="icon">📈</span> Increase File Size (KB)
        </h2>
        <div className="divider" />
        <p>Safely boost image file size to a target KB without changing visual quality. Perfect for official portal uploads requiring minimum file size limits.</p>
      </div>

      {!file ? (
        <div className="card">
          <Dropzone
            onFileSelect={handleFile}
            icon="📈"
            title="Increase Size (KB)"
            subtitle="Upload image to increase its file size"
            buttonText="Choose Image"
          />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <div>
                <label className="lbl">Current Original Size</label>
                <div className="tag tag-kb text-base py-1 px-3">{formatBytes(file.size)}</div>
              </div>

              <div>
                <label className="lbl">Target File Size (Min KB)</label>
                <input
                  type="number"
                  min={Math.ceil(file.size / 1024)}
                  max="10000"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                />
              </div>

              <div className="flex items-end">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleIncreaseSize}
                  disabled={isProcessing}
                >
                  ⚡ Generate {targetKb} KB File
                </button>
              </div>
            </div>
          </div>

          <div className="card-2col mt16">
            <div>
              <div className="preview-wrap">
                <div className="preview-label">ORIGINAL ({formatBytes(file.size)})</div>
                <img src={previewUrl} alt="Original" />
              </div>
            </div>

            <div>
              <div className="preview-wrap">
                <div className="preview-label">
                  RESULT ({resultBlob ? formatBytes(resultBlob.size) : 'Not Generated Yet'})
                </div>
                {previewUrl && <img src={previewUrl} alt="Result Preview" />}
              </div>
            </div>
          </div>

          {resultBlob && (
            <div className="card mt16 bg-card2 border-border-glow flex justify-between items-center">
              <div>
                <div className="text-success font-bold">✅ File Size Successfully Boosted!</div>
                <div className="text-xs text-text-dim mt-1">
                  Original: {formatBytes(file.size)} → New Size: <span className="text-cyan font-bold">{formatBytes(resultBlob.size)}</span>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleDownload}>
                ⬇️ Download {targetKb} KB Image
              </button>
            </div>
          )}

          <div className="btn-group mt16">
            <button className="btn btn-secondary" onClick={() => { setFile(null); setResultBlob(null); }}>
              🔄 Choose Another Image
            </button>
          </div>
        </>
      )}
    </div>
  )
}