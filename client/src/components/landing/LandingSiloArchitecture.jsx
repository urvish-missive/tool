import useScrollReveal from './useScrollReveal'
import { Target, Link2, Layers, Compass } from 'lucide-react'

const SILO_NODES = [
  {
    pillar: 'Content Strategy',
    clusters: [
      { text: 'Editorial Calendar Planning', color: 'bg-sky-50 text-sky-700 border-sky-200' },
      { text: 'Content Audit Framework', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { text: 'Topic Research Methods', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ],
  },
  {
    pillar: 'SEO Fundamentals',
    clusters: [
      { text: 'Keyword Mapping', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { text: 'On-Page Optimization', color: 'bg-teal-50 text-teal-800 border-teal-200' },
      { text: 'Technical SEO Audit', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    ],
  },
  {
    pillar: 'Audience Targeting',
    clusters: [
      { text: 'Buyer Persona Development', color: 'bg-amber-50 text-amber-800 border-amber-200' },
      { text: 'Search Intent Mapping', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      { text: 'Funnel Stage Content', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    ],
  },
]

export default function LandingSiloArchitecture() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="silo-architecture" className="py-16 sm:py-20 lg:py-24 bg-[#F9F7F6] relative scroll-mt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#DAD0FF]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D8FFD8]/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="lp-reveal text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            Topical Authority
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Pillar & Cluster{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              Silo Architecture
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The AI maps every topic into a hub-and-spoke model — pillar pages anchor topical authority, cluster pages capture long-tail intent, and internal links distribute ranking power across your entire content ecosystem.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {SILO_NODES.map((silo, i) => (
            <div
              key={silo.pillar}
              className="lp-reveal-child group rounded-[24px] bg-white border border-[#EEE9E5] p-6 sm:p-7 hover:shadow-[0_33px_44px_rgba(0,0,0,0.05)] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] flex items-center justify-center text-white shadow-md">
                  {i === 0 ? <Target className="w-5 h-5" /> : i === 1 ? <Link2 className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                </div>
                <h3 className="text-[15px] font-bold text-slate-900">{silo.pillar}</h3>
              </div>
              <div className="space-y-2.5">
                {silo.clusters.map((cluster) => (
                  <div
                    key={cluster.text}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold ${cluster.color} hover:scale-[1.02] transition-transform cursor-default`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                    {cluster.text}
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#EEE9E5] flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <Link2 className="w-3 h-3" />
                {silo.clusters.length} cluster pages linked
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Hover over any cluster to see the interlinking strategy. The AI generates topic-specific silos for your niche.
        </p>
      </div>
    </section>
  )
}
