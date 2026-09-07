import { useState } from 'react'
import { Crown, Copy, Check, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react'

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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Position #0 Featured Snippet Steal
          </div>
          <h3 className="text-xl font-black text-slate-900">
            Target Query:{' '}
            <span className="text-blue-600">"{snippetSnatch.targetQuery}"</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Competitors often rank without optimized featured snippets, leaving Position 0 vulnerable to theft.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copied to Clipboard!</span>
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
        <span className="text-xs text-slate-500 font-semibold">Recommended SERP Format:</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-900 text-xs font-bold border border-amber-200">
          {formatLabel}
        </span>
      </div>

      {/* Snippet Card Preview */}
      <div className="p-6 sm:p-7 bg-slate-900 text-slate-100 rounded-2xl space-y-3 relative overflow-hidden border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
            Ready-to-Paste Position 0 Direct Answer
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {snippetSnatch.draftSnippet?.split(/\s+/).filter(Boolean).length || 0} words
          </span>
        </div>

        <p className="text-base sm:text-lg leading-relaxed font-serif text-slate-100">
          "{snippetSnatch.draftSnippet}"
        </p>
      </div>

      {/* Snippet Steal Best Practices Checklist */}
      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> How to Snatch Position 0 in Practice:
        </h5>
        <ul className="text-xs text-blue-950/80 space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Place this exact snippet directly beneath an <strong>H2 heading</strong> phrased as the target question.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Keep paragraph length between <strong>40 and 60 words</strong> without introductory fluff like "In this article...".</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Include structured FAQ Schema (<code>FAQPage</code>) on the page to reinforce the entity context.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
