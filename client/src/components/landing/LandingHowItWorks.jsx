import React from 'react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingHowItWorks — numbered step-by-step process section.
 */
export default function LandingHowItWorks({
  sectionLabel = 'How It Works',
  heading = '',
  subheading = '',
  steps = [],
  ctaLabel,
  ctaOnClick,
}) {
  const headerRef = useScrollReveal()
  const stepsRef = useScrollReveal({ threshold: 0.08 })

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-y border-slate-200/70">
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

        {/* Steps */}
        <div ref={stepsRef} className="relative lp-reveal lp-stagger">
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-14 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-gradient-to-r from-[#0C81F3] via-[#EB8988] to-[#0C81F3] opacity-25" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={i}
                  className="lp-reveal-child relative text-center group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-[#0C81F3]/40 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 z-10"
                >
                  {/* Step index badge */}
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#0C81F3] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block mb-3">
                    Step 0{i + 1}
                  </span>

                  {/* Step number circle */}
                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0C81F3] to-[#EB8988] text-white font-black text-base sm:text-lg shadow-lg shadow-[#0C81F3]/25 mx-auto mb-3.5 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                    {React.isValidElement(Icon) ? Icon : Icon ? <Icon className="w-5 h-5 sm:w-6 sm:h-6" /> : i + 1}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-[#0C81F3] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        {ctaLabel && (
          <div className="text-center mt-8 sm:mt-10">
            <button
              onClick={ctaOnClick}
              className="rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-[#0C81F3]/25 cursor-pointer"
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </section>

  )
}
