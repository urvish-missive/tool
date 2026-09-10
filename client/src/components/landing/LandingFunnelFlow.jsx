import { useState } from 'react'
import {
  Compass,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ArrowDown,
} from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const STAGES = [
  {
    id: 'tofu',
    stage: 'TOFU (Top of Funnel)',
    tagline: 'Awareness & Scroll-Stopping',
    badge: 'Cold Audiences',
    icon: Compass,
    accent: 'sky',
    gradient: 'from-sky-500 to-blue-600',
    borderActive: 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg shadow-sky-500/15',
    pillBg: 'bg-sky-50 text-sky-700 border-sky-200',
    goal: 'Stop the 10-second bounce, spark intense curiosity, and challenge conventional wisdom.',
    formulas: ['Curiosity Gap', 'Statistics Bomb', 'Myth Buster'],
    sampleTitle: 'How to Scale B2B SaaS with Organic Programmatic SEO',
    sampleHook:
      '93% of SaaS founders pour thousands into content that never ranks. But a small circle of bootstrapper growth engineers quietly drive 500,000+ monthly visits without writing a single generic blog post.',
    sampleBridge: 'Here is the programmatic framework they use to dominate SERPs in 90 days flat.',
    metric: '67% Lower Bounce Rate',
  },
  {
    id: 'mofu',
    stage: 'MOFU (Middle of Funnel)',
    tagline: 'Consideration & Frameworks',
    badge: 'Warm Prospects',
    icon: TrendingUp,
    accent: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    borderActive: 'border-amber-500 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/15',
    pillBg: 'bg-amber-50 text-amber-700 border-amber-200',
    goal: 'Agitate the pain point, dismantle DIY mistakes, and present your proprietary methodology.',
    formulas: ['Problem-Agitate-Solve (PAS)', 'Problem-Solution', 'Framework Teaser'],
    sampleTitle: 'The Enterprise Content Marketing Stack for 2026',
    sampleHook:
      'You already know content marketing works. The problem? Your team is spending 40 hours a week on manual outlines, generic intros, and low-retention drafts that fail to convert.',
    sampleBridge: 'Before you hire another agency or scrap your roadmap, let us dissect the 3-layer architecture top SaaS brands rely on.',
    metric: '3.4x Reader Dwell Time',
  },
  {
    id: 'bofu',
    stage: 'BOFU (Bottom of Funnel)',
    tagline: 'Decision & High-Intent ROI',
    badge: 'Ready to Buy',
    icon: Target,
    accent: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/15',
    pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    goal: 'Cut the fluff, demonstrate definitive commercial ROI, and guide high-intent buyers to take action.',
    formulas: ['ROI Verdict', 'Social Proof', 'Bold Proof-First Verdict'],
    sampleTitle: 'Comparing Enterprise SEO Platforms vs Agile Tooling',
    sampleHook:
      'If you are evaluating enterprise SEO suites this quarter, you do not need another 20-page feature grid. You need to know which platform drives pipeline without eating 6 months in implementation debt.',
    sampleBridge: 'Below is the side-by-side cost and conversion teardown verified across 50 enterprise implementations.',
    metric: '42% Higher CTA Clicks',
  },
]

export default function LandingFunnelFlow({
  stages,
  badge = 'Conversion Architecture',
  heading,
  subheading,
  sampleLabel1 = 'Opening Hook (Sentence 1-2)',
  sampleLabel2 = 'Bridge to First H2',
  ctaButtonText,
  onTryTool,
}) {
  const [activeStage, setActiveStage] = useState('tofu')
  const [copied, setCopied] = useState(false)
  const headerRef = useScrollReveal()
  const contentRef = useScrollReveal({ threshold: 0.1 })

  const displayStages = stages || STAGES
  const current = displayStages.find((s) => s.id === activeStage) || displayStages[0]
  const CurrentIcon = current.icon

  const handleCopySample = async () => {
    try {
      const titlePrefix = current.sampleTitle ? `${current.sampleTitle}\n\n` : ''
      const textToCopy = current.sampleFullText || `${titlePrefix}${current.sampleHook}\n\n${current.sampleBridge}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {}
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/70 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-100/40 via-purple-100/30 to-pink-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3 sm:mb-4">
            {heading || (
              <>
                Hooks Engineered Across the{' '}
                <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                  Entire Funnel
                </span>
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {subheading ||
              'A generic intro treats every visitor the same. Our generator adapts psychological triggers to where your reader is in their buying journey.'}
          </p>
        </div>

        {/* Funnel Stage Nav Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {displayStages.map((s, idx) => {
            const Icon = s.icon
            const isSelected = activeStage === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStage(s.id)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer group ${
                  isSelected
                    ? `${s.borderActive} bg-white shadow-xl scale-[1.02] -translate-y-0.5`
                    : 'border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Active Indicator Arrow for Desktop */}
                {isSelected && (
                  <div className="hidden md:flex absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 items-center justify-center pointer-events-none">
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1 animate-bounce">
                      <span>Active</span>
                      <ArrowDown className="w-2.5 h-2.5 text-[#0C81F3]" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? `bg-gradient-to-br ${s.gradient} text-white shadow-md`
                        : 'bg-white text-slate-600 border border-slate-200 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${s.pillBg}`}>
                    {s.badge}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400 block">
                    STAGE 0{idx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {s.stage}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    {s.tagline}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Stage Interactive Showcase Card */}
        <div
          ref={contentRef}
          className="lp-reveal rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden transition-all"
        >
          {/* Animated Top Stage Gradient Line */}
          <div
            key={`bar-${activeStage}`}
            className={`h-1.5 w-full bg-gradient-to-r ${current.gradient} transition-all duration-500`}
          />

          {/* Keyed Inner Content for Re-triggering Entrance Animation on Stage Switch */}
          <div
            key={activeStage}
            className="lp-funnel-tab p-6 sm:p-8 lg:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Left: Strategic Breakdown */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${current.pillBg}`}>
                    {current.stage}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {current.metric}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-auto">
                    <Sparkles className="w-3 h-3 text-[#0C81F3] animate-pulse" />
                    Live Output
                  </span>
                </div>

                <h4 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-snug">
                  {current.goal}
                </h4>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Psychological Hook Formulas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {current.formulas.map((f, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs transition-transform hover:scale-105"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {onTryTool && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onTryTool}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>{ctaButtonText ? ctaButtonText(current) : `Generate ${current.id.toUpperCase()} Conclusions Now`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Live Interactive Sample Hook Card */}
              <div className="lg:col-span-7">
                <div className="p-5 sm:p-6 lg:p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 shadow-inner space-y-4 lp-funnel-sample lp-funnel-glow">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#0C81F3]" />
                      Live Generated Output Teaser
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySample}
                      className="text-xs font-bold text-[#0C81F3] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Sample!' : 'Copy Sample'}</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      {sampleLabel1}
                    </span>
                    <blockquote className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition-all duration-300 space-y-2">
                      {current.sampleTitle && (
                        <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                          {current.sampleTitle}
                        </p>
                      )}
                      {current.sampleHook.split('\n\n').filter(Boolean).map((para, i) => (
                        <p key={i} className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </blockquote>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      {sampleLabel2}
                    </span>
                    <p className="text-xs sm:text-sm italic text-slate-700 p-3 rounded-xl bg-blue-50/70 border border-blue-100 font-medium">
                      "{current.sampleBridge}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
