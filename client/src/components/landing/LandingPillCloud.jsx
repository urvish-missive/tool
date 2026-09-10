import { Brain } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const PILLS = [
  {
    text: 'Curiosity Gaps',
    color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    icon: '',
  },
  {
    text: 'Problem-Agitate-Solve (PAS)',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    icon: '',
  },
  {
    text: 'BOFU ROI Verdicts',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    icon: '',
  },
  {
    text: 'Seamless H2 Bridges',
    color: 'bg-blue-50 text-[#0C81F3] border-blue-200 hover:bg-blue-100',
    icon: '',
  },
  {
    text: 'Google E‑E‑A‑T Aligned',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '',
  },
  {
    text: 'Statistics Bombs',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    icon: '',
  },
  {
    text: 'Myth-Buster Openers',
    color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    icon: '',
  },
  {
    text: 'Zero Robotic Buzzwords',
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    icon: '',
  },
  {
    text: 'Storytelling & Narrative Hooks',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: '',
  },
  {
    text: 'Scroll-Stopping Pattern Interrupts',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    icon: '',
  },
  {
    text: '10-Second Retention Boost',
    color: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100',
    icon: '',
  },
  {
    text: 'Empathetic Problem Solving',
    color: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: '',
  },
]

/**
 * LandingPillCloud — signature floating pill cloud inspired by Missive Digital's throwable element scene.
 */
export default function LandingPillCloud({
  pills,
  badge = 'Psychological Frameworks',
  heading = 'Every Psychological Formula At Your Fingertips',
  subheading = 'We analyzed 1,000+ top-ranking articles to extract the exact hook formulas that eliminate reader drop-off.',
  note = 'Hover over any framework to see the depth built into every AI generation.',
}) {
  const headerRef = useScrollReveal()
  const cloudRef = useScrollReveal({ threshold: 0.1 })

  const displayPills = pills || PILLS

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 via-slate-50/50 to-white border-b border-slate-200/70 relative overflow-hidden">
      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#A7D2FF]/20 via-[#F7B7B3]/20 to-[#A7D2FF]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Brain className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            {heading}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            {subheading}
          </p>
        </div>

        {/* Floating Pill Cloud */}
        <div
          ref={cloudRef}
          className="lp-reveal flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-6xl mx-auto pt-2"
        >
          {displayPills.map((pill, i) => (
            <div
              key={i}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm font-bold shadow-xs hover:shadow-md hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none ${pill.color}`}
              style={{ animationDelay: `${(i % 5) * 200}ms` }}
            >
              {pill.icon && (
                <span className="shrink-0 flex items-center justify-center">
                  <pill.icon className="w-4 h-4" />
                </span>
              )}
              <span>{pill.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom Trust Note */}
        {note && <p className="mt-8 text-xs text-slate-400 font-medium">{note}</p>}
      </div>
    </section>
  )
}
