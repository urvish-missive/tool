import { useState, useMemo } from 'react'
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
  HelpCircle,
  TrendingUp,
  Target,
  ArrowRight,
  Filter,
  Users,
  Anchor,
} from 'lucide-react'
import { blogIntroSchema, parseBlogIntroForm } from '../../schemas/blogIntro.schema'
import { useGenerateBlogIntrosMutation } from '../../services/apiSlice'
import { useLeadPopup } from '../../components/useLeadPopup'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'

const FUNNEL_OPTIONS = [
  {
    id: 'all',
    label: 'All Funnel Stages',
    sub: 'Balanced mix of TOFU, MOFU, and BOFU hooks',
    icon: Layers,
    badge: 'Recommended',
  },
  {
    id: 'tofu',
    label: 'TOFU (Awareness)',
    sub: 'Curiosity gaps, startling statistics & myth-busters',
    icon: Compass,
    color: 'text-sky-600 border-sky-300 bg-sky-50',
  },
  {
    id: 'mofu',
    label: 'MOFU (Consideration)',
    sub: 'Problem-Agitate-Solve (PAS) & framework teasers',
    icon: TrendingUp,
    color: 'text-amber-600 border-amber-300 bg-amber-50',
  },
  {
    id: 'bofu',
    label: 'BOFU (Decision)',
    sub: 'Direct ROI, proof-driven verdicts & cut-the-fluff hooks',
    icon: Target,
    color: 'text-emerald-600 border-emerald-300 bg-emerald-50',
  },
]

const TONES = [
  { id: 'conversational', label: 'Conversational & Engaging' },
  { id: 'authoritative', label: 'Authoritative & Thought-Leadership' },
  { id: 'storytelling', label: 'Storytelling & Narrative' },
  { id: 'fun', label: 'Fun & Playful' },
  { id: 'bold', label: 'Bold & Disruptive' },
  { id: 'empathetic', label: 'Empathetic & Supportive' },
  { id: 'witty', label: 'Witty & Energetic' },
  { id: 'data-driven', label: 'Analytical & Data-Driven' },
]


const LOADING_STEPS = [
  'Analyzing blog topic & audience search intent',
  'Synthesizing TOFU Awareness curiosity hooks & myth-busters',
  'Formulating MOFU Problem-Agitate-Solve frameworks',
  'Architecting BOFU decision-ready ROI verdict intros',
  'Polishing seamless transition bridges into first H2',
]

export default function BlogIntroGeneratorPage({ isEmbedded = false }) {
  const [selectedFunnel, setSelectedFunnel] = useState('all')
  const [activeFilterTab, setActiveFilterTab] = useState('all')
  const [favorites, setFavorites] = useState({})
  const [copiedIntroId, setCopiedIntroId] = useState(null)
  const [copiedHookId, setCopiedHookId] = useState(null)
  const [copiedAll, setCopiedAll] = useState(false)
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
    resolver: zodResolver(blogIntroSchema),
    shouldUnregister: false,
    defaultValues: {
      topic: '',
      targetKeywords: '',
      targetAudience: '',
      funnelStage: 'all',
      tone: 'conversational',
      count: 9,
    },
  })

  const topicValue = watch('topic')
  const countValue = watch('count')
  const toneValue = watch('tone')

  const [generateBlogIntros, { isLoading }] = useGenerateBlogIntrosMutation()

  const {
    showPopup,
    handlePopupSubmit,
    handlePopupClose,
    triggerPopup,
    popupEnabled,
  } = useLeadPopup('blog-intro-generator')

  const [pendingForm, setPendingForm] = useState(null)

  const executeGeneration = async (formData) => {
    setErrorMessage('')
    setDataResult(null)

    try {
      const res = await generateBlogIntros({
        topic: formData.topic.trim(),
        targetKeywords: formData.targetKeywords || '',
        targetAudience: formData.targetAudience || '',
        funnelStage: formData.funnelStage || 'all',
        tone: formData.tone || 'conversational',
        count: Number(formData.count) || 9,
      }).unwrap()

      setDataResult(res)
      setFavorites({})
      setActiveFilterTab('all')

      setTimeout(() => {
        document.getElementById('intro-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      setErrorMessage(err?.data?.error || err.message || 'Failed to generate blog introductions')
    }
  }

  const onFormValid = (formData) => {
    const parsed = parseBlogIntroForm(formData)
    if (!parsed.success) {
      setErrorMessage(parsed.error)
      return
    }

    if (popupEnabled) {
      setPendingForm(parsed.data)
      triggerPopup()
      return
    }

    executeGeneration(parsed.data)
  }

  const handleReset = () => {
    resetForm()
    setSelectedFunnel('all')
    setDataResult(null)
    setErrorMessage('')
    setFavorites({})
    setActiveFilterTab('all')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleCopyIntro = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIntroId(id)
      setTimeout(() => setCopiedIntroId(null), 2000)
    } catch {}
  }

  const handleCopyHook = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHookId(id)
      setTimeout(() => setCopiedHookId(null), 2000)
    } catch {}
  }

  const handleCopyAll = async () => {
    if (!dataResult?.introductions?.length) return
    const allText = dataResult.introductions
      .map(
        (intro, i) =>
          `### [${intro.funnelLabel}] - ${intro.hookFormula}\n**Hook Line:** ${intro.hookLine}\n\n${intro.fullIntro}\n\n**Bridge to H2:** ${intro.transition}\n\n---\n`
      )
      .join('\n')

    try {
      await navigator.clipboard.writeText(allText)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2200)
    } catch {}
  }

  const handleDownloadMarkdown = () => {
    if (!dataResult?.introductions?.length) return
    const content = [
      `# Blog Introductions: ${dataResult.summary.topic}`,
      `*Generated on ${new Date().toLocaleDateString()} via Missive Digital Blog Intro Generator*`,
      dataResult.summary.targetAudience
        ? `*Target Audience: ${dataResult.summary.targetAudience} | Tone: ${TONES.find((t) => t.id === dataResult.summary.tone)?.label || dataResult.summary.tone}*`
        : `*Tone: ${TONES.find((t) => t.id === dataResult.summary.tone)?.label || dataResult.summary.tone}*`,
      ((dataResult.summary?.targetAudiences?.length || dataResult.targetAudiences?.length)
        ? `*Target Audiences: ${(dataResult.summary?.targetAudiences || dataResult.targetAudiences).join(', ')}*`
        : ''),
      '',
      '---',
      '',
      ...dataResult.introductions.map((intro, i) =>
        [
          `## ${i + 1}. [${intro.funnelLabel.toUpperCase()}] ${intro.hookFormula}`,
          `- **Stage:** ${intro.funnelStage.toUpperCase()}`,
          `- **Emotional Trigger:** ${intro.emotionalTrigger}`,
          `- **Word Count:** ${intro.wordCount} words (~${intro.readingTimeSeconds}s read)`,
          '',
          `### Opening Hook:`,
          `> "${intro.hookLine}"`,
          '',
          `### Full Introduction:`,
          intro.fullIntro,
          '',
          `### Transition to H2:`,
          `*${intro.transition}*`,
          '',
          `*Why It Works: ${intro.whyItWorks}*`,
          '',
          '---',
          '',
        ].join('\n')
      ),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-intros-${(dataResult.summary.topic || 'export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtered introductions list
  const filteredIntros = useMemo(() => {
    if (!dataResult?.introductions) return []
    let list = [...dataResult.introductions]

    // Sort favorites first
    list.sort((a, b) => {
      const aFav = favorites[a.id] ? 1 : 0
      const bFav = favorites[b.id] ? 1 : 0
      return bFav - aFav
    })

    if (activeFilterTab === 'favorites') {
      return list.filter((i) => favorites[i.id])
    }
    if (activeFilterTab === 'tofu') {
      return list.filter((i) => i.funnelStage === 'tofu')
    }
    if (activeFilterTab === 'mofu') {
      return list.filter((i) => i.funnelStage === 'mofu')
    }
    if (activeFilterTab === 'bofu') {
      return list.filter((i) => i.funnelStage === 'bofu')
    }

    return list
  }, [dataResult, activeFilterTab, favorites])

  const tofuCount = dataResult?.introductions?.filter((i) => i.funnelStage === 'tofu').length || 0
  const mofuCount = dataResult?.introductions?.filter((i) => i.funnelStage === 'mofu').length || 0
  const bofuCount = dataResult?.introductions?.filter((i) => i.funnelStage === 'bofu').length || 0
  const favCount = Object.values(favorites).filter(Boolean).length

  return (
    <div className={isEmbedded ? 'w-full @container' : 'min-h-screen bg-slate-50 text-slate-800 pb-20 @container'}>
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          if (pendingForm) executeGeneration(pendingForm)
          setPendingForm(null)
        }}
        toolSlug="blog-intro-generator"
        title="Unlock Free Blog Introduction Generator"
        subtitle="Generate unlimited TOFU, MOFU, and BOFU blog hooks and introductions engineered for high retention."
      />

      {/* Hero Header — ONLY SHOWN WHEN NOT EMBEDDED */}
      {!isEmbedded && (
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.05 }}
          />
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#A7D2FF]/20 to-[#F7B7B3]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-3 tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Himani's SEO Tools • Missive Digital</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-2.5">
              <span className="text-slate-900">Multiple Blog </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                Introduction Generator
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Generate high-converting, scroll-stopping blog post hooks engineered across the funnel:{' '}
              <strong className="text-sky-700 font-semibold">TOFU (Awareness)</strong>,{' '}
              <strong className="text-amber-700 font-semibold">MOFU (Consideration)</strong>, and{' '}
              <strong className="text-emerald-700 font-semibold">BOFU (Decision)</strong>.
            </p>
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className={isEmbedded ? 'w-full' : 'max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6'}>
        {/* Input Form Card — ONLY SHOWN WHEN NOT LOADING */}
        {!isLoading && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-200 p-4 sm:p-6 lg:p-7 mb-8 transition-all">
            <form onSubmit={handleSubmit(onFormValid)} className="space-y-4 sm:space-y-5">
              {/* Topic / Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="blog-topic-input" className="block text-xs sm:text-sm font-bold text-slate-800">
                    Blog Post Title or Topic <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400 hidden xs:inline">
                    Be specific for higher-converting hooks
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="blog-topic-input"
                    type="text"
                    {...register('topic')}
                    placeholder="e.g. How to Scale Organic Traffic with Programmatic SEO"
                    className={`w-full pl-3.5 pr-24 sm:pr-28 py-2.5 sm:py-3 bg-slate-50 border rounded-xl sm:rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-xs sm:text-sm font-medium ${
                      errors.topic ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-300'
                    }`}
                  />
                  {topicValue && (
                    <button
                      type="button"
                      onClick={() => setValue('topic', '')}
                      className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText()
                        if (text) setValue('topic', text.trim())
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

              {/* Funnel Stage Selector */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Select Funnel Stage Focus
                </label>
                <div className="grid grid-cols-1 @min-[380px]:grid-cols-2 @min-[620px]:grid-cols-4 gap-2 sm:gap-2.5">
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
                        className={`p-3 rounded-xl sm:rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#0C81F3] bg-blue-50/60 shadow-xs ring-2 ring-[#0C81F3]/20'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#0C81F3] text-white'
                                : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0C81F3] text-white">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{opt.label}</p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-snug">{opt.sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Keywords & Target Audience Row */}
              <div className="grid grid-cols-1 @min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="keywords-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Target Keywords <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="keywords-input"
                    type="text"
                    {...register('targetKeywords')}
                    placeholder="e.g. programmatic SEO, B2B SaaS traffic"
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="audience-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Target Audience <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    id="audience-input"
                    type="text"
                    {...register('targetAudience')}
                    placeholder="e.g. SaaS Founders, Growth Marketers, Developers"
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                  />
                </div>
              </div>

              {/* Tone of Voice & Count Row */}
              <div className="grid grid-cols-1 @min-[420px]:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label htmlFor="tone-select" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    Tone of Voice
                  </label>
                  <select
                    id="tone-select"
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      Number of Variations
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      {selectedFunnel === 'all'
                        ? `${Math.floor(countValue / 3)} per funnel stage`
                        : `${countValue} for ${selectedFunnel.toUpperCase()}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 @min-[880px]:grid-cols-4 gap-1.5 sm:gap-2">
                    {[
                      { n: 6, sub: '2 / stage' },
                      { n: 9, sub: '3 / stage', badge: 'Ideal' },
                      { n: 12, sub: '4 / stage' },
                      { n: 15, sub: '5 / stage' },
                    ].map(({ n, sub, badge }) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue('count', n)}
                        className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl border text-center transition-all cursor-pointer relative ${
                          countValue === n
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {badge && countValue !== n && (
                          <span className="absolute -top-1.5 right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-[#0C81F3] text-white shadow-2xs">
                            {badge}
                          </span>
                        )}
                        <div className="text-xs sm:text-sm font-bold leading-none">{n}</div>
                        <div className={`text-[9px] sm:text-[10px] mt-0.5 leading-none ${countValue === n ? 'text-white/80' : 'text-slate-400'}`}>
                          {sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {dataResult && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm cursor-pointer text-center"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 sm:flex-none rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <span>Generate Blog Introductions</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold">Generation Notice</p>
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
              title="Architecting High-Converting Blog Introductions..."
              subtitle={`Formulating psychologically validated TOFU, MOFU, and BOFU hooks for "${topicValue}".`}
              steps={LOADING_STEPS}
            />
          </div>
        )}

        {/* Results Section */}
        {dataResult && !isLoading && (
          <div id="intro-results" className="space-y-6 sm:space-y-7 animate-fade-in pt-1">
            {/* Top Stats Overview Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0C81F3] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {dataResult.summary.totalGenerated} Introductions Ready
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    "{dataResult.summary.topic}"
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dataResult.summary.targetAudience && (
                      <>
                        Audience: <strong className="text-slate-700">{dataResult.summary.targetAudience}</strong> •{' '}
                      </>
                    )}
                    Tone: <strong className="text-slate-700">{TONES.find((t) => t.id === dataResult.summary.tone)?.label || dataResult.summary.tone}</strong>
                  </p>

                  {/* Target Audience List */}
                  {((dataResult.summary?.targetAudiences && dataResult.summary.targetAudiences.length > 0) ||
                    (dataResult.targetAudiences && dataResult.targetAudiences.length > 0)) && (
                    <div className="pt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#0C81F3]" /> Target Audiences:
                      </span>
                      {(dataResult.summary?.targetAudiences || dataResult.targetAudiences).map((aud, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setValue('targetAudience', aud)
                            navigator.clipboard.writeText(aud)
                          }}
                          title="Click to apply to Target Audience input"
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50/80 text-[#0C81F3] border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer"
                        >
                          {aud}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="flex-1 lg:flex-none px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? 'Copied!' : 'Copy All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="flex-1 lg:flex-none px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .md</span>
                  </button>
                </div>
              </div>

              {/* Funnel Distribution Badges */}
              <div className="grid grid-cols-2 @min-[520px]:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                  <div className="text-[10px] sm:text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                    TOFU Awareness
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-sky-900 mt-0.5">{tofuCount}</div>
                  <div className="text-[10px] text-sky-600">Curiosity & Stats</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    MOFU Consideration
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">{mofuCount}</div>
                  <div className="text-[10px] text-amber-600">PAS & Frameworks</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    BOFU Decision
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5">{bofuCount}</div>
                  <div className="text-[10px] text-emerald-600">ROI & Verdicts</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                  <div className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-purple-700" />
                    <span>Pinned</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-900 mt-0.5">{favCount}</div>
                  <div className="text-[10px] text-purple-600">Saved Favorites</div>
                </div>
              </div>

              {/* AI Strategic Recommendation Banner */}
              {dataResult.summary.recommendedHook && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-[#0C81F3] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0C81F3]">Strategy Tip: </span>
                    <span>{dataResult.summary.recommendedHook}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>

              <button
                type="button"
                onClick={() => setActiveFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({dataResult.introductions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterTab('tofu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilterTab === 'tofu'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                TOFU ({tofuCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterTab('mofu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilterTab === 'mofu'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                MOFU ({mofuCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterTab('bofu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilterTab === 'bofu'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                BOFU ({bofuCount})
              </button>

              {favCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('favorites')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    activeFilterTab === 'favorites'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Saved ({favCount})</span>
                </button>
              )}
            </div>

            {/* Introductions Cards Grid */}
            <div className="space-y-4 sm:space-y-5">
              {filteredIntros.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <p className="text-slate-500 font-semibold text-sm">
                    No introductions found in this filter tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveFilterTab('all')}
                    className="mt-2 text-xs text-[#0C81F3] font-bold hover:underline cursor-pointer"
                  >
                    View All Intros
                  </button>
                </div>
              ) : (
                filteredIntros.map((intro, idx) => {
                  const isFav = !!favorites[intro.id]
                  const isCopiedIntro = copiedIntroId === intro.id
                  const isCopiedHook = copiedHookId === intro.id

                  const stageStyles = {
                    tofu: {
                      card: 'border-sky-200 bg-white hover:border-sky-300',
                      badge: 'bg-sky-50 text-sky-700 border border-sky-200',
                      hookBg: 'bg-sky-50/60 border-sky-100',
                    },
                    mofu: {
                      card: 'border-amber-200 bg-white hover:border-amber-300',
                      badge: 'bg-amber-50 text-amber-700 border border-amber-200',
                      hookBg: 'bg-amber-50/60 border-amber-100',
                    },
                    bofu: {
                      card: 'border-emerald-200 bg-white hover:border-emerald-300',
                      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                      hookBg: 'bg-emerald-50/60 border-emerald-100',
                    },
                  }[intro.funnelStage] || {
                    card: 'border-slate-200 bg-white',
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    hookBg: 'bg-slate-50',
                  }

                  return (
                    <div
                      key={intro.id || idx}
                      className={`rounded-2xl sm:rounded-3xl border shadow-xs transition-all p-4 sm:p-6 space-y-3.5 sm:space-y-4 relative ${stageStyles.card}`}
                    >
                      {/* Card Header & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${stageStyles.badge}`}>
                            {intro.funnelLabel}
                          </span>
                          <span className="inline-flex items-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {intro.hookFormula}
                          </span>
                          <span className="inline-flex items-center whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                            {intro.emotionalTrigger}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {intro.wordCount} words • ~{intro.readingTimeSeconds}s
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleFavorite(intro.id)}
                            title={isFav ? 'Unpin from favorites' : 'Pin to favorites'}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isFav
                                ? 'bg-amber-100 text-amber-600 shadow-2xs'
                                : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-slate-200'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Opening Hook Line Callout */}
                      <div className={`p-3 sm:p-4 rounded-xl border ${stageStyles.hookBg}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Anchor className="w-3.5 h-3.5 text-[#0C81F3]" />
                            <span>Opening Hook Line (Sentence 1)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHook(intro.id, intro.hookLine)}
                            className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {isCopiedHook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopiedHook ? 'Copied!' : 'Copy Hook'}</span>
                          </button>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          "{intro.hookLine}"
                        </p>
                      </div>

                      {/* Full Introduction Body */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Full Introduction Paragraph
                        </span>
                        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/60 p-3 sm:p-4 rounded-xl border border-slate-200">
                          {intro.fullIntro}
                        </div>
                      </div>

                      {/* Transition Bridge to H2 */}
                      {intro.transition && (
                        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2 text-xs">
                          <ArrowRight className="w-3.5 h-3.5 text-[#0C81F3] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-700">Bridge to First H2: </span>
                            <span className="text-slate-600 italic">"{intro.transition}"</span>
                          </div>
                        </div>
                      )}

                      {/* Psychological Breakdown & Action Bar */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="text-xs text-slate-500 flex items-start sm:items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                          <span>
                            <strong className="text-slate-700 font-semibold">Why it works:</strong> {intro.whyItWorks}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyIntro(intro.id, intro.fullIntro)}
                          className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                            isCopiedIntro
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white hover:opacity-95'
                          }`}
                        >
                          {isCopiedIntro ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied Intro!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Full Intro</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Floating Reset / New Search Bar */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">Want to try another angle or topic?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refine the tone or test specific TOFU, MOFU, or BOFU formulas.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Introduction Search</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
