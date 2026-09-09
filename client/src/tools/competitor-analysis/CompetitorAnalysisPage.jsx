import { useState } from 'react'
import { useAnalyzeCompetitorMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import StrategicOverviewCard from './components/StrategicOverviewCard'
import HeadToHeadBenchmark from './components/HeadToHeadBenchmark'
import OutrankPlaybookTab from './components/OutrankPlaybookTab'
import ContentGapsTab from './components/ContentGapsTab'
import BacklinkAnglesTab from './components/BacklinkAnglesTab'
import SnippetSnatchTab from './components/SnippetSnatchTab'
import {
  Globe,
  Shield,
  Zap,
  BarChart3,
  Target,
  Crown,
  Link2,
  RefreshCw,
} from 'lucide-react'

export default function CompetitorAnalysisPage() {
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [yourUrl, setYourUrl] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [analyzeCompetitor, { isLoading, reset: resetMutation }] = useAnalyzeCompetitorMutation()

  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('playbook') // 'playbook' | 'gaps' | 'comparison' | 'backlinks' | 'snippets'

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
      setTimeout(() => {
        document
          .getElementById('competitor-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(
        err?.data?.error || 'Failed to analyze competitor. Please check the URL and try again.'
      )
    }
  }

  const handleReset = () => {
    setCompetitorUrl('')
    setYourUrl('')
    setTargetKeywords('')
    setResults(null)
    setError('')
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const competitorSeo = results?.competitorSeo || null
  const yourSeo = results?.yourSeo || null
  const outrankPlaybook = results?.outrankPlaybook || []
  const contentGaps = results?.contentGaps || []
  const keywordOpps = results?.keywordOpportunities || []
  const backlinkAngles = results?.backlinkAngles || []
  const snippetSnatch = results?.featuredSnippetSnatch || null

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Competitive Intelligence & SERP Inversion Engine
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Competitor SEO & Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Reverser
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Deconstruct competitor rankings, discover unexploited content gaps, and generate a
            customized 10x playbook to outrank them.
          </p>
        </div>
      </section>

      {/* Main Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isLoading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor URL */}
              <div>
                <label
                  htmlFor="competitorUrl"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
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
                  Your URL{' '}
                  <span className="text-xs font-normal text-slate-500">
                    (Optional for Head-to-Head)
                  </span>
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
                <label
                  htmlFor="targetKeywords"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  Target Search Queries{' '}
                  <span className="text-xs font-normal text-slate-500">
                    (Optional, comma separated)
                  </span>
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

            {/* Actions */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
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
                      <span>Crawling & Analyzing Competitor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
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
        )}

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Crawling & Reverse-Engineering Competitor..."
            subtitle={`Analyzing on-page structure, backlink angles, and keyword opportunities for ${competitorUrl}.`}
            steps={[
              'Fetching competitor HTML & meta tags',
              'Extracting heading structure & content depth',
              'Auditing keyword density & entity associations',
              'Calculating outrank difficulty & content gaps',
              'Building 10x actionable outrank playbook',
            ]}
          />
        )}

        {/* Results Container */}
        {results && (
          <div id="competitor-results" className="space-y-6 animate-fade-in">
            {/* Strategic Overview Battle-Card */}
            <StrategicOverviewCard
              results={results}
              competitorUrl={competitorUrl}
              yourUrl={yourUrl}
              targetKeywords={targetKeywords}
            />

            {/* ── MULTI-VIEW TAB NAVIGATION (Matching Content QA Checklist theme) ── */}
            <div className="border-b border-gray-200">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('playbook')}
                  className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'playbook'
                      ? 'border-[#0C81F3] text-[#0C81F3]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>10x Outrank Playbook ({outrankPlaybook.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gaps')}
                  className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'gaps'
                      ? 'border-[#0C81F3] text-[#0C81F3]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>Content Gaps & Keywords ({contentGaps.length + keywordOpps.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'comparison'
                      ? 'border-[#0C81F3] text-[#0C81F3]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Technical Benchmarks</span>
                </button>

                {backlinkAngles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('backlinks')}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'backlinks'
                        ? 'border-[#0C81F3] text-[#0C81F3]'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Backlink Angles ({backlinkAngles.length})</span>
                  </button>
                )}

                {snippetSnatch && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('snippets')}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'snippets'
                        ? 'border-[#0C81F3] text-[#0C81F3]'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-[#EB8988]" />
                    <span>Position 0 Snippet</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: 10X OUTRANK PLAYBOOK */}
            {activeTab === 'playbook' && <OutrankPlaybookTab playbook={outrankPlaybook} />}

            {/* TAB 2: CONTENT GAPS & KEYWORDS */}
            {activeTab === 'gaps' && (
              <ContentGapsTab
                contentGaps={contentGaps}
                keywordOpportunities={keywordOpps}
              />
            )}

            {/* TAB 3: TECHNICAL BENCHMARKS */}
            {activeTab === 'comparison' && (
              <HeadToHeadBenchmark
                competitorSeo={competitorSeo}
                yourSeo={yourSeo}
                competitorUrl={competitorUrl}
                yourUrl={yourUrl}
              />
            )}

            {/* TAB 4: BACKLINK ANGLES */}
            {activeTab === 'backlinks' && (
              <BacklinkAnglesTab backlinkAngles={backlinkAngles} />
            )}

            {/* TAB 5: FEATURED SNIPPET SNATCH */}
            {activeTab === 'snippets' && snippetSnatch && (
              <SnippetSnatchTab snippetSnatch={snippetSnatch} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
