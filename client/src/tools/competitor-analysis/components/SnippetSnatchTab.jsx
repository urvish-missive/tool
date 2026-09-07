import { useState } from 'react'
import { Crown, Copy, Check, Sparkles, CheckCircle2 } from 'lucide-react'

export default function SnippetSnatchTab({ snippetSnatch }) {
  const [copied, setCopied] = useState(false)

  if (!snippetSnatch) return null

  const handleCopy = () => {
    if (!snippetSnatch.draftSnippet) return
    navigator.clipboard.writeText(snippetSnatch.draftSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatLabel = {
    direct_definition: 'Direct Definition Paragraph (45-60 words)',
    bullet_list: 'Numbered / Bulleted Process List',
    comparison_table: 'HTML Comparison Table',
  }[snippetSnatch.recommendedFormat] || snippetSnatch.recommendedFormat || 'Concise Direct Answer'

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Position #0 Featured Snippet Steal
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Target Query: <span className="text-[#0C81F3]">"{snippetSnatch.targetQuery}"</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Competitors often rank without concise answers, leaving Position 0 open to be snatched.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Ready Snippet</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-semibold">Recommended Format:</span>
        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          {formatLabel}
        </span>
      </div>

      {/* Snippet Card Preview */}
      <div className="p-5 sm:p-6 bg-gray-900 text-gray-100 rounded-2xl space-y-2.5 relative overflow-hidden border border-gray-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            Ready-to-Paste Position 0 Direct Answer
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {snippetSnatch.draftSnippet?.split(/\s+/).filter(Boolean).length || 0} words
          </span>
        </div>

        <p className="text-sm sm:text-base leading-relaxed font-serif text-gray-100">
          "{snippetSnatch.draftSnippet}"
        </p>
      </div>

      {/* Snippet Steal Best Practices Checklist */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" /> Execution Strategy:
        </h5>
        <ul className="text-xs text-blue-950/80 space-y-1 leading-relaxed">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0C81F3] shrink-0 mt-0.5" />
            <span>Place this exact snippet directly beneath an <strong>H2 heading</strong> worded as the target query.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0C81F3] shrink-0 mt-0.5" />
            <span>Keep paragraph length between <strong>40 and 60 words</strong> without throat-clearing fluff.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0C81F3] shrink-0 mt-0.5" />
            <span>Add structured FAQ Schema (<code>FAQPage</code>) on the page to reinforce answer relevance.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
