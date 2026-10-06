import { CheckCircle2, ChevronDown, CircleHelp, MinusCircle, TriangleAlert, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { QaCategoryDef, QaReport } from '../types/analysis'
import { stripRuleCode } from '../utils/engineText'
import { clampScore, scoreBarClass, scoreTextClass } from '../utils/score'

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  pass: { icon: CheckCircle2, className: 'text-emerald-500', label: 'Pass' },
  warning: { icon: TriangleAlert, className: 'text-amber-500', label: 'Warning' },
  fail: { icon: XCircle, className: 'text-rose-500', label: 'Fail' },
  manual_review: { icon: CircleHelp, className: 'text-slate-400', label: 'Needs manual review' },
  not_verifiable: { icon: CircleHelp, className: 'text-slate-400', label: 'Could not verify automatically' },
  not_applicable: { icon: MinusCircle, className: 'text-slate-300', label: 'Not applicable' },
  pending: { icon: CircleHelp, className: 'text-slate-300', label: 'Not checked' },
}

function Pillar({ category, report }: { category: QaCategoryDef; report: QaReport }) {
  const [open, setOpen] = useState(false)
  const raw = report.categoryScores?.[category.id]
  const assessed = typeof raw === 'number'
  const score = clampScore(raw)
  const insight = report.ai?.categories?.[category.id]
  const panelId = `pillar-${category.id}`

  return (
    <li className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm text-slate-800">{category.label}</span>
            {assessed ? (
              <span className={`text-sm font-semibold ${scoreTextClass(score)}`}>{score}%</span>
            ) : (
              <span className="shrink-0 text-[11px] font-medium text-slate-400">Manual review</span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            {assessed && <div className={`h-full rounded-full ${scoreBarClass(score)}`} style={{ width: `${score}%` }} />}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className="space-y-3 px-3.5 pb-3.5">
          {insight?.verdict && <p className="text-xs leading-relaxed text-slate-600">{insight.verdict}</p>}

          <ul className="space-y-2">
            {category.items.map((item) => {
              const status = report.statuses?.[item.id] || 'pending'
              const meta = STATUS_ICON[status] ?? STATUS_ICON.pending
              const Icon = meta.icon
              const evidence = report.evidence?.[item.id]
              const suggestion = report.suggestions?.[item.id]
              return (
                <li key={item.id} className="flex gap-2">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} aria-label={meta.label} />
                  <div className="min-w-0 text-xs">
                    <p className="text-slate-800">{item.label}</p>
                    {evidence && <p className="mt-0.5 text-slate-500">{stripRuleCode(evidence)}</p>}
                    {suggestion && status !== 'pass' && <p className="mt-0.5 text-brand">→ {suggestion}</p>}
                  </div>
                </li>
              )
            })}
          </ul>

          {!!insight?.suggestions?.length && (
            <div className="rounded-lg bg-brand-soft/60 p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">AI suggestions</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-700">
                {insight.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function AnalysisSection({ report }: { report: QaReport }) {
  const categories = Object.values(report.categories || {}).sort((a, b) => a.number - b.number)
  if (!categories.length) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-3.5 pb-1 pt-3.5">
        <p className="text-sm font-semibold text-slate-900">Quality pillars</p>
        <p className="text-xs text-slate-500">Missive’s 12-pillar editorial checklist. Tap a pillar for details.</p>
        {typeof report.overallAssessmentCoverage === 'number' && report.overallAssessmentCoverage < 100 && (
          <p className="mt-1 text-[11px] text-slate-400">
            {report.overallAssessmentCoverage}% of checks could be assessed automatically; the rest need a human read.
          </p>
        )}
      </div>
      <ul>
        {categories.map((c) => (
          <Pillar key={c.id} category={c} report={report} />
        ))}
      </ul>
    </section>
  )
}
