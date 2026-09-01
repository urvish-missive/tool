import { useState, useEffect } from 'react'
import { useRunAuditMutation, useSubmitLeadMutation } from '../../services/apiSlice'
import AuditForm from './AuditForm'
import LoadingAudit from './LoadingAudit'
import ScoreCircle from '../shared/ScoreCircle'
import ScoreCard from '../shared/ScoreCard'

const LOADING_STEPS = ['connect', 'technical', 'structure', 'content', 'links', 'schema', 'report']

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-blue-100 text-blue-700',
  INFO: 'bg-gray-100 text-gray-600',
}

const SEVERITY_ICONS = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🔵',
  INFO: 'ℹ️',
}

function IssueItem({ issue }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left flex items-start gap-3">
        <span className="text-lg shrink-0">{SEVERITY_ICONS[issue.severity] || 'ℹ️'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_COLORS[issue.severity]}`}>{issue.severity}</span>
            <span className="font-semibold text-sm text-gray-900">{issue.title}</span>
          </div>
          {issue.description && <p className="text-xs text-gray-500 mt-1 truncate">{issue.description}</p>}
        </div>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-3 ml-8 space-y-2 text-sm">
          {issue.description && <p className="text-gray-600">{issue.description}</p>}
          {issue.recommendation && (
            <p className="text-green-700 bg-green-50 rounded-lg p-2">
              <strong>How to fix:</strong> {issue.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SeoAuditPage() {
  const [loadingStep, setLoadingStep] = useState('connect')
  const [report, setReport] = useState(null)
  const [auditId, setAuditId] = useState(null)
  const [runAudit, { isLoading, isError, error, data }] = useRunAuditMutation()

  useEffect(() => {
    if (!isLoading) return
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx < LOADING_STEPS.length) setLoadingStep(LOADING_STEPS[idx])
    }, 3000)
    return () => clearInterval(interval)
  }, [isLoading])

  useEffect(() => {
    if (data?.report) {
      setReport(data.report)
      setAuditId(data.auditId)
      setTimeout(() => {
        document.getElementById('audit-report')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [data])

  const handleReset = () => {
    setReport(null)
    setAuditId(null)
    setLoadingStep('connect')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const errorMessage = error?.data?.error || (isError ? "Couldn't complete the audit. Please try again." : '')
  const issues = report?.issues || []
  const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], INFO: [] }
  issues.forEach(i => { if (bySeverity[i.severity]) bySeverity[i.severity].push(i) })
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const filteredIssues = filterSeverity === 'ALL' ? issues : issues.filter(i => i.severity === filterSeverity)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-200/40 to-purple-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">Free SEO </span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 bg-clip-text text-transparent">Website Audit</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Find the SEO issues holding your website back. Analyze technical SEO, on-page optimization, content, and more.
          </p>
          <p className="mt-3 text-sm text-gray-400">No credit card required. Free initial SEO analysis.</p>
        </div>
      </section>

      {/* Form / Loading / Report */}
      <section className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {!report && !isLoading && (
            <AuditForm onSubmit={(payload) => runAudit(payload)} isLoading={isLoading} />
          )}

          {isLoading && <LoadingAudit currentStep={loadingStep} />}

          {isError && !isLoading && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center max-w-md mx-auto">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Audit Failed</h3>
              <p className="text-gray-600 mt-2 max-w-sm mx-auto">{errorMessage}</p>
              <button onClick={handleReset} className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                Try Again
              </button>
            </div>
          )}

          {/* ===== REPORT ===== */}
          {report && (
            <div id="audit-report" className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">SEO Audit Report</h2>
                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                  ← New Audit
                </button>
              </div>

              {/* Overall Score */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-4">SEO Health Score</p>
                <ScoreCircle score={report.overallScore} size={160} strokeWidth={12} />
                <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                  {report.ai?.executive_summary || `Your website scored ${report.overallScore}/100 across ${report.totalPages} page(s).`}
                </p>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <ScoreCard score={report.technicalScore} label="Technical" icon="🔧" />
                <ScoreCard score={report.onPageScore} label="On-Page" icon="📄" />
                <ScoreCard score={report.contentScore} label="Content" icon="📝" />
                <ScoreCard score={report.performanceScore} label="Performance" icon="⚡" />
                <ScoreCard score={report.indexabilityScore} label="Indexability" icon="🔍" />
                <ScoreCard score={report.linksScore} label="Links" icon="🔗" />
                <ScoreCard score={report.structuredDataScore} label="Schema" icon="📊" />
              </div>

              {/* Issue Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Issues Found</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(bySeverity).map(([sev, items]) => items.length > 0 && (
                    <button key={sev} onClick={() => setFilterSeverity(filterSeverity === sev ? 'ALL' : sev)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterSeverity === sev ? 'ring-2 ring-offset-1 ring-blue-500 ' : ''}${SEVERITY_COLORS[sev]}`}>
                      {SEVERITY_ICONS[sev]} {items.length} {sev}
                    </button>
                  ))}
                  {filterSeverity !== 'ALL' && (
                    <button onClick={() => setFilterSeverity('ALL')} className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      Show All
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredIssues.map((issue, i) => <IssueItem key={i} issue={issue} />)}
                  {filteredIssues.length === 0 && <p className="text-gray-500 text-sm">No issues found for this filter.</p>}
                </div>
              </div>

              {/* AI Summary */}
              {report.ai && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center text-white text-sm">🤖</span>
                    AI SEO Assessment
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">AI-generated analysis based on the audit findings</p>
                  <p className="text-gray-700 leading-relaxed mb-4">{report.ai.overall_assessment}</p>

                  {/* Quick Wins */}
                  {report.ai.quick_wins?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">⚡ Quick Wins</h4>
                      <ul className="space-y-2">
                        {report.ai.quick_wins.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-500 mt-0.5 shrink-0">✓</span>{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {report.ai.strengths?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">✅ Strengths</h4>
                      <ul className="space-y-2">
                        {report.ai.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 30-Day Plan */}
                  {report.ai.thirty_day_plan?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">📅 30-Day Action Plan</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {report.ai.thirty_day_plan.map((week) => (
                          <div key={week.week} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h5 className="text-sm font-bold text-gray-900 mb-2">Week {week.week}</h5>
                            <ul className="space-y-1">
                              {week.tasks.map((task, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                  <span className="text-gray-400 shrink-0">•</span>{task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* On-Page Summary */}
              {report.onpageSummary && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">On-Page Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      ['Pages Analyzed', report.onpageSummary.totalPages],
                      ['Missing Titles', report.onpageSummary.missingTitles],
                      ['Duplicate Titles', report.onpageSummary.duplicateTitles],
                      ['Missing Descriptions', report.onpageSummary.missingDescriptions],
                      ['Missing H1', report.onpageSummary.missingH1],
                      ['Multiple H1', report.onpageSummary.multipleH1],
                      ['Images w/o ALT', report.onpageSummary.imagesWithoutAlt],
                      ['Thin Content', report.onpageSummary.thinContentPages],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className={`text-lg font-bold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>{value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 text-center">
                SEO scores provided by this tool are diagnostic estimates based on the checks performed. They are not Google ranking scores and do not guarantee search rankings or traffic.
              </p>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm">Expert Review</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Want an Expert SEO Review?</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">
                    Our SEO team can analyze your website, competitors and growth opportunities in more depth.
                  </p>
                </div>
              </div>

              {/* Lead Form */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 rounded-t-2xl" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Get a Free SEO Strategy Session</h3>
                <p className="text-sm text-gray-600 mb-6">Our experts will review your audit and share personalized recommendations.</p>
                <AuditLeadForm auditId={auditId} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AuditLeadForm({ auditId }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitLeadFn, { isLoading: submitting }] = useSubmitLeadMutation()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await submitLeadFn({ ...form, auditId, source: 'seo-audit' }).unwrap()
      setSubmitted(true)
    } catch (err) {
      setError(err?.data?.error || 'Something went wrong.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
        <p className="text-green-700 mt-1">We'll be in touch within 24 hours with your free SEO strategy.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input name="name" type="text" required value={form.name} onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Email *</label>
          <input name="email" type="email" required value={form.email} onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input name="company" type="text" value={form.company} onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input name="website" type="url" value={form.website} onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
        {submitting ? 'Submitting...' : 'Request My SEO Strategy'}
      </button>
    </form>
  )
}
