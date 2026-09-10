import { Sparkles, Zap, TrendingUp, Check } from 'lucide-react'
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
  floatingCards,
  toolSlot,
  toolLabel = 'Try It Live • No Sign-Up',
  toolRef,
  hideHeroCopy = false,
}) {
  const heroRef = useScrollReveal({ threshold: 0.1 })

  const effectiveSecondaryCta = secondaryCta || {
    label: 'Explore Framework & Features ↓',
    onClick: () => {
      const target =
        document.getElementById('features') ||
        document.getElementById('frameworks') ||
        document.getElementById('demo') ||
        document.getElementById('anatomy') ||
        document.getElementById('channels') ||
        document.getElementById('silo-architecture') ||
        document.getElementById('checksheet')
      if (target) {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 90
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      } else {
        ctaOnClick?.()
      }
    },
  }

  if (toolSlot) {
    return (
      <section
        className={`relative border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/40 to-white transition-all ${
          hideHeroCopy
            ? 'pt-4 sm:pt-6 pb-12'
            : 'pt-28 xs:pt-32 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 lg:pb-24'
        }`}
      >
        {/* Background ambient lighting isolated in overflow-hidden container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)',
              opacity: 0.05,
            }}
          />
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 lp-float" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 lp-float-delay" />
        </div>

        {!hideHeroCopy && (
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#0C81F3]/10 via-[#67A7FF]/10 to-[#EB8988]/10 text-[#0C81F3] border border-[#0C81F3]/20 mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
              {badge}
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-[42px] font-black text-slate-900 tracking-tight leading-[1.15] mb-4 sm:mb-6">
              {title.map((seg, i) =>
                seg.gradient ? (
                  <span
                    key={i}
                    className={
                      seg.className ||
                      'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent'
                    }
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i} className="text-slate-900">
                    {seg.text}
                  </span>
                )
              )}
            </h1>

            {subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 sm:mb-8 w-full max-w-xs xs:max-w-sm sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={ctaOnClick}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{ctaLabel}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                  />
                </svg>
              </button>
              {effectiveSecondaryCta && (
                <button
                  type="button"
                  onClick={effectiveSecondaryCta.onClick}
                  className="w-full sm:w-auto rounded-full border-2 border-slate-300 bg-white/90 backdrop-blur-xs px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                >
                  {effectiveSecondaryCta.label}
                </button>
              )}
            </div>

            {trustBadges.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {trustBadges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Full-width live tool ── */}
        <div
          ref={toolRef}
          id="tool"
          className={`relative z-20 mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 transition-all ${
            hideHeroCopy ? 'max-w-[1400px] mt-2' : 'max-w-6xl mt-10 sm:mt-12'
          }`}
        >
          <div className="absolute -inset-3 bg-gradient-to-br from-[#0C81F3]/15 to-[#EB8988]/15 rounded-[32px] blur-xl pointer-events-none" />
          <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-300/40 overflow-hidden transition-shadow hover:shadow-[0_35px_60px_-15px_rgba(12,129,243,0.25)]">
            <div className="h-1 bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] lp-shimmer" />
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
                {toolLabel}
              </span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#0C81F3]/10 to-[#EB8988]/10 text-[#0C81F3]">
                <Zap className="w-3 h-3" />
                Free
              </span>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">{toolSlot}</div>
          </div>
        </div>
      </section>
    )
  }

  const cardTopLeft = floatingCards?.topLeft || {
    icon: Zap,
    tag: 'TOFU Curiosity Hook',
    title: '"93% of founders fail at organic reach..."',
    stat: '98% Retention Score',
    tagColor: 'text-[#0C81F3]',
    gradient: 'from-[#0C81F3] to-[#67A7FF]',
  }

  const cardTopRight = floatingCards?.topRight || {
    icon: TrendingUp,
    tag: 'Retention Impact',
    title: '-67% Bounce',
    sub: 'Avg dwell: 3.4 min read',
    tagColor: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
  }

  const cardBottomLeft = floatingCards?.bottomLeft || {
    tag: 'Google E-E-A-T',
    sub: 'Quality Checked',
    icon: Check,
  }

  const cardBottomRight = floatingCards?.bottomRight || {
    tag: '20-30s Deep AI',
    sub: 'TOFU • MOFU • BOFU',
    icon: Zap,
  }

  const TopLeftIcon = cardTopLeft.icon || Zap
  const TopRightIcon = cardTopRight.icon || TrendingUp

  return (
    <section className="relative pt-28 xs:pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/40 to-white">
      {/* Background ambient lighting isolated in overflow-hidden container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.05 }}
        />
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 lp-float" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 lp-float-delay" />
      </div>

      {/* Floating Card: Top Left */}
      <div className="hidden lg:flex items-center gap-3 absolute top-28 left-4 xl:left-12 p-3.5 rounded-2xl lp-glass border border-white/70 shadow-xl shadow-slate-200/60 lp-float-slow max-w-[270px] text-left pointer-events-none z-10">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cardTopLeft.gradient} flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0C81F3]/20`}
        >
          <TopLeftIcon className="w-5 h-5" />
        </div>
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${cardTopLeft.tagColor || 'text-[#0C81F3]'} block`}
          >
            {cardTopLeft.tag}
          </span>
          <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
            {cardTopLeft.title}
          </p>
          {cardTopLeft.stat && (
            <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {cardTopLeft.stat}
            </span>
          )}
        </div>
      </div>

      {/* Floating Card: Top Right */}
      <div className="hidden lg:flex items-center gap-3 absolute top-32 right-4 xl:right-12 p-3.5 rounded-2xl lp-glass border border-white/70 shadow-xl shadow-slate-200/60 lp-float-reverse max-w-[250px] text-left pointer-events-none z-10">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cardTopRight.gradient} flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20`}
        >
          <TopRightIcon className="w-5 h-5" />
        </div>
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${cardTopRight.tagColor || 'text-emerald-600'} block`}
          >
            {cardTopRight.tag}
          </span>
          <p className="text-base font-black text-slate-900 leading-tight mt-0.5">
            {cardTopRight.title}
          </p>
          {cardTopRight.sub && (
            <span className="text-[10px] text-slate-500 font-medium block">{cardTopRight.sub}</span>
          )}
        </div>
      </div>

      {/* Floating Pill: Bottom Left */}
      <div className="hidden xl:flex items-center gap-2.5 absolute bottom-12 left-16 p-2.5 px-3.5 rounded-full lp-glass border border-white/70 shadow-lg shadow-slate-200/50 lp-float-delay pointer-events-none z-10">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
          {cardBottomLeft.icon ? (
            <cardBottomLeft.icon className="w-3.5 h-3.5" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-left pr-1">
          <div className="text-[11px] font-black text-slate-800 leading-none">
            {cardBottomLeft.tag}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">{cardBottomLeft.sub}</div>
        </div>
      </div>

      {/* Floating Pill: Bottom Right */}
      <div className="hidden xl:flex items-center gap-2.5 absolute bottom-14 right-16 p-2.5 px-3.5 rounded-full lp-glass border border-white/70 shadow-lg shadow-slate-200/50 lp-float pointer-events-none z-10">
        <div className="w-6 h-6 rounded-full bg-[#0C81F3] flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
          {cardBottomRight.icon ? (
            <cardBottomRight.icon className="w-3.5 h-3.5" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-left pr-1">
          <div className="text-[11px] font-black text-slate-800 leading-none">
            {cardBottomRight.tag}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">{cardBottomRight.sub}</div>
        </div>
      </div>

      <div
        ref={heroRef}
        className="lp-reveal relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20"
      >
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold rounded-full mb-4 sm:mb-5 tracking-wider uppercase shadow-md shadow-[#0C81F3]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.15] mb-3.5 sm:mb-5">
          {title.map((seg, i) =>
            seg.gradient ? (
              <span
                key={i}
                className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent"
              >
                {seg.text}
              </span>
            ) : (
              <span key={i} className="text-slate-900">
                {seg.text}
              </span>
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
            type="button"
            onClick={ctaOnClick}
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
              />
            </svg>
          </button>
          {effectiveSecondaryCta && (
            <button
              type="button"
              onClick={effectiveSecondaryCta.onClick}
              className="w-full sm:w-auto rounded-full border-2 border-slate-300 bg-white/90 backdrop-blur-xs px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              {effectiveSecondaryCta.label}
            </button>
          )}
        </div>

        {/* Trust badges */}
        {trustBadges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
            {trustBadges.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full shadow-2xs"
              >
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
