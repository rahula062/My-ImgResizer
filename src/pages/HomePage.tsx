interface Tool {
  id: string
  icon: string
  name: string
  desc: string
  badge?: string
  badgeColor?: 'purple' | 'cyan'
}

const tools: Tool[] = [
  { id: 'resize', icon: '↔️', name: 'Resize Image', desc: 'Set exact pixel dimensions with aspect ratio lock', badge: 'Canvas API', badgeColor: 'purple' },
  { id: 'crop', icon: '✂️', name: 'Crop Image', desc: 'Free, fixed ratios, or pad-to-ratio with custom colors', badge: 'Featured', badgeColor: 'cyan' },
  { id: 'compress', icon: '📦', name: 'Compress Image', desc: 'Quality slider with live size comparison', badge: 'JPG/PNG/WEBP', badgeColor: 'purple' },
  { id: 'convert', icon: '🔄', name: 'Convert Format', desc: 'Convert between JPG, PNG, WEBP, BMP, GIF', badge: '5 Formats', badgeColor: 'purple' },
  { id: 'passport', icon: '🪪', name: 'Passport Photo', desc: 'Auto-resize to country-specific passport dimensions', badge: '10+ Countries', badgeColor: 'cyan' },
  { id: 'increase-kb', icon: '📈', name: 'Increase Size (KB)', desc: 'Boost image file size to a target KB', badge: 'Target KB', badgeColor: 'purple' },
  { id: 'remove-bg', icon: '🪄', name: 'Remove Background', desc: 'Canvas-based background removal with tolerance control', badge: 'No API Key', badgeColor: 'cyan' },
  { id: 'enhance', icon: '✨', name: 'Enhance Quality', desc: 'Sharpen and upscale low-quality images', badge: 'Filter Engine', badgeColor: 'purple' },
  { id: 'watermark', icon: '💧', name: 'Image Watermark', desc: 'Add text or image watermark with opacity control', badge: 'New', badgeColor: 'cyan' },
  { id: 'rotate', icon: '🔄', name: 'Rotate & Flip', desc: 'Rotate 90°/180°/270° and flip horizontally/vertically', badge: 'New', badgeColor: 'cyan' },
  { id: 'filters', icon: '🎨', name: 'Image Filters', desc: 'Grayscale, sepia, blur, brightness, contrast, saturation', badge: 'New', badgeColor: 'purple' },
  { id: 'round-corners', icon: '💎', name: 'Round Corners', desc: 'Adjustable corner radius for modern image look', badge: 'New', badgeColor: 'purple' },
  { id: 'text-overlay', icon: '📝', name: 'Text Overlay', desc: 'Add custom text with fonts, colors, and positioning', badge: 'New', badgeColor: 'cyan' },
  { id: 'images-to-pdf', icon: '📄', name: 'Images to PDF', desc: 'Convert multiple images into a single PDF', badge: 'New', badgeColor: 'purple' },
  { id: 'merge-pdf', icon: '🗂️', name: 'Merge PDFs', desc: 'Drag to reorder and merge multiple PDFs', badge: 'pdf-lib', badgeColor: 'cyan' },
  { id: 'pdf-to-img', icon: '🖼️', name: 'PDF to Images', desc: 'Convert each PDF page to JPG/PNG images', badge: 'pdf.js + ZIP', badgeColor: 'cyan' },
  { id: 'compress-pdf', icon: '🗜️', name: 'Compress PDF', desc: 'Reduce PDF file size by removing metadata', badge: 'pdf-lib', badgeColor: 'purple' },
  { id: 'exif-viewer', icon: '📊', name: 'EXIF Viewer', desc: 'View image metadata and EXIF data', badge: 'New', badgeColor: 'cyan' },
  { id: 'batch-process', icon: '⚡', name: 'Batch Process', desc: 'Process multiple images at once', badge: 'New', badgeColor: 'purple' },
]

interface HomePageProps {
  onNavigate: (page: string) => void
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-grid-bg" />
        <h1>
          MEDIA
          <br />
          HUB
        </h1>
        <p className="hero-sub">
          Professional image & PDF tools — all in your browser. No uploads, no servers, no limits.
        </p>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">19</div>
            <div className="stat-lbl">Tools</div>
          </div>
          <div className="stat">
            <div className="stat-num">∞</div>
            <div className="stat-lbl">Files</div>
          </div>
          <div className="stat">
            <div className="stat-num">0</div>
            <div className="stat-lbl">Uploads</div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="section-header">
        <h2>
          <span className="icon">⚡</span> All Tools
        </h2>
        <p>Click any tool below to get started</p>
      </div>
      <div className="features-grid">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="feature-card"
            onClick={() => onNavigate(tool.id)}
          >
            <span className="fc-icon">{tool.icon}</span>
            <div className="fc-name">{tool.name}</div>
            <div className="fc-desc">{tool.desc}</div>
            {tool.badge && (
              <span
                className={`fc-badge ${
                  tool.badgeColor === 'cyan' ? 'badge-cyan' : 'badge-purple'
                }`}
              >
                {tool.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}