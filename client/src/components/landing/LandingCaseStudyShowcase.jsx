import useScrollReveal from './useScrollReveal'
import { TrendingUp, BarChart3, Target, Zap } from 'lucide-react'

const SHOWCASE_SECTIONS = [
  {
    label: 'Challenge',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    text: 'Customer churn spiked to 18% MoM. Complex onboarding caused 65% abandonment before first value.',
  },
  {
    label: 'Solution',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    text: 'Interactive 3-step checklist, behavioral email triggers, real-time health score alerts for the success team.',
  },
  {
    label: 'Results',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'Churn slashed from 18% to 4.2%. Onboarding completion surged +84%. Net ARR expanded by $1.4M.',
  },
]

const KPI_CARDS = [
  { value: '-77%', label: 'Churn Reduction', icon: TrendingUp, color: 'from-rose-500 to-pink-600' },
  { value: '+84%', label: 'Onboarding Completion', icon: BarChart3, color: 'from-sky-500 to-blue-600' },
  { value: '$1.4M', label: 'Net ARR Expansion', icon: Target, color: 'from-emerald-500 to-teal-600' },
  { value: '6 mo', label: 'Time to Impact', icon: Zap, color: 'from-amber-500 to-orange-600' },
]

export default function LandingCaseStudyShowcase() {
  const headerRef = useScrollReveal()
  const cardRef = useScrollReveal({ threshold: 0.1 })
  const kpiRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F9F7F6] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#DAD0FF]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#D8FFD8]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="lp-reveal text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Real Output Preview
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Evidence-Backed{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              Case Studies That Convert
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every generated case study follows a proven Challenge → Solution → Results structure with quantified KPIs and E-E-A-T proof signals.
          </p>
        </div>

        <div ref={cardRef} className="lp-reveal rounded-[28px] bg-white border border-[#EEE9E5] shadow-[0_33px_44px_rgba(0,0,0,0.04)] overflow-hidden max-w-4xl mx-auto">
          <div className="px-6 sm:px-8 py-5 border-b border-[#EEE9E5] bg-[#F9F7F6] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[13px] font-bold text-slate-800">Generated Case Study Preview</span>
          </div>
          <div className="p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              How Acme Flow Reduced Churn by 77% in 6 Months
            </h3>
            <p className="text-sm text-slate-500 mb-6">B2B SaaS / Product-Led Growth</p>

            <div className="space-y-4 mb-8">
              {SHOWCASE_SECTIONS.map((sec) => (
                <div key={sec.label} className={`rounded-xl border p-4 ${sec.color.split(' ').slice(0, 2).join(' ')}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${sec.color.split(' ')[2]}`}>
                    {sec.label}
                  </span>
                  <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{sec.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KPI_CARDS.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="text-center p-3 rounded-xl bg-[#F9F7F6] border border-[#EEE9E5]">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${kpi.color} text-white mb-2 shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-900">{kpi.value}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{kpi.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
