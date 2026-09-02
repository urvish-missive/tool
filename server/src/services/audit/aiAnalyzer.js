import { extractAndCleanJSON, clampScore } from '../../utils/helpers.js'
import { callAIAndParseJSON, getConfiguredProviders } from '../../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are a principal technical SEO architect and web performance consultant.
You interpret comprehensive crawler audit data and formulate crystal-clear, developer-ready remediation steps and strategic roadmaps.

Rules:
- Base all recommendations strictly on the provided audit data.
- Never make false guarantees about search rankings.
- Provide concrete, copy-pasteable HTML/Schema/robots code snippets where applicable.
- Prioritize issues accurately by real-world indexing and ranking impact.
- Return ONLY valid JSON, no markdown outside JSON.`

function buildUserPrompt(d) {
  const sortedIssues = [...d.allIssues]
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })
    .slice(0, 20)

  const issueSummary = sortedIssues
    .map(i => `[${i.severity}] ${i.title}: ${i.description}`)
    .join('\n')

  return `Analyze this technical SEO audit and generate an action-oriented remediation plan:

Target URL: ${d.targetUrl}
Total Pages Crawled: ${d.totalPages}
Overall Health Score: ${d.overallScore}/100

Score Breakdown:
- Technical SEO: ${d.technicalScore}/100
- On-Page Metadata: ${d.onPageScore}/100
- Content Quality: ${d.contentScore}/100
- Performance / Page Speed Indicators: ${d.performanceScore}/100
- Indexability & Crawlability: ${d.indexabilityScore}/100
- Internal & External Link Equity: ${d.linksScore}/100
- Structured Data / Schema: ${d.structuredDataScore}/100

Detailed Issues:
${issueSummary}

On-Page Summary:
- Missing Titles: ${d.onpageSummary.missingTitles}
- Missing Descriptions: ${d.onpageSummary.missingDescriptions}
- Missing H1s: ${d.onpageSummary.missingH1}
- Images Without Alt: ${d.onpageSummary.imagesWithoutAlt}

Schema Summary:
- Schema Types Detected: ${d.schemaSummary.schemasFound.join(', ') || 'None'}
- Pages with Schema: ${d.schemaSummary.pagesWithSchema}/${d.totalPages}

Return a JSON object with this EXACT structure:
{
  "executive_summary": "2-3 sentence overview of the website's technical health and primary growth blockers.",
  "overall_assessment": "One clear diagnostic sentence summarizing overall search readiness.",
  "top_priorities": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "issue": "Specific issue",
      "why_it_matters": "Search engine impact",
      "recommended_action": "Exact step to resolve"
    }
  ],
  "quick_fix_snippets": [
    {
      "title": "Fix Name (e.g. Missing Canonical & Viewport Meta)",
      "language": "html|json|plaintext",
      "code": "Ready to paste code snippet"
    }
  ],
  "strengths": ["string array of 3-5 existing technical strengths"],
  "strategic_opportunities": ["string array of 3-5 high-leverage opportunities"],
  "quick_wins": ["string array of 3-5 quick wins completed in under 15 mins"],
  "thirty_day_plan": [
    { "week": 1, "theme": "Critical Indexation & Technical Fixes", "tasks": ["task 1", "task 2"] },
    { "week": 2, "theme": "Metadata & Accessibility Remediation", "tasks": ["task 1", "task 2"] },
    { "week": 3, "theme": "Content Depth & Schema Injection", "tasks": ["task 1", "task 2"] },
    { "week": 4, "theme": "Internal Link Equity & Verification", "tasks": ["task 1", "task 2"] }
  ]
}`
}

function validateAIReport(report, d) {
  const fallback = generateFallbackAIReport(d)

  const rawSnippets = report.quick_fix_snippets || report.quickFixSnippets || report.snippets || report.code_snippets || report.codeSnippets
  const snippets = Array.isArray(rawSnippets) && rawSnippets.length > 0
    ? rawSnippets
    : fallback.quick_fix_snippets

  const rawPlan = report.thirty_day_plan || report.thirtyDayPlan || report.sprint_plan || report.action_plan
  const plan = Array.isArray(rawPlan) && rawPlan.length > 0
    ? rawPlan
    : fallback.thirty_day_plan

  return {
    executive_summary: typeof report.executive_summary === 'string' && report.executive_summary.trim() ? report.executive_summary : fallback.executive_summary,
    overall_assessment: typeof report.overall_assessment === 'string' && report.overall_assessment.trim() ? report.overall_assessment : fallback.overall_assessment,
    top_priorities: Array.isArray(report.top_priorities) && report.top_priorities.length > 0 ? report.top_priorities : fallback.top_priorities,
    quick_fix_snippets: snippets,
    strengths: Array.isArray(report.strengths) && report.strengths.length > 0 ? report.strengths : fallback.strengths,
    strategic_opportunities: Array.isArray(report.strategic_opportunities) && report.strategic_opportunities.length > 0 ? report.strategic_opportunities : fallback.strategic_opportunities,
    quick_wins: Array.isArray(report.quick_wins) && report.quick_wins.length > 0 ? report.quick_wins : fallback.quick_wins,
    thirty_day_plan: plan,
  }
}

function generateFallbackAIReport(d) {
  const { allIssues, overallScore, onpageSummary } = d
  const critical = allIssues.filter(i => i.severity === 'CRITICAL')

  const strengths = []
  if (d.technicalScore >= 75) strengths.push('Solid core technical HTTP response and server status')
  if (onpageSummary.missingTitles === 0) strengths.push('Page title tag is properly declared')
  if (onpageSummary.missingH1 === 0) strengths.push('Primary H1 heading exists')
  if (d.linkSummary.totalInternalLinks > 5) strengths.push('Active internal navigational link equity')
  if (d.schemaSummary.totalSchemas > 0) strengths.push('Structured Schema.org markup is detected')
  if (strengths.length === 0) strengths.push('Website is crawlable and returns valid HTML content')

  const quickWins = []
  if (onpageSummary.missingTitles > 0) quickWins.push(`Add descriptive title tags to ${onpageSummary.missingTitles} page(s)`)
  if (onpageSummary.missingDescriptions > 0) quickWins.push(`Add high-CTR meta descriptions to ${onpageSummary.missingDescriptions} page(s)`)
  if (onpageSummary.imagesWithoutAlt > 0) quickWins.push(`Add ALT text to ${onpageSummary.imagesWithoutAlt} image(s)`)
  if (d.technicalScore < 80) quickWins.push('Implement canonical link headers to prevent duplicate content')
  if (quickWins.length === 0) quickWins.push('Fine-tune meta descriptions with emotional and numerical hooks to increase CTR')

  return {
    executive_summary: `Your website scored ${overallScore}/100 across ${d.totalPages} analyzed page(s). ${critical.length > 0 ? `${critical.length} critical issue(s) require immediate remediation to prevent ranking loss.` : 'No critical blockers found, but several high-impact optimizations will accelerate search rankings.'}`,
    overall_assessment: overallScore >= 80 ? 'Strong technical SEO health with minor refinement opportunities' : overallScore >= 50 ? 'Moderate SEO health — addressing metadata and schema will boost rankings' : 'Urgent technical SEO blockers are inhibiting organic crawl efficiency',
    top_priorities: allIssues.slice(0, 5).map(i => ({
      priority: i.severity === 'CRITICAL' ? 'HIGH' : i.severity,
      issue: i.title,
      why_it_matters: i.description,
      recommended_action: i.recommendation,
    })),
    quick_fix_snippets: [
      {
        title: 'Core Meta & Canonical Template',
        language: 'html',
        code: `<meta name="description" content="Optimized 150-160 char summary of page topic">\n<link rel="canonical" href="${d.targetUrl}">\n<meta property="og:title" content="Page Title">\n<meta property="og:type" content="website">`,
      },
      {
        title: 'Organization Schema.org JSON-LD',
        language: 'json',
        code: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "url": "${d.targetUrl}",\n  "name": "Your Brand Name"\n}`,
      },
    ],
    strengths,
    strategic_opportunities: [
      'Implement Schema.org FAQPage and Article structured data',
      'Optimize image assets with descriptive keyword-rich ALT tags',
      'Strengthen contextual internal links between related service pages',
    ],
    quick_wins: quickWins,
    thirty_day_plan: [
      { week: 1, theme: 'Critical Crawl & Canonical Fixes', tasks: ['Fix 4xx/5xx status codes', 'Ensure self-referencing canonical links', 'Fix title tags'] },
      { week: 2, theme: 'Metadata & Accessibility', tasks: ['Add missing meta descriptions', 'Ensure image ALT tags', 'Validate single H1 per page'] },
      { week: 3, theme: 'Structured Data & Rich Snippets', tasks: ['Implement JSON-LD Schema', 'Validate with Google Rich Results Tool', 'Add Open Graph tags'] },
      { week: 4, theme: 'Internal Link Silos & Verification', tasks: ['Audit anchor text distribution', 'Re-run full site audit to verify fixes'] },
    ],
  }
}

export async function generateAIReport(auditData, options = {}) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    return generateFallbackAIReport(auditData)
  }

  try {
    const prompt = buildUserPrompt(auditData)
    const result = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], {
      preferredProvider: options.preferredProvider,
      temperature: 0.3,
      maxTokens: 5000,
      jsonMode: true,
    })

    return validateAIReport(result, auditData)
  } catch (err) {
    console.error('Audit AI Report generation error:', err.message)
    return generateFallbackAIReport(auditData)
  }
}

export const analyzeAuditWithAI = generateAIReport
