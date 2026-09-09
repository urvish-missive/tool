import { useState } from 'react'
import { Compass, ArrowRight, Clock, FileText, Copy, Check, Zap } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const FRAMEWORKS = [
  // TOFU
  {
    id: 'tofu-1',
    stage: 'tofu',
    stageLabel: 'TOFU (Awareness)',
    title: 'The Perspective Shift & Open Loop Closer',
    intent:
      'Synthesizes high-level value into an inspiring takeaway while strictly avoiding generic conclusion clichés.',
    psychology: 'Transforms reader curiosity into foundational clarity.',
    h2: 'The Verdict: Turning Strategy Into Your Lasting Moat',
    sample:
      'Remember the question we started with? Mastering this domain is not about chasing every superficial hack. It is about locking in the underlying fundamentals that compound quarter over quarter.\n\nThe difference between teams that stall and those that lead is deliberate consistency in execution.',
    ctaPrompt:
      'Choose one high-impact principle from this guide and put it into practice with your team this week.',
    ctaButton: 'Explore More Growth Insights',
    words: 115,
    seconds: 30,
    metric: '+38% Dwell Time',
  },
  {
    id: 'tofu-2',
    stage: 'tofu',
    stageLabel: 'TOFU (Awareness)',
    title: 'The Big-Picture Horizon & Low-Friction Step',
    intent:
      'Opens a forward-looking horizon and invites ongoing low-friction newsletter or community engagement.',
    psychology: 'Validates organizational inflection points.',
    h2: 'Where Does Your Growth Strategy Go From Here?',
    sample:
      'The operational friction we highlighted in the opening is not unique to your team. It is the natural inflection point every scaling organization encounters.\n\nTake a step back, audit your baseline, and commit to one systemic upgrade this quarter.',
    ctaPrompt: 'Join our weekly executive briefing for teardowns of modern content architecture.',
    ctaButton: 'Subscribe to Weekly Strategy Memo',
    words: 108,
    seconds: 28,
    metric: '2.4x Newsletter Signups',
  },
  {
    id: 'tofu-3',
    stage: 'tofu',
    stageLabel: 'TOFU (Awareness)',
    title: 'The Contrarian Challenge & Next Horizon',
    intent: 'Uses pattern-interrupt psychology to challenge standard industry assumptions.',
    psychology: 'Dismantles conventional shortcuts.',
    h2: 'The Unspoken Reality of Organic Scale in 2026',
    sample:
      'The legacy playbook is broken, but that creates an unprecedented window of opportunity for teams willing to build with depth.\n\nMost competitors will continue relying on generic AI shortcuts. By investing in authoritative execution, your brand creates an unassailable moat.',
    ctaPrompt: 'Read our companion deep dive on advanced content architecture next.',
    ctaButton: 'Read Next: Advanced Architecture Guide',
    words: 122,
    seconds: 32,
    metric: '55% Next-Post CTR',
  },
  // MOFU
  {
    id: 'mofu-1',
    stage: 'mofu',
    stageLabel: 'MOFU (Consideration)',
    title: 'The Execution Blueprint & Resource Download',
    intent:
      'Transitions smoothly from strategy into immediate tactical rollout with an asset download.',
    psychology: 'Satisfies implementation desire.',
    h2: 'Your Implementation Blueprint: Putting Insight to Work',
    sample:
      'The concepts we broke down are not theoretical. They represent the exact playbook needed to execute with confidence.\n\nAs you evaluate next steps, remember that speed of rollout matters just as much as strategy. Start with a structured audit of your highest-priority landing pages before scaling across your CMS.',
    ctaPrompt:
      'Download our 12-point pre-flight checklist containing all frameworks, formulas, and QA rules covered in this guide.',
    ctaButton: 'Download the Pre-Flight QA Checklist',
    words: 130,
    seconds: 35,
    metric: '34% Lead Magnet Opt-Ins',
  },
  {
    id: 'mofu-2',
    stage: 'mofu',
    stageLabel: 'MOFU (Consideration)',
    title: 'The Comparison Verdict & Decision Matrix',
    intent:
      'Helps consideration-stage buyers evaluate operational trade-offs and structure rollout phases.',
    psychology: 'Eliminates analysis paralysis.',
    h2: 'The 3-Part Decision Framework for Scaling Safely',
    sample:
      'Choosing how to modernize comes down to balancing internal bandwidth against time-to-value.\n\nYou do not need to overhaul everything overnight. Prioritize your roadmap into quick wins in weeks 1 to 2, architectural stabilization in month 1, and automated scale in month 2.',
    ctaPrompt:
      'Use our free Decision Matrix template to score your team readiness across each stage.',
    ctaButton: 'Get the Free Decision Matrix Template',
    words: 125,
    seconds: 33,
    metric: '+48% Stakeholder Alignment',
  },
  {
    id: 'mofu-3',
    stage: 'mofu',
    stageLabel: 'MOFU (Consideration)',
    title: 'The Common Pitfall Warning & Action Step',
    intent: 'Capitalizes on loss-aversion psychology by highlighting preventable, costly mistakes.',
    psychology: 'Loss-aversion protection trigger.',
    h2: 'The Most Expensive Trap in Modern SEO (And How to Avoid It)',
    sample:
      'The biggest risk is not trying a new methodology. It is repeating invisible mistakes that silently drain crawl budget and reader trust.\n\nBy benchmarking your process against verified QA standards early, you bypass costly course corrections.',
    ctaPrompt:
      'Audit your existing posts against our compliance checklist before launching new campaigns.',
    ctaButton: 'Download the Verification Checklist',
    words: 118,
    seconds: 31,
    metric: '41% Audit Downloads',
  },
  // BOFU
  {
    id: 'bofu-1',
    stage: 'bofu',
    stageLabel: 'BOFU (Decision & ROI)',
    title: 'The Definitive ROI Verdict & Free Trial',
    intent:
      'Builds sharp urgency around the cost of delay and positions the trial as the logical next step.',
    psychology: 'Urgency through compounding cost of delay.',
    h2: "The Bottom Line: Don't Let Inaction Delay Your Pipeline",
    sample:
      'Every month your team delays modernizing, the compounding cost of inaction quietly increases.\n\nYou now have the exact methodology required to eliminate drag and unlock measurable pipeline. The only remaining decision is whether to spend months on manual audits or leverage proven infrastructure from day one.',
    ctaPrompt:
      'Ready to see how much faster your team can execute? Start your trial today with zero commitments.',
    ctaButton: 'Start Your 14-Day Free Trial',
    words: 135,
    seconds: 36,
    metric: '+42% Trial Activations',
  },
  {
    id: 'bofu-2',
    stage: 'bofu',
    stageLabel: 'BOFU (Decision & ROI)',
    title: 'The Cost of Inaction & Demo Booking',
    intent: 'Directly addresses executive decision makers with bottom-line economic arguments.',
    psychology: 'Executive ROI and pipeline protection.',
    h2: 'The Cost of Inaction: Why Now Is the Time to Modernize',
    sample:
      'While competitors scramble to adapt to shifting search landscapes, you have a direct path to capture disproportionate market share.\n\nManual execution does not scale. High-growth teams invest in purpose-built tooling to achieve predictable growth without inflating headcount.',
    ctaPrompt:
      'Book a 20-minute 1-on-1 strategy session with our senior engineers to map your tailored rollout.',
    ctaButton: 'Book Your Custom Strategy Call',
    words: 128,
    seconds: 34,
    metric: '3.2x Demo Conversion',
  },
  {
    id: 'bofu-3',
    stage: 'bofu',
    stageLabel: 'BOFU (Decision & ROI)',
    title: 'The Fast-Track Implementation Pitch',
    intent: 'Focuses on immediate speed-to-value and eliminates friction for direct conversions.',
    psychology: 'Speed-to-value conviction.',
    h2: 'Your Next Move: Accelerate Your Organic Results Today',
    sample:
      'The roadmap is clear, the benchmarks are proven, and the infrastructure is ready when you are.\n\nStop letting operational bottlenecks dictate your team growth ceiling. Join hundreds of high-performing teams that have turned content QA into an automated advantage.',
    ctaPrompt:
      'Launch your first audit in under two minutes with full access to all enterprise features.',
    ctaButton: 'Claim Your Free Account & Launch',
    words: 120,
    seconds: 32,
    metric: '49% Self-Serve Signups',
  },
]

export default function LandingFrameworksGallery({ onTryTool }) {
  const [activeStageFilter, setActiveStageFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const headerRef = useScrollReveal()
  const galleryRef = useScrollReveal({ threshold: 0.08 })

  const filtered =
    activeStageFilter === 'all'
      ? FRAMEWORKS
      : FRAMEWORKS.filter((f) => f.stage === activeStageFilter)

  const handleCopy = async (fw) => {
    try {
      const fullText = `## ${fw.h2}\n\n${fw.sample}\n\n**Next Action:** ${fw.ctaPrompt}\n\n[${fw.ctaButton}]`
      await navigator.clipboard.writeText(fullText)
      setCopiedId(fw.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/70 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-3">
            <Compass className="w-3.5 h-3.5" />
            Strategic Taxonomy
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3 sm:mb-4">
            12 Validated{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Conclusion Frameworks
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Different readers require different psychological endings. Choose between awareness
            mindset shifts, consideration blueprints, or high-intent ROI verdicts.
          </p>
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {[
            { id: 'all', label: 'All Frameworks (12)' },
            { id: 'tofu', label: 'TOFU Awareness (4)' },
            { id: 'mofu', label: 'MOFU Consideration (4)' },
            { id: 'bofu', label: 'BOFU Decision & ROI (4)' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveStageFilter(btn.id)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeStageFilter === btn.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-white hover:border-slate-300 border border-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Framework Cards Grid */}
        <div
          ref={galleryRef}
          className="lp-reveal lp-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filtered.map((fw) => {
            const isCopied = copiedId === fw.id
            const stageColor =
              fw.stage === 'tofu'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : fw.stage === 'mofu'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'

            return (
              <div
                key={fw.id}
                className="lp-reveal-child rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xl hover:border-[#0C81F3]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Stage and metric badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stageColor}`}
                    >
                      {fw.stageLabel}
                    </span>
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {fw.metric}
                    </span>
                  </div>

                  {/* Title & Psychological Intent */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#0C81F3] transition-colors mb-1">
                      {fw.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {fw.intent}
                    </p>
                  </div>

                  {/* H2 Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Generated H2 Headline:
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">## {fw.h2}</p>
                  </div>

                  {/* Sample Snippet */}
                  <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-serif">
                    "{fw.sample}"
                  </div>

                  {/* CTA Prompt */}
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">CTA Bridge: </span>
                    {fw.ctaPrompt}
                  </div>
                </div>

                {/* Card Footer: Metadata & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {fw.words} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {fw.seconds}s read
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(fw)}
                    className="text-xs font-bold text-[#0C81F3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Try Tool Callout */}
        {onTryTool && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={onTryTool}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-black text-white px-7 py-3 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#EB8988]" />
              <span>Generate Conclusions Using These Frameworks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
