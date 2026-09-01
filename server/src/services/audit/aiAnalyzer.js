import { extractAndCleanJSON, clampScore } from '../../utils/helpers.js'
import { callAIAndParseJSON, getConfiguredProviders } from '../../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are an expert SEO consultant. You interpret technical SEO audit data and provide professional, actionable recommendations.

Rules:
- Base all recommendations on the provided audit data
- Never make false guarantees about rankings
- Use professional language: "potential issue", "recommended improvement", "likely opportunity"
- Be specific and actionable, not generic
- Prioritize based on actual SEO impact
- Return ONLY valid JSON, no markdown, no code fences
- Do NOT include <think> tags or reasoning in your output. Output ONLY the raw JSON object.`

function buildUserPrompt(d) {
  // Limit issues to top 20 (CRITICAL/HIGH first) to stay under token limits
  const sortedIssues = [...d.allIssues]
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })
    .slice(0, 20)

  const issueSummary = sortedIssues
    .map(i => `[${i.severity}] ${i.title}`)
    .join('\n')

  return `Analyze this SEO audit and provide strategic recommendations.

URL: ${d.targetUrl} | Pages: ${d.totalPages} | Score: ${d.overallScore}/100
Scores — Tech: ${d.technicalScore} | On-Page: ${d.onPageScore} | Content: ${d.contentScore} | Perf: ${d.performanceScore} | Index: ${d.indexabilityScore} | Links: ${d.linksScore} | Schema: ${d.structuredDataScore}
Issues (${d.allIssues.length} total, top ${sortedIssues.length} shown):
${issueSummary}
On-Page: ${d.onpageSummary.missingTitles} missing titles, ${d.onpageSummary.missingDescriptions} missing desc, ${d.onpageSummary.missingH1} missing H1, ${d.onpageSummary.imagesWithoutAlt} images w/o alt
Links: ${d.linkSummary.totalInternalLinks} internal, ${d.linkSummary.totalExternalLinks} external
Schema: ${d.schemaSummary.schemasFound.join(', ') || 'None'} on ${d.schemaSummary.pagesWithSchema}/${d.totalPages} pages

Return JSON:
{
  "executive_summary": "2-3 sentence overview",
  "overall_assessment": "One sentence",
  "top_priorities": [{ "priority": "HIGH|MEDIUM|LOW", "issue": "", "why_it_matters": "", "recommended_action": "" }],
  "strengths": ["string array"],
  "strategic_opportunities": ["string array"],
  "quick_wins": ["string array"],
  "thirty_day_plan": [{ "week": 1, "tasks": ["task"] }, { "week": 2, "tasks": ["task"] }, { "week": 3, "tasks": ["task"] }, { "week": 4, "tasks": ["task"] }]
}`
}

function validateAIReport(report, d) {
  return {
    executive_summary: typeof report.executive_summary === 'string' ? report.executive_summary : `Website scored ${d.overallScore}/100.`,
    overall_assessment: typeof report.overall_assessment === 'string' ? report.overall_assessment : 'Analysis complete.',
    top_priorities: Array.isArray(report.top_priorities) ? report.top_priorities : [],
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    strategic_opportunities: Array.isArray(report.strategic_opportunities) ? report.strategic_opportunities : [],
    quick_wins: Array.isArray(report.quick_wins) ? report.quick_wins : [],
    thirty_day_plan: Array.isArray(report.thirty_day_plan) ? report.thirty_day_plan : [],
  }
}

function generateFallbackAIReport(d) {
  const { allIssues, overallScore, onpageSummary } = d
  const critical = allIssues.filter(i => i.severity === 'CRITICAL')
  const high = allIssues.filter(i => i.severity === 'HIGH')

  const strengths = []
  if (d.technicalScore >= 80) strengths.push('Strong technical SEO foundation')
  if (onpageSummary.missingTitles === 0) strengths.push('All pages have title tags')
  if (onpageSummary.missingH1 === 0) strengths.push('All pages have H1 tags')
  if (d.linkSummary.totalInternalLinks > 10) strengths.push('Good internal linking')
  if (d.schemaSummary.totalSchemas > 0) strengths.push('Structured data implemented')
  if (strengths.length === 0) strengths.push('Website is accessible and returns valid HTML')

  const quickWins = []
  if (onpageSummary.missingTitles > 0) quickWins.push(`Add title tags to ${onpageSummary.missingTitles} page(s)`)
  if (onpageSummary.missingDescriptions > 0) quickWins.push(`Add meta descriptions to ${onpageSummary.missingDescriptions} page(s)`)
  if (onpageSummary.imagesWithoutAlt > 0) quickWins.push(`Add ALT text to ${onpageSummary.imagesWithoutAlt} image(s)`)
  if (onpageSummary.multipleH1 > 0) quickWins.push(`Fix ${onpageSummary.multipleH1} page(s) with multiple H1 tags`)
  if (d.technicalScore < 80) quickWins.push('Address technical SEO issues')
  if (quickWins.length === 0) quickWins.push('Optimize meta descriptions for better click-through rates')

  return {
    executive_summary: `Your website scored ${overallScore}/100 across ${d.totalPages} page(s). ${critical.length > 0 ? `${critical.length} critical issue(s) need attention.` : 'No critical issues found.'}`,
    overall_assessment: overallScore >= 80 ? 'Good SEO foundation with minor improvements' : overallScore >= 50 ? 'Moderate SEO health — several areas need improvement' : 'Significant SEO issues that need attention',
    top_priorities: allIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').slice(0, 5).map(i => ({
      priority: i.severity === 'CRITICAL' ? 'HIGH' : i.severity, issue: i.title, why_it_matters: i.description, recommended_action: i.recommendation,
    })),
    strengths,
    strategic_opportunities: ['Improve content depth on thin pages', 'Strengthen internal linking', 'Add structured data for key content types', 'Optimize meta descriptions'],
    quick_wins: quickWins,
    thirty_day_plan: [
      { week: 1, tasks: ['Fix critical technical issues', 'Add missing title tags', 'Add missing meta descriptions'] },
      { week: 2, tasks: ['Add ALT text to images', 'Fix H1 issues', 'Address canonical problems'] },
      { week: 3, tasks: ['Improve internal linking', 'Expand thin content', 'Add structured data'] },
      { week: 4, tasks: ['Optimize Open Graph tags', 'Review page speed', 'Monitor improvements'] },
    ],
  }
}

export async function analyzeAuditWithAI(auditData) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — using fallback audit report')
    return generateFallbackAIReport(auditData)
  }

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(auditData) },
    ], { temperature: 0.3, maxTokens: 8000, jsonMode: true, preferredProvider: auditData.preferredProvider })

    console.log('✓ AI audit analysis complete')
    return validateAIReport(parsed, auditData)
  } catch (err) {
    console.error(`AI audit analysis failed: ${err.message}`)
    return generateFallbackAIReport(auditData)
  }
}
