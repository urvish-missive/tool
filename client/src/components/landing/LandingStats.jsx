import useScrollReveal from './useScrollReveal'

/**
 * LandingStats — key statistics row for social proof.
 */
export default function LandingStats({ stats = [] }) {
  const ref = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-gradient-to-r from-[#0C81F3] to-[#EB8988]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="lp-reveal lp-stagger grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="lp-reveal-child text-center p-2 sm:p-0">
              <div className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {s.value}
                {s.suffix && <span className="text-white/85 text-lg xs:text-xl sm:text-2xl font-bold ml-0.5">{s.suffix}</span>}
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm text-white/90 font-medium mt-1.5 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

}
