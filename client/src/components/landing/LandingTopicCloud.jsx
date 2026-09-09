import useScrollReveal from './useScrollReveal'
import { Lightbulb } from 'lucide-react'

const SAMPLE_TOPICS = [
  { text: 'How to Build a Content Calendar That Actually Drives Revenue', intent: 'informational', funnel: 'TOFU' },
  { text: 'Top 10 SEO Tools for SaaS startups in 2025', intent: 'commercial', funnel: 'MOFU' },
  { text: 'Content Strategy vs Content Marketing: What\'s the Difference?', intent: 'informational', funnel: 'TOFU' },
  { text: 'Why Your Blog Traffic Dropped 40% After the Core Update', intent: 'informational', funnel: 'MOFU' },
  { text: 'Ultimate Guide to Topic Clusters for E-commerce', intent: 'commercial', funnel: 'MOFU' },
  { text: 'Blog ROI Calculator: Measure Your Content Investment', intent: 'transactional', funnel: 'BOFU' },
  { text: 'Pillar Page Template: 7-Step Framework That Ranks', intent: 'informational', funnel: 'TOFU' },
  { text: 'Editorial Calendar Template for B2B SaaS Teams', intent: 'transactional', funnel: 'BOFU' },
]

const INTENT_STYLES = {
  informational: 'bg-sky-50 text-sky-700 border-sky-200',
  commercial: 'bg-purple-50 text-purple-700 border-purple-200',
  transactional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const FUNNEL_STYLES = {
  TOFU: 'bg-amber-50 text-amber-700 border-amber-200',
  MOFU: 'bg-rose-50 text-rose-700 border-rose-200',
  BOFU: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function LandingTopicCloud() {
  const headerRef = useScrollReveal()
  const cloudRef = useScrollReveal({ threshold: 0.1 })

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
            Each topic is scored by search intent, funnel alignment, and difficulty — so you know exactly what to write, for whom, and when.
          </p>
        </div>

        <div ref={cloudRef} className="lp-reveal flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-5xl mx-auto">
          {SAMPLE_TOPICS.map((topic, i) => (
            <div
              key={i}
              className="group inline-flex flex-col items-start gap-2 px-5 py-3.5 rounded-2xl border border-[#EEE9E5] bg-white hover:bg-[#F9F7F6] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-default max-w-xs"
              style={{ animationDelay: `${(i % 4) * 150}ms` }}
            >
              <span className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-snug">
                {topic.text}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${INTENT_STYLES[topic.intent]}`}>
                  {topic.intent}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${FUNNEL_STYLES[topic.funnel]}`}>
                  {topic.funnel}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          The AI generates 8–15 unique topics per request, each mapped to intent and funnel stage.
        </p>
      </div>
    </section>
  )
}
