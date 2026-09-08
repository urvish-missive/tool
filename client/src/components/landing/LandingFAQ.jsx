import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingFAQ — accordion FAQ section.
 */
export default function LandingFAQ({
  sectionLabel = 'FAQ',
  heading = '',
  subheading = '',
  faqs = [],
  className = 'bg-white border-b border-slate-200/70',
}) {
  const [openIdx, setOpenIdx] = useState(null)
  const headerRef = useScrollReveal()
  const listRef = useScrollReveal({ threshold: 0.08 })

  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          {sectionLabel && (
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2 sm:mb-2.5">
              <HelpCircle className="w-3.5 h-3.5" />
              {sectionLabel}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
            {heading}
          </h2>
          {subheading && (
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-lg mx-auto leading-relaxed font-normal">
              {subheading}
            </p>
          )}
        </div>

        {/* Accordion */}
        <div ref={listRef} className="lp-reveal max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-[#0C81F3]/40 bg-white shadow-md shadow-[#0C81F3]/5 ring-1 ring-[#0C81F3]/15'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm md:text-base font-bold text-slate-800 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0C81F3]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 sm:pt-3 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )

}
