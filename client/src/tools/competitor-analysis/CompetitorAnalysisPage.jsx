import { useState } from 'react'
import { useAnalyzeCompetitorMutation } from '../../services/apiSlice'
import {
  Search,
  Globe,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  BarChart3,
  Link2,
  FileText,
  RefreshCw,
  Shield,
} from 'lucide-react'

export default function CompetitorAnalysisPage() {
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [yourUrl, setYourUrl] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [analyzeCompetitor, { isLoading }] = useAnalyzeCompetitorMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [copiedSection, setCopiedSection] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    content: true,
    keywords: true,
    technical: true,
    backlinks: true,
    gaps: true,
    quickwins: false,
  })

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
      }).unwrap()
      setResults(result)
    } catch (err) {
      setError(err?.data?.error || 'Failed to analyze competitor. Please try again.')
    }
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(key)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const SectionCard = ({ icon: Icon, title, children, sectionKey, score, badge }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className="text-xs text-gray-500">{badge}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {score !== undefined && score !== null && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              score >= 70 ? 'bg-green-100 text-green-700' :
              score >= 40 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {score}/100
            </div>
          )}
          {expandedSections[sectionKey] ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-6 pb-5 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  )

  const ListItem = ({ children, variant = 'default' }) => {
    const styles = {
      default: 'flex items-start gap-3 py-2 text-gray-700',
      positive: 'flex items-start gap-3 py-2 text-green-700',
      negative: 'flex items-start gap-3 py-2 text-red-700',
      opportunity: 'flex items-start gap-3 py-2 text-blue-700',
    }
    const icons = {
      default: <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2.5 shrink-0" />,
      positive: <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />,
      negative: <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />,
      opportunity: <Target className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />,
    }
    return (
      <li className={styles[variant]}>
        {icons[variant]}
        <span className="text-sm leading-relaxed">{children}</span>
      </li>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Search className="w-4 h-4" />
            Competitor Analysis Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            Spy on Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Competitors</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter any competitor URL and uncover their SEO strategy, keyword opportunities, content gaps, and quick wins to outrank them.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleAnalyze} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Competitor URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    placeholder="https://competitor.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Website URL <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={yourUrl}
                    onChange={(e) => setYourUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Keywords <span className="text-xs text-gray-400">(optional, comma-separated)</span>
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  placeholder="SEO tools, content marketing, keyword research"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing Competitor...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze Competitor
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Competitor Info Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-white font-bold text-lg">Analysis Complete</h2>
                <a
                  href={results.competitorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-100 text-sm flex items-center gap-1 hover:text-white transition-colors"
                >
                  {results.competitorUrl}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              {results.title && (
                <div className="text-right">
                  <p className="text-blue-100 text-xs mb-1">Page Title</p>
                  <p className="text-white font-medium text-sm max-w-xs truncate">{results.title}</p>
                </div>
              )}
            </div>

            {/* SEO Basics */}
            {results.title && (
              <SectionCard icon={Globe} title="SEO Basics" badge="On-page elements found">
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Title Tag</p>
                    <p className="text-sm font-medium text-gray-900">{results.title || 'Not found'}</p>
                    <p className="text-xs text-gray-400 mt-1">{results.title?.length || 0} characters</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Meta Description</p>
                    <p className="text-sm text-gray-700">{results.metaDescription || 'Not found'}</p>
                    <p className="text-xs text-gray-400 mt-1">{results.metaDescription?.length || 0} characters</p>
                  </div>
                  {results.h1s?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">H1 Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {results.h1s.map((h1, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {h1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.h2s?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Top H2 Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {results.h2s.map((h2, i) => (
                          <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                            {h2}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{results.stats?.wordCount || 0}</p>
                      <p className="text-xs text-gray-500">Words</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{results.stats?.totalImages || 0}</p>
                      <p className="text-xs text-gray-500">Images</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{results.stats?.imagesWithAlt || 0}</p>
                      <p className="text-xs text-gray-500">With Alt</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{results.stats?.imagesWithoutAlt || 0}</p>
                      <p className="text-xs text-gray-500">Missing Alt</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Technical SEO Score */}
            {results.technicalSEO && (
              <SectionCard
                icon={Shield}
                title="Technical SEO Score"
                sectionKey="technical"
                score={results.technicalSEO.score}
              >
                <div className="space-y-3">
                  {/* Score Bar */}
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                        results.technicalSEO.score >= 70 ? 'bg-green-500' :
                        results.technicalSEO.score >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${results.technicalSEO.score}%` }}
                    />
                  </div>

                  {results.technicalSEO.issues?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Issues Found</p>
                      <ul className="space-y-1">
                        {results.technicalSEO.issues.map((issue, i) => (
                          <ListItem key={i} variant="negative">{issue}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.technicalSEO.recommendations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {results.technicalSEO.recommendations.map((rec, i) => (
                          <ListItem key={i} variant="opportunity">{rec}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Keyword Opportunities */}
            {results.keywordOpportunities?.length > 0 && (
              <SectionCard icon={Target} title="Keyword Opportunities" badge={`${results.keywordOpportunities.length} found`}>
                <div className="space-y-3">
                  {results.keywordOpportunities.map((kw, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{kw.keyword}</p>
                        <p className="text-sm text-gray-600 mt-1">{kw.opportunity}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          kw.difficulty === 'low' ? 'bg-green-100 text-green-700' :
                          kw.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {kw.difficulty}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {kw.intent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Content Strategy */}
            {results.contentStrategy && (
              <SectionCard icon={FileText} title="Content Strategy Analysis" sectionKey="content">
                <div className="space-y-4">
                  {results.contentStrategy.summary && (
                    <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      {results.contentStrategy.summary}
                    </p>
                  )}
                  {results.contentStrategy.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {results.contentStrategy.strengths.map((s, i) => (
                          <ListItem key={i} variant="positive">{s}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.contentStrategy.weaknesses?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Weaknesses
                      </p>
                      <ul className="space-y-1">
                        {results.contentStrategy.weaknesses.map((w, i) => (
                          <ListItem key={i} variant="negative">{w}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Backlink Opportunities */}
            {results.backlinkOpportunities?.length > 0 && (
              <SectionCard icon={Link2} title="Backlink Opportunities" sectionKey="backlinks">
                <ul className="space-y-2">
                  {results.backlinkOpportunities.map((opp, i) => (
                    <ListItem key={i} variant="opportunity">{opp}</ListItem>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Content Gaps */}
            {results.contentGaps?.length > 0 && (
              <SectionCard icon={TrendingUp} title="Content Gaps" sectionKey="gaps" badge="Untapped opportunities">
                <ul className="space-y-2">
                  {results.contentGaps.map((gap, i) => (
                    <ListItem key={i} variant="opportunity">{gap}</ListItem>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Quick Wins */}
            {results.quickWins?.length > 0 && (
              <SectionCard icon={Zap} title="Quick Wins" sectionKey="quickwins" badge="Fast improvements">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">
                    ⚡ Actions to take immediately
                  </p>
                  <ul className="space-y-2">
                    {results.quickWins.map((win, i) => (
                      <ListItem key={i} variant="positive">{win}</ListItem>
                    ))}
                  </ul>
                </div>
              </SectionCard>
            )}

            {/* Social Links */}
            {results.stats?.socialLinks && (
              <SectionCard icon={BarChart3} title="Social Presence">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(results.stats.socialLinks).map(([platform, has]) => (
                    <div
                      key={platform}
                      className={`rounded-xl p-4 text-center ${has ? 'bg-green-50' : 'bg-gray-50'}`}
                    >
                      <p className={`text-xs font-semibold uppercase ${has ? 'text-green-700' : 'text-gray-400'}`}>
                        {platform}
                      </p>
                      <p className={`text-lg font-bold mt-1 ${has ? 'text-green-600' : 'text-gray-300'}`}>
                        {has ? '✓' : '✗'}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !isLoading && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Enter a competitor URL to start analysis</p>
            <p className="text-sm mt-1">Get SEO insights, keyword opportunities, and content gaps</p>
          </div>
        )}
      </div>
    </div>
  )
}
