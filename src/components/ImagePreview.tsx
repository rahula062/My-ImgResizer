interface ImagePreviewProps {
  src: string
  label: string
  info?: string
}

export default function ImagePreview({ src, label, info }: ImagePreviewProps) {
  return (
    <div className="preview-wrap">
      <div className="preview-label">{label}</div>
      <img src={src} alt={label} />
      {info && <div className="preview-info">{info}</div>}
    </div>
  )
}