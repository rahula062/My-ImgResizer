import { useState } from 'react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export type { SidebarProps }

interface NavItem {
  id: string
  label: string
  emoji: string
  section: string
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', emoji: '🏠', section: 'Main' },
  { id: 'resize', label: 'Resize Image', emoji: '↔️', section: 'Image Tools' },
  { id: 'crop', label: 'Crop Image', emoji: '✂️', section: 'Image Tools', badge: 'HOT' },
  { id: 'compress', label: 'Compress Image', emoji: '📦', section: 'Image Tools' },
  { id: 'convert', label: 'Convert Format', emoji: '🔄', section: 'Image Tools' },
  { id: 'passport', label: 'Passport Photo', emoji: '🪪', section: 'Image Tools' },
  { id: 'increase-kb', label: 'Increase Size (KB)', emoji: '📈', section: 'Image Tools' },
  { id: 'remove-bg', label: 'Remove Background', emoji: '🪄', section: 'Image Tools' },
  { id: 'enhance', label: 'Enhance Quality', emoji: '✨', section: 'Image Tools' },
  { id: 'watermark', label: 'Watermark', emoji: '💧', section: 'New Tools' },
  { id: 'rotate', label: 'Rotate & Flip', emoji: '🔄', section: 'New Tools' },
  { id: 'filters', label: 'Filters', emoji: '🎨', section: 'New Tools' },
  { id: 'round-corners', label: 'Round Corners', emoji: '💎', section: 'New Tools' },
  { id: 'text-overlay', label: 'Text Overlay', emoji: '📝', section: 'New Tools' },
  { id: 'images-to-pdf', label: 'Images to PDF', emoji: '📄', section: 'PDF Tools' },
  { id: 'merge-pdf', label: 'Merge PDFs', emoji: '🗂️', section: 'PDF Tools' },
  { id: 'pdf-to-img', label: 'PDF to Images', emoji: '🖼️', section: 'PDF Tools' },
  { id: 'compress-pdf', label: 'Compress PDF', emoji: '🗜️', section: 'PDF Tools' },
  { id: 'exif-viewer', label: 'EXIF Viewer', emoji: '📊', section: 'Advanced' },
  { id: 'batch-process', label: 'Batch Process', emoji: '⚡', section: 'Advanced' },
]

export default function Sidebar({ currentPage, onNavigate, isOpen: propIsOpen, onClose }: SidebarProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false)
  const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen

  const handleClose = () => {
    if (onClose) onClose()
    setLocalIsOpen(false)
  }

  const handleNavigate = (pageId: string) => {
    onNavigate(pageId)
    handleClose()
  }

  const sections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <nav
        id="sidebar"
        className={`fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col z-[100] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-text">
            PIXEL<span className="text-cyan">CRAFT</span>
          </div>
          <div className="logo-sub">Image & PDF Studio</div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {items.map((item) => {
                const isActive = currentPage === item.id
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <span className="icon">{item.emoji}</span>
                    <span className="label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          v2.0 · Client-Side · No Upload
        </div>
      </nav>
    </>
  )
}