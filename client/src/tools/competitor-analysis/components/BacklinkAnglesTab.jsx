import { useState } from 'react'
import {
  Link2,
  Copy,
  Check,
  Share2,
  Users,
  Compass,
  ArrowUpRight,
  Sparkles,
  Award,
} from 'lucide-react'

export default function BacklinkAnglesTab({ backlinkAngles = [] }) {
  const [copiedKey, setCopiedKey] = useState(null)

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const copyAllAngles = () => {
    const text = backlinkAngles
      .map((b, i) => `${i + 1}. Linkable Asset: ${b.angle}\n   Target Outreach: ${b.targetOutreach}`)
      .join('\n\n')
    triggerCopy(text, 'all-backlinks')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Link2 className="w-3.5 h-3.5" />
              Linkable Asset & Outreach Blueprint
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Authority-Building Backlink Angles ({backlinkAngles.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Assets engineered to naturally attract editorial citations and bypass the competitor's backlink moat.
            </p>
          </div>

          <button
            type="button"
            onClick={copyAllAngles}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'all-backlinks' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied All Assets!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy All Link Angles</span>
              </>
            )}
          </button>
        </div>

        {backlinkAngles.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs">
            No specific backlink angles generated. Use comprehensive data charts and original survey data for link outreach.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {backlinkAngles.map((asset, i) => (
              <div
                key={i}
                className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-5 border border-slate-200/80 transition-all flex flex-col justify-between space-y-4 hover:shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide">
                      <Award className="w-3 h-3 text-emerald-700" />
                      Link Asset #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerCopy(`${asset.angle}\nTarget: ${asset.targetOutreach}`, `backlink-${i}`)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1 cursor-pointer"
                      title="Copy asset idea"
                    >
                      {copiedKey === `backlink-${i}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base leading-snug">
                    {asset.angle}
                  </h4>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-blue-600" /> Target Outreach Prospects:
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {asset.targetOutreach}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
