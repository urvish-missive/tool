import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle2, Loader2, Zap } from 'lucide-react'

/**
 * UnifiedToolLoader — Universal premium AI loading screen for all tools.
 * Supports automated timer-based step progression or explicit step indices.
 *
 * @param {string} title - Main loading title (e.g. "Auditing Website & Technical SEO...")
 * @param {string} [subtitle] - Contextual subtitle (e.g. "Extracting meta tags, schema markup and performance signals")
 * @param {Array<string>} [steps] - Array of step descriptions
 * @param {number} [currentStepIdx] - Optional controlled step index (0-based)
 * @param {number} [stepIntervalMs=2200] - Interval between automatic step advances
 */
export default function UnifiedToolLoader({
  title = 'AI Analysis in Progress...',
  subtitle = 'Processing live data and generating actionable SEO intelligence.',
  steps = [
    'Initializing AI neural processing engine',
    'Auditing semantic structure & entity mappings',
    'Analyzing search intent & ranking signals',
    'Synthesizing tailored recommendations',
    'Assembling executive report & deliverables',
  ],
  currentStepIdx,
  stepIntervalMs = 2400,
}) {
  const [internalIdx, setInternalIdx] = useState(0)

  useEffect(() => {
    if (typeof currentStepIdx === 'number') return
    setInternalIdx(0)
    const interval = setInterval(() => {
      setInternalIdx((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, stepIntervalMs)
    return () => clearInterval(interval)
  }, [currentStepIdx, steps.length, stepIntervalMs])

  const activeIdx = typeof currentStepIdx === 'number' ? currentStepIdx : internalIdx
  const progressPercent = Math.min(Math.round(((activeIdx + 1) / steps.length) * 100), 96)

  return (
    <div className="relative max-w-xl mx-auto my-8 px-4">
      {/* Ambient decorative glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] rounded-3xl blur-xl opacity-20 animate-pulse pointer-events-none" />

      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Animated Central Glowing Icon */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] opacity-20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] p-0.5 shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#0C81F3] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0C81F3] animate-ping shrink-0" />
            Live AI Generation
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Real-time Progress Bar */}
        <div className="space-y-1.5 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#0C81F3]" />
              Processing
            </span>
            <span className="text-[#0C81F3] font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Interactive Checklist */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-left space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < activeIdx
            const isActive = idx === activeIdx
            const isPending = idx > activeIdx

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-slate-900 font-bold bg-white p-2 rounded-lg shadow-sm border border-slate-200/80'
                    : isDone
                    ? 'text-slate-500 font-medium px-2 py-1'
                    : 'text-slate-400 px-2 py-1'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-[#0C81F3] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={`truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                  {step}
                </span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-[#0C81F3] px-2 py-0.5 rounded-full shrink-0">
                    Running
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          ⚡ Synthesizing verified data from search signals & entity models.
        </p>
      </div>
    </div>
  )
}
