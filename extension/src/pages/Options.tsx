import { useEffect, useState, type ReactNode } from 'react'
import Button from '../components/Button'
import { API_BASE_URL, WEB_APP_URL } from '../config'
import { hasAllSitesAccess, requestAllSitesAccess } from '../services/analysis'
import { getDeviceId, getLinkedEmail } from '../services/identity'
import { clearCachedResults, getSettings, saveSettings, type Settings } from '../services/storage'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-slate-600">{children}</div>
    </section>
  )
}

export default function Options() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [allSites, setAllSites] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
    hasAllSitesAccess().then(setAllSites)
    getDeviceId().then(setDeviceId)
    getLinkedEmail().then(setEmail)
  }, [])

  async function toggleAllSites() {
    if (allSites) {
      await chrome.permissions.remove({ origins: ['http://*/*', 'https://*/*'] })
      setAllSites(false)
    } else {
      setAllSites(await requestAllSitesAccess())
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <header className="flex items-center gap-3">
        <img src="/icons/icon48.png" alt="" className="h-10 w-10" />
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Missive SEO Content QA</h1>
          <p className="text-sm text-slate-500">Extension settings</p>
        </div>
      </header>

      <Card title="Analysis">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#0c81f3]"
            checked={settings?.autoAnalyze ?? false}
            disabled={!settings}
            onChange={async (e) => setSettings(await saveSettings({ autoAnalyze: e.target.checked }))}
          />
          <span>
            <span className="font-medium text-slate-800">Analyze automatically when the panel opens</span>
            <br />
            Each automatic run uses one of your free Content QA analyses. Off by default.
          </span>
        </label>
      </Card>

      <Card title="Site access">
        <p>
          By default the extension can only read a page after you click its toolbar icon on that page (Chrome’s
          “activeTab” permission). Allowing access on all sites lets the side panel follow you as you switch tabs. The
          extension still only reads a page when the side panel is open.
        </p>
        <Button variant={allSites ? 'secondary' : 'primary'} onClick={toggleAllSites}>
          {allSites ? 'Remove access to all sites' : 'Allow on all sites'}
        </Button>
      </Card>

      <Card title="Privacy">
        <p>When you click Analyze, the extension sends the following from the current page to the Missive SEO API:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>the main article text (up to 50,000 characters), title and meta description;</li>
          <li>the page path, plus the optional keyword and audience you enter;</li>
          <li>a random device ID used for the free-usage limit.</li>
        </ul>
        <p>
          On-page SEO checks (links, images, Open Graph, structured data) run locally and are not sent. Nothing is read
          or sent until you open the side panel. AI providers are called only by the Missive server; no AI keys are in
          the extension.
        </p>
        <p className="text-xs text-slate-400">API: {API_BASE_URL}</p>
      </Card>

      <Card title="This device">
        <p>
          Device ID: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{deviceId || '…'}</code>
        </p>
        {email && <p>Linked email: {email}</p>}
        <p className="text-xs text-slate-500">Share the device ID with Missive support if you need your limit adjusted.</p>
        <Button
          variant="secondary"
          onClick={async () => {
            await clearCachedResults()
            setCleared(true)
          }}
        >
          {cleared ? 'Cached reports cleared' : 'Clear cached reports'}
        </Button>
      </Card>

      <p className="text-center text-xs text-slate-400">
        <a href={WEB_APP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
          Missive SEO tools
        </a>
      </p>
    </div>
  )
}
