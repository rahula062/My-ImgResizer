import { useCallback, useState } from 'react'

interface DropzoneProps {
  onFileSelect?: (file: File) => void
  onFilesSelect?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  icon?: string
  title: string
  subtitle: string
  buttonText: string
}

export default function Dropzone({
  onFileSelect,
  onFilesSelect,
  accept = 'image/*',
  multiple = false,
  icon = '🖼️',
  title,
  subtitle,
  buttonText
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const filesList = Array.from(e.dataTransfer.files)
    if (filesList.length > 0) {
      if (multiple && onFilesSelect) {
        onFilesSelect(filesList)
      } else if (onFileSelect) {
        onFileSelect(filesList[0])
      }
    }
  }, [multiple, onFileSelect, onFilesSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = Array.from(e.target.files || [])
    if (filesList.length > 0) {
      if (multiple && onFilesSelect) {
        onFilesSelect(filesList)
      } else if (onFileSelect) {
        onFileSelect(filesList[0])
      }
    }
    // Reset input value so re-uploading same file works
    e.target.value = ''
  }, [multiple, onFileSelect, onFilesSelect])

  return (
    <div
      className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="dz-input"
        onChange={handleInputChange}
      />
      <span className="dz-icon">{icon}</span>
      <div className="dz-title">{title}</div>
      <div className="dz-sub">{subtitle}</div>
      <button
        className="dz-btn"
        onClick={(e) => {
          e.stopPropagation()
          const input = e.currentTarget.parentElement?.querySelector('input')
          input?.click()
        }}
      >
        📁 {buttonText}
      </button>
    </div>
  )
}