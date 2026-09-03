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
  FileCode2,
  Sliders,
  Eye,
  Info,
  ArrowDown,
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

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
            Discover any website's complete color palette, technology stack, CMS, and Google Font typography. View all insights together in one unified design intelligence dashboard.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10 transition-all">
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

        {/* Unified Card-Wise Results Dashboard */}
        {results && !isLoading && (
          <div id="tech-inspector-results" className="space-y-8 pt-2">
            {/* Top Quick Overview Banner & Jump Navigation */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {results.favicon ? (
                  <img
                    src={results.favicon}
                    alt="favicon"
                    className="w-10 h-10 rounded-xl p-1 border border-slate-200 bg-white object-contain shadow-2xs"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0C81F3] flex items-center justify-center font-bold text-sm shadow-2xs">
                    {results.hostname?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-md">
                      {results.pageTitle || results.hostname}
                    </h2>
                    <a
                      href={results.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#0C81F3] transition-colors"
                      title="Open website in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{results.websiteUrl}</p>
                </div>
              </div>

              {/* Quick Jump Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => scrollToSection('card-colors')}
                  className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0C81F3] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Colors ({results.colors?.palette?.length || 0})</span>
                </button>
                <button
                  onClick={() => scrollToSection('card-tech')}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Tech ({results.tech?.totalDetected || 0})</span>
                </button>
                <button
                  onClick={() => scrollToSection('card-fonts')}
                  className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Fonts ({results.fonts?.length || 0})</span>
                </button>
                <button
                  onClick={() => scrollToSection('card-health')}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Assets</span>
                </button>
              </div>
            </div>

            {/* CARD 1: THEME COLORS & PALETTE */}
            <div id="card-colors" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0C81F3]">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Theme Colors & Brand Palette</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Extracted brand colors, CSS root variables, and computed palette shades
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(results.colors?.primary, 'primary-hex')}
                    className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'primary-hex' ? 'Copied' : `Primary: ${results.colors?.primary}`}
                  </button>
                </div>
              </div>

              {/* Brand Colors 3-Pillar Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Primary Color */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand Primary</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0C81F3]">
                      Dominant
                    </span>
                  </div>
                  <div
                    className="h-24 rounded-xl shadow-inner flex items-end p-3 transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: results.colors?.primary }}
                  >
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md bg-black/40 text-white">
                      {results.colors?.primary}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Main button & hero color</span>
                    <button
                      onClick={() => handleCopy(results.colors?.primary, 'copy-primary')}
                      className="text-xs font-bold text-[#0C81F3] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'copy-primary' ? 'Copied' : 'Copy Hex'}
                    </button>
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand Secondary</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700">
                      Secondary
                    </span>
                  </div>
                  <div
                    className="h-24 rounded-xl shadow-inner flex items-end p-3 transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: results.colors?.secondary }}
                  >
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md bg-black/40 text-white">
                      {results.colors?.secondary}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Supporting gradient shade</span>
                    <button
                      onClick={() => handleCopy(results.colors?.secondary, 'copy-secondary')}
                      className="text-xs font-bold text-[#0C81F3] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'copy-secondary' ? 'Copied' : 'Copy Hex'}
                    </button>
                  </div>
                </div>

                {/* Accent Color */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Accent Highlight</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      Accent
                    </span>
                  </div>
                  <div
                    className="h-24 rounded-xl shadow-inner flex items-end p-3 transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: results.colors?.accent }}
                  >
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md bg-black/40 text-white">
                      {results.colors?.accent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">Links, badges & tags</span>
                    <button
                      onClick={() => handleCopy(results.colors?.accent, 'copy-accent')}
                      className="text-xs font-bold text-[#0C81F3] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'copy-accent' ? 'Copied' : 'Copy Hex'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Palette Swatches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span>Full Extracted Palette ({results.colors?.palette?.length || 0})</span>
                  <span className="text-slate-400 font-normal">Click any swatch to copy HEX</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {results.colors?.palette?.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all group bg-white"
                    >
                      <div
                        className="h-16 w-full relative flex items-end justify-end p-1.5 cursor-pointer"
                        style={{ backgroundColor: item.hex }}
                        onClick={() => handleCopy(item.hex, `swatch-${idx}`)}
                        title="Click to copy HEX"
                      >
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedKey === `swatch-${idx}` ? 'Copied!' : 'Copy'}
                        </span>
                      </div>
                      <div className="p-2.5 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900">{item.hex}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              item.wcagRating === 'WCAG AA'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.wcagRating}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Design Token Code Exporter */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#0C81F3]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Export Design Tokens Code Snippet
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
                      <button
                        onClick={() => setCodeSnippetTab('css')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          codeSnippetTab === 'css' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        CSS Variables
                      </button>
                      <button
                        onClick={() => setCodeSnippetTab('tailwind')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          codeSnippetTab === 'tailwind' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Tailwind Config
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'snippet-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Code</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner max-h-48">
                  <pre>
                    {codeSnippetTab === 'css'
                      ? results.colors?.snippets?.cssVariables
                      : results.colors?.snippets?.tailwind}
                  </pre>
                </div>
              </div>
            </div>

            {/* CARD 2: TECH STACK & FRAMEWORKS */}
            <div id="card-tech" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Technology Stack & CMS</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Detected platforms, frontend libraries, analytics tags, and web servers
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {results.tech?.totalDetected || 0} Technologies
                </span>
              </div>

              {results.tech?.totalDetected === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No public framework signatures found.</p>
                  <p className="text-xs text-slate-500 mt-0.5">This website may be a custom vanilla build or uses minified proprietary bundles.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(results.tech?.byCategory || {}).map(([categoryName, items]) => (
                    <div key={categoryName} className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                        <span>{categoryName}</span>
                        <span>{items.length}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {items.map((techItem, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg w-6 h-6 flex items-center justify-center shrink-0">
                                {techItem.icon || '⚡'}
                              </span>
                              <div className="truncate">
                                <div className="text-sm font-bold text-slate-900 truncate">
                                  {techItem.name}
                                </div>
                                {techItem.version && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    v{techItem.version}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
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

            {/* CARD 3: GOOGLE FONTS & TYPOGRAPHY */}
            <div id="card-fonts" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Google Fonts & Typography</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Font families, weights, import rules, and interactive live specimen preview
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {results.fonts?.length || 0} Fonts
                </span>
              </div>

              {/* Live Specimen Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Type Custom Text for Live Font Rendering
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Type custom text to preview live typography..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all"
                />
              </div>

              {results.fonts?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Type className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No external Google Fonts detected.</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This site may rely on system fallback stacks (e.g. system-ui, -apple-system, Arial) or self-hosted web fonts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.fonts?.map((font, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">{font.family}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {font.source}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="text-[11px] text-slate-500 font-semibold mr-1">Weights:</span>
                            {font.weights?.map((w, wIdx) => (
                              <span
                                key={wIdx}
                                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              {copiedKey === `font-import-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy @import
                            </button>
                          )}

                          {font.url && (
                            <a
                              href={font.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Google Fonts
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Live Specimen */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div
                          className="text-xl sm:text-2xl text-slate-900 leading-snug"
                          style={{ fontFamily: `"${font.family}", sans-serif` }}
                        >
                          {previewText}
                        </div>
                        <div
                          className="text-xs text-slate-500 leading-relaxed font-normal"
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

            {/* CARD 4: DESIGN HEALTH & ASSETS */}
            <div id="card-health" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Design Health & Page Assets</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Stylesheets, scripts, mobile viewport, and server configuration
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Stylesheets
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {results.stats?.stylesheetsCount || 0}
                  </div>
                  <div className="text-[11px] text-slate-500">Linked in &lt;head&gt;</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Scripts Loaded
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {results.stats?.scriptsCount || 0}
                  </div>
                  <div className="text-[11px] text-slate-500">External JS bundles</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Inline Styles
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {results.stats?.inlineStylesCount || 0}
                  </div>
                  <div className="text-[11px] text-slate-500">&lt;style&gt; blocks</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Viewport
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {results.stats?.hasViewport ? 'Ready' : 'Missing'}
                  </div>
                  <div className="text-[11px] text-slate-500">Responsive tag</div>
                </div>
              </div>

              {/* Server Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Web Server Software:</span>
                  <span className="font-mono font-bold text-slate-900">{results.stats?.server}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Content-Type:</span>
                  <span className="font-mono text-slate-600 truncate">{results.stats?.contentType}</span>
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
