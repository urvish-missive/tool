import { useState, useEffect, useMemo, useRef } from 'react'
import useScrollReveal from './useScrollReveal'

function parseCountable(value) {
  const match = String(value).match(/^(\d[\d,]*)(\+|%)?$/)
  if (!match) return null
  return {
    target: parseInt(match[1].replace(/,/g, ''), 10),
    suffix: match[2] || '',
  }
}

const ACCENTS = [
  'from-[#67A7FF] to-[#0C81F3]',
  'from-[#F7B7B3] to-[#EB8988]',
  'from-[#A7E3C2] to-[#4B9F77]',
  'from-[#FCD36B] to-[#F59E0B]',
]

function StatCell({ value, label, accent }) {
  const [count, setCount] = useState(0)
  const cellRef = useRef(null)
  const parsed = useMemo(() => parseCountable(value), [value])

  useEffect(() => {
    if (!parsed) return
    const el = cellRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const duration = 1400
        const start = performance.now()
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(parsed.target * eased))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.unobserve(el)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [parsed])

  return (
    <div ref={cellRef} className="lp-reveal-child text-center px-2">
      <div className="relative inline-block pb-2">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
          {parsed ? `${count.toLocaleString()}${parsed.suffix}` : value}
        </span>
        <span
          className={`block mt-1 mx-auto h-0.5 w-8 rounded-full bg-gradient-to-r ${accent}`}
        />
      </div>
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug max-w-[170px] mx-auto">
        {label}
      </p>
    </div>
  )
}

/**
 * LandingStats — key statistics row for social proof.
 */
export default function LandingStats({ stats = [] }) {
  const ref = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-[#F9F7F6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="lp-reveal lp-stagger grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
          {stats.map((s, i) => (
            <StatCell
              key={i}
              value={`${s.value}${s.suffix || ''}`}
              label={s.label}
              accent={ACCENTS[i % ACCENTS.length]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}