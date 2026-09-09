import { useState } from 'react'
import {
  Layers,
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  Check,
  Copy,
  Info,
  MousePointer,
} from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const ANATOMY_STAGES = [
  {
    id: 'tofu',
    stageLabel: 'TOFU (Awareness)',
    targetIntent: 'Mental model shift, perspective synthesis, low-friction next step',
    h2Title: 'The Verdict: Turning SEO Architecture Into Your Lasting Moat',
    hookClosure:
      'Remember the friction we highlighted in the opening? Scaling organic reach is not about chasing every algorithm update. It is about mastering the core data fundamentals that compound over quarters.',
    body:
      'Throughout this guide, we evaluated why reactive tactics yield diminishing returns. When growth teams systematize their content architecture, they eliminate wasted cycles and build an unassailable organic moat.\n\nThe difference between stagnating blogs and category leaders is not headcount. It is disciplined execution of repeatable systems.',
    ctaPrompt:
      'Where will your team focus your energy this quarter? Start by benchmarking one high-priority workflow against our organic architecture framework.',
    ctaButton: 'Explore More Growth Frameworks',
    anatomyAnnotations: [
      {
        layer: 'Layer 1: Specific H2 Headline',
        tag: 'H2 Takeaway',
        text: 'Zero generic words like "In Conclusion". Highlights the primary strategic takeaway immediately.',
        color: 'border-sky-300 bg-sky-50 text-sky-800',
        badgeColor: 'bg-sky-500 text-white',
      },
      {
        layer: 'Layer 2: Intro Loop Closure',
        tag: 'Loop Resolution',
        text: 'Explicitly resolves the tension established in the introduction, fulfilling the promise made to the reader.',
        color: 'border-blue-300 bg-blue-50 text-blue-800',
        badgeColor: 'bg-blue-600 text-white',
      },
      {
        layer: 'Layer 3: Value Synthesis Anchor',
        tag: 'Synthesis',
        text: 'Synthesizes the core mental model shift. Avoids mechanical bullet-point repetition.',
        color: 'border-indigo-300 bg-indigo-50 text-indigo-800',
        badgeColor: 'bg-indigo-600 text-white',
      },
      {
        layer: 'Layer 4: Low-Friction CTA Bridge',
        tag: 'Low-Friction Action',
        text: 'Smoothly transitions from insight into the next logical low-friction step (newsletter, related guide).',
        color: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        badgeColor: 'bg-emerald-600 text-white',
      },
    ],
  },
  {
    id: 'mofu',
    stageLabel: 'MOFU (Consideration)',
    targetIntent: 'Decision criteria summary, execution blueprint, lead magnet download',
    h2Title: 'Your Implementation Blueprint: Putting Content Architecture to Work',
    hookClosure:
      'The frameworks we broke down are not theoretical. They represent the exact operational playbook needed to execute modern content QA with total confidence.',
    body:
      'Speed of implementation matters just as much as strategy. The marketing teams seeing 3x improvements are those that audit baseline bottlenecks, standardize team guardrails, and track leading indicators weekly.\n\nAvoid analysis paralysis. Begin with a structured audit of your highest-priority landing pages before scaling across your CMS.',
    ctaPrompt:
      'To make rollout effortless, download our 12-point pre-flight checklist containing all formulas, benchmarks, and QA rules covered in this guide.',
    ctaButton: 'Download the Pre-Flight QA Checklist',
    anatomyAnnotations: [
      {
        layer: 'Layer 1: Specific H2 Headline',
        tag: 'Blueprint H2',
        text: 'Signals direct operational utility and immediate implementation value.',
        color: 'border-amber-300 bg-amber-50 text-amber-800',
        badgeColor: 'bg-amber-500 text-white',
      },
      {
        layer: 'Layer 2: Intro Loop Closure',
        tag: 'Practical Proof',
        text: 'Validates that the questions raised in the intro now have concrete operational answers.',
        color: 'border-orange-300 bg-orange-50 text-orange-800',
        badgeColor: 'bg-orange-600 text-white',
      },
      {
        layer: 'Layer 3: Value Synthesis Anchor',
        tag: 'Decision Criteria',
        text: 'Highlights implementation trade-offs and guides the reader toward systematic action.',
        color: 'border-purple-300 bg-purple-50 text-purple-800',
        badgeColor: 'bg-purple-600 text-white',
      },
      {
        layer: 'Layer 4: High-Value Lead Magnet CTA',
        tag: 'Asset Download',
        text: 'Bridges directly into a tangible resource download (checklist, template, audit sheet).',
        color: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        badgeColor: 'bg-emerald-600 text-white',
      },
    ],
  },
  {
    id: 'bofu',
    stageLabel: 'BOFU (Decision & ROI)',
    targetIntent: 'Definitive ROI verdict, cost of delay, direct consultation or trial trigger',
    h2Title: "The Bottom Line: Don't Let Inaction Delay Your Organic Pipeline",
    hookClosure:
      'Every month your team delays modernizing your content operations, the compounding cost of inaction quietly drains budget.',
    body:
      'You now have the exact methodology required to eliminate operational drag, outpace competitors, and unlock measurable pipeline from search. The only remaining decision is whether to spend quarters piecing together manual audits or leverage verified infrastructure from day one.\n\nIndustry leaders choose momentum. With automated QA guardrails supporting your workflow, your team can begin seeing validated impact in as little as 14 days.',
    ctaPrompt:
      'Ready to see how much faster your team can ship rank-ready copy? Book a 20-minute workflow teardown with our senior strategists.',
    ctaButton: 'Book Your Free Strategy Teardown',
    anatomyAnnotations: [
      {
        layer: 'Layer 1: Specific H2 Headline',
        tag: 'ROI Verdict H2',
        text: 'Focuses on the bottom-line economic reality and executive urgency.',
        color: 'border-rose-300 bg-rose-50 text-rose-800',
        badgeColor: 'bg-rose-500 text-white',
      },
      {
        layer: 'Layer 2: Intro Loop Closure',
        tag: 'Cost of Delay',
        text: 'Connects the initial bottleneck directly to commercial revenue loss.',
        color: 'border-red-300 bg-red-50 text-red-800',
        badgeColor: 'bg-red-600 text-white',
      },
      {
        layer: 'Layer 3: Value Synthesis Anchor',
        tag: 'Executive Choice',
        text: 'Contrasts the drag of manual processes against the speed of proven infrastructure.',
        color: 'border-indigo-300 bg-indigo-50 text-indigo-800',
        badgeColor: 'bg-indigo-600 text-white',
      },
      {
        layer: 'Layer 4: High-Intent Direct CTA',
        tag: 'Demo or Trial',
        text: 'Direct, low-friction invitation for high-intent decision makers ready to buy.',
        color: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        badgeColor: 'bg-emerald-600 text-white',
      },
    ],
  },
]

export default function LandingConclusionAnatomy() {
  const [activeStageId, setActiveStageId] = useState('bofu')
  const [activeHighlightLayer, setActiveHighlightLayer] = useState(null)
  const [copied, setCopied] = useState(false)
  const headerRef = useScrollReveal()
  const contentRef = useScrollReveal({ threshold: 0.1 })

  const currentStage = ANATOMY_STAGES.find((s) => s.id === activeStageId) || ANATOMY_STAGES[0]

  const handleCopy = async () => {
    try {
      const fullText = `## ${currentStage.h2Title}\n\n${currentStage.hookClosure}\n\n${currentStage.body}\n\n**Next Action:** ${currentStage.ctaPrompt}\n\n[${currentStage.ctaButton}]`
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/70 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-r from-blue-100/30 via-indigo-100/20 to-pink-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-indigo-700 mb-3">
            <Layers className="w-3.5 h-3.5" />
            Structural Blueprint
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3 sm:mb-4">
            Anatomy of a{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              10/10 High-Converting Conclusion
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            A high-converting conclusion is not a summary. It is an intentional 4-layer architecture engineered to satisfy Google's E-E-A-T signals and transition lingering readers into measurable commercial pipeline.
          </p>
        </div>

        {/* Funnel Stage Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {ANATOMY_STAGES.map((s) => {
            const isSelected = activeStageId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveStageId(s.id)
                  setActiveHighlightLayer(null)
                }}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-white hover:border-slate-300 border border-slate-200'
                }`}
              >
                <span>{s.stageLabel}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            )
          })}
        </div>

        {/* Main 2-Column Teardown Card */}
        <div ref={contentRef} className="lp-reveal grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Annotated Conclusion Output Card */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-7 shadow-lg shadow-slate-200/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0C81F3]" />
                Live Annotated Conclusion
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Full Output!' : 'Copy Markdown'}</span>
              </button>
            </div>

            {/* Layer 1: H2 Headline */}
            <div
              onMouseEnter={() => setActiveHighlightLayer(0)}
              onMouseLeave={() => setActiveHighlightLayer(null)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeHighlightLayer === 0
                  ? 'bg-sky-50 border-sky-400 shadow-sm ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                  Layer 1: Specific H2 Headline
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Zero Generic Clichés</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                ## {currentStage.h2Title}
              </h3>
            </div>

            {/* Layer 2: Loop Closure */}
            <div
              onMouseEnter={() => setActiveHighlightLayer(1)}
              onMouseLeave={() => setActiveHighlightLayer(null)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeHighlightLayer === 1
                  ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Layer 2: Intro Loop Closure
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Resolves Curiosity Gap</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                {currentStage.hookClosure}
              </p>
            </div>

            {/* Layer 3: Value Synthesis */}
            <div
              onMouseEnter={() => setActiveHighlightLayer(2)}
              onMouseLeave={() => setActiveHighlightLayer(null)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeHighlightLayer === 2
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-2 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Layer 3: Value Synthesis Anchor
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Zero Generic Summaries</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                {currentStage.body}
              </p>
            </div>

            {/* Layer 4: Contextual CTA Bridge */}
            <div
              onMouseEnter={() => setActiveHighlightLayer(3)}
              onMouseLeave={() => setActiveHighlightLayer(null)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeHighlightLayer === 3
                  ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Layer 4: Contextual CTA Bridge
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Action-Oriented</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium mb-3">
                <span className="font-bold text-slate-900">Next Action: </span>
                {currentStage.ctaPrompt}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-sm">
                <span>{currentStage.ctaButton}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Layer Teardown Explanations */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-[#0C81F3]" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Target Stage Intent
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {currentStage.targetIntent}
              </p>
            </div>

            {currentStage.anatomyAnnotations.map((ann, idx) => {
              const isHovered = activeHighlightLayer === idx
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveHighlightLayer(idx)}
                  onMouseLeave={() => setActiveHighlightLayer(null)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? `${ann.color} shadow-md scale-[1.02]`
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${ann.badgeColor}`}>
                        {idx + 1}
                      </span>
                      <span>{ann.layer}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {ann.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed font-normal">
                    {ann.text}
                  </p>
                </div>
              )
            })}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-slate-400" />
                Hover over any layer to inspect its role in reader retention.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
