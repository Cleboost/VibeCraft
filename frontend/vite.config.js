import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vibecraft/api': path.resolve(__dirname, 'src/utils/VideoGenerator.js')
    }
  },
  build: {
    rollupOptions: {
      external: ['@vibecraft/api']
    }
  }
})
