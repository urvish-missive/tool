import { useState, useEffect, useCallback } from 'react'
import { useResearchKeywordsMutation } from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'
import useToolFields from '../../hooks/useToolFields'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'UAE', 'Singapore', 'Other']
const BUSINESS_TYPES = ['B2B', 'B2C', 'E-commerce', 'SaaS', 'Agency', 'Local Business', 'Publisher', 'Enterprise', 'Other']
const LOADING_STEPS = ['understand', 'intents', 'longtail', 'clusters', 'content', 'report']

const INTENT_COLORS = {
  Informational: 'bg-blue-100 text-blue-700',
  Commercial: 'bg-purple-100 text-purple-700',
  Transactional: 'bg-emerald-100 text-emerald-700',
  Navigational: 'bg-gray-100 text-gray-700',
  Comparison: 'bg-amber-100 text-amber-700',
  Local: 'bg-cyan-100 text-cyan-700',
}

function KeywordTable({ keywords }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('opportunityScore')
  const [sortDir, setSortDir] = useState('desc')
  const [intentFilter, setIntentFilter] = useState('All')
  const [copiedIdx, setCopiedIdx] = useState(null)

  const filtered = keywords
    .filter(k => (intentFilter === 'All' || k.intent === intentFilter) && k.keyword.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])

  const copyKeyword = (kw, idx) => {
    navigator.clipboard.writeText(kw)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const exportCSV = () => {
    const header = 'Keyword,Intent,Type,Opportunity,Business Relevance,Reason\n'
    const rows = filtered.map(k => `"${k.keyword}","${k.intent}","${k.type}",${k.opportunityScore},${k.businessRelevance},"${k.reason}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'keywords.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const intents = ['All', ...new Set(keywords.map(k => k.intent))]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Search keywords..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48" />
        <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
          {intents.map(i => <option key={i}>{i}</option>)}
        </select>
        <button onClick={exportCSV} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors">
          Export CSV
        </button>
        <span className="text-xs text-gray-400">{filtered.length} keywords</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('keyword')}>Keyword {sortKey === 'keyword' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
              <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('intent')}>Intent</th>
              <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('opportunityScore')}>Opportunity {sortKey === 'opportunityScore' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
              <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('businessRelevance')}>Relevance</th>
              <th className="text-left py-2.5 font-bold text-gray-500 text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((k, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium text-gray-900">{k.keyword}</td>
                <td className="py-2.5 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${INTENT_COLORS[k.intent] || 'bg-gray-100 text-gray-700'}`}>{k.intent}</span></td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${k.opportunityScore >= 80 ? 'bg-green-500' : k.opportunityScore >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${k.opportunityScore}%` }} /></div>
                    <span className="text-xs font-bold">{k.opportunityScore}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4"><span className="text-xs font-bold">{k.businessRelevance}</span></td>
                <td className="py-2.5">
                  <button onClick={() => copyKeyword(k.keyword, i)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    {copiedIdx === i ? '✓ Copied' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TopicClusterViz({ clusters }) {
  if (!clusters?.length) return null
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clusters.map((cluster, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">{i + 1}</span>
            {cluster.topic}
          </h4>
          <div className="space-y-1.5 mb-3">
            {(cluster.keywords || []).map((kw, j) => (
              <div key={j} className="text-sm text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{kw}
              </div>
            ))}
          </div>
          {cluster.contentIdeas?.length > 0 && (
            <div className="border-t border-gray-200 pt-2 mt-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Content Ideas</span>
              {cluster.contentIdeas.map((idea, j) => (
                <p key={j} className="text-xs text-gray-600 mt-1">💡 {idea}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function QuestionKeywords({ questions }) {
  const [copied, setCopied] = useState(false)
  if (!questions?.length) return null

  const copyAll = () => {
    navigator.clipboard.writeText(questions.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">{questions.length} questions</span>
        <button onClick={copyAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">{copied ? '✓ Copied All' : 'Copy All'}</button>
      </div>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-purple-500 shrink-0">❓</span>{q}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentOpportunities({ opportunities }) {
  if (!opportunities?.length) return null
  return (
    <div className="space-y-3">
      {opportunities.map((opp, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 text-sm">{opp.title}</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{opp.intent}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{opp.contentType}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{opp.primaryKeyword}</span>
          </div>
          {opp.reason && <p className="text-xs text-gray-500 mt-2">{opp.reason}</p>}
        </div>
      ))}
    </div>
  )
}



export default function KeywordResearchPage() {
  const [seedKeyword, setSeedKeyword] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [country, setCountry] = useState('United States')
  const [businessType, setBusinessType] = useState('B2B')
  const [aiModel, setAiModel] = useState('openrouter')
  const [validationError, setValidationError] = useState('')
  const [loadingStep, setLoadingStep] = useState('understand')
  const [report, setReport] = useState(null)
  const [researchId, setResearchId] = useState(null)

  const [researchKeywords, { isLoading, isError, error, data, reset: resetMutation }] = useResearchKeywordsMutation()
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose, triggerPopup } = useLeadPopup('keyword-research')
  const [pendingForm, setPendingForm] = useState(null)
  const { isFieldEnabled } = useToolFields('keyword-research')

  useEffect(() => {
    if (!isLoading) return
    let idx = 0
    const interval = setInterval(() => { idx++; if (idx < LOADING_STEPS.length) setLoadingStep(LOADING_STEPS[idx]) }, 3000)
    return () => clearInterval(interval)
  }, [isLoading])

  useEffect(() => {
    if (data?.report) {
      setReport(data.report)
      setResearchId(data.researchId)
      setTimeout(() => document.getElementById('kr-report')?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [data])

  const runResearch = useCallback((form) => {
    researchKeywords({
      seedKeyword: form.seedKeyword?.trim() || undefined,
      websiteUrl: form.websiteUrl?.trim() || undefined,
      country: form.country,
      businessType: form.businessType,
      preferredProvider: form.aiModel,
    })
  }, [researchKeywords])

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')
    const hasKeyword = isFieldEnabled('seedKeyword') && seedKeyword.trim().length >= 2
    const hasUrl = isFieldEnabled('websiteUrl') && websiteUrl.trim().length > 0
    if (!hasKeyword && !hasUrl) { setValidationError('Please enter a seed keyword or website URL (at least one is required).'); return }
    if (hasKeyword && seedKeyword.trim().length < 2) { setValidationError('Keyword must be at least 2 characters.'); return }
    if (hasUrl) {
      try { new URL(websiteUrl.trim()) } catch { setValidationError('Please enter a valid website URL (e.g. https://example.com)'); return }
    }
    if (popupEnabled) {
      setPendingForm({ seedKeyword, websiteUrl, country, businessType, aiModel })
      triggerPopup()
      return
    }
    runResearch({ seedKeyword, websiteUrl, country, businessType, aiModel })
  }

  const handleReset = () => {
    setSeedKeyword('')
    setWebsiteUrl('')
    setReport(null)
    setResearchId(null)
    setValidationError('')
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const errorMessage = error?.data?.error || (isError ? 'Research failed. Please try again.' : '')

  const intentCounts = {}
  ;(report?.keywords || []).forEach(k => { intentCounts[k.intent] = (intentCounts[k.intent] || 0) + 1 })

  return (
    <div>
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => { handlePopupSubmit(); if (pendingForm) runResearch(pendingForm); setPendingForm(null) }}
        toolSlug="keyword-research"
        title="Get Your Free Keyword Research"
        subtitle="Enter your details to unlock the Keyword Research tool"
      />
      {/* Hero */}
      <section className="relative !pt-36 overflow-hidden py-16 sm:py-20 lg:py-24">          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">Free AI </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Keyword Research</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover keyword ideas, search intent, long-tail opportunities, topic clusters and content ideas for your SEO strategy.
          </p>
          <p className="mt-3 text-sm text-gray-400">No credit card required.</p>
        </div>
      </section>

      {/* Form / Loading / Report */}
      <section className="py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {!report && !isLoading && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5 max-w-2xl mx-auto">
              {isFieldEnabled('seedKeyword') && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Seed Keyword</label>
                <input type="text" maxLength={100} value={seedKeyword} onChange={e => setSeedKeyword(e.target.value)}
                  placeholder="e.g. enterprise SEO" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              )}
              {isFieldEnabled('websiteUrl') && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Website URL (optional)</label>
                <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              )}
              <div className="grid sm:grid-cols-3 gap-4">
                {isFieldEnabled('country') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                )}
                {isFieldEnabled('businessType') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Business Type</label>
                  <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
                    {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                )}
                <ModelSelector value={aiModel} onChange={setAiModel} />
              </div>
              {validationError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{validationError}</div>}
              <button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25">
                Generate Keyword Ideas
              </button>
            </form>
          )}

          {isLoading && (
            <UnifiedToolLoader
              title="Uncovering High-Intent Keyword Opportunities..."
              subtitle={`Mining search volumes, intent taxonomy, and long-tail cluster ideas for "${seedKeyword || websiteUrl}".`}
              steps={[
                'Understanding seed entity & competitive landscape',
                'Expanding search query variations & long-tail phrases',
                'Categorizing search intent (Informational, Commercial, Transactional)',
                'Estimating search volume & ranking difficulty scores',
                'Grouping keywords into actionable topic clusters',
              ]}
            />
          )}

          {isError && !isLoading && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900">Research Failed</h3>
              <p className="text-gray-600 mt-2">{errorMessage}</p>
              <button onClick={handleReset} className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">Try Again</button>
            </div>
          )}

          {/* ===== REPORT ===== */}
          {report && (
            <div id="kr-report" className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Keyword Research Report</h2>
                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg">← New Research</button>
              </div>

              {/* Summary */}
              <p className="text-gray-600">{report.summary}</p>

              {/* Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  ['Total Keywords', report.keywords?.length || 0, '🔢'],
                  ...Object.entries(intentCounts).map(([intent, count]) => [intent, count, INTENT_COLORS[intent] ? '🎯' : '📊']),
                ].map(([label, count, icon]) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <span className="text-2xl block mb-1">{icon}</span>
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Keyword Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 All Keywords</h3>
                <KeywordTable keywords={report.keywords || []} />
              </div>

              {/* Long-Tail */}
              {report.longTailKeywords?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Long-Tail Opportunities</h3>
                  <div className="space-y-2">
                    {report.longTailKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-violet-500 shrink-0">🔑</span>{kw}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {report.questionKeywords?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">❓ Question Keywords</h3>
                  <QuestionKeywords questions={report.questionKeywords} />
                </div>
              )}

              {/* Topic Clusters */}
              {report.topicClusters?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🗂️ Topic Clusters</h3>
                  <TopicClusterViz clusters={report.topicClusters} />
                </div>
              )}

              {/* Content Opportunities */}
              {report.contentOpportunities?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Content Opportunities</h3>
                  <ContentOpportunities opportunities={report.contentOpportunities} />
                </div>
              )}

              {/* Quick Wins */}
              {report.quickWins?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Wins</h3>
                  <ul className="space-y-2">
                    {report.quickWins.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 mt-0.5 shrink-0">✓</span>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Recommendations</h3>
                  <ul className="space-y-2">
                    {report.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-blue-500 mt-0.5 shrink-0">→</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Opportunity scores are internal tool estimates, not Google keyword difficulty scores. Search volume is not available in this free tool.
              </p>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C81F3] via-[#67A7FF] to-[#EB8988]" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">Expert Help</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Want to turn these keywords into growth?</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">Our SEO experts can build a keyword strategy, content roadmap and organic growth plan for your business.</p>
                </div>
              </div>

              {/* Lead Form */}
              <DynamicLeadForm
                toolSlug="keyword-research"
                relatedIdField="researchId"
                relatedIdValue={researchId}
                title="Get My Free SEO Strategy"
                subtitle="Our experts will review your keyword research and share a personalized growth plan."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
