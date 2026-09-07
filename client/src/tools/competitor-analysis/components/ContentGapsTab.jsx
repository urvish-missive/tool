import { useState, useMemo } from 'react'
import {
  Target,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
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
    <div className="space-y-6">
      {/* ── SECTION 1: CONTENT GAPS & INFORMATION GAIN ── */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Information Gain Engine
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Content Gaps & 10x Angles
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Subtopics and search queries omitted or covered superficially by your competitor.
            </p>
          </div>

          {/* Search Intent Filter Pills (Matching Content QA Checklist style) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
              Intent:
            </span>
            {[
              { id: 'all', label: `All (${contentGaps.length})` },
              { id: 'informational', label: 'Informational' },
              { id: 'commercial', label: 'Commercial' },
              { id: 'transactional', label: 'Transactional' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setIntentFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  intentFilter === f.id
                    ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Gaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-gray-50 rounded-2xl text-gray-500 text-xs">
              No content gaps found for this intent filter.
            </div>
          ) : (
            filteredGaps.map((gap, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-[#0C81F3]/40 transition-all flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold uppercase tracking-wider border border-purple-100">
                      {gap.searchIntent || 'Informational'} Intent
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerCopy(gap.suggestedAngle, `gap-${i}`)}
                      className="text-gray-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                      title="Copy Suggested Angle"
                    >
                      {copiedKey === `gap-${i}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                    {gap.topic}
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-gray-800 font-semibold">Why Searchers Care: </strong>
                    {gap.whyImportant}
                  </p>
                </div>

                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs text-gray-800 leading-relaxed space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-purple-600" /> Recommended 10x Angle:
                  </span>
                  <p className="font-medium text-gray-800">{gap.suggestedAngle}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SECTION 2: HIGH-YIELD KEYWORD OPPORTUNITIES ── */}
      {keywordOpportunities.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0C81F3] text-xs font-bold uppercase tracking-wider mb-1.5">
                <Target className="w-3.5 h-3.5" />
                Target Keywords
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                High-Yield Keyword Opportunities ({keywordOpportunities.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Search queries with low-hanging search volume and high commercial or informational intent.
              </p>
            </div>

            <button
              type="button"
              onClick={copyAllKeywords}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer shrink-0"
            >
              {copiedKey === 'copy-all-keywords' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copy All Keywords</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-5">Target Query</th>
                  <th className="py-3 px-4">Intent</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-5">Strategic Capture Angle</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {keywordOpportunities.map((kw, i) => {
                  const diffColor =
                    kw.difficulty?.toLowerCase() === 'easy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : kw.difficulty?.toLowerCase() === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'

                  return (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <span className="font-bold text-gray-900">{kw.keyword}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0C81F3] text-xs font-semibold capitalize">
                          {kw.intent}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${diffColor}`}>
                          {kw.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-xs text-gray-600 leading-relaxed max-w-md">
                        {kw.opportunity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => triggerCopy(kw.keyword, `kw-${i}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium transition-colors cursor-pointer"
                        >
                          {copiedKey === `kw-${i}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
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
