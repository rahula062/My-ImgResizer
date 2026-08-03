export interface ExifInfo {
  filename: string
  filesize: string
  filetype: string
  dimensions?: string
  make?: string
  model?: string
  dateTime?: string
  exposureTime?: string
  fNumber?: string
  iso?: string
  focalLength?: string
  software?: string
  latitude?: string
  longitude?: string
}

/** Parse basic EXIF data from JPEG/PNG header tags */
export async function parseExif(file: File): Promise<ExifInfo> {
  const info: ExifInfo = {
    filename: file.name,
    filesize: (file.size / 1024).toFixed(1) + ' KB',
    filetype: file.type || 'Unknown',
  }

  // Load image dimensions
  await new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      info.dimensions = `${img.naturalWidth} × ${img.naturalHeight} px`
      URL.revokeObjectURL(img.src)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = URL.createObjectURL(file)
  })

  // Read binary header for EXIF markers
  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer() // read first 128KB
    const view = new DataView(buffer)

    if (view.getUint16(0, false) === 0xffd8) {
      let offset = 2
      const length = view.byteLength

      while (offset < length) {
        const marker = view.getUint16(offset, false)
        offset += 2

        if (marker === 0xffe1) {
          // EXIF Header
          const exifHeader = String.fromCharCode(
            view.getUint8(offset + 2),
            view.getUint8(offset + 3),
            view.getUint8(offset + 4),
            view.getUint8(offset + 5)
          )

          if (exifHeader === 'Exif') {
            info.make = 'EXIF Data Present'
            info.software = 'Media Hub EXIF Engine'
            info.dateTime = new Date(file.lastModified).toLocaleString()
          }
          break
        } else if ((marker & 0xff00) !== 0xff00) {
          break
        } else {
          offset += view.getUint16(offset, false)
        }
      }
    }
  } catch (e) {
    console.warn('Exif parsing skipped:', e)
  }

  return info
}

/** Strip EXIF header metadata from image by re-rendering canvas */
export async function stripExif(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to strip EXIF'))
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.95
      )
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Failed to load image for EXIF stripping'))
    img.src = URL.createObjectURL(file)
  })
}
