import { useState, useEffect, useMemo } from 'react'
import { useCalculateROIMutation } from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  BarChart3,
  Check,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Target,
  ShieldCheck,
  Award,
  ArrowUpRight,
  PieChart,
  Lightbulb,
  AlertCircle,
  Clock,
} from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
]

const DURATIONS = [3, 6, 12, 24]

function fmt(n, currency = 'USD') {
  const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const abs = Math.abs(Math.round(n || 0))
  if (abs >= 10000000) return `${c.symbol}${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 1000000) return `${c.symbol}${(abs / 1000000).toFixed(2)}M`
  if (abs >= 1000) return `${c.symbol}${(abs / 1000).toFixed(1)}K`
  return `${c.symbol}${abs.toLocaleString()}`
}

function FinancialTrajectoryChart({ monthlyData, currency, breakEvenMonth }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!monthlyData?.length) return null

  // Calculate cumulative investment and cumulative revenue for each month
  let cumInv = 0
  let cumRev = 0
  const series = monthlyData.map((d, i) => {
    cumInv += (d.investment || 0)
    cumRev += (d.revenue || 0)
    const net = cumRev - cumInv
    return {
      month: d.month || i + 1,
      revenue: d.revenue || 0,
      cumInv,
      cumRev,
      net,
    }
  })

  const maxVal = Math.max(...series.map(s => Math.max(s.cumRev, s.cumInv)), 1)
  const chartHeight = 220
  const chartWidth = 640
  const paddingX = 40
  const paddingY = 30
  const usableWidth = chartWidth - paddingX * 2
  const usableHeight = chartHeight - paddingY * 2

  const getX = (i) => paddingX + (i / Math.max(series.length - 1, 1)) * usableWidth
  const getY = (val) => chartHeight - paddingY - (Math.max(val, 0) / maxVal) * usableHeight

  // Generate SVG path strings
  const revPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(s.cumRev)}`).join(' ')
  const invPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(s.cumInv)}`).join(' ')
  const revArea = `${revPath} L ${getX(series.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`

  return (
    <div className="relative bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100 text-base">Cumulative Financial Trajectory</h4>
            {breakEvenMonth && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
                Break-Even: Month {breakEvenMonth}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Cumulative Revenue vs Cumulative Investment over campaign horizon</p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Cumulative Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-slate-300">Cumulative Spend</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-2xl mx-auto overflow-visible font-sans">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#334155" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#475569" />

          {/* Revenue Area Fill */}
          <path d={revArea} fill="url(#revGrad)" />

          {/* Investment Line */}
          <path d={invPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4 4" />

          {/* Revenue Line */}
          <path d={revPath} fill="none" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />

          {/* Points & Interactive Hover */}
          {series.map((s, i) => {
            const x = getX(i)
            const yRev = getY(s.cumRev)
            const isBreakEven = breakEvenMonth && s.month === breakEvenMonth

            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* Break even marker vertical highlight */}
                {isBreakEven && (
                  <line x1={x} y1={paddingY} x2={x} y2={chartHeight - paddingY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                )}

                {/* Point dot */}
                <circle cx={x} cy={yRev} r={isBreakEven ? 6 : 4} fill={isBreakEven ? '#10b981' : '#34d399'} stroke="#0f172a" strokeWidth="2" />

                {/* Month label on X axis */}
                <text x={x} y={chartHeight - 10} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
                  M{s.month}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Hover info panel */}
      {hoveredIdx !== null && series[hoveredIdx] && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center justify-between text-xs gap-3">
          <span className="font-bold text-slate-200">Month {series[hoveredIdx].month} Projections:</span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">Cum. Revenue: <strong>{fmt(series[hoveredIdx].cumRev, currency)}</strong></span>
            <span className="text-blue-400">Cum. Invested: <strong>{fmt(series[hoveredIdx].cumInv, currency)}</strong></span>
            <span className={series[hoveredIdx].net >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
              Net: {fmt(series[hoveredIdx].net, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SeoRoiPage() {
  const [currency, setCurrency] = useState('USD')
  const [traffic, setTraffic] = useState(15000)
  const [leads, setLeads] = useState(120)
  const [customerValue, setCustomerValue] = useState(2500)
  const [investment, setInvestment] = useState(2500)
  const [duration, setDuration] = useState(12)
  const [activePreset, setActivePreset] = useState('Moderate') // 'Conservative' | 'Moderate' | 'Aggressive'
  const [preferredProvider, setPreferredProvider] = useState('openrouter')

  const [calculateROI, { isLoading, reset: resetMutation }] = useCalculateROIMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCalculate = async (e) => {
    e?.preventDefault()
    setError('')
    setResults(null)

    try {
      const res = await calculateROI({
        monthlyTraffic: Number(traffic),
        baselineLeads: Number(leads),
        averageCustomerValue: Number(customerValue),
        monthlySeoInvestment: Number(investment),
        campaignMonths: Number(duration),
        currency,
        preferredProvider,
      }).unwrap()

      setResults(res)
      setTimeout(() => {
        document.getElementById('roi-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err?.data?.error || 'Failed to calculate SEO ROI. Please check your inputs.')
    }
  }

  const handleReset = () => {
    setTraffic(15000)
    setLeads(120)
    setCustomerValue(2500)
    setInvestment(2500)
    setDuration(12)
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

  const activeScenario = useMemo(() => {
    if (!results) return null
    if (activePreset === 'Conservative') return results.conservative
    if (activePreset === 'Aggressive') return results.aggressive
    return results.moderate
  }, [results, activePreset])

  const aiReport = results?.aiReport || null

  const exportProposal = () => {
    if (!results) return
    const text = [
      `# Executive SEO Investment & ROI Proposal`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Horizon: ${duration} Months | Scenario: ${activePreset}`,
      '',
      `## Executive Summary`,
      aiReport?.executive_summary || '',
      '',
      `## C-Suite Pitch`,
      aiReport?.cSuitePitch || '',
      '',
      `## Financial Projections (${activePreset})`,
      `- Total SEO Investment: ${fmt(activeScenario?.summary?.totalInvestment, currency)}`,
      `- Projected Additional Revenue: ${fmt(activeScenario?.summary?.additionalRevenue, currency)}`,
      `- Projected Net Return: ${fmt(activeScenario?.summary?.netReturn, currency)}`,
      `- Modeled ROI: ${activeScenario?.summary?.roi}%`,
      `- Break-Even Milestone: ${results.breakEvenMonth ? `Month ${results.breakEvenMonth}` : 'N/A'}`,
      '',
      `## Phased Implementation Roadmap`,
      ...(aiReport?.phasedRoadmap || []).map(p => `### ${p.phase}\n- Focus: ${p.focus}\n- Expected Outcome: ${p.expectedOutcome}\n`),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-roi-proposal-${duration}months.md`
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
            Executive Financial Modeling & Business Case Engine
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI-Powered SEO ROI </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Calculator</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Model organic growth scenarios, break-even timelines, and generate an investor-ready business case to justify SEO investment.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Currency */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white font-medium"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>

              {/* Monthly Traffic */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Monthly Organic Visitors</label>
                <input
                  type="number"
                  value={traffic}
                  onChange={(e) => setTraffic(Math.max(100, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium"
                  required
                />
              </div>

              {/* Baseline Leads */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Current Monthly Leads</label>
                <input
                  type="number"
                  value={leads}
                  onChange={(e) => setLeads(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium"
                  required
                />
              </div>

              {/* Average Customer Value (LTV) */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Average Customer Value (LTV)</label>
                <input
                  type="number"
                  value={customerValue}
                  onChange={(e) => setCustomerValue(Math.max(10, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium"
                  required
                />
              </div>

              {/* Monthly Investment */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Planned Monthly SEO Spend</label>
                <input
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(Math.max(100, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm font-medium"
                  required
                />
              </div>

              {/* Horizon Duration */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Campaign Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                        duration === m
                          ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m} Mo
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
                      <span>Modeling Financial Returns...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Calculate SEO ROI & Business Case</span>
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
            title="Forecasting Financial SEO Yield & Pipeline Value..."
            subtitle="Calculating customer lifetime value (LTV), compound organic traffic ramps, and break-even timelines."
            steps={[
              'Benchmarking monthly traffic growth curves',
              'Simulating lead conversion and pipeline velocity',
              'Modeling Conservative, Moderate, and Aggressive scenarios',
              'Synthesizing payback periods & net present revenue',
              'Drafting C-Suite executive business proposal',
            ]}
          />
        )}

        {/* Results Container */}
        {results && (
          <div id="roi-results" className="space-y-6 animate-fade-in">
            {/* C-Suite Executive Pitch Card */}
            {aiReport?.cSuitePitch && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-3">
                      <Award className="w-3.5 h-3.5" />
                      C-Suite Business Case & Value Proposition
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                      "{aiReport.cSuitePitch}"
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed max-w-3xl">
                      {aiReport.executive_summary}
                    </p>
                  </div>

                  <button
                    onClick={exportProposal}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Pitch Brief (.md)</span>
                  </button>
                </div>

                {/* Phased Roadmap */}
                {aiReport.phasedRoadmap?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    {aiReport.phasedRoadmap.map((p, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{p.phase}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200">
                          <strong>Strategic Focus:</strong> {p.focus}
                        </p>
                        <p className="text-xs text-emerald-300">
                          <strong>Key Milestone:</strong> {p.expectedOutcome}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scenario Switcher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Conservative', data: results?.conservative, color: 'text-blue-600', border: 'border-blue-500' },
                { name: 'Moderate', data: results?.moderate, color: 'text-emerald-600', border: 'border-emerald-500' },
                { name: 'Aggressive', data: results?.aggressive, color: 'text-purple-600', border: 'border-purple-500' },
              ].map(({ name, data, color, border }) => {
                const isSelected = activePreset === name
                const roiVal = data?.summary?.roi ?? 0
                const growthPct = data?.growthRate ? (data.growthRate * 100).toFixed(0) : '0'
                return (
                  <div
                    key={name}
                    onClick={() => setActivePreset(name)}
                    className={`cursor-pointer bg-white rounded-2xl p-6 border-2 transition-all shadow-sm hover:shadow-md ${
                      isSelected ? `${border} bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20` : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        {name} Case ({growthPct}% Growth)
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Active View
                        </span>
                      )}
                    </div>

                    <div className={`text-3xl sm:text-4xl font-black ${color} mb-1`}>
                      {roiVal}%
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Estimated ROI</span>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Revenue:</span>
                        <strong className="text-slate-900">{fmt(data?.summary?.additionalRevenue, currency)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Net Profit:</span>
                        <strong className="text-emerald-700">{fmt(data?.summary?.netReturn, currency)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Cost:</span>
                        <strong className="text-slate-700">{fmt(data?.summary?.totalInvestment, currency)}</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Financial Trajectory Visualization */}
            {activeScenario && (
              <FinancialTrajectoryChart
                monthlyData={activeScenario?.forecast || activeScenario?.monthly}
                currency={currency}
                breakEvenMonth={results?.breakEvenMonth}
              />
            )}

            {/* Strategic Insights & Growth Levers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Insights */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-base">Key Strategic Insights</h4>
                </div>
                <ul className="space-y-2.5">
                  {aiReport?.key_insights?.map((insight, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5">
                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Largest Levers & PPC Comparison */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-base">High-Impact Growth Levers</h4>
                </div>
                <div className="space-y-3">
                  {aiReport?.largest_levers?.map((lever, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                      <strong className="text-blue-700">{lever.factor}:</strong> {lever.explanation}
                    </div>
                  ))}
                </div>

                {aiReport?.paidSearchComparison && (
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed italic">
                    <strong>PPC vs Organic Insight:</strong> {aiReport.paidSearchComparison}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
