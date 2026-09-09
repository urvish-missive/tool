import useScrollReveal from './useScrollReveal'
import { FileText, Target, Share2, Video, Globe, BookOpen } from 'lucide-react'

const CHANNELS = [
  {
    icon: FileText,
    title: 'Case Study & KPIs',
    desc: 'Full evidence-backed case study with Challenge, Solution, Results, and quantified metrics.',
    color: 'from-sky-500 to-blue-600',
    tag: 'Core Output',
  },
  {
    icon: BookOpen,
    title: 'Blog Weaving & Links',
    desc: 'Blog posts that weave the case study into your content strategy with internal link opportunities.',
    color: 'from-indigo-500 to-purple-600',
    tag: 'Content',
  },
  {
    icon: Target,
    title: 'Sales Battlecard',
    desc: 'Objection handlers, competitor comparisons, and talk tracks for your sales team.',
    color: 'from-rose-500 to-pink-600',
    tag: 'Sales',
  },
  {
    icon: Share2,
    title: 'Paid Ads & Social',
    desc: 'LinkedIn carousels, Twitter threads, and paid ad copy repurposed from the case study.',
    color: 'from-amber-500 to-orange-600',
    tag: 'Distribution',
  },
  {
    icon: Video,
    title: 'Video & Newsletter',
    desc: 'Video scripts and newsletter copy that turn case study data into engaging narratives.',
    color: 'from-emerald-500 to-teal-600',
    tag: 'Media',
  },
  {
    icon: Globe,
    title: 'AI Search & GEO',
    desc: 'Optimized for AI search citations — structured data, entity signals, and citable excerpts.',
    color: 'from-violet-500 to-purple-600',
    tag: 'AI Search',
  },
]

export default function LandingDistributionChannels() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="channels" className="py-16 sm:py-20 lg:py-24 bg-white relative scroll-mt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#A7D2FF]/15 via-[#F7B7B3]/15 to-[#A7D2FF]/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Share2 className="w-3.5 h-3.5" />
            6 Output Channels
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            One Case Study.{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              Six Distribution Channels.
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Generate once, distribute everywhere. Each case study produces a full commercial playbook across sales, content, social, video, and AI search.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon
            return (
              <div
                key={ch.title}
                className="lp-reveal-child group rounded-[22px] bg-[#F9F7F6] border border-[#EEE9E5] p-5 sm:p-6 hover:border-[#0C81F3]/30 hover:bg-white hover:shadow-[0_24px_36px_rgba(0,0,0,0.05)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${ch.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {ch.tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{ch.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">{ch.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
