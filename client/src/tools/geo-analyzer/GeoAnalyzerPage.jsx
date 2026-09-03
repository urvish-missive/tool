import { useState, useEffect, useRef } from 'react'
import { useAnalyzeGeoMutation } from '../../services/apiSlice'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'

export default function GeoAnalyzerPage() {
  // Mode: 'url' | 'content'
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [targetEngine, setTargetEngine] = useState('all')
  const [aiModel, setAiModel] = useState('gemini-3.7-flash')

  // Lead Popup integration
  const {
    popupEnabled,
    showPopup,
    setShowPopup,
    handlePopupClose,
  } = useLeadPopup('geo-analyzer')
  const [pendingPayload, setPendingPayload] = useState(null)

  // Analysis State
  const [analyzeGeo, { isLoading }] = useAnalyzeGeoMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  // Interactive UI state
  const [activeTab, setActiveTab] = useState('simulations') // 'simulations' | 'pillars' | 'soundbites' | 'gaps' | 'optimization'
  const [activeSimulator, setActiveSimulator] = useState('google') // 'google' | 'perplexity' | 'chatgpt'
  const [copiedKey, setCopiedKey] = useState(null)
  const formRef = useRef(null)

  const loadingSteps = [
    'Crawling webpage content & extracting semantic DOM hierarchy...',
    'Calculating factual density, data points, and direct-answer ratios...',
    'Auditing Schema.org markup, author credentials, and E-E-A-T entity signals...',
    'Simulating Google AI Overview, Perplexity.ai, and ChatGPT Search synthesis...',
    'Generating 1-click GEO optimization takeaways & soundbites...',
  ]

  useEffect(() => {
    let timer
    if (isLoading) {
      setLoadingStep(0)
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev))
      }, 1800)
    }
    return () => clearInterval(timer)
  }, [isLoading])

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (mode === 'url' && (!url || url.trim().length < 3)) {
      setError('Please enter a valid website URL (e.g. https://example.com/blog-post).')
      return
    }

    if (mode === 'content' && (!content || content.trim().length < 40)) {
      setError('Please enter at least 40 characters of content or draft text.')
      return
    }

    const payload = {
      url: mode === 'url' ? url.trim() : undefined,
      content: mode === 'content' ? content.trim() : undefined,
      targetQuery: targetQuery.trim() || undefined,
      targetEngine,
      preferredProvider: aiModel,
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
      return
    }

    executeAnalysis(payload)
  }

  const executeAnalysis = async (payload, leadId = null) => {
    try {
      const res = await analyzeGeo({ ...payload, leadId }).unwrap()
      if (res.success) {
        setResults(res)
        setTimeout(() => {
          document.getElementById('geo-results')?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      } else {
        setError(res.error || 'Failed to analyze content for GEO readiness.')
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Server error while running GEO analysis.')
    }
  }

  const onLeadModalSuccess = (leadId) => {
    if (pendingPayload) {
      executeAnalysis(pendingPayload, leadId)
      setPendingPayload(null)
    }
  }

  const handleReset = () => {
    setUrl('')
    setContent('')
    setTargetQuery('')
    setResults(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const overallScore = results?.analysis?.overallScore ?? 0
  const scoreCategory = results?.analysis?.scoreCategory || 'Moderate AI Citation Probability'
  const pillars = results?.analysis?.pillars || {}
  const simulations = results?.analysis?.simulations || {}
  const optimizationPack = results?.analysis?.optimizationPack || {}

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-rose-700 bg-rose-50 border-rose-200'
  }

  const getScoreStroke = (score) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#0C81F3'
    if (score >= 45) return '#F59E0B'
    return '#F43F5E'
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmitSuccess={onLeadModalSuccess}
        toolSlug="geo-analyzer"
        title="Unlock Free AI Search & GEO Analyzer"
        subtitle="Evaluate content citation readiness for Google AI Overviews, Perplexity.ai, and ChatGPT Search."
      />

      {/* Hero Header matching Missive Digital Brand Theme */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <span>✨</span>
            <span>Himani&apos;s SEO Tools • Missive Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI Search &amp; </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              GEO Analyzer
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Audit, benchmark, and optimize your content for <strong>Google AI Overviews</strong>,{' '}
            <strong>Perplexity.ai</strong>, and <strong>ChatGPT Search</strong> with simulated LLM citations.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Input Form Card */}
        <div ref={formRef} className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 p-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'url'
                    ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span>Live URL Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('content')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'content'
                    ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Paste Draft / Markdown</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {mode === 'url' ? (
                <div>
                  <label htmlFor="target-url" className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Target Webpage URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </div>
                    <input
                      id="target-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/blog/best-seo-strategies"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="draft-content" className="block text-sm font-semibold text-gray-900">
                      Content Draft / Article Text <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {content ? content.split(/\s+/).filter(Boolean).length : 0} words
                    </span>
                  </div>
                  <textarea
                    id="draft-content"
                    rows={7}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your blog post, service page copy, or draft markdown here..."
                    className="w-full rounded-xl border border-gray-300 p-4 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all resize-y min-h-[160px] font-mono placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Target Query & Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target-query" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Target Search Query / Prompt (Optional)
                  </label>
                  <input
                    id="target-query"
                    type="text"
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    placeholder="e.g. Best email marketing software"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="target-engine" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Target AI Engine Focus
                  </label>
                  <select
                    id="target-engine"
                    value={targetEngine}
                    onChange={(e) => setTargetEngine(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all cursor-pointer bg-white"
                  >
                    <option value="all">All AI Engines (Google SGE, Perplexity, ChatGPT)</option>
                    <option value="google">Google AI Overviews (SGE Focus)</option>
                    <option value="perplexity">Perplexity.ai (Pro Search Focus)</option>
                    <option value="chatgpt">ChatGPT Search Focus</option>
                  </select>
                </div>
              </div>

              {/* AI Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  AI Intelligence Engine
                </label>
                <ModelSelector selectedModel={aiModel} onSelectModel={setAiModel} />
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Auditing GEO &amp; LLM Citations...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Analyze AI Search &amp; GEO Readiness</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Loading Progress Animation */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md mb-12 text-center max-w-xl mx-auto space-y-4 animate-pulse">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] flex items-center justify-center text-white text-2xl shadow-sm">
              🤖
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Simulating AI Search Engines...</h3>
              <p className="text-xs text-gray-500 mt-1">{loadingSteps[loadingStep]}</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] h-2 rounded-full transition-all duration-500"
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {results && (
          <div id="geo-results" className="space-y-8 animate-fadeIn">
            {/* Top Results Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      GEO Diagnostic Report
                    </span>
                    {results.url && (
                      <span className="text-xs text-gray-500 font-mono truncate max-w-xs">
                        {results.hostname}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Generative Engine Optimization Overview
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Analyze Another</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Radial Gauge */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#E2E8F0"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={getScoreStroke(overallScore)}
                        strokeWidth="10"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {overallScore}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        GEO Score
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-4 px-3.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(
                      overallScore
                    )}`}
                  >
                    {scoreCategory}
                  </div>
                </div>

                {/* Summary & Micro Metrics */}
                <div className="lg:col-span-8 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                    {results.analysis?.executiveSummary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-[11px] font-medium text-gray-500">Factual Density</div>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {results.programmaticMetrics?.factualDensityRatio}%
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {results.programmaticMetrics?.totalDataPoints} verifiable data points
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-[11px] font-medium text-gray-500">Direct Headings</div>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {results.programmaticMetrics?.questionHeadingsCount} /{' '}
                        {results.programmaticMetrics?.totalHeadingsCount}
                      </div>
                      <div className="text-[10px] text-gray-400">Question-led H2/H3s</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-[11px] font-medium text-gray-500">Structured Tables</div>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {results.programmaticMetrics?.tableCount || 0}
                      </div>
                      <div className="text-[10px] text-gray-400">Data &amp; comparison tables</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-[11px] font-medium text-gray-500">Schema Types</div>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {results.programmaticMetrics?.schemaTypesDetected?.length || 0}
                      </div>
                      <div className="text-[10px] text-gray-400">JSON-LD detected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
              {[
                { id: 'simulations', label: '🤖 AI Search Simulators', count: 3 },
                { id: 'pillars', label: '📊 5 GEO Pillars', count: 5 },
                {
                  id: 'soundbites',
                  label: '🎙️ Quotable Snippets',
                  count: results.analysis?.topQuotableSnippets?.length || 0,
                },
                {
                  id: 'gaps',
                  label: '⚠️ Citation Gaps',
                  count: results.analysis?.citationGaps?.length || 0,
                },
                { id: 'optimization', label: '⚡ 1-Click GEO Pack', count: 'Pro' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* TAB 1: AI SEARCH SIMULATORS */}
            {activeTab === 'simulations' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      Live AI Search Engine Synthesis Simulator
                    </h3>
                    <p className="text-xs text-gray-500">
                      Preview how major AI search engines cite and extract answers from this content.
                    </p>
                  </div>

                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => setActiveSimulator('google')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeSimulator === 'google'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Google AI Overview
                    </button>
                    <button
                      onClick={() => setActiveSimulator('perplexity')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeSimulator === 'perplexity'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Perplexity.ai
                    </button>
                    <button
                      onClick={() => setActiveSimulator('chatgpt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeSimulator === 'chatgpt'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ChatGPT Search
                    </button>
                  </div>
                </div>

                {/* Google AI Overview */}
                {activeSimulator === 'google' && (
                  <div className="border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/20 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                        ✦
                      </div>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        AI Overview for &quot;{simulations.googleAiOverview?.query}&quot;
                      </span>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Citation Probability: {simulations.googleAiOverview?.citationProbability || 'High'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-800 leading-relaxed space-y-3 pl-3 border-l-2 border-blue-400 my-4">
                      <p>{simulations.googleAiOverview?.aiResponse}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-200">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Cited Sources &amp; Carousels
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {simulations.googleAiOverview?.citedSources?.map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-200 shadow-xs text-xs font-semibold text-gray-800"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-mono text-blue-600">{src.domain}</span>
                            <span className="text-gray-400 truncate max-w-[150px]">{src.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Perplexity */}
                {activeSimulator === 'perplexity' && (
                  <div className="border border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-slate-50/30 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-teal-700 font-bold text-sm">✦ Perplexity Pro Search</span>
                      <span className="text-xs text-gray-400 font-mono truncate">
                        &quot;{simulations.perplexity?.query}&quot;
                      </span>
                    </div>

                    <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 mb-4 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
                        Reasoning &amp; Query Fan-Out
                      </div>
                      {simulations.perplexity?.searchSteps?.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-xs text-teal-900">
                          <span className="text-teal-600 font-bold">✓</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-sm text-gray-800 leading-relaxed pl-3 border-l-2 border-teal-500 my-4">
                      <p>{simulations.perplexity?.directAnswerWithCitations}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Citing Source:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-bold text-xs">
                        [1] {results.hostname || 'Your Website'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ChatGPT */}
                {activeSimulator === 'chatgpt' && (
                  <div className="border border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-slate-50/30 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-purple-700 font-bold text-sm">💬 ChatGPT Search</span>
                      <span className="text-xs text-gray-400 font-mono truncate">
                        &quot;{simulations.chatGptSearch?.query}&quot;
                      </span>
                    </div>

                    <div className="text-sm text-gray-800 leading-relaxed space-y-3 pl-3 border-l-2 border-purple-500 my-4">
                      <p>{simulations.chatGptSearch?.conversationalAnswer}</p>
                    </div>

                    {simulations.chatGptSearch?.highlightedQuote && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 mb-1">
                          Extracted Quotation
                        </div>
                        <p className="text-xs italic text-purple-950">
                          &quot;{simulations.chatGptSearch.highlightedQuote}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 5 GEO PILLARS */}
            {activeTab === 'pillars' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(pillars).map(([key, pillar]) => {
                  const pillarTitles = {
                    factualDensity: {
                      title: '1. Factual & Statistical Density',
                      icon: '📊',
                      desc: 'Hard verifiable data, benchmarks, numbers, and stats that LLMs extract.',
                    },
                    directAnswers: {
                      title: '2. Direct-Answer Architecture',
                      icon: '🎯',
                      desc: 'Crisp 40-60 word definitive answer snippets right below H2/H3 questions.',
                    },
                    entityGrounding: {
                      title: '3. Entity & Brand Grounding',
                      icon: '🏢',
                      desc: 'Named entities, author E-E-A-T credentials, and Organization schema signals.',
                    },
                    quoteability: {
                      title: '4. Quoteability & Soundbites',
                      icon: '🎙️',
                      desc: 'Distinct definitions, coined framework names, and takeaway summaries.',
                    },
                    structuredData: {
                      title: '5. Structured Data & Hygiene',
                      icon: '⚡',
                      desc: 'Clean JSON-LD schemas (Article, FAQPage), comparison tables, and list hierarchies.',
                    },
                  }

                  const meta = pillarTitles[key] || { title: key, icon: '📌', desc: '' }
                  const statusColors = {
                    Optimal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Needs Improvement': 'bg-amber-50 text-amber-700 border-amber-200',
                    'Critical Gap': 'bg-rose-50 text-rose-700 border-rose-200',
                  }

                  return (
                    <div
                      key={key}
                      className="bg-white rounded-2xl p-6 shadow-md shadow-gray-200/40 border border-gray-200 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-gray-900">{meta.title}</h4>
                            <p className="text-xs text-gray-500">{meta.desc}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                            statusColors[pillar.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pillar.status || 'Audited'}
                        </span>
                      </div>

                      {/* Score Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-500">Pillar Score</span>
                          <span className="text-gray-900 font-bold">{pillar.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${pillar.score}%`,
                              backgroundColor: getScoreStroke(pillar.score),
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {pillar.summary}
                      </p>

                      <div className="space-y-2 pt-1 text-xs">
                        {pillar.strengths?.map((str, sI) => (
                          <div key={sI} className="flex items-start gap-2 text-emerald-800">
                            <span className="font-bold text-emerald-600">✓</span>
                            <span>{str}</span>
                          </div>
                        ))}
                        {pillar.improvements?.map((imp, iI) => (
                          <div key={iI} className="flex items-start gap-2 text-amber-800">
                            <span className="font-bold text-amber-600">⚠</span>
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAB 3: QUOTABLE SNIPPETS & SOUNDBITES */}
            {activeTab === 'soundbites' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                    Top Quotable Sentences (AI Extracted)
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    These sentences exhibit high factual authority and are most likely to be quoted verbatim by AI Overviews.
                  </p>

                  <div className="space-y-3">
                    {results.analysis?.topQuotableSnippets?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            High Citation Match
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.snippet, `snip-${idx}`)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `snip-${idx}` ? '✓ Copied' : 'Copy Snippet'}
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 italic">
                          &quot;{item.snippet}&quot;
                        </p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                    Soundbite Transformer (Before vs. After)
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Transform weak or generic sentences into high-authority AI citations.
                  </p>

                  <div className="space-y-4">
                    {results.analysis?.soundbiteRewrites?.map((rewrite, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 mb-1">
                              ❌ Generic / Low AI Quoteability
                            </div>
                            <p className="text-xs text-rose-950">{rewrite.original}</p>
                          </div>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
                              <span>✓ AI-Optimized Soundbite</span>
                              <button
                                onClick={() => copyToClipboard(rewrite.rewritten, `soundbite-${rIdx}`)}
                                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                              >
                                {copiedKey === `soundbite-${rIdx}` ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-emerald-950">{rewrite.rewritten}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-white p-2.5 rounded-lg border border-gray-100">
                          <strong className="text-gray-700">Why it wins:</strong> {rewrite.whyItWins}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CITATION GAPS */}
            {activeTab === 'gaps' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  Citation Gaps &amp; Missing Topic Matrix
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Add these missing data points, matrices, or entity definitions to ensure competitors don&apos;t steal the AI snippet.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {results.analysis?.citationGaps?.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {gap.missingConcept}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              gap.impact === 'High'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {gap.impact} Impact
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{gap.recommendation}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(gap.recommendation, `gap-${gIdx}`)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 shrink-0 cursor-pointer"
                      >
                        {copiedKey === `gap-${gIdx}` ? '✓ Copied Fix' : 'Copy Fix'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: 1-CLICK GEO OPTIMIZATION PACK */}
            {activeTab === 'optimization' && (
              <div className="space-y-6">
                {/* Takeaway Box */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        1. Ready-to-Embed &quot;AI Takeaways Box&quot;
                      </h3>
                      <p className="text-xs text-gray-500">
                        Paste this executive summary right below your H1 title to instantly trigger AI Overviews.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${optimizationPack.keyTakeawaysBox?.heading}\n\n` +
                            optimizationPack.keyTakeawaysBox?.bullets?.map((b) => `• ${b}`).join('\n'),
                          'takeaway-box'
                        )
                      }
                      className="px-4 py-2 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'takeaway-box' ? '✓ Copied Markdown' : 'Copy Takeaways Box'}
                    </button>
                  </div>

                  <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <span>💡</span>
                      <span>{optimizationPack.keyTakeawaysBox?.heading}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-gray-800 list-disc list-inside">
                      {optimizationPack.keyTakeawaysBox?.bullets?.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* FAQ Schema Snippets */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        2. High-Intent FAQ Direct-Answers
                      </h3>
                      <p className="text-xs text-gray-500">
                        Drop these concise Q&amp;A blocks at the end of your content to win Perplexity question matching.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          optimizationPack.faqSchemaList
                            ?.map((f) => `### ${f.question}\n${f.answer}`)
                            .join('\n\n'),
                          'faq-list'
                        )
                      }
                      className="px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-gray-800 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'faq-list' ? '✓ Copied All FAQs' : 'Copy All FAQs'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {optimizationPack.faqSchemaList?.map((faq, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900">Q: {faq.question}</span>
                          <button
                            onClick={() =>
                              copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`, `faq-${fIdx}`)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {copiedKey === `faq-${fIdx}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JSON-LD Schema Snippet */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        3. Suggested JSON-LD Structured Data
                      </h3>
                      <p className="text-xs text-gray-500">
                        Insert into your page &lt;head&gt; to solidify Entity &amp; Author E-E-A-T signals.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(optimizationPack.suggestedJsonLdSnippet, 'json-schema')
                      }
                      className="px-4 py-2 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 cursor-pointer shrink-0"
                    >
                      {copiedKey === 'json-schema' ? '✓ Copied Schema' : 'Copy JSON-LD'}
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto max-h-64 scrollbar-thin">
                    {typeof optimizationPack.suggestedJsonLdSnippet === 'object'
                      ? JSON.stringify(optimizationPack.suggestedJsonLdSnippet, null, 2)
                      : optimizationPack.suggestedJsonLdSnippet}
                  </pre>
                </div>

                {/* Priority Action Checklist */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-gray-200/50 border border-gray-200 space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    4. Priority GEO Implementation Roadmap
                  </h3>
                  <div className="space-y-3">
                    {results.analysis?.priorityActionPlan?.map((item, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{item.title}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                item.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {item.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{item.action}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                          {item.estimatedGeoBoost}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-6 bg-gray-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base">Ready to boost your AI citations?</h4>
                <p className="text-xs text-gray-300">
                  Export your full audit report or re-run analysis on another page.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  onClick={() => copyToClipboard(results, 'export-json')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {copiedKey === 'export-json' ? '✓ Copied JSON' : 'Export Full JSON'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
