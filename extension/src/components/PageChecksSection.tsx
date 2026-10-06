import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import type { PageCheck } from '../services/pageChecks'

const ICONS = {
  pass: { icon: CheckCircle2, className: 'text-emerald-500', label: 'Pass' },
  warning: { icon: TriangleAlert, className: 'text-amber-500', label: 'Warning' },
  fail: { icon: XCircle, className: 'text-rose-500', label: 'Fail' },
  info: { icon: Info, className: 'text-slate-400', label: 'Info' },
} as const

export default function PageChecksSection({ checks }: { checks: PageCheck[] }) {
  const groups = Array.from(new Set(checks.map((c) => c.group)))
  const issues = checks.filter((c) => c.status === 'fail' || c.status === 'warning').length

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-900">On-page SEO checks</p>
        <span className="text-xs text-slate-500">{issues ? `${issues} to review` : 'All clear'}</span>
      </div>
      <p className="text-xs text-slate-500">Read from the live page, instantly. Does not use an analysis.</p>

      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group}</p>
            <ul className="mt-1 space-y-1.5">
              {checks
                .filter((c) => c.group === group)
                .map((c) => {
                  const meta = ICONS[c.status]
                  const Icon = meta.icon
                  return (
                    <li key={c.id} className="flex gap-2 text-xs">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} aria-label={meta.label} />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800">{c.label}</span>
                        <p className="break-words text-slate-500">{c.detail}</p>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
