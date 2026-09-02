import { useState, useEffect, useRef } from 'react'
import ScoreRing from './ScoreRing'
import { Sparkles, ShieldCheck, Zap, HelpCircle, Check, Copy } from 'lucide-react'

const SCORE_META = [
  { key: 'seo_score', label: 'SEO Optimization', icon: '🎯', color: 'from-blue-600 to-blue-400' },
  { key: 'intent_score', label: 'Search Intent', icon: '🔍', color: 'from-purple-600 to-pink-400' },
  { key: 'depth_score', label: 'Content Depth', icon: '📚', color: 'from-emerald-600 to-teal-400' },
  { key: 'readability_score', label: 'Readability', icon: '📖', color: 'from-amber-600 to-orange-400' },
  { key: 'structure_score', label: 'Structure', icon: '🏗️', color: 'from-rose-600 to-red-400' },
  { key: 'usefulness_score', label: 'Usefulness', icon: '💡', color: 'from-cyan-600 to-sky-400' },
  { key: 'geo_citation_score', label: 'GEO / AI Overview Citation', icon: '🤖', color: 'from-indigo-600 to-violet-400' },
  { key: 'eeat_score', label: 'E-E-A-T Trust Score', icon: '🛡️', color: 'from-emerald-700 to-teal-500' },
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
        <span className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
          <span className="text-base">{icon}</span>
          <span className="text-slate-100">{label}</span>
        </span>
        <span className="text-xs sm:text-sm font-bold text-white tracking-wide">{score}<span className="text-slate-400 text-[11px] font-normal">/100</span></span>
      </div>
      <div className="relative h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between items-center pt-0.5">
        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
          score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
          score >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
          score >= 40 ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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
    blue: 'border-blue-200 bg-blue-50/40',
    green: 'border-emerald-200 bg-emerald-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    red: 'border-rose-200 bg-rose-50/40',
    purple: 'border-purple-200 bg-purple-50/40',
  }

  return (
    <div ref={ref}
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-700 ease-out ${
        accents[accent]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h4>
      </div>
      {children}
    </div>
  )
}

export default function AIAnalyticsSection({ report }) {
  const [copiedKey, setCopiedKey] = useState(null)
  if (!report) return null

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const intent = report.search_intent || {}
  const aiSearch = report.ai_search_readiness || null
  const eeatInsights = report.eeat_insights || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overall Diagnostic Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Content Quality & SEO Diagnosis</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
              Executive Assessment
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {report.summary}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{report.overall_score}</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Overall Score</span>
            </div>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {SCORE_META.map((item, i) => (
            <div key={item.key} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <ScoreBar
                score={report[item.key] || 50}
                label={item.label}
                icon={item.icon}
                color={item.color}
                delay={i * 100}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI Search & GEO Readiness Card */}
      {aiSearch && (
        <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-indigo-500/30">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Generative Engine Optimization (GEO) & AI Overview Readiness</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold">
              Score: {report.geo_citation_score || 75}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
            <div className="space-y-3">
              <h5 className="font-bold text-white text-base">AI Citation Analysis</h5>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {aiSearch.summary}
              </p>
              {aiSearch.actionableTweak && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-200 leading-relaxed">
                  <strong className="text-white">Citation Tweak:</strong> {aiSearch.actionableTweak}
                </div>
              )}
            </div>

            {aiSearch.soundbiteQuote && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">High-Probability AI Pull Quote</h5>
                  <button
                    onClick={() => triggerCopy(aiSearch.soundbiteQuote, 'quote-ai')}
                    className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white"
                  >
                    {copiedKey === 'quote-ai' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'quote-ai' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-slate-200 font-serif italic text-sm leading-relaxed">
                  "{aiSearch.soundbiteQuote}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* E-E-A-T Signals Card */}
      {eeatInsights.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Google E-E-A-T Experience & Trust Audit</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              Trust Score: {report.eeat_score || 72}/100
            </span>
          </div>

          <ul className="space-y-2.5">
            {eeatInsights.map((insight, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Intent Card */}
      {intent.type && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">{INTENT_ICONS[intent.type] || '🔍'}</span>
              <h4 className="font-bold text-slate-900 text-base">Detected Search Intent: {intent.type}</h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700">
              Confidence: {intent.confidence || 'High'}
            </span>
          </div>
          {intent.explanation && (
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              {intent.explanation}
            </p>
          )}
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        {report.strengths?.length > 0 && (
          <InsightCard icon="✅" title="Identified Strengths" accent="green">
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </InsightCard>
        )}

        {report.critical_issues?.length > 0 && (
          <InsightCard icon="🔴" title="Critical Issues" accent="red">
            <div className="space-y-3">
              {report.critical_issues.map((iss, i) => (
                <div key={i} className="bg-rose-100/50 p-3 rounded-xl border border-rose-200 text-xs">
                  <p className="font-bold text-rose-900">{iss.issue}</p>
                  <p className="text-rose-700 mt-1">{iss.why_it_matters}</p>
                  <p className="text-rose-800 font-medium mt-1"><strong>Fix:</strong> {iss.action}</p>
                </div>
              ))}
            </div>
          </InsightCard>
        )}

        {report.warnings?.length > 0 && (
          <InsightCard icon="⚠️" title="Warnings & Opportunities" accent="amber">
            <ul className="space-y-2">
              {report.warnings.map((w, i) => (
                <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">🟡</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </InsightCard>
        )}

        {report.missing_topics?.length > 0 && (
          <InsightCard icon="🧩" title="Missing Topical Sub-Themes" accent="purple">
            <ul className="space-y-2">
              {report.missing_topics.map((t, i) => (
                <li key={i} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </InsightCard>
        )}
      </div>

      {/* Recommendations List */}
      {report.recommendations?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <span>💡 Strategic Recommendations</span>
          </h4>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rec.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                    rec.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{rec.priority}</span>
                  <span className="font-bold text-slate-900">{rec.title}</span>
                </div>
                <p className="text-slate-600"><strong>Why:</strong> {rec.why}</p>
                <p className="text-slate-800"><strong>Action:</strong> {rec.how}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
