import { useState, useMemo } from 'react'
import { useAnalyzeCompetitorMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import {
  Search,
  Globe,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Link2,
  FileText,
  RefreshCw,
  Shield,
  Copy,
  Check,
  Download,
  Flame,
  Swords,
  Crown,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'

const PRIORITY_COLORS = {
  HIGH: 'bg-rose-100 text-rose-800 border-rose-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
}

const IMPACT_COLORS = {
  'Very High': 'text-emerald-700 font-bold',
  'High': 'text-blue-700 font-bold',
  'Medium': 'text-slate-600 font-medium',
}

export default function CompetitorAnalysisPage() {
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [yourUrl, setYourUrl] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [preferredProvider, setPreferredProvider] = useState('openrouter')
  const [analyzeCompetitor, { isLoading }] = useAnalyzeCompetitorMutation()

  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeTab, setActiveTab] = useState('playbook') // 'playbook' | 'gaps' | 'comparison' | 'snippets'

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!competitorUrl.trim()) {
      setError('Please enter a competitor URL')
      return
    }
    setError('')
    setResults(null)

    try {
      const result = await analyzeCompetitor({
        competitorUrl: competitorUrl.trim(),
        yourUrl: yourUrl.trim() || undefined,
        targetKeywords: targetKeywords.trim() || undefined,
        preferredProvider,
      }).unwrap()

      setResults(result)
      setTimeout(() => {
        document.getElementById('competitor-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err?.data?.error || 'Failed to analyze competitor. Please check the URL and try again.')
    }
  }

  const handleReset = () => {
    setCompetitorUrl('')
    setYourUrl('')
    setTargetKeywords('')
    setResults(null)
    setError('')
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const competitorSeo = results?.competitorSeo || null
  const yourSeo = results?.yourSeo || null
  const outrankPlaybook = results?.outrankPlaybook || []
  const contentGaps = results?.contentGaps || []
  const keywordOpps = results?.keywordOpportunities || []
  const backlinkAngles = results?.backlinkAngles || []
  const snippetSnatch = results?.featuredSnippetSnatch || null

  const exportReportMarkdown = () => {
    if (!results) return
    const lines = [
      `# Competitor Intelligence Report: ${competitorUrl}`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Target Keywords: ${targetKeywords || 'N/A'}`,
      '',
      `## Executive Strategy`,
      results.executiveSummary || '',
      '',
      `## 10x Outrank Playbook`,
      ...outrankPlaybook.map((p, i) => `${i + 1}. [${p.priority}] ${p.action} (Impact: ${p.impact}, Effort: ${p.effort})\n   Why: ${p.why}`),
      '',
      `## Content Gaps & Information Gain Angles`,
      ...contentGaps.map(g => `- **${g.topic}** (${g.searchIntent})\n  Angle: ${g.suggestedAngle}\n  Why: ${g.whyImportant}`),
      '',
      `## Keyword Opportunities`,
      ...keywordOpps.map(k => `- ${k.keyword} (${k.intent}, ${k.difficulty}): ${k.opportunity}`),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `competitor-report-${new URL(competitorUrl.startsWith('http') ? competitorUrl : 'https://' + competitorUrl).hostname}.md`
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
            Competitive Intelligence & SERP Inversion Engine
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Competitor SEO & Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Reverser</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Deconstruct competitor rankings, discover unexploited content gaps, and generate a customized 10x playbook to outrank them.
          </p>
        </div>
      </section>

      {/* Main Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor URL */}
              <div>
                <label htmlFor="competitorUrl" className="block text-sm font-bold text-slate-800 mb-2">
                  Competitor URL to Analyze <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="competitorUrl"
                    type="text"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    placeholder="https://competitor.com/blog/best-product"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm transition-all"
                    required
                  />
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Your URL (Optional) */}
              <div>
                <label htmlFor="yourUrl" className="block text-sm font-bold text-slate-800 mb-2">
                  Your URL <span className="text-xs font-normal text-slate-500">(Optional for Head-to-Head)</span>
                </label>
                <div className="relative">
                  <input
                    id="yourUrl"
                    type="text"
                    value={yourUrl}
                    onChange={(e) => setYourUrl(e.target.value)}
                    placeholder="https://yourdomain.com/your-article"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-sm transition-all"
                  />
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Target Keywords */}
              <div className="md:col-span-2">
                <label htmlFor="targetKeywords" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Search Queries <span className="text-xs font-normal text-slate-500">(Optional, comma separated)</span>
                </label>
                <input
                  id="targetKeywords"
                  type="text"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  placeholder="e.g. content marketing audit, b2b saas seo strategy"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>
            </div>

            {/* Model Selector & Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <ModelSelector
                  value={preferredProvider}
                  onChange={setPreferredProvider}
                  compact={true}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {results && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-bold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Crawling & Analyzing Competitor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Reverse-Engineer Competitor</span>
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

        {/* Results Container */}
        {results && (
          <div id="competitor-results" className="space-y-6 animate-fade-in">
            {/* Strategic Overview Battle-Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-3">
                    <Crown className="w-3.5 h-3.5" />
                    Strategic Intelligence Summary
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    Competitor Moat & Vulnerability Assessment
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed max-w-3xl">
                    {results.executiveSummary}
                  </p>
                </div>

                <button
                  onClick={exportReportMarkdown}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Intelligence Brief (.md)</span>
                </button>
              </div>

              {/* Moat vs Vulnerabilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {/* Competitor Moat */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Their Current Advantages (Moat)</span>
                  </div>
                  <ul className="space-y-2">
                    {results.competitorMoat?.map((m, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Competitor Vulnerabilities */}
                <div className="bg-rose-950/30 rounded-2xl p-5 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold text-sm">
                    <Flame className="w-4 h-4" />
                    <span>Exploitable Vulnerabilities (Where You Win)</span>
                  </div>
                  <ul className="space-y-2">
                    {results.competitorVulnerabilities?.map((v, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('playbook')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'playbook'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>10x Outrank Playbook ({outrankPlaybook.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('gaps')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'gaps'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Content Gaps ({contentGaps.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Technical Benchmarks</span>
              </button>
              {snippetSnatch && (
                <button
                  onClick={() => setActiveTab('snippets')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'snippets'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Snippet Snatch</span>
                </button>
              )}
            </div>

            {/* TAB 1: 10X OUTRANK PLAYBOOK */}
            {activeTab === 'playbook' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {outrankPlaybook.map((item, idx) => {
                    const pClass = PRIORITY_COLORS[item.priority] || 'bg-slate-100 text-slate-800'
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center shrink-0 text-sm">
                            {idx + 1}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${pClass}`}>
                                {item.priority} Priority
                              </span>
                              <span className="text-xs text-slate-500">
                                Impact: <span className={IMPACT_COLORS[item.impact]}>{item.impact}</span>
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                Effort: <strong className="text-slate-700">{item.effort}</strong>
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 leading-snug">
                              {item.action}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {item.why}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => triggerCopy(item.action, `playbook-${idx}`)}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {copiedKey === `playbook-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Action</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CONTENT GAPS & KEYWORDS */}
            {activeTab === 'gaps' && (
              <div className="space-y-6">
                {/* Content Gap Matrix */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Unexploited Content Gaps & Information Gain Angles</h3>
                    <p className="text-xs text-slate-500">Topics your competitor missed where you can provide superior value.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentGaps.map((gap, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-bold uppercase">
                              {gap.searchIntent || 'Informational'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base mb-2">{gap.topic}</h4>
                          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                            <strong>Why Searchers Care:</strong> {gap.whyImportant}
                          </p>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed">
                            <strong className="text-indigo-600">Suggested 10x Angle:</strong> {gap.suggestedAngle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyword Opportunities */}
                {keywordOpps.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">High-Yield Keyword Opportunities</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                            <th className="py-3 px-3">Keyword</th>
                            <th className="py-3 px-3">Intent</th>
                            <th className="py-3 px-3">Difficulty</th>
                            <th className="py-3 px-3">Strategic Value & Opportunity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {keywordOpps.map((kw, i) => (
                            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900">{kw.keyword}</td>
                              <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">{kw.intent}</span></td>
                              <td className="py-3 px-3"><span className="text-xs font-semibold text-slate-700">{kw.difficulty}</span></td>
                              <td className="py-3 px-3 text-xs text-slate-600 leading-relaxed">{kw.opportunity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TECHNICAL BENCHMARKS */}
            {activeTab === 'comparison' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Competitor Metrics Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Analyzed</span>
                      <h4 className="font-bold text-slate-900 text-base truncate max-w-xs">{competitorSeo?.title || competitorUrl}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-blue-700">{competitorSeo?.stats?.overallBenchmark || 50}</span>
                      <span className="text-[9px] font-bold text-blue-500 -mt-1">/100</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Estimated Word Count</span>
                      <span className="font-bold text-slate-900">{competitorSeo?.stats?.wordCount?.toLocaleString() || 0} words</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Heading Structure</span>
                      <span className="font-bold text-slate-900">{competitorSeo?.h1s?.length || 0} H1s • {competitorSeo?.h2s?.length || 0} H2s</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Internal Links</span>
                      <span className="font-bold text-slate-900">{competitorSeo?.stats?.internalLinks || 0} links</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Images & Alt Tags</span>
                      <span className="font-bold text-slate-900">
                        {competitorSeo?.stats?.imagesWithAlt}/{competitorSeo?.stats?.totalImages} with alt ({competitorSeo?.stats?.imagesWithoutAlt} missing)
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Schema JSON-LD</span>
                      <span className={`font-bold ${competitorSeo?.stats?.hasSchema ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {competitorSeo?.stats?.hasSchema ? '✓ Detected' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Open Graph Social Tags</span>
                      <span className={`font-bold ${competitorSeo?.stats?.hasOGTags ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {competitorSeo?.stats?.hasOGTags ? '✓ Present' : '✗ Incomplete'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Your URL Metrics or Industry Benchmark */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {yourSeo ? 'Your Page Data' : 'Top 1% Industry Target Benchmark'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base truncate max-w-xs">
                        {yourSeo ? yourSeo.title : 'Recommended Goal for Position #1'}
                      </h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-emerald-700">{yourSeo ? yourSeo.stats?.overallBenchmark : 95}</span>
                      <span className="text-[9px] font-bold text-emerald-500 -mt-1">/100</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Target Word Count</span>
                      <span className="font-bold text-slate-900">
                        {yourSeo ? `${yourSeo.stats?.wordCount?.toLocaleString()} words` : '2,200+ comprehensive words'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Heading Hierarchy</span>
                      <span className="font-bold text-slate-900">
                        {yourSeo ? `${yourSeo.h1s?.length} H1s • ${yourSeo.h2s?.length} H2s` : '1 H1 • 6-10 H2s • Nested H3s'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Internal Silo Links</span>
                      <span className="font-bold text-slate-900">
                        {yourSeo ? `${yourSeo.stats?.internalLinks} links` : '10-15 contextual topic links'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Image Alt Coverage</span>
                      <span className="font-bold text-emerald-700">
                        {yourSeo ? `${yourSeo.stats?.imagesWithAlt}/${yourSeo.stats?.totalImages}` : '100% descriptive alt text'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Schema JSON-LD</span>
                      <span className="font-bold text-emerald-600">
                        {yourSeo ? (yourSeo.stats?.hasSchema ? '✓ Detected' : '✗ Missing') : 'FAQPage + Article Schema'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Open Graph Social</span>
                      <span className="font-bold text-emerald-600">
                        {yourSeo ? (yourSeo.stats?.hasOGTags ? '✓ Present' : '✗ Missing') : 'Full og:title, og:image, twitter'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FEATURED SNIPPET SNATCH */}
            {activeTab === 'snippets' && snippetSnatch && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>Featured Snippet Steal Opportunity</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Target Query: <span className="text-blue-600">"{snippetSnatch.targetQuery}"</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => triggerCopy(snippetSnatch.draftSnippet, 'snippet-snatch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {copiedKey === 'snippet-snatch' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'snippet-snatch' ? 'Copied Snippet!' : 'Copy Snippet'}</span>
                  </button>
                </div>

                <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl space-y-3">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Ready-to-Paste Position 0 Direct Answer
                  </span>
                  <p className="text-base sm:text-lg leading-relaxed font-serif text-slate-200">
                    "{snippetSnatch.draftSnippet}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
