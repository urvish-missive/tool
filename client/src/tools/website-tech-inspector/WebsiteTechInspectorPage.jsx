import { useState, useMemo } from 'react'
import { useInspectWebsiteTechMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  Globe,
  Sparkles,
  Zap,
  RefreshCw,
  AlertCircle,
  Palette,
  Cpu,
  Type,
  Code,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Server,
} from 'lucide-react'

const LOADING_STEPS = [
  'Connecting to website & resolving DNS securely',
  'Scanning meta tags, CSS variables & color palettes',
  'Analyzing technology signatures, CMS & framework fingerprints',
  'Extracting Google Fonts, weights & typography rules',
  'Synthesizing design system tokens & contrast ratings',
]

const FAQ_ITEMS = [
  {
    q: 'How does the Website Tech & Theme Inspector work?',
    a: 'Our inspector securely fetches the target website, analyzes the DOM and HTTP headers, scans for CSS variables (:root), stylesheet color definitions, Google Fonts link/import tags, and compares framework signatures against thousands of known software patterns.',
  },
  {
    q: 'How are theme colors detected?',
    a: 'The tool checks the <meta name="theme-color"> tag, CSS root variables (like --primary or --brand), SVG fill/stroke codes, and computed color frequencies across stylesheets to identify primary, secondary, and accent colors.',
  },
  {
    q: 'Can I export the extracted colors into my own project?',
    a: 'Yes! The tool automatically generates ready-to-use CSS Variables (:root { --brand-primary: ... }) and Tailwind CSS color configuration snippets that you can copy with one click.',
  },
  {
    q: 'Can I preview the extracted Google Fonts live?',
    a: 'Yes! When Google Fonts are detected, the tool dynamically injects the stylesheet so you can test and type custom preview text live in the actual typography of the target website.',
  },
  {
    q: 'What technologies can be detected?',
    a: 'The inspector detects popular CMS platforms (WordPress, Shopify, Webflow, Wix), JavaScript frameworks (Next.js, React, Vue, Nuxt, Angular), CSS systems (Tailwind CSS, Bootstrap), analytics platforms (GA4, GTM, Meta Pixel), and hosting infrastructure (Cloudflare, Vercel, Netlify, Nginx).',
  },
]

export default function WebsiteTechInspectorPage() {
  const [url, setUrl] = useState('')
  const [codeSnippetTab, setCodeSnippetTab] = useState('css') // 'css' | 'tailwind'
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog 12345')
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [error, setError] = useState('')

  // API Mutation
  const [inspectWebsite, { isLoading }] = useInspectWebsiteTechMutation()
  const [results, setResults] = useState(null)

  // Lead Popup Integration
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('website-tech-inspector')
  const [pendingPayload, setPendingPayload] = useState(null)

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Handle Form Submission
  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!url.trim()) {
      setError('Please enter a website URL.')
      return
    }

    setError('')
    const payload = { url: url.trim() }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
      return
    }

    executeInspection(payload)
  }

  const executeInspection = async (payload, leadId = null) => {
    try {
      const data = await inspectWebsite({
        ...payload,
        leadId,
      }).unwrap()

      setResults(data)

      setTimeout(() => {
        document.getElementById('tech-inspector-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to inspect website. Please check the URL.')
    }
  }

  const onLeadModalSuccess = (leadId) => {
    if (pendingPayload) {
      executeInspection(pendingPayload, leadId)
      setPendingPayload(null)
    }
  }

  const handleReset = () => {
    setUrl('')
    setResults(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Dynamic Font Loader for Live Preview */}
      {results?.fonts?.map(
        (f, idx) =>
          f.url && <link key={idx} rel="stylesheet" href={f.url} crossOrigin="anonymous" />
      )}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmitSuccess={onLeadModalSuccess}
        toolSlug="website-tech-inspector"
        title="Unlock Free Website Tech & Theme Inspector"
        subtitle="Extract brand colors, detect tech stack & CMS, and inspect Google Fonts from any website."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Himani's SEO Tools • Missive Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Website Tech & </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Theme Inspector
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover any website's complete color palette, technology stack, CMS, and Google Font typography in a compact, space-efficient dashboard.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-8 transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="tech-inspector-url-input" className="block text-sm font-bold text-slate-800">
                Website URL to Inspect <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  id="tech-inspector-url-input"
                  type="text"
                  placeholder="https://example.com or any website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm sm:text-base font-medium"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-24 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (text) setUrl(text.trim())
                    } catch {}
                  }}
                  className="absolute right-3 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Extracts theme colors, CMS, frontend frameworks, Google Fonts & design tokens</span>
              </div>

              <div className="flex items-center gap-3">
                {results && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                      <span>Inspecting Website...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Inspect Website</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error display */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Inspection Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Loader Progress */}
        {isLoading && (
          <div className="py-8">
            <UnifiedToolLoader
              steps={LOADING_STEPS}
              currentStep={2}
              title="Inspecting Colors, Technology Stack & Fonts"
            />
          </div>
        )}

        {/* Space-Utilized Results Dashboard */}
        {results && !isLoading && (
          <div id="tech-inspector-results" className="space-y-6 pt-1">
            {/* Top Quick Overview Banner */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {results.favicon ? (
                  <img
                    src={results.favicon}
                    alt="favicon"
                    className="w-9 h-9 rounded-xl p-1 border border-slate-200 bg-white object-contain shadow-2xs shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0C81F3] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                    {results.hostname?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {results.pageTitle || results.hostname}
                    </h2>
                    <a
                      href={results.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#0C81F3] transition-colors shrink-0"
                      title="Open website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 font-mono truncate">{results.websiteUrl}</p>
                </div>
              </div>

              {/* Top Meta Stats Pills */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: results.colors?.primary }}
                  />
                  <span className="font-mono font-bold text-slate-800">{results.colors?.primary}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0C81F3] text-xs font-bold">
                  {results.colors?.palette?.length || 0} Colors
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {results.tech?.totalDetected || 0} Tech Stack
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                  {results.fonts?.length || 0} Fonts
                </span>
              </div>
            </div>

            {/* ROW 1: 2-COLUMN GRID (THEME COLORS & TECH STACK SIDE-BY-SIDE) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* CARD 1: THEME COLORS & PALETTE (COMPACT) */}
              <div id="card-colors" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 text-[#0C81F3]">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Theme Colors & Palette</h3>
                        <p className="text-[11px] text-slate-500">CSS root variables & computed brand shades</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {results.colors?.palette?.length || 0} shades
                    </span>
                  </div>

                  {/* Brand 3-Pillar Compact Swatch Row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Primary */}
                    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase text-slate-500 truncate">Primary</div>
                      <div
                        className="h-10 rounded-lg shadow-inner flex items-end p-1.5 cursor-pointer group"
                        style={{ backgroundColor: results.colors?.primary }}
                        onClick={() => handleCopy(results.colors?.primary, 'primary-hex')}
                        title="Click to copy"
                      >
                        <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/40 text-white truncate">
                          {results.colors?.primary}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 truncate">Dominant</span>
                        <button
                          onClick={() => handleCopy(results.colors?.primary, 'copy-primary')}
                          className="text-[#0C81F3] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === 'copy-primary' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Secondary */}
                    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase text-slate-500 truncate">Secondary</div>
                      <div
                        className="h-10 rounded-lg shadow-inner flex items-end p-1.5 cursor-pointer group"
                        style={{ backgroundColor: results.colors?.secondary }}
                        onClick={() => handleCopy(results.colors?.secondary, 'sec-hex')}
                        title="Click to copy"
                      >
                        <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/40 text-white truncate">
                          {results.colors?.secondary}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 truncate">Support</span>
                        <button
                          onClick={() => handleCopy(results.colors?.secondary, 'copy-secondary')}
                          className="text-[#0C81F3] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === 'copy-secondary' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Accent */}
                    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase text-slate-500 truncate">Accent</div>
                      <div
                        className="h-10 rounded-lg shadow-inner flex items-end p-1.5 cursor-pointer group"
                        style={{ backgroundColor: results.colors?.accent }}
                        onClick={() => handleCopy(results.colors?.accent, 'acc-hex')}
                        title="Click to copy"
                      >
                        <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/40 text-white truncate">
                          {results.colors?.accent}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 truncate">Highlight</span>
                        <button
                          onClick={() => handleCopy(results.colors?.accent, 'copy-accent')}
                          className="text-[#0C81F3] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === 'copy-accent' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Compact Palette Swatches Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Full Color Palette</span>
                      <span className="text-slate-400 font-normal">Click swatch to copy</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {results.colors?.palette?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCopy(item.hex, `swatch-${idx}`)}
                          className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-xs transition-all group bg-white cursor-pointer"
                        >
                          <div
                            className="h-9 w-full relative flex items-center justify-center"
                            style={{ backgroundColor: item.hex }}
                          >
                            <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              {copiedKey === `swatch-${idx}` ? '✓' : 'Copy'}
                            </span>
                          </div>
                          <div className="p-1 text-center">
                            <div className="font-mono text-[10px] font-bold text-slate-800 truncate">
                              {item.hex}
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">{item.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compact Token Exporter */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Code className="w-3.5 h-3.5 text-[#0C81F3]" />
                      <span>Export Tokens</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-0.5 bg-slate-100 rounded-lg flex text-[10px] font-bold">
                        <button
                          onClick={() => setCodeSnippetTab('css')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            codeSnippetTab === 'css' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          CSS
                        </button>
                        <button
                          onClick={() => setCodeSnippetTab('tailwind')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            codeSnippetTab === 'tailwind' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          Tailwind
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(
                            codeSnippetTab === 'css'
                              ? results.colors?.snippets?.cssVariables
                              : results.colors?.snippets?.tailwind,
                            'snippet-copy'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'snippet-copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto shadow-inner max-h-32">
                    <pre>
                      {codeSnippetTab === 'css'
                        ? results.colors?.snippets?.cssVariables
                        : results.colors?.snippets?.tailwind}
                    </pre>
                  </div>
                </div>
              </div>

              {/* CARD 2: TECH STACK & CMS (SPACE-UTILIZED & COMPACT) */}
              <div id="card-tech" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Technology Stack & CMS</h3>
                        <p className="text-[11px] text-slate-500">CMS, libraries, analytics tags & servers</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {results.tech?.totalDetected || 0} Detected
                    </span>
                  </div>

                  {results.tech?.totalDetected === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">No public framework signatures found.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Custom vanilla or obfuscated build.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1">
                      {Object.entries(results.tech?.byCategory || {}).map(([categoryName, items]) => (
                        <div key={categoryName} className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                            <span>{categoryName}</span>
                            <span className="text-slate-400">{items.length}</span>
                          </div>

                          {/* Space-Efficient Wrapped Chips */}
                          <div className="flex flex-wrap gap-2">
                            {items.map((techItem, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                              >
                                <span className="text-base shrink-0 leading-none">
                                  {techItem.icon || '⚡'}
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xs font-bold text-slate-900">
                                    {techItem.name}
                                  </span>
                                  {techItem.version && (
                                    <span className="text-[10px] font-mono text-slate-500 font-medium">
                                      v{techItem.version}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase">
                                  {techItem.confidence}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Server Tag */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Server: <strong className="text-slate-700">{results.stats?.server}</strong>
                  </span>
                  <span>
                    Responsive Viewport: <strong className="text-emerald-600">{results.stats?.hasViewport ? 'Yes' : 'No'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 2: 2-COLUMN GRID (FONTS & ASSETS HEALTH) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* CARD 3: GOOGLE FONTS & TYPOGRAPHY (2/3 WIDTH) */}
              <div id="card-fonts" className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Google Fonts & Typography</h3>
                      <p className="text-[11px] text-slate-500">Detected families, weights, and live specimen tester</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {results.fonts?.length || 0} Fonts
                  </span>
                </div>

                {/* Live Specimen Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Interactive Live Font Specimen Tester
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Type custom text to preview live typography..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all"
                  />
                </div>

                {results.fonts?.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Type className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No external Google Fonts detected.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      System fallback stacks (e.g. system-ui, Arial) or self-hosted fonts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.fonts?.map((font, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-slate-900">{font.family}</h4>
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800">
                                {font.source}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="text-[10px] text-slate-500 font-semibold mr-1">Weights:</span>
                              {font.weights?.map((w, wIdx) => (
                                <span
                                  key={wIdx}
                                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200"
                                >
                                  {w}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {font.importSnippet && (
                              <button
                                onClick={() => handleCopy(font.importSnippet, `font-import-${idx}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer shadow-2xs"
                              >
                                {copiedKey === `font-import-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                @import
                              </button>
                            )}

                            {font.url && (
                              <a
                                href={font.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors shadow-2xs"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Google Fonts
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Live Specimen Rendering */}
                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                          <div
                            className="text-lg sm:text-xl text-slate-900 leading-snug"
                            style={{ fontFamily: `"${font.family}", sans-serif` }}
                          >
                            {previewText}
                          </div>
                          <div
                            className="text-[11px] text-slate-500 font-normal truncate"
                            style={{ fontFamily: `"${font.family}", sans-serif` }}
                          >
                            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &%$@!?
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 4: DESIGN HEALTH & PAGE ASSETS (1/3 WIDTH) */}
              <div id="card-health" className="lg:col-span-1 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Assets & Health</h3>
                      <p className="text-[11px] text-slate-500">Resource breakdown</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Stylesheets</div>
                    <div className="text-xl font-black text-slate-900">
                      {results.stats?.stylesheetsCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">CSS links</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Scripts</div>
                    <div className="text-xl font-black text-slate-900">
                      {results.stats?.scriptsCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">External JS</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Inline Styles</div>
                    <div className="text-xl font-black text-slate-900">
                      {results.stats?.inlineStylesCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">&lt;style&gt; tags</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Viewport</div>
                    <div className="text-xl font-black text-emerald-600">
                      {results.stats?.hasViewport ? 'Ready' : 'Missing'}
                    </div>
                    <div className="text-[10px] text-slate-400">Responsive tag</div>
                  </div>
                </div>

                {/* Server info box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block">Web Server Software</span>
                    <span className="font-mono font-bold text-slate-800">{results.stats?.server}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Content-Type</span>
                    <span className="font-mono text-slate-600 truncate block">{results.stats?.contentType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-sm mt-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-sm text-slate-600">
              Everything you need to know about theme extraction, tech detection, and design tokens
            </p>
          </div>

          <div className="space-y-3.5 max-w-3xl mx-auto pt-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors hover:border-slate-300 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm text-slate-900 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="p-5 pt-0 text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
