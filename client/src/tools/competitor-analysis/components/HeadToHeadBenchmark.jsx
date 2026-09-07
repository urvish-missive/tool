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
  TrendingUp,
  TrendingDown,
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
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0C81F3] text-xs font-bold uppercase tracking-wider mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Head-to-Head Technical Benchmarking
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {hasYourData
              ? 'Real-Time Domain & Content Comparison'
              : 'Competitor Technical Audit vs Top 1% Standard'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {hasYourData
              ? 'Comparing structural depth, on-page optimization, and authority signals between both pages.'
              : 'Audit of the competitor page compared against Google #1 ranking standards.'}
          </p>
        </div>

        {hasYourData && (
          <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
              <span>Your Wins</span>
              <div className="text-base font-extrabold text-emerald-700">{yourWins}</div>
            </div>
            <div className="text-gray-300 font-bold">:</div>
            <div className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold text-center">
              <span>Competitor</span>
              <div className="text-base font-extrabold text-rose-700">{compWins}</div>
            </div>
          </div>
        )}
      </div>

      {/* Score Rings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Competitor Score Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Competitor Target
              </span>
              <h4 className="font-bold text-gray-900 text-base truncate max-w-[240px] sm:max-w-xs" title={competitorSeo?.title}>
                {competitorSeo?.title || competitorUrl}
              </h4>
              <p className="text-xs text-gray-400 truncate max-w-xs font-mono">{competitorUrl}</p>
            </div>
            <ScoreRing
              score={compStats.overallBenchmark || 45}
              size={80}
              strokeWidth={7}
              label=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-xs font-medium text-gray-500">Content Depth</span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {compStats.contentDepthScore || 40}
                <span className="text-xs font-normal text-gray-400">/100</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-xs font-medium text-gray-500">Technical SEO</span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {compStats.technicalScore || 40}
                <span className="text-xs font-normal text-gray-400">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Score / Industry Target Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {hasYourData ? 'Your Page Data' : 'Position #1 Industry Benchmark'}
              </span>
              <h4 className="font-bold text-gray-900 text-base truncate max-w-[240px] sm:max-w-xs" title={yourSeo ? yourSeo.title : 'Top 1% SERP Standard'}>
                {hasYourData ? yourSeo.title : 'High-Authority Benchmark'}
              </h4>
              <p className="text-xs text-gray-400 truncate max-w-xs font-mono">
                {hasYourData ? yourUrl : 'SERP Position 1 Standard'}
              </p>
            </div>
            <ScoreRing
              score={hasYourData ? (yourStats.overallBenchmark || 50) : 95}
              size={80}
              strokeWidth={7}
              label=""
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-xs font-medium text-gray-500">Content Depth</span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {hasYourData ? (yourStats.contentDepthScore || 50) : 95}
                <span className="text-xs font-normal text-gray-400">/100</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-xs font-medium text-gray-500">Technical SEO</span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {hasYourData ? (yourStats.technicalScore || 50) : 95}
                <span className="text-xs font-normal text-gray-400">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Technical Comparison Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0C81F3]" />
            Core Technical & Content Signals Breakdown
          </h4>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            Direct HTML Extraction
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-5">Signal / Metric</th>
                <th className="py-3 px-5">Competitor Data</th>
                <th className="py-3 px-5">{hasYourData ? 'Your Data' : 'Industry Standard'}</th>
                <th className="py-3 px-5 text-right">Advantage / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
              {/* Word Count */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Estimated Word Count
                </td>
                <td className="py-3.5 px-5">
                  <strong className="text-gray-900">{compStats.wordCount?.toLocaleString() || 0}</strong> words
                </td>
                <td className="py-3.5 px-5">
                  <strong className="text-gray-900">
                    {hasYourData ? `${yourStats.wordCount?.toLocaleString() || 0} words` : '2,200+ words'}
                  </strong>
                </td>
                <td className="py-3.5 px-5 text-right">
                  {hasYourData ? (
                    wordDiff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-xs">
                        <TrendingUp className="w-3.5 h-3.5" /> +{wordDiff.toLocaleString()} ahead
                      </span>
                    ) : wordDiff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold text-xs">
                        <TrendingDown className="w-3.5 h-3.5" /> {wordDiff.toLocaleString()} deficit
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Equal</span>
                    )
                  ) : (
                    <span className="text-[#0C81F3] font-bold text-xs">Target: 2,000+ words</span>
                  )}
                </td>
              </tr>

              {/* Headings */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-400" />
                  Headings (H1 / H2 / H3)
                </td>
                <td className="py-3.5 px-5">
                  {competitorSeo?.h1s?.length || 0} H1 • {competitorSeo?.h2s?.length || 0} H2 • {competitorSeo?.h3s?.length || 0} H3
                </td>
                <td className="py-3.5 px-5">
                  {hasYourData
                    ? `${yourSeo?.h1s?.length || 0} H1 • ${yourSeo?.h2s?.length || 0} H2 • ${yourSeo?.h3s?.length || 0} H3`
                    : '1 H1 • 6-10 H2s • Nested H3s'}
                </td>
                <td className="py-3.5 px-5 text-right">
                  {hasYourData ? (
                    h2Diff > 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">
                        +{h2Diff} more H2s
                      </span>
                    ) : h2Diff < 0 ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold text-xs">
                        {Math.abs(h2Diff)} fewer H2s
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Equal depth</span>
                    )
                  ) : (
                    <span className="text-gray-500 text-xs">Structured outline</span>
                  )}
                </td>
              </tr>

              {/* Internal Links */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  Internal Links
                </td>
                <td className="py-3.5 px-5">{compStats.internalLinks || 0} links</td>
                <td className="py-3.5 px-5">
                  {hasYourData ? `${yourStats.internalLinks || 0} links` : '10-15 silo links'}
                </td>
                <td className="py-3.5 px-5 text-right">
                  {hasYourData ? (
                    linksDiff >= 0 ? (
                      <span className="text-emerald-700 font-bold text-xs">+{linksDiff} links</span>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs">{linksDiff} links</span>
                    )
                  ) : (
                    <span className="text-gray-500 text-xs">Topic clustering</span>
                  )}
                </td>
              </tr>

              {/* Image Alt Coverage */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  Image Alt Text
                </td>
                <td className="py-3.5 px-5">
                  {compStats.imagesWithAlt || 0}/{compStats.totalImages || 0} ({compAltPct}%)
                </td>
                <td className="py-3.5 px-5">
                  {hasYourData ? `${yourStats.imagesWithAlt || 0}/${yourStats.totalImages || 0} (${yourAltPct}%)` : '100%'}
                </td>
                <td className="py-3.5 px-5 text-right">
                  {compStats.imagesWithoutAlt > 0 ? (
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold text-xs">
                      {compStats.imagesWithoutAlt} missing alt
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold text-xs">100% Coverage</span>
                  )}
                </td>
              </tr>

              {/* Schema Markup */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Schema.org Structured Data
                </td>
                <td className="py-3.5 px-5">
                  {compStats.hasSchema ? (
                    <span className="text-emerald-700 font-bold">✓ Detected</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✗ Missing</span>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  {hasYourData ? (
                    yourStats.hasSchema ? (
                      <span className="text-emerald-700 font-bold">✓ Detected</span>
                    ) : (
                      <span className="text-rose-600 font-bold">✗ Missing</span>
                    )
                  ) : (
                    <span className="text-emerald-700 font-semibold text-xs">FAQPage + Article</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-right">
                  {!compStats.hasSchema ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-xs">
                      ⚡ Easy Win with Schema
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Present</span>
                  )}
                </td>
              </tr>

              {/* Open Graph Social */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  Social Tags (OG / Twitter)
                </td>
                <td className="py-3.5 px-5">
                  {compStats.hasOGTags ? (
                    <span className="text-emerald-700 font-bold">✓ Configured</span>
                  ) : (
                    <span className="text-rose-600 font-bold">✗ Incomplete</span>
                  )}
                </td>
                <td className="py-3.5 px-5">
                  {hasYourData ? (
                    yourStats.hasOGTags ? (
                      <span className="text-emerald-700 font-bold">✓ Configured</span>
                    ) : (
                      <span className="text-rose-600 font-bold">✗ Incomplete</span>
                    )
                  ) : (
                    <span className="text-gray-700">Full OpenGraph</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <span className="text-gray-400 text-xs">Social Presence</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Google SERP Snippet Simulator */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0C81F3] text-xs font-bold uppercase tracking-wider mb-1">
              <Search className="w-3.5 h-3.5" />
              Google SERP Simulator
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Search Result Appearance & CTR Preview
            </h4>
          </div>

          {hasYourData && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSerpView('both')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  serpView === 'both' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setSerpView('competitor')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  serpView === 'competitor' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Competitor
              </button>
              <button
                type="button"
                onClick={() => setSerpView('your')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  serpView === 'your' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Your Page
              </button>
            </div>
          )}
        </div>

        <div className={`grid gap-4 ${serpView === 'both' && hasYourData ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Competitor SERP Card */}
          {(serpView === 'both' || serpView === 'competitor') && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mb-1">
                Competitor SERP Preview
              </span>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 truncate font-mono">
                  {formatSerpUrl(competitorUrl)}
                </p>
                <h5 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                  {competitorSeo?.title || competitorUrl}
                </h5>
                <p className="text-xs text-[#4d5156] leading-relaxed">
                  {competitorSeo?.metaDescription || (
                    <span className="italic text-gray-400">
                      No meta description in HTML; Google will auto-generate from content.
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-gray-400 border-t border-gray-200">
                <span>Title: <strong>{competitorSeo?.title?.length || 0}</strong> chars</span>
                <span>•</span>
                <span>Meta: <strong>{competitorSeo?.metaDescription?.length || 0}</strong> chars</span>
              </div>
            </div>
          )}

          {/* Your Page SERP Card */}
          {(serpView === 'both' || serpView === 'your') && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                {hasYourData ? 'Your SERP Preview' : 'Target Goal'}
              </span>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 truncate font-mono">
                  {formatSerpUrl(hasYourData ? yourUrl : 'https://yourbrand.com/guide')}
                </p>
                <h5 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                  {hasYourData ? (yourSeo?.title || yourUrl) : '10x Content Guide: The Complete Blueprint to Outrank Competitors'}
                </h5>
                <p className="text-xs text-[#4d5156] leading-relaxed">
                  {hasYourData
                    ? (yourSeo?.metaDescription || 'No meta description found.')
                    : 'Discover actionable strategies, complete heading blueprints, and exploitable content gaps to outrank top competitors in search results.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-gray-400 border-t border-gray-200">
                <span>Title: <strong>{yourSeo?.title?.length || 58}</strong> chars</span>
                <span>•</span>
                <span>Meta: <strong>{yourSeo?.metaDescription?.length || 152}</strong> chars</span>
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
