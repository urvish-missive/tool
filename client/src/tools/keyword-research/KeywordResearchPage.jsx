import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResearchKeywordsMutation } from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'
import useToolFields from '../../hooks/useToolFields'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  keywordResearchSchema,
  parseKeywordResearchForm,
} from '../../schemas/keywordResearch.schema'

const BUSINESS_TYPES = [
  'B2B',
  'B2C',
  'E-commerce',
  'SaaS',
  'Agency',
  'Local Business',
  'Publisher',
  'Enterprise',
  'Other',
]

const INTENT_COLORS = {
  Informational: 'bg-blue-50 text-blue-700 border border-blue-200',
  Commercial: 'bg-purple-50 text-purple-700 border border-purple-200',
  Transactional: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Navigational: 'bg-gray-50 text-gray-700 border border-gray-200',
  Comparison: 'bg-amber-50 text-amber-700 border border-amber-200',
  Local: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
}

const SOURCE_BADGES = {
  'Google & Bing': 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-sm',
  Google: 'bg-blue-100 text-blue-800 border border-blue-200 font-medium',
  Bing: 'bg-teal-100 text-teal-800 border border-teal-200 font-medium',
}

function SearchEngineKeywordsSection({ searchEngineKeywords }) {
  const [filter, setFilter] = useState('All')
  const [copiedIdx, setCopiedIdx] = useState(null)

  if (!searchEngineKeywords || searchEngineKeywords.length === 0) return null

  const filtered = searchEngineKeywords.filter((k) => {
    if (filter === 'All') return true
    if (filter === 'Both') return k.source === 'Google & Bing'
    return k.source === filter
  })

  const copyKeyword = (kw, idx) => {
    navigator.clipboard.writeText(kw)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const bothCount = searchEngineKeywords.filter((k) => k.source === 'Google & Bing').length
  const googleCount = searchEngineKeywords.filter((k) => k.source === 'Google').length
  const bingCount = searchEngineKeywords.filter((k) => k.source === 'Bing').length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h3 className="text-lg font-bold text-gray-900">
              Live Search Autocomplete & High-Ranking Queries
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real search queries actively trending on Google and Bing search engines right now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Both', 'Google', 'Bing'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'Both' ? `Google & Bing (${bothCount})` : f === 'Google' ? `Google (${googleCount})` : f === 'Bing' ? `Bing (${bingCount})` : `All (${searchEngineKeywords.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
              <th className="text-left py-2.5 pr-4 font-bold">Search Query</th>
              <th className="text-left py-2.5 pr-4 font-bold">Search Engine</th>
              <th className="text-left py-2.5 pr-4 font-bold">Search Intent</th>
              <th className="text-left py-2.5 pr-4 font-bold">Search Opportunity</th>
              <th className="text-right py-2.5 font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((k, i) => (
              <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                <td className="py-2.5 pr-4 font-medium text-gray-900 flex items-center gap-2">
                  <span className="text-blue-500 text-xs">🔍</span>
                  {k.keyword}
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1 ${
                      SOURCE_BADGES[k.source] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {k.source === 'Google & Bing' && '⭐'}
                    {k.source}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      INTENT_COLORS[k.intent] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {k.intent}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${k.opportunityScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{k.opportunityScore}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => copyKeyword(k.keyword, i)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
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

function CompetitorIntelligenceSection({ competitorInsights }) {
  const competitors = competitorInsights?.competitors || []
  const competitorKeywords = competitorInsights?.competitorKeywords || []

  if (competitors.length === 0 && competitorKeywords.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <h3 className="text-lg font-bold text-gray-900">
            Competitor Keyword Intelligence (What Competitors Use On Their Pages)
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Analyzed top-ranking organic competitor pages on search engines to extract the exact keywords and topics they target.
        </p>
      </div>

      {/* Competitor Keyword Gap Analysis */}
      {competitorKeywords.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-xl border border-amber-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>🎯</span> High-Impact Keywords Used by Top-Ranking Competitors
            </h4>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              Actionable Gap
            </span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Your top search competitors frequently use these terms across their headings, titles, and body content. Add these keywords to your page copy and H2 tags to close the search visibility gap:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {competitorKeywords.map((ck, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-amber-200/60 p-3 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">"{ck.keyword}"</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ck.competitorsCount >= 3
                        ? 'bg-red-100 text-red-700'
                        : ck.competitorsCount >= 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {ck.competitorsCount} competitor{ck.competitorsCount > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{ck.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Ranking Competitor Pages */}
      {competitors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span>🌐</span> Top-Ranking Competitor URLs in Search Results
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {competitors.map((comp, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{comp.position}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{comp.domain}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-blue-700 line-clamp-1">{comp.title}</p>
                {comp.snippet && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {comp.snippet}
                  </p>
                )}
                {comp.keywordsUsedOnPage?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 font-semibold self-center">
                      Keywords on page:
                    </span>
                    {comp.keywordsUsedOnPage.map((kw, j) => (
                      <span
                        key={j}
                        className="bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KeywordTable({ keywords }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('opportunityScore')
  const [sortDir, setSortDir] = useState('desc')
  const [intentFilter, setIntentFilter] = useState('All')
  const [copiedIdx, setCopiedIdx] = useState(null)

  const filtered = keywords
    .filter(
      (k) =>
        (intentFilter === 'All' || k.intent === intentFilter) &&
        k.keyword.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]))

  const copyKeyword = (kw, idx) => {
    navigator.clipboard.writeText(kw)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const exportCSV = () => {
    const header = 'Keyword,Intent,Type,Opportunity,Business Relevance,Reason\n'
    const rows = filtered
      .map(
        (k) =>
          `"${k.keyword}","${k.intent}","${k.type}",${k.opportunityScore},${k.businessRelevance},"${k.reason}"`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'keywords.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const intents = ['All', ...new Set(keywords.map((k) => k.intent))]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
          />
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            {intents.map((i) => (
              <option key={i} value={i}>
                {i === 'All' ? 'All Intents' : i}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 font-medium">{filtered.length} keywords</span>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort('keyword')}
              >
                Keyword {sortKey === 'keyword' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th
                className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort('intent')}
              >
                Intent
              </th>
              <th
                className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort('opportunityScore')}
              >
                Opportunity {sortKey === 'opportunityScore' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th
                className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase cursor-pointer hover:text-gray-700"
                onClick={() => toggleSort('businessRelevance')}
              >
                Relevance
              </th>
              <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase">
                Context / Reason
              </th>
              <th className="text-right py-2.5 font-bold text-gray-500 text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((k, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium text-gray-900">{k.keyword}</td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      INTENT_COLORS[k.intent] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {k.intent}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          k.opportunityScore >= 80
                            ? 'bg-green-500'
                            : k.opportunityScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${k.opportunityScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{k.opportunityScore}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-xs font-bold text-gray-700">{k.businessRelevance}</span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-gray-500 max-w-xs truncate" title={k.reason}>
                  {k.reason || '-'}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => copyKeyword(k.keyword, i)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
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
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
              {i + 1}
            </span>
            {cluster.topic}
          </h4>
          <div className="space-y-1.5">
            {(cluster.keywords || []).map((kw, j) => (
              <div key={j} className="text-sm text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {kw}
              </div>
            ))}
          </div>
          {cluster.contentIdeas?.length > 0 && (
            <div className="border-t border-gray-200 pt-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Content Ideas</span>
              {cluster.contentIdeas.map((idea, j) => (
                <p key={j} className="text-xs text-gray-600 mt-1">
                  💡 {idea}
                </p>
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
        <button onClick={copyAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          {copied ? '✓ Copied All' : 'Copy All'}
        </button>
      </div>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
          >
            <span className="text-purple-500 shrink-0">❓</span>
            {q}
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
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {opp.intent}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {opp.contentType}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {opp.primaryKeyword}
            </span>
          </div>
          {opp.reason && <p className="text-xs text-gray-500 mt-2">{opp.reason}</p>}
        </div>
      ))}
    </div>
  )
}

export default function KeywordResearchPage() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(keywordResearchSchema),
    defaultValues: {
      seedKeyword: '',
      websiteUrl: '',
      businessType: 'B2B',
      preferredProvider: 'openrouter',
    },
  })
  const seedKeyword = watch('seedKeyword')
  const websiteUrl = watch('websiteUrl')
  const [report, setReport] = useState(null)
  const [researchId, setResearchId] = useState(null)

  const [researchKeywords, { isLoading, isError, error, data, reset: resetMutation }] =
    useResearchKeywordsMutation()
  const {
    popupEnabled,
    showPopup,
    handlePopupSubmit,
    handlePopupClose,
    triggerPopup,
  } = useLeadPopup('keyword-research')
  const [pendingForm, setPendingForm] = useState(null)
  const { isFieldEnabled } = useToolFields('keyword-research')

  useEffect(() => {
    if (data?.report) {
      setReport(data.report)
      setResearchId(data.researchId)
      setTimeout(
        () => document.getElementById('kr-report')?.scrollIntoView({ behavior: 'smooth' }),
        100
      )
    }
  }, [data])

  const runResearch = useCallback(
    (form) => {
      const parsed = parseKeywordResearchForm(form)
      if (!parsed.success) return
      researchKeywords({
        seedKeyword: parsed.data.seedKeyword || undefined,
        websiteUrl: parsed.data.websiteUrl || undefined,
        businessType: parsed.data.businessType,
        preferredProvider: parsed.data.preferredProvider,
      })
    },
    [researchKeywords]
  )

  const onFormValid = (data) => {
    if (popupEnabled) {
      setPendingForm(data)
      triggerPopup()
      return
    }
    runResearch(data)
  }

  const handleReset = () => {
    setReport(null)
    setResearchId(null)
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const errorMessage = error?.data?.error || (isError ? 'Research failed. Please try again.' : '')

  const intentCounts = {}
  ;(report?.keywords || []).forEach((k) => {
    intentCounts[k.intent] = (intentCounts[k.intent] || 0) + 1
  })

  return (
    <div>
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          if (pendingForm) runResearch(pendingForm)
          setPendingForm(null)
        }}
        toolSlug="keyword-research"
        title="Get Your Free Keyword Research"
        subtitle="Enter your details to unlock the Keyword Research tool"
      />

      {/* Hero */}
      <section className="relative !pt-36 overflow-hidden py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">
            Free Tool
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">Free AI </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Keyword Research
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover real-time Google & Bing autocomplete queries, competitor focus keywords, search intent, topic clusters, and content roadmaps in any language.
          </p>
          <p className="mt-3 text-sm text-gray-400">No credit card required.</p>
        </div>
      </section>

      {/* Form / Loading / Report */}
      <section className="py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {!report && !isLoading && (
            <form
              onSubmit={handleSubmit(onFormValid)}
              className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5 max-w-2xl mx-auto"
            >
              {isFieldEnabled('seedKeyword') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Seed Keyword
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    {...register('seedKeyword')}
                    placeholder="e.g. call center software, logistique e-commerce, etc."
                    className={`w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.seedKeyword ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'
                    }`}
                  />
                  {errors.seedKeyword && (
                    <p className="mt-1 text-xs text-red-600">{errors.seedKeyword.message}</p>
                  )}
                </div>
              )}

              {isFieldEnabled('websiteUrl') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Website URL (optional)
                  </label>
                  <input
                    type="text"
                    {...register('websiteUrl')}
                    placeholder="example.com or https://example.com"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      errors.websiteUrl ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'
                    }`}
                  />
                  {errors.websiteUrl && (
                    <p className="mt-1 text-xs text-red-600">{errors.websiteUrl.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    Language and country target will be auto-detected from your keyword or website.
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {isFieldEnabled('businessType') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Business Type
                    </label>
                    <select
                      {...register('businessType')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white"
                    >
                      {BUSINESS_TYPES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Controller
                  control={control}
                  name="preferredProvider"
                  render={({ field }) => (
                    <ModelSelector value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 cursor-pointer"
              >
                Generate Keyword Ideas
              </button>
            </form>
          )}

          {isLoading && (
            <UnifiedToolLoader
              title="Mining High-Ranking Google, Bing & Competitor Keywords..."
              subtitle={`Scraping live search autocomplete signals and competitor page keywords for "${seedKeyword || websiteUrl}".`}
              steps={[
                'Auto-detecting language script and target search market',
                'Scraping real-time Google & Bing search autocomplete queries',
                'Extracting top-ranking competitor pages & on-page keywords',
                'Categorizing search intent (Commercial, Transactional, Informational)',
                'Generating semantic topic clusters and content opportunities',
              ]}
            />
          )}

          {isError && !isLoading && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900">Research Failed</h3>
              <p className="text-gray-600 mt-2">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ===== REPORT ===== */}
          {report && (
            <div id="kr-report" className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Keyword Report for "{report.seedKeyword}"
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      🌐 {report.detectedLanguage || 'English'} ({report.detectedRegion || 'Global'})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated with real-time Google & Bing live search scraping and competitor page intelligence.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg self-start sm:self-auto cursor-pointer"
                >
                  ← New Research
                </button>
              </div>

              {/* Summary */}
              {report.summary && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-gray-700 text-sm leading-relaxed">
                  {report.summary}
                </div>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  ['Total Keywords', report.keywords?.length || 0, '🔢'],
                  ['Live Google/Bing', report.searchEngineKeywords?.length || 0, '⚡'],
                  ['Competitor Terms', report.competitorInsights?.competitorKeywords?.length || 0, '⚔️'],
                  ...Object.entries(intentCounts).map(([intent, count]) => [
                    intent,
                    count,
                    INTENT_COLORS[intent] ? '🎯' : '📊',
                  ]),
                ].slice(0, 6).map(([label, count, icon]) => (
                  <div
                    key={label}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center"
                  >
                    <span className="text-2xl block mb-1">{icon}</span>
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500 truncate">{label}</div>
                  </div>
                ))}
              </div>

              {/* 1. Live Google & Bing Search Section */}
              <SearchEngineKeywordsSection searchEngineKeywords={report.searchEngineKeywords} />

              {/* 2. Competitor Page Keyword Intelligence Section */}
              <CompetitorIntelligenceSection competitorInsights={report.competitorInsights} />

              {/* 3. All Keywords Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Complete Master Keyword List</h3>
                <KeywordTable keywords={report.keywords || []} />
              </div>

              {/* 4. Topic Clusters */}
              {report.topicClusters?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🗂️ Topic Clusters & Content Hubs</h3>
                  <TopicClusterViz clusters={report.topicClusters} />
                </div>
              )}

              {/* 5. Question Keywords */}
              {report.questionKeywords?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">❓ Question Keywords (PAA)</h3>
                  <QuestionKeywords questions={report.questionKeywords} />
                </div>
              )}

              {/* 6. Content Opportunities */}
              {report.contentOpportunities?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📝 High-Intent Content Opportunities</h3>
                  <ContentOpportunities opportunities={report.contentOpportunities} />
                </div>
              )}

              {/* 7. Quick Wins & Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                {report.quickWins?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>⚡</span> Quick Wins
                    </h3>
                    <ul className="space-y-2">
                      {report.quickWins.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.recommendations?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>💡</span> Strategic Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {report.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-500 font-bold mt-0.5 shrink-0">→</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C81F3] via-[#67A7FF] to-[#EB8988]" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">
                    Missive Digital SEO
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    Ready to Outrank Competitors on Google & Bing?
                  </h3>
                  <p className="mt-3 text-white/90 max-w-lg mx-auto text-sm">
                    Our organic search specialists build full-funnel keyword strategies, content roadmaps, and topical authority to dominate your industry rankings.
                  </p>
                </div>
              </div>

              {/* Lead Form */}
              <DynamicLeadForm
                toolSlug="keyword-research"
                relatedIdField="researchId"
                relatedIdValue={researchId}
                title="Get My Free SEO Strategy & Keyword Roadmap"
                subtitle="Our experts will review your keyword opportunities and deliver a custom ranking action plan."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
