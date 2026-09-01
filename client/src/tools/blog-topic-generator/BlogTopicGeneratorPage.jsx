import { useState, useEffect, useCallback } from 'react'
import ModelSelector from '../shared/ModelSelector'

const CONTENT_GOALS = ['Educational', 'Commercial', 'Lead Generation', 'Brand Awareness', 'Other']
const CONTENT_TYPES = ['Blog Post', 'How-To', 'Guide', 'Listicle', 'Case Study', 'Comparison', 'Other']
const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}
const INTENT_COLORS = {
  informational: 'bg-blue-100 text-blue-700',
  commercial: 'bg-purple-100 text-purple-700',
  transactional: 'bg-emerald-100 text-emerald-700',
  navigational: 'bg-gray-100 text-gray-700',
}

function TopicCard({ topic, index }) {
  const [copied, setCopied] = useState(false)

  const copyTitle = () => {
    navigator.clipboard.writeText(topic.title)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFFICULTY_COLORS[topic.difficulty] || 'bg-gray-100 text-gray-700'}`}>
            {topic.difficulty || 'medium'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${INTENT_COLORS[topic.searchIntent] || 'bg-gray-100 text-gray-700'}`}>
            {topic.searchIntent || 'informational'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {topic.contentType || 'blog post'}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{topic.title}</h3>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {topic.targetKeyword}
        </span>
        <span>{topic.estimatedWordCount || 1500} words</span>
      </div>

      {topic.whyItWorks && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{topic.whyItWorks}</p>
      )}

      {topic.outline?.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outline</span>
          <ul className="mt-2 space-y-1">
            {topic.outline.slice(0, 5).map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-400 mt-1 shrink-0">→</span>
                {item.replace(/^H[1-6]:\s*/i, '')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {topic.relatedKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
          {topic.relatedKeywords.slice(0, 4).map((kw, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-600 border border-violet-100">
              {kw}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={copyTitle}
        className="mt-4 w-full px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
      >
        {copied ? '✓ Copied!' : 'Copy Title'}
      </button>
    </div>
  )
}

function ClusterView({ pillarPage, clusters }) {
  if (!clusters?.length) return null

  return (
    <div className="space-y-6">
      {/* Pillar Page */}
      {pillarPage && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">PILLAR PAGE</span>
            <span className="text-sm text-gray-500">{pillarPage.estimatedWordCount || 3000} words</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{pillarPage.title}</h3>
          <p className="text-sm text-gray-600 mb-3">Target keyword: <strong>{pillarPage.mainKeyword}</strong></p>
          {pillarPage.outline?.length > 0 && (
            <div className="bg-white/60 rounded-lg p-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">Outline</span>
              <ul className="mt-2 space-y-1">
                {pillarPage.outline.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {item.replace(/^H[1-6]:\s*/i, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Clusters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                {i + 1}
              </span>
              <h4 className="font-bold text-gray-900 text-sm">{cluster.clusterName}</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Focus: <strong className="text-purple-600">{cluster.focusKeyword}</strong>
            </p>
            <div className="space-y-2">
              {(cluster.articles || []).map((article, j) => (
                <div key={j} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900">{article.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">{article.contentType}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">{article.estimatedWordCount}w</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interlinking Strategy */}
      {clusters[0]?.interlinkingStrategy && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <span>🔗</span> Interlinking Strategy
          </h4>
          <p className="text-sm text-amber-700">{clusters[0].interlinkingStrategy}</p>
        </div>
      )}
    </div>
  )
}

function LoadingTopics({ currentStep }) {
  const idx = ['niche', 'keywords', 'intents', 'structure', 'topics', 'finalize'].indexOf(currentStep)
  const steps = [
    { label: 'Analyzing niche' },
    { label: 'Researching keywords' },
    { label: 'Identifying search intents' },
    { label: 'Building content structure' },
    { label: 'Generating topics' },
    { label: 'Finalizing recommendations' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center max-w-md mx-auto">
      <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Generating blog topics...</h3>
      <p className="text-sm text-gray-500 mb-6">This may take 15-30 seconds</p>
      <div className="space-y-3 text-left">
        {steps.map((step, i) => {
          const status = i < idx ? 'done' : i === idx ? 'active' : 'pending'
          return (
            <div key={i} className="flex items-center gap-3">
              {status === 'done' && <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              {status === 'active' && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />}
              {status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
              <span className={`text-sm ${status === 'active' ? 'font-medium text-gray-900' : status === 'done' ? 'text-green-700' : 'text-gray-400'}`}>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicsResult({ topics, strategy }) {
  const [search, setSearch] = useState('')
  const [intentFilter, setIntentFilter] = useState('All')
  const [sortBy, setSortBy] = useState('index')

  const intents = ['All', ...new Set(topics.map(t => t.searchIntent || 'informational'))]

  const filtered = topics
    .filter(t => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.targetKeyword?.toLowerCase().includes(search.toLowerCase())
      const matchesIntent = intentFilter === 'All' || t.searchIntent === intentFilter
      return matchesSearch && matchesIntent
    })
    .sort((a, b) => {
      if (sortBy === 'words') return (b.estimatedWordCount || 1500) - (a.estimatedWordCount || 1500)
      if (sortBy === 'difficulty') {
        const order = { easy: 0, medium: 1, hard: 2 }
        return (order[a.difficulty] || 1) - (order[b.difficulty] || 1)
      }
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Strategy */}
      {strategy && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>💡</span> Content Strategy
          </h3>
          <p className="text-sm text-gray-700">{strategy}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
        />
        <select
          value={intentFilter}
          onChange={e => setIntentFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {intents.map(i => <option key={i}>{i}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="index">Sort: Default</option>
          <option value="words">Sort: Word Count</option>
          <option value="difficulty">Sort: Difficulty</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} topics</span>
      </div>

      {/* Topics Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((topic, i) => (
          <TopicCard key={i} topic={topic} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No topics match your filters.</p>
        </div>
      )}
    </div>
  )
}

export default function BlogTopicGeneratorPage() {
  const [niche, setNiche] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [audience, setAudience] = useState('')
  const [contentGoal, setContentGoal] = useState('Educational')
  const [contentType, setContentType] = useState('Blog Post')
  const [customContentGoal, setCustomContentGoal] = useState('')
  const [customContentType, setCustomContentType] = useState('')
  const [aiModel, setAiModel] = useState('openrouter')
  const [topicCount, setTopicCount] = useState(10)
  const [validationError, setValidationError] = useState('')
  const [loadingStep, setLoadingStep] = useState('niche')

  // Results state
  const [topicsResult, setTopicsResult] = useState(null)
  const [clustersResult, setClustersResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Mode: 'topics' | 'clusters'
  const [mode, setMode] = useState('topics')
  const [mainKeyword, setMainKeyword] = useState('')

  // Simulate loading progress
  useEffect(() => {
    if (!isLoading) return
    const steps = ['niche', 'keywords', 'intents', 'structure', 'topics', 'finalize']
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx < steps.length) setLoadingStep(steps[idx])
    }, 3000)
    return () => clearInterval(interval)
  }, [isLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (niche.trim().length < 2) {
      setValidationError('Please enter a niche (at least 2 characters).')
      return
    }

    if (mode === 'clusters' && mainKeyword.trim().length < 2) {
      setValidationError('Please enter a main keyword for topic clusters.')
      return
    }

    if (contentGoal === 'Other' && customContentGoal.trim().length < 2) {
      setValidationError('Please describe your custom content goal.')
      return
    }

    if (contentType === 'Other' && customContentType.trim().length < 2) {
      setValidationError('Please describe your custom content type.')
      return
    }

    setIsLoading(true)
    setIsError(false)
    setErrorMessage('')
    setLoadingStep('niche')

    const keywords = targetKeywords
      ? targetKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : []

    const finalContentGoal = contentGoal === 'Other' ? customContentGoal.trim() : contentGoal
    const finalContentType = contentType === 'Other' ? customContentType.trim() : contentType

    try {
      if (mode === 'topics') {
        const response = await fetch('/api/blog-topics/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: niche.trim(),
            targetKeywords: keywords,
            audience: audience.trim(),
            contentGoal: finalContentGoal.toLowerCase().replace(/\s+/g, '-'),
            contentType: finalContentType.toLowerCase(),
            preferredProvider: aiModel,
            count: topicCount,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate topics')
        }

        setTopicsResult(data)
      } else {
        const response = await fetch('/api/blog-topics/clusters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: niche.trim(),
            mainKeyword: mainKeyword.trim(),
            audience: audience.trim(),
            preferredProvider: aiModel,
            clusterCount: 5,
            topicsPerCluster: 4,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate clusters')
        }

        setClustersResult(data)
      }

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setIsError(true)
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setTopicsResult(null)
    setClustersResult(null)
    setIsError(false)
    setErrorMessage('')
    setContentGoal('Educational')
    setContentType('Blog Post')
    setCustomContentGoal('')
    setCustomContentType('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative !pt-36 overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free SEO Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">AI Blog Topic </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate SEO-optimized blog topics, topic clusters, and content calendars with AI-powered insights for your content strategy.
          </p>
        </div>
      </section>

      {/* Form / Loading / Results */}
      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Idle Form */}
          {!topicsResult && !clustersResult && !isLoading && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-6">
              {/* Mode Toggle */}
              <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setMode('topics')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${mode === 'topics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Generate Topics
                </button>
                <button
                  type="button"
                  onClick={() => setMode('clusters')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${mode === 'clusters' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Topic Clusters
                </button>
              </div>

              {/* Niche */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Niche / Industry *</label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. digital marketing, SaaS, health & wellness"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Main Keyword (for clusters mode) */}
              {mode === 'clusters' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Main Keyword (Pillar) *</label>
                  <input
                    type="text"
                    value={mainKeyword}
                    onChange={e => setMainKeyword(e.target.value)}
                    placeholder="e.g. content marketing"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be the pillar page topic</p>
                </div>
              )}

              {/* Target Keywords */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Target Keywords (optional)</label>
                <input
                  type="text"
                  value={targetKeywords}
                  onChange={e => setTargetKeywords(e.target.value)}
                  placeholder="e.g. SEO tips, content strategy, keyword research"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Target Audience (optional)</label>
                <input
                  type="text"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  placeholder="e.g. Small business owners, marketing managers"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Options Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Content Goal</label>
                  <select
                    value={contentGoal}
                    onChange={e => setContentGoal(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {CONTENT_GOALS.map(g => <option key={g}>{g}</option>)}
                  </select>
                  {contentGoal === 'Other' && (
                    <input
                      type="text"
                      value={customContentGoal}
                      onChange={e => setCustomContentGoal(e.target.value)}
                      placeholder="Describe your content goal..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Content Type</label>
                  <select
                    value={contentType}
                    onChange={e => setContentType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {contentType === 'Other' && (
                    <input
                      type="text"
                      value={customContentType}
                      onChange={e => setCustomContentType(e.target.value)}
                      placeholder="Describe your content type..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Topic Count (only for topics mode) */}
              {mode === 'topics' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Number of Topics: {topicCount}</label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={topicCount}
                    onChange={e => setTopicCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>
              )}

              {/* AI Model */}
                <ModelSelector value={aiModel} onChange={setAiModel} />

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {validationError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40"
              >
                {mode === 'topics' ? 'Generate Topics' : 'Generate Topic Clusters'}
              </button>
            </form>
          )}

          {/* Loading */}
          {isLoading && <LoadingTopics currentStep={loadingStep} />}

          {/* Error */}
          {isError && !isLoading && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center max-w-md mx-auto">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Generation Failed</h3>
              <p className="text-gray-600 mt-2">{errorMessage}</p>
              <button onClick={handleReset} className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {(topicsResult || clustersResult) && (
            <div id="results-section" className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {topicsResult ? 'Generated Blog Topics' : 'Topic Cluster Strategy'}
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  ← Generate More
                </button>
              </div>

              {topicsResult && topicsResult.topics && (
                <TopicsResult topics={topicsResult.topics} strategy={topicsResult.strategy} />
              )}

              {clustersResult && (
                <ClusterView
                  pillarPage={clustersResult.pillarPage}
                  clusters={clustersResult.clusters}
                />
              )}

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">Need More Help?</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Turn These Topics into Content</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">
                    Our content strategists can help you create a full content calendar and write SEO-optimized articles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}