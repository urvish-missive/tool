import { Sparkles, Zap, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingHero — reusable hero section with floating glassmorphism agency cards.
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
    <section className="relative overflow-hidden pt-28 xs:pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/40 to-white">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.05 }}
      />
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none lp-float" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none lp-float-delay" />

      {/* Floating Card: Top Left (TOFU Curiosity Hook) */}
      <div className="hidden lg:flex items-center gap-3 absolute top-28 left-4 xl:left-12 p-3.5 rounded-2xl lp-glass border border-white/70 shadow-xl shadow-slate-200/60 lp-float-slow max-w-[250px] text-left pointer-events-none z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C81F3] to-[#67A7FF] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0C81F3]/20">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0C81F3] block">
            TOFU Curiosity Hook
          </span>
          <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
            "93% of founders fail at organic reach..."
          </p>
          <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            98% Retention Score
          </span>
        </div>
      </div>

      {/* Floating Card: Top Right (Bounce Reduction Impact) */}
      <div className="hidden lg:flex items-center gap-3 absolute top-32 right-4 xl:right-12 p-3.5 rounded-2xl lp-glass border border-white/70 shadow-xl shadow-slate-200/60 lp-float-reverse max-w-[240px] text-left pointer-events-none z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            Retention Impact
          </span>
          <p className="text-base font-black text-slate-900 leading-tight mt-0.5">
            -67% Bounce
          </p>
          <span className="text-[10px] text-slate-500 font-medium block">
            Avg dwell: 3.4 min read
          </span>
        </div>
      </div>

      {/* Floating Pill: Bottom Left (E-E-A-T Quality) */}
      <div className="hidden xl:flex items-center gap-2.5 absolute bottom-12 left-16 p-2.5 px-3.5 rounded-full lp-glass border border-white/70 shadow-lg shadow-slate-200/50 lp-float-delay pointer-events-none z-10">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
          ✓
        </div>
        <div className="text-left pr-1">
          <div className="text-[11px] font-black text-slate-800 leading-none">Google E-E-A-T</div>
          <div className="text-[9px] text-slate-500 font-medium">Quality Checked</div>
        </div>
      </div>

      {/* Floating Pill: Bottom Right (Instant AI) */}
      <div className="hidden xl:flex items-center gap-2.5 absolute bottom-14 right-16 p-2.5 px-3.5 rounded-full lp-glass border border-white/70 shadow-lg shadow-slate-200/50 lp-float pointer-events-none z-10">
        <span className="text-sm">⚡</span>
        <div className="text-left pr-1">
          <div className="text-[11px] font-black text-slate-800 leading-none">15s Instant AI</div>
          <div className="text-[9px] text-slate-500 font-medium">TOFU • MOFU • BOFU</div>
        </div>
      </div>

      <div ref={heroRef} className="lp-reveal relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20">
        {/* Eyebrow Pill */}
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
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {ctaLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </button>
          {secondaryCta && (
            <button
              onClick={secondaryCta.onClick}
              className="w-full sm:w-auto rounded-full border-2 border-slate-300 bg-white/80 backdrop-blur-xs px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
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

