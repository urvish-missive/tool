import { useState } from 'react'
import { Crown, Shield, Flame, Download, Copy, Check, FileSpreadsheet, Sparkles, Target } from 'lucide-react'

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

    // Playbook items
    ;(results.outrankPlaybook || []).forEach((p) => {
      rows.push(['Playbook Action', escapeCsv(p.action), escapeCsv(p.priority), escapeCsv(p.impact), escapeCsv(p.effort), escapeCsv(p.why)])
    })

    // Content Gaps
    ;(results.contentGaps || []).forEach((g) => {
      rows.push(['Content Gap', escapeCsv(g.topic), escapeCsv(g.searchIntent), 'High Value', 'Medium', escapeCsv(`Angle: ${g.suggestedAngle} | Why: ${g.whyImportant}`)])
    })

    // Keywords
    ;(results.keywordOpportunities || []).forEach((k) => {
      rows.push(['Keyword Target', escapeCsv(k.keyword), escapeCsv(k.intent), escapeCsv(k.difficulty), 'N/A', escapeCsv(k.opportunity)])
    })

    // Backlinks
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
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Subtle background ambient glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0C81F3]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EB8988]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with badge and actions */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Strategic Intelligence Radar
            </span>
            {results.competitorSeo?.stats?.overallBenchmark && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-semibold">
                Competitor Strength: <strong className="text-white">{results.competitorSeo.stats.overallBenchmark}/100</strong>
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Competitor Moat & Vulnerability Assessment
          </h3>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {results.executiveSummary}
          </p>

          {keywordList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" /> Keywords:
              </span>
              {keywordList.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs font-medium border border-white/5"
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
            onClick={copyExecutiveSummary}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {copiedKey === 'exec-summary' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied Brief!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={exportReportMarkdown}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold transition-all hover:opacity-95 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>

          <button
            type="button"
            onClick={exportReportCSV}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export SpreadSheet (.csv)</span>
          </button>
        </div>
      </div>

      {/* Moat vs Vulnerabilities 2-Column Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
        {/* Competitor Moat Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Competitor's Current Moat</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Their Advantage
              </span>
            </div>
            <ul className="space-y-2.5">
              {(results.competitorMoat || []).map((m, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="text-emerald-400 font-bold text-base leading-none">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-white/5 italic">
            Respect these strengths when crafting your counter-strategy.
          </p>
        </div>

        {/* Competitor Vulnerabilities Card */}
        <div className="bg-rose-950/30 backdrop-blur-sm rounded-2xl p-5 border border-rose-500/30 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Flame className="w-4 h-4" />
                <span>Exploitable Vulnerabilities</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-500/30">
                Your Entry Points
              </span>
            </div>
            <ul className="space-y-2.5">
              {(results.competitorVulnerabilities || []).map((v, i) => (
                <li
                  key={i}
                  className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="text-rose-400 font-bold text-base leading-none">•</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-4 pt-3 border-t border-rose-500/10 font-semibold">
            ⚡ Focus your 10x content directly on these weaknesses to outrank them.
          </p>
        </div>
      </div>
    </div>
  )
}
