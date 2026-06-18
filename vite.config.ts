import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 → bundle everything into one self-contained dist/index.html
const singleFile = process.env.SINGLEFILE === '1'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(singleFile ? [viteSingleFile()] : []),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
