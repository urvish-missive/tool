import { Settings } from 'lucide-react'
import type { DeviceStatus } from '../types/analysis'

interface Props {
  usage: DeviceStatus | null
}

function UsagePill({ usage }: { usage: DeviceStatus }) {
  if (usage.isBlocked) {
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">Restricted</span>
  }
  if (!usage.limit) {
    return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Unlimited</span>
  }
  const remaining = Math.max(0, usage.remaining ?? usage.limit - usage.usageCount)
  const tone = remaining === 0 ? 'bg-rose-50 text-rose-700' : remaining === 1 ? 'bg-amber-50 text-amber-700' : 'bg-brand-soft text-brand'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`} title="Free analyses left on this device">
      {remaining} of {usage.limit} left
    </span>
  )
}

export default function Header({ usage }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <img src="/icons/icon48.png" alt="" className="h-7 w-7" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-sm font-semibold text-slate-900">Missive SEO</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Content QA</p>
      </div>
      {usage && <UsagePill usage={usage} />}
      <button
        type="button"
        onClick={() => chrome.runtime.openOptionsPage()}
        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label="Settings"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
    </header>
  )
}
