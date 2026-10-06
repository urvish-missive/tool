import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

export type LoadingStep = 'extract' | 'metadata' | 'analyze' | 'recommend'

const STEPS: { id: LoadingStep; label: string }[] = [
  { id: 'extract', label: 'Extracting content' },
  { id: 'metadata', label: 'Checking metadata' },
  { id: 'analyze', label: 'Running Content QA + AI review' },
  { id: 'recommend', label: 'Generating recommendations' },
]

export default function LoadingState({ step }: { step: LoadingStep }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const activeIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-live="polite" aria-busy="true">
      <p className="text-sm font-semibold text-slate-900">Analyzing page…</p>
      <ol className="mt-3 space-y-2.5">
        {STEPS.map((s, i) => {
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <li key={s.id} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              ) : active ? (
                <span className="pulse-dot h-4 w-4 rounded-full border-4 border-brand bg-white" aria-hidden />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-slate-300" aria-hidden />
              )}
              <span className={done ? 'text-slate-600' : active ? 'font-medium text-slate-900' : 'text-slate-400'}>
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>
      {step === 'analyze' && elapsed >= 12 && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {elapsed}s · Long pages and a sleeping server can take up to a minute. You can keep browsing in this tab.
        </p>
      )}
    </section>
  )
}
