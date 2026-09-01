import { useState, useEffect, useCallback } from 'react'
import { useResearchKeywordsMutation, useSubmitLeadMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'

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

function LoadingKeywords({ currentStep }) {
  const idx = LOADING_STEPS.indexOf(currentStep)
  const steps = [
    { key: 'understand', label: 'Understanding seed keyword' },
    { key: 'intents', label: 'Identifying search intents' },
    { key: 'longtail', label: 'Generating long-tail ideas' },
    { key: 'clusters', label: 'Building topic clusters' },
    { key: 'content', label: 'Creating content opportunities' },
    { key: 'report', label: 'Preparing report' },
  ]
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center max-w-md mx-auto">
      <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Generating keyword opportunities...</h3>
      <p className="text-sm text-gray-500 mb-6">This may take 15-30 seconds</p>
      <div className="space-y-3 text-left">
        {steps.map((step, i) => {
          const status = i < idx ? 'done' : i === idx ? 'active' : 'pending'
          return (
            <div key={step.key} className="flex items-center gap-3">
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

  const [researchKeywords, { isLoading, isError, error, data }] = useResearchKeywordsMutation()

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')
    const hasKeyword = seedKeyword.trim().length >= 2
    const hasUrl = websiteUrl.trim().length > 0
    if (!hasKeyword && !hasUrl) { setValidationError('Please enter a seed keyword or website URL (at least one is required).'); return }
    if (hasKeyword && seedKeyword.trim().length < 2) { setValidationError('Keyword must be at least 2 characters.'); return }
    if (hasUrl) {
      try { new URL(websiteUrl.trim()) } catch { setValidationError('Please enter a valid website URL (e.g. https://example.com)'); return }
    }
    researchKeywords({ seedKeyword: seedKeyword.trim() || undefined, websiteUrl: websiteUrl.trim() || undefined, country, businessType, preferredProvider: aiModel })
  }

  const handleReset = () => { setReport(null); setResearchId(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const errorMessage = error?.data?.error || (isError ? 'Research failed. Please try again.' : '')

  const intentCounts = {}
  ;(report?.keywords || []).forEach(k => { intentCounts[k.intent] = (intentCounts[k.intent] || 0) + 1 })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
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
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Seed Keyword</label>
                <input type="text" maxLength={100} value={seedKeyword} onChange={e => setSeedKeyword(e.target.value)}
                  placeholder="e.g. enterprise SEO" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Website URL (optional)</label>
                <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Business Type</label>
                  <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
                    {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <ModelSelector value={aiModel} onChange={setAiModel} />
              </div>
              {validationError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{validationError}</div>}
              <button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25">
                Generate Keyword Ideas
              </button>
            </form>
          )}

          {isLoading && <LoadingKeywords currentStep={loadingStep} />}

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
              <KeywordLeadForm researchId={researchId} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function KeywordLeadForm({ researchId }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', phone: '' })
  const [submitLead, { isLoading }] = useSubmitLeadMutation()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    try { await submitLead({ ...form, researchId, source: 'keyword-research' }).unwrap(); setSubmitted(true) }
    catch (err) { setError(err?.data?.error || 'Something went wrong.') }
  }

  if (submitted) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
      <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
      <p className="text-green-700 mt-1">We'll be in touch within 24 hours.</p>
    </div>
  )

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] rounded-t-2xl" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Get My Free SEO Strategy</h3>
      <p className="text-sm text-gray-600 mb-6">Our experts will review your keyword research and share a personalized growth plan.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input name="name" type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Email *</label><input name="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input name="company" type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input name="website" type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input name="phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25">
          {isLoading ? 'Submitting...' : 'Get My SEO Strategy'}
        </button>
      </form>
    </div>
  )
}
