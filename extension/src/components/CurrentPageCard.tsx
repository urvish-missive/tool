import { FileText, Globe, Heading, Image as ImageIcon, Link2 } from 'lucide-react'
import type { ActiveTab } from '../services/analysis'
import type { PageContent } from '../types/page'
import { displayUrl } from '../utils/restrictedUrls'

interface Props {
  tab: ActiveTab | null
  page: PageContent | null
}

function Stat({ icon: Icon, value, label }: { icon: typeof FileText; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600" title={label}>
      <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
      <span className="font-medium text-slate-800">{value.toLocaleString()}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default function CurrentPageCard({ tab, page }: Props) {
  const url = page?.url || tab?.url
  const title = page?.title || tab?.title

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Current page</p>
      {url ? (
        <>
          <h1 className="line-clamp-2 text-sm font-semibold text-slate-900">{title || 'Untitled page'}</h1>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{displayUrl(url)}</span>
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">
          Click the <span className="font-medium text-slate-900">Missive SEO</span> icon in the toolbar while on the page you
          want to analyze.
        </p>
      )}

      {page && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-2.5">
          <Stat icon={FileText} value={page.wordCount} label="words" />
          <Stat icon={Heading} value={page.headings.length} label="headings" />
          <Stat icon={Link2} value={page.linkTotals.internal + page.linkTotals.external} label="links" />
          <Stat icon={ImageIcon} value={page.imageTotals.total} label="images" />
        </div>
      )}
    </section>
  )
}
