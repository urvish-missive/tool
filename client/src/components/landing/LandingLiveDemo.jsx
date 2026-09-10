import { useEffect, useState, useRef } from 'react'
import { Sparkles, Zap, Copy, Check, ShieldCheck, Terminal, ArrowRight } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const TYPE_SPEED_MS = 22
const THINKING_MS = 800
const RESULT_HOLD_MS = 3800

/**
 * DemoFrame — animates a single example (typing → thinking → result).
 * Keyed by the parent so each new example remounts fresh.
 */
function DemoFrame({ example, accentIcon: AccentIcon, onComplete, onPhaseChange }) {
  const [phase, setPhase] = useState('typing')
  const [typedLength, setTypedLength] = useState(0)
  const [copied, setCopied] = useState(false)
  const timerRefs = useRef([])

  useEffect(() => {
    const input = example.input
    let i = 0
    setPhase('typing')
    setTypedLength(0)
    onPhaseChange?.({ phase: 'typing', label: 'Typing Prompt…' })

    const typeNext = () => {
      i += 1
      setTypedLength(i)
      if (i < input.length) {
        timerRefs.current.push(setTimeout(typeNext, TYPE_SPEED_MS))
      } else {
        timerRefs.current.push(
          setTimeout(() => {
            setPhase('thinking')
            onPhaseChange?.({ phase: 'thinking', label: 'Auditing 12 QA Pillars…' })
            timerRefs.current.push(
              setTimeout(() => {
                setPhase('result')
                onPhaseChange?.({ phase: 'result', label: 'Verified Output' })
                timerRefs.current.push(setTimeout(onComplete, RESULT_HOLD_MS))
              }, THINKING_MS)
            )
          }, 250)
        )
      }
    }

    timerRefs.current.push(setTimeout(typeNext, TYPE_SPEED_MS))

    return () => {
      timerRefs.current.forEach((t) => clearTimeout(t))
      timerRefs.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [example])

  const handleCopy = async () => {
    try {
      const textToCopy = typeof example.outputBody === 'string'
        ? example.outputBody.replace(/^"|"$/g, '')
        : String(example.outputBody)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="p-5 sm:p-7 min-h-[260px] sm:min-h-[280px] flex flex-col justify-between">
      <div className="space-y-4">
        {/* Input prompt row with terminal badge */}
        <div className="flex items-start gap-3">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold uppercase tracking-wider shrink-0 mt-0.5 shadow-xs">
            Prompt
          </span>
          <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed font-sans">
            {example.input.slice(0, typedLength)}
            {phase === 'typing' && <span className="lp-caret" />}
          </div>
        </div>

        {/* Thinking / Neural Reasoning indicator */}
        {phase === 'thinking' && (
          <div className="pl-0 sm:pl-11 py-2 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0C81F3] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#67A7FF] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#EB8988] animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs font-semibold text-slate-500 font-mono pl-1">
                Synthesizing hook &amp; checking 12-Pillar QA rules…
              </span>
            </div>
          </div>
        )}

        {/* Result card with copy button and metadata */}
        {phase === 'result' && (
          <div className="lp-drop pl-0 sm:pl-11">
            <div className="rounded-2xl bg-gradient-to-br from-white via-slate-50/80 to-blue-50/30 border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3 transition-all hover:border-[#0C81F3]/40">
              {/* Result Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <AccentIcon className="w-3.5 h-3.5 text-[#0C81F3]" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {example.outputTitle}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    0 Em Dashes
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:text-[#0C81F3]"
                    title="Copy generated output"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output Body */}
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                {example.outputBody}
              </p>

              {/* Output Metadata Tags */}
              {example.outputMeta?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {example.outputMeta.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-600 border border-slate-200/80 shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * LandingLiveDemo — Interactive "See It Think" AI Simulator section.
 * Types out sample prompts, shows a neural reasoning phase, and drops
 * in verified output cards following Missive Digital's 12-Pillar QA framework.
 */
export default function LandingLiveDemo({
  badge = 'See It Think',
  heading = 'Watch the AI Work in Real Time',
  subheading = '',
  examples = [],
  accentIcon = Sparkles,
}) {
  const sectionRef = useScrollReveal({ threshold: 0.2 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState({ phase: 'typing', label: 'Typing Prompt…' })

  if (examples.length === 0) return null
  const current = examples[activeIndex]

  const goTo = (index) => {
    setActiveIndex(index)
    setCurrentPhase({ phase: 'typing', label: 'Typing Prompt…' })
  }
  const advance = () => goTo((activeIndex + 1) % examples.length)

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-y border-slate-200/70 relative overflow-hidden">
      {/* Ambient background blur glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-100/40 via-purple-100/30 to-pink-100/30 rounded-full blur-3xl pointer-events-none" />

      <div ref={sectionRef} className="lp-reveal max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[10px] sm:text-xs font-bold rounded-full mb-3 tracking-wider uppercase shadow-md shadow-[#0C81F3]/20">
            <Zap className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 leading-tight">
            {heading}
          </h2>
          {subheading && (
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
              {subheading}
            </p>
          )}
        </div>

        {/* Interactive Example Selector Tabs */}
        {examples.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 overflow-x-auto no-scrollbar py-1">
            {examples.map((ex, i) => {
              const isSelected = i === activeIndex
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-slate-900 border border-[#0C81F3]/40 shadow-sm shadow-[#0C81F3]/10 -translate-y-0.5'
                      : 'bg-slate-100/80 hover:bg-white text-slate-600 border border-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                      isSelected ? 'bg-[#0C81F3] animate-pulse' : 'bg-slate-300 group-hover:bg-slate-400'
                    }`}
                  />
                  <span>{ex.label || `Scenario 0${i + 1}`}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Terminal-Style Canvas Window */}
        <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/40 overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/90">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400/90 border border-rose-500/20 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/90 border border-amber-500/20 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/90 border border-emerald-500/20 inline-block" />
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 text-[11px] font-mono font-bold text-slate-500">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span>Himani's SEO Engine • Real-Time AI Simulator</span>
              </span>
            </div>

            {/* Live Phase Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                  currentPhase.phase === 'typing'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : currentPhase.phase === 'thinking'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentPhase.phase === 'typing'
                      ? 'bg-[#0C81F3] animate-ping'
                      : currentPhase.phase === 'thinking'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />
                <span>{currentPhase.label}</span>
              </span>
            </div>
          </div>

          {/* Active Demo Execution Frame */}
          <DemoFrame
            key={activeIndex}
            example={current}
            accentIcon={accentIcon}
            onComplete={advance}
            onPhaseChange={setCurrentPhase}
          />

          {/* Bottom Interactive Pagination Bar */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-400">
            <span className="font-mono text-[11px] font-medium">
              Interactive Scenario {activeIndex + 1} of {examples.length}
            </span>

            <div className="flex items-center gap-1.5">
              {examples.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Jump to example ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeIndex
                      ? 'w-6 bg-[#0C81F3]'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={advance}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#0C81F3] transition-colors cursor-pointer"
            >
              <span>Next Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
