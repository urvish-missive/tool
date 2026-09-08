import { XCircle, CheckCircle } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingBeforeAfter — side-by-side before/after comparison.
 */
export default function LandingBeforeAfter({
  sectionLabel = 'Before vs After',
  heading = '',
  subheading = '',
  before = { title: 'Without This Tool', items: [] },
  after = { title: 'With This Tool', items: [] },
}) {
  const headerRef = useScrollReveal()
  const beforeRef = useScrollReveal()
  const afterRef = useScrollReveal()

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          {sectionLabel && (
            <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2 sm:mb-2.5">
              {sectionLabel}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
            {heading}
          </h2>
          {subheading && (
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
              {subheading}
            </p>
          )}
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Before */}
          <div ref={beforeRef} className="lp-reveal-left relative rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-7 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-400" />
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-rose-800 mb-3 sm:mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
              <span>{before.title}</span>
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {before.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 font-normal">
                  <span className="text-rose-400 mt-0.5 shrink-0 font-bold">✗</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div ref={afterRef} className="lp-reveal-right relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-7 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-emerald-800 mb-3 sm:mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
              <span>{after.title}</span>
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {after.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-700 font-normal">
                  <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

  )
}
