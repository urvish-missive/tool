import { useMemo, useState } from 'react'
import { useCheckRankMutation } from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  Search,
  Globe,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Layers,
  Sparkles,
  Smartphone,
  Monitor,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  ArrowUpRight,
  Compass,
} from 'lucide-react'

const LOADING_STEPS = [
  'Connecting to localized Google search node',
  'Scanning top 100 SERP organic listings & search features',
  'Matching domain footprint and calculating ranking position',
  'Auditing top 10 competitors and SERP feature winners',
  'Generating actionable 10x outrank roadmap & recommendations',
]

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', domain: 'google.com' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', domain: 'google.co.uk' },
  { code: 'IN', name: 'India', flag: '🇮🇳', domain: 'google.co.in' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', domain: 'google.ca' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', domain: 'google.com.au' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', domain: 'google.de' },
  { code: 'FR', name: 'France', flag: '🇫🇷', domain: 'google.fr' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', domain: 'google.ae' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', domain: 'google.com.sg' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', domain: 'google.nl' },
]

const FAQ_ITEMS = [
  {
    q: 'How accurate is this Google Rank Checker?',
    a: 'Our rank checker scans real-time Google search results without personalized history or localized cookie bias. It accurately reflects what prospective searchers see when querying your target keywords in your chosen country and device.',
  },
  {
    q: 'Why do search rankings fluctuate between devices (Desktop vs Mobile)?',
    a: 'Google operates a mobile-first index. Mobile search results frequently differ from desktop results due to mobile page experience signals, viewport responsiveness, local pack prominence, and user proximity.',
  },
  {
    q: 'How can I outrank the competitors currently occupying positions #1 to #3?',
    a: 'Review the 10x Outrank Playbook generated for your keyword. Focus on closing content depth gaps, matching exact search intent, incorporating missing entity schema markup, and earning authoritative topical backlinks.',
  },
  {
    q: 'What is a good organic CTR for ranking positions on Google?',
    a: 'Position #1 typically captures 25%–35% of all clicks. Positions #2 and #3 capture roughly 15% and 10% respectively. By page 2 (positions 11+), total organic CTR drops to less than 1%.',
  },
  {
    q: 'How often should I monitor Google keyword rankings?',
    a: 'We recommend monitoring core commercial and transactional keywords weekly, or immediately after launching significant on-page content updates, website redesigns, or algorithm rollouts.',
  },
]

export default function GoogleRankCheckerPage() {
  // Input mode: 'single' | 'batch'
  const [inputMode, setInputMode] = useState('single')

  // Form Inputs
  const [domain, setDomain] = useState('')
  const [keyword, setKeyword] = useState('')
  const [batchKeywords, setBatchKeywords] = useState('')
  const [country, setCountry] = useState('US')
  const [device, setDevice] = useState('desktop')

  // UI Tabs & State
  const [activeTab, setActiveTab] = useState('competitors') // 'competitors' | 'features' | 'playbook' | 'paa' | 'batch'
  const [copied, setCopied] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [competitorSearch, setCompetitorSearch] = useState('')

  // API Mutation
  const [checkRank, { isLoading, data: rankData, error: apiError }] = useCheckRankMutation()

  // Lead Popup Integration
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('google-rank-checker')
  const [pendingPayload, setPendingPayload] = useState(null)

  const errorMessage = apiError?.data?.error || null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!domain.trim()) return

    const payload = {
      domain: domain.trim(),
      country,
      device,
    }

    if (inputMode === 'batch') {
      if (!batchKeywords.trim()) return
      payload.keywords = batchKeywords
    } else {
      if (!keyword.trim()) return
      payload.keyword = keyword.trim()
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
    } else {
      checkRank(payload)
    }
  }

  const handleModalSuccess = () => {
    handlePopupSubmit()
    if (pendingPayload) {
      checkRank(pendingPayload)
      setPendingPayload(null)
    }
  }

  // Copy helpers
  const copySummary = () => {
    if (!rankData) return
    const posText = rankData.position ? `#${rankData.position}` : 'Not in top 100'
    const text = [
      `Google Rank Report for ${rankData.domain}`,
      `Keyword: "${rankData.keyword}" (${rankData.countryName}, ${rankData.device})`,
      `Position: ${posText}`,
      `Search Intent: ${rankData.searchIntent} | Difficulty: ${rankData.difficulty}/100`,
      `Estimated CTR: ${rankData.estimatedCtr}`,
      rankData.rankingUrl ? `Ranking URL: ${rankData.rankingUrl}` : '',
      `Tested on: ${new Date().toLocaleDateString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  // Download CSV report
  const downloadCsv = () => {
    if (!rankData) return
    if (rankData.isBatch && rankData.batchKeywords) {
      const headers = 'Keyword,Position,Search Intent,Difficulty,Search Volume,Ranking URL\n'
      const rows = rankData.batchKeywords
        .map(
          (b) =>
            `"${b.keyword}",${b.position ? b.position : 'Not in top 100'},"${b.searchIntent || ''}",${b.difficulty || ''},"${b.volume || ''}","${b.rankingUrl || ''}"`
        )
        .join('\n')
      const blob = new Blob([headers + rows], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `google-ranks-${rankData.domain}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const headers = 'Position,Competitor Domain,Page Title,URL,Content Type\n'
      const rows = (rankData.topCompetitors || [])
        .map(
          (c) =>
            `${c.position},"${c.domain}","${(c.title || '').replace(/"/g, '""')}","${c.url}","${c.contentType || ''}"`
        )
        .join('\n')
      const blob = new Blob([headers + rows], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `serp-competitors-${rankData.keyword.replace(/\s+/g, '-')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Filtered competitors
  const filteredCompetitors = useMemo(() => {
    if (!rankData?.topCompetitors) return []
    if (!competitorSearch.trim()) return rankData.topCompetitors
    const q = competitorSearch.toLowerCase()
    return rankData.topCompetitors.filter(
      (c) => (c.domain || '').toLowerCase().includes(q) || (c.title || '').toLowerCase().includes(q)
    )
  }, [rankData, competitorSearch])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={handleModalSuccess}
        toolSlug="google-rank-checker"
        title="Unlock Free Google Rank Checker"
        subtitle="Check real-time Google search rankings, uncover competitor rankings, and get custom outrank roadmaps."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Himani's SEO Tools • Missive Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Google </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Rank Checker
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Instantly discover where your domain ranks on Google for any keyword. Uncover top 10
            competitors, analyze SERP features, and get an actionable playbook to claim the #1 spot.
          </p>

          {/* Mode Switcher */}
          <div className="mt-8 inline-flex p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm gap-1">
            <button
              onClick={() => setInputMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                inputMode === 'single'
                  ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Single Keyword Check</span>
            </button>

            <button
              onClick={() => setInputMode('batch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                inputMode === 'batch'
                  ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Batch Keywords Check</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Search Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold">Rank Check Notice</p>
              <p className="text-xs sm:text-sm mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {isLoading && (
          <UnifiedToolLoader
            title="Scanning Google SERP & Checking Search Rankings..."
            subtitle="Evaluating search listings, matching target domain, and synthesizing competitor intelligence."
            steps={LOADING_STEPS}
          />
        )}

        {!isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 mb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Domain Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      Target Domain / Website <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setDomain('missivedigital.com')}
                      className="text-xs text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                    >
                      Sample Domain
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. missivedigital.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Single Keyword Input */}
                {inputMode === 'single' ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-800">
                        Target Search Keyword <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setKeyword('missive digital')}
                        className="text-xs text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                      >
                        Sample Keyword
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. b2b seo agency"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-800">
                        Batch Keywords (one per line) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBatchKeywords(
                            'himani kankaria\nseo audit tool\nkeyword research tool\nfaq generator'
                          )
                        }
                        className="text-xs text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                      >
                        Sample Keywords
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="himani kankaria&#10;seo website audit&#10;keyword research tool"
                      value={batchKeywords}
                      onChange={(e) => setBatchKeywords(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Country & Device Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Google Search Market / Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.domain})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Device Simulation
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDevice('desktop')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        device === 'desktop'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevice('mobile')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        device === 'mobile'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold rounded-2xl shadow-lg shadow-[#0C81F3]/25 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Check Google Rank</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* RESULTS DASHBOARD */}
        {rankData && !isLoading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HERO RANK BADGE CARD */}
            <div className="relative bg-gradient-to-br from-slate-900 via-[#101b33] to-[#1a1429] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0C81F3]/20 via-[#EB8988]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                      {rankData.countryName} ({rankData.device})
                    </span>
                    {rankData.scrapedLive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        Live SERP Verified
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Ranking for{' '}
                    <span className="bg-gradient-to-r from-[#67A7FF] to-[#F7B7B3] bg-clip-text text-transparent">
                      "{rankData.keyword}"
                    </span>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300">
                    Target Domain:{' '}
                    <strong className="text-white font-mono">{rankData.domain}</strong>
                  </p>
                </div>

                {/* Hero Position Pill */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] flex flex-col items-center justify-center font-extrabold text-white shadow-lg">
                    {rankData.position ? (
                      <>
                        <span className="text-2xl leading-none">#{rankData.position}</span>
                        <span className="text-[9px] uppercase tracking-wider mt-0.5">Rank</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-6 h-6" />
                        <span className="text-[8px] uppercase tracking-wider mt-0.5">&gt;100</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-300 font-medium">
                      Search Position Status
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {rankData.position === 1
                        ? '🏆 Position #1 Winner'
                        : rankData.position <= 3
                          ? '🥈 Top 3 (Above the Fold)'
                          : rankData.position <= 10
                            ? '📈 First Page of Google'
                            : rankData.position <= 20
                              ? '⚠️ Striking Distance (Page 2)'
                              : '🎯 Not in Top 100'}
                    </p>
                    <a
                      href={rankData.liveSearchUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline font-semibold"
                    >
                      <span>View live search on Google</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* KPI Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-center">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Search Intent
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                    {rankData.searchIntent}
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Keyword Difficulty
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                    {rankData.difficulty} <span className="text-xs text-slate-400">/ 100</span>
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Search Volume Tier
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                    {rankData.searchVolumeTier}
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Est. Organic CTR
                  </span>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                    {rankData.estimatedCtr}
                  </p>
                </div>
              </div>
            </div>

            {/* GOOGLE SERP SNIPPET PREVIEW CARD */}
            {rankData.rankingUrl && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Live Google SERP Snippet Preview</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Rank #{rankData.position || 'N/A'}
                  </span>
                </div>

                {/* Authentic Google Snippet Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 max-w-2xl font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {rankData.domain.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{rankData.domain}</span>
                    <span className="text-slate-400">›</span>
                    <span className="text-slate-500 truncate max-w-xs">{rankData.rankingUrl}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                    {rankData.rankingTitle}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {rankData.rankingSnippet ||
                      `Discover high-performance solutions from ${rankData.domain} tailored for ${rankData.keyword}. Explore comprehensive industry expertise and proven outcomes.`}
                  </p>
                </div>
              </div>
            )}

            {/* TABBED SECTIONS CONTAINER */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Tab Navigation Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setActiveTab('competitors')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'competitors'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Top 10 Competitors ({rankData.topCompetitors?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('playbook')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'playbook'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    10x Outrank Playbook
                  </button>

                  <button
                    onClick={() => setActiveTab('features')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'features'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    SERP Features
                  </button>

                  <button
                    onClick={() => setActiveTab('paa')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'paa'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    People Also Ask ({rankData.peopleAlsoAsk?.length || 0})
                  </button>

                  {rankData.isBatch && (
                    <button
                      onClick={() => setActiveTab('batch')}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        activeTab === 'batch'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Batch Keywords ({rankData.batchKeywords?.length || 0})
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copySummary}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  <button
                    onClick={downloadCsv}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Top 10 SERP Competitors */}
              {activeTab === 'competitors' && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Comparing against the top search results currently ranking on Google for{' '}
                      <strong>"{rankData.keyword}"</strong>.
                    </p>
                    <input
                      type="text"
                      placeholder="Filter competitor..."
                      value={competitorSearch}
                      onChange={(e) => setCompetitorSearch(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0C81F3]"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4">Competitor Domain</th>
                          <th className="py-3 px-4">Title Tag & Snippet</th>
                          <th className="py-3 px-3">Content Type</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredCompetitors.map((comp, idx) => {
                          const isTarget =
                            comp.isTargetDomain || rankData.position === comp.position
                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                isTarget
                                  ? 'bg-blue-50/80 font-semibold border-l-4 border-[#0C81F3]'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                    comp.position === 1
                                      ? 'bg-amber-400 text-amber-950 shadow-sm'
                                      : comp.position <= 3
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {comp.position}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{comp.domain}</span>
                                  {isTarget && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#0C81F3] text-white text-[10px] font-bold">
                                      Your Site
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 max-w-md">
                                <p className="font-semibold text-slate-900 truncate">
                                  {comp.title}
                                </p>
                                {comp.snippet && (
                                  <p className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">
                                    {comp.snippet}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                  {comp.contentType || 'Landing Page'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {comp.url && (
                                  <a
                                    href={comp.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0C81F3] text-xs font-semibold"
                                  >
                                    <span>Visit</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: 10x Outrank Playbook */}
              {activeTab === 'playbook' && (
                <div className="p-6 space-y-6">
                  {rankData.competitiveGapAnalysis && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950">
                      <strong className="font-bold text-amber-900">
                        Why #1 Is Outranking You:{' '}
                      </strong>
                      <span>{rankData.competitiveGapAnalysis}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-slate-900">
                      Tailored Strategy to Reach Google Position #1
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rankData.outrankPlaybook.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                              {step.step || idx + 1}
                            </span>
                            {step.impact && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  step.impact === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : step.impact === 'High'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {step.impact} Impact
                              </span>
                            )}
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SERP Features */}
              {activeTab === 'features' && (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500">
                    Search engine result page (SERP) features occupying prime screen real estate
                    above standard organic listings.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rankData.serpFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{feat.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              feat.present
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {feat.present ? 'Active on SERP' : 'Standard'}
                          </span>
                        </div>
                        {feat.ownedBy && (
                          <p className="text-xs text-slate-500">
                            <strong>Currently Held By:</strong> {feat.ownedBy}
                          </p>
                        )}
                        {feat.howToWin && (
                          <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                            <strong className="text-slate-900 font-semibold">
                              How to Win It:{' '}
                            </strong>
                            <span>{feat.howToWin}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: People Also Ask (PAA) */}
              {activeTab === 'paa' && (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500">
                    Add these high-intent customer questions and answers to your page to win Google
                    FAQ rich results and conversational search queries.
                  </p>

                  <div className="space-y-3">
                    {rankData.peopleAlsoAsk.map((paa, idx) => (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-[#0C81F3]">Q:</span>
                          <span>{paa.question}</span>
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                          {paa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Batch Keywords Table */}
              {activeTab === 'batch' && rankData.batchKeywords && (
                <div className="p-6 space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Keyword</th>
                          <th className="py-3 px-4">Google Rank</th>
                          <th className="py-3 px-3">Search Intent</th>
                          <th className="py-3 px-3">Difficulty</th>
                          <th className="py-3 px-3">Search Volume</th>
                          <th className="py-3 px-4">Ranking URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {rankData.batchKeywords.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{b.keyword}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  b.position && b.position <= 3
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.position && b.position <= 10
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {b.position ? `#${b.position}` : '>100'}
                              </span>
                            </td>
                            <td className="py-3 px-3">{b.searchIntent || '-'}</td>
                            <td className="py-3 px-3">
                              {b.difficulty ? `${b.difficulty}/100` : '-'}
                            </td>
                            <td className="py-3 px-3">{b.volume || '-'}</td>
                            <td className="py-3 px-4 font-mono text-[11px] max-w-xs truncate">
                              {b.rankingUrl || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Compass className="w-4 h-4 text-[#0C81F3]" />
                <span>
                  Rank check completed for <strong>{rankData.domain}</strong> on Google{' '}
                  {rankData.countryName}
                </span>
              </div>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Another Keyword</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Lead Capture Form */}
        <div className="mt-16 mb-16">
          <DynamicLeadForm
            toolSlug="google-rank-checker"
            title="Want to Push Your Keywords to Position #1?"
            subtitle="Request a 1-on-1 strategy call with Missive Digital's enterprise SEO specialists."
          />
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto mt-12 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about tracking keyword positions and Google search
              rankings.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
