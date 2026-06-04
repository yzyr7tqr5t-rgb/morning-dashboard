import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// @vitejs/plugin-react v6 uses Vite 8's OXC compiler, which vitest v3 does not
// support (vitest v3 targets Vite ≤7). Without the plugin, esbuild handles JSX
// and must be told explicitly to use the React 17+ automatic runtime.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
