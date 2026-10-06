import { ChevronDown, ExternalLink, RefreshCw, ScanSearch, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AnalysisSection from '../components/AnalysisSection'
import Button from '../components/Button'
import CurrentPageCard from '../components/CurrentPageCard'
import ErrorState, { type ErrorKind } from '../components/ErrorState'
import Header from '../components/Header'
import LimitReached from '../components/LimitReached'
import LoadingState, { type LoadingStep } from '../components/LoadingState'
import PageChecksSection from '../components/PageChecksSection'
import RecommendationList from '../components/RecommendationList'
import ScoreCard from '../components/ScoreCard'
import { WEB_APP_URL } from '../config'
import {
  extractPage,
  getActiveTab,
  hasAllSitesAccess,
  requestAllSitesAccess,
  runAnalysis,
  type ActiveTab,
} from '../services/analysis'
import { ApiError, getDeviceStatus } from '../services/api'
import { getLinkedEmail } from '../services/identity'
import { runPageChecks } from '../services/pageChecks'
import { getSettings, getStoredResult } from '../services/storage'
import type { AnalyzeRequest, DeviceStatus, StoredResult } from '../types/analysis'
import type { PanelEvent } from '../types/messages'
import type { PageContent } from '../types/page'
import { isRestrictedUrl, normalizePageUrl } from '../utils/restrictedUrls'

type Phase = 'idle' | 'reading' | 'analyzing' | 'done'

interface PanelError {
  kind: ErrorKind | 'USAGE_LIMIT'
  message: string
  details?: Record<string, unknown>
}

function toPanelError(err: unknown): PanelError {
  if (err instanceof ApiError) return { kind: err.code, message: err.message, details: err.details }
  return { kind: 'SERVER', message: 'Something unexpected happened. Please try again.' }
}

export default function SidePanel() {
  const [windowId, setWindowId] = useState<number | null>(null)
  const [tab, setTab] = useState<ActiveTab | null>(null)
  const [page, setPage] = useState<PageContent | null>(null)
  const [result, setResult] = useState<StoredResult | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState<LoadingStep>('extract')
  const [error, setError] = useState<PanelError | null>(null)
  const [usage, setUsage] = useState<DeviceStatus | null>(null)
  const [linkedEmail, setLinkedEmailState] = useState<string | null>(null)
  const [allSites, setAllSites] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [targetKeyword, setTargetKeyword] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [template, setTemplate] = useState<AnalyzeRequest['contentTemplate']>('blog')

  // Identifies the tab/URL the panel is currently showing, to drop stale async results.
  const currentKey = useRef<string>('')
  const analyzing = useRef(false)

  const checks = useMemo(() => (page ? runPageChecks(page) : []), [page])

  const refreshUsage = useCallback(() => {
    getDeviceStatus()
      .then(setUsage)
      .catch(() => {})
  }, [])

  const analyze = useCallback(
    async (target: ActiveTab) => {
      if (analyzing.current) return
      analyzing.current = true
      const key = `${target.id}|${normalizePageUrl(target.url || '')}`
      setError(null)
      setPhase('analyzing')
      setStep('extract')
      try {
        // Re-read the page: SPAs and lazy-loaded articles change after first paint.
        const extracted = await extractPage(target.id)
        if (currentKey.current !== key) return
        if (!extracted.ok) {
          setError({ kind: extracted.code, message: extracted.message })
          setPhase('idle')
          return
        }
        setPage(extracted.page)
        setStep('metadata')

        setStep('analyze')
        const stored = await runAnalysis(extracted.page, {
          targetKeyword,
          targetAudience,
          contentTemplate: template,
        })
        if (currentKey.current !== key) return
        setStep('recommend')
        setResult(stored)
        setPhase('done')
      } catch (err) {
        if (currentKey.current !== key) return
        setError(toPanelError(err))
        setPhase(result ? 'done' : 'idle')
      } finally {
        analyzing.current = false
        refreshUsage()
      }
    },
    [targetKeyword, targetAudience, template, refreshUsage, result],
  )

  const loadTab = useCallback(
    async (winId: number, force = false) => {
      const active = await getActiveTab(winId)
      const key = active ? `${active.id}|${normalizePageUrl(active.url || '')}` : ''
      if (!force && key === currentKey.current) {
        setTab(active) // title may have changed
        return
      }
      currentKey.current = key
      setTab(active)
      setPage(null)
      setResult(null)
      setError(null)
      setPhase('idle')

      if (!active) return
      if (!active.url) {
        setError({
          kind: 'NO_PERMISSION',
          message: 'Click the Missive SEO icon in the toolbar while on this page, or allow access on all sites below.',
        })
        return
      }
      if (isRestrictedUrl(active.url)) {
        setError({
          kind: 'RESTRICTED_PAGE',
          message: 'Chrome does not let extensions read browser, settings or Web Store pages. Open a regular web page.',
        })
        return
      }

      setPhase('reading')
      const [extracted, stored, settings] = await Promise.all([
        extractPage(active.id),
        getStoredResult(active.url),
        getSettings(),
      ])
      if (currentKey.current !== key) return

      if (!extracted.ok) {
        setError({ kind: extracted.code, message: extracted.message })
        setPhase('idle')
        return
      }
      setPage(extracted.page)
      if (stored) {
        setResult(stored)
        setPhase('done')
      } else {
        setPhase('idle')
        if (settings.autoAnalyze) void analyze(active)
      }
    },
    [analyze],
  )

  /* Initial load */
  useEffect(() => {
    chrome.windows.getCurrent().then((win) => {
      if (typeof win.id === 'number') setWindowId(win.id)
    })
    hasAllSitesAccess().then(setAllSites)
    getLinkedEmail().then(setLinkedEmailState)
    refreshUsage()
  }, [refreshUsage])

  useEffect(() => {
    if (windowId !== null) void loadTab(windowId, true)
    // loadTab changes identity with the analysis options; only re-run on window change.
  }, [windowId])

  /* Follow the active tab */
  const loadTabRef = useRef(loadTab)
  loadTabRef.current = loadTab
  useEffect(() => {
    if (windowId === null) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const listener = (event: PanelEvent) => {
      if (event?.type === 'ACTIVE_TAB_CHANGED' && event.windowId !== windowId) return
      if (event?.type === 'TAB_UPDATED' && event.tabId !== tab?.id) return
      if (event?.type !== 'ACTIVE_TAB_CHANGED' && event?.type !== 'TAB_UPDATED') return
      clearTimeout(timer)
      timer = setTimeout(() => void loadTabRef.current(windowId), 350)
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      clearTimeout(timer)
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [windowId, tab?.id])

  async function grantAllSites() {
    const granted = await requestAllSitesAccess()
    setAllSites(granted)
    if (granted && windowId !== null) void loadTab(windowId, true)
  }

  const busy = phase === 'reading' || phase === 'analyzing'
  const canAnalyze = Boolean(page && tab && !busy)
  const isLimit = error?.kind === 'USAGE_LIMIT'

  return (
    <div className="min-h-screen pb-6">
      <Header usage={usage} />

      <main className="space-y-3 px-3 pt-3">
        <CurrentPageCard tab={tab} page={page} />

        {phase === 'analyzing' && <LoadingState step={step} />}
        {phase === 'reading' && <p className="px-1 text-xs text-slate-500">Reading page…</p>}

        {isLimit && (
          <LimitReached
            usageCount={Number(error.details?.usageCount) || undefined}
            limit={Number(error.details?.limit) || undefined}
            defaultEmail={linkedEmail}
          />
        )}

        {error && !isLimit && (
          <ErrorState kind={error.kind as ErrorKind} message={error.message}>
            {error.kind === 'NO_PERMISSION' && !allSites && (
              <Button variant="secondary" onClick={grantAllSites}>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Allow on all sites
              </Button>
            )}
            {['OFFLINE', 'NETWORK', 'TIMEOUT', 'SERVER', 'EXTRACTION_FAILED', 'EMPTY_PAGE', 'AUTH_EXPIRED'].includes(error.kind) && (
              <Button
                variant="secondary"
                onClick={() => (page && tab ? void analyze(tab) : windowId !== null && void loadTab(windowId, true))}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Try again
              </Button>
            )}
          </ErrorState>
        )}

        {page && phase !== 'analyzing' && !result && (
          <section className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Button className="w-full" disabled={!canAnalyze} onClick={() => tab && void analyze(tab)}>
              <ScanSearch className="h-4 w-4" aria-hidden />
              Analyze page
            </Button>
            <button
              type="button"
              onClick={() => setShowOptions((v) => !v)}
              aria-expanded={showOptions}
              className="flex w-full items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Analysis options
              <ChevronDown className={`h-3.5 w-3.5 transition ${showOptions ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {showOptions && (
              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                <label className="block text-xs font-medium text-slate-600">
                  Target keyword
                  <input
                    value={targetKeyword}
                    maxLength={100}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    placeholder="e.g. content strategy"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Target audience
                  <input
                    value={targetAudience}
                    maxLength={200}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. B2B marketing leads"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Content type
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as typeof template)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal outline-none focus:border-brand"
                  >
                    <option value="blog">Article / blog post (web app default)</option>
                    <option value="landing_page">Landing / product page</option>
                  </select>
                </label>
              </div>
            )}
            {usage && usage.limit > 0 && (
              <p className="text-center text-[11px] text-slate-400">Each analysis uses one of your free Content QA runs.</p>
            )}
          </section>
        )}

        {result && phase !== 'analyzing' && (
          <>
            <ScoreCard report={result.report} />
            {result.truncated && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This page is longer than the 50,000-character Content QA limit, so the first{' '}
                {result.sentChars.toLocaleString()} characters were analyzed.
              </p>
            )}
            {result.matchesWebImport === false && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                This page is very large, so the extension extracted the text itself. Scores may differ slightly from
                the web app’s “Import from URL”.
              </p>
            )}
            <RecommendationList report={result.report} />
            <AnalysisSection report={result.report} />
          </>
        )}

        {page && phase !== 'analyzing' && <PageChecksSection checks={checks} />}

        {result && phase !== 'analyzing' && (
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!canAnalyze} onClick={() => tab && void analyze(tab)}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Analyze again
            </Button>
            <a
              href={WEB_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Web app
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        )}

        {result && phase === 'done' && (
          <p className="text-center text-[11px] text-slate-400">
            Analyzed {new Date(result.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </main>
    </div>
  )
}
