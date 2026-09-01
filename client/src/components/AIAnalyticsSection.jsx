import { useState, useEffect, useRef } from 'react'
import ScoreRing from './ScoreRing'

const SCORE_META = [
  { key: 'seo_score', label: 'SEO Optimization', icon: '🎯', color: 'from-blue-600 to-blue-400' },
  { key: 'intent_score', label: 'Search Intent', icon: '🔍', color: 'from-purple-600 to-pink-400' },
  { key: 'depth_score', label: 'Content Depth', icon: '📚', color: 'from-emerald-600 to-teal-400' },
  { key: 'readability_score', label: 'Readability', icon: '📖', color: 'from-amber-600 to-orange-400' },
  { key: 'structure_score', label: 'Structure', icon: '🏗️', color: 'from-rose-600 to-red-400' },
  { key: 'usefulness_score', label: 'Usefulness', icon: '💡', color: 'from-cyan-600 to-sky-400' },
]

const INTENT_ICONS = {
  Informational: '📖',
  Commercial: '🛒',
  Transactional: '💳',
  Navigational: '🧭',
}

const INTENT_COLORS = {
  Informational: 'from-blue-600 to-indigo-500',
  Commercial: 'from-purple-600 to-pink-500',
  Transactional: 'from-emerald-600 to-teal-500',
  Navigational: 'from-amber-600 to-orange-500',
}

function ScoreBar({ score, label, icon, color, delay }) {
  const [width, setWidth] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setWidth(score), delay); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [score, delay])

  const rating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Work' : 'Critical'

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <span className="text-lg">{icon}</span>
          {label}
        </span>
        <span className="text-sm font-bold text-gray-900">{score}/100</span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          score >= 80 ? 'bg-green-100 text-green-700' :
          score >= 60 ? 'bg-yellow-100 text-yellow-700' :
          score >= 40 ? 'bg-orange-100 text-orange-700' :
          'bg-red-100 text-red-700'
        }`}>{rating}</span>
      </div>
    </div>
  )
}

function InsightCard({ icon, title, children, accent = 'blue', delay = 0 }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  const accents = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    red: 'border-red-200 bg-red-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
  }

  return (
    <div ref={ref}
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-700 ease-out ${
        accents[accent]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h4 className="text-base font-bold text-gray-900">{title}</h4>
      </div>
      {children}
    </div>
  )
}

export default function AIAnalyticsSection({ report }) {
  const [heroVisible, setHeroVisible] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHeroVisible(true); obs.disconnect() } },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!report) return null

  const intent = report.search_intent || {}

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Section Header */}
        <div ref={heroRef}
          className={`text-center mb-12 sm:mb-16 transition-all duration-700 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          <span className="inline-block px-5 py-1.5 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white text-xs font-bold rounded-full mb-5 tracking-wider uppercase shadow-lg shadow-purple-500/25">
            ✨ AI Powered
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">They Trust </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Our Analysis
            </span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
            Deep AI-powered insights into your content's SEO performance, structure, and optimization potential.
          </p>
        </div>

        {/* Overall Score Hero */}
        <div className={`bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-8 sm:p-10 mb-8 transition-all duration-700 delay-200 ease-out ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="shrink-0">
              <ScoreRing score={report.overall_score} size={160} strokeWidth={12} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Overall Content Score</h3>
              <p className={`text-lg font-semibold mb-3 ${
                report.overall_score >= 80 ? 'text-green-600' :
                report.overall_score >= 60 ? 'text-amber-600' :
                report.overall_score >= 40 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {report.overall_score >= 80 ? '🌟 Excellent — Your content is well-optimized' :
                 report.overall_score >= 60 ? '👍 Good — Solid foundation with room to improve' :
                 report.overall_score >= 40 ? '⚠️ Needs Improvement — Several areas need attention' :
                 '🔴 Significant Issues — Major improvements recommended'}
              </p>
              {report.summary && (
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{report.summary}</p>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white text-sm">📊</span>
            Score Breakdown
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            {SCORE_META.map((s, i) => (
              <ScoreBar key={s.key} score={report[s.key]} label={s.label} icon={s.icon} color={s.color} delay={i * 150} />
            ))}
          </div>
        </div>

        {/* Search Intent Card */}
        {intent.type && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm">🔍</span>
              Search Intent Analysis
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className={`shrink-0 px-6 py-4 rounded-2xl bg-gradient-to-br ${INTENT_COLORS[intent.type] || 'from-gray-600 to-gray-400'} text-white text-center shadow-lg`}>
                <span className="text-3xl block mb-1">{INTENT_ICONS[intent.type] || '🌐'}</span>
                <span className="text-sm font-bold">{intent.type}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${
                    intent.confidence === 'High' ? 'bg-green-100 text-green-700' :
                    intent.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{intent.confidence}</span>
                  <span className="text-sm text-gray-500">Intent Match Score:</span>
                  <span className="text-sm font-bold text-gray-900">{report.intent_score}/100</span>
                </div>
                {intent.explanation && (
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{intent.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">

          {/* Strengths */}
          {report.strengths?.length > 0 && (
            <InsightCard icon="✅" title="Strengths" accent="green" delay={0}>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}

          {/* Critical Issues */}
          {report.critical_issues?.length > 0 && (
            <InsightCard icon="🔴" title="Critical Issues" accent="red" delay={100}>
              <div className="space-y-3">
                {report.critical_issues.map((issue, i) => (
                  <div key={i} className="bg-red-100/60 rounded-xl p-3 border border-red-200/60">
                    <p className="font-semibold text-sm text-red-800">{issue.issue}</p>
                    <p className="text-xs text-red-600 mt-1">{issue.why_it_matters}</p>
                    <p className="text-xs text-red-600 mt-1"><strong>Fix:</strong> {issue.action}</p>
                  </div>
                ))}
              </div>
            </InsightCard>
          )}

          {/* Warnings */}
          {report.warnings?.length > 0 && (
            <InsightCard icon="⚠️" title="Warnings" accent="amber" delay={200}>
              <ul className="space-y-2">
                {report.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">🟡</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}

          {/* Missing Topics */}
          {report.missing_topics?.length > 0 && (
            <InsightCard icon="🧩" title="Potential Missing Topics" accent="purple" delay={300}>
              <ul className="space-y-2">
                {report.missing_topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}
        </div>

        {/* AI Recommendations */}
        {report.recommendations?.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-sm">💡</span>
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>{rec.priority}</span>
                    <span className="font-semibold text-gray-900">{rec.title}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why</span>
                      <p className="text-sm text-gray-600 mt-0.5">{rec.why}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">How to improve</span>
                      <p className="text-sm text-gray-600 mt-0.5">{rec.how}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins + FAQ row */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Quick Wins */}
          {report.quick_wins?.length > 0 && (
            <InsightCard icon="⚡" title="Quick Wins" accent="blue" delay={0}>
              <ol className="space-y-2 list-decimal list-inside">
                {report.quick_wins.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700">{w}</li>
                ))}
              </ol>
            </InsightCard>
          )}

          {/* FAQ */}
          {report.faq_opportunities?.length > 0 && (
            <InsightCard icon="❓" title="FAQ Opportunities" accent="purple" delay={100}>
              <ol className="space-y-2 list-decimal list-inside">
                {report.faq_opportunities.map((q, i) => (
                  <li key={i} className="text-sm text-gray-700">{q}</li>
                ))}
              </ol>
              <button disabled className="mt-4 px-4 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed border border-gray-200">
                Generate FAQ Schema — Coming Soon
              </button>
            </InsightCard>
          )}
        </div>

        {/* Heading Recommendations */}
        {report.heading_recommendations && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center text-white text-sm">📝</span>
              Heading Recommendations
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {report.heading_recommendations.current?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Current Headings</h4>
                  <ul className="space-y-1.5">
                    {report.heading_recommendations.current.map((h, i) => (
                      <li key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.heading_recommendations.suggested?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Suggested Headings</h4>
                  <ul className="space-y-1.5">
                    {report.heading_recommendations.suggested.map((h, i) => (
                      <li key={i} className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Plan */}
        {report.action_plan?.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white text-sm">🗺️</span>
              SEO Action Plan
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Priority</th>
                    <th className="text-left py-2.5 pr-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                    <th className="text-left py-2.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.action_plan.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          item.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          item.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{item.priority}</span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.task}</td>
                      <td className="py-3 text-gray-600">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
