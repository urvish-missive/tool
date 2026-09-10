import useScrollReveal from './useScrollReveal'
import { Lightbulb, BookOpen, ShoppingCart, CreditCard } from 'lucide-react'

const SAMPLE_TOPICS = [
  { text: 'How to Build a Content Calendar That Actually Drives Revenue', intent: 'informational', funnel: 'TOFU', difficulty: 'Easy' },
  { text: 'Top 10 SEO Tools for SaaS Startups in 2026', intent: 'commercial', funnel: 'MOFU', difficulty: 'Medium' },
  { text: 'Content Strategy vs Content Marketing: What\'s the Difference?', intent: 'informational', funnel: 'TOFU', difficulty: 'Easy' },
  { text: 'Why Your Blog Traffic Dropped 40% After the Core Update', intent: 'informational', funnel: 'MOFU', difficulty: 'Medium' },
  { text: 'Ultimate Guide to Topic Clusters for E-commerce', intent: 'commercial', funnel: 'MOFU', difficulty: 'Hard' },
  { text: 'Blog ROI Calculator: Measure Your Content Investment', intent: 'transactional', funnel: 'BOFU', difficulty: 'Medium' },
  { text: 'Pillar Page Template: 7-Step Framework That Ranks', intent: 'informational', funnel: 'TOFU', difficulty: 'Easy' },
  { text: 'Editorial Calendar Template for B2B SaaS Teams', intent: 'transactional', funnel: 'BOFU', difficulty: 'Hard' },
]

const INTENT_META = {
  informational: { icon: BookOpen, chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  commercial: { icon: ShoppingCart, chip: 'bg-purple-50 text-purple-700 border-purple-200' },
  transactional: { icon: CreditCard, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const FUNNEL_META = {
  TOFU: { chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'from-amber-400 to-amber-500' },
  MOFU: { chip: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'from-rose-400 to-rose-500' },
  BOFU: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'from-emerald-400 to-emerald-500' },
}

const DIFFICULTY_META = {
  Easy: { level: 1, color: 'bg-emerald-500' },
  Medium: { level: 2, color: 'bg-amber-500' },
  Hard: { level: 3, color: 'bg-rose-500' },
}

export default function LandingTopicCloud() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#A7D2FF]/20 via-[#F7B7B3]/20 to-[#A7D2FF]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Lightbulb className="w-3.5 h-3.5" />
            AI-Generated Topics
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Topic Ideas Engineered{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              For Every Funnel Stage
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Each topic is scored by search intent, funnel alignment, and difficulty. So you know exactly what to write, for whom, and when.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {SAMPLE_TOPICS.map((topic, i) => {
            const intentMeta = INTENT_META[topic.intent]
            const funnelMeta = FUNNEL_META[topic.funnel]
            const diffMeta = DIFFICULTY_META[topic.difficulty]
            const IntentIcon = intentMeta.icon
            return (
              <div
                key={i}
                className="lp-reveal-child group relative flex flex-col gap-3 p-5 rounded-3xl border border-[#EEE9E5] bg-white overflow-hidden cursor-default hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70 hover:border-transparent transition-all duration-300"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${funnelMeta.bar} opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${intentMeta.chip} shrink-0`}>
                    <IntentIcon className="w-4 h-4" />
                  </div>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${funnelMeta.chip}`}>
                    {topic.funnel}
                  </span>
                </div>

                <span className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-snug flex-1">
                  {topic.text}
                </span>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${intentMeta.chip}`}>
                    {topic.intent}
                  </span>
                  <div className="flex items-center gap-1" title={`${topic.difficulty} difficulty`}>
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`w-1.5 h-3 rounded-full ${n <= diffMeta.level ? diffMeta.color : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Each topic is scored by search intent, funnel alignment, and difficulty for targeted editorial planning.
        </p>
      </div>
    </section>
  )
}
