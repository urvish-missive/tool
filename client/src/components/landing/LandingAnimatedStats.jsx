import { useState, useEffect, useRef } from 'react'
import useScrollReveal from './useScrollReveal'

function parseStatValue(value) {
  const match = String(value).match(/^(\d[\d,]*)(\+|%)?$/)
  if (!match) return { target: null, suffix: '' }
  return { target: parseInt(match[1].replace(/,/g, ''), 10), suffix: match[2] || '' }
}

function AnimatedStatCard({ icon: Icon, value, label }) {
  const [count, setCount] = useState(0)
  const counterRef = useRef(null)
  const { target, suffix } = parseStatValue(value)

  useEffect(() => {
    if (target === null) return
    const el = counterRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const duration = 1300
        const start = performance.now()
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(target * eased))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.unobserve(el)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={counterRef} className="lp-reveal-child group relative text-center px-6 py-9 sm:py-10">
      <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0C81F3] to-[#EB8988] text-white mb-4 shadow-lg shadow-[#0C81F3]/25 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
        <span className="absolute inset-0 rounded-2xl bg-[#0C81F3]/40 animate-ping opacity-0 group-hover:opacity-40" />
        <Icon className="relative w-6 h-6" />
      </div>
      <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
        {target === null ? value : `${count.toLocaleString()}${suffix}`}
      </div>
      <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium max-w-[180px] mx-auto">{label}</div>
    </div>
  )
}

/**
 * LandingAnimatedStats — shared bordered/divided stat-card grid with count-up
 * numbers, used across every tool page's "trust" section. Optional header
 * (sectionLabel/heading/subheading) matches the other Landing* sections.
 */
export default function LandingAnimatedStats({ sectionLabel, heading, subheading, stats = [] }) {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[#F9F7F6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
            {sectionLabel && (
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                  {sectionLabel}
                </span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
                {subheading}
              </p>
            )}
          </div>
        )}

        <div
          ref={gridRef}
          className="lp-reveal lp-stagger relative rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988]" />
          {stats.map((item) => (
            <AnimatedStatCard key={item.label} icon={item.icon} value={item.value} label={item.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
