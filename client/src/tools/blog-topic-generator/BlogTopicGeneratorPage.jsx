import { useState, useMemo } from 'react'
import { useGenerateBlogTopicsMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  Sparkles,
  BookOpen,
  Layers,
  Copy,
  Check,
  Download,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Target,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Flame,
  Lightbulb,
  ArrowRight,
  Compass,
} from 'lucide-react'

const CONTENT_GOALS = [
  'Educational & Authority',
  'Commercial & Product Leads',
  'Brand Awareness & Viral Reach',
  'Customer Retention & Onboarding',
]

const CONTENT_TYPES = [
  'All Formats',
  'Ultimate Guides',
  'Step-by-Step How-To',
  'Listicles & Curations',
  'Comparisons & Reviews',
  'Data Benchmarks & Case Studies',
  'Comprehensive Ultimate Guides',
  'Step-by-Step How-To Tutorials',
  'Head-to-Head Comparison & Vs Articles',
  'Curated Statistics & Industry Trends',
]

const INTENT_COLORS = {
  informational: 'bg-blue-50 text-blue-700 border-blue-200',
  commercial: 'bg-purple-50 text-purple-700 border-purple-200',
  transactional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function BlogTopicGeneratorPage() {
  const [niche, setNiche] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [audience, setAudience] = useState('')
  const [contentGoal, setContentGoal] = useState(CONTENT_GOALS[0])
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [count, setCount] = useState(8)
  const [preferredProvider, setPreferredProvider] = useState('openrouter')

  const [generateBlogTopics, { isLoading, reset: resetMutation }] = useGenerateBlogTopicsMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeCluster, setActiveCluster] = useState('all')
  const [expandedBriefs, setExpandedBriefs] = useState({})

  const topics = results?.topics || []
  const pillarTopic = results?.pillarTopic || null
  const clusters = results?.clusters || []
  const strategy = results?.strategy || ''

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!niche.trim()) {
      setError('Please enter your niche or industry.')
      return
    }
    setError('')
    setResults(null)

    try {
      const kwArray = targetKeywords.split(',').map(s => s.trim()).filter(Boolean)
      const res = await generateBlogTopics({
        niche: niche.trim(),
        targetKeywords: kwArray,
        audience: audience.trim() || undefined,
        contentGoal,
        contentType,
        count: Number(count),
        preferredProvider,
      }).unwrap()

      setResults(res)
      setActiveCluster('all')
      setTimeout(() => {
        document.getElementById('blog-topic-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err?.data?.error || 'Failed to generate topics. Please try again.')
    }
  }

  const handleReset = () => {
    setNiche('')
    setTargetKeywords('')
    setAudience('')
    setResults(null)
    setError('')
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleBrief = (id) => {
    setExpandedBriefs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredTopics = useMemo(() => {
    if (activeCluster === 'all') return topics
    return topics.filter(t => t.clusterName === activeCluster)
  }, [topics, activeCluster])

  const exportCSV = () => {
    if (!topics.length) return
    const header = 'Title,Cluster,Target Keyword,Search Intent,Angle,Difficulty,Estimated Words,Hook\n'
    const rows = topics.map(t =>
      `"${t.title.replace(/"/g, '""')}","${t.clusterName}","${t.targetKeyword}","${t.searchIntent}","${t.contentAngle}","${t.difficulty}",${t.estimatedWordCount},"${(t.hook || '').replace(/"/g, '""')}"`
    ).join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `editorial-calendar-${niche.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportFullMarkdown = () => {
    if (!results) return
    const lines = [
      `# Editorial Content Strategy: ${niche}`,
      '',
      `## Pillar Cornerstone Content`,
      `**Title:** ${pillarTopic?.title}`,
      `**Target Keyword:** ${pillarTopic?.primaryKeyword}`,
      `**Summary:** ${pillarTopic?.summary}`,
      '',
      `## Strategic Roadmap`,
      strategy,
      '',
      `## Topic Clusters & Outlines`,
      ...topics.map((t, i) => `
### ${i + 1}. ${t.title}
- **Cluster:** ${t.clusterName}
- **Primary Keyword:** ${t.targetKeyword}
- **Intent:** ${t.searchIntent} | **Angle:** ${t.contentAngle} | **Estimated Words:** ${t.estimatedWordCount}
- **Hook:** *"${t.hook}"*
- **Outline:**
${t.outline.map(o => `  - ${o}`).join('\n')}
- **Related Keywords:** ${t.relatedKeywords.join(', ')}
- **Why It Works:** ${t.whyItWorks}
`),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-strategy-${niche.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Pillar & Cluster Silo Architecture
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI Blog Topic & Silo </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Architect</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate high-CTR headlines, complete article outlines, psychological hooks, and structured topic clusters designed for topical authority.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Niche Input */}
              <div className="md:col-span-2">
                <label htmlFor="niche" className="block text-sm font-bold text-slate-800 mb-2">
                  Niche / Industry Subject <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="niche"
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., B2B SaaS Growth, Specialty Coffee Roasting, Real Estate Investing"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-base transition-all"
                    required
                  />
                  <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Target Keywords */}
              <div>
                <label htmlFor="targetKeywords" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Keywords <span className="text-xs font-normal text-slate-500">(Optional, comma separated)</span>
                </label>
                <input
                  id="targetKeywords"
                  type="text"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  placeholder="e.g., saas churn reduction, b2b lead generation"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="audience" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Audience Description
                </label>
                <input
                  id="audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Startup Founders, Senior Marketing Directors, Home Baristas"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              {/* Content Goal */}
              <div>
                <label htmlFor="contentGoal" className="block text-sm font-bold text-slate-800 mb-2">
                  Primary Content Goal
                </label>
                <select
                  id="contentGoal"
                  value={contentGoal}
                  onChange={(e) => setContentGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white font-medium"
                >
                  {CONTENT_GOALS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Count */}
              <div>
                <label htmlFor="count" className="block text-sm font-bold text-slate-800 mb-2">
                  Number of Topics
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 8, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                        count === num
                          ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {num} Topics
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Selector & Actions */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto sm:min-w-[190px]">
                <ModelSelector
                  value={preferredProvider}
                  onChange={setPreferredProvider}
                  compact={true}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                {results && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm text-center cursor-pointer order-2 sm:order-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                      <span>Architecting Topic Silos...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Architect Pillar & Silos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Architecting Topical Authority Clusters..."
            subtitle={`Mining search volume, intent gaps, and hub-and-spoke silo topics for "${niche}".`}
            steps={[
              'Mapping topical entity taxonomy & user intent',
              'Designing high-authority cornerstone pillar page',
              'Grouping semantic cluster nodes & sub-topics',
              'Drafting SEO title hooks & search intent targets',
              'Generating comprehensive content briefs & FAQs',
            ]}
          />
        )}

        {/* Results Section */}
        {results && (
          <div id="blog-topic-results" className="space-y-6 animate-fade-in">
            {/* Cornerstone Pillar Card */}
            {pillarTopic && (
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-3">
                      <Compass className="w-3.5 h-3.5" />
                      Topical Authority Anchor (Pillar)
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                      {pillarTopic.title}
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed max-w-3xl">
                      {pillarTopic.summary}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-lg">
                      <span>Core Keyword: <strong>{pillarTopic.primaryKeyword}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={exportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportFullMarkdown}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Plan (.md)</span>
                    </button>
                  </div>
                </div>

                {/* Strategy Note */}
                {strategy && (
                  <div className="pt-5 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span><strong>Silo Strategy:</strong> {strategy}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cluster Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Topic Clusters:</span>
                </span>
                <button
                  onClick={() => setActiveCluster('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeCluster === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Topics ({topics.length})
                </button>
                {clusters.map((c, i) => {
                  const countInCluster = topics.filter(t => t.clusterName === c.name).length
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveCluster(c.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeCluster === c.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.name} ({countInCluster})
                    </button>
                  )
                })}
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredTopics.length} topics
              </span>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredTopics.map((topic, idx) => {
                const isBriefOpen = !!expandedBriefs[topic.id || idx]
                const intentClass = INTENT_COLORS[topic.searchIntent] || 'bg-slate-100 text-slate-700 border-slate-200'
                const diffClass = DIFFICULTY_COLORS[topic.difficulty] || 'bg-slate-100 text-slate-700 border-slate-200'

                const briefMarkdown = `## ${topic.title}\n\n- **Target Keyword:** ${topic.targetKeyword}\n- **Search Intent:** ${topic.searchIntent}\n- **Content Angle:** ${topic.contentAngle}\n- **Estimated Word Count:** ${topic.estimatedWordCount}\n- **Opening Hook:** "${topic.hook}"\n\n### Outline\n${topic.outline.map(o => `- ${o}`).join('\n')}\n\n### Related Keywords\n${topic.relatedKeywords.join(', ')}`

                return (
                  <div
                    key={topic.id || idx}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-900 text-white">
                          {topic.clusterName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold border ${intentClass}`}>
                          {topic.searchIntent}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold border ${diffClass}`}>
                          {topic.difficulty} difficulty
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {topic.estimatedWordCount} words
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerCopy(topic.title, `title-${idx}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          {copiedKey === `title-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `title-${idx}` ? 'Copied' : 'Copy Title'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {topic.title}
                    </h4>

                    {/* Hook & Angle */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Angle: {topic.contentAngle}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 italic">
                        "{topic.hook}"
                      </p>
                    </div>

                    {/* Keywords & Value Rationale */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-slate-500">Target Keyword:</span>
                        <strong className="text-slate-800">{topic.targetKeyword}</strong>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topic.relatedKeywords?.slice(0, 3).map((kw, kIdx) => (
                          <span key={kIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Full Brief Button */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleBrief(topic.id || idx)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isBriefOpen ? 'Hide Article Outline & Brief' : 'View Full Article Outline & SEO Brief'}</span>
                        </span>
                        {isBriefOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isBriefOpen && (
                        <div className="mt-3 p-5 rounded-xl bg-slate-900 text-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                              Comprehensive Content Outline
                            </span>
                            <button
                              onClick={() => triggerCopy(briefMarkdown, `brief-${idx}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              {copiedKey === `brief-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedKey === `brief-${idx}` ? 'Copied Brief' : 'Copy Full Markdown Brief'}</span>
                            </button>
                          </div>

                          <div className="space-y-2 font-mono text-xs sm:text-sm">
                            {topic.outline.map((heading, hIdx) => {
                              const isH3 = heading.startsWith('H3:')
                              return (
                                <div key={hIdx} className={`${isH3 ? 'pl-6 text-slate-400' : 'text-slate-200 font-bold'}`}>
                                  {heading}
                                </div>
                              )
                            })}
                          </div>

                          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                            <strong className="text-slate-300">Why Search Engines Rank This:</strong> {topic.whyItWorks}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}