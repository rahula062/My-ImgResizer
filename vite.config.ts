import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    worker: {
      format: 'es'
    },
    build: {
      target: env.VITE_BUILD_TARGET || 'esnext',
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'pdf': ['pdf-lib', 'pdfjs-dist'],
            'utils': ['jszip']
          }
        }
      }
    },
    server: {
      port: 5173,
      host: true
    }
  }
})