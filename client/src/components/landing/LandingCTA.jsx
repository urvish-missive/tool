import { ArrowRight } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingCTA — final call-to-action banner.
 */
export default function LandingCTA({
  heading = '',
  subheading = '',
  ctaLabel = 'Get Started Free',
  ctaOnClick,
  className = 'bg-slate-50 border-t border-slate-200/70',
}) {
  const ref = useScrollReveal({ threshold: 0.15 })

  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div ref={ref} className="lp-reveal-scale relative rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-14 shadow-xl shadow-[#0C81F3]/15">
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)' }}
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDJ2Mmgydi0yaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2.5 sm:mb-3 leading-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed font-normal">
                {subheading}
              </p>
            )}
            <button
              onClick={ctaOnClick}
              className="w-full sm:w-auto rounded-full bg-white px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-[#0C81F3] hover:bg-slate-50 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )

}
