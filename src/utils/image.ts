export function formatBytes(b: number): string {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i)) {
      reject(new Error('Selected file is not a supported image format'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from URL'));
    img.src = url;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas conversion failed'));
      },
      type,
      quality
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function drawImageToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return ctx;
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
  };
  return map[mimeType] || 'jpg';
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Rotate and Flip image onto canvas with updated bounding box */
export function rotateAndFlip(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  angleDegrees: number,
  flipH: boolean,
  flipV: boolean
) {
  const rad = (angleDegrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  const newW = Math.round(origW * cos + origH * sin);
  const newH = Math.round(origW * sin + origH * cos);

  canvas.width = newW;
  canvas.height = newH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, newW, newH);
  ctx.save();
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
  ctx.restore();
}

/** Apply custom image filters using CSS filter strings or manual canvas context filters */
export interface FilterSettings {
  brightness: number; // 0..200 (100 normal)
  contrast: number;   // 0..200 (100 normal)
  saturation: number; // 0..200 (100 normal)
  blur: number;       // 0..20 (0 normal)
  grayscale: number;  // 0..100 (0 normal)
  sepia: number;      // 0..100 (0 normal)
  invert: number;     // 0..100 (0 normal)
  hueRotate: number;  // 0..360 (0 normal)
}

export function applyFiltersToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  filters: FilterSettings
) {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const filterStr = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    blur(${filters.blur}px)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
    invert(${filters.invert}%)
    hue-rotate(${filters.hueRotate}deg)
  `.trim();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = filterStr;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';
}

/** Draw rounded corners onto canvas */
export function drawRoundedCorners(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  radiusPx: number,
  isCircle: boolean,
  bgColor: string
) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.beginPath();
  if (isCircle) {
    const minDim = Math.min(w, h);
    ctx.arc(w / 2, h / 2, minDim / 2, 0, Math.PI * 2);
  } else {
    const r = Math.min(radiusPx, w / 2, h / 2);
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
  }
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, 0, 0, w, h);
}

/** Remove background color with tolerance */
export function removeBackgroundColor(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  targetRgb: [number, number, number],
  tolerance: number
) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const [tr, tg, tb] = targetRgb;
  const tolSq = tolerance * tolerance * 3;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distSq = (r - tr) * (r - tr) + (g - tg) * (g - tg) + (b - tb) * (b - tb);
    if (distSq <= tolSq) {
      data[i + 3] = 0; // set alpha to transparent
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/** Boost image size to exact KB target safely */
export async function boostImageKb(blob: Blob, targetKb: number): Promise<Blob> {
  const currentBytes = blob.size;
  const targetBytes = targetKb * 1024;

  if (currentBytes >= targetBytes) {
    return blob; // Already large enough
  }

  // Create padding byte buffer
  const neededPadding = targetBytes - currentBytes;
  const buffer = await blob.arrayBuffer();
  
  // Appending null bytes at end of file (Browsers ignore trailer padding safely)
  const paddedBuffer = new Uint8Array(buffer.byteLength + neededPadding);
  paddedBuffer.set(new Uint8Array(buffer), 0);
  return new Blob([paddedBuffer.buffer as ArrayBuffer], { type: blob.type });
}