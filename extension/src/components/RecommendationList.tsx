import { Lightbulb, TriangleAlert } from 'lucide-react'
import type { QaHighlight, QaReport } from '../types/analysis'
import { stripRuleCode } from '../utils/engineText'

const MAX_HIGHLIGHTS = 12

/** Engine labels look like "[GENERIC_BACKSTORY] Opening opens with g" (code prefix, cut at 40 chars). */
function cleanLabel(label: string): string {
  const text = stripRuleCode(label)
  return label.length >= 40 && !/[.!?)]$/.test(text) ? `${text}…` : text
}

function groupHighlights(highlights: QaHighlight[]) {
  const groups = new Map<
    string,
    { key: string; label: string; severity?: string; suggestion?: string; examples: string[]; count: number }
  >()
  for (const h of highlights) {
    const key = h.label || h.type
    const group = groups.get(key) || {
      key,
      label: cleanLabel(key),
      severity: h.severity,
      suggestion: h.suggestion,
      examples: [],
      count: 0,
    }
    group.count++
    if (h.text && group.examples.length < 3 && !group.examples.includes(h.text)) group.examples.push(h.text)
    groups.set(key, group)
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count).slice(0, MAX_HIGHLIGHTS)
}

export default function RecommendationList({ report }: { report: QaReport }) {
  const fixes = report.ai?.topFixes?.filter(Boolean) || []
  const tips = report.ai?.himaniProTips?.filter(Boolean) || []
  const flagged = groupHighlights(report.highlights || [])

  if (!fixes.length && !tips.length && !flagged.length) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Recommendations</p>

      {fixes.length > 0 && (
        <ul className="mt-2.5 space-y-2">
          {fixes.map((fix) => (
            <li key={fix} className="flex gap-2 text-sm text-slate-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              <span>{fix}</span>
            </li>
          ))}
        </ul>
      )}

      {flagged.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Flagged in the text</p>
          <ul className="mt-1.5 space-y-2">
            {flagged.map((g) => (
              <li key={g.key} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{g.label}</span>
                  <span className={`rounded-full px-1.5 text-[11px] ${g.severity === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {g.count}×
                  </span>
                </div>
                {g.examples.length > 0 && (
                  <p className="mt-1 truncate text-slate-500">{g.examples.map((e) => `“${e}”`).join(', ')}</p>
                )}
                {g.suggestion && <p className="mt-0.5 text-brand">→ {g.suggestion}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tips.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pro tips</p>
          {tips.map((tip) => (
            <p key={tip} className="flex gap-2 text-xs text-slate-600">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" aria-hidden />
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
