import { useState } from 'react'
import {
  Crown,
  Shield,
  Flame,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Target,
  Zap,
} from 'lucide-react'

export default function StrategicOverviewCard({
  results,
  competitorUrl,
  yourUrl,
  targetKeywords,
}) {
  const [copiedKey, setCopiedKey] = useState(null)

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const exportReportMarkdown = () => {
    if (!results) return
    const lines = [
      `# Competitor Intelligence Report: ${competitorUrl}`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Target Keywords: ${targetKeywords || 'N/A'}`,
      `Head-to-Head with: ${yourUrl || 'Industry Benchmark'}`,
      '',
      `## Executive Strategic Synthesis`,
      results.executiveSummary || '',
      '',
      `## Competitor Current Moat & Advantages`,
      ...(results.competitorMoat || []).map((m) => `- ${m}`),
      '',
      `## Exploitable Competitor Vulnerabilities`,
      ...(results.competitorVulnerabilities || []).map((v) => `- ${v}`),
      '',
      `## 10x Outrank Playbook`,
      ...(results.outrankPlaybook || []).map(
        (p, i) =>
          `${i + 1}. [${p.priority}] ${p.action} (Impact: ${p.impact}, Effort: ${p.effort})\n   Why: ${p.why}`
      ),
      '',
      `## Content Gaps & Information Gain Angles`,
      ...(results.contentGaps || []).map(
        (g) =>
          `- **${g.topic}** (${g.searchIntent || 'Informational'})\n  Angle: ${g.suggestedAngle}\n  Why: ${g.whyImportant}`
      ),
      '',
      `## High-Yield Keyword Opportunities`,
      ...(results.keywordOpportunities || []).map(
        (k) => `- ${k.keyword} [Intent: ${k.intent}, Difficulty: ${k.difficulty}]: ${k.opportunity}`
      ),
      '',
      `## Linkable Assets & Backlink Angles`,
      ...(results.backlinkAngles || []).map(
        (b) => `- **${b.angle}**\n  Target Outreach: ${b.targetOutreach}`
      ),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeHost = (competitorUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'competitor').replace(/[^a-z0-9.-]/gi, '_')
    a.download = `competitor-intel-${safeHost}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportReportCSV = () => {
    if (!results) return
    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`

    const rows = [
      ['Section', 'Item / Keyword', 'Priority / Intent', 'Impact / Difficulty', 'Effort', 'Details / Strategy'],
    ]

    ;(results.outrankPlaybook || []).forEach((p) => {
      rows.push(['Playbook Action', escapeCsv(p.action), escapeCsv(p.priority), escapeCsv(p.impact), escapeCsv(p.effort), escapeCsv(p.why)])
    })

    ;(results.contentGaps || []).forEach((g) => {
      rows.push(['Content Gap', escapeCsv(g.topic), escapeCsv(g.searchIntent), 'High Value', 'Medium', escapeCsv(`Angle: ${g.suggestedAngle} | Why: ${g.whyImportant}`)])
    })

    ;(results.keywordOpportunities || []).forEach((k) => {
      rows.push(['Keyword Target', escapeCsv(k.keyword), escapeCsv(k.intent), escapeCsv(k.difficulty), 'N/A', escapeCsv(k.opportunity)])
    })

    ;(results.backlinkAngles || []).forEach((b) => {
      rows.push(['Backlink Asset', escapeCsv(b.angle), 'Link Building', 'High', 'High', escapeCsv(`Outreach: ${b.targetOutreach}`)])
    })

    const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeHost = (competitorUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'competitor').replace(/[^a-z0-9.-]/gi, '_')
    a.download = `competitor-intel-${safeHost}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyExecutiveSummary = () => {
    const summaryText = `Competitive Intelligence Brief: ${competitorUrl}
Executive Summary:
${results.executiveSummary || ''}

Competitor Moat:
${(results.competitorMoat || []).map((m) => `• ${m}`).join('\n')}

Exploitable Vulnerabilities:
${(results.competitorVulnerabilities || []).map((v) => `• ${v}`).join('\n')}
`
    triggerCopy(summaryText, 'exec-summary')
  }

  const keywordList = targetKeywords
    ? targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header section with badge and actions */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-5 pb-5 border-b border-gray-100">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0C81F3] border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Strategic Intelligence Summary
            </span>
            {results.competitorSeo?.stats?.overallBenchmark && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                Competitor Strength:{' '}
                <strong className="text-gray-900">
                  {results.competitorSeo.stats.overallBenchmark}/100
                </strong>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
            Competitor Moat & Vulnerability Assessment
          </h3>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {results.executiveSummary}
          </p>

          {keywordList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <Target className="w-3 h-3 text-[#0C81F3]" /> Focus Queries:
              </span>
              {keywordList.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={exportReportMarkdown}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold transition-all hover:opacity-95 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report (.md)</span>
          </button>

          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={copyExecutiveSummary}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedKey === 'exec-summary' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copy Brief</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={exportReportCSV}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Moat vs Vulnerabilities 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Competitor Moat Card */}
        <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Their Current Advantages (Moat)</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Moat
              </span>
            </div>
            <ul className="space-y-2">
              {(results.competitorMoat || []).map((m, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-emerald-950 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-emerald-600 font-bold shrink-0">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-emerald-800/70 mt-3 pt-2.5 border-t border-emerald-200/60">
            Acknowledge these strengths when crafting your counter-strategy.
          </p>
        </div>

        {/* Competitor Vulnerabilities Card */}
        <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-sm">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Exploitable Weaknesses (Where You Win)</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                Entry Points
              </span>
            </div>
            <ul className="space-y-2">
              {(results.competitorVulnerabilities || []).map((v, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-rose-950 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-rose-600 font-bold shrink-0">•</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-rose-800/70 mt-3 pt-2.5 border-t border-rose-200/60 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Focus your 10x content directly on these areas to outrank them.
          </p>
        </div>
      </div>
    </div>
  )
}
