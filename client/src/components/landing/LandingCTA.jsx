import { Sparkles } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingCTA - final premium call-to-action banner.
 */
export default function LandingCTA({
  heading = '',
  subheading = '',
  ctaLabel = 'Get Started Free',
  ctaOnClick,
  badge = '100% FREE - NO SIGN-UP',
  className = 'bg-[#F9F7F6]',
}) {
  const ref = useScrollReveal({ threshold: 0.15 })

  return (
    <section className={`py-16 sm:py-24 ${className}`}>
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div
          ref={ref}
          className="lp-reveal relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#DAD0FF] via-[#E7E4FF] to-[#D8FFD8] px-6 sm:px-14 py-14 sm:py-20 text-center"
        >
          {/* Decorative rings */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-white/50 pointer-events-none" />
          <div className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full bg-white/40 blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#A7D2FF]/25 blur-3xl pointer-events-none" />

          {/* Stamp badge */}
          <span className="relative inline-block font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.24em] text-[#292929] border-2 border-[#292929]/70 rounded-xl px-4 py-2 rotate-[-4deg] mb-8 opacity-90 bg-white/40">
            {badge}
          </span>

          <h2 className="relative text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98] max-w-2xl mx-auto">
            {heading}
          </h2>

          {subheading && (
            <p className="relative mt-6 text-[15px] sm:text-[17px] text-[#54595F] max-w-xl mx-auto leading-relaxed">
              {subheading}
            </p>
          )}

          <div className="relative mt-10 flex justify-center">
            <button
              onClick={ctaOnClick}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-8 sm:px-9 py-4 sm:py-[18px] text-sm sm:text-base font-semibold tracking-[-0.01em] transition-all duration-300 shadow-[0_32px_53px_rgba(52,124,156,0.36)] hover:shadow-[0_32px_60px_rgba(52,124,156,0.5)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}