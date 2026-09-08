import { Sparkles } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingHero — reusable hero section for every tool landing page.
 */
export default function LandingHero({
  badge = 'Free SEO Tool',
  title = [],
  subtitle = '',
  ctaLabel = 'Try It Free',
  ctaOnClick,
  secondaryCta,
  trustBadges = [],
}) {
  const heroRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="relative overflow-hidden pt-28 xs:pt-32 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 lg:pb-20 border-b border-slate-100">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.06 }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none lp-float" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none lp-float-delay" />

      <div ref={heroRef} className="lp-reveal relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-4 sm:mb-5 tracking-wider uppercase shadow-md shadow-[#0C81F3]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15] sm:leading-[1.12] mb-3.5 sm:mb-5">
          {title.map((seg, i) =>
            seg.gradient ? (
              <span
                key={i}
                className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent"
              >
                {seg.text}
              </span>
            ) : (
              <span key={i} className="text-slate-900">{seg.text}</span>
            )
          )}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 font-normal">
            {subtitle}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 sm:mb-8 w-full max-w-xs xs:max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={ctaOnClick}
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {ctaLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </button>
          {secondaryCta && (
            <button
              onClick={secondaryCta.onClick}
              className="w-full sm:w-auto rounded-full border-2 border-slate-300 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {secondaryCta.label}
            </button>
          )}
        </div>

        {/* Trust badges */}
        {trustBadges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
            {trustBadges.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full shadow-2xs"
              >
                <span className="text-emerald-500 font-bold">✓</span>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )

}
