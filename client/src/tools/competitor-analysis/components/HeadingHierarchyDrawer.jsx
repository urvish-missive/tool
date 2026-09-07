import { useState } from 'react'
import { Layers, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

export default function HeadingHierarchyDrawer({ competitorSeo, yourSeo, competitorUrl, yourUrl }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedSide, setCopiedSide] = useState(null)

  const copyHeadings = (seoData, side) => {
    if (!seoData) return
    const lines = [
      `=== Heading Hierarchy: ${seoData.title || seoData.url} ===`,
      '',
      `H1 (${seoData.h1s?.length || 0}):`,
      ...(seoData.h1s || []).map((h) => `  # ${h}`),
      '',
      `H2 (${seoData.h2s?.length || 0}):`,
      ...(seoData.h2s || []).map((h) => `  ## ${h}`),
      '',
      `H3 (${seoData.h3s?.length || 0}):`,
      ...(seoData.h3s || []).map((h) => `  ### ${h}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedSide(side)
    setTimeout(() => setCopiedSide(null), 2000)
  }

  const renderHeadingList = (seoData, label, side, isCompetitor = false) => {
    if (!seoData) {
      return (
        <div className="p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-500">No URL analyzed for this slot.</p>
        </div>
      )
    }

    const totalHeadings =
      (seoData.h1s?.length || 0) + (seoData.h2s?.length || 0) + (seoData.h3s?.length || 0)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isCompetitor
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {label}
            </span>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs font-medium">
              {seoData.url || (isCompetitor ? competitorUrl : yourUrl)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyHeadings(seoData, side)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedSide === side ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy Outline</span>
              </>
            )}
          </button>
        </div>

        {totalHeadings === 0 ? (
          <p className="text-xs text-gray-400 italic py-3">No H1-H3 headings detected in raw HTML.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
            {seoData.h1s?.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">
                  H1 Tags ({seoData.h1s.length})
                </span>
                {seoData.h1s.map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-purple-50/70 border border-purple-100 text-purple-950 font-bold"
                  >
                    # {h}
                  </div>
                ))}
              </div>
            )}

            {seoData.h2s?.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                  H2 Subsections ({seoData.h2s.length})
                </span>
                <div className="space-y-1">
                  {seoData.h2s.map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium ml-2"
                    >
                      ## {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seoData.h3s?.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  H3 Items ({seoData.h3s.length})
                </span>
                <div className="space-y-1">
                  {seoData.h3s.map((h, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded-lg bg-white border border-gray-100 text-gray-600 text-[11px] ml-4 truncate"
                      title={h}
                    >
                      ### {h}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Heading Hierarchy & Content Outline Blueprint
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {(competitorSeo?.h1s?.length || 0) + (competitorSeo?.h2s?.length || 0)} Headings
              </span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Compare semantic structure, section counts, and content depth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <span>{isOpen ? 'Hide Outlines' : 'Inspect Outlines'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/40">
          <div>{renderHeadingList(competitorSeo, 'Competitor Outline', 'competitor', true)}</div>
          <div>{renderHeadingList(yourSeo, 'Your Outline', 'your', false)}</div>
        </div>
      )}
    </div>
  )
}
