import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingFAQ — "support ticket" style FAQ accordion, shared across every
 * tool page and the home page. Visual reference: /content-qa's FAQ section.
 * Accepts either {question, answer, tag} or {q, a, sev} per item.
 */
export default function LandingFAQ({
  sectionLabel = 'Support Tickets',
  sectionIcon: SectionIcon = HelpCircle,
  heading = 'Frequently Asked Questions',
  subheading = '',
  faqs = [],
}) {
  const [openIdx, setOpenIdx] = useState(0)
  const headerRef = useScrollReveal()
  const listRef = useScrollReveal({ threshold: 0.08 })

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white">
      <div className="max-w-[820px] mx-auto px-6 sm:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-12">
          {sectionLabel && (
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                {SectionIcon && <SectionIcon className="w-3.5 h-3.5 shrink-0" />}
                <span>{sectionLabel}</span>
              </span>
            </div>
          )}
          <h2 className="mt-2 text-3xl sm:text-4xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98]">
            {heading}
          </h2>
          {subheading && (
            <p className="mt-4 text-sm sm:text-base text-[#54595F] max-w-lg mx-auto leading-relaxed">
              {subheading}
            </p>
          )}
        </div>

        <div ref={listRef} className="lp-reveal space-y-3">
          {faqs.map((faq, i) => {
            const question = faq.q ?? faq.question
            const answer = faq.a ?? faq.answer
            const tag = faq.sev ?? faq.tag
            const isOpen = openIdx === i
            return (
              <div
                key={question}
                className={`rounded-3xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-[#0C81F3]/40 bg-gradient-to-r from-blue-50/40 via-white to-rose-50/20 shadow-md shadow-[#0C81F3]/5 ring-1 ring-[#0C81F3]/20'
                    : 'border-[#E5E1DE] bg-white hover:border-[#0C81F3]/30 hover:bg-[#F9F7F6]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  {tag && (
                    <span
                      className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider border transition-colors ${
                        isOpen
                          ? 'bg-[#0C81F3]/10 text-[#0C81F3] border-[#0C81F3]/20 font-bold'
                          : 'bg-[#F9F7F6] text-[#54595F] border-[#E5E1DE]'
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                  <span className="flex-1 text-[15px] sm:text-[16px] font-semibold text-[#292929] font-display">
                    {question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#54595F] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0C81F3]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-[14px] sm:text-[15px] text-[#54595F] leading-relaxed border-t border-[#EEE9E5]/60 mt-1">
                    <p>{answer}</p>
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
