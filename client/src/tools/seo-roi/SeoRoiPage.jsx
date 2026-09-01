import { useState, useEffect, useMemo } from 'react'
import { useCalculateROIMutation, useSubmitLeadMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
]

const GROWTH_PRESETS = { Conservative: 10, Moderate: 20, Aggressive: 35 }
const DURATIONS = [3, 6, 12, 24]

function fmt(n, currency = 'USD') {
  const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const abs = Math.abs(Math.round(n))
  if (abs >= 10000000) return `${c.symbol}${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${c.symbol}${(abs / 1000).toFixed(0)}K`
  return `${c.symbol}${abs.toLocaleString()}`
}

// Simple SVG bar chart
function BarChart({ data, label, color = '#6366f1', height = 200 }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.max(20, Math.floor(600 / data.length) - 4)
  const svgW = data.length * (barW + 4) + 20

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(svgW, 300)} height={height + 40} className="font-sans">
        {data.map((d, i) => {
          const barH = (d.value / max) * height
          return (
            <g key={i}>
              <rect x={i * (barW + 4) + 10} y={height - barH + 10} width={barW} height={barH} fill={color} rx={3} opacity={0.85} />
              <text x={i * (barW + 4) + 10 + barW / 2} y={height - barH + 5} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600">{d.display}</text>
              <text x={i * (barW + 4) + 10 + barW / 2} y={height + 25} textAnchor="middle" fontSize="9" fill="#9ca3af">M{d.month}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function DualBarChart({ invData, revData, invColor, revColor, height = 200 }) {
  const maxVal = Math.max(...invData.map((d, i) => Math.max(d.value, revData[i]?.value || 0)), 1)
  const barW = Math.max(14, Math.floor(500 / invData.length) / 2 - 2)
  const svgW = invData.length * (barW * 2 + 6) + 20

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(svgW, 300)} height={height + 40} className="font-sans">
        {invData.map((d, i) => {
          const x = i * (barW * 2 + 6) + 10
          const invH = (d.value / maxVal) * height
          const revH = ((revData[i]?.value || 0) / maxVal) * height
          return (
            <g key={i}>
              <rect x={x} y={height - invH + 10} width={barW} height={invH} fill={invColor} rx={2} opacity={0.7} />
              <rect x={x + barW + 2} y={height - revH + 10} width={barW} height={revH} fill={revColor} rx={2} opacity={0.7} />
              <text x={x + barW} y={height + 25} textAnchor="middle" fontSize="9" fill="#9ca3af">M{i + 1}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ScenarioCard({ label, growth, summary, currency, isActive, onClick }) {
  const roiColor = summary.roi >= 100 ? 'text-green-600' : summary.roi >= 0 ? 'text-amber-600' : 'text-red-600'
  return (
    <button onClick={onClick} className={`text-left rounded-xl border-2 p-5 transition-all ${isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-900">{label}</span>
        <span className="text-xs text-gray-400">{growth}% growth</span>
      </div>
      <div className={`text-3xl font-bold ${roiColor}`}>{summary.roi}%</div>
      <div className="text-xs text-gray-500 mt-1">Estimated ROI</div>
      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <div>Revenue: <span className="font-semibold">{fmt(summary.additionalRevenue, currency)}</span></div>
        <div>Net: <span className="font-semibold">{fmt(summary.netReturn, currency)}</span></div>
      </div>
    </button>
  )
}

export default function SeoRoiPage() {
  // Form state
  const [currency, setCurrency] = useState('USD')
  const [traffic, setTraffic] = useState(10000)
  const [leads, setLeads] = useState(0)
  const [custValue, setCustValue] = useState(1500)
  const [custRate, setCustRate] = useState(10)
  const [convRate, setConvRate] = useState(3)
  const [investment, setInvestment] = useState(5000)
  const [months, setMonths] = useState(12)
  const [growthPreset, setGrowthPreset] = useState('Moderate')
  const [customGrowth, setCustomGrowth] = useState(20)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiModel, setAiModel] = useState('openrouter')

  const [calculateROI, { isLoading, isError, error, data }] = useCalculateROIMutation()
  const [activeScenario, setActiveScenario] = useState('moderate')
  const [chartMetric, setChartMetric] = useState('traffic')
  const [copied, setCopied] = useState(false)

  const growthRate = growthPreset === 'Custom' ? customGrowth : GROWTH_PRESETS[growthPreset]
  const results = data?.results
  const aiInsights = data?.aiInsights

  const scenario = results?.[activeScenario]
  const forecast = scenario?.forecast || []

  // Compute growth rates for scenarios
  const scenarios = useMemo(() => ({
    conservative: { growth: results?.conservative?.growthRate ? results.conservative.growthRate * 100 : 10, ...results?.conservative?.summary },
    moderate: { growth: results?.moderate?.growthRate ? results.moderate.growthRate * 100 : 20, ...results?.moderate?.summary },
    aggressive: { growth: results?.aggressive?.growthRate ? results.aggressive.growthRate * 100 : 35, ...results?.aggressive?.summary },
  }), [results])

  const handleSubmit = (e) => {
    e.preventDefault()
    calculateROI({
      currency, monthlyTraffic: traffic, monthlyLeads: leads || undefined,
      averageCustomerValue: custValue, leadToCustomerRate: custRate / 100,
      organicConversionRate: convRate / 100, monthlySeoInvestment: investment,
      campaignMonths: months,
      growthScenario: { conservative: 0.10, moderate: growthRate / 100, aggressive: 0.35 },
      preferredProvider: aiModel,
    })
  }

  const chartData = useMemo(() => {
    if (!forecast.length) return { inv: [], rev: [], traffic: [], leads: [], customers: [], revenue: [] }
    return {
      inv: forecast.map(f => ({ month: f.month, value: f.cumInvestment, display: fmt(f.cumInvestment, currency) })),
      rev: forecast.map(f => ({ month: f.month, value: f.cumRevenue, display: fmt(f.cumRevenue, currency) })),
      traffic: forecast.map(f => ({ month: f.month, value: f.traffic, display: f.traffic.toLocaleString() })),
      leads: forecast.map(f => ({ month: f.month, value: f.leads, display: f.leads.toLocaleString() })),
      customers: forecast.map(f => ({ month: f.month, value: f.customers, display: f.customers.toLocaleString() })),
      revenue: forecast.map(f => ({ month: f.month, value: f.revenue, display: fmt(f.revenue, currency) })),
    }
  }, [forecast, currency])

  const exportCSV = () => {
    const header = 'Month,Traffic,Leads,Customers,Revenue,Cum Investment,Cum Revenue\n'
    const rows = forecast.map(f => `${f.month},${f.traffic},${f.leads},${f.customers},${Math.round(f.revenue)},${Math.round(f.cumInvestment)},${Math.round(f.cumRevenue)}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'seo-roi-forecast.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const copyReport = () => {
    const s = results?.moderate?.summary
    if (!s) return
    const text = `SEO ROI Estimate\nROI: ${s.roi}%\nAdditional Revenue: ${fmt(s.additionalRevenue, currency)}/mo\nNet Return: ${fmt(s.netReturn, currency)}/mo\nInvestment: ${fmt(results.input?.monthlySeoInvestment || investment, currency)}/mo`
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">SEO </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">ROI Calculator</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Estimate the potential business impact of your organic search investment.
          </p>
          <p className="mt-2 text-xs text-gray-400 max-w-lg mx-auto">Estimates based on your assumptions. SEO performance varies by industry, competition, and many other factors. Results are not guaranteed.</p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {!results ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Your Business Inputs</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Monthly Organic Traffic *</label>
                  <input type="number" min={1} max={10000000} value={traffic} onChange={e => setTraffic(Number(e.target.value))} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Average Customer Value ({CURRENCIES.find(c => c.code === currency)?.symbol}) *</label>
                  <input type="number" min={0} value={custValue} onChange={e => setCustValue(Number(e.target.value))} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Monthly SEO Investment ({CURRENCIES.find(c => c.code === currency)?.symbol}) *</label>
                  <input type="number" min={0} value={investment} onChange={e => setInvestment(Number(e.target.value))} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Organic → Lead Conversion Rate (%)</label>
                  <input type="number" min={0} max={100} step={0.1} value={convRate} onChange={e => setConvRate(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Lead → Customer Rate (%)</label>
                  <input type="number" min={0} max={100} step={0.1} value={custRate} onChange={e => setCustRate(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Campaign Duration</label>
                  <div className="flex gap-2">
                    {DURATIONS.map(d => (
                      <button key={d} type="button" onClick={() => setMonths(d)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${months === d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{d}mo</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Expected Traffic Growth</label>
                  <div className="flex gap-2">
                    {Object.entries(GROWTH_PRESETS).map(([name, pct]) => (
                      <button key={name} type="button" onClick={() => { setGrowthPreset(name); setCustomGrowth(pct) }} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${growthPreset === name ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{name}</button>
                    ))}
                  </div>
                </div>
              </div>

              <ModelSelector value={aiModel} onChange={setAiModel} />

              <button type="submit" disabled={isLoading} className="w-full rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25">
                {isLoading ? 'Calculating...' : 'Calculate SEO ROI'}
              </button>
            </form>
          ) : (
            /* ===== RESULTS ===== */
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">SEO ROI Results</h2>
                <div className="flex gap-2">
                  <button onClick={copyReport} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200">{copied ? '✓ Copied' : 'Copy'}</button>
                  <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200">Export CSV</button>
                  <button onClick={() => { setActiveScenario('moderate'); /* keep results */ }} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">← Recalculate</button>
                </div>
              </div>

              {/* Main ROI */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 text-center text-white">
                <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-2">Estimated SEO ROI</p>
                <div className="text-5xl sm:text-6xl font-bold">{results.moderate.summary.roi}%</div>
                <p className="text-sm opacity-80 mt-2">Moderate scenario — {results.moderate.growthRate * 100}% monthly growth</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Additional Traffic', `+${results.moderate.summary.finalMonthlyTraffic - results.input.monthlyTraffic}`, '📈'],
                  ['Additional Leads', `+${results.moderate.summary.finalMonthlyLeads - (results.input.baselineLeads)}`, '🎯'],
                  ['Additional Customers', `+${results.moderate.summary.finalMonthlyCustomers - Math.round(results.input.baselineLeads * results.input.leadToCustomerRate)}`, '👥'],
                  ['Additional Revenue', fmt(results.moderate.summary.additionalRevenue, currency), '💰'],
                ].map(([label, value, icon]) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <span className="text-2xl block mb-1">{icon}</span>
                    <div className="text-lg font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Investment vs Revenue */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Investment</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Cumulative Revenue</span>
                </div>
                <DualBarChart invData={chartData.inv} revData={chartData.rev} invColor="#f87171" revColor="#10b981" />
              </div>

              {/* Scenario Comparison */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Scenario Comparison</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <ScenarioCard label="Conservative" growth={scenarios.conservative.growth} summary={scenarios.conservative} currency={currency} isActive={activeScenario === 'conservative'} onClick={() => setActiveScenario('conservative')} />
                  <ScenarioCard label="Moderate" growth={scenarios.moderate.growth} summary={scenarios.moderate} currency={currency} isActive={activeScenario === 'moderate'} onClick={() => setActiveScenario('moderate')} />
                  <ScenarioCard label="Aggressive" growth={scenarios.aggressive.growth} summary={scenarios.aggressive} currency={currency} isActive={activeScenario === 'aggressive'} onClick={() => setActiveScenario('aggressive')} />
                </div>
              </div>

              {/* Monthly Forecast */}
              {forecast.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Monthly Forecast</h3>
                    <div className="flex gap-1">
                      {['traffic', 'leads', 'customers', 'revenue'].map(m => (
                        <button key={m} onClick={() => setChartMetric(m)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${chartMetric === m ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <BarChart data={chartData[chartMetric]} color="#6366f1" />
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-3 font-bold text-gray-500">Month</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-500">Traffic</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-500">Leads</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-500">Customers</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-500">Revenue</th>
                        <th className="text-right py-2 pl-3 font-bold text-gray-500">Cum Revenue</th>
                      </tr></thead>
                      <tbody>
                        {forecast.map(f => (
                          <tr key={f.month} className="border-b border-gray-100">
                            <td className="py-1.5 pr-3 font-medium text-gray-900">{f.month}</td>
                            <td className="py-1.5 px-3 text-right">{f.traffic.toLocaleString()}</td>
                            <td className="py-1.5 px-3 text-right">{f.leads.toLocaleString()}</td>
                            <td className="py-1.5 px-3 text-right">{f.customers}</td>
                            <td className="py-1.5 px-3 text-right font-medium">{fmt(f.revenue, currency)}</td>
                            <td className="py-1.5 pl-3 text-right font-medium">{fmt(f.cumRevenue, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Break-Even */}
              {results.breakEvenMonth && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">⏱️ Estimated Break-Even</h3>
                  <div className="text-3xl font-bold text-emerald-600">Month {results.breakEvenMonth}</div>
                  <p className="text-xs text-gray-500 mt-2">Based on your assumptions, modeled cumulative revenue exceeds cumulative investment around month {results.breakEvenMonth}.</p>
                </div>
              )}

              {/* Sensitivity */}
              {results.sensitivity?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">What Has the Biggest Impact on Your ROI?</h3>
                  <div className="space-y-3">
                    {results.sensitivity.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-40 shrink-0">{s.factor}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.level === 'High' ? 'bg-emerald-500' : s.level === 'Medium' ? 'bg-amber-400' : 'bg-gray-400'}`} style={{ width: `${s.percentage}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-20 text-right">{s.level} Impact</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {aiInsights && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white text-sm">🤖</span>
                    AI Business Insights
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">AI interpretation of your calculator results</p>
                  <p className="text-gray-700 leading-relaxed mb-4">{aiInsights.executive_summary}</p>

                  {aiInsights.key_insights?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Key Insights</h4>
                      <ul className="space-y-1.5">{aiInsights.key_insights.map((ins, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-blue-500 shrink-0">•</span>{ins}</li>)}</ul>
                    </div>
                  )}

                  {aiInsights.risks?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">⚠️ Risks</h4>
                      <ul className="space-y-1.5">{aiInsights.risks.map((r, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-amber-500 shrink-0">⚠</span>{r}</li>)}</ul>
                    </div>
                  )}

                  {aiInsights.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">💡 Recommendations</h4>
                      <ul className="space-y-1.5">{aiInsights.recommendations.map((r, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-500 shrink-0">✓</span>{r}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                This calculator provides estimates based on the assumptions you enter. SEO performance varies by industry, competition, website quality, and many other factors. Results are not guaranteed.
              </p>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">Expert Help</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Want a Real SEO Growth Forecast?</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">Our SEO experts can analyze your actual website, market, competitors and search opportunities to build a customized SEO growth model.</p>
                </div>
              </div>

              {/* Lead Form */}
              <RoiLeadForm calculationId={data?.calculationId} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RoiLeadForm({ calculationId }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', phone: '' })
  const [submitLead, { isLoading }] = useSubmitLeadMutation()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    try { await submitLead({ ...form, roiCalculationId: calculationId, source: 'roi-calculator' }).unwrap(); setSubmitted(true) }
    catch (err) { setError(err?.data?.error || 'Something went wrong.') }
  }

  if (submitted) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
      <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
      <p className="text-green-700 mt-1">We'll be in touch within 24 hours with your personalized SEO growth plan.</p>
    </div>
  )

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 rounded-t-2xl" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Get My SEO Growth Plan</h3>
      <p className="text-sm text-gray-600 mb-6">Our experts will review your assumptions and build a customized SEO growth model.</p>
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
          {isLoading ? 'Submitting...' : 'Get My SEO Growth Plan'}
        </button>
      </form>
    </div>
  )
}
