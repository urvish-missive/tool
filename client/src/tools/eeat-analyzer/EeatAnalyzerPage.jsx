import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ShieldCheck,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileText,
  Globe,
  Bot,
  UserCheck,
  Code,
  TrendingUp,
  HelpCircle,
  Layers,
  Scale,
  Search,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { eeatSchema, parseEeatForm } from '../../schemas/eeat.schema'
import { useAnalyzeEeatMutation } from '../../services/apiSlice'
import { useLeadPopup } from '../../components/useLeadPopup'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'

const FRAMEWORK_PRESETS = [
  {
    id: 'auto',
    label: 'Auto-Detect Framework',
    sub: 'Dynamically infers format, subject context, and evidence standards',
    icon: Sparkles,
  },
  {
    id: 'technical_commercial',
    label: 'Technical & Commercial',
    sub: 'Workflow alignment, integration feasibility, and vendor governance',
    icon: Code,
  },
  {
    id: 'product_review',
    label: 'Product Evaluation',
    sub: 'First-hand testing proof, benchmarks, and comparison data',
    icon: Award,
  },
  {
    id: 'high_sensitivity_ymyl',
    label: 'High-Sensitivity (YMYL)',
    sub: 'Highest scrutiny for certified credentials, primary sources, risk notes',
    icon: ShieldCheck,
  },
  {
    id: 'educational_guide',
    label: 'Educational Guide',
    sub: 'Step-by-step procedural clarity, practical tips, and reliable references',
    icon: BookOpen,
  },
  {
    id: 'news_analysis',
    label: 'News & Investigative',
    sub: 'Primary source attribution, balanced reporting, and transparency',
    icon: FileText,
  },
]

const LOADING_STEPS = [
  'Ingesting content & auditing document hierarchy...',
  'Extracting factual claims and evaluating evidence requirements...',
  'Dynamically inferring content format and domain evaluation framework...',
  'Auditing First-Hand Experience & hands-on trial signals...',
  'Assessing Author Expertise & technical precision...',
  'Forensically auditing Authoritativeness & primary citations...',
  'Verifying Trustworthiness & methodology transparency...',
  'Simulating AI Search Engine & Perplexity citation potential...',
]

export default function EeatAnalyzerPage({ isEmbedded = false, onResultStateChange, resetSignal }) {
  const [activeMode, setActiveMode] = useState('url')
  const [activePillarTab, setActivePillarTab] = useState('experience')
  const [copiedItem, setCopiedItem] = useState(null)
  const [dataResult, setDataResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (dataResult) {
      onResultStateChange?.(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onResultStateChange?.(false)
    }
  }, [dataResult, onResultStateChange])

  useEffect(() => {
    if (resetSignal > 0) {
      handleReset()
    }
  }, [resetSignal])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(eeatSchema),
    shouldUnregister: false,
    defaultValues: {
      mode: 'url',
      url: '',
      content: '',
      title: '',
      contentType: 'auto',
      targetKeywords: '',
    },
  })

  const modeValue = watch('mode')
  const contentTypeValue = watch('contentType')
  const contentText = watch('content')

  const [analyzeEeat, { isLoading }] = useAnalyzeEeatMutation()

  const { showPopup, handlePopupSubmit, handlePopupClose, triggerPopup, popupEnabled } =
    useLeadPopup('eeat-analyzer')

  const [pendingForm, setPendingForm] = useState(null)

  const executeAnalysis = async (formData) => {
    setErrorMessage('')
    setDataResult(null)

    try {
      const res = await analyzeEeat({
        url: formData.mode === 'url' ? formData.url?.trim() : '',
        content: formData.mode === 'text' ? formData.content?.trim() : '',
        title: formData.title?.trim() || '',
        contentType: formData.contentType || 'auto',
        targetKeywords: formData.targetKeywords?.trim() || '',
      }).unwrap()

      if (res.success && res.data) {
        setDataResult(res.data)
        setActivePillarTab('experience')
        setTimeout(() => {
          const el = document.getElementById('eeat-results')
          if (el) {
            const navHeight = 90
            const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
          }
        }, 150)
      } else {
        throw new Error(res.errors?.[0] || res.error || 'Failed to complete E-E-A-T audit.')
      }
    } catch (err) {
      setErrorMessage(
        err?.data?.error ||
          err?.data?.errors?.[0] ||
          err.message ||
          'Failed to analyze content. Please verify your input and try again.'
      )
    }
  }

  const onFormValid = (formData) => {
    const parsed = parseEeatForm(formData)
    if (!parsed.success) {
      setErrorMessage(parsed.error)
      return
    }

    if (popupEnabled) {
      setPendingForm(parsed.data)
      triggerPopup()
      return
    }

    executeAnalysis(parsed.data)
  }

  const handleCopyText = (key, text) => {
    if (!text) return
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text)
    setCopiedItem(key)
    setTimeout(() => setCopiedItem(null), 2500)
  }

  const handleDownloadMarkdown = () => {
    if (!dataResult) return
    const d = dataResult
    const pillars = d.eeat?.pillars || d.pillars || {}
    const exp = pillars.experience || {}
    const expT = pillars.expertise || {}
    const auth = pillars.authoritativeness || {}
    const tru = pillars.trustworthiness || {}

    const md = `# E-E-A-T Diagnostic Assessment: ${d.title}
*Diagnostic evaluation inspired by Google Search Quality Rater Guidelines*
Date: ${new Date(d.analyzedAt || Date.now()).toLocaleDateString()}
Status: ${d.analysisStatus?.toUpperCase() || 'COMPLETE'}

## Executive Summary
${d.summary || 'N/A'}

---

## Content Classification & Evidence Framework
- **Content Format:** ${d.classification?.contentFormat?.label || 'N/A'}
- **Subject Context:** ${d.classification?.subjectContext?.label || 'N/A'}
- **Evaluation Framework:** ${d.classification?.evaluationFramework?.label || 'N/A'}
  *Reason:* ${d.classification?.evaluationFramework?.reason || 'N/A'}
- **Content Sensitivity:** ${(d.classification?.sensitivity?.level || 'N/A').toUpperCase()}
- **Evaluated Source:** ${d.url || 'Draft Article Text'} (~${d.heuristics?.wordCount || d.wordCount || 0} words)

---

## 4-Pillar Scorecard (E-E-A-T Diagnostic Score: ${d.overallScore !== null ? `${d.overallScore}/100 (${d.grade})` : 'Unavailable'})
1. **Experience:** ${exp.score !== null ? `${exp.score}/${exp.maxScore || 25}` : 'Unavailable'} - ${exp.status || 'N/A'}
2. **Expertise:** ${expT.score !== null ? `${expT.score}/${expT.maxScore || 25}` : 'Unavailable'} - ${expT.status || 'N/A'}
3. **Authoritativeness:** ${auth.score !== null ? `${auth.score}/${auth.maxScore || 25}` : 'Unavailable'} - ${auth.status || 'N/A'}
4. **Trustworthiness:** ${tru.score !== null ? `${tru.score}/${tru.maxScore || 25}` : 'Unavailable'} - ${tru.status || 'N/A'}

---

## AI Search & Perplexity Citation Readiness: ${d.aiSearchReadiness?.score !== null ? `${d.aiSearchReadiness?.score}/100` : 'Unavailable'}
Status: ${d.aiSearchReadiness?.status || 'N/A'}
- Direct Answers: ${d.aiSearchReadiness?.citabilityFactors?.directAnswers || 'N/A'}
- Structured Headings: ${d.aiSearchReadiness?.citabilityFactors?.structuredHeadings || 'N/A'}
- Entity Clarity: ${d.aiSearchReadiness?.citabilityFactors?.entityClarity || 'N/A'}
- Source Attribution: ${d.aiSearchReadiness?.citabilityFactors?.sourceAttribution || 'N/A'}

---

## Prioritized Actionable Recommendations
${d.recommendations?.map((r, i) => `${i + 1}. **[${r.priority?.toUpperCase()}] (${r.pillar})**: ${r.recommendation}\n   *Why:* ${r.reason}`).join('\n\n') || 'None'}

---

## High-Density Quotable Summary Blocks
${d.aiSearchReadiness?.keyQuotableBlocks?.map((b) => `> ${b}`).join('\n\n') || `> ${d.boosters?.aiSearchOptimizedSummary || 'N/A'}`}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `eeat-diagnostic-${(d.title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    a.click()
  }

  const handleReset = () => {
    resetForm()
    setDataResult(null)
    setErrorMessage('')
    setActiveMode('url')
    setValue('mode', 'url')
  }

  const pillarsData = dataResult?.eeat?.pillars || dataResult?.pillars || {}

  return (
    <div
      className={isEmbedded ? 'w-full @container' : 'min-h-screen bg-slate-50/50 pb-24 @container'}
    >
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          if (pendingForm) executeAnalysis(pendingForm)
          setPendingForm(null)
        }}
        toolSlug="eeat-analyzer"
        title="Unlock Free E‑E‑A‑T Diagnostic Audit"
        subtitle="Forensically evaluate your content against Google Search Quality principles and AI Overview citation algorithms."
      />

      {/* Hero Header — ONLY SHOWN WHEN NOT EMBEDDED */}
      {!isEmbedded && (
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)',
              opacity: 0.08,
            }}
          />
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-3 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-3 tracking-wide uppercase shadow-2xs whitespace-nowrap shrink-0">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>General-Purpose SEO Diagnostic Suite • Missive Digital</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-2.5">
              <span className="text-slate-900">E‑E‑A‑T Diagnostic & </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                AI Citation Analyzer
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Objective content quality assessment based on{' '}
              <strong className="text-slate-900">
                Experience, Expertise, Authoritativeness, and Trustworthiness
              </strong>{' '}
              guidelines alongside a dedicated diagnostic for{' '}
              <strong className="text-[#0C81F3]">AI Search & Citability</strong>.
            </p>
          </div>
        </section>
      )}

      {/* Main Form Container */}
      <div className={isEmbedded ? 'w-full' : 'max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6'}>
        {!isLoading && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-200 p-4 sm:p-6 lg:p-7 mb-8 transition-all">
            <form onSubmit={handleSubmit(onFormValid)} className="space-y-4 sm:space-y-5">
              {/* Input Mode Selector */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('url')
                      setValue('mode', 'url')
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeMode === 'url'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Analyze Web URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('text')
                      setValue('mode', 'text')
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeMode === 'text'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Draft Text</span>
                  </button>
                </div>
              </div>

              {/* URL Input Mode */}
              {activeMode === 'url' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="eeat-url-input"
                      className="block text-xs sm:text-sm font-bold text-slate-800"
                    >
                      Published Article or Webpage URL <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Live scraping audits author bylines, external citations, and schema
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="eeat-url-input"
                      type="url"
                      {...register('url')}
                      placeholder="https://yourdomain.com/blog/comprehensive-guide"
                      className={`w-full pl-3.5 pr-20 sm:pr-24 py-2.5 sm:py-3 bg-slate-50 border rounded-xl sm:rounded-2xl text-slate-700 font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-xs sm:text-sm ${
                        errors.url ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText()
                          if (text) setValue('url', text.trim())
                        } catch {}
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      Paste
                    </button>
                  </div>
                  {errors.url && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{errors.url.message}</p>
                  )}
                </div>
              )}

              {/* Text Input Mode */}
              {activeMode === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="eeat-title-input"
                      className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                    >
                      Article Title / Topic{' '}
                      <span className="text-xs font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      id="eeat-title-input"
                      type="text"
                      {...register('title')}
                      placeholder="e.g. How to Choose the Right CRM for a Growing Sales Team"
                      className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-700 font-normal placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="eeat-content-input"
                        className="block text-xs sm:text-sm font-bold text-slate-800"
                      >
                        Paste Article / Draft Text <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {contentText
                          ? `${contentText.trim().split(/\s+/).filter(Boolean).length} words`
                          : 'Min 50 chars'}
                      </span>
                    </div>
                    <textarea
                      id="eeat-content-input"
                      rows={6}
                      {...register('content')}
                      placeholder="Paste your full article draft, introduction, or section text here for pre-publication E‑E‑A‑T vetting..."
                      className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-700 font-normal placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] ${
                        errors.content ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'
                      }`}
                    />
                    {errors.content && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Evaluation Preset Framework */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Evaluation Framework Guidance
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Auto-detects format, subject, and evidentiary threshold across any topic
                  </span>
                </div>
                <div className="grid grid-cols-2 @min-[480px]:grid-cols-3 @min-[760px]:grid-cols-6 gap-2">
                  {FRAMEWORK_PRESETS.map((type) => {
                    const isSelected = contentTypeValue === type.id
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setValue('contentType', type.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white'
                                : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {type.label}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                            {type.sub}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target Keywords Row */}
              <div className="grid grid-cols-1 @min-[420px]:grid-cols-2 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="eeat-keywords"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Primary Keywords / Target Search Intent{' '}
                    <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="eeat-keywords"
                    type="text"
                    {...register('targetKeywords')}
                    placeholder="e.g. b2b crm evaluation, commercial software selection"
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-700 font-normal placeholder:text-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  />
                </div>
              </div>

              {/* Action Button Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Internal diagnostic tool. Evaluates 4 E-E-A-T pillars + independent AI search citability.</span>
                </p>

                <div className="flex items-center gap-2.5">
                  {dataResult && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 sm:py-2.5 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Run Diagnostic E‑E‑A‑T Audit</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold">Audit Notice</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Screen */}
        {isLoading && (
          <div className="py-6">
            <UnifiedToolLoader
              title="Performing Forensic E‑E‑A‑T Diagnostic Audit..."
              subtitle="Auditing factual claims, evidence thresholds, author authority, and AI search extractability."
              steps={LOADING_STEPS}
            />
          </div>
        )}

        {/* Results Section */}
        {dataResult && !isLoading && (
          <div id="eeat-results" className="space-y-6 sm:space-y-7 animate-fade-in pt-1">
            {/* TEMPORARY MODEL INDICATOR (Will be removed later) */}
            <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs sm:text-sm font-medium shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider">
                  Temporary Model Info
                </span>
                <span>
                  Audited by Model: <strong className="font-mono text-amber-950 font-bold">{dataResult.modelUsed || dataResult.data?.modelUsed || (dataResult.isFallback ? 'Document Heuristics Engine (Fallback)' : 'Gemini 3.5 Flash')}</strong>
                </span>
                {(dataResult.providerUsed || dataResult.data?.providerUsed) && (
                  <span className="text-amber-800 text-xs font-mono">
                    (Provider: {dataResult.providerUsed || dataResult.data?.providerUsed})
                  </span>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${dataResult.isFallback ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                {dataResult.isFallback ? 'Fallback Engine' : 'Live AI Response'}
              </span>
            </div>

            {/* Partial Fallback Banner (If model-based analysis was unavailable) */}
            {dataResult.analysisStatus === 'partial' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-900 shadow-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Analysis Partially Completed (Deterministic Heuristics Mode)</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  The AI semantic evaluation service was temporarily unreachable ({dataResult.diagnostic?.fallbackReason || 'provider timeout'}). Deterministic document metrics, citations, and structural heuristics were audited successfully. Numerical semantic scores are withheld (<code className="font-mono bg-amber-100 px-1 rounded">null</code>) rather than presenting fabricated estimates.
                </p>
              </div>
            )}

            {/* Top Score & Multi-Dimensional Classification Banner */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-2 min-w-0 flex-1">
                  {/* Dynamic Dimension Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Content Format */}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0C81F3] border border-blue-200 whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Format: {dataResult.classification?.contentFormat?.label || 'N/A'}</span>
                    </span>

                    {/* Subject Context */}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      <span>Domain: {dataResult.classification?.subjectContext?.label || 'N/A'}</span>
                    </span>

                    {/* Sensitivity */}
                    {dataResult.classification?.sensitivity && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 border ${
                        dataResult.classification.sensitivity.level === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : dataResult.classification.sensitivity.level === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <Scale className="w-3 h-3" />
                        <span>Sensitivity: {dataResult.classification.sensitivity.level.toUpperCase()}</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">
                      ~{dataResult.heuristics?.wordCount || dataResult.wordCount || 0} words
                    </span>

                    {dataResult.url && (
                      <a
                        href={dataResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0C81F3] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Visit Target Page
                      </a>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                    "{dataResult.title}"
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {dataResult.summary}
                  </p>

                  {/* Evidence Framework Explanation */}
                  {dataResult.classification?.evaluationFramework && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2 max-w-3xl">
                      <Scale className="w-4 h-4 text-[#0C81F3] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Applied Evaluation Framework: </strong>
                        <span>{dataResult.classification.evaluationFramework.label}</span>
                        <p className="text-slate-500 mt-0.5">{dataResult.classification.evaluationFramework.reason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Dial & Actions */}
                <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto justify-between lg:justify-end shrink-0">
                  <div className="flex flex-col items-end shrink-0 min-w-max text-right">
                    <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent leading-none">
                      {dataResult.overallScore !== null ? (
                        <>
                          {dataResult.overallScore}
                          <span className="text-sm font-normal text-slate-400 ml-0.5">/100</span>
                        </>
                      ) : (
                        <span className="text-xl text-slate-400 font-bold">Unavailable</span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-0.5 rounded-full text-[11px] font-bold tracking-tight shrink-0 mt-1.5 ${
                        dataResult.overallScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dataResult.overallScore >= 65
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : dataResult.overallScore !== null
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {dataResult.grade || 'Diagnostic Partial'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">E-E-A-T Diagnostic Model</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .md</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Pillar Score Cards Grid (Each /25) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0C81F3]" />
                    <span>The 4 E-E-A-T Pillars (25 Pts Each = 100 Pts Total)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Click any pillar to inspect observable evidence</span>
                </div>

                <div className="grid grid-cols-2 @min-[540px]:grid-cols-4 gap-2 sm:gap-2.5">
                  {/* 1. Experience */}
                  <div
                    onClick={() => setActivePillarTab('experience')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activePillarTab === 'experience'
                        ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Experience
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      {pillarsData.experience?.score !== null && pillarsData.experience?.score !== undefined ? (
                        <>
                          {pillarsData.experience.score}
                          <span className="text-xs font-normal text-slate-400">/{pillarsData.experience.maxScore || 25}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 font-semibold">N/A</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                      {pillarsData.experience?.status || 'N/A'}
                    </div>
                  </div>

                  {/* 2. Expertise */}
                  <div
                    onClick={() => setActivePillarTab('expertise')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activePillarTab === 'expertise'
                        ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Expertise
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      {pillarsData.expertise?.score !== null && pillarsData.expertise?.score !== undefined ? (
                        <>
                          {pillarsData.expertise.score}
                          <span className="text-xs font-normal text-slate-400">/{pillarsData.expertise.maxScore || 25}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 font-semibold">N/A</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                      {pillarsData.expertise?.status || 'N/A'}
                    </div>
                  </div>

                  {/* 3. Authoritativeness */}
                  <div
                    onClick={() => setActivePillarTab('authoritativeness')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activePillarTab === 'authoritativeness'
                        ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Authority
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      {pillarsData.authoritativeness?.score !== null && pillarsData.authoritativeness?.score !== undefined ? (
                        <>
                          {pillarsData.authoritativeness.score}
                          <span className="text-xs font-normal text-slate-400">/{pillarsData.authoritativeness.maxScore || 25}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 font-semibold">N/A</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                      {pillarsData.authoritativeness?.status || 'N/A'}
                    </div>
                  </div>

                  {/* 4. Trustworthiness */}
                  <div
                    onClick={() => setActivePillarTab('trustworthiness')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activePillarTab === 'trustworthiness'
                        ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Trust
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      {pillarsData.trustworthiness?.score !== null && pillarsData.trustworthiness?.score !== undefined ? (
                        <>
                          {pillarsData.trustworthiness.score}
                          <span className="text-xs font-normal text-slate-400">/{pillarsData.trustworthiness.maxScore || 25}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 font-semibold">N/A</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                      {pillarsData.trustworthiness?.status || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Limitations vs Document Observations Bar */}
            {dataResult.inputLimitations?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Input Boundary Disclosures ({dataResult.analysisSource === 'pasted_text' ? 'Pasted Text' : 'URL Live Scrape'})</span>
                </div>
                <ul className="space-y-1 pl-4 list-disc text-slate-600">
                  {dataResult.inputLimitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pillar Drilldown Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pillar Detail:
                  </span>
                  <span className="text-sm font-bold text-slate-900 capitalize">
                    {activePillarTab}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0C81F3]">
                  Score: {pillarsData[activePillarTab]?.score !== null ? `${pillarsData[activePillarTab]?.score} / 25` : 'Unavailable'} (
                  {pillarsData[activePillarTab]?.status || 'N/A'})
                </div>
              </div>

              <div className="grid grid-cols-1 @min-[520px]:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Validated Strengths
                  </div>
                  <ul className="space-y-1.5">
                    {pillarsData[activePillarTab]?.strengths?.length > 0 ? (
                      pillarsData[activePillarTab].strengths.map((s, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5"
                        >
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic">No specific strengths recorded.</li>
                    )}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Quality Gaps & Improvement Areas
                  </div>
                  <ul className="space-y-1.5">
                    {pillarsData[activePillarTab]?.gaps?.length > 0 ? (
                      pillarsData[activePillarTab].gaps.map((g, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5"
                        >
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{g}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic">No significant gaps detected.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* SEPARATE COMPANION DIAGNOSTIC: AI Search & Perplexity Readiness */}
            {dataResult.aiSearchReadiness && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0C81F3]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        AI Search & Citability Diagnostic (Perplexity, Google AI Overviews)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Separate companion analysis evaluating structured answer extraction and entity clarity.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Readiness Score:</span>
                    <span className="text-base sm:text-lg font-black text-[#0C81F3]">
                      {dataResult.aiSearchReadiness.score !== null ? `${dataResult.aiSearchReadiness.score}/100` : 'Unavailable'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0C81F3] border border-blue-200 font-bold">
                      {dataResult.aiSearchReadiness.status}
                    </span>
                  </div>
                </div>

                {/* Citability 4-Factor Grid */}
                <div className="grid grid-cols-2 @min-[540px]:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Direct Answers</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{dataResult.aiSearchReadiness.citabilityFactors?.directAnswers || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Heading Structure</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{dataResult.aiSearchReadiness.citabilityFactors?.structuredHeadings || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Entity Definition</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{dataResult.aiSearchReadiness.citabilityFactors?.entityClarity || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Attribution Signals</span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{dataResult.aiSearchReadiness.citabilityFactors?.sourceAttribution || 'N/A'}</p>
                  </div>
                </div>

                {/* Quotable Blocks for AI search */}
                {dataResult.aiSearchReadiness.keyQuotableBlocks?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-700">Quotable Direct-Answer Blocks:</span>
                    <div className="grid grid-cols-1 @min-[540px]:grid-cols-2 gap-2">
                      {dataResult.aiSearchReadiness.keyQuotableBlocks.map((block, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 text-xs text-slate-800 font-mono leading-relaxed">
                          "{block}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Factual Claims Table */}
            {dataResult.claims?.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span>Extracted Claims & Evidence Audit</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Factual assertions extracted prior to scoring to separate verifiable claims from subjective advice.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{dataResult.claims.length} claims audited</span>
                </div>

                <div className="space-y-2">
                  {dataResult.claims.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col @min-[480px]:flex-row @min-[480px]:items-center justify-between gap-2.5">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">"{c.claim}"</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="capitalize font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{c.claimType} Claim</span>
                          <span>•</span>
                          <span>Requires Evidence: {c.requiresEvidence ? 'Yes' : 'No (Logical/Advice)'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          c.evidenceFound
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.requiresEvidence
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {c.evidenceFound ? 'Evidence Present' : (c.requiresEvidence ? 'Evidence Needed' : 'Contextual Logic')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Recommendations */}
            {dataResult.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0C81F3]" />
                    <span>Prioritized Quality Improvements</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked by immediate impact on reader trust, factual verification, and search quality standards.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {dataResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col @min-[540px]:flex-row @min-[540px]:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                            rec.priority === 'critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rec.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Pillar: {rec.pillar}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">{rec.recommendation}</p>
                        <p className="text-xs text-slate-500">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable E‑E‑A‑T Boosters */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Actionable E‑E‑A‑T Boosters (Recommendation Templates)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Concrete guidelines and templates to plug trust and authority gaps before publication.
                </p>
              </div>

              <div className="grid grid-cols-1 @min-[520px]:grid-cols-2 gap-4">
                {/* 1. Experience Booster */}
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-600" /> First-Hand Experience Guidance
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('experience', dataResult.boosters?.recommendedExperienceAddition)
                      }
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'experience' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedItem === 'experience' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-sky-100">
                    {dataResult.boosters?.recommendedExperienceAddition}
                  </p>
                </div>

                {/* 2. Author Bio Booster */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Author Bio Elements to Supply
                  </span>
                  <ul className="space-y-1.5 bg-white p-3 rounded-lg border border-purple-100 text-xs text-slate-700">
                    {dataResult.boosters?.recommendedAuthorBioElements?.map((el, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>{el}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Primary Sources */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Recommended Authoritative Source Types
                  </span>
                  <ul className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-100 text-xs text-slate-700">
                    {dataResult.boosters?.citableSourceTypes?.map((source, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Trust & Methodology Policy */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Methodology & Transparency Model
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('trust', dataResult.boosters?.recommendedMethodologyDisclosure)
                      }
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'trust' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedItem === 'trust' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100">
                    {dataResult.boosters?.recommendedMethodologyDisclosure}
                  </p>
                </div>
              </div>
            </div>

            {/* JSON-LD Schema Generator Card */}
            {dataResult.jsonLdSchema && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#0C81F3]" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Recommended Schema.org Structured Data
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('schema', dataResult.jsonLdSchema)}
                    className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedItem === 'schema' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedItem === 'schema' ? 'Copied Schema!' : 'Copy JSON-LD'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(dataResult.jsonLdSchema, null, 2)}
                </pre>
              </div>
            )}

            {/* Bottom Reset Bar */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Ready to audit another article or draft?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  General-purpose diagnostic operates across arbitrary subjects, niches, and content formats.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Diagnostic Audit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
