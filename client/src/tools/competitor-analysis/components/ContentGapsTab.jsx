import { useState, useMemo } from 'react'
import {
  Target,
  Search,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default function ContentGapsTab({ contentGaps = [], keywordOpportunities = [] }) {
  const [intentFilter, setIntentFilter] = useState('all') // 'all' | 'informational' | 'commercial' | 'transactional'
  const [copiedKey, setCopiedKey] = useState(null)

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const filteredGaps = useMemo(() => {
    if (intentFilter === 'all') return contentGaps
    return contentGaps.filter(
      (g) => (g.searchIntent || '').toLowerCase() === intentFilter.toLowerCase()
    )
  }, [contentGaps, intentFilter])

  const copyAllKeywords = () => {
    const text = keywordOpportunities
      .map(
        (k) =>
          `Keyword: ${k.keyword} [Intent: ${k.intent}, Difficulty: ${k.difficulty}]\nOpportunity: ${k.opportunity}`
      )
      .join('\n\n')
    triggerCopy(text, 'copy-all-keywords')
  }

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: CONTENT GAPS & INFORMATION GAIN ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Information Gain Engine
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Unexploited Content Gaps & 10x Angles
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Subtopics and high-value search queries your competitor omitted or covered superficially.
            </p>
          </div>

          {/* Search Intent Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            {['all', 'informational', 'commercial', 'transactional'].map((intent) => (
              <button
                key={intent}
                type="button"
                onClick={() => setIntentFilter(intent)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  intentFilter === intent
                    ? 'bg-white text-purple-700 font-extrabold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>

        {/* Content Gaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGaps.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
              No content gaps found for this intent filter.
            </div>
          ) : (
            filteredGaps.map((gap, i) => (
              <div
                key={i}
                className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-5 border border-slate-200/80 transition-all flex flex-col justify-between space-y-4 hover:shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wide">
                      {gap.searchIntent || 'Informational'} Intent
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerCopy(gap.suggestedAngle, `gap-${i}`)}
                      className="text-slate-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                      title="Copy Suggested Angle"
                    >
                      {copiedKey === `gap-${i}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base leading-snug">
                    {gap.topic}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Why Searchers Care: </strong>
                    {gap.whyImportant}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Recommended 10x Angle:
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {gap.suggestedAngle}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SECTION 2: HIGH-YIELD KEYWORD OPPORTUNITIES ── */}
      {keywordOpportunities.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Target className="w-3.5 h-3.5" />
                Target Search Query Matrix
              </div>
              <h3 className="text-xl font-black text-slate-900">
                High-Yield Keyword Opportunities ({keywordOpportunities.length})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Strategic keywords with low-hanging search volume and high commercial or informational value.
              </p>
            </div>

            <button
              type="button"
              onClick={copyAllKeywords}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              {copiedKey === 'copy-all-keywords' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied All Keywords!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy All Keywords</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Target Search Query</th>
                  <th className="py-3.5 px-4">Search Intent</th>
                  <th className="py-3.5 px-4">SEO Difficulty</th>
                  <th className="py-3.5 px-5">Strategic Angle & Capture Strategy</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {keywordOpportunities.map((kw, i) => {
                  const diffColor =
                    kw.difficulty?.toLowerCase() === 'easy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : kw.difficulty?.toLowerCase() === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'

                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 text-sm">{kw.keyword}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold capitalize">
                          {kw.intent}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${diffColor}`}>
                          {kw.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 leading-relaxed max-w-md">
                        {kw.opportunity}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => triggerCopy(kw.keyword, `kw-${i}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {copiedKey === `kw-${i}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{copiedKey === `kw-${i}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
