import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  Zap,
  Target,
  FileText,
  Volume2,
  TrendingUp,
  Smile,
  Lock,
  Layers,
  Check,
} from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const PILLARS = [
  {
    number: '01',
    icon: Sparkles,
    name: 'Tone, Style & AI Check',
    rule: 'Natural human cadence with strictly zero em dashes and zero robotic clichés.',
  },
  {
    number: '02',
    icon: Volume2,
    name: 'Read Aloud Test',
    rule: 'Smooth spoken cadence that commands attention without awkward, verbose pauses.',
  },
  {
    number: '03',
    icon: Target,
    name: 'Audience Alignment',
    rule: 'Tailored for one specific buyer persona solving a distinct operational bottleneck.',
  },
  {
    number: '04',
    icon: TrendingUp,
    name: 'E-E-A-T & Practical Proof',
    rule: 'Backed by real metrics and lived experience explaining the how and why behind results.',
  },
  {
    number: '05',
    icon: Zap,
    name: 'Insight First Rule',
    rule: 'Opens immediately with the core finding or pattern interrupt: zero throat-clearing.',
  },
  {
    number: '06',
    icon: FileText,
    name: 'Meaning & Crispness',
    rule: 'Every line delivers fresh perspective with zero filler lines or generic padding.',
  },
  {
    number: '07',
    icon: Smile,
    name: 'Zero Offensiveness',
    rule: 'Constructive critique of legacy methods without demeaning industry peers.',
  },
  {
    number: '08',
    icon: Award,
    name: 'Brand Authority',
    rule: 'Showcases strategic domain mastery without sounding pushy, desperate, or salesy.',
  },
  {
    number: '09',
    icon: Layers,
    name: 'Structure & Flow',
    rule: 'Specific H2 headline with logical flow from strategic challenge to quantifiable ROI.',
  },
  {
    number: '10',
    icon: CheckCircle2,
    name: 'No Direct Sales Pitches',
    rule: 'Evidence and verified customer proof sell the capability rather than marketing hype.',
  },
  {
    number: '11',
    icon: Lock,
    name: 'Compliance & Risk Check',
    rule: 'Defensible, context-backed performance claims without unrealistic guarantees.',
  },
  {
    number: '12',
    icon: ShieldCheck,
    name: 'Visual Scannability',
    rule: 'Tight 1 to 3 sentence paragraphs with bold anchors and clear takeaway blocks.',
  },
]

const CORE_GUARANTEES = [
  { label: 'Zero Em Dashes', sub: 'Clean human syntax and cadence' },
  { label: 'Zero Robotic Buzzwords', sub: 'No delve, tapestry, or beacon' },
  { label: 'Quantifiable Proof', sub: 'At least 3 concrete data anchors' },
  { label: 'High Scannability', sub: 'Short 1 to 3 sentence paragraphs' },
]

export default function LandingMissiveQA() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.08 })

  return (
    <section className="py-14 sm:py-18 lg:py-20 bg-slate-50 border-b border-slate-200/70 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-blue-100/30 via-indigo-100/20 to-pink-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-3">
            <Award className="w-3.5 h-3.5" />
            Editorial Quality Standards
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2.5 sm:mb-3">
            Built on Himani Kankaria's{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              12-Pillar QA Framework
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            Every conclusion is automatically audited against 12 strict editorial guardrails to eliminate robotic AI clichés and guarantee human-level conversion quality.
          </p>
        </div>

        {/* 4 Core Guarantees Micro-Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mb-8 sm:mb-10">
          {CORE_GUARANTEES.map((g, i) => (
            <div
              key={i}
              className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                  {g.label}
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-tight">
                  {g.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 12-Pillar Clean Grid */}
        <div
          ref={gridRef}
          className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4"
        >
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.number}
                className="lp-reveal-child p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0C81F3]/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black text-slate-400 group-hover:text-[#0C81F3] transition-colors">
                      Pillar {p.number}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0C81F3] group-hover:border-blue-200 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                    {p.rule}
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Automated QA Check
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
