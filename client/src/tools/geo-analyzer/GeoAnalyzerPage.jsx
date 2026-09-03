import { useState, useEffect } from 'react'
import { useAnalyzeGeoMutation } from '../../services/apiSlice'

export default function GeoAnalyzerPage() {
  // Mode: 'url' | 'content'
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [targetEngine, setTargetEngine] = useState('all')
  const [preferredProvider, setPreferredProvider] = useState('gemini-3.7-flash')

  // Analysis State
  const [analyzeGeo, { isLoading }] = useAnalyzeGeoMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)

  // Interactive UI state
  const [activeTab, setActiveTab] = useState('simulations') // 'simulations' | 'pillars' | 'soundbites' | 'gaps' | 'optimization'
  const [activeSimulator, setActiveSimulator] = useState('google') // 'google' | 'perplexity' | 'chatgpt'
  const [copiedKey, setCopiedKey] = useState(null)

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

  const handleSubmit = async (e) => {
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

    try {
      const payload = {
        url: mode === 'url' ? url.trim() : undefined,
        content: mode === 'content' ? content.trim() : undefined,
        targetQuery: targetQuery.trim() || undefined,
        targetEngine,
        preferredProvider,
      }

      const res = await analyzeGeo(payload).unwrap()
      if (res.success) {
        setResults(res)
        // Scroll to results
        setTimeout(() => {
          document.getElementById('geo-results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        setError(res.error || 'Failed to analyze content for GEO readiness.')
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Server error while running GEO analysis.')
    }
  }

  const overallScore = results?.analysis?.overallScore ?? 0
  const scoreCategory = results?.analysis?.scoreCategory || 'Moderate AI Citation Probability'
  const pillars = results?.analysis?.pillars || {}
  const simulations = results?.analysis?.simulations || {}
  const optimizationPack = results?.analysis?.optimizationPack || {}

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 45) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-rose-600 bg-rose-50 border-rose-200'
  }

  const getScoreStroke = (score) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#0C81F3'
    if (score >= 45) return '#F59E0B'
    return '#F43F5E'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Decorators */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-purple-50/40 to-transparent pointer-events-none -z-10 blur-3xl" />

      <div className="max-w-6xl mx-auto">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-rose-500/10 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4 backdrop-blur-sm shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            ⚡ Generative Engine Optimization (GEO & AEO)
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            AI Search &amp; GEO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0C81F3] via-[#7B5CF6] to-[#EB8988]">
              Visibility Analyzer
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Measure how likely your content is to be cited and recommended by{' '}
            <strong className="text-slate-800 font-semibold">Google AI Overviews</strong>,{' '}
            <strong className="text-slate-800 font-semibold">Perplexity.ai</strong>, and{' '}
            <strong className="text-slate-800 font-semibold">ChatGPT Search</strong>. Get instant actionable fixes.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden mb-12 backdrop-blur-md">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                mode === 'url'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Live URL Scanner
            </button>
            <button
              type="button"
              onClick={() => setMode('content')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                mode === 'content'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Paste Article Draft / Markdown
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {mode === 'url' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Target Webpage URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourdomain.com/blog/best-email-marketing-tools"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-800">
                    Paste Content Draft / Article Text <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {content ? content.split(/\s+/).filter(Boolean).length : 0} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your blog post, guide, or landing page copy here to test before publishing..."
                  className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all font-mono"
                />
              </div>
            )}

            {/* Additional parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Search Query / Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={targetQuery}
                  onChange={(e) => setTargetQuery(e.target.value)}
                  placeholder="e.g. Best CRM for real estate agents"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target AI Engine</label>
                <select
                  value={targetEngine}
                  onChange={(e) => setTargetEngine(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">All AI Search Engines (Universal)</option>
                  <option value="google">Google AI Overviews (SGE)</option>
                  <option value="perplexity">Perplexity.ai (Pro Search)</option>
                  <option value="chatgpt">ChatGPT Search</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">AI Analysis Model</label>
                <select
                  value={preferredProvider}
                  onChange={(e) => setPreferredProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (Deepest Insights)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ultra Fast)</option>
                  <option value="groq">Groq (Open-Source Fast)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
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
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0C81F3] via-[#7B5CF6] to-[#EB8988] text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.008] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
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
                  <span>Analyzing GEO &amp; Citation Probability...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Analyze AI Search &amp; GEO Readiness</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl mb-12 text-center max-w-2xl mx-auto space-y-5 animate-pulse">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Simulating Generative Search Engines...</h3>
              <p className="text-sm text-slate-500 mt-1">{loadingSteps[loadingStep]}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div id="geo-results" className="space-y-8 animate-fadeIn">
            {/* Top Score Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Radial Score Gauge */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
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
                      <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {overallScore}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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

                {/* Summary & Metrics Snapshot */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {results.targetQuery ? `Target: "${results.targetQuery}"` : 'AI Overview Audit'}
                    </span>
                    {results.url && (
                      <span className="text-xs text-slate-500 truncate max-w-xs font-mono">
                        {results.hostname}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Generative Engine Visibility Assessment
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {results.analysis?.executiveSummary}
                  </p>

                  {/* Micro stat ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-500">Factual Density</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {results.programmaticMetrics?.factualDensityRatio}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {results.programmaticMetrics?.totalDataPoints} verifiable data points
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-500">Direct Headings</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {results.programmaticMetrics?.questionHeadingsCount} /{' '}
                        {results.programmaticMetrics?.totalHeadingsCount}
                      </div>
                      <div className="text-[10px] text-slate-400">Question-led H2/H3s</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-500">Structured Tables</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {results.programmaticMetrics?.tableCount || 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Data &amp; comparison tables</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[11px] font-medium text-slate-500">Schema Types</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {results.programmaticMetrics?.schemaTypesDetected?.length || 0}
                      </div>
                      <div className="text-[10px] text-slate-400">JSON-LD detected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Analysis Depth */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
              {[
                { id: 'simulations', label: '🤖 AI Search Simulators', count: 3 },
                { id: 'pillars', label: '📊 5 GEO Pillars', count: 5 },
                { id: 'soundbites', label: '🎙️ Quotable Snippets', count: results.analysis?.topQuotableSnippets?.length || 0 },
                { id: 'gaps', label: '⚠️ Citation Gaps', count: results.analysis?.citationGaps?.length || 0 },
                { id: 'optimization', label: '⚡ 1-Click GEO Pack', count: 'Pro' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* TAB 1: AI SEARCH SIMULATORS */}
            {activeTab === 'simulations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Live AI Search Engine Synthesis Simulator
                      </h3>
                      <p className="text-xs text-slate-500">
                        Preview how top LLMs summarize and cite your content when answering searchers.
                      </p>
                    </div>

                    {/* Simulator Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        onClick={() => setActiveSimulator('google')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeSimulator === 'google'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Google AI Overview
                      </button>
                      <button
                        onClick={() => setActiveSimulator('perplexity')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeSimulator === 'perplexity'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Perplexity.ai
                      </button>
                      <button
                        onClick={() => setActiveSimulator('chatgpt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeSimulator === 'chatgpt'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ChatGPT Search
                      </button>
                    </div>
                  </div>

                  {/* Simulator Screen: Google AI Overview */}
                  {activeSimulator === 'google' && (
                    <div className="border border-blue-200/70 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/20 rounded-2xl p-6 relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                          ✦
                        </div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          AI Overview for &quot;{simulations.googleAiOverview?.query}&quot;
                        </span>
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Citation Probability: {simulations.googleAiOverview?.citationProbability || 'High'}
                        </span>
                      </div>

                      <div className="text-sm text-slate-800 leading-relaxed space-y-3 pl-3 border-l-2 border-blue-400 my-4">
                        <p className="font-normal">{simulations.googleAiOverview?.aiResponse}</p>
                      </div>

                      {/* Source Pills */}
                      <div className="mt-5 pt-4 border-t border-slate-200/60">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Cited Sources &amp; Carousels
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {simulations.googleAiOverview?.citedSources?.map((src, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-200 shadow-xs text-xs font-semibold text-slate-800"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-mono text-blue-600">{src.domain}</span>
                              <span className="text-slate-400 truncate max-w-[150px]">{src.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simulator Screen: Perplexity.ai */}
                  {activeSimulator === 'perplexity' && (
                    <div className="border border-teal-200/70 bg-gradient-to-br from-teal-50/40 via-white to-slate-50/30 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-teal-600 font-bold text-sm">✦ Perplexity Pro Search</span>
                        <span className="text-xs text-slate-400 font-mono">
                          &quot;{simulations.perplexity?.query}&quot;
                        </span>
                      </div>

                      {/* Thinking steps */}
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

                      <div className="text-sm text-slate-800 leading-relaxed pl-3 border-l-2 border-teal-500 my-4">
                        <p>{simulations.perplexity?.directAnswerWithCitations}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Citing Source:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-bold text-xs">
                          [1] {results.hostname || 'Your Website'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Simulator Screen: ChatGPT Search */}
                  {activeSimulator === 'chatgpt' && (
                    <div className="border border-purple-200/70 bg-gradient-to-br from-purple-50/40 via-white to-slate-50/30 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-purple-700 font-bold text-sm">💬 ChatGPT Search</span>
                        <span className="text-xs text-slate-400 font-mono">
                          &quot;{simulations.chatGptSearch?.query}&quot;
                        </span>
                      </div>

                      <div className="text-sm text-slate-800 leading-relaxed space-y-3 pl-3 border-l-2 border-purple-500 my-4">
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
                      className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{meta.title}</h4>
                            <p className="text-xs text-slate-500">{meta.desc}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                            statusColors[pillar.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pillar.status || 'Audited'}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-500">Pillar Score</span>
                          <span className="text-slate-900 font-bold">{pillar.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${pillar.score}%`,
                              backgroundColor: getScoreStroke(pillar.score),
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {pillar.summary}
                      </p>

                      {/* Strengths & Improvements */}
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
                {/* Quotable Sentences */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Top Quotable Sentences (AI Extracted)
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    These sentences exhibit high factual authority and are most likely to be quoted verbatim by AI Overviews.
                  </p>

                  <div className="space-y-3">
                    {results.analysis?.topQuotableSnippets?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
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
                        <p className="text-sm font-medium text-slate-900 italic">
                          &quot;{item.snippet}&quot;
                        </p>
                        <p className="text-xs text-slate-500">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Soundbite Transformer */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Soundbite Transformer (Before vs. After)
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Transform weak or generic sentences into high-authority AI citations.
                  </p>

                  <div className="space-y-4">
                    {results.analysis?.soundbiteRewrites?.map((rewrite, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
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
                        <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100">
                          <strong className="text-slate-700">Why it wins:</strong> {rewrite.whyItWins}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CITATION GAPS */}
            {activeTab === 'gaps' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Citation Gaps &amp; Missing Topic Matrix
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Add these missing data points, matrices, or entity definitions to ensure competitors don&apos;t steal the AI snippet.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {results.analysis?.citationGaps?.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
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
                        <p className="text-xs text-slate-600">{gap.recommendation}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(gap.recommendation, `gap-${gIdx}`)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
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
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        1. Ready-to-Embed &quot;AI Takeaways Box&quot;
                      </h3>
                      <p className="text-xs text-slate-500">
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 cursor-pointer"
                    >
                      {copiedKey === 'takeaway-box' ? '✓ Copied Markdown' : 'Copy Takeaways Box'}
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                    <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                      <span>💡</span>
                      <span>{optimizationPack.keyTakeawaysBox?.heading}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-800 list-disc list-inside">
                      {optimizationPack.keyTakeawaysBox?.bullets?.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* FAQ Schema Snippets */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        2. High-Intent FAQ Direct-Answers
                      </h3>
                      <p className="text-xs text-slate-500">
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
                      className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800 cursor-pointer"
                    >
                      {copiedKey === 'faq-list' ? '✓ Copied All FAQs' : 'Copy All FAQs'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {optimizationPack.faqSchemaList?.map((faq, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Q: {faq.question}</span>
                          <button
                            onClick={() =>
                              copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`, `faq-${fIdx}`)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {copiedKey === `faq-${fIdx}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JSON-LD Schema Snippet */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        3. Suggested JSON-LD Structured Data
                      </h3>
                      <p className="text-xs text-slate-500">
                        Insert into your page &lt;head&gt; to solidify Entity &amp; Author E-E-A-T signals.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(optimizationPack.suggestedJsonLdSnippet, 'json-schema')
                      }
                      className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700 cursor-pointer"
                    >
                      {copiedKey === 'json-schema' ? '✓ Copied Schema' : 'Copy JSON-LD'}
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-64 scrollbar-thin">
                    {typeof optimizationPack.suggestedJsonLdSnippet === 'object'
                      ? JSON.stringify(optimizationPack.suggestedJsonLdSnippet, null, 2)
                      : optimizationPack.suggestedJsonLdSnippet}
                  </pre>
                </div>

                {/* Priority Action Checklist */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    4. Priority GEO Implementation Roadmap
                  </h3>
                  <div className="space-y-3">
                    {results.analysis?.priorityActionPlan?.map((item, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{item.title}</span>
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
                          <p className="text-xs text-slate-600">{item.action}</p>
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
            <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base">Ready to boost your AI citations?</h4>
                <p className="text-xs text-slate-300">
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
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-rose-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
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
