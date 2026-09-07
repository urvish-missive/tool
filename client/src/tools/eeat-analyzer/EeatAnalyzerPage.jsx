import { useState } from 'react'
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
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { eeatSchema, parseEeatForm } from '../../schemas/eeat.schema'
import { useAnalyzeEeatMutation } from '../../services/apiSlice'
import { useLeadPopup } from '../../components/useLeadPopup'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import ModelSelector from '../shared/ModelSelector'

const CONTENT_TYPES = [
  {
    id: 'auto',
    label: 'Auto-Detect Type',
    sub: 'AI automatically determines the best E-E-A-T framework',
    icon: Sparkles,
  },
  {
    id: 'b2b_saas',
    label: 'B2B SaaS & Tech',
    sub: 'Architectural expertise, deployment data, and benchmarks',
    icon: Code,
  },
  {
    id: 'review',
    label: 'Product Review',
    sub: 'Hands-on testing proof, trials, comparison benchmarks',
    icon: Award,
  },
  {
    id: 'ymyl',
    label: 'YMYL (Health / Finance)',
    sub: 'Highest scrutiny for certified credentials and disclaimers',
    icon: ShieldCheck,
  },
  {
    id: 'guide',
    label: 'How-To Guide',
    sub: 'Step-by-step clarity, actionable insights, practical tips',
    icon: BookOpen,
  },
  {
    id: 'news',
    label: 'News & Analysis',
    sub: 'Primary attribution, quote verification, editorial policy',
    icon: FileText,
  },
]

const LOADING_STEPS = [
  'Ingesting content & auditing document hierarchy...',
  'Evaluating First-Hand Experience & hands-on trial signals...',
  'Assessing Author Expertise & credential depth...',
  'Forensically auditing Authoritativeness & primary citations...',
  'Verifying Trustworthiness & methodology transparency...',
  'Simulating AI Search Engine & GEO citation potential...',
]

export default function EeatAnalyzerPage() {
  const [activeMode, setActiveMode] = useState('url')
  const [activePillarTab, setActivePillarTab] = useState('experience')
  const [copiedItem, setCopiedItem] = useState(null)
  const [dataResult, setDataResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

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
      preferredProvider: 'gemini-3.5-flash-lite',
    },
  })

  const modeValue = watch('mode')
  const contentTypeValue = watch('contentType')
  const preferredProvider = watch('preferredProvider')
  const contentText = watch('content')

  const [analyzeEeat, { isLoading }] = useAnalyzeEeatMutation()

  const {
    showPopup,
    handlePopupSubmit,
    handlePopupClose,
    triggerPopup,
    popupEnabled,
  } = useLeadPopup('eeat-analyzer')

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
        preferredProvider: formData.preferredProvider || 'gemini-3.5-flash-lite',
      }).unwrap()

      if (res.success && res.data) {
        setDataResult(res.data)
        setActivePillarTab('experience')
        setTimeout(() => {
          document.getElementById('eeat-results')?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      } else {
        throw new Error(res.error || 'Failed to complete E-E-A-T audit.')
      }
    } catch (err) {
      setErrorMessage(err?.data?.error || err.message || 'Failed to analyze content. Please verify your input and try again.')
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
    const md = `# E-E-A-T & AI Search Authority Audit Report: ${d.title}
Generated by Missive Digital E-E-A-T Analyzer
Date: ${new Date(d.analyzedAt).toLocaleDateString()}

## Overall Score: ${d.overallScore}/100 (${d.grade})
- Content Type: ${d.typeLabel}
- Evaluated URL: ${d.url || 'Draft Article Evaluation'}
- Word Count: ~${d.wordCount} words

### Executive Summary
${d.summary}

---

## 5-Pillar Scorecard
1. Experience: ${d.pillars.experience.score}/20 (${d.pillars.experience.status})
2. Expertise: ${d.pillars.expertise.score}/20 (${d.pillars.expertise.status})
3. Authoritativeness: ${d.pillars.authoritativeness.score}/20 (${d.pillars.authoritativeness.status})
4. Trustworthiness: ${d.pillars.trustworthiness.score}/20 (${d.pillars.trustworthiness.status})
5. AI Search & GEO Readiness: ${d.pillars.aiGeoReadiness.score}/20 (${d.pillars.aiGeoReadiness.status})

---

## Actionable E-E-A-T Boosters

### 1. Experience Injection Paragraph
${d.boosters.experienceSnippet}

### 2. Author Verification & Credential Anchor
${d.boosters.authorBioSnippet}

### 3. Recommended Primary Citations
${d.boosters.citableSources?.map((s) => `- ${s}`).join('\n')}

### 4. Editorial Transparency & Testing Methodology
${d.boosters.trustPolicySnippet}

### 5. AI Overview / Perplexity Quotable Definitions
${d.boosters.aiOverviewDefinitions?.map((def) => `> ${def}`).join('\n\n')}

---

## JSON-LD Schema Markup
\`\`\`json
${JSON.stringify(d.jsonLdSchema, null, 2)}
\`\`\`
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `eeat-audit-${(d.title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    a.click()
  }

  const handleReset = () => {
    resetForm()
    setDataResult(null)
    setErrorMessage('')
    setActiveMode('url')
    setValue('mode', 'url')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
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
        title="Unlock Free E-E-A-T & AI Search Authority Audit"
        subtitle="Forensically evaluate your content against Google Search Quality guidelines and AI Overview citation algorithms."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-28 pt-8 pb-8 sm:!pt-32 sm:py-12 lg:py-14">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-3 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-3 tracking-wide uppercase shadow-2xs whitespace-nowrap shrink-0">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Himani's SEO Tools • Missive Digital</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-2.5">
            <span className="text-slate-900">E-E-A-T & AI Search </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Authority Analyzer
            </span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Audit and elevate your content across Google's{' '}
            <strong className="text-slate-900">Experience, Expertise, Authoritativeness, and Trustworthiness</strong>{' '}
            standards while optimizing for <strong className="text-[#0C81F3]">Google AI Overviews & Perplexity</strong> citations.
          </p>
        </div>
      </section>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
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
                    <label htmlFor="eeat-url-input" className="block text-xs sm:text-sm font-bold text-slate-800">
                      Published Article or Webpage URL <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Live scraping extracts author bylines, headings, and schema
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="eeat-url-input"
                      type="url"
                      {...register('url')}
                      placeholder="https://yourdomain.com/blog/comprehensive-guide"
                      className={`w-full pl-3.5 pr-20 sm:pr-24 py-2.5 sm:py-3 bg-slate-50 border rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-xs sm:text-sm font-medium ${
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
                    <label htmlFor="eeat-title-input" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      Article Title / Topic <span className="text-xs font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      id="eeat-title-input"
                      type="text"
                      {...register('title')}
                      placeholder="e.g. Hands-on Benchmark: Postgres vs MySQL for Vector Search"
                      className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="eeat-content-input" className="block text-xs sm:text-sm font-bold text-slate-800">
                        Paste Article / Draft Text <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {contentText ? `${contentText.trim().split(/\s+/).filter(Boolean).length} words` : 'Min 50 chars'}
                      </span>
                    </div>
                    <textarea
                      id="eeat-content-input"
                      rows={6}
                      {...register('content')}
                      placeholder="Paste your full article draft, introduction, or section text here for pre-publication E-E-A-T vetting..."
                      className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] ${
                        errors.content ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'
                      }`}
                    />
                    {errors.content && (
                      <p className="mt-1 text-xs font-semibold text-rose-600">{errors.content.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Content Type Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    E-E-A-T Evaluation Type
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Calibrates scoring against Google Quality Rater benchmarks
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {CONTENT_TYPES.map((type) => {
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
                              isSelected ? 'bg-[#0C81F3] text-white' : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{type.label}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">{type.sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target Keywords Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="eeat-keywords" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    Primary Keywords / Target Search Intent <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="eeat-keywords"
                    type="text"
                    {...register('targetKeywords')}
                    placeholder="e.g. pgvector benchmark, enterprise seo audit"
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full">
                    <ModelSelector
                      value={preferredProvider}
                      onChange={(val) => setValue('preferredProvider', val)}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Audits Experience, Expertise, Authoritativeness, Trust & AI Overviews readiness.
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
                    <span>Run Forensic E-E-A-T Audit</span>
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

        {/* Loading Screen — ONLY SHOWN WHILE LOADING */}
        {isLoading && (
          <div className="py-6">
            <UnifiedToolLoader
              title="Forensically Auditing E-E-A-T & AI Search Authority..."
              subtitle="Auditing first-hand experience proof, author credentials, citation graph, and AI Overview extractability."
              steps={LOADING_STEPS}
            />
          </div>
        )}

        {/* Results Section */}
        {dataResult && !isLoading && (
          <div id="eeat-results" className="space-y-6 sm:space-y-7 animate-fade-in pt-1">
            {/* Top Score Summary Banner */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0C81F3] border border-blue-200 whitespace-nowrap shrink-0">
                      {dataResult.typeLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">
                      ~{dataResult.wordCount} words
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
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                    "{dataResult.title}"
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {dataResult.summary}
                  </p>
                </div>

                {/* Score Dial & Actions */}
                <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto justify-between lg:justify-end shrink-0">
                  <div className="flex flex-col items-end shrink-0 min-w-max text-right">
                    <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent leading-none">
                      {dataResult.overallScore}
                      <span className="text-sm font-normal text-slate-400 ml-0.5">/100</span>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-0.5 rounded-full text-[11px] font-bold tracking-tight shrink-0 mt-1.5 ${
                        dataResult.overallScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : dataResult.overallScore >= 65
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {dataResult.grade}
                    </span>
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

              {/* 5-Pillar Score Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
                {/* 1. Experience */}
                <div
                  onClick={() => setActivePillarTab('experience')}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    activePillarTab === 'experience'
                      ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Experience
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {dataResult.pillars.experience.score}
                    <span className="text-xs font-normal text-slate-400">/20</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                    {dataResult.pillars.experience.status}
                  </div>
                </div>

                {/* 2. Expertise */}
                <div
                  onClick={() => setActivePillarTab('expertise')}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    activePillarTab === 'expertise'
                      ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Expertise
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {dataResult.pillars.expertise.score}
                    <span className="text-xs font-normal text-slate-400">/20</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                    {dataResult.pillars.expertise.status}
                  </div>
                </div>

                {/* 3. Authoritativeness */}
                <div
                  onClick={() => setActivePillarTab('authoritativeness')}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    activePillarTab === 'authoritativeness'
                      ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Authority
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {dataResult.pillars.authoritativeness.score}
                    <span className="text-xs font-normal text-slate-400">/20</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                    {dataResult.pillars.authoritativeness.status}
                  </div>
                </div>

                {/* 4. Trustworthiness */}
                <div
                  onClick={() => setActivePillarTab('trustworthiness')}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    activePillarTab === 'trustworthiness'
                      ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Trust
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {dataResult.pillars.trustworthiness.score}
                    <span className="text-xs font-normal text-slate-400">/20</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                    {dataResult.pillars.trustworthiness.status}
                  </div>
                </div>

                {/* 5. AI Search / GEO Readiness */}
                <div
                  onClick={() => setActivePillarTab('aiGeoReadiness')}
                  className={`col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                    activePillarTab === 'aiGeoReadiness'
                      ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="text-[10px] font-bold text-[#0C81F3] uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" /> AI & GEO
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {dataResult.pillars.aiGeoReadiness.score}
                    <span className="text-xs font-normal text-slate-400">/20</span>
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                    {dataResult.pillars.aiGeoReadiness.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Drilldown: Pillar Strengths & Gaps */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pillar Drilldown:</span>
                  <span className="text-sm font-bold text-slate-900 capitalize">
                    {activePillarTab === 'aiGeoReadiness' ? 'AI Search & GEO Readiness' : activePillarTab}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0C81F3]">
                  Score: {dataResult.pillars[activePillarTab]?.score} / 20 ({dataResult.pillars[activePillarTab]?.status})
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Validated Strengths
                  </div>
                  <ul className="space-y-1.5">
                    {dataResult.pillars[activePillarTab]?.strengths?.map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Critical Quality Gaps
                  </div>
                  <ul className="space-y-1.5">
                    {dataResult.pillars[activePillarTab]?.gaps?.map((g, idx) => (
                      <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actionable E-E-A-T Boosters (The Secret Weapon) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Instant E-E-A-T Boosters (Ready-to-Paste)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Engineered snippets to immediately plug E-E-A-T gaps in your content before publishing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Experience Booster */}
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-600" /> First-Hand Experience Injector
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('experience', dataResult.boosters.experienceSnippet)}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'experience' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'experience' ? 'Copied!' : 'Copy Snippet'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-sky-100">
                    "{dataResult.boosters.experienceSnippet}"
                  </p>
                </div>

                {/* 2. Author Bio Booster */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Author Verification & Credential Anchor
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('author', dataResult.boosters.authorBioSnippet)}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'author' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'author' ? 'Copied!' : 'Copy Snippet'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-purple-100">
                    "{dataResult.boosters.authorBioSnippet}"
                  </p>
                </div>

                {/* 3. Primary Sources */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Recommended Primary Research Citations
                  </span>
                  <ul className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-100">
                    {dataResult.boosters.citableSources?.map((source, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
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
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Testing Transparency & Disclosure
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('trust', dataResult.boosters.trustPolicySnippet)}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'trust' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'trust' ? 'Copied!' : 'Copy Snippet'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-emerald-100">
                    "{dataResult.boosters.trustPolicySnippet}"
                  </p>
                </div>
              </div>

              {/* 5. AI Overview & Perplexity Quotable Definitions */}
              {dataResult.boosters.aiOverviewDefinitions?.length > 0 && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-[#0C81F3]" /> AI Search Overview & Perplexity Citation Blocks
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('aiDef', dataResult.boosters.aiOverviewDefinitions.join('\n\n'))}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedItem === 'aiDef' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedItem === 'aiDef' ? 'Copied All!' : 'Copy AI Blocks'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {dataResult.boosters.aiOverviewDefinitions.map((def, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-slate-800 leading-relaxed font-mono">
                        {def}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* JSON-LD Schema Generator Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#0C81F3]" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Validated JSON-LD E-E-A-T Schema.org Markup
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText('schema', dataResult.jsonLdSchema)}
                  className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedItem === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedItem === 'schema' ? 'Copied Schema!' : 'Copy JSON-LD'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-56 leading-relaxed">
                {JSON.stringify(dataResult.jsonLdSchema, null, 2)}
              </pre>
            </div>

            {/* Bottom Reset Bar */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">Want to audit another URL or draft?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test draft articles before publishing to maximize day-one rankings and AI citations.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New E-E-A-T Audit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
