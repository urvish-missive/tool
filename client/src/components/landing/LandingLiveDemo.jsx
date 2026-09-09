import { useEffect, useState } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const TYPE_SPEED_MS = 28
const THINKING_MS = 850
const RESULT_HOLD_MS = 3400

/**
 * DemoFrame — animates a single example (typing → thinking → result).
 * Keyed by the parent so each new example remounts fresh, avoiding
 * a setState-on-deps-change effect in favor of natural initial state.
 */
function DemoFrame({ example, accentIcon: AccentIcon, onComplete, onPhaseChange }) {
  const [phase, setPhase] = useState('typing')
  const [typedLength, setTypedLength] = useState(0)

  useEffect(() => {
    const input = example.input
    const pending = []
    let i = 0
    const typeNext = () => {
      i += 1
      setTypedLength(i)
      if (i < input.length) {
        pending.push(setTimeout(typeNext, TYPE_SPEED_MS))
      } else {
        pending.push(
          setTimeout(() => {
            setPhase('thinking')
            onPhaseChange?.('Generating…')
            pending.push(
              setTimeout(() => {
                setPhase('result')
                onPhaseChange?.('Done')
                pending.push(setTimeout(onComplete, RESULT_HOLD_MS))
              }, THINKING_MS)
            )
          }, 300)
        )
      }
    }
    pending.push(setTimeout(typeNext, TYPE_SPEED_MS))

    return () => pending.forEach((t) => clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-5 sm:p-7 min-h-[220px] sm:min-h-[240px]">
      {/* Input row (typewriter) */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
          In
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
          {example.input.slice(0, typedLength)}
          {phase === 'typing' && <span className="lp-caret text-[#0C81F3]" />}
        </p>
      </div>

      {/* Thinking indicator */}
      {phase === 'thinking' && (
        <div className="flex items-center gap-2 pl-9 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3] animate-bounce" style={{ animationDelay: '120ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3] animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
      )}

      {/* Result card */}
      {phase === 'result' && (
        <div className="lp-drop pl-0 sm:pl-9">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/60 to-rose-50/40 border border-slate-200/70 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <AccentIcon className="w-4 h-4 text-[#0C81F3]" />
              <span className="text-xs font-bold text-slate-900">{example.outputTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{example.outputBody}</p>
            {example.outputMeta?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {example.outputMeta.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200"
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
  )
}

/**
 * LandingLiveDemo — reusable animated "watch the AI think" section.
 * Types out a sample input, shows a thinking state, then reveals a
 * generated output card. Cycles through `examples` automatically.
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
  const [phaseLabel, setPhaseLabel] = useState('Typing…')

  if (examples.length === 0) return null
  const current = examples[activeIndex]

  const goTo = (index) => {
    setActiveIndex(index)
    setPhaseLabel('Typing…')
  }
  const advance = () => goTo((activeIndex + 1) % examples.length)

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-y border-slate-200/60 overflow-hidden">
      <div ref={sectionRef} className="lp-reveal max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-300/30 overflow-hidden">
          {/* Terminal-style top bar */}
          <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              {current.label || 'Live Preview'}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {phaseLabel}
            </span>
          </div>

          <DemoFrame
            key={activeIndex}
            example={current}
            accentIcon={accentIcon}
            onComplete={advance}
            onPhaseChange={setPhaseLabel}
          />

          {/* Dot indicators */}
          {examples.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pb-4 sm:pb-5">
              {examples.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show example ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'w-6 bg-[#0C81F3]' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
