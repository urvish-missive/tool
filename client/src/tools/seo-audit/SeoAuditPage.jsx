import { useState, useEffect } from 'react'
import { useRunAuditMutation } from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import AuditForm from './AuditForm'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import ScoreCircle from '../shared/ScoreCircle'
import ScoreCard from '../shared/ScoreCard'
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Code,
  Calendar,
  Layers,
  Sparkles,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Zap,
} from 'lucide-react'

const LOADING_STEPS = [
  'Crawling website and verifying HTTP response codes',
  'Analyzing title tags, meta descriptions, and headings',
  'Checking canonicals, robots.txt, and indexability',
  'Evaluating schema.org structured data & entity signals',
  'Synthesizing remediation plan & copy-paste fixes',
]

const SEVERITY_COLORS = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  INFO: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all bg-white">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left flex items-start gap-3.5 cursor-pointer">
        <span className="text-xl shrink-0 mt-0.5">{SEVERITY_ICONS[issue.severity] || 'ℹ️'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${SEVERITY_COLORS[issue.severity]}`}>{issue.severity}</span>
            <span className="font-bold text-sm sm:text-base text-slate-900">{issue.title}</span>
          </div>
          {issue.description && <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>}
        </div>
        <div className="shrink-0 p-1 rounded-lg hover:bg-slate-100 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-sm">
          {issue.description && (
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              <strong className="text-slate-900">Why it matters:</strong> {issue.description}
            </p>
          )}
          {issue.recommendation && (
            <div className="text-emerald-800 bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold text-emerald-900">Recommended Remediation:</strong> {issue.recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SeoAuditPage() {
  const [report, setReport] = useState(null)
  const [auditId, setAuditId] = useState(null)
  const [runAudit, { isLoading, isError, error, data, reset: resetMutation }] = useRunAuditMutation()
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose, triggerPopup } = useLeadPopup('seo-audit')
  const [pendingPayload, setPendingPayload] = useState(null)

  const [activeTab, setActiveTab] = useState('issues') // 'issues' | 'snippets' | 'roadmap' | 'overview'
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [copiedKey, setCopiedKey] = useState(null)

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
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const errorMessage = error?.data?.error || (isError ? "Couldn't complete the audit. Please try again." : '')
  const issues = report?.issues || []
  const filteredIssues = filterSeverity === 'ALL' ? issues : issues.filter(i => i.severity === filterSeverity)
  const aiReport = report?.ai_report || null
  const quickFixSnippets = aiReport?.quick_fix_snippets || []
  const thirtyDayPlan = aiReport?.thirty_day_plan || []

  const exportAuditMarkdown = () => {
    if (!report) return
    const text = [
      `# Technical SEO Audit Report: ${report.targetUrl}`,
      `Score: ${report.overallScore}/100 | Pages: ${report.totalPages}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      `## Executive Summary`,
      aiReport?.executive_summary || '',
      '',
      `## All Identified Issues (${issues.length})`,
      ...issues.map((iss, i) => `${i + 1}. [${iss.severity}] ${iss.title}\n   ${iss.description}\n   Fix: ${iss.recommendation}`),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-audit-${new URL(report.targetUrl.startsWith('http') ? report.targetUrl : 'https://' + report.targetUrl).hostname}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Deep Crawl & Technical SEO Diagnostics
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI SEO </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Site Auditor</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Scan your entire web page for technical blockers, metadata issues, broken canonicals, missing schema, and copy-paste developer fixes.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!report && !isLoading && (
          <AuditForm
            onSubmit={(payload) => {
              if (popupEnabled) {
                setPendingPayload(payload)
                setShowPopup(true)
              } else {
                runAudit(payload)
              }
            }}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}

        {isLoading && (
          <UnifiedToolLoader
            title="Performing Deep Technical Site Audit..."
            subtitle="Crawling DOM elements, analyzing meta signals, HTTP headers, and schema integrity."
            steps={LOADING_STEPS}
          />
        )}

        {/* Results Container */}
        {report && (
          <div id="audit-report" className="space-y-6 animate-fade-in">
            {/* Header Strategic Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Technical Audit Complete</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                    {report.targetUrl}
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {aiReport?.executive_summary || `Scanned ${report.totalPages} page(s) and detected ${issues.length} action items.`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{report.overallScore}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Health Score</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={exportAuditMarkdown}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audit (.md)</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Audit Another URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-scores grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-6 text-center">
                {[
                  { label: 'Technical', val: report.technicalScore },
                  { label: 'On-Page', val: report.onPageScore },
                  { label: 'Content', val: report.contentScore },
                  { label: 'Performance', val: report.performanceScore },
                  { label: 'Link Equity', val: report.linksScore },
                  { label: 'Schema Data', val: report.structuredDataScore },
                ].map(({ label, val }, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-lg sm:text-xl font-bold text-white">{val}/100</div>
                    <div className="text-[11px] text-slate-400 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* View Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('issues')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'issues'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Issues & Vulnerabilities ({issues.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('snippets')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'snippets'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Quick-Fix Code Snippets ({quickFixSnippets.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'roadmap'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>30-Day Sprint Roadmap</span>
              </button>
            </div>

            {/* TAB 1: ISSUES LIST */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                {/* Severity Filter Pills */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => {
                      const countForSev = sev === 'ALL' ? issues.length : issues.filter(i => i.severity === sev).length
                      if (sev !== 'ALL' && countForSev === 0) return null
                      return (
                        <button
                          key={sev}
                          onClick={() => setFilterSeverity(sev)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filterSeverity === sev
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {sev} ({countForSev})
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredIssues.map((issue, idx) => (
                    <IssueItem key={idx} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: QUICK-FIX SNIPPETS */}
            {activeTab === 'snippets' && (
              <div className="space-y-4">
                {quickFixSnippets.map((snip, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-base">{snip.title}</h4>
                      </div>
                      <button
                        onClick={() => triggerCopy(snip.code, `snip-${idx}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedKey === `snip-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === `snip-${idx}` ? 'Copied Snippet' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                      {snip.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: 30-DAY SPRINT ROADMAP */}
            {activeTab === 'roadmap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {thirtyDayPlan.map((wk, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      <span>Week {wk.week}: {wk.theme}</span>
                    </div>
                    <ul className="space-y-2">
                      {wk.tasks?.map((t, tIdx) => (
                        <li key={tIdx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {popupEnabled && (
        <LeadCaptureModal
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          onSubmit={(leadData) => {
            setShowPopup(false)
            if (pendingPayload) runAudit(pendingPayload)
          }}
          toolName="SEO Site Audit"
        />
      )}
    </div>
  )
}
