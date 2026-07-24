import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set PDF.js worker URL from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/** Convert array of image files to a single merged PDF Blob */
export async function imagesToPdf(
  imageFiles: File[],
  pageSize: 'a4' | 'letter' | 'fit' = 'a4',
  orientation: 'portrait' | 'landscape' | 'auto' = 'auto',
  marginPx = 20
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()

  for (const file of imageFiles) {
    const arrayBuffer = await file.arrayBuffer()
    let image
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer)
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer)
    }

    const { width: imgW, height: imgH } = image.scale(1)

    let pageW = imgW + marginPx * 2
    let pageH = imgH + marginPx * 2

    if (pageSize === 'a4') {
      pageW = 595.28 // A4 width in points
      pageH = 841.89 // A4 height in points
    } else if (pageSize === 'letter') {
      pageW = 612.0
      pageH = 792.0
    }

    if (orientation === 'landscape' && pageW < pageH) {
      const tmp = pageW
      pageW = pageH
      pageH = tmp
    } else if (orientation === 'portrait' && pageW > pageH) {
      const tmp = pageW
      pageW = pageH
      pageH = tmp
    }

    const page = pdfDoc.addPage([pageW, pageH])
    const maxW = pageW - marginPx * 2
    const maxH = pageH - marginPx * 2

    const scale = Math.min(maxW / imgW, maxH / imgH, 1)
    const drawW = imgW * scale
    const drawH = imgH * scale

    const x = (pageW - drawW) / 2
    const y = (pageH - drawH) / 2

    page.drawImage(image, {
      x,
      y,
      width: drawW,
      height: drawH,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/** Merge multiple PDF files into one PDF Blob */
export async function mergePdfs(pdfFiles: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create()

  for (const file of pdfFiles) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  const pdfBytes = await mergedPdf.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/** Convert PDF file pages into Image Blobs (PNG/JPG) */
export async function pdfToImages(
  pdfFile: File,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  onProgress?: (current: number, total: number) => void
): Promise<{ pageIndex: number; blob: Blob }[]> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const totalPages = pdf.numPages
  const results: { pageIndex: number; blob: Blob }[] = []

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 }) // 2x scale for high resolution
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject('Failed to render PDF page')), format, 0.92)
      })
      results.push({ pageIndex: i, blob })
    }

    if (onProgress) onProgress(i, totalPages)
  }

  return results
}

/** Compress PDF by re-saving document structure without extra metadata */
export async function compressPdf(pdfFile: File): Promise<Blob> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  
  // Remove unnecessary catalog objects and re-save
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
