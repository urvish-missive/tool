import { useState, useRef, useEffect } from 'react'
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
  CheckCircle2,
  AlertCircle,
  Target,
  FileText,
  Share2,
  Video,
  BookOpen,
  Quote,
  TrendingUp,
  Flame,
  Mail,
  Send,
  Search,
  Globe,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'

import { caseStudySchema, parseCaseStudyForm } from '../../schemas/caseStudy.schema'
import { useGenerateCaseStudyMutation } from '../../services/apiSlice'
import { useLeadPopup } from '../../components/useLeadPopup'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'

function LinkedInIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

function TwitterIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

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
    id: 'b2b-saas-churn',
    badgeIcon: RefreshCw,
    shortName: 'SaaS Churn Reduction',
    description: 'Product onboarding & customer retention overhaul',
    clientName: 'Acme Flow',
    niche: 'B2B SaaS / Product-Led Growth',
    challenge:
      'Customer churn spiked to 18% month-over-month. Complex onboarding workflows caused 65% of new signups to abandon before completing first setup, burning marketing spend and stalling ARR growth.',
    solution:
      'Implemented an interactive 3-step checklist, deployed behavioral email re-engagement triggers based on feature inactivity, and installed real-time customer health score alerts for the success team.',
    metrics:
      'Churn slashed from 18% to 4.2%, user onboarding completion surged +84%, and Net ARR expanded by $1.4M in 6 months.',
    targetAudience: 'VP of Product, Head of Customer Success, SaaS Founders',
    tone: 'storytelling',
  },
  {
    id: 'fintech-organic-scale',
    badgeIcon: TrendingUp,
    shortName: 'Fintech Organic Growth',
    description: 'High-intent programmatic SEO & topical authority',
    clientName: 'PaySphere',
    niche: 'Fintech & Cross-Border Payments',
    challenge:
      'High dependence on paid PPC search ads resulting in an unsustainable $420 Customer Acquisition Cost (CAC). Zero organic search rankings for middle-to-bottom of funnel commercial queries.',
    solution:
      'Built a programmatic SEO architecture covering 2,400 currency-pair pages, overhauled technical site architecture for sub-second Core Web Vitals, and produced 40 E-E-A-T thought leadership teardowns.',
    metrics:
      'Organic traffic grew +380% to 180k monthly visits, Blended CAC dropped by -52%, and generated $3.2M in annual pipeline value.',
    targetAudience: 'Chief Financial Officers, Treasurers, Finance Directors',
    tone: 'authoritative',
  },
  {
    id: 'ecommerce-cro',
    badgeIcon: ShoppingBag,
    shortName: 'DTC E-Commerce CRO',
    description: 'Mobile checkout & personalized cart recovery',
    clientName: 'Velvet Luxe',
    niche: 'DTC Luxury Fashion & Apparel',
    challenge:
      'Mobile traffic represented 82% of total visitors but suffered from an abysmal 1.2% checkout conversion rate due to multi-step friction, slow mobile load times, and clunky payment options.',
    solution:
      'Consolidated to a streamlined 1-click Express mobile checkout with Apple Pay & Shop Pay, implemented dynamic personalized bundling discounts, and instituted predictive cart abandonment SMS sequences.',
    metrics:
      'Mobile conversion rate leaped from 1.2% to 3.9%, Average Order Value (AOV) increased +28%, and generated $850K in incremental GMV in 90 days.',
    targetAudience: 'E-Commerce Directors, DTC Founders, Growth Marketers',
    tone: 'data-driven',
  },
]

const TABS = [
  { id: 'case-study', label: 'Case Study & KPIs', icon: FileText },
  { id: 'blog-strategy', label: 'Blog Weaving & Domain Links', icon: BookOpen },
  { id: 'sales-battlecard', label: 'Sales Battlecard & Outreach', icon: Target },
  { id: 'paid-social', label: 'Paid Ads & Social Repurposing', icon: Share2 },
  { id: 'video-newsletter', label: 'Video Scripts & Newsletter', icon: Video },
  { id: 'ai-geo', label: 'AI Search & GEO Citations', icon: Globe },
]

export default function CaseStudyGeneratorPage({
  isEmbedded = false,
  onResultStateChange,
  resetSignal,
}) {
  const [activeTab, setActiveTab] = useState('case-study')
  const [copiedKey, setCopiedKey] = useState(null)
  const [dataResult, setDataResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeSampleId, setActiveSampleId] = useState(null)

  useEffect(() => {
    if (dataResult?.caseStudy) {
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

  // Tab navigation scroll management
  const tabsContainerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)

  const checkScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      setCanScrollLeft(scrollLeft > 6)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    window.addEventListener('resize', checkScrollButtons)
    return () => window.removeEventListener('resize', checkScrollButtons)
  }, [dataResult])

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const amount = 260
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
      setTimeout(checkScrollButtons, 320)
    }
  }

  const handleTabWheel = (e) => {
    if (tabsContainerRef.current) {
      // If user scrolls vertically over the horizontal tabs, scroll horizontally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        tabsContainerRef.current.scrollLeft += e.deltaY
        checkScrollButtons()
      }
    }
  }

  const handleMouseDown = (e) => {
    if (!tabsContainerRef.current) return
    setIsMouseDown(true)
    setHasDragged(false)
    setStartX(e.pageX - tabsContainerRef.current.offsetLeft)
    setScrollLeftPos(tabsContainerRef.current.scrollLeft)
  }

  const handleMouseMove = (e) => {
    if (!isMouseDown || !tabsContainerRef.current) return
    const x = e.pageX - tabsContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    if (Math.abs(walk) > 4) {
      setHasDragged(true)
    }
    tabsContainerRef.current.scrollLeft = scrollLeftPos - walk
    checkScrollButtons()
  }

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false)
  }

  const handleSelectTab = (tabId, e) => {
    if (hasDragged) return
    setActiveTab(tabId)
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(caseStudySchema),
    defaultValues: {
      clientName: '',
      niche: '',
      challenge: '',
      solution: '',
      metrics: '',
      targetAudience: '',
      tone: 'authoritative',
    },
  })

  const [generateCaseStudyMutation, { isLoading }] = useGenerateCaseStudyMutation()

  const { showPopup, handlePopupClose, handlePopupSubmit, triggerPopup, popupEnabled } =
    useLeadPopup('case-study-generator')

  const [pendingForm, setPendingForm] = useState(null)
  const activeToneValue = watch('tone')

  const handleLoadSample = (preset = SAMPLE_PRESETS[0]) => {
    setValue('clientName', preset.clientName, { shouldValidate: true })
    setValue('niche', preset.niche, { shouldValidate: true })
    setValue('challenge', preset.challenge, { shouldValidate: true })
    setValue('solution', preset.solution, { shouldValidate: true })
    setValue('metrics', preset.metrics, { shouldValidate: true })
    setValue('targetAudience', preset.targetAudience, { shouldValidate: true })
    setValue('tone', preset.tone, { shouldValidate: true })
    setActiveSampleId(preset.id)
    setErrorMessage('')
  }

  const handleReset = () => {
    resetForm({
      clientName: '',
      niche: '',
      challenge: '',
      solution: '',
      metrics: '',
      targetAudience: '',
      tone: 'authoritative',
    })
    setActiveSampleId(null)
    setDataResult(null)
    setErrorMessage('')
    setActiveTab('case-study')
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

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2200)
  }

  const handleDownloadMarkdown = () => {
    if (!dataResult?.caseStudy?.fullMarkdown) return
    const blob = new Blob([dataResult.caseStudy.fullMarkdown], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(dataResult.caseStudy.title || 'case-study')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const executeGeneration = async (formData) => {
    setErrorMessage('')
    try {
      const response = await generateCaseStudyMutation(formData).unwrap()
      if (response?.data) {
        setDataResult(response.data)
        setActiveTab('case-study')
        setTimeout(() => {
          const el = document.getElementById('case-study-results')
          if (el) {
            const navHeight = 90
            const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
          }
        }, 150)
      } else {
        throw new Error(response?.error || 'Failed to generate case study.')
      }
    } catch (err) {
      console.error('Case study generation failed:', err)
      setErrorMessage(
        err?.data?.error ||
          err?.message ||
          'Failed to generate case study. Please check inputs and try again.'
      )
    }
  }

  const onSubmit = (formData) => {
    const parseRes = parseCaseStudyForm(formData)
    if (!parseRes.success) {
      setErrorMessage(parseRes.error)
      return
    }

    if (popupEnabled) {
      setPendingForm(parseRes.data)
      triggerPopup()
    } else {
      executeGeneration(parseRes.data)
    }
  }

  const onLeadSubmitSuccess = () => {
    handlePopupSubmit()
    if (pendingForm) {
      executeGeneration(pendingForm)
      setPendingForm(null)
    }
  }

  return (
    <div className={isEmbedded ? 'w-full' : 'min-h-screen bg-slate-50 text-slate-800 pb-20'}>
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={onLeadSubmitSuccess}
        toolSlug="case-study-generator"
        title="Unlock Case Study Generator"
        subtitle="Generate conversion-engineered B2B case studies with multi-channel distribution playbooks."
      />

      {/* Hero Header */}
      {!isEmbedded && (
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          <div className="lp-scanline" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)',
              opacity: 0.08,
            }}
          />
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#A7D2FF]/20 to-[#F7B7B3]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-3 tracking-wide uppercase shadow-2xs whitespace-nowrap shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Himani's SEO Tools • Missive Digital</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              <span>Case Study </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                Generator
              </span>
            </h1>

            <p className="mt-2.5 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Turn real client transformations into high-converting revenue engines. Generate
              evidence-backed B2B case studies paired with full commercial distribution playbooks:
              sales enablement battlecards, objection-handling scripts, cold outreach, paid ads,
              founder newsletter teardowns, and AI Search citation readiness.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0C81F3] border border-blue-200/60 whitespace-nowrap shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[#0C81F3]" /> Sales Battlecards & Objection
                Handlers
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap shrink-0">
                <Sparkles className="w-3 h-3 text-purple-600" /> Paid Ads & Carousel Slides
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap shrink-0">
                <Target className="w-3 h-3 text-emerald-600" /> GEO & AI Search Citations
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
      <div className={isEmbedded ? 'w-full' : 'max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8'}>
        {/* Form Container — ONLY SHOWN WHEN NOT LOADING */}
        {!isLoading && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-200 p-4 sm:p-6 lg:p-7 mb-8 transition-all">
            {/* Sample Data Presets Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/30 to-slate-50 border border-blue-100/90 mb-5 sm:mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0C81F3]/10 flex items-center justify-center text-[#0C81F3] shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">
                    Try a Sample Scenario:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    1-click fill with realistic B2B transformation data
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
                          ? 'bg-[#0C81F3] text-white border border-[#0C81F3] shadow-xs ring-2 ring-[#0C81F3]/20'
                          : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-[#0C81F3] border border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      {preset.badgeIcon && <preset.badgeIcon className="w-3.5 h-3.5 shrink-0" />}
                      <span>{preset.shortName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client / Brand Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      Client / Brand Name{' '}
                      <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Acme Flow (or leave blank for 'Enterprise Partner')"
                    {...register('clientName')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs"
                  />
                </div>

                {/* Niche / Industry */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      Niche / Industry <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. B2B SaaS / Product-Led Growth, Fintech, E-Commerce"
                    {...register('niche')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs"
                  />
                  {errors.niche && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.niche.message}</p>
                  )}
                </div>
              </div>

              {/* The Challenge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    The Core Challenge & Pain Point <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400 hidden xs:inline">
                    State the friction and revenue cost of inaction
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="What operational constraint, friction point, or revenue leak was holding the client back before this initiative?"
                  {...register('challenge')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs resize-y"
                />
                {errors.challenge && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.challenge.message}
                  </p>
                )}
              </div>

              {/* The Solution */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    The Solution & Methodology Deployed <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400 hidden xs:inline">
                    Explain the tactical execution blueprint
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="What strategic framework, architectural overhaul, or tactical execution plan was deployed to solve the problem?"
                  {...register('solution')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs resize-y"
                />
                {errors.solution && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.solution.message}
                  </p>
                )}
              </div>

              {/* Metrics & Results */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Quantifiable Metrics & Hard Results <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400 hidden xs:inline">
                    3+ numbers (percentages, dollar amounts, timeframes)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Churn slashed from 18% to 4.2%, +84% onboarding rate, +$1.4M ARR expansion in 6 months"
                  {...register('metrics')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs"
                />
                {errors.metrics && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.metrics.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Audience */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    Target Audience / Decision-Maker Persona{' '}
                    <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Product, CMO, SaaS Founders, Operations Heads"
                    {...register('targetAudience')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs"
                  />
                </div>

                {/* Tone of Voice */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    Tone of Voice
                  </label>
                  <select
                    {...register('tone')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all text-xs sm:text-sm shadow-2xs cursor-pointer"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#0C81F3] via-[#4F9CF8] to-[#EB8988] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" /> Generating Case Study...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate Case Study & Strategy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <UnifiedToolLoader
            title="Synthesizing Commercial Case Study & Distribution Engine..."
            subtitle="Engraving B2B proof, architecting sales battlecards, and generating multi-channel repurposing plans."
            steps={[
              'Structuring executive problem-solution narrative & E-E-A-T proof',
              'Calculating metric lift & building modular testimonials',
              'Crafting sales battlecard, kill metric & objection rebuttals',
              'Developing paid ad hooks, carousel breakdown & search ad snippets',
              'Generating first-person founder newsletter teardown & video outlines',
              'Formulating GEO & AI Search citation soundbites',
            ]}
          />
        )}

        {/* Results Showcase — Tab-based without Missive QA Scorecard */}
        {dataResult && !isLoading && (
          <div id="case-study-results" className="space-y-6">
            {/* Top Results Action Bar */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg shadow-slate-200/40 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0C81F3] border border-blue-200/60">
                    {dataResult.caseStudy?.executiveSnapshot?.industry || 'B2B'}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                    Tone: {dataResult.meta?.tone || activeToneValue}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {dataResult.meta?.wordCount || 0} Words
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {dataResult.caseStudy?.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {dataResult.caseStudy?.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('all-markdown', dataResult.caseStudy?.fullMarkdown || '')
                  }
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  {copiedKey === 'all-markdown' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" /> Copied Case Study!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Case Study MD
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#4F9CF8] hover:opacity-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download .md
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar — Fully scrollable, hidden scrollbar, wheel/drag support, and navigation arrows */}
            <div className="relative flex items-center border-b border-slate-200 pb-2 group/tabnav">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="absolute -left-2 sm:-left-3.5 z-20 p-1.5 sm:p-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-700 hover:text-[#0C81F3] hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                  aria-label="Scroll tabs left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div
                ref={tabsContainerRef}
                onScroll={checkScrollButtons}
                onWheel={handleTabWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                className={`flex items-center gap-2 overflow-x-auto scroll-smooth scrollbar-hide no-scrollbar py-1 px-1 w-full select-none ${
                  isMouseDown ? 'cursor-grabbing' : 'cursor-grab sm:cursor-default'
                }`}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={(e) => handleSelectTab(tab.id, e)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#0C81F3] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-blue-50/50 hover:text-[#0C81F3] border border-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="absolute -right-2 sm:-right-3.5 z-20 p-1.5 sm:p-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-slate-700 hover:text-[#0C81F3] hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                  aria-label="Scroll tabs right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* TAB 1: Full Case Study & KPIs */}
            {activeTab === 'case-study' && (
              <div className="space-y-6">
                {/* Metric KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(dataResult.caseStudy?.metrics || []).map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#0C81F3] transition-all"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-[#0C81F3]" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {m.label}
                      </div>
                      <div className="text-3xl font-extrabold text-[#0C81F3] mb-1">{m.value}</div>
                      <div className="text-xs text-slate-600">{m.detail}</div>
                    </div>
                  ))}
                </div>

                {/* Executive Snapshot Card */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Executive Snapshot
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400">Client Profile</div>
                      <div className="text-sm font-semibold mt-0.5">
                        {dataResult.caseStudy?.executiveSnapshot?.client || 'Enterprise Partner'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Industry / Niche</div>
                      <div className="text-sm font-semibold mt-0.5">
                        {dataResult.caseStudy?.executiveSnapshot?.industry || 'B2B'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Timeframe</div>
                      <div className="text-sm font-semibold mt-0.5">
                        {dataResult.caseStudy?.executiveSnapshot?.timeframe || '90 Days'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Core Win</div>
                      <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                        {dataResult.caseStudy?.executiveSnapshot?.coreWin || 'Scale Achieved'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Challenge & Solution Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Challenge */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                      <AlertCircle className="w-5 h-5" /> The Core Challenge & Friction
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {dataResult.caseStudy?.theChallenge?.context}
                    </p>
                    {dataResult.caseStudy?.theChallenge?.bottlenecks?.length > 0 && (
                      <ul className="space-y-1.5 pt-2">
                        {dataResult.caseStudy.theChallenge.bottlenecks.map((b, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="text-rose-500 font-bold mt-0.5">&bull;</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Solution */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                      <CheckCircle2 className="w-5 h-5" /> The Strategic Solution Blueprint
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {dataResult.caseStudy?.theSolution?.overview}
                    </p>
                    {dataResult.caseStudy?.theSolution?.implementationSteps?.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {dataResult.caseStudy.theSolution.implementationSteps.map((s, i) => (
                          <div
                            key={i}
                            className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                          >
                            <span className="font-semibold text-slate-900">
                              Step {s.step || i + 1}: {s.title} -{' '}
                            </span>
                            <span className="text-slate-600">{s.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Testimonial Callout */}
                {dataResult.caseStudy?.clientQuote && (
                  <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-6 relative shadow-2xs">
                    <Quote className="w-10 h-10 text-blue-200 absolute top-4 right-4 opacity-50" />
                    <p className="text-base font-medium italic text-slate-800 mb-3">
                      "{dataResult.caseStudy.clientQuote.quote}"
                    </p>
                    <div className="text-xs font-bold text-[#0C81F3]">
                      {dataResult.caseStudy.clientQuote.author} &bull;{' '}
                      <span className="font-normal text-slate-600">
                        {dataResult.caseStudy.clientQuote.role},{' '}
                        {dataResult.caseStudy.clientQuote.company}
                      </span>
                    </div>
                  </div>
                )}

                {/* Key Strategic Takeaways */}
                {dataResult.caseStudy?.keyTakeaways?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" /> Key Strategic Takeaways
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {dataResult.caseStudy.keyTakeaways.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0C81F3] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Full Markdown View */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" /> Complete Case Study
                      (Markdown)
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('raw-markdown', dataResult.caseStudy?.fullMarkdown || '')
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'raw-markdown' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'raw-markdown' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed">
                    {dataResult.caseStudy?.fullMarkdown}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: Blog Weaving & Same-Domain Links */}
            {activeTab === 'blog-strategy' && (
              <div className="space-y-6">
                {/* Integration Guidance */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#0C81F3]" /> Blog Post Integration Playbook
                  </h3>
                  <p className="text-sm text-slate-600">
                    {dataResult.marketingStrategy?.blogWeavingStrategy?.placementAdvice}
                  </p>

                  {/* Ready-to-paste Callout Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Drop-in Markdown Callout Box for Blog Posts
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'callout-box',
                            dataResult.marketingStrategy?.blogWeavingStrategy?.calloutBoxMarkdown ||
                              ''
                          )
                        }
                        className="px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200 text-xs hover:bg-slate-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'callout-box' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === 'callout-box' ? 'Copied' : 'Copy Box'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 text-xs font-mono whitespace-pre-wrap">
                      {dataResult.marketingStrategy?.blogWeavingStrategy?.calloutBoxMarkdown}
                    </pre>
                  </div>

                  {/* Contextual Anchor Texts */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 mb-2 block">
                      Recommended Natural Anchor Texts:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(
                        dataResult.marketingStrategy?.blogWeavingStrategy
                          ?.contextualAnchorTextIdeas || []
                      ).map((anchor, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCopy(`anchor-${idx}`, anchor)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>"{anchor}"</span>
                          {copiedKey === `anchor-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Curated List of Same-Domain Blogs */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-500" /> High-Value Blog Topics From The
                        Same Domain
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Articles on your site where citing this case study will drive the highest
                        topical relevance, E-E-A-T, and organic demo conversions.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                      {dataResult.marketingStrategy?.relevantDomainBlogs?.length || 0} Targeted
                      Topics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(dataResult.marketingStrategy?.relevantDomainBlogs || []).map((blog, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0C81F3] transition-all space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0C81F3] font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{blog.title}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              blog.targetStage === 'BOFU'
                                ? 'bg-emerald-100 text-emerald-700'
                                : blog.targetStage === 'MOFU'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {blog.targetStage || 'TOFU'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800">Why Link Here: </span>
                            {blog.whyRelevant}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">
                              Callout Placement:{' '}
                            </span>
                            {blog.recommendedCalloutPlacement}
                          </div>
                        </div>

                        {blog.suggestedAnchor && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                            <span className="text-slate-500">
                              Suggested Anchor:{' '}
                              <span className="font-medium text-[#0C81F3]">
                                "{blog.suggestedAnchor}"
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`blog-anchor-${idx}`, blog.suggestedAnchor)}
                              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `blog-anchor-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span className="text-[11px]">
                                {copiedKey === `blog-anchor-${idx}` ? 'Copied' : 'Copy Anchor'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Sales Battlecard & Outreach */}
            {activeTab === 'sales-battlecard' && (
              <div className="space-y-6">
                {/* The Kill Metric Card */}
                {dataResult.marketingStrategy?.salesEnablement?.killMetric && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" /> The Kill Metric (Competitor
                        Comparison Winner)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'kill-metric',
                            dataResult.marketingStrategy?.salesEnablement?.killMetric || ''
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'kill-metric' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === 'kill-metric' ? 'Copied' : 'Copy Metric'}</span>
                      </button>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {dataResult.marketingStrategy.salesEnablement.killMetric}
                    </p>
                    {dataResult.marketingStrategy.salesEnablement.discoveryCallTrigger && (
                      <p className="text-xs text-slate-300 pt-1">
                        <strong className="text-indigo-300">Discovery Call Drop-In: </strong>
                        {dataResult.marketingStrategy.salesEnablement.discoveryCallTrigger}
                      </p>
                    )}
                  </div>
                )}

                {/* Objection Handlers */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#0C81F3]" /> Objection-Handling Field Scripts
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Word-for-word rebuttals for sales reps using verified case study proof points
                      to neutralize friction.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(dataResult.marketingStrategy?.salesEnablement?.objectionHandlers || []).map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                              {item.objection}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`rebuttal-${idx}`, item.rebuttalScript)}
                              className="text-xs font-medium text-slate-600 hover:text-[#0C81F3] flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `rebuttal-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {copiedKey === `rebuttal-${idx}` ? 'Copied' : 'Copy Script'}
                              </span>
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                            {item.rebuttalScript}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Cold Outreach & Warm Follow-Up Email */}
                {dataResult.marketingStrategy?.salesEnablement?.coldOutreachEmail && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-emerald-600" /> Cold Outreach & Follow-Up
                          Email Template
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          High-converting 3-sentence B2B email sequence anchored in this case
                          study's transformation.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const fullEmail = `Subject Options:\n${(dataResult.marketingStrategy.salesEnablement.coldOutreachEmail.subjectLines || []).join('\n')}\n\nBody:\n${dataResult.marketingStrategy.salesEnablement.coldOutreachEmail.body}\n\nSoft CTA:\n${dataResult.marketingStrategy.salesEnablement.coldOutreachEmail.softCta}`
                          handleCopy('email-full', fullEmail)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'email-full' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedKey === 'email-full' ? 'Copied Email' : 'Copy Entire Email'}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-1">
                          Tested Subject Lines:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(
                            dataResult.marketingStrategy.salesEnablement.coldOutreachEmail
                              .subjectLines || []
                          ).map((subj, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                            >
                              {subj}
                            </span>
                          ))}
                        </div>
                      </div>

                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                        {dataResult.marketingStrategy.salesEnablement.coldOutreachEmail.body}
                      </pre>

                      <div className="text-xs text-slate-600">
                        <strong className="text-slate-800">Soft Question CTA: </strong>
                        <span className="text-emerald-600 font-semibold font-mono">
                          "{dataResult.marketingStrategy.salesEnablement.coldOutreachEmail.softCta}"
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Paid Ads & Social Repurposing */}
            {activeTab === 'paid-social' && (
              <div className="space-y-6">
                {/* Social Posts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LinkedIn Breakdown */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sky-600 font-bold text-base">
                        <LinkedInIcon className="w-5 h-5 text-sky-600" /> LinkedIn Post Breakdown
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'linkedin-post',
                            dataResult.marketingStrategy?.socialMedia?.linkedInPost || ''
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'linkedin-post' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === 'linkedin-post' ? 'Copied Post' : 'Copy Post'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {dataResult.marketingStrategy?.socialMedia?.linkedInPost}
                    </pre>
                  </div>

                  {/* Twitter / X Thread */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                        <TwitterIcon className="w-5 h-5 text-slate-800" /> Twitter / X Thread
                        Concept
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'twitter-thread',
                            (dataResult.marketingStrategy?.socialMedia?.twitterThread || []).join(
                              '\n\n---\n\n'
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'twitter-thread' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === 'twitter-thread' ? 'Copied Thread' : 'Copy All'}</span>
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {(dataResult.marketingStrategy?.socialMedia?.twitterThread || []).map(
                        (tweet, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 relative group"
                          >
                            <div className="text-[10px] font-bold text-slate-400 mb-1">
                              Tweet {idx + 1}
                            </div>
                            <p className="leading-relaxed">{tweet}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* 5-Slide Carousel Breakdown */}
                {dataResult.marketingStrategy?.paidAdsStrategy?.carouselSlides?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-purple-600" /> 5-Slide Document Ad /
                          Carousel Copy
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Slide-by-slide copy crafted for LinkedIn Document Carousels and Instagram
                          PDF Carousels.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const carouselText =
                            dataResult.marketingStrategy.paidAdsStrategy.carouselSlides
                              .map((s) => `[Slide ${s.slideNumber}: ${s.title}]\n${s.body}`)
                              .join('\n\n---\n\n')
                          handleCopy('carousel-copy', carouselText)
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'carousel-copy' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedKey === 'carousel-copy' ? 'Copied All Slides' : 'Copy All Slides'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {dataResult.marketingStrategy.paidAdsStrategy.carouselSlides.map((slide) => (
                        <div
                          key={slide.slideNumber}
                          className="p-4 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 flex flex-col justify-between shadow-2xs space-y-2"
                        >
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 block">
                              Slide {slide.slideNumber}
                            </span>
                            <div className="text-xs font-bold text-slate-900 mt-0.5">
                              {slide.title}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {slide.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid Ads Copy: Contrarian Ad & Search Snippets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contrarian Paid Ad */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-indigo-600" /> Contrarian Pattern-Interrupt
                        Sponsored Ad
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'contrarian-ad',
                            dataResult.marketingStrategy?.paidAdsStrategy?.contrarianAdCopy || ''
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'contrarian-ad' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === 'contrarian-ad' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {dataResult.marketingStrategy?.paidAdsStrategy?.contrarianAdCopy}
                    </pre>
                  </div>

                  {/* High-Intent Search Ad */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600" /> High-Intent Search Ad Headlines &
                      Copy
                    </span>
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">
                          Google Search Headlines:
                        </span>
                        <ul className="space-y-1 text-slate-900 font-mono text-[11px]">
                          {(
                            dataResult.marketingStrategy?.paidAdsStrategy?.searchAdCopy
                              ?.headlines || []
                          ).map((h, i) => (
                            <li key={i}>&bull; {h}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-blue-200/60">
                        <span className="font-bold text-slate-700 block mb-1">Descriptions:</span>
                        <ul className="space-y-1 text-slate-800 text-[11px]">
                          {(
                            dataResult.marketingStrategy?.paidAdsStrategy?.searchAdCopy
                              ?.descriptions || []
                          ).map((d, i) => (
                            <li key={i}>&bull; {d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Video Scripts & Newsletter */}
            {activeTab === 'video-newsletter' && (
              <div className="space-y-6">
                {/* Video Scripts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Short Form Video (Reels / TikTok / Shorts) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                      <Video className="w-5 h-5" /> 30-45s Short-Form Video Concept (TikTok/Reels)
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mb-1">
                          <Zap className="w-3.5 h-3.5 shrink-0 text-rose-600" /> First 3-Second
                          Scroll-Stopping Hook:
                        </span>
                        <p className="text-sm font-semibold text-slate-900 italic">
                          "{dataResult.marketingStrategy?.videoConcepts?.shortFormVideo?.hook3s}"
                        </p>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <span className="font-semibold text-slate-900 block">
                          Script & Visual Progression:
                        </span>
                        <p className="leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-200">
                          {
                            dataResult.marketingStrategy?.videoConcepts?.shortFormVideo
                              ?.scriptOutline
                          }
                        </p>
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">Call to Action: </span>
                        {dataResult.marketingStrategy?.videoConcepts?.shortFormVideo?.cta}
                      </div>
                    </div>
                  </div>

                  {/* Long Form YouTube Breakdown */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                      <Video className="w-5 h-5" /> Long-Form YouTube Teardown Concept
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          High-CTR Video Title:
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          {dataResult.marketingStrategy?.videoConcepts?.longFormYouTube?.title}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <span className="font-bold text-amber-800 block mb-0.5">
                          Thumbnail Concept & Visual Framing:
                        </span>
                        <p className="text-slate-700">
                          {
                            dataResult.marketingStrategy?.videoConcepts?.longFormYouTube
                              ?.thumbnailIdea
                          }
                        </p>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1">
                        <span className="font-semibold text-slate-900 block">
                          3-Act Narrative Architecture:
                        </span>
                        <p className="leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-200">
                          {
                            dataResult.marketingStrategy?.videoConcepts?.longFormYouTube
                              ?.threeActOutline
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Founder / Expert Newsletter Teardown */}
                {dataResult.marketingStrategy?.newsletterTeardown && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Send className="w-5 h-5 text-indigo-600" /> Founder / Expert Newsletter
                          Teardown Edition
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          A raw, first-person newsletter edition for Substack, Beehiiv, or LinkedIn
                          newsletter subscribers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'newsletter-full',
                            dataResult.marketingStrategy.newsletterTeardown.fullIssueMarkdown
                          )
                        }
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        {copiedKey === 'newsletter-full' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedKey === 'newsletter-full'
                            ? 'Copied Issue'
                            : 'Copy Full Newsletter'}
                        </span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div>
                        <strong className="text-slate-800">Subject: </strong>
                        <span className="font-mono text-indigo-600 font-semibold">
                          {dataResult.marketingStrategy.newsletterTeardown.subjectLine}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-800">Preview Line: </strong>
                        <span className="text-slate-600 italic">
                          {dataResult.marketingStrategy.newsletterTeardown.previewText}
                        </span>
                      </div>
                    </div>

                    <pre className="p-5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {dataResult.marketingStrategy.newsletterTeardown.fullIssueMarkdown}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: AI Search & GEO Citations */}
            {activeTab === 'ai-geo' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-[#0C81F3]" /> AI Search & GEO Citation
                      Footprint
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Engineered so Perplexity, Google AI Overviews, and ChatGPT extract and cite
                      this case study as ground truth.
                    </p>
                  </div>

                  {/* Factoid Soundbites */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      LLM Citation Soundbites (Formatted for AI Extraction):
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {(
                        dataResult.marketingStrategy?.aiSearchAndGeo?.llmCitationSoundbites || []
                      ).map((bite, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-800 font-medium">"{bite}"</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`soundbite-${idx}`, bite)}
                            className="text-slate-400 hover:text-[#0C81F3] flex items-center gap-1 flex-shrink-0 cursor-pointer"
                          >
                            {copiedKey === `soundbite-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px]">
                              {copiedKey === `soundbite-${idx}` ? 'Copied' : 'Copy'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target AI Queries */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                    <span className="font-bold text-blue-900 block">
                      Target AI Search & Perplexity Queries To Win:
                    </span>
                    <ul className="space-y-1 text-slate-700">
                      {(dataResult.marketingStrategy?.aiSearchAndGeo?.targetQueries || []).map(
                        (q, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-[#0C81F3] font-bold">&bull;</span>
                            <span>{q}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Entity Schema Recommendations */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block">
                      Recommended Schema.org Structured Data Entities:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(
                        dataResult.marketingStrategy?.aiSearchAndGeo?.entityRecommendations || []
                      ).map((ent, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[11px]"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
