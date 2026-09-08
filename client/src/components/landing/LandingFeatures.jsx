import useScrollReveal from './useScrollReveal'

/**
 * LandingFeatures — feature grid with icons, titles and descriptions.
 */
export default function LandingFeatures({
  sectionLabel = 'Features',
  heading = '',
  subheading = '',
  features = [],
  columns = 3,
}) {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.08 })

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

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

        {/* Feature Grid */}
        <div ref={gridRef} className={`lp-reveal lp-stagger grid grid-cols-1 ${gridCols[columns] || gridCols[3]} gap-4 sm:gap-6`}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="lp-reveal-child group relative p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#0C81F3]/40 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0C81F3] to-[#EB8988] flex items-center justify-center mb-3.5 sm:mb-4 shadow-md shadow-[#0C81F3]/15 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" strokeWidth={2} />
                </div>

                {/* Text */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )

}
