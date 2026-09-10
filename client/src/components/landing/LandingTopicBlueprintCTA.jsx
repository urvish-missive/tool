import { Layers, ArrowRight, Sparkles, FolderTree, Target, FileText } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

/**
 * LandingTopicBlueprintCTA — bespoke, architectural blueprint final CTA card
 * for Blog Topic & Silo Generator ("Stop Guessing What to Write Next").
 */
export default function LandingTopicBlueprintCTA({ onCta }) {
  const ref = useScrollReveal({ threshold: 0.15 })

  return (
    <section className="py-20 sm:py-28 bg-[#F9F7F6]/60 border-t border-slate-200/60">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="lp-reveal relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#0B1528] via-[#0F1E36] to-[#17122B] p-7 sm:p-12 lg:p-16 text-center border border-slate-800 shadow-[0_24px_60px_rgba(11,21,40,0.35)]"
        >
          {/* Ambient Blueprint Glows */}
          <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-gradient-to-bl from-[#0C81F3]/25 via-[#67A7FF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-tr from-[#EB8988]/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Architectural Coordinate Grid Overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), radial-gradient(rgba(103,167,255,0.5) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              backgroundPosition: '0 0, 14px 14px',
            }}
          />

          {/* Center Blueprint Accent Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full border border-blue-500/[0.04] pointer-events-none" />

          {/* Distinctive Tilted Blueprint Seal */}
          <div className="relative z-10 flex justify-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-blue-200 border border-blue-400/40 bg-blue-950/70 rounded-xl px-4 py-2 rotate-[-2.5deg] shadow-lg shadow-blue-500/10 backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-[#67A7FF]" />
              TOPICAL SILO BLUEPRINT • ARCHITECT YOUR MOAT
            </span>
          </div>

          {/* Main Heading */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Stop Guessing What to Write Next
              <span className="block mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-r from-[#67A7FF] via-[#A7D2FF] to-[#F7B7B3] bg-clip-text text-transparent font-black">
                Architect a Content Moat That Actually Ranks
              </span>
            </h2>

            <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Turn a single niche keyword into 30+ interconnected pillar and cluster articles.
              Every topic scored by search intent, mapped across the buyer journey, and equipped
              with full master briefs.
            </p>
          </div>

          {/* 3-Column Architectural Specs Strip */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 max-w-4xl mx-auto my-8 sm:my-10 text-left">
            <div className="p-4 sm:p-4.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:border-[#67A7FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#67A7FF] flex items-center justify-center mb-2.5">
                <FolderTree className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                Pillar &amp; Cluster Silos
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Logical parent-child linking architecture that channels link equity to core pillars.
              </p>
            </div>

            <div className="p-4 sm:p-4.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:border-[#67A7FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-[#A7D2FF] flex items-center justify-center mb-2.5">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                Funnel-Mapped Intent
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Every topic prioritized across TOFU, MOFU, or BOFU search journeys to capture buyers.
              </p>
            </div>

            <div className="p-4 sm:p-4.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs hover:border-[#67A7FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-[#F7B7B3] flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                1-Click Master Briefs
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Complete outlines, target keyword angles, and H2/H3 structures ready for execution.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#0C81F3] via-[#4698F5] to-[#EB8988] text-white text-sm sm:text-base font-bold shadow-xl shadow-[#0C81F3]/25 hover:shadow-2xl hover:shadow-[#0C81F3]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>Generate My Topic Blueprint Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Reassurance Metrics */}
          <div className="relative z-10 mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Free Forever
            </span>
            <span className="text-slate-600">•</span>
            <span>Zero Sign-Up Required</span>
            <span className="text-slate-600">•</span>
            <span>Export Full Editorial Calendar</span>
          </div>
        </div>
      </div>
    </section>
  )
}
