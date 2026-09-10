import useScrollReveal from './useScrollReveal'
import { FileText, Target, Link2, BarChart3, Calendar, Sparkles } from 'lucide-react'

const PILLARS = [
  {
    icon: Target,
    title: 'Pillar Page Topics',
    desc: 'High-authority, broad topics that anchor your topical cluster and capture maximum search volume.',
    stat: '2-4 per strategy',
    color: 'from-[#0C81F3] to-[#67A7FF]',
  },
  {
    icon: Link2,
    title: 'Cluster Subtopics',
    desc: 'Long-tail, intent-specific articles that link back to pillar pages and capture niche queries.',
    stat: '6-12 per pillar',
    color: 'from-[#67A7FF] to-[#EB8988]',
  },
  {
    icon: BarChart3,
    title: 'Funnel-Mapped Intent',
    desc: 'Every topic tagged with TOFU, MOFU, or BOFU so you write the right content for the right reader at the right time.',
    stat: 'Buyer journey aligned',
    color: 'from-[#EB8988] to-[#FFB7B2]',
  },
  {
    icon: FileText,
    title: 'Master Briefs',
    desc: 'One-click deep-dive briefs with outlines, H2/H3 structure, target keywords, and content angle for each topic.',
    stat: 'Full outline per topic',
    color: 'from-[#0C81F3] to-[#EB8988]',
  },
  {
    icon: Calendar,
    title: 'Editorial Calendar',
    desc: 'Prioritized publishing sequence that builds topical authority systematically. Pillar first, clusters second.',
    stat: 'Auto-prioritized',
    color: 'from-[#67A7FF] to-[#0C81F3]',
  },
  {
    icon: Sparkles,
    title: 'SEO & E‑E‑A‑T Aligned',
    desc: 'Every suggestion follows Google quality rater guidelines. Zero fluff, zero generic advice. Only actionable, expert-level topic strategy.',
    stat: 'Intent-Aligned',
    color: 'from-[#EB8988] to-[#0C81F3]',
  },
]

export default function LandingContentPillars() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <FileText className="w-3.5 h-3.5" />
            What You Get
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Everything Needed to{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              Architect a Content Moat
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Not just topic ideas. A complete editorial blueprint with silo architecture, interlinking strategy, and prioritized publishing order.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="lp-reveal-child group rounded-[24px] bg-[#F9F7F6] border border-[#EEE9E5] p-6 sm:p-7 hover:border-[#0C81F3]/30 hover:bg-white hover:shadow-[0_33px_44px_rgba(0,0,0,0.05)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-r ${p.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    {p.stat}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
