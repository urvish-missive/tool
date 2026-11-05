import { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Columns3,
  Copy,
  DatabaseZap,
  Download,
  Braces,
  FileSpreadsheet,
  Layers,
  Lock,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { useFetchPortalDataMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import TablePagination from '../../components/TablePagination'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  buildCombinations,
  findSample,
  mergeResults,
  parseValueList,
  substitute,
} from './bulkSearch'

const TOOL_SLUG = 'portal-data-fetcher'

const LOADING_STEPS = [
  'Parsing your copied API request',
  'Calling the portal API with your session',
  'Following pagination & collecting every page',
  'Detecting the records list in the response',
  'Flattening nested fields into columns',
]

const HOW_TO_STEPS = [
  {
    icon: Lock,
    title: 'Log in to the portal',
    text: 'Open the portal (e.g. bniconnectglobal.com) in Chrome or Edge and go to the page that shows the data you want: member list, search results, a report.',
  },
  {
    icon: Terminal,
    title: 'Open DevTools → Network',
    text: 'Press F12 (Cmd+Option+I on Mac), open the Network tab, choose the "Fetch/XHR" filter, then reload the page or click "next page" / "search".',
  },
  {
    icon: MousePointerClick,
    title: 'Copy as cURL',
    text: 'Click the request that returns your data (its Preview tab shows the records). Right-click it → Copy → "Copy as cURL (bash)" or "(cmd)" and paste it below.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Which portals does this work with?',
    a: 'Any website that loads its data from an API in the browser: BNI Connect, CRMs, LMS and membership portals, admin dashboards, directories and SaaS back offices. If DevTools shows a Fetch/XHR request returning JSON (or an HTML table), the fetcher can pull it.',
  },
  {
    q: 'Is my password or session stored?',
    a: 'No. You never enter your password here. The copied cURL contains your current session cookie or token; it is used only to send the request(s) for this fetch and is not saved to our database or logs. Sessions also expire on their own when you log out of the portal.',
  },
  {
    q: 'How does pagination work?',
    a: 'Turn on "Fetch all pages" and enter the parameter the portal uses for paging (often page, pageNumber, offset, skip or start). The fetcher increases it on each call (in the URL or in a JSON / form body, including nested keys like paging.offset) and stops at an empty page, a repeated page, or your max-pages limit.',
  },
  {
    q: 'It says my session expired or returns 401/403',
    a: 'Portal sessions are short-lived. Refresh the portal page, make sure you are still logged in, copy a fresh cURL, and run the fetch again.',
  },
  {
    q: 'The wrong list was picked from the response',
    a: 'The fetcher picks the largest list of records automatically. Under "Records found" you can click another list, or type a data path such as data.members or result.content and fetch again.',
  },
  {
    q: 'Am I allowed to export this data?',
    a: "Only fetch data your account is allowed to see, and follow the portal's terms of use and privacy rules (for example GDPR) for any personal details such as member contact information.",
  },
]

const STOP_REASONS = {
  'single-request': 'Single request',
  'max-pages': 'Reached max pages',
  'empty-page': 'Last page reached',
  'last-page': 'Last page reached',
  'repeated-page': 'Page repeated (end of data)',
  'no-records': 'No records found',
  'http-error': 'Stopped on an error page',
  'row-limit': 'Row limit reached',
  'time-limit': 'Time limit reached',
  bulk: 'All searches done',
  'bulk-stopped': 'Stopped by you',
}

const inputCls =
  'w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm'

function cellText(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function fileBase(result) {
  const host = (result?.request?.host || 'portal')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9.-]/gi, '_')
  return `${host}-data-${new Date().toISOString().slice(0, 10)}`
}

function downloadBlob(content, type, filename) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function toCsv(rows, columns) {
  const esc = (v) => {
    const s = cellText(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    columns.map(esc).join(','),
    ...rows.map((r) => columns.map((c) => esc(r[c])).join(',')),
  ].join('\r\n')
}

export default function PortalDataFetcherPage() {
  const [mode, setMode] = useState('bulk') // 'bulk' | 'curl' | 'manual'
  const [variables, setVariables] = useState([
    {
      name: 'Keyword',
      sample: '',
      list: 'Telecom\nSoftware\nIT\nAccounting\nWellness\nVoIP',
    },
    { name: 'Country', sample: '', list: 'South Africa\nUnited States\nCanada\nLondon' },
  ])
  const [bulk, setBulk] = useState(null) // { running, done, total, current, log }
  const stopRef = useRef(false)
  const [curl, setCurl] = useState('')
  const [manual, setManual] = useState({ method: 'GET', url: '', headers: '', body: '' })
  const [paginate, setPaginate] = useState(false)
  const [pagination, setPagination] = useState({
    mode: 'page',
    param: 'page',
    start: 1,
    step: 1,
    maxPages: 10,
    location: 'auto',
  })
  const [dataPath, setDataPath] = useState('')
  const [error, setError] = useState('')
  const [errorPreview, setErrorPreview] = useState('')
  const [result, setResult] = useState(null)

  const [search, setSearch] = useState('')
  const [hiddenCols, setHiddenCols] = useState(() => new Set())
  const [showColumns, setShowColumns] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [copied, setCopied] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  const [fetchPortalData, { isLoading }] = useFetchPortalDataMutation()

  const { popupEnabled, showPopup, triggerPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup(TOOL_SLUG)
  const pendingPayloadRef = useRef(null)

  const buildPayload = (overridePath) => {
    const payload = {
      dataPath: (overridePath ?? dataPath).trim(),
      pagination: paginate
        ? {
            mode: pagination.mode,
            param: pagination.param.trim(),
            start: Number(pagination.start),
            step: Number(pagination.step),
            maxPages: Number(pagination.maxPages),
            location: pagination.location,
          }
        : { mode: 'none' },
    }
    if (mode === 'curl' || mode === 'bulk') payload.curl = curl.trim()
    else payload.request = { ...manual, url: manual.url.trim() }
    return payload
  }

  const busy = isLoading || Boolean(bulk?.running)
  const parsedVars = variables.map((v) => ({ ...v, items: parseValueList(v.list) }))
  const combinations = mode === 'bulk' ? buildCombinations(parsedVars) : []

  const validate = () => {
    if (mode === 'bulk') {
      if (!curl.trim()) return 'Paste the cURL of one search you ran on the portal.'
      if (!/^\s*curl(\.exe)?\s/i.test(curl))
        return 'The command should start with "curl". In DevTools use right-click → Copy → Copy as cURL.'
      const active = parsedVars.filter((v) => v.sample.trim())
      if (!active.length)
        return 'Enter the keyword (and country) you searched for in the request you copied.'
      for (const v of active) {
        if (!findSample(curl, v.sample).count)
          return `"${v.sample}" was not found in the copied request. Enter the ${v.name.toLowerCase()} exactly as you searched it (or the code/ID the portal sent).`
        if (!v.items.length) return `Add at least one ${v.name.toLowerCase()} to search.`
      }
      if (combinations.length > 200)
        return `That is ${combinations.length} searches; the maximum is 200. Use fewer values.`
    } else if (mode === 'curl') {
      if (!curl.trim()) return 'Paste the cURL command you copied from DevTools.'
      if (!/^\s*curl(\.exe)?\s/i.test(curl))
        return 'The command should start with "curl". In DevTools use right-click → Copy → Copy as cURL.'
    } else if (!/^https?:\/\//i.test(manual.url.trim())) {
      return 'Enter the full API URL, starting with https://'
    }
    if (paginate && !pagination.param.trim())
      return 'Enter the pagination parameter name (for example page or offset).'
    return ''
  }

  const showResult = (data) => {
    setResult(data)
    setHiddenCols(new Set())
    setSearch('')
    setPage(1)
    setShowRaw(!data.totalRows)
    setTimeout(
      () =>
        document.getElementById('portal-fetcher-results')?.scrollIntoView({ behavior: 'smooth' }),
      150
    )
  }

  const runBulk = async (basePayload, leadId = null) => {
    setError('')
    setErrorPreview('')
    setResult(null)
    stopRef.current = false
    const combos = combinations
    const varNames = parsedVars.filter((v) => v.sample.trim() && v.items.length).map((v) => v.name)
    const log = []
    const batches = []
    let token = null
    let first = null
    let pagesFetched = 0
    let aborted = false
    setBulk({ running: true, done: 0, total: combos.length, current: '', log: [] })

    for (let i = 0; i < combos.length; i++) {
      if (stopRef.current) break
      const combo = combos[i]
      const label = combo.map((c) => c.label).join(' · ')
      setBulk((b) => ({ ...b, current: label }))
      try {
        const data = await fetchPortalData({
          ...basePayload,
          curl: substitute(
            basePayload.curl,
            combo.map((c) => ({ sample: c.sample, value: c.value }))
          ),
          dataPath: basePayload.dataPath || first?.detectedPath || '',
          ...(i === 0 ? { batch: { start: true, total: combos.length }, leadId } : {}),
          ...(token ? { batchToken: token } : {}),
        }).unwrap()
        if (i === 0) token = data.batchToken || null
        first = first || data
        pagesFetched += data.pagesFetched || 0
        batches.push({ combo, rows: data.rows, columns: data.columns })
        log.push({ label, count: data.totalRows, pages: data.pagesFetched })
      } catch (err) {
        const msg = err?.data?.error || err?.error || 'Request failed'
        log.push({ label, count: 0, error: msg })
        // Wrong request format or expired session: every other search would fail too.
        if (i === 0 || /session|401|403|limit/i.test(msg)) {
          aborted = true
          setError(i === 0 ? msg : `Stopped after "${label}": ${msg}`)
          setErrorPreview(err?.data?.rawPreview || '')
        }
      }
      setBulk((b) => ({ ...b, done: i + 1, log: [...log] }))
      if (aborted) break
    }

    setBulk((b) => ({ ...b, running: false }))
    if (!first) return

    const merged = mergeResults(batches, varNames)
    const failed = log.filter((l) => l.error)
    const warnings = [...(first.warnings || [])]
    if (merged.duplicates > 0)
      warnings.push(
        `${merged.duplicates.toLocaleString()} duplicate records found by more than one search were merged${
          merged.idColumn ? ` (matched on "${merged.idColumn}")` : ''
        }.`
      )
    if (failed.length)
      warnings.push(`${failed.length} of ${log.length} searches failed. See the search log.`)

    showResult({
      ...first,
      rows: merged.rows,
      columns: merged.columns,
      totalRows: merged.rows.length,
      pagesFetched,
      stoppedReason: stopRef.current || aborted ? 'bulk-stopped' : 'bulk',
      warnings,
      bulk: { searches: log.length, total: combos.length, log },
    })
  }

  const run = async (payload, leadId = null) => {
    if (mode === 'bulk') return runBulk(payload, leadId)
    setBulk(null)
    setError('')
    setErrorPreview('')
    try {
      const data = await fetchPortalData({ ...payload, leadId }).unwrap()
      showResult(data)
    } catch (err) {
      setError(
        err?.data?.error || err?.error || err?.message || 'Failed to fetch data from the portal.'
      )
      setErrorPreview(err?.data?.rawPreview || '')
    }
  }

  const handleSubmit = (e, overridePath) => {
    e?.preventDefault?.()
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    const payload = buildPayload(overridePath)
    if (popupEnabled) {
      pendingPayloadRef.current = payload
      triggerPopup()
      return
    }
    run(payload)
  }

  const onLeadModalSuccess = (leadId) => {
    handlePopupSubmit(leadId)
    if (pendingPayloadRef.current) {
      run(pendingPayloadRef.current, leadId)
      pendingPayloadRef.current = null
    }
  }

  const pickPath = (path) => {
    setDataPath(path)
    handleSubmit(null, path)
  }

  const handleReset = () => {
    setCurl('')
    setManual({ method: 'GET', url: '', headers: '', body: '' })
    setResult(null)
    setError('')
    setErrorPreview('')
    setDataPath('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Derived table data ──
  const visibleColumns = useMemo(
    () => (result?.columns || []).filter((c) => !hiddenCols.has(c)),
    [result, hiddenCols]
  )

  const filteredRows = useMemo(() => {
    const rows = result?.rows || []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => visibleColumns.some((c) => cellText(r[c]).toLowerCase().includes(q)))
  }, [result, search, visibleColumns])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const toggleCol = (c) =>
    setHiddenCols((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  // ── Exports (current filter + visible columns) ──
  const exportRows = () =>
    filteredRows.map((r) => Object.fromEntries(visibleColumns.map((c) => [c, r[c] ?? ''])))

  const exportXlsx = () => {
    const rows = filteredRows.map((r) =>
      Object.fromEntries(
        visibleColumns.map((c) => [
          c,
          typeof r[c] === 'string' ? r[c].slice(0, 32000) : (r[c] ?? ''),
        ])
      )
    )
    const ws = XLSX.utils.json_to_sheet(rows, { header: visibleColumns })
    ws['!cols'] = visibleColumns.map((c) => ({
      wch: Math.min(
        60,
        Math.max(c.length, ...rows.slice(0, 200).map((r) => cellText(r[c]).length)) + 2
      ),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${fileBase(result)}.xlsx`)
  }

  const exportCsv = () =>
    downloadBlob(
      '﻿' + toCsv(filteredRows, visibleColumns),
      'text/csv;charset=utf-8',
      `${fileBase(result)}.csv`
    )

  const exportJson = () =>
    downloadBlob(
      JSON.stringify(exportRows(), null, 2),
      'application/json',
      `${fileBase(result)}.json`
    )

  const copyTsv = () => {
    const tsv = [
      visibleColumns.join('\t'),
      ...filteredRows.map((r) =>
        visibleColumns.map((c) => cellText(r[c]).replace(/[\t\n]/g, ' ')).join('\t')
      ),
    ].join('\n')
    navigator.clipboard.writeText(tsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={onLeadModalSuccess}
        toolSlug={TOOL_SLUG}
        title="Unlock the Free Portal API Data Fetcher"
        subtitle="Pull records from any portal you are logged into and export them to Excel, CSV or JSON."
      />

      {/* Hero */}
      <section className="relative overflow-hidden !pt-20 sm:!pt-28 lg:!pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Missive's Tools • Missive Digital</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Portal API </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Data Fetcher
            </span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Fetch member lists, reports and records from any portal you are logged into, such as BNI
            Connect, straight from its API. Every page collected automatically, ready for Excel, CSV
            or JSON.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* How to */}
        {!busy && !result && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {HOW_TO_STEPS.map((s, i) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center">
                    <s.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {!busy && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'bulk', label: 'Bulk search (filters)', icon: Layers },
                  { id: 'curl', label: 'Single request', icon: Terminal },
                  { id: 'manual', label: 'Manual request', icon: Code },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMode(t.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      mode === t.id
                        ? 'bg-white text-[#0C81F3] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              {mode === 'bulk' && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">How bulk search works</div>
                  <p>
                    1. On the portal (e.g. BNI Connect → Search Members), run <b>one</b> search
                    yourself, for example keyword <b>Telecom</b> in <b>South Africa</b>.
                  </p>
                  <p>
                    2. In DevTools → Network → Fetch/XHR, copy that search request as cURL and paste
                    it below.
                  </p>
                  <p>
                    3. Type the keyword and country you searched for. The tool finds them in the
                    request and repeats the search for every value in your lists, then merges and
                    de-duplicates the results.
                  </p>
                </div>
              )}

              {mode !== 'manual' ? (
                <div className="space-y-2">
                  <label htmlFor="portal-curl" className="block text-sm font-bold text-slate-800">
                    {mode === 'bulk' ? 'cURL of one search you ran' : 'cURL command'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="portal-curl"
                    rows={7}
                    spellCheck={false}
                    value={curl}
                    onChange={(e) => setCurl(e.target.value)}
                    placeholder={`curl 'https://www.bniconnectglobal.com/web/...' \\\n  -H 'accept: application/json' \\\n  -H 'cookie: JSESSIONID=...' \\\n  --data-raw '{"page":1}'`}
                    className={`${inputCls} font-mono text-xs leading-relaxed`}
                  />
                  <p className="text-xs text-slate-500">
                    Bash and Windows cmd formats from Chrome, Edge and Firefox are supported.
                  </p>
                  {mode === 'bulk' && (
                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                      {variables.map((v, vi) => {
                        const found =
                          v.sample.trim() && curl.trim() ? findSample(curl, v.sample) : null
                        const items = parsedVars[vi].items
                        const update = (patch) =>
                          setVariables((all) =>
                            all.map((x, xi) => (xi === vi ? { ...x, ...patch } : x))
                          )
                        return (
                          <div
                            key={v.name}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                          >
                            <div className="text-sm font-bold text-slate-900">
                              {v.name === 'Keyword' ? 'Industry / keywords' : 'Countries'}
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-slate-600">
                                {v.name} used in the copied search
                              </label>
                              <input
                                value={v.sample}
                                onChange={(e) => update({ sample: e.target.value })}
                                placeholder={
                                  v.name === 'Keyword'
                                    ? 'e.g. Telecom'
                                    : 'e.g. South Africa (or its code/ID)'
                                }
                                className={inputCls}
                              />
                              {found && (
                                <p
                                  className={`text-xs font-semibold ${found.count ? 'text-emerald-600' : 'text-rose-600'}`}
                                >
                                  {found.count
                                    ? `✓ Found ${found.count}× in the request${found.caseInsensitive ? ' (different letter case)' : ''}`
                                    : '✗ Not found in the request. Leave empty to skip this filter.'}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-slate-600">
                                {v.name === 'Keyword' ? 'Keywords' : 'Countries'} to search (one per
                                line)
                              </label>
                              <textarea
                                rows={6}
                                value={v.list}
                                onChange={(e) => update({ list: e.target.value })}
                                className={`${inputCls} font-mono text-xs`}
                              />
                              <p className="text-xs text-slate-500">
                                {items.length} value{items.length === 1 ? '' : 's'}. If the portal
                                sends a code or ID instead of the name, write{' '}
                                <code>Name = code</code>, e.g.{' '}
                                <code>
                                  {v.name === 'Keyword' ? 'Telecom = 1203' : 'United States = US'}
                                </code>
                                .
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div className="md:col-span-2 text-xs text-slate-600">
                        {combinations.length > 0 ? (
                          <>
                            <b>{combinations.length}</b> searches will run (
                            {parsedVars
                              .filter((v) => v.sample.trim() && v.items.length)
                              .map(
                                (v) =>
                                  `${v.items.length} ${v.name === 'Country' ? 'countries' : 'keywords'}`
                              )
                              .join(' × ')}
                            ). Tip: London is a city, so if the portal searches by country use
                            United Kingdom, or copy a search that filters by city.
                          </>
                        ) : (
                          'Fill in the values you searched for to see how many searches will run.'
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      value={manual.method}
                      onChange={(e) => setManual({ ...manual, method: e.target.value })}
                      className={`${inputCls} !w-28 font-semibold`}
                    >
                      {['GET', 'POST', 'PUT', 'PATCH'].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={manual.url}
                      onChange={(e) => setManual({ ...manual, url: e.target.value })}
                      placeholder="https://portal.example.com/api/members?page=1"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">
                        Headers (one per line)
                      </label>
                      <textarea
                        rows={5}
                        spellCheck={false}
                        value={manual.headers}
                        onChange={(e) => setManual({ ...manual, headers: e.target.value })}
                        placeholder={
                          'Cookie: JSESSIONID=...\nAuthorization: Bearer ...\nAccept: application/json'
                        }
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-800">
                        Request body (optional)
                      </label>
                      <textarea
                        rows={5}
                        spellCheck={false}
                        value={manual.body}
                        onChange={(e) => setManual({ ...manual, body: e.target.value })}
                        placeholder={'{"page": 1, "size": 50}'}
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={paginate}
                    onChange={(e) => setPaginate(e.target.checked)}
                    className="w-4 h-4 accent-[#0C81F3]"
                  />
                  <Layers className="w-4 h-4 text-[#0C81F3]" />
                  <span className="text-sm font-bold text-slate-800">Fetch all pages</span>
                  <span className="text-xs text-slate-500">
                    Follow the portal's pagination automatically
                  </span>
                </label>

                {paginate && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600">Type</label>
                      <select
                        value={pagination.mode}
                        onChange={(e) => {
                          const m = e.target.value
                          setPagination({
                            ...pagination,
                            mode: m,
                            param: m === 'offset' ? 'offset' : 'page',
                            start: m === 'offset' ? 0 : 1,
                            step: m === 'offset' ? 50 : 1,
                          })
                        }}
                        className={inputCls}
                      >
                        <option value="page">Page number</option>
                        <option value="offset">Offset / skip</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        Parameter name
                      </label>
                      <input
                        value={pagination.param}
                        onChange={(e) => setPagination({ ...pagination, param: e.target.value })}
                        placeholder="page or paging.offset"
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">Start at</label>
                      <input
                        type="number"
                        value={pagination.start}
                        onChange={(e) => setPagination({ ...pagination, start: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        {pagination.mode === 'offset' ? 'Page size' : 'Increment'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={pagination.step}
                        onChange={(e) => setPagination({ ...pagination, step: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        Max pages (≤ 50)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={pagination.maxPages}
                        onChange={(e) => setPagination({ ...pagination, maxPages: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-5">
                      <label className="block text-xs font-semibold text-slate-600">
                        Parameter location
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'auto', label: 'Auto-detect' },
                          { id: 'query', label: 'URL query string' },
                          { id: 'body', label: 'Request body (JSON / form)' },
                        ].map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setPagination({ ...pagination, location: o.id })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              pagination.location === o.id
                                ? 'bg-[#0C81F3] text-white border-[#0C81F3]'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-[#0C81F3]'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="portal-datapath" className="block text-sm font-bold text-slate-800">
                  Data path{' '}
                  <span className="text-xs font-normal text-slate-500">
                    (optional, auto-detected)
                  </span>
                </label>
                <input
                  id="portal-datapath"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  placeholder="e.g. data.members or result.content"
                  className={`${inputCls} font-mono`}
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {errorPreview && (
                    <pre className="max-h-48 overflow-auto bg-white/70 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap break-all">
                      {errorPreview}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Your session cookie / token is used only for this fetch and is never stored.
                </p>
                <div className="flex gap-3">
                  {result && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      New fetch
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    {mode === 'bulk' && combinations.length
                      ? `Run ${combinations.length} searches`
                      : 'Fetch data'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {bulk?.running && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-8 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-900">
                  Searching {bulk.done + 1 > bulk.total ? bulk.total : bulk.done + 1} of{' '}
                  {bulk.total}
                </div>
                <div className="text-sm text-slate-600">{bulk.current}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopRef.current = true
                }}
                className="px-4 py-2 rounded-xl border border-rose-300 text-rose-600 text-sm font-semibold hover:bg-rose-50"
              >
                Stop &amp; show results
              </button>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] transition-all"
                style={{ width: `${Math.round((bulk.done / Math.max(1, bulk.total)) * 100)}%` }}
              />
            </div>
            <div className="max-h-56 overflow-auto text-xs divide-y divide-slate-100">
              {bulk.log.map((l) => (
                <div key={l.label} className="flex justify-between py-1.5">
                  <span className="text-slate-700">{l.label}</span>
                  <span className={l.error ? 'text-rose-600' : 'text-emerald-600 font-semibold'}>
                    {l.error ? l.error : `${l.count.toLocaleString()} records`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && !bulk?.running && (
          <div className="mb-8">
            <UnifiedToolLoader
              steps={LOADING_STEPS}
              currentStep={1}
              title="Fetching Data from the Portal API"
              subtitle="Large lists with many pages can take up to a minute."
            />
          </div>
        )}

        {/* Results */}
        {result && !busy && (
          <div id="portal-fetcher-results" className="space-y-6 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Records', value: result.totalRows.toLocaleString() },
                { label: 'Columns', value: result.columns.length },
                result.bulk
                  ? {
                      label: 'Searches run',
                      value: `${result.bulk.searches} / ${result.bulk.total}`,
                    }
                  : { label: 'Pages fetched', value: result.pagesFetched },
                {
                  label: 'Finished because',
                  value: STOP_REASONS[result.stoppedReason] || result.stoppedReason,
                  small: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {s.label}
                  </div>
                  <div
                    className={`mt-1 font-bold text-slate-900 ${s.small ? 'text-sm' : 'text-2xl'}`}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <b className="text-slate-800">{result.request?.method}</b> {result.request?.host}
                {result.request?.path}
              </span>
              <span>
                HTTP <b className="text-slate-800">{result.status}</b> ·{' '}
                {result.contentType || 'unknown type'}
              </span>
              <span>{(result.durationMs / 1000).toFixed(1)} s</span>
            </div>

            {result.warnings?.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-1">
                {result.warnings.map((w) => (
                  <div key={w} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {result.bulk && (
              <details className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <summary className="text-sm font-bold text-slate-800 cursor-pointer">
                  Search log ({result.bulk.log.length} searches)
                </summary>
                <div className="mt-3 max-h-72 overflow-auto text-xs divide-y divide-slate-100">
                  {result.bulk.log.map((l) => (
                    <div key={l.label} className="flex justify-between gap-4 py-1.5">
                      <span className="text-slate-700">{l.label}</span>
                      <span className={l.error ? 'text-rose-600' : 'text-slate-600'}>
                        {l.error
                          ? l.error
                          : `${l.count.toLocaleString()} records · ${l.pages} page${l.pages === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {result.candidates?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <DatabaseZap className="w-4 h-4 text-[#0C81F3]" />
                  Records found in the response
                  <span className="text-xs font-normal text-slate-500">
                    Click a list to use it instead
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.candidates.map((c) => (
                    <button
                      key={c.path || '(root)'}
                      type="button"
                      onClick={() => pickPath(c.path)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        c.path === result.detectedPath
                          ? 'bg-[#0C81F3] text-white border-[#0C81F3]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-[#0C81F3]'
                      }`}
                    >
                      {c.path || '(root)'} · {c.count}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result.totalRows > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between border-b border-slate-200">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder={`Search ${result.totalRows.toLocaleString()} records…`}
                      className={`${inputCls} !py-2 pl-9`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowColumns((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Columns3 className="w-4 h-4" />
                      Columns ({visibleColumns.length}/{result.columns.length})
                    </button>
                    <button
                      type="button"
                      onClick={copyTsv}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={exportJson}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Braces className="w-4 h-4" />
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={exportXlsx}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download Excel
                    </button>
                  </div>
                </div>

                {showColumns && (
                  <div className="p-4 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex gap-3 mb-3 text-xs">
                      <button
                        type="button"
                        className="font-semibold text-[#0C81F3]"
                        onClick={() => setHiddenCols(new Set())}
                      >
                        Show all
                      </button>
                      <button
                        type="button"
                        className="font-semibold text-slate-500"
                        onClick={() => setHiddenCols(new Set(result.columns))}
                      >
                        Hide all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-auto">
                      {result.columns.map((c) => (
                        <label
                          key={c}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono cursor-pointer ${
                            hiddenCols.has(c)
                              ? 'bg-white text-slate-400 border-slate-200'
                              : 'bg-blue-50 text-slate-800 border-blue-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenCols.has(c)}
                            onChange={() => toggleCol(c)}
                            className="accent-[#0C81F3]"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-auto max-h-[640px]">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-slate-500">#</th>
                        {visibleColumns.map((c) => (
                          <th
                            key={c}
                            className="px-3 py-2 text-left font-bold text-slate-700 whitespace-nowrap"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageRows.map((row, i) => (
                        <tr key={(page - 1) * pageSize + i} className="hover:bg-blue-50/40">
                          <td className="px-3 py-2 text-slate-400">
                            {(page - 1) * pageSize + i + 1}
                          </td>
                          {visibleColumns.map((c) => (
                            <td
                              key={c}
                              className="px-3 py-2 text-slate-800 max-w-xs truncate"
                              title={cellText(row[c])}
                            >
                              {cellText(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {!pageRows.length && (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 1}
                            className="px-3 py-8 text-center text-slate-500"
                          >
                            No records match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-slate-200">
                  <TablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredRows.length}
                    pageSize={pageSize}
                    pageSizeOptions={[25, 50, 100, 250]}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                      setPageSize(s)
                      setPage(1)
                    }}
                    itemLabel="records"
                  />
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#0C81F3]" />
                  Raw response (first page)
                </span>
                {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRaw && (
                <pre className="mx-4 mb-4 max-h-96 overflow-auto bg-slate-900 text-slate-100 rounded-xl p-4 text-xs whitespace-pre-wrap break-all">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(result.rawPreview), null, 2)
                    } catch {
                      return result.rawPreview || '(empty response)'
                    }
                  })()}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          <div className="divide-y divide-slate-200">
            {FAQ_ITEMS.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-slate-800"
                >
                  {f.q}
                  {expandedFaq === i ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <p className="pb-4 text-sm text-slate-600 leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
