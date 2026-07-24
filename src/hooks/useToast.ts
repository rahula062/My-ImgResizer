let toastContainer: HTMLDivElement | null = null

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export type ToastType = 'success' | 'error' | 'info'

export function toast(msg: string, type: ToastType = 'info', dur = 3500) {
  const container = ensureContainer()
  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`
  container.appendChild(el)
  setTimeout(() => {
    el.style.animation = 'slideOut .3s ease forwards'
    setTimeout(() => el.remove(), 300)
  }, dur)
}