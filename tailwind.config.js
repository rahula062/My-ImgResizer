/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: 'var(--bg-deep)',
        dark: 'var(--bg-dark)',
        card: 'var(--bg-card)',
        card2: 'var(--bg-card2)',
        border: 'var(--border)',
        'border-glow': 'var(--border-glow)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        accent3: 'var(--accent3)',
        'accent-dim': 'var(--accent-dim)',
        cyan: 'var(--cyan)',
        'cyan-dim': 'var(--cyan-dim)',
        pink: 'var(--pink)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        'text-muted': 'var(--text-muted)',
        success: 'var(--success)',
        error: 'var(--error)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}