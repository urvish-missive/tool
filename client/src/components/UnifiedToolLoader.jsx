import { useState, useEffect, useRef } from 'react'
import { Sparkles, CheckCircle2, Loader2, Zap, Clock, Check } from 'lucide-react'

/**
 * UnifiedToolLoader — Universal premium AI loading screen for all tools.
 * Features ultra-smooth fluid progress animation, live elapsed timer, and adaptive step advancement.
 *
 * @param {string} title - Main loading title (e.g. "Auditing Website & Technical SEO...")
 * @param {string} [subtitle] - Contextual subtitle (e.g. "Extracting meta tags, schema markup and performance signals")
 * @param {Array<string>} [steps] - Array of step descriptions
 * @param {number} [currentStepIdx] - Optional controlled step index (0-based)
 * @param {number} [stepIntervalMs=1400] - Interval between automatic step advances
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
  stepIntervalMs = 1600,
  activeModel = null,
}) {
  const [internalIdx, setInternalIdx] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [displayModel, setDisplayModel] = useState(activeModel || 'GROQ: openai/gpt-oss-120b')
  const startTimeRef = useRef(Date.now())

  // Dynamic active model telemetry fetch
  useEffect(() => {
    if (activeModel) {
      setDisplayModel(activeModel)
      return
    }

    let isMounted = true
    fetch('/api/ai/active-model')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.activeModelDisplay) {
          setDisplayModel(data.activeModelDisplay)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [activeModel])

  // Step advancement timer
  useEffect(() => {
    startTimeRef.current = Date.now()
    if (typeof currentStepIdx === 'number') return

    setInternalIdx(0)
    const interval = setInterval(() => {
      setInternalIdx((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, stepIntervalMs)
    return () => clearInterval(interval)
  }, [currentStepIdx, steps.length, stepIntervalMs])

  // High-frequency elapsed timer for fluid progress bar & live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const activeIdx = typeof currentStepIdx === 'number' ? currentStepIdx : internalIdx

  // Calculate smooth continuous progress calibrated for ~9-10 seconds:
  const totalTargetMs = Math.max(9000, steps.length * stepIntervalMs)
  const stepTargetPercent = ((activeIdx + 1) / steps.length) * 94
  const timeProgress = Math.min(95, (elapsedMs / totalTargetMs) * 95)
  const fluidPercent = Math.min(98, Math.max(10, Math.round(Math.max(stepTargetPercent, timeProgress))))
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1)

  return (
    <div className="relative max-w-xl mx-auto my-8 px-4 animate-fade-in">
      {/* Ambient decorative glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] rounded-3xl blur-xl opacity-25 animate-pulse pointer-events-none" />

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {/* Animated Central Glowing Icon */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] opacity-25 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] p-0.5 shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#0C81F3] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title, Subtitle & Live Status Badges */}
        <div>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0C81F3] animate-ping shrink-0" />
              Live AI Processing
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-mono font-semibold">
              <Clock className="w-3 h-3 text-slate-500" />
              {elapsedSeconds}s
            </span>
          </div>

          {/* Temporary Active Model Debug Indicator */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs font-medium mb-3 max-w-full">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
              Temp Model Debug
            </span>
            <span className="font-mono text-xs text-amber-950 font-semibold">
              Running Model: <strong className="font-bold">{displayModel}</strong>
            </span>
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

        {/* Real-time Smooth Progress Bar */}
        <div className="space-y-1.5 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#0C81F3] animate-bounce" />
              <span>Optimizing Output</span>
            </span>
            <span className="text-[#0C81F3] font-mono">{fluidPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${fluidPercent}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Interactive Checklist */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = idx < activeIdx
            const isActive = idx === activeIdx

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-slate-900 font-bold bg-white p-2.5 rounded-xl shadow-xs border border-blue-200/80'
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
                {isDone && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600 px-1 shrink-0 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Synthesizing verified data from search signals & entity models.</span>
        </p>
      </div>
    </div>
  )
}
