import { useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Quote,
  Edit3,
  RefreshCw,
} from 'lucide-react'

const PILLARS_META = [
  {
    key: 'seo_score',
    label: 'SEO Optimization',
    icon: '🎯',
    desc: 'Keyword placement, metadata alignment, and on-page density',
  },
  {
    key: 'intent_score',
    label: 'Search Intent',
    icon: '🔍',
    desc: 'Alignment with user search query expectations and journey',
  },
  {
    key: 'depth_score',
    label: 'Content Depth',
    icon: '📚',
    desc: 'Coverage of entities, subtopics, and comprehensive solutions',
  },
  {
    key: 'readability_score',
    label: 'Readability',
    icon: '📖',
    desc: 'Sentence cadence, scannability, and Flesch reading score',
  },
  {
    key: 'structure_score',
    label: 'Structure & Flow',
    icon: '🏗️',
    desc: 'Heading hierarchy, bite-sized sections, and visual anchors',
  },
  {
    key: 'usefulness_score',
    label: 'Actionable Value',
    icon: '💡',
    desc: 'Real-world takeaways, examples, and practical guidance',
  },
  {
    key: 'geo_citation_score',
    label: 'GEO / AI Overview',
    icon: '🤖',
    desc: 'Probability of being extracted and cited by AI engines',
  },
  {
    key: 'eeat_score',
    label: 'E-E-A-T Trust',
    icon: '🛡️',
    desc: 'First-hand experience, authority proof, and brand credibility',
  },
]

import { getScoreColor, getScoreBadge, getScoreBarGradient } from '../utils/scoreHelpers'

export default function AIAnalyticsSection({ report, onReset, onEdit }) {
  const [activeTab, setActiveTab] = useState('scores') // 'scores' | 'issues' | 'geo' | 'eeat' | 'plan'
  const [issueFilter, setIssueFilter] = useState('all') // 'all' | 'critical' | 'warnings'
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedIssues, setExpandedIssues] = useState({})

  if (!report) return null

  const overall = report.overall_score || 0
  const intent = report.search_intent || {}
  const aiSearch = report.ai_search_readiness || null
  const eeatInsights = report.eeat_insights || []
  const criticalIssues = report.critical_issues || []
  const warnings = report.warnings || []
  const recommendations = report.recommendations || []
  const missingTopics = report.missing_topics || []
  const strengths = report.strengths || []

  const totalIssuesCount = criticalIssues.length + warnings.length

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleIssue = (id) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const exportMarkdown = () => {
    const text = [
      `# AI Content SEO & Quality Audit Report`,
      `Overall Score: ${overall}/100`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      `## Executive Summary`,
      report.summary || 'Content analysis completed.',
      '',
      `## Quality Pillars Scores`,
      ...PILLARS_META.map((p) => `- **${p.label}:** ${report[p.key] || 0}/100`),
      '',
      `## Critical Issues & Action Items`,
      ...criticalIssues.map(
        (iss, i) =>
          `${i + 1}. [CRITICAL] ${iss.issue}\n   Why: ${iss.why_it_matters}\n   Fix: ${iss.action}`
      ),
      '',
      `## Strategic Recommendations`,
      ...recommendations.map(
        (rec, i) =>
          `${i + 1}. [${rec.priority || 'MEDIUM'}] ${rec.title}\n   Why: ${rec.why}\n   Action: ${rec.how}`
      ),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-analysis-report-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyActionPlan = () => {
    const planText = recommendations
      .map(
        (r, i) => `${i + 1}. [${r.priority}] ${r.title}\n   • Why: ${r.why}\n   • Action: ${r.how}`
      )
      .join('\n\n')
    triggerCopy(planText, 'action-plan')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── TOP ACTION HEADER BAR ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0C81F3]/10 text-[#0C81F3] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Himani's SEO Tools • Missive Digital
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Content Quality & Ranking Audit
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
          )}
          <button
            onClick={copyActionPlan}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedKey === 'action-plan' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied Plan!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Action Plan</span>
              </>
            )}
          </button>
          <button
            onClick={exportMarkdown}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>
        </div>
      </div>

      {/* ── HERO SCORE CARD ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Overall Score & Readiness */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-slate-100 md:pr-8 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0C81F3]">
              Overall Content Quality Score
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span
                className={`text-6xl sm:text-7xl font-black tracking-tight ${getScoreColor(overall)}`}
              >
                {overall}
              </span>
              <span className="text-2xl font-bold text-slate-400">/100</span>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getScoreBadge(overall)}`}
              >
                {overall >= 80
                  ? '✓ Ready to Rank & Publish'
                  : overall >= 60
                    ? '⚡ Minor Optimization Needed'
                    : '⚠️ Critical Fixes Required'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {criticalIssues.length === 0
                ? 'No critical blockers'
                : `${criticalIssues.length} critical issue(s)`}{' '}
              • {recommendations.length} action item(s)
            </p>
          </div>

          {/* Right Column: 4 Signature Quick Alert Cards */}
          <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
            {/* 1. SEO Optimization */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${report.seo_score >= 70 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-blue-50/70 border-blue-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  🎯 SEO Optimization
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${getScoreBadge(report.seo_score || 0)}`}
                >
                  {report.seo_score || 0}/100
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {report.seo_score >= 70
                  ? 'Strong on-page signals, keyword presence, and semantic density.'
                  : 'Needs keyword frequency tuning and on-page heading optimization.'}
              </p>
            </div>

            {/* 2. Search Intent Alignment */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${report.intent_score >= 70 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  🔍 Search Intent Match
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${getScoreBadge(report.intent_score || 0)}`}
                >
                  {intent.type || 'Informational'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {intent.explanation ||
                  'Matches expected query format and resolves user intent directly.'}
              </p>
            </div>

            {/* 3. GEO / AI Overview Citation */}
            <div className="p-4 sm:p-5 rounded-2xl border bg-purple-50/70 border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  🤖 GEO / AI Citation
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {report.geo_citation_score || 75}/100
                </span>
              </div>
              <p className="text-xs text-purple-800/80 leading-relaxed">
                {aiSearch?.summary ||
                  'Extractable soundbites and authoritative definition structures.'}
              </p>
            </div>

            {/* 4. E-E-A-T Trust Score */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${report.eeat_score >= 70 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  🛡️ E-E-A-T Trust Score
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${getScoreBadge(report.eeat_score || 72)}`}
                >
                  {report.eeat_score || 72}/100
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {eeatInsights.length > 0
                  ? eeatInsights[0]
                  : 'First-hand experience & factual authority signals verified.'}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary Quote Callout */}
        {report.summary && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Executive Summary
            </h4>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
              {report.summary}
            </p>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE TAB NAVIGATION ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80">
        {[
          { id: 'scores', label: '8-Pillar Score Grid', icon: Layers },
          {
            id: 'issues',
            label: `Critical Fixes & Gaps (${totalIssuesCount})`,
            icon: AlertTriangle,
          },
          { id: 'geo', label: 'GEO & AI Overview', icon: Sparkles },
          { id: 'eeat', label: 'E-E-A-T Experience Audit', icon: ShieldCheck },
          { id: 'plan', label: `Strategic Roadmap (${recommendations.length})`, icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0C81F3]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: 8-PILLAR SCORE GRID ─────────────────────────────────── */}
      {activeTab === 'scores' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS_META.map((pillar) => {
              const val = report[pillar.key] || 0
              return (
                <div
                  key={pillar.key}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{pillar.icon}</span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getScoreBadge(val)}`}
                    >
                      {val}/100
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pillar.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getScoreBarGradient(val)} rounded-full transition-all duration-700`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Strengths Showcase */}
          {strengths.length > 0 && (
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Verified Content Strengths</span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
                {strengths.map((str, i) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-emerald-800 flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-emerald-100"
                  >
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span className="font-medium leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CRITICAL FIXES & GAPS ────────────────────────────────── */}
      {activeTab === 'issues' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `All Issues (${totalIssuesCount})` },
              { id: 'critical', label: `Critical (${criticalIssues.length})` },
              { id: 'warnings', label: `Warnings (${warnings.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setIssueFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  issueFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Critical Issues List */}
          {(issueFilter === 'all' || issueFilter === 'critical') && criticalIssues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>High-Priority Blockers ({criticalIssues.length})</span>
              </h4>
              <div className="space-y-3">
                {criticalIssues.map((iss, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => toggleIssue(`crit-${i}`)}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-rose-50/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase shrink-0 mt-0.5">
                          Critical
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                            {iss.issue}
                          </h5>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {iss.why_it_matters}
                          </p>
                        </div>
                      </div>
                      <div className="p-1 rounded-lg text-slate-400 shrink-0">
                        {expandedIssues[`crit-${i}`] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {expandedIssues[`crit-${i}`] && (
                      <div className="px-5 pb-5 pt-2 border-t border-rose-100 space-y-3 text-xs sm:text-sm bg-rose-50/20">
                        <div>
                          <strong className="text-slate-900">Why it matters:</strong>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">
                            {iss.why_it_matters}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <strong className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            How to Fix:
                          </strong>
                          <p className="leading-relaxed">{iss.action}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings List */}
          {(issueFilter === 'all' || issueFilter === 'warnings') && warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Warnings & Minor Polish ({warnings.length})</span>
              </h4>
              <div className="space-y-2.5">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-amber-200 p-4 flex items-start gap-3 shadow-sm"
                  >
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase shrink-0 mt-0.5">
                      Warning
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                      {w}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Topics / Entities */}
          {missingTopics.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Missing Topical Sub-Themes & Entities
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Incorporate these concepts to increase topical depth and coverage vs top-ranking
                SERP competitors.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {missingTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold"
                  >
                    <span>+</span>
                    <span>{topic}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: GEO & AI OVERVIEW READINESS ───────────────────────────── */}
      {activeTab === 'geo' && (
        <div className="space-y-6 animate-fade-in">
          {aiSearch ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Generative Engine Optimization (GEO) Analysis
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated for Google AI Overviews, Perplexity, and LLM search answer
                      synthesis.
                    </p>
                  </div>
                </div>

                <span className="px-3.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-extrabold">
                  Citation Score: {report.geo_citation_score || 75}/100
                </span>
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  AI Citation Readiness Breakdown
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {aiSearch.summary}
                </p>
              </div>

              {/* Actionable Tweak */}
              {aiSearch.actionableTweak && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                  <strong className="text-xs font-bold uppercase tracking-wide text-blue-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Recommended GEO Formatting Tweak:
                  </strong>
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                    {aiSearch.actionableTweak}
                  </p>
                </div>
              )}

              {/* Soundbite Pull Quote */}
              {aiSearch.soundbiteQuote && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Quote className="w-3.5 h-3.5 text-purple-600" />
                      Extracted AI Overview Soundbite Quote
                    </h4>
                    <button
                      onClick={() => triggerCopy(aiSearch.soundbiteQuote, 'quote-ai')}
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                    >
                      {copiedKey === 'quote-ai' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Quote</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 text-slate-800 font-serif italic text-sm sm:text-base leading-relaxed">
                    "{aiSearch.soundbiteQuote}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              No GEO data available for this analysis.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: E-E-A-T EXPERIENCE AUDIT ──────────────────────────────── */}
      {activeTab === 'eeat' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Google E-E-A-T Quality Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Experience, Expertise, Authoritativeness, and Trustworthiness analysis.
                  </p>
                </div>
              </div>

              <span
                className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${getScoreBadge(report.eeat_score || 72)}`}
              >
                Trust Score: {report.eeat_score || 72}/100
              </span>
            </div>

            {/* Insights Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audited E-E-A-T Signals & Proof Points
              </h4>
              <div className="space-y-2.5">
                {eeatInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {insight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: STRATEGIC ROADMAP ────────────────────────────────────── */}
      {activeTab === 'plan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Prioritized SEO Optimization Roadmap
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by impact on organic rankings and conversion velocity.
                  </p>
                </div>
              </div>

              <button
                onClick={copyActionPlan}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedKey === 'action-plan' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Recommendations</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, i) => {
                const priority = (rec.priority || 'MEDIUM').toUpperCase()
                return (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          priority === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : priority === 'LOW'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {priority} Priority
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{rec.title}</h4>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 pl-8 leading-relaxed">
                      <strong className="text-slate-800">Why:</strong> {rec.why}
                    </p>

                    <div className="pl-8 pt-1">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-xs">
                        <strong className="text-slate-900 font-bold block mb-1">
                          Recommended Action:
                        </strong>
                        {rec.how}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
