import { useState } from 'react'
import {
  Ban,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Search,
} from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const BANNED_ITEMS = [
  {
    banned: 'Em dashes or double hyphens ("--" / unicode)',
    category: 'Punctuation & Cadence',
    severity: 'High Penalty',
    whyBanned:
      'Dead giveaway of algorithmic writing. Disrupts natural spoken rhythm and creates choppy, unnatural cadence.',
    replacement: 'Use hyphens with spaces (" - "), commas, colons, or clean separate sentences.',
    exampleFail: 'Mastering SEO is critical [forbidden em dash] it drives pipeline.',
    examplePass: 'Mastering SEO is critical: it drives predictable pipeline.',
  },
  {
    banned: '"In conclusion" / "To sum up"',
    category: 'Structural Fluff',
    severity: 'Zero Tolerance',
    whyBanned:
      'Signals to both Google and skimmers that the valuable content has ended and filler has begun, causing instant bounce.',
    replacement: 'A specific, benefit-driven H2 headline reinforcing the core operational takeaway.',
    exampleFail: '## In Conclusion',
    examplePass: '## The Final Verdict: How to Scale Organic Reach in 90 Days',
  },
  {
    banned: '"Delve" / "Delving deep"',
    category: 'Robotic Cliché',
    severity: 'High Penalty',
    whyBanned:
      'The most heavily over-indexed verb in LLM training corpora. Instantly degrades professional editorial credibility.',
    replacement: 'Analyze, dissect, evaluate, examine, breakdown, inspect, or audit.',
    exampleFail: 'Let us delve into content marketing.',
    examplePass: 'Let us audit the 3 operational bottlenecks draining your reach.',
  },
  {
    banned: '"Tapestry" / "Beacon" / "Testament"',
    category: 'Robotic Cliché',
    severity: 'High Penalty',
    whyBanned:
      'Pretentious pseudo-poetic fluff that real B2B practitioners never use in technical or strategic discourse.',
    replacement: 'Ecosystem, framework, architecture, track record, evidence, or benchmark.',
    exampleFail: 'A tapestry of modern marketing tactics.',
    examplePass: 'A coordinated architecture of technical and editorial systems.',
  },
  {
    banned: '"Game-changer" / "Revolutionize"',
    category: 'Cheesy Superlative',
    severity: 'Medium Penalty',
    whyBanned:
      'Empty marketing superlatives that convey zero verifiable evidence and violate Google E-E-A-T trust guidelines.',
    replacement: 'Measurable efficiency, scalable upgrade, compound advantage, or high-impact system.',
    exampleFail: 'This tool is a true game-changer.',
    examplePass: 'This automated workflow cuts audit cycles from 6 hours to 15 minutes.',
  },
  {
    banned: '"In today\'s fast-paced world"',
    category: 'Throat-Clearing Preamble',
    severity: 'Zero Tolerance',
    whyBanned:
      'Lazy throat-clearing that wastes reader attention without providing an ounce of proprietary perspective.',
    replacement: 'Open directly with the high-stakes operational friction, baseline metric, or hook.',
    exampleFail: 'In today\'s fast-paced world, speed matters.',
    examplePass: 'When indexation takes 60 days, organic pipeline stalls out.',
  },
  {
    banned: '"Plethora" / "Beacon of hope"',
    category: 'Robotic Cliché',
    severity: 'High Penalty',
    whyBanned:
      'Algorithmic filler words that bloat sentence length without delivering technical specificity.',
    replacement: 'Specific count, catalog, collection, volume, or exact metric.',
    exampleFail: 'A plethora of options.',
    examplePass: '12 verified frameworks tailored to technical content leads.',
  },
  {
    banned: '"Furthermore" / "Moreover"',
    category: 'Transition Traps',
    severity: 'Medium Penalty',
    whyBanned:
      'Formal academic transitions that make copy feel like an essay rather than a high-converting human strategy memo.',
    replacement: 'Direct transitions: "Beyond that,", "Equally important,", "In practice,", or start clean.',
    exampleFail: 'Furthermore, content teams must audit...',
    examplePass: 'Equally important, content teams must audit baseline metrics weekly.',
  },
  {
    banned: '"Look no further"',
    category: 'Cheesy Superlative',
    severity: 'Medium Penalty',
    whyBanned:
      'Late-night infomercial rhetoric that destroys trust with discerning decision makers.',
    replacement: 'Direct, confident value proposition grounded in verified numbers and customer proof.',
    exampleFail: 'Look no further for your SEO needs.',
    examplePass: 'Explore the exact QA checklist trusted by enterprise teams.',
  },
  {
    banned: '"At the end of the day"',
    category: 'Throat-Clearing Preamble',
    severity: 'Medium Penalty',
    whyBanned:
      'Overused colloquial filler that dilutes executive confidence in conclusion paragraphs.',
    replacement: '"The bottom line is simple:", "Ultimately,", or state the core insight directly.',
    exampleFail: 'At the end of the day, quality matters most.',
    examplePass: 'The bottom line is simple: search rankings follow reader retention.',
  },
]

const FILTER_TAGS = ['All', 'Punctuation & Cadence', 'Robotic Cliché', 'Structural Fluff', 'Cheesy Superlative']

export default function LandingBannedWordsWall() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const headerRef = useScrollReveal()
  const wallRef = useScrollReveal({ threshold: 0.08 })

  const items = BANNED_ITEMS.filter((item) => {
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter
    const matchesSearch =
      searchTerm === '' ||
      item.banned.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.replacement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whyBanned.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50 border-b border-slate-200/70 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-rose-700 mb-3">
            <Ban className="w-3.5 h-3.5" />
            Zero-Tolerance Guardrails
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3 sm:mb-4">
            The Wall of Banned Words vs.{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0C81F3] bg-clip-text text-transparent">
              Missive QA Standards
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Himani Kankaria's content standard strictly bans robotic AI markers and verbose preambles. Here is how our programmatic engine strips algorithmic clichés and replaces them with authentic human authority.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === tag
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search banned words..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:border-[#0C81F3] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Banned Word Cards Grid */}
        <div ref={wallRef} className="lp-reveal lp-stagger grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="lp-reveal-child rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all space-y-3.5"
            >
              {/* Header: Banned Term vs Severity */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm sm:text-base font-black text-rose-700 line-through decoration-rose-400 decoration-2">
                    {item.banned}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                  {item.severity}
                </span>
              </div>

              {/* Why Google & Readers Reject It */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Why It Fails QA:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {item.whyBanned}
                </p>
              </div>

              {/* Missive Approved Replacement */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Missive-Certified Replacement:
                </span>
                <p className="text-xs font-semibold text-emerald-900 leading-snug">
                  {item.replacement}
                </p>
              </div>

              {/* In Context Contrast */}
              <div className="pt-1 text-[11px] space-y-1">
                <div className="text-rose-600 flex items-start gap-1.5 font-mono">
                  <span className="font-bold shrink-0">✗</span>
                  <span className="line-through">{item.exampleFail}</span>
                </div>
                <div className="text-emerald-700 flex items-start gap-1.5 font-mono font-medium">
                  <span className="font-bold shrink-0">✓</span>
                  <span>{item.examplePass}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Assurance */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
            Missive Digital runs programmatic regex and E-E-A-T quality filters over every conclusion generation, guaranteeing 100% compliance before copy hits your screen.
          </p>
        </div>
      </div>
    </section>
  )
}
