/**
 * Generates manifest.json at build time so the API host permission always
 * matches VITE_API_BASE_URL (no hand-edited host lists drifting out of sync).
 */
import pkg from './package.json'

export function buildManifest(apiBaseUrl: string): chrome.runtime.ManifestV3 {
  const apiOrigin = new URL(apiBaseUrl).origin

  return {
    manifest_version: 3,
    name: 'Missive SEO Content QA',
    short_name: 'Missive QA',
    version: pkg.version,
    description:
      'Run Missive SEO Content QA on the page you are reading: 12-pillar editorial score, AI recommendations and on-page SEO checks.',
    minimum_chrome_version: '116',
    icons: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    action: {
      default_title: 'Analyze with Missive SEO',
      default_icon: {
        16: 'icons/icon16.png',
        32: 'icons/icon32.png',
      },
    },
    side_panel: {
      default_path: 'side-panel.html',
    },
    options_page: 'options.html',
    background: {
      service_worker: 'service-worker.js',
      type: 'module',
    },
    // activeTab + scripting: read a page only after the user clicks the
    // extension. No content script is injected into every site.
    permissions: ['activeTab', 'scripting', 'sidePanel', 'storage'],
    // Only the existing Missive API backend.
    host_permissions: [`${apiOrigin}/*`],
    // Opt-in from the Options page so "Analyze again" keeps working after the
    // user switches tabs. Never requested at install time.
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    commands: {
      _execute_action: {
        suggested_key: { default: 'Alt+Shift+M' },
        description: 'Open Missive SEO Content QA',
      },
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  }
}
