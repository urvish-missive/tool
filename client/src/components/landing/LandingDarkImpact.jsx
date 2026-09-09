import { ArrowRight, Zap, Quote, Flame } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingDarkImpact — signature dark mode impact section inspired by Missive Digital's #171720 aesthetic.
 */
export default function LandingDarkImpact({
  watermark = 'RETENTION',
  badge = 'The Retention Imperative',
  title,
  subtitle,
  stats,
  quote,
  author,
  ctaLabel,
  onCtaClick,
}) {
  const headerRef = useScrollReveal()
  const statsRef = useScrollReveal({ threshold: 0.1 })

  const displayStats = stats || [
    {
      value: '67%',
      label: 'Lower Bounce Rate',
      sub: 'When using curiosity gaps & stats vs generic intros',
      gradient: 'from-[#0C81F3] to-[#67A7FF]',
    },
    {
      value: '3.4x',
      label: 'Higher Dwell Time',
      sub: 'Readers stay 3x longer on the page',
      gradient: 'from-[#67A7FF] to-[#EB8988]',
    },
    {
      value: '20-30s',
      label: 'Deep AI Generation',
      sub: 'Save 30-45 minutes of blank-page staring',
      gradient: 'from-[#EB8988] to-[#FFB7B2]',
    },
    {
      value: '100%',
      label: 'E-E-A-T Aligned',
      sub: 'Follows Google quality rater guidelines',
      gradient: 'from-[#0C81F3] to-[#EB8988]',
    },
  ]

  const displayQuote =
    quote ||
    '"The sole purpose of the first sentence in an advertisement is to get you to read the second sentence. Nothing more. If they stop reading, nothing else matters."'

  const displayAuthor = author || 'Joseph Sugarman, Legendary Copywriter'

  const displayCtaLabel = ctaLabel || 'Stop the Bounce: Generate High-Converting Intros'

  return (
    <section className="relative py-20 sm:py-28 lg:py-32 bg-[#171720] text-white overflow-hidden">
      {/* Giant Background Watermark Typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[16vw] font-black tracking-tighter text-white/[0.03] uppercase whitespace-nowrap leading-none">
          {watermark}
        </span>
      </div>

      {/* Ambient Gradient Glow Blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#0C81F3]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#EB8988]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-inner">
            <Flame className="w-3.5 h-3.5 text-[#EB8988]" />
            {badge}
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.12] mb-5">
            {title || (
              <>
                The First 3 Sentences Decide{' '}
                <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                  80% of Your Organic ROI
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            {subtitle ||
              'You spent hours researching, writing, and optimizing. But if your intro starts with "In today\'s digital world...", 67% of readers bounce back to Google in under 8 seconds.'}
          </p>
        </div>

        {/* Big Overlapping Pill Dials Grid */}
        <div
          ref={statsRef}
          className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-20"
        >
          {displayStats.map((item, i) => (
            <div
              key={i}
              className="lp-reveal-child p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-white/25 hover:bg-white/[0.07] transition-all duration-300 backdrop-blur-md group text-center"
            >
              <div
                className={`text-4xl sm:text-5xl font-black tracking-tight leading-none bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform`}
              >
                {item.value}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">{item.label}</h3>
              <p className="text-xs text-slate-400 leading-snug">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Quote Callout & CTA */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.03] backdrop-blur-md p-6 sm:p-10 text-center max-w-3xl mx-auto space-y-6">
          <Quote className="w-8 h-8 text-[#0C81F3] mx-auto opacity-70" />
          <p className="text-base sm:text-lg md:text-xl font-medium text-slate-200 italic leading-relaxed">
            {displayQuote}
          </p>
          <div className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
            {displayAuthor}
          </div>

          {onCtaClick && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-95 transition-all shadow-xl shadow-[#0C81F3]/25 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{displayCtaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
