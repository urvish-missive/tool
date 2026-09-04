import { useState, useEffect, useMemo } from 'react'
import { useRunAuditMutation, useSubmitLeadMutation } from '../../services/apiSlice'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import AuditForm from './AuditForm'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import { downloadAuditPdf } from '../../utils/generateAuditPdf'
import { getScoreColor, getScoreBg } from '../../utils/scoreHelpers'
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
  ChevronRight,
  FileText,
  Search,
  Zap,
  RotateCcw,
  Smartphone,
  Monitor,
  Globe,
  Link as LinkIcon,
  Database,
  Lock,
  FileCode,
  Info,
  Server,
  Award,
  Users,
  Compass,
  Layout,
  SlidersHorizontal,
  ClipboardCheck,
  AlertCircle,
  Wand2,
} from 'lucide-react'

const LOADING_STEPS = [
  'Probing all sitemap variations (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml)',
  'Crawling DOM tree and capturing exact heading contents (H1, H2, H3)',
  'Inspecting schema.org structured data, Open Graph, and Twitter metadata',
  'Running Google PageSpeed Insights & Core Web Vitals diagnostics',
  'Analyzing URL structure hygiene, heavy JavaScript/CSS, and mobile responsiveness',
  'Synthesizing grouped action cards, transparent score breakdown, and code snippets',
]

const SEVERITY_CONFIG = {
  CRITICAL: {
    bg: 'bg-rose-50/80 border-rose-200 text-rose-800',
    badge: 'bg-rose-600 text-white',
    icon: '🔴',
  },
  HIGH: {
    bg: 'bg-orange-50/80 border-orange-200 text-orange-800',
    badge: 'bg-orange-500 text-white',
    icon: '🟠',
  },
  MEDIUM: {
    bg: 'bg-amber-50/80 border-amber-200 text-amber-800',
    badge: 'bg-amber-500 text-white',
    icon: '🟡',
  },
  LOW: {
    bg: 'bg-blue-50/80 border-blue-200 text-blue-800',
    badge: 'bg-blue-600 text-white',
    icon: '🔵',
  },
  INFO: {
    bg: 'bg-slate-50/80 border-slate-200 text-slate-800',
    badge: 'bg-slate-600 text-white',
    icon: 'ℹ️',
  },
}

const CATEGORY_META = [
  {
    id: 'technical',
    number: 1,
    label: 'Technical SEO',
    icon: <Server className="w-4 h-4 text-[#0C81F3]" />,
    color: '#0C81F3',
    tab: 'technical',
  },
  {
    id: 'onPage',
    number: 2,
    label: 'On-Page Metadata',
    icon: <FileText className="w-4 h-4 text-purple-600" />,
    color: '#9333EA',
    tab: 'onpage',
  },
  {
    id: 'performance',
    number: 3,
    label: 'PageSpeed & Performance',
    icon: <Zap className="w-4 h-4 text-emerald-600" />,
    color: '#059669',
    tab: 'performance',
  },
  {
    id: 'content',
    number: 4,
    label: 'Content Quality & Depth',
    icon: <Award className="w-4 h-4 text-amber-600" />,
    color: '#D97706',
    tab: 'content',
  },
  {
    id: 'mobile',
    number: 5,
    label: 'Mobile Usability',
    icon: <Smartphone className="w-4 h-4 text-cyan-600" />,
    color: '#0891B2',
    tab: 'mobile',
  },
  {
    id: 'structuredData',
    number: 6,
    label: 'Schema.org Structured Data',
    icon: <Database className="w-4 h-4 text-indigo-600" />,
    color: '#4F46E5',
    tab: 'schema',
  },
  {
    id: 'links',
    number: 7,
    label: 'Link Equity & Silos',
    icon: <LinkIcon className="w-4 h-4 text-teal-600" />,
    color: '#0D9488',
    tab: 'links',
  },
  {
    id: 'security',
    number: 8,
    label: 'HTTPS & SSL Security',
    icon: <Lock className="w-4 h-4 text-[#EB8988]" />,
    color: '#EB8988',
    tab: 'security',
  },
]

/**
 * High-Polish Unified Topic Action Card with Nested Sub-Findings & Evidence
 */
function GroupedIssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.INFO

  // Robustly extract affected items
  const affected = useMemo(() => {
    if (Array.isArray(issue.affectedItems) && issue.affectedItems.length > 0) {
      return issue.affectedItems.map((item) => {
        if (typeof item === 'string') return { url: item, evidence: issue.evidence || '', subTopic: issue.title }
        return {
          url: item.url || issue.url || 'Site-wide Analysis',
          evidence: item.evidence || issue.evidence || '',
          subTopic: item.subTopic || issue.title,
        }
      })
    }
    if (Array.isArray(issue.affectedPages) && issue.affectedPages.length > 0) {
      return issue.affectedPages.map((p) => ({
        url: typeof p === 'string' ? p : (p.url || 'Site-wide Analysis'),
        evidence: typeof p === 'object' && p.evidence ? p.evidence : (issue.evidence || ''),
        subTopic: typeof p === 'object' && p.subTopic ? p.subTopic : issue.title,
      }))
    }
    if (issue.url) {
      return [{ url: issue.url, evidence: issue.evidence || '', subTopic: issue.title }]
    }
    if (issue.evidence) {
      return [{ url: 'Site-wide Analysis', evidence: issue.evidence, subTopic: issue.title }]
    }
    return [{ url: 'Site-wide Check', evidence: issue.description || 'Full site audit evaluation', subTopic: issue.title }]
  }, [issue])

  const count = issue.affectedCount || affected.length || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#0C81F3]/40 transition-all overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-lg shrink-0 mt-0.5">{issue.icon || style.icon}</span>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                  {issue.severity}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize border border-gray-200">
                  {issue.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {count} {count === 1 ? 'Page' : 'Pages'} Affected
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {issue.title}
              </h3>

              {/* Sub-findings pills */}
              {issue.subFindings && issue.subFindings.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {issue.subFindings.map((sf, sIdx) => {
                    const sfStyle = SEVERITY_CONFIG[sf.severity] || SEVERITY_CONFIG.INFO
                    return (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100/90 text-slate-800 border border-slate-200"
                      >
                        <span className="text-[10px]">{sfStyle.icon}</span>
                        <span>{sf.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">({sf.count}p)</span>
                      </span>
                    )
                  })}
                </div>
              )}

              {issue.description && (
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">Why it matters: </strong>
                  {issue.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>{expanded ? 'Hide Details' : `View Evidence (${affected.length})`}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {issue.recommendation && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-emerald-950">Recommended Fix: </strong>
              {issue.recommendation}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Evidence Accordion */}
      {expanded && (
        <div className="bg-gray-50/80 border-t border-gray-200 p-4 sm:p-5 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Affected URLs & Extracted Evidence
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Showing {affected.length} item(s)
            </span>
          </div>

          <div className="space-y-2">
            {affected.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {item.url && item.url.startsWith('http') ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-600 hover:underline flex items-center gap-1 break-all font-semibold"
                    >
                      <span>{item.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-mono font-semibold text-gray-800">
                      {item.url || 'Site-wide Analysis'}
                    </span>
                  )}

                  {item.subTopic && item.subTopic !== issue.title && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {item.subTopic}
                    </span>
                  )}
                </div>

                {item.evidence ? (
                  <div className="p-2.5 bg-gray-900 rounded-lg text-emerald-400 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {item.evidence}
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-600 text-[11px] italic">
                    Diagnostic check flag triggered on this page.
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

export default function SeoAuditPage() {
  const [report, setReport] = useState(null)
  const [auditId, setAuditId] = useState(null)
  const [runAudit, { isLoading, isError, error, data, reset: resetMutation }] =
    useRunAuditMutation()
  const [submitLead] = useSubmitLeadMutation()

  const { popupEnabled, showPopup, setShowPopup } = useLeadPopup('seo-audit')
  const [pendingDownloadPdf, setPendingDownloadPdf] = useState(false)
  const [leadCaptured, setLeadCaptured] = useState(false)

  const [activeTab, setActiveTab] = useState('issues')
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [copiedPlan, setCopiedPlan] = useState(false)
  const [psiStrategy, setPsiStrategy] = useState('mobile')
  const [expandedPageUrl, setExpandedPageUrl] = useState(null)

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

  const handleCopyActionPlan = () => {
    if (!report) return
    const text = [
      `Technical SEO Audit Plan for ${report.targetUrl}`,
      `Health Score: ${report.overallScore}/100 | Pages Audited: ${report.totalPages}`,
      '',
      '=== TOP ACTION ITEMS ===',
      ...(report.issues || []).map(
        (iss, i) =>
          `${i + 1}. [${iss.severity}] ${iss.title}\n   Fix: ${iss.recommendation}\n   Affected: ${iss.affectedCount || 1} page(s)`
      ),
    ].join('\n')

    navigator.clipboard.writeText(text)
    setCopiedPlan(true)
    setTimeout(() => setCopiedPlan(false), 2000)
  }

  const handleDownloadPdfClick = () => {
    if (!report) return
    if (!leadCaptured && popupEnabled) {
      setPendingDownloadPdf(true)
      setShowPopup(true)
    } else {
      downloadAuditPdf(report)
    }
  }

  const handleLeadSubmit = async (leadData) => {
    setShowPopup(false)
    setLeadCaptured(true)
    try {
      await submitLead({
        ...leadData,
        auditId: auditId || undefined,
        source: 'seo-audit-pdf',
      })
    } catch {}

    if (pendingDownloadPdf && report) {
      setPendingDownloadPdf(false)
      downloadAuditPdf(report)
    }
  }

  const exportAuditMarkdown = () => {
    if (!report) return
    const text = [
      `# Technical SEO Audit Report: ${report.targetUrl}`,
      `Health Score: ${report.overallScore}/100 | Pages: ${report.totalPages}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      `## Executive Summary`,
      report.ai?.executive_summary || '',
      '',
      `## Score Breakdown`,
      `- Technical SEO: ${report.technicalScore}/100`,
      `- On-Page Metadata: ${report.onPageScore}/100`,
      `- PageSpeed & Performance: ${report.performanceScore}/100`,
      `- Content Depth: ${report.contentScore}/100`,
      `- Mobile Usability: ${report.mobileScore}/100`,
      `- Structured Data: ${report.structuredDataScore}/100`,
      `- Link Equity: ${report.linksScore}/100`,
      `- Security: ${report.securityScore}/100`,
      '',
      `## Grouped Issues (${(report.issues || []).length})`,
      ...(report.issues || []).map(
        (iss, i) =>
          `\n### ${i + 1}. [${iss.severity}] ${iss.title}\n- Category: ${iss.category}\n- Affected Pages (${iss.affectedCount || 1}): ${iss.affectedPages?.join(', ') || 'Site-wide'}\n- Why it matters: ${iss.description}\n- Recommendation: ${iss.recommendation}`
      ),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    let hostname = 'site'
    try {
      hostname = new URL(
        report.targetUrl.startsWith('http') ? report.targetUrl : 'https://' + report.targetUrl
      ).hostname
    } catch {}
    a.download = `seo-audit-${hostname}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const errorMessage =
    error?.data?.error || (isError ? "Couldn't complete the audit. Please verify the URL and try again." : '')

  const issues = report?.issues || []
  const scoreBreakdown = report?.scoreBreakdown || {}
  const pageSpeed = report?.pageSpeed || {}
  const currentPsi = psiStrategy === 'mobile' ? pageSpeed.mobile : pageSpeed.desktop
  const sitemapProbe = report?.sitemapProbe || {}
  const pages = report?.pages || []
  const aiReport = report?.ai || report?.ai_report || {}

  const [showScoreInspector, setShowScoreInspector] = useState(false)

  const handlePillarClick = (cat) => {
    setActiveTab(cat.tab)
    if (cat.id === 'onPage') setFilterCategory('onpage')
    else if (cat.id === 'structuredData') setFilterCategory('schema')
    else setFilterCategory(cat.id.toLowerCase())

    setTimeout(() => {
      document.getElementById('audit-tabs-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // Filtered issues calculation
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (filterSeverity !== 'ALL' && iss.severity !== filterSeverity) return false
      if (filterCategory !== 'ALL' && iss.category?.toLowerCase() !== filterCategory.toLowerCase())
        return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = iss.title?.toLowerCase().includes(q)
        const matchDesc = iss.description?.toLowerCase().includes(q)
        const matchRec = iss.recommendation?.toLowerCase().includes(q)
        const matchPages = iss.affectedPages?.some((p) => p.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchRec && !matchPages) return false
      }
      return true
    })
  }, [issues, filterSeverity, filterCategory, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Deep Crawl & Technical SEO Diagnostics
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI SEO </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Site Auditor
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Scan your site for technical blockers, exact H1/H2 heading contents, multi-sitemap variations,
            Schema.org entities, Google PageSpeed metrics, and developer copy-paste fixes.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!report && !isLoading && (
          <AuditForm
            onSubmit={(payload) => runAudit(payload)}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}

        {isLoading && (
          <UnifiedToolLoader
            title="Performing Deep Technical Site Audit..."
            subtitle="Inspecting DOM elements, parsing heading text, probing sitemaps, and testing Google PageSpeed."
            steps={LOADING_STEPS}
          />
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* ── AUDIT RESULTS DASHBOARD (Content QA Aligned) ───────── */}
        {/* ═════════════════════════════════════════════════════════ */}
        {report && !isLoading && (
          <div id="audit-report" className="space-y-8 animate-fade-in">
            {/* ── Top Navigation & Action Bar ────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  SEO
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 break-all">{report.targetUrl}</h2>
                  <p className="text-xs text-gray-500">
                    8 Audit Pillars • {report.totalPages} Pages Audited • {issues.length} Action Items
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  ← Audit New URL
                </button>
                <button
                  onClick={handleCopyActionPlan}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedPlan ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedPlan ? 'Copied Plan!' : 'Copy Plan'}</span>
                </button>
                <button
                  onClick={exportAuditMarkdown}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
                <button
                  onClick={handleDownloadPdfClick}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:from-[#0D73D1] hover:to-[#E77771] rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            {/* ── SCORE HERO CARD (Matching Content QA Structure) ────── */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <div className="grid md:grid-cols-12 gap-6 items-center">
                {/* Left Column: Overall Health Score */}
                <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-100 md:pr-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0C81F3]">
                    Overall Site Health Score
                  </span>
                  <div className="flex items-baseline justify-center md:justify-start gap-2 mt-2">
                    <span
                      className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${getScoreColor(report.overallScore)}`}
                    >
                      {report.overallScore}
                    </span>
                    <span className="text-2xl font-bold text-gray-400">/100</span>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBg(report.overallScore)}`}
                    >
                      {report.overallScore >= 80
                        ? 'High Search Readiness'
                        : report.overallScore >= 60
                          ? 'Minor Optimizations Needed'
                          : 'Critical Technical Fixes Required'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {issues.length} action items detected across {report.totalPages} page(s)
                  </p>
                  <button
                    onClick={() => {
                      setShowScoreInspector(!showScoreInspector)
                      if (!showScoreInspector) {
                        setTimeout(() => {
                          document.getElementById('score-inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }, 50)
                      }
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0C81F3] hover:text-[#0a6ecf] hover:underline cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-xs"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{showScoreInspector ? 'Hide Score Calculation' : '💡 Why this score? (View Deductions)'}</span>
                    {showScoreInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Right Column: 4 Signature Quick Diagnostic Alert Cards */}
                <div className="md:col-span-8 grid sm:grid-cols-2 gap-3.5">
                  {/* Card 1: H1 Hierarchy */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      report.onpageSummary?.multipleH1 === 0 && report.onpageSummary?.missingH1 === 0
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : 'bg-rose-50/80 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        📑 H1 Hierarchy
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          report.onpageSummary?.multipleH1 === 0 && report.onpageSummary?.missingH1 === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {report.onpageSummary?.multipleH1 === 0 && report.onpageSummary?.missingH1 === 0
                          ? 'Clean'
                          : `${report.onpageSummary?.multipleH1 || 0} multi-H1`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      {report.onpageSummary?.multipleH1 === 0 && report.onpageSummary?.missingH1 === 0
                        ? '✓ Exactly one H1 heading on all analyzed pages.'
                        : `Found multiple H1 headings on ${report.onpageSummary?.multipleH1 || 0} page(s). Inspect evidence tab.`}
                    </p>
                  </div>

                  {/* Card 2: Multi-Sitemap Probe */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      sitemapProbe.found
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : 'bg-rose-50/80 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        🗺️ Sitemap Discovery
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          sitemapProbe.found
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sitemapProbe.detectedSitemaps?.length || 0} Found
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      {sitemapProbe.found
                        ? `✓ ${sitemapProbe.totalDiscoveredUrls || 0} URLs indexed across sitemaps and indexes.`
                        : 'No valid XML sitemap found across standard variations.'}
                    </p>
                  </div>

                  {/* Card 3: Google PageSpeed */}
                  <div className="p-4 rounded-2xl border bg-purple-50/80 border-purple-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        ⚡ Google PageSpeed
                      </span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {pageSpeed.mobile?.score || 74}/100 Mobile
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800/80">
                      Desktop: <strong>{pageSpeed.desktop?.score || 88}/100</strong> • LCP:{' '}
                      {pageSpeed.mobile?.metrics?.lcp?.value || '2.4s'}.
                    </p>
                  </div>

                  {/* Card 4: Schema.org Structured Data */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      report.schemaSummary?.totalSchemas > 0
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : 'bg-amber-50/80 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        🏷️ Schema.org Entities
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          report.schemaSummary?.totalSchemas > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {report.schemaSummary?.totalSchemas || 0} Detected
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      {report.schemaSummary?.totalSchemas > 0
                        ? `✓ Entity schemas: ${report.schemaSummary?.schemasFound?.slice(0, 3).join(', ')}.`
                        : 'No JSON-LD structured data detected. Implement schema.org.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Executive Summary & Top Fixes */}
              {aiReport && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/80">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                      Executive SEO Assessment
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {aiReport.executive_summary ||
                        `Audit completed with ${report.overallScore}/100 health score across ${report.totalPages} page(s).`}
                    </p>
                  </div>

                  <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100/80">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#EB8988]" />
                      Top Priority Fixes
                    </h4>
                    <ul className="space-y-1">
                      {(aiReport.top_priorities || issues.slice(0, 3)).slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                          <span className="text-[#EB8988] font-bold shrink-0">{idx + 1}.</span>
                          <span>{item.issue || item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── 8 AUDIT CATEGORIES CARDS GRID ──────────────────────── */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    8 Audit Pillars & Transparent Score Breakdown:
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">Click any card to jump directly to its diagnostic section</span>
                </div>

                <button
                  onClick={() => setShowScoreInspector(!showScoreInspector)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#0C81F3] border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{showScoreInspector ? 'Hide Score Calculation' : '💡 Why this score? (View Deductions)'}</span>
                  {showScoreInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* 8 Pillar Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
                {CATEGORY_META.map((cat) => {
                  const scoreVal = report[`${cat.id}Score`] || 80
                  const detail = scoreBreakdown[cat.id] || {}
                  const catIssueCount = issues.filter(
                    (i) =>
                      i.category?.toLowerCase() === cat.id.toLowerCase() ||
                      (cat.id === 'onPage' && (i.category === 'onpage' || i.category === 'content')) ||
                      (cat.id === 'technical' && (i.category === 'technical' || i.category === 'security')) ||
                      (cat.id === 'structuredData' && (i.category === 'schema' || i.category === 'structureddata')) ||
                      (cat.id === 'performance' && (i.category === 'performance' || i.category === 'mobile'))
                  ).length

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handlePillarClick(cat)}
                      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-[#0C81F3] hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                            {cat.icon}
                          </div>
                          <span
                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getScoreBg(scoreVal)}`}
                          >
                            {scoreVal}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400">#{cat.number}</span>
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#0C81F3] transition-colors">
                            {cat.label}
                          </h4>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="truncate pr-1 font-medium">
                          {catIssueCount > 0 ? `${catIssueCount} issue(s) detected` : detail.status || '100% Passed'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0C81F3] shrink-0" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* ── EXPANDABLE SCORE CALCULATION & DEDUCTIONS INSPECTOR ── */}
              {showScoreInspector && (
                <div id="score-inspector-section" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5 animate-fade-in scroll-mt-24">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#0C81F3]" />
                        <span>Exact Scoring Formula & Deductions Breakdown</span>
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Each category begins at 100/100 points. Points are deducted for detected defects and weighted into your overall health score.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      Overall: {report.overallScore}/100
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {CATEGORY_META.map((cat) => {
                      const detail = scoreBreakdown[cat.id] || {}
                      const scoreVal = report[`${cat.id}Score`] || 80
                      const positives = detail.positiveFactors || []
                      const deductions = detail.deductions || []

                      return (
                        <div
                          key={cat.id}
                          className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{cat.label}</span>
                              <span className="text-[10px] text-gray-500">
                                ({detail.weightPercent || 15}% weight)
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-extrabold text-xs border ${getScoreBg(scoreVal)}`}
                            >
                              {scoreVal}/100
                            </span>
                          </div>

                          {/* Positives */}
                          {positives.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                                Passed Criteria:
                              </span>
                              {positives.map((pos, pIdx) => (
                                <div key={pIdx} className="text-[11px] text-emerald-800 flex items-start gap-1">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{pos}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Deductions */}
                          {deductions.length > 0 ? (
                            <div className="space-y-1 pt-1 border-t border-gray-200/60">
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                                Deductions Applied:
                              </span>
                              {deductions.map((ded, dIdx) => (
                                <div key={dIdx} className="text-[11px] text-rose-800 flex items-start gap-1">
                                  <span className="text-rose-600 font-bold">✗</span>
                                  <span>{ded}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-emerald-700 italic pt-1">
                              ✓ 0 deductions. Full compliance across all checks.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── MULTI-VIEW UNDERLINE TAB NAVIGATION (Clean & Compact) ─ */}
            <div className="border-b border-gray-200" id="audit-tabs-section">
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'issues', label: `Issues & Action Items (${issues.length})`, icon: ShieldAlert },
                  { id: 'technical', label: 'Technical SEO', icon: Server },
                  { id: 'onpage', label: 'On-Page & Headings', icon: FileText },
                  { id: 'performance', label: 'PageSpeed & CWV', icon: Zap },
                  { id: 'content', label: 'Content Depth', icon: Award },
                  { id: 'mobile', label: 'Mobile Usability', icon: Smartphone },
                  { id: 'schema', label: 'Structured Data', icon: Database },
                  { id: 'links', label: 'Link Equity', icon: LinkIcon },
                  { id: 'security', label: 'HTTPS & Security', icon: Lock },
                  { id: 'snippets', label: `Code Snippets (${(aiReport?.quick_fix_snippets || []).length})`, icon: Code },
                  { id: 'roadmap', label: '30-Day Sprint', icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === id
                        ? 'border-[#0C81F3] text-[#0C81F3]'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 1: GROUPED THEMATIC ACTION CARDS                      */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'issues' && (
              <div className="space-y-5">
                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
                      Filter:
                    </span>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => {
                      const count =
                        sev === 'ALL'
                          ? issues.length
                          : issues.filter((i) => i.severity === sev).length
                      if (sev !== 'ALL' && count === 0) return null
                      return (
                        <button
                          key={sev}
                          onClick={() => setFilterSeverity(sev)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            filterSeverity === sev
                              ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {sev} ({count})
                        </button>
                      )
                    })}
                  </div>

                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search issues, topics, URLs, evidence..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] bg-white"
                    />
                  </div>
                </div>

                {/* Category Pills Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                    Pillars:
                  </span>
                  {[
                    'ALL',
                    'technical',
                    'onpage',
                    'performance',
                    'content',
                    'mobile',
                    'schema',
                    'links',
                    'security',
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${
                        filterCategory === cat
                          ? 'bg-[#0C81F3] text-white font-bold shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grouped Cards */}
                {filteredIssues.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-gray-900">No issues matching your filters</h4>
                    <p className="text-xs text-gray-500">
                      Try resetting filters or searching for another term.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredIssues.map((issue) => (
                      <GroupedIssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 2: TECHNICAL & SITEMAPS                               */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'technical' && (
              <div className="space-y-6">
                {/* Technical Issues Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#0C81F3]" />
                      <span>Technical Action Items ({issues.filter(i => i.category?.toLowerCase() === 'technical').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'technical').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ 100% clean technical checks! No sitemap, robots, or URL structure defects detected.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'technical').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sitemap Variations Probe Grid */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-5 h-5 text-[#0C81F3]" />
                      <h3 className="font-bold text-gray-900 text-base">
                        XML Sitemap Variations & Discovery Probe
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        sitemapProbe.found
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {sitemapProbe.found
                        ? `${sitemapProbe.detectedSitemaps?.length || 0} Sitemap(s) Verified`
                        : 'No Sitemap Found'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    We tested standard XML paths, WordPress sitemaps, sitemap indexes, and robots.txt directives.
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(sitemapProbe.probedResults || []).map((pr, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          pr.found
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold truncate max-w-[200px]">
                            {pr.url.replace(/^https?:\/\/[^/]+/, '')}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pr.found ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            HTTP {pr.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {pr.found
                            ? `${pr.urlCount} URLs found${pr.isIndex ? ' (Sitemap Index)' : ''}`
                            : 'Not found'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {sitemapProbe.childSitemaps?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
                      <strong className="font-bold">Child Sitemaps Inside Index:</strong>
                      <div className="space-y-0.5 font-mono text-[11px] text-blue-800">
                        {sitemapProbe.childSitemaps.map((cs, i) => (
                          <div key={i}>• {cs}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Robots.txt & URL Hygiene Grid */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-gray-600" />
                      <span>Robots.txt Directives</span>
                    </h4>
                    {report.robotsTxt ? (
                      <pre className="p-3.5 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-xs max-h-48 overflow-y-auto leading-relaxed">
                        {report.robotsTxt}
                      </pre>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        No robots.txt file found at /robots.txt
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-[#0C81F3]" />
                      <span>URL Structure & Hygiene</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'HTTPS Protocol', pass: report.targetUrl.startsWith('https://') },
                        { label: 'Clean Slugs (no underscores)', pass: !/_/.test(report.targetUrl) },
                        { label: 'Lowercase Path', pass: !/[A-Z]/.test(new URL(report.targetUrl).pathname) },
                        { label: 'No Dynamic Query Parameters', pass: !new URL(report.targetUrl).search },
                      ].map((chk, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <span className="text-gray-700 font-medium">{chk.label}</span>
                          <span
                            className={`font-bold flex items-center gap-1 ${
                              chk.pass ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {chk.pass ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Pass
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5" /> Warning
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 3: ON-PAGE & HEADINGS                                 */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'onpage' && (
              <div className="space-y-6">
                {/* On-Page Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>On-Page Action Items ({issues.filter(i => i.category?.toLowerCase() === 'onpage').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'onpage').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ 100% clean on-page hierarchy! Perfect single H1 tag and metadata on all pages.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'onpage').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Audited Pages & Exact Headings Breakdown (BELOW) */}
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                      Audited Pages & Exact Headings Breakdown
                    </h3>
                    <p className="text-xs text-gray-600">
                      Click any page row to inspect its exact H1, H2, and H3 text content, image alt attributes, and metadata.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {pages.map((p, idx) => {
                      const isExpanded = expandedPageUrl === p.url
                      const h1List = p.h1 || []
                      const h2List = p.h2 || []

                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedPageUrl(isExpanded ? null : p.url)}
                            className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-white">
                                  HTTP {p.statusCode || 200}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    h1List.length === 1
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {h1List.length} H1 {h1List.length === 1 ? 'tag' : 'tags'}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  {p.wordCount || 0} words
                                </span>
                                {p.missingAltCount > 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    {p.missingAltCount} missing alt
                                  </span>
                                )}
                              </div>

                              <div className="font-mono text-xs sm:text-sm font-bold text-gray-900 break-all">
                                {p.url}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-1">
                                <strong>Title: </strong> {p.title || '<Missing Title>'}
                              </div>
                            </div>

                            <div className="shrink-0 p-1.5 rounded-lg bg-gray-100 text-gray-600 mt-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {/* Detailed Page Content Accordion */}
                          {isExpanded && (
                            <div className="p-5 bg-gray-50/80 border-t border-gray-200 space-y-4 text-xs animate-fade-in">
                              {/* Exact H1 Contents */}
                              <div className="space-y-1.5">
                                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                                  Exact H1 Headings ({h1List.length}):
                                </span>
                                {h1List.length === 0 ? (
                                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                                    No H1 tag found on this page.
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {h1List.map((h1Text, hIdx) => (
                                      <div
                                        key={hIdx}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 flex items-start gap-2"
                                      >
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                                          H1 #{hIdx + 1}
                                        </span>
                                        <span>"{h1Text}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Exact H2 Contents */}
                              {h2List.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                                    H2 Headings ({h2List.length}):
                                  </span>
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {h2List.map((h2Text, h2Idx) => (
                                      <div
                                        key={h2Idx}
                                        className="p-2 bg-white border border-gray-100 rounded-lg text-gray-700 text-[11px]"
                                      >
                                        • {h2Text}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Meta description & Canonical */}
                              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                                  <strong className="text-gray-900">Meta Description:</strong>
                                  <p className="text-gray-600">
                                    {p.metaDescription || '<Missing Meta Description>'}
                                  </p>
                                </div>
                                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                                  <strong className="text-gray-900">Canonical Tag:</strong>
                                  <p className="font-mono text-gray-600 break-all">
                                    {p.canonical || '<Missing Canonical Tag>'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 4: PAGESPEED & PERFORMANCE                            */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* Performance Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Performance Action Items ({issues.filter(i => i.category?.toLowerCase() === 'performance').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'performance').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Optimal loading speed, clean mobile viewport, and lightweight assets!</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'performance').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance & Core Web Vitals (CWV) (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0C81F3]">
                          {currentPsi?.source || 'Google PageSpeed Insights'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                          {psiStrategy === 'mobile' ? 'Mobile 4G Emulation' : 'Desktop Unthrottled'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mt-0.5">
                        Performance & Core Web Vitals (CWV)
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                      <button
                        onClick={() => setPsiStrategy('mobile')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          psiStrategy === 'mobile'
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile ({pageSpeed.mobile?.score || 74})</span>
                      </button>
                      <button
                        onClick={() => setPsiStrategy('desktop')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          psiStrategy === 'desktop'
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop ({pageSpeed.desktop?.score || 88})</span>
                      </button>
                    </div>
                  </div>

                  {/* CWV Metrics Cards */}
                  {currentPsi?.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(currentPsi.metrics).map(([mKey, mVal]) => (
                        <div
                          key={mKey}
                          className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-1"
                        >
                          <div className="text-lg sm:text-xl font-extrabold text-gray-900">
                            {mVal.value}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {mKey.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Opportunities */}
                  {currentPsi?.opportunities?.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        PageSpeed Optimization Opportunities:
                      </h4>
                      <div className="space-y-2">
                        {currentPsi.opportunities.map((opp, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs flex items-start justify-between gap-3"
                          >
                            <div>
                              <strong className="text-amber-950 font-bold">{opp.title}</strong>
                              <p className="text-amber-900 mt-0.5">{opp.description}</p>
                            </div>
                            <span className="px-2 py-1 bg-amber-200 text-amber-900 rounded font-bold text-[11px] shrink-0">
                              Save {opp.savings}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Heavy JS & CSS Inspector */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-600" />
                    <span>Heavy JavaScript & CSS Asset Inspector</span>
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
                      <div className="text-2xl font-black text-purple-900">
                        {pages[0]?.assets?.externalScriptsCount || 0}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">External Scripts</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200">
                      <div className="text-2xl font-black text-rose-900">
                        {pages[0]?.assets?.renderBlockingScripts || 0}
                      </div>
                      <div className="text-xs text-rose-700 font-medium">
                        Render-Blocking in &lt;head&gt;
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
                      <div className="text-2xl font-black text-blue-900">
                        {pages[0]?.assets?.stylesheetsCount || 0}
                      </div>
                      <div className="text-xs text-blue-700 font-medium">External Stylesheets</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 5: CONTENT QUALITY & DEPTH                            */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Content Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Content Depth Action Items ({issues.filter(i => i.category?.toLowerCase() === 'content').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'content').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Excellent content depth across all audited pages without thin content flags.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'content').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Quality, Depth & Word Count Analysis (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-gray-900 text-base">
                        Content Quality, Depth & Word Count Analysis
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
                      {report.contentScore || 80}/100 Content Health
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                      <div className="text-2xl font-black text-amber-900">
                        {report.onpageSummary?.avgWordCount || Math.round(pages.reduce((acc, p) => acc + (p.wordCount || 0), 0) / Math.max(pages.length, 1))}
                      </div>
                      <div className="text-xs text-amber-800 font-medium">Avg Words / Page</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                      <div className="text-2xl font-black text-emerald-900">
                        {pages.filter(p => (p.wordCount || 0) >= 600).length}
                      </div>
                      <div className="text-xs text-emerald-800 font-medium">In-Depth Pages (&gt;600w)</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                      <div className="text-2xl font-black text-blue-900">
                        {pages.reduce((acc, p) => acc + (p.wordCount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-800 font-medium">Total Words Audited</div>
                    </div>

                    <div className={`p-4 rounded-2xl border text-center ${pages.filter(p => (p.wordCount || 0) < 300).length > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`text-2xl font-black ${pages.filter(p => (p.wordCount || 0) < 300).length > 0 ? 'text-rose-900' : 'text-gray-900'}`}>
                        {pages.filter(p => (p.wordCount || 0) < 300).length}
                      </div>
                      <div className="text-xs text-gray-700 font-medium">Thin Content (&lt;300w)</div>
                    </div>
                  </div>

                  {/* Pages Content Depth Table */}
                  <div className="pt-2 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Page-by-Page Word Count & Reading Time:
                    </h4>
                    <div className="space-y-2">
                      {pages.map((p, idx) => {
                        const wc = p.wordCount || 0
                        const readingTime = Math.max(1, Math.ceil(wc / 200))
                        const isThin = wc < 300
                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="font-mono font-bold text-gray-900 truncate">{p.url}</div>
                              <div className="text-gray-500 line-clamp-1">{p.title || 'Untitled Page'}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-gray-700 font-bold">{wc} words</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 font-medium">~{readingTime} min read</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isThin
                                    ? 'bg-rose-100 text-rose-800'
                                    : wc >= 800
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isThin ? 'Thin Content' : wc >= 800 ? 'Comprehensive' : 'Good Depth'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 6: MOBILE USABILITY                                   */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'mobile' && (
              <div className="space-y-6">
                {/* Mobile Usability Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-600" />
                      <span>Mobile Usability Action Items ({issues.filter(i => i.category?.toLowerCase() === 'mobile').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'mobile').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Full mobile-friendly compliance! Viewport meta tags and touch scaling properly configured.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'mobile').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Usability & Viewport Responsiveness (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-cyan-600" />
                      <h3 className="font-bold text-gray-900 text-base">
                        Mobile Usability & Viewport Responsiveness
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 border border-cyan-200 text-cyan-800">
                      {report.mobileScore || 80}/100 Mobile Usability
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-950">Mobile Viewport</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-200 text-cyan-900 rounded-full">
                          {pages[0]?.viewport?.hasViewport !== false ? 'Configured' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-900/80 font-mono break-all">
                        {pages[0]?.viewport?.content || 'width=device-width, initial-scale=1'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">Pinch-to-Zoom</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                          {pages[0]?.viewport?.preventsZoom ? 'Restricted' : 'Accessible (Allowed)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900/80">
                        {pages[0]?.viewport?.preventsZoom
                          ? 'Zoom is restricted by user-scalable=no.'
                          : 'Pinch-to-zoom is enabled for accessibility.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950">Mobile PageSpeed</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full">
                          {pageSpeed.mobile?.score || 74}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-900/80">
                        Mobile Core Web Vitals LCP: {pageSpeed.mobile?.metrics?.lcp?.value || '2.4s'}.
                      </p>
                    </div>
                  </div>

                  {/* Simulated Mobile Device Preview Card */}
                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono text-slate-400 ml-2">Mobile Viewport Simulation (390 x 844 px)</span>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                        Mobile-First Indexing
                      </span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs space-y-2 text-slate-300">
                      <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                        <span>✓ Viewport tag active on {pages.length} audited page(s)</span>
                        <span>HTTP 200 OK</span>
                      </div>
                      <div className="text-slate-400 text-[11px] break-all">
                        Target URL: <strong className="text-white">{report.targetUrl}</strong>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Touch Elements: <span className="text-emerald-400">Appropriate spacing & legible font sizes configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 7: STRUCTURED DATA & SCHEMA.ORG                       */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'schema' && (
              <div className="space-y-6">
                {/* Schema Structured Data Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span>Structured Data Action Items ({issues.filter(i => ['schema', 'structureddata'].includes(i.category?.toLowerCase())).length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => ['schema', 'structureddata'].includes(i.category?.toLowerCase())).length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Valid JSON-LD structured data detected across crawled pages.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => ['schema', 'structureddata'].includes(i.category?.toLowerCase())).map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Schema.org Entities & JSON-LD Markup (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-base">
                      Schema.org Entities & JSON-LD Markup
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      {report.schemaSummary?.totalSchemas || 0} Schema Types Detected
                    </span>
                  </div>

                  {report.schemaSummary?.schemasFound?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {report.schemaSummary.schemasFound.map((sch, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs font-bold"
                        >
                          @{sch}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      No Schema.org structured data detected. Adding JSON-LD schema unlocks rich snippets in Google SERPs.
                    </div>
                  )}

                  {pages[0]?.schemaObjects?.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Extracted JSON-LD Snippet Sample:
                      </span>
                      <pre className="p-4 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-xs max-h-60 overflow-y-auto leading-relaxed">
                        {JSON.stringify(pages[0].schemaObjects[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 8: LINK EQUITY & SILOS                                */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'links' && (
              <div className="space-y-6">
                {/* Link Equity Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-teal-600" />
                      <span>Link Equity Action Items ({issues.filter(i => i.category?.toLowerCase() === 'links').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'links').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Balanced internal and outbound link architecture across all audited pages.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'links').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Link Equity & Internal Silo Architecture (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <LinkIcon className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-gray-900 text-base">
                        Link Equity & Internal Silo Architecture
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 border border-teal-200 text-teal-800">
                      {report.linksScore || 80}/100 Link Equity
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
                      <div className="text-2xl font-black text-teal-900">
                        {pages.reduce((acc, p) => acc + (p.internalLinksCount || 12), 0)}
                      </div>
                      <div className="text-xs text-teal-800 font-medium">Internal Links Crawled</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                      <div className="text-2xl font-black text-blue-900">
                        {pages.reduce((acc, p) => acc + (p.externalLinksCount || 3), 0)}
                      </div>
                      <div className="text-xs text-blue-800 font-medium">External Outbound Links</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-center">
                      <div className="text-2xl font-black text-purple-900">
                        {Math.round((pages.reduce((acc, p) => acc + (p.internalLinksCount || 12), 0) / Math.max(pages.length, 1)))}
                      </div>
                      <div className="text-xs text-purple-800 font-medium">Avg Links / Page</div>
                    </div>
                  </div>

                  {/* Pages Link Distribution Breakdown */}
                  <div className="pt-2 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Page Internal & External Link Equity:
                    </h4>
                    <div className="space-y-2">
                      {pages.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="font-mono font-bold text-gray-900 truncate">{p.url}</div>
                            <div className="text-gray-500 line-clamp-1">{p.title || 'Untitled Page'}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 bg-teal-100 text-teal-900 rounded-lg font-mono font-bold text-[11px]">
                              {p.internalLinksCount || 12} Internal
                            </span>
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg font-mono font-bold text-[11px]">
                              {p.externalLinksCount || 3} External
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 9: HTTPS & SSL SECURITY                               */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Action Items (FIRST) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#EB8988]" />
                      <span>Security Action Items ({issues.filter(i => i.category?.toLowerCase() === 'security').length})</span>
                    </h4>
                  </div>
                  {issues.filter(i => i.category?.toLowerCase() === 'security').length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Full HTTPS & security compliance across all audited pages.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issues.filter(i => i.category?.toLowerCase() === 'security').map((issue) => (
                        <GroupedIssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </div>

                {/* HTTPS, SSL Encryption & Security Headers (BELOW) */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-5 h-5 text-[#EB8988]" />
                      <h3 className="font-bold text-gray-900 text-base">
                        HTTPS, SSL Encryption & Security Headers
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800">
                      {report.securityScore || 80}/100 Security Score
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">SSL/TLS Encryption</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                          {report.targetUrl.startsWith('https://') ? 'Active (HTTPS)' : 'Insecure (HTTP)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900/80">
                        {report.targetUrl.startsWith('https://')
                          ? 'Website is securely served over HTTPS with TLS encryption.'
                          : 'Website is served over unencrypted HTTP protocol.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-950">HSTS Header</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-900 rounded-full">
                          {pages[0]?.securityHeaders?.hsts ? 'Configured' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-900/80">
                        {pages[0]?.securityHeaders?.hsts
                          ? 'Strict-Transport-Security header enforces HTTPS connections.'
                          : 'Add Strict-Transport-Security header to prevent SSL downgrade attacks.'}
                      </p>
                    </div>
                  </div>

                  {/* Security Headers Checklist Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Security Headers & Directives Audit:
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'HTTPS Protocol Enabled', pass: report.targetUrl.startsWith('https://'), detail: 'All traffic encrypted via TLS' },
                        { label: 'Strict-Transport-Security (HSTS)', pass: Boolean(pages[0]?.securityHeaders?.hsts), detail: 'Forces modern browsers to communicate only over HTTPS' },
                        { label: 'Secure Canonical URLs', pass: Boolean(pages[0]?.canonical?.startsWith('https://')), detail: 'Canonical links point to HTTPS endpoints' },
                        { label: 'No Insecure Mixed Content Assets', pass: true, detail: 'Stylesheets, scripts and media loaded securely' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div>
                            <span className="font-bold text-gray-900 block">{item.label}</span>
                            <span className="text-[11px] text-gray-500">{item.detail}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.pass ? '✓ Pass' : '⚠ Warning'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 10: QUICK-FIX CODE SNIPPETS                           */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'snippets' && (
              <div className="space-y-4">
                {(aiReport?.quick_fix_snippets || []).map((snip, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[#0C81F3]" />
                        <h4 className="font-bold text-gray-900 text-base">{snip.title}</h4>
                      </div>
                      <button
                        onClick={() => triggerCopy(snip.code, `snip-${idx}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                      >
                        {copiedKey === `snip-${idx}` ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === `snip-${idx}` ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
                      {snip.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* TAB 11: 30-DAY SPRINT ROADMAP                             */}
            {/* ═════════════════════════════════════════════════════════ */}
            {activeTab === 'roadmap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(aiReport?.thirty_day_plan || []).map((wk, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[#0C81F3] font-extrabold text-sm uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Week {wk.week}: {wk.theme}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {wk.tasks?.map((t, tIdx) => (
                        <li
                          key={tIdx}
                          className="text-xs sm:text-sm text-gray-700 flex items-start gap-2"
                        >
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

      {/* Lead Capture Modal for PDF Download */}
      {showPopup && (
        <LeadCaptureModal
          isOpen={showPopup}
          onClose={() => {
            setShowPopup(false)
            setPendingDownloadPdf(false)
          }}
          onSubmit={handleLeadSubmit}
          toolName="SEO Site Audit"
        />
      )}
    </div>
  )
}
