import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sparkles,
  Copy,
  Check,
  Download,
  RotateCcw,
  Zap,
  Star,
  Layers,
  Compass,
  CheckCircle2,
  AlertCircle,
  Target,
  ArrowRight,
  FileText,
  MousePointerClick,
  Flag,
  Lightbulb,
  Rocket,
  ShieldCheck,
} from 'lucide-react'
import { blogConclusionSchema, parseBlogConclusionForm } from '../../schemas/blogConclusion.schema'
import { useGenerateBlogConclusionsMutation } from '../../services/apiSlice'
import { useLeadPopup } from '../../components/useLeadPopup'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'

const FUNNEL_OPTIONS = [
  {
    id: 'all',
    label: 'All Funnel Stages',
    sub: 'Balanced mix of TOFU, MOFU, and BOFU conclusions',
    icon: Layers,
    badge: 'Recommended',
  },
  {
    id: 'tofu',
    label: 'TOFU (Awareness)',
    sub: 'Big-picture takeaway, mindset shift & low-friction CTA',
    icon: Compass,
    color: 'text-sky-600 border-sky-300 bg-sky-50',
  },
  {
    id: 'mofu',
    label: 'MOFU (Consideration)',
    sub: 'Framework recap, decision blueprint & resource lead magnet',
    icon: Sparkles,
    color: 'text-amber-600 border-amber-300 bg-amber-50',
  },
  {
    id: 'bofu',
    label: 'BOFU (Decision)',
    sub: 'Definitive ROI verdict, cost of delay & direct consultation/trial',
    icon: Target,
    color: 'text-emerald-600 border-emerald-300 bg-emerald-50',
  },
]

const CTA_OPTIONS = [
  { id: 'demo', label: 'Book a Strategy Call / Demo', icon: Target },
  { id: 'trial', label: 'Start Free Trial / Sign Up', icon: MousePointerClick },
  { id: 'lead_magnet', label: 'Download Checklist / Guide', icon: Download },
  { id: 'internal_link', label: 'Read Next Related Post', icon: ArrowRight },
  { id: 'comment', label: 'Leave a Comment / Discuss', icon: Flag },
  { id: 'custom', label: 'Custom Call to Action', icon: Lightbulb },
]

const TONES = [
  { id: 'authoritative', label: 'Authoritative & Thought-Leadership' },
  { id: 'conversational', label: 'Conversational & Engaging' },
  { id: 'storytelling', label: 'Storytelling & Narrative' },
  { id: 'fun', label: 'Fun & Playful' },
  { id: 'bold', label: 'Bold & Disruptive' },
  { id: 'empathetic', label: 'Empathetic & Supportive' },
  { id: 'witty', label: 'Witty & Energetic' },
  { id: 'data-driven', label: 'Analytical & Data-Driven' },
]

const SAMPLE_PRESETS = [
  {
    id: 'programmatic-seo',
    badgeIcon: Rocket,
    shortName: 'Programmatic SEO',
    description: 'B2B SaaS Organic Traffic & Scaling',
    topic: 'How to Scale Organic Traffic to 100K/Mo with Programmatic SEO',
    intro:
      "Most content teams hit an invisible ceiling around 50 to 100 published articles. Writing every single page by hand burns out writers and drains budget, while competitors using template-driven programmatic architectures quietly dominate thousands of long-tail search queries. Is programmatic SEO just automated spam, or is it the highest-leverage growth engine modern marketing has ever seen? Let's break down how to do it without risking Google penalties.",
    keyTakeaways:
      '• Data quality beats sheer page count every time\n• Programmatic SEO requires strict indexation guards and canonical architecture\n• Semantic internal linking graphs build sustained domain authority\n• Dynamic value-add elements prevent thin content classifications',
    funnelStage: 'all',
    ctaGoal: 'trial',
    ctaCustomText: '',
    tone: 'authoritative',
    targetAudience: 'B2B SaaS Founders, Growth Marketers, Head of SEO',
    targetKeywords: 'programmatic SEO, scale organic traffic, programmatic content architecture',
  },
  {
    id: 'saas-churn',
    badgeIcon: ShieldCheck,
    shortName: 'SaaS Churn Reduction',
    description: 'Customer Retention & Expansion Playbook',
    topic: 'B2B SaaS Churn Reduction: Why Your Best Customers Quietly Leave',
    intro:
      "Acquiring a new customer costs up to 7x more than retaining an existing one. Yet week after week, growth dashboards fixate almost exclusively on top-of-funnel sign-ups while account contraction and silent cancellations eat away at ARR like termite damage. If your monthly logo churn is creeping above 4%, slapping on a reactive exit survey isn't going to save your pipeline.",
    keyTakeaways:
      '• 80% of churn signals surface 30 days prior in feature inactivity\n• Proactive milestone check-ins prevent executive sponsor drift\n• Time-to-value during first 14 days dictates 1-year renewal rates\n• Net Revenue Retention (NRR) is the only retention metric that matters',
    funnelStage: 'bofu',
    ctaGoal: 'demo',
    ctaCustomText: '',
    tone: 'bold',
    targetAudience: 'VP of Customer Success, SaaS Founders, Product Growth Leads',
    targetKeywords: 'reduce SaaS churn, customer retention strategies, net revenue retention',
  },
  {
    id: 'technical-seo',
    badgeIcon: Zap,
    shortName: 'Technical SEO 2026',
    description: 'AI Search Engines & LLM Indexing Audits',
    topic: 'The Complete Guide to Technical SEO Audits for AI-Driven Search',
    intro:
      "Google's crawling budget isn't what it used to be. With the explosive rise of AI Overviews and LLM scrapers, search bots have become ruthlessly selective about which URLs they render, index, and cite. If your site architecture still relies on 2020 crawling assumptions, half of your high-value pages might not even exist in the eyes of generative search engines.",
    keyTakeaways:
      '• Server-side rendering (SSR) is essential for AI crawler ingestion\n• Faceted navigation crawl traps burn up to 60% of Googlebot quota\n• Structured entity graphs directly influence generative search citations\n• Core Web Vitals INP optimization directly correlates with crawl speed',
    funnelStage: 'mofu',
    ctaGoal: 'lead_magnet',
    ctaCustomText: '',
    tone: 'data-driven',
    targetAudience: 'Enterprise SEOs, Web Developers, Agency Directors',
    targetKeywords: 'technical SEO audit, AI search indexing, crawl budget optimization',
  },
]

const LOADING_STEPS = [
  'Analyzing blog topic & audience search intent',
  'Parsing blog introduction for open loops and core promises',
  'Synthesizing specific, non-generic H2 headlines (banning "Conclusion")',
  'Crafting loop-closing takeaways and high-converting CTA bridges',
  'Polishing output into drop-in markdown cards',
]

export default function BlogConclusionGeneratorPage({
  isEmbedded = false,
  onResultStateChange,
  resetSignal,
}) {
  const [selectedFunnel, setSelectedFunnel] = useState('all')
  const [selectedCta, setSelectedCta] = useState('demo')
  const [activeFilterTab, setActiveFilterTab] = useState('all')
  const [favorites, setFavorites] = useState({})
  const [copiedConclusionId, setCopiedConclusionId] = useState(null)
  const [copiedH2Id, setCopiedH2Id] = useState(null)
  const [copiedCtaId, setCopiedCtaId] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [dataResult, setDataResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSampleId, setActiveSampleId] = useState(null)

  useEffect(() => {
    if (dataResult?.conclusions?.length) {
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
    reset: resetForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blogConclusionSchema),
    defaultValues: {
      topic: '',
      intro: '',
      keyTakeaways: '',
      funnelStage: 'all',
      ctaGoal: 'demo',
      ctaCustomText: '',
      targetKeywords: '',
      targetAudience: '',
      tone: 'authoritative',
      numVariations: 6,
    },
  })

  const [generateConclusions, { isLoading }] = useGenerateBlogConclusionsMutation()

  const { showPopup, handlePopupClose, handlePopupSubmit, triggerPopup, popupEnabled } =
    useLeadPopup('blog-conclusion-generator')

  const [pendingForm, setPendingForm] = useState(null)
  const countValue = watch('numVariations')

  const handleLoadSample = (preset = SAMPLE_PRESETS[0]) => {
    setValue('topic', preset.topic, { shouldValidate: true })
    setValue('intro', preset.intro, { shouldValidate: true })
    setValue('keyTakeaways', preset.keyTakeaways, { shouldValidate: true })
    setValue('targetAudience', preset.targetAudience, { shouldValidate: true })
    setValue('targetKeywords', preset.targetKeywords, { shouldValidate: true })
    setValue('funnelStage', preset.funnelStage, { shouldValidate: true })
    setSelectedFunnel(preset.funnelStage)
    setValue('ctaGoal', preset.ctaGoal, { shouldValidate: true })
    setSelectedCta(preset.ctaGoal)
    setValue('ctaCustomText', preset.ctaCustomText || '')
    setValue('tone', preset.tone, { shouldValidate: true })
    setActiveSampleId(preset.id)
    setErrorMessage('')
  }

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyConclusion = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedConclusionId(id)
    setTimeout(() => setCopiedConclusionId(null), 2200)
  }

  const handleCopyH2 = (id, h2Text) => {
    navigator.clipboard.writeText(`## ${h2Text}`)
    setCopiedH2Id(id)
    setTimeout(() => setCopiedH2Id(null), 2000)
  }

  const handleCopyCta = (id, ctaText) => {
    navigator.clipboard.writeText(ctaText)
    setCopiedCtaId(id)
    setTimeout(() => setCopiedCtaId(null), 2000)
  }

  const handleCopyAll = () => {
    if (!dataResult?.conclusions?.length) return
    const allMarkdown = dataResult.conclusions
      .map(
        (c, idx) =>
          `### Option ${idx + 1}: ${c.specificH2Title} [${c.funnelLabel}]\n\n${c.fullConclusion}\n\n* * *\n`
      )
      .join('\n')

    navigator.clipboard.writeText(allMarkdown)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2500)
  }

  const handleDownloadMarkdown = () => {
    if (!dataResult?.conclusions?.length) return
    const activeToneLabel =
      TONES.find((t) => t.id === (dataResult.tone || watch('tone')))?.label ||
      dataResult.tone ||
      watch('tone')
    const content =
      `# High-Converting Blog Conclusions: ${dataResult.topic}\n\n*Tone: ${activeToneLabel}*\n*Generated by Missive Digital Blog Conclusion Generator on ${new Date().toLocaleDateString()}*\n\n` +
      dataResult.conclusions
        .map(
          (c, idx) =>
            `## Variation ${idx + 1} (${c.funnelLabel})\nFramework: ${c.framework}\nSpecific H2: ${c.specificH2Title}\n\n${c.fullConclusion}\n\n* * *\n`
        )
        .join('\n')

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blog-conclusions-${dataResult.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    resetForm({
      topic: '',
      intro: '',
      keyTakeaways: '',
      funnelStage: 'all',
      ctaGoal: 'demo',
      ctaCustomText: '',
      targetKeywords: '',
      targetAudience: '',
      tone: 'authoritative',
      numVariations: 6,
    })
    setSelectedFunnel('all')
    setSelectedCta('demo')
    setDataResult(null)
    setErrorMessage('')
    setFavorites({})
    setActiveSampleId(null)
    if (isEmbedded) {
      const toolEl = document.getElementById('tool')
      if (toolEl) {
        const navHeight = 90
        const targetY = toolEl.getBoundingClientRect().top + window.pageYOffset - navHeight
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const executeGeneration = async (formData) => {
    setErrorMessage('')
    try {
      const payload = {
        topic: formData.topic.trim(),
        intro: formData.intro?.trim() || '',
        keyTakeaways: formData.keyTakeaways?.trim() || '',
        funnelStage: formData.funnelStage || 'all',
        ctaGoal: formData.ctaGoal || 'demo',
        ctaCustomText: formData.ctaCustomText?.trim() || '',
        targetKeywords: formData.targetKeywords || '',
        targetAudience: formData.targetAudience?.trim() || '',
        tone: formData.tone || 'authoritative',
        numVariations: Number(formData.numVariations) || 6,
      }

      const res = await generateConclusions(payload).unwrap()
      if (res && res.conclusions) {
        setDataResult(res)
        setTimeout(() => {
          const el = document.getElementById('conclusion-results')
          if (el) {
            const navHeight = 90
            const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
          }
        }, 150)
      } else {
        setErrorMessage('Failed to generate conclusions. Please try again.')
      }
    } catch (err) {
      console.error('Generation error:', err)
      const errDetail = err?.data?.error || err?.message || 'Failed to generate blog conclusions.'
      setErrorMessage(errDetail)
    }
  }

  const onFormValid = (formData) => {
    const validated = parseBlogConclusionForm(formData)
    if (!validated.success) {
      setErrorMessage(validated.error)
      return
    }

    if (popupEnabled) {
      setPendingForm(validated.data)
      triggerPopup()
      return
    }

    executeGeneration(validated.data)
  }

  const onFormInvalid = (formErrors) => {
    console.warn('Form validation failed:', formErrors)
    const firstErr = Object.values(formErrors)[0]?.message || 'Please check required fields.'
    setErrorMessage(firstErr)
  }

  const filteredConclusions = useMemo(() => {
    if (!dataResult?.conclusions) return []
    if (activeFilterTab === 'starred') {
      return dataResult.conclusions.filter((c) => favorites[c.id])
    }
    if (activeFilterTab === 'all') {
      return dataResult.conclusions
    }
    return dataResult.conclusions.filter((c) => c.funnelStage === activeFilterTab)
  }, [dataResult, activeFilterTab, favorites])

  const starredCount = useMemo(() => {
    return Object.values(favorites).filter(Boolean).length
  }, [favorites])

  return (
    <div
      className={
        isEmbedded
          ? 'w-full @container'
          : 'min-h-screen bg-slate-50 text-slate-800 pb-20 @container'
      }
    >
      {/* Hero Header: only shown when standalone */}
      {!isEmbedded && (
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          <div className="absolute inset-0 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#A7D2FF]/20 to-[#F7B7B3]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-3 tracking-wide uppercase shadow-2xs whitespace-nowrap shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Missive's SEO Tools • Missive Digital</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              <span>Blog Conclusion </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                Generator
              </span>
            </h1>

            <p className="mt-2.5 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Turn reader attention into measurable action. Craft search-optimized, loop-closing
              conclusions with custom H2 headlines and high-converting CTAs.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0C81F3] border border-blue-200/60 whitespace-nowrap shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[#0C81F3]" /> Specific H2 Headlines
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap shrink-0">
                <Sparkles className="w-3 h-3 text-purple-600" /> Intro Loop Closure
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap shrink-0">
                <Target className="w-3 h-3 text-emerald-600" /> Action-Driven CTAs
              </span>
            </div>

            {!dataResult && !isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample(SAMPLE_PRESETS[0])}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0C81F3] bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                  <span>Load Sample Scenario</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className={isEmbedded ? 'w-full' : 'max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6'}>
        {/* Form Container: only shown when not loading */}
        {!isLoading && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-200 p-4 sm:p-6 lg:p-7 mb-8 transition-all">
            {/* Sample Data Presets Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/30 to-slate-50 border border-blue-100/90 mb-4 sm:mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0C81F3]/10 flex items-center justify-center text-[#0C81F3] shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">
                    Try a Sample Scenario:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    1-click fill with realistic B2B SEO and content data
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {SAMPLE_PRESETS.map((preset) => {
                  const isActive = activeSampleId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadSample(preset)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-xs ring-2 ring-[#0C81F3]/20'
                          : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-[#0C81F3] border border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      {preset.badgeIcon && <preset.badgeIcon className="w-3.5 h-3.5" />}
                      <span>{preset.shortName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onFormValid, onFormInvalid)}
              className="space-y-4 sm:space-y-5"
            >
              {/* Blog Topic Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="conclusion-topic-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800"
                  >
                    Blog Post Title or Main Topic <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_PRESETS[0])}
                      className="text-xs text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                    >
                      Sample
                    </button>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">Core Subject</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="conclusion-topic-input"
                    type="text"
                    {...register('topic')}
                    placeholder="e.g. How to Scale Organic Traffic with Programmatic SEO"
                    className={`w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 border rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all pr-16 ${
                      errors.topic ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        if (text) setValue('topic', text.trim(), { shouldValidate: true })
                      } catch {}
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    Paste
                  </button>
                </div>
                {errors.topic && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{errors.topic.message}</p>
                )}
              </div>

              {/* Blog Introduction Input (LOOP CLOSURE) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="conclusion-intro-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#0C81F3]" />
                    <span>Blog Introduction (Recommended for Loop Closure)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setValue('intro', SAMPLE_PRESETS[0].intro, { shouldValidate: true })
                      }
                      className="text-[11px] text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                    >
                      Sample Intro
                    </button>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
                      Closes Open Loops
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="conclusion-intro-input"
                    rows={3}
                    {...register('intro')}
                    placeholder="Paste the opening paragraph or hook of your article here. The generator will analyze the question or tension introduced and resolve it in the conclusion."
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        if (text) setValue('intro', text.trim(), { shouldValidate: true })
                      } catch {}
                    }}
                    className="absolute right-2.5 top-3 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    Paste
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional but recommended: Great conclusions deliver on the promise established in
                  the article's opening.
                </p>
              </div>

              {/* Key Takeaways / Points Covered (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="conclusion-takeaways-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Key Takeaways / Highlights{' '}
                      <span className="text-xs font-normal text-slate-400">(Optional)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setValue('keyTakeaways', SAMPLE_PRESETS[0].keyTakeaways, {
                        shouldValidate: true,
                      })
                    }
                    className="text-[11px] text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                  >
                    Sample Takeaways
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    id="conclusion-takeaways-input"
                    rows={2}
                    {...register('keyTakeaways')}
                    placeholder="e.g. • Data quality beats page count; • Strict indexation guards; • Canonical architecture."
                    className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all resize-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional: Key takeaways covered in your article body so the generator can
                  synthesize them into the final CTA bridge.
                </p>
              </div>

              {/* Funnel Stage Focus Selector */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Select Funnel Stage Focus
                </label>
                <div className="grid grid-cols-2 @min-[620px]:grid-cols-4 gap-2 sm:gap-2.5">
                  {FUNNEL_OPTIONS.map((opt) => {
                    const isSelected = selectedFunnel === opt.id
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedFunnel(opt.id)
                          setValue('funnelStage', opt.id)
                        }}
                        className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                              <Icon className="w-3.5 h-3.5 text-[#0C81F3]" />
                              <span>{opt.label}</span>
                            </div>
                            {opt.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0C81F3] text-white whitespace-nowrap shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug line-clamp-2">
                            {opt.sub}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* CTA Goal Selector */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Desired Call to Action (CTA)
                </label>
                <div className="grid grid-cols-2 @min-[460px]:grid-cols-3 gap-2">
                  {CTA_OPTIONS.map((opt) => {
                    const isSelected = selectedCta === opt.id
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedCta(opt.id)
                          setValue('ctaGoal', opt.id)
                        }}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#0C81F3] bg-blue-50/70 shadow-xs ring-2 ring-[#0C81F3]/20 text-[#0C81F3] font-bold'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700 font-medium'
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0C81F3]' : 'text-slate-400'}`}
                        />
                        <span className="text-xs truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedCta === 'custom' && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      {...register('ctaCustomText')}
                      placeholder="e.g. Schedule an Enterprise Architecture Review →"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                    />
                  </div>
                )}
              </div>

              {/* Optional Fine-Tuning Grid */}
              <div className="grid grid-cols-1 @min-[620px]:grid-cols-3 gap-3 pt-1">
                {/* Tone Selector */}
                <div>
                  <label
                    htmlFor="conclusion-tone"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Tone of Voice
                  </label>
                  <select
                    id="conclusion-tone"
                    {...register('tone')}
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label
                    htmlFor="conclusion-audience"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Target Audience{' '}
                    <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="conclusion-audience"
                    type="text"
                    {...register('targetAudience')}
                    placeholder="e.g. B2B SaaS Founders, SEO Leads"
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  />
                </div>

                {/* Number of Variations */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    Variations to Generate
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { n: 3, sub: '1 / stage' },
                      { n: 6, sub: '2 / stage', badge: 'Popular' },
                      { n: 9, sub: '3 / stage', badge: 'Ideal' },
                    ].map(({ n, sub, badge }) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue('numVariations', n)}
                        className={`relative py-1.5 px-2 rounded-lg sm:rounded-xl border text-center transition-all cursor-pointer ${
                          countValue === n
                            ? 'border-[#0C81F3] bg-blue-50/80 text-[#0C81F3] font-black shadow-xs ring-2 ring-[#0C81F3]/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <div className="text-xs sm:text-sm leading-tight">{n}</div>
                        <div className="text-[9px] text-slate-400 font-normal leading-none mt-0.5">
                          {sub}
                        </div>
                        {badge && countValue !== n && (
                          <span className="absolute -top-1.5 right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-[#0C81F3] text-white shadow-2xs whitespace-nowrap shrink-0">
                            {badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs sm:text-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Generate Conclusions</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error Display */}
            {errorMessage && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold">Notice</p>
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
              title="Architecting Search-Optimized Blog Conclusions..."
              subtitle="Synthesizing specific H2 headlines, closing intro open loops, and crafting high-converting CTA bridges."
              steps={LOADING_STEPS}
            />
          </div>
        )}

        {/* Results Container */}
        {dataResult && !isLoading && (
          <div id="conclusion-results" className="space-y-6 animate-fade-in pt-1">
            {/* Header & Controls Bar */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0C81F3] text-[11px] font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Generated {dataResult.totalGenerated} High-Impact Conclusions</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Topic: "{dataResult.topic}"
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tone:{' '}
                  <strong className="text-slate-700 capitalize">
                    {TONES.find((t) => t.id === (dataResult.tone || watch('tone')))?.label ||
                      dataResult.tone ||
                      watch('tone')}
                  </strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedAll ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedAll ? 'Copied All!' : 'Copy All'}</span>
                </button>

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

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: 'all', label: 'All Conclusions' },
                  { id: 'tofu', label: 'TOFU' },
                  { id: 'mofu', label: 'MOFU' },
                  { id: 'bofu', label: 'BOFU' },
                  { id: 'starred', label: `Starred (${starredCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeFilterTab === tab.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-medium shrink-0 hidden sm:inline">
                Showing {filteredConclusions.length} result
                {filteredConclusions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Conclusion Cards Grid */}
            <div className="grid grid-cols-1 gap-5">
              {filteredConclusions.map((item, index) => {
                const isFavorite = Boolean(favorites[item.id])
                const isCopied = copiedConclusionId === item.id
                const isH2Copied = copiedH2Id === item.id
                const isCtaCopied = copiedCtaId === item.id

                const stageStyles = {
                  tofu: {
                    border: 'border-sky-200 hover:border-sky-300',
                    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
                    indicator: 'bg-sky-500',
                  },
                  mofu: {
                    border: 'border-amber-200 hover:border-amber-300',
                    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
                    indicator: 'bg-amber-500',
                  },
                  bofu: {
                    border: 'border-emerald-200 hover:border-emerald-300',
                    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    indicator: 'bg-emerald-500',
                  },
                }[item.funnelStage] || {
                  border: 'border-slate-200',
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  indicator: 'bg-slate-500',
                }

                return (
                  <div
                    key={item.id || index}
                    className={`bg-white rounded-2xl sm:rounded-3xl border ${stageStyles.border} p-4 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${stageStyles.badge}`}
                        >
                          {item.funnelLabel}
                        </span>
                        <span className="inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.framework}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                          {item.wordCount} words • ~{item.readingTimeSeconds}s
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isFavorite
                              ? 'bg-amber-50 border-amber-300 text-amber-500'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                          }`}
                          title={isFavorite ? 'Remove from starred' : 'Star this conclusion'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* SPECIFIC H2 TITLE BLOCK (USER HIGHLIGHT) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Specific H2 Title (SEO & Engagement Optimized)</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                          ## {item.specificH2Title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyH2(item.id, item.specificH2Title)}
                        className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                      >
                        {isH2Copied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isH2Copied ? 'Copied H2!' : 'Copy H2'}</span>
                      </button>
                    </div>

                    {/* Conclusion Content Body */}
                    <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {item.hookClosure && (
                        <p className="font-semibold text-slate-900 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                          {item.hookClosure}
                        </p>
                      )}
                      <div className="whitespace-pre-line">{item.body}</div>
                    </div>

                    {/* Next Step & Call to Action Box */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-pink-50/40 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold text-[#0C81F3] uppercase tracking-wider">
                          Next Action Step
                        </span>
                        <p className="text-xs text-slate-800 font-medium">{item.ctaPrompt}</p>
                        <div className="inline-block pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-lg shadow-2xs">
                            {item.ctaButtonText}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCta(item.id, `${item.ctaPrompt}\n[${item.ctaButtonText}]`)
                        }
                        className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                      >
                        {isCtaCopied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isCtaCopied ? 'Copied CTA!' : 'Copy CTA'}</span>
                      </button>
                    </div>

                    {/* Card Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 italic max-w-xl">
                        <span className="font-semibold text-slate-700 not-italic">
                          Why it works:{' '}
                        </span>
                        {item.whyItWorks}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyConclusion(item.id, item.fullConclusion)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-black text-white'
                        }`}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isCopied ? 'Copied Full Conclusion!' : 'Copy Full Markdown'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}

              {filteredConclusions.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  No conclusions found under the selected filter tab.
                </div>
              )}
            </div>

            {/* Bottom Floating Reset */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Create Conclusions for Another Topic</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          if (pendingForm) executeGeneration(pendingForm)
          setPendingForm(null)
        }}
        toolSlug="blog-conclusion-generator"
        title="Unlock High-Converting Conclusions"
        subtitle="Provide your details below to generate specific, search-optimized conclusions."
      />
    </div>
  )
}
