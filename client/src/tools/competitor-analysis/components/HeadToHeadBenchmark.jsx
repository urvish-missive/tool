import { useState } from 'react'
import ScoreRing from '../../../components/ScoreRing'
import HeadingHierarchyDrawer from './HeadingHierarchyDrawer'
import {
  BarChart3,
  Globe,
  FileText,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
} from 'lucide-react'

export default function HeadToHeadBenchmark({
  competitorSeo,
  yourSeo,
  competitorUrl,
  yourUrl,
}) {
  const [serpView, setSerpView] = useState('both') // 'both' | 'competitor' | 'your'

  const compStats = competitorSeo?.stats || {}
  const yourStats = yourSeo?.stats || {}

  const hasYourData = Boolean(yourSeo)

  // Calculate comparisons
  const wordDiff = (yourStats.wordCount || 0) - (compStats.wordCount || 0)
  const h2Diff = (yourSeo?.h2s?.length || 0) - (competitorSeo?.h2s?.length || 0)
  const linksDiff = (yourStats.internalLinks || 0) - (compStats.internalLinks || 0)

  const compAltPct = compStats.totalImages
    ? Math.round(((compStats.imagesWithAlt || 0) / compStats.totalImages) * 100)
    : 100
  const yourAltPct = yourStats.totalImages
    ? Math.round(((yourStats.imagesWithAlt || 0) / yourStats.totalImages) * 100)
    : 100

  // Win tally if your URL provided
  let yourWins = 0
  let compWins = 0

  if (hasYourData) {
    if ((yourStats.overallBenchmark || 0) > (compStats.overallBenchmark || 0)) yourWins++
    else if ((yourStats.overallBenchmark || 0) < (compStats.overallBenchmark || 0)) compWins++

    if ((yourStats.wordCount || 0) > (compStats.wordCount || 0)) yourWins++
    else if ((yourStats.wordCount || 0) < (compStats.wordCount || 0)) compWins++

    if ((yourSeo?.h2s?.length || 0) > (competitorSeo?.h2s?.length || 0)) yourWins++
    else if ((yourSeo?.h2s?.length || 0) < (competitorSeo?.h2s?.length || 0)) compWins++

    if (yourStats.hasSchema && !compStats.hasSchema) yourWins++
    else if (!yourStats.hasSchema && compStats.hasSchema) compWins++

    if (yourAltPct > compAltPct) yourWins++
    else if (yourAltPct < compAltPct) compWins++
  }

  // Format SERP URL display
  const formatSerpUrl = (url) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      return `${u.origin} › ${u.pathname.split('/').filter(Boolean).slice(0, 2).join(' › ')}`
    } catch {
      return url
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Win Tally */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Head-to-Head Technical Benchmarking
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {hasYourData
              ? 'Real-Time Domain & Content Comparison'
              : 'Competitor Technical Audit vs Top 1% Standard'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {hasYourData
              ? 'Comparing structural depth, on-page optimization, and authority signals between both pages.'
              : 'Audit of the competitor page compared against Google #1 ranking standards.'}
          </p>
        </div>

        {hasYourData && (
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
              <span>Your Wins</span>
              <div className="text-base font-black text-emerald-700">{yourWins}</div>
            </div>
            <div className="text-slate-300 font-bold">:</div>
            <div className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold text-center">
              <span>Competitor</span>
              <div className="text-base font-black text-rose-700">{compWins}</div>
            </div>
          </div>
        )}
      </div>

      {/* Score Rings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competitor Score Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Competitor Target
              </span>
              <h4 className="font-bold text-slate-900 text-base truncate max-w-[240px] sm:max-w-xs" title={competitorSeo?.title}>
                {competitorSeo?.title || competitorUrl}
              </h4>
              <p className="text-xs text-slate-400 truncate max-w-xs font-mono">{competitorUrl}</p>
            </div>
            <ScoreRing
              score={compStats.overallBenchmark || 45}
              size={84}
              strokeWidth={7}
              label=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs font-medium text-slate-500">Content Depth</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {compStats.contentDepthScore || 40}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs font-medium text-slate-500">Technical SEO</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {compStats.technicalScore || 40}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Score / Industry Target Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {hasYourData ? 'Your Page Data' : 'Position #1 Industry Benchmark'}
              </span>
              <h4 className="font-bold text-slate-900 text-base truncate max-w-[240px] sm:max-w-xs" title={yourSeo ? yourSeo.title : 'Top 1% SERP Standard'}>
                {hasYourData ? yourSeo.title : 'High-Authority Industry Benchmark'}
              </h4>
              <p className="text-xs text-slate-400 truncate max-w-xs font-mono">
                {hasYourData ? yourUrl : 'SERP Position 1 Standard'}
              </p>
            </div>
            <ScoreRing
              score={hasYourData ? (yourStats.overallBenchmark || 50) : 95}
              size={84}
              strokeWidth={7}
              label=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs font-medium text-slate-500">Content Depth</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {hasYourData ? (yourStats.contentDepthScore || 50) : 95}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs font-medium text-slate-500">Technical SEO</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {hasYourData ? (yourStats.technicalScore || 50) : 95}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Technical Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Core Technical & Content Signals Breakdown
          </h4>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Direct HTML Extraction
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-5">Signal / Metric</th>
                <th className="py-3.5 px-5">Competitor Data</th>
                <th className="py-3.5 px-5">{hasYourData ? 'Your Data' : 'Industry Standard'}</th>
                <th className="py-3.5 px-5 text-right">Advantage / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {/* Word Count */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Estimated Word Count
                </td>
                <td className="py-4 px-5">
                  <strong className="text-slate-900">{compStats.wordCount?.toLocaleString() || 0}</strong> words
                </td>
                <td className="py-4 px-5">
                  <strong className="text-slate-900">
                    {hasYourData ? `${yourStats.wordCount?.toLocaleString() || 0} words` : '2,200+ comprehensive words'}
                  </strong>
                </td>
                <td className="py-4 px-5 text-right">
                  {hasYourData ? (
                    wordDiff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">
                        <TrendingUp className="w-3.5 h-3.5" /> +{wordDiff.toLocaleString()} words ahead
                      </span>
                    ) : wordDiff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-bold text-xs">
                        <TrendingDown className="w-3.5 h-3.5" /> {wordDiff.toLocaleString()} words deficit
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Even</span>
                    )
                  ) : (
                    <span className="text-blue-600 font-bold text-xs">Target: 2,000+ words</span>
                  )}
                </td>
              </tr>

              {/* Headings */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Heading Depth (H1 / H2 / H3)
                </td>
                <td className="py-4 px-5">
                  {competitorSeo?.h1s?.length || 0} H1s • {competitorSeo?.h2s?.length || 0} H2s • {competitorSeo?.h3s?.length || 0} H3s
                </td>
                <td className="py-4 px-5">
                  {hasYourData
                    ? `${yourSeo?.h1s?.length || 0} H1s • ${yourSeo?.h2s?.length || 0} H2s • ${yourSeo?.h3s?.length || 0} H3s`
                    : '1 H1 • 6-10 H2s • Nested H3s'}
                </td>
                <td className="py-4 px-5 text-right">
                  {hasYourData ? (
                    h2Diff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">
                        +{h2Diff} more H2 sections
                      </span>
                    ) : h2Diff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-xs">
                        {Math.abs(h2Diff)} fewer H2s
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Equal H2 depth</span>
                    )
                  ) : (
                    <span className="text-slate-500 text-xs">Structured outline</span>
                  )}
                </td>
              </tr>

              {/* Internal Links */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  Internal Silo Links
                </td>
                <td className="py-4 px-5">{compStats.internalLinks || 0} links</td>
                <td className="py-4 px-5">
                  {hasYourData ? `${yourStats.internalLinks || 0} links` : '10-15 topic silo links'}
                </td>
                <td className="py-4 px-5 text-right">
                  {hasYourData ? (
                    linksDiff >= 0 ? (
                      <span className="text-emerald-600 font-bold text-xs">+{linksDiff} internal links</span>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs">{linksDiff} links</span>
                    )
                  ) : (
                    <span className="text-slate-500 text-xs">Contextual link clusters</span>
                  )}
                </td>
              </tr>

              {/* Image Alt Coverage */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Image Alt Accessibility
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <span>{compStats.imagesWithAlt || 0}/{compStats.totalImages || 0}</span>
                    <span className="text-xs text-slate-400">({compAltPct}%)</span>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <span>{hasYourData ? `${yourStats.imagesWithAlt || 0}/${yourStats.totalImages || 0}` : '100%'}</span>
                    <span className="text-xs text-slate-400">({hasYourData ? `${yourAltPct}%` : 'Goal'})</span>
                  </div>
                </td>
                <td className="py-4 px-5 text-right">
                  {compStats.imagesWithoutAlt > 0 ? (
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold text-xs">
                      {compStats.imagesWithoutAlt} images missing alt!
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs">Full Alt Coverage</span>
                  )}
                </td>
              </tr>

              {/* Schema Markup */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Structured Data (Schema.org)
                </td>
                <td className="py-4 px-5">
                  {compStats.hasSchema ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> JSON-LD Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                      <XCircle className="w-4 h-4 text-rose-500" /> Missing Schema
                    </span>
                  )}
                </td>
                <td className="py-4 px-5">
                  {hasYourData ? (
                    yourStats.hasSchema ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> JSON-LD Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                        <XCircle className="w-4 h-4 text-rose-500" /> Missing Schema
                      </span>
                    )
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs">Article + FAQPage Recommended</span>
                  )}
                </td>
                <td className="py-4 px-5 text-right">
                  {!compStats.hasSchema ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">
                      ⚡ Quick Win with FAQ Schema
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Implemented</span>
                  )}
                </td>
              </tr>

              {/* Open Graph Social */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  Social Cards (og:title, og:image)
                </td>
                <td className="py-4 px-5">
                  {compStats.hasOGTags ? (
                    <span className="text-emerald-700 font-bold">✓ Configured</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✗ Incomplete</span>
                  )}
                </td>
                <td className="py-4 px-5">
                  {hasYourData ? (
                    yourStats.hasOGTags ? (
                      <span className="text-emerald-700 font-bold">✓ Configured</span>
                    ) : (
                      <span className="text-rose-600 font-bold">✗ Incomplete</span>
                    )
                  ) : (
                    <span className="text-slate-700 font-medium">Full OG Metadata</span>
                  )}
                </td>
                <td className="py-4 px-5 text-right">
                  <span className="text-slate-400 text-xs">Social Visibility</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Google SERP Snippet Simulator */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Search className="w-3.5 h-3.5" />
              Google SERP Snippet Simulator
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Search Result Appearance & Click-Through Optimization
            </h4>
          </div>

          {hasYourData && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSerpView('both')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serpView === 'both' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setSerpView('competitor')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serpView === 'competitor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Competitor
              </button>
              <button
                type="button"
                onClick={() => setSerpView('your')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serpView === 'your' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Your Page
              </button>
            </div>
          )}
        </div>

        <div className={`grid gap-6 ${serpView === 'both' && hasYourData ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Competitor SERP Card */}
          {(serpView === 'both' || serpView === 'competitor') && (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mb-1">
                Competitor SERP Preview
              </span>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 truncate font-mono">
                  {formatSerpUrl(competitorUrl)}
                </p>
                <h5 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                  {competitorSeo?.title || competitorUrl}
                </h5>
                <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed">
                  {competitorSeo?.metaDescription || (
                    <span className="italic text-slate-400">
                      No meta description provided in HTML; Google will auto-extract a snippet from body content.
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500 border-t border-slate-200/60">
                <span>Title Length: <strong>{competitorSeo?.title?.length || 0}</strong> chars (ideal: 50-60)</span>
                <span>•</span>
                <span>Meta Length: <strong>{competitorSeo?.metaDescription?.length || 0}</strong> chars (ideal: 140-160)</span>
              </div>
            </div>
          )}

          {/* Your Page SERP Card */}
          {(serpView === 'both' || serpView === 'your') && (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                {hasYourData ? 'Your SERP Preview' : 'Recommended Optimization Target'}
              </span>
              <div className="space-y-1">
                <p className="text-xs text-slate-600 truncate font-mono">
                  {formatSerpUrl(hasYourData ? yourUrl : 'https://yourbrand.com/ultimate-guide')}
                </p>
                <h5 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                  {hasYourData ? (yourSeo?.title || yourUrl) : '10x Content Playbook: The Definitive Guide for Maximum Rankings'}
                </h5>
                <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed">
                  {hasYourData
                    ? (yourSeo?.metaDescription || 'No meta description found.')
                    : 'Discover actionable strategies, complete heading blueprints, and exploitable content gaps to outrank top competitors in search results.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500 border-t border-slate-200/60">
                <span>Title Length: <strong>{yourSeo?.title?.length || 58}</strong> chars</span>
                <span>•</span>
                <span>Meta Length: <strong>{yourSeo?.metaDescription?.length || 152}</strong> chars</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heading Hierarchy Collapsible Outline */}
      <HeadingHierarchyDrawer
        competitorSeo={competitorSeo}
        yourSeo={yourSeo}
        competitorUrl={competitorUrl}
        yourUrl={yourUrl}
      />
    </div>
  )
}
