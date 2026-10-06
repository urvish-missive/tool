import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, build, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildManifest } from './manifest.config'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = 'dist-extension'
const DEFAULT_API_BASE_URL = 'https://toolapi.missive.digital/api'
const CONTENT_ENTRY = resolve(ROOT, 'src/content/contentScript.ts')

/**
 * Emits manifest.json and builds the content script as a separate,
 * self-contained IIFE. Content scripts injected with chrome.scripting cannot
 * be ES modules, so they must not share chunks with the rest of the bundle.
 */
function chromeExtension(apiBaseUrl: string, mode: string): Plugin {
  return {
    name: 'missive-chrome-extension',
    buildStart() {
      this.addWatchFile(CONTENT_ENTRY)
      this.addWatchFile(resolve(ROOT, 'src/utils/pageExtractor.ts'))
      this.addWatchFile(resolve(ROOT, 'src/utils/textCleaner.ts'))
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(buildManifest(apiBaseUrl), null, 2),
      })
    },
    async writeBundle() {
      await build({
        configFile: false,
        root: ROOT,
        mode,
        logLevel: 'warn',
        build: {
          outDir: OUT_DIR,
          emptyOutDir: false,
          minify: mode === 'production',
          sourcemap: false,
          lib: {
            entry: CONTENT_ENTRY,
            formats: ['iife'],
            name: 'MissiveContentScript',
            fileName: () => 'content-script.js',
          },
        },
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, 'VITE_')
  const apiBaseUrl = (env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

  return {
    root: ROOT,
    plugins: [react(), tailwindcss(), chromeExtension(apiBaseUrl, mode)],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
    build: {
      outDir: OUT_DIR,
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      // Emit fonts/images as files rather than data: URIs.
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          'side-panel': resolve(ROOT, 'side-panel.html'),
          options: resolve(ROOT, 'options.html'),
          'service-worker': resolve(ROOT, 'src/background/serviceWorker.ts'),
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === 'service-worker' ? 'service-worker.js' : 'assets/[name]-[hash].js',
          manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
        },
      },
    },
    // `npm run preview` → http://localhost:5180/dev/preview.html: UI harness with mocked chrome.* APIs (dev/ only, never built).
    server: { port: 5180, strictPort: true },
    esbuild: mode === 'production' ? { drop: ['debugger'], pure: ['console.debug'] } : undefined,
  }
})
