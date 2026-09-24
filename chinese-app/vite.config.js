import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE_PATH = '/hoc-tieng-trung/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Học Tiếng Trung',
        short_name: 'Học Tiếng Trung',
        description: 'Học từ vựng, phát âm và chữ Hán theo giáo trình HSK',
        theme_color: '#b91c1c',
        background_color: '#fff7ed',
        display: 'standalone',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          hanzi: ['hanzi-writer']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5174
  }
})
