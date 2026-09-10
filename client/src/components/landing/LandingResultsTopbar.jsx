import { ArrowLeft } from 'lucide-react'

/**
 * LandingResultsTopbar
 *
 * Sleek, glassmorphic sticky sub-navigation bar rendered when an embedded
 * AI tool finishes generation and switches to results mode.
 *
 * Features:
 * - Sticky below the 80px fixed header (`top-20 z-40`)
 * - Ambient gradient accent hairline
 * - Modern hover-animated back button (no duplicate raw arrows)
 * - Agency-grade dark status capsule with live radar pulse indicator
 */
export default function LandingResultsTopbar({
  onBack,
  backLabel = 'New Topic Search',
  backHint = 'Start Over',
  title = 'Topic Silo & Editorial Blueprint',
  badge = 'Live Blueprint',
  maxWidth = 'max-w-7xl',
}) {
  return (
    <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all">
      {/* Top brand gradient accent hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] opacity-80" />

      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4`}>
        {/* Left: Back / New Search Action */}
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0C81F3] border border-slate-200 hover:border-[#0C81F3]/40 shadow-xs hover:shadow transition-all duration-200 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0C81F3] transition-transform duration-200 group-hover:-translate-x-1 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0C81F3] transition-colors">
            {backLabel}
          </span>
          {backHint && (
            <span className="hidden md:inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
              {backHint}
            </span>
          )}
        </button>

        {/* Right: Active Live Workspace Capsule */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
            {title}
          </span>
          {badge && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-slate-300 uppercase tracking-wider shrink-0">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
