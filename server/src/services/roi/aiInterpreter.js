import { callAIAndParseJSON, getConfiguredProviders } from '../../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are an expert SEO business consultant. You interpret SEO ROI calculator results and provide strategic business insights.

Rules:
- NEVER guarantee revenue, traffic, or rankings
- NEVER change the calculated numbers
- NEVER present assumptions as facts
- Use language: "potential", "estimated", "modeled", "projected"
- Focus on which levers have the biggest business impact
- Provide actionable measurement recommendations
- Return ONLY valid JSON, no markdown, no code fences
- Do NOT include <think> tags or reasoning in your output. Output ONLY the raw JSON object.`

function buildPrompt(data) {
  return `Interpret these SEO ROI calculator results and provide business insights.

## Input Parameters
- Monthly Traffic: ${data.input.monthlyTraffic.toLocaleString()}
- Baseline Leads: ${data.input.baselineLeads.toLocaleString()}/mo
- Customer Value: ${data.currency}${data.input.averageCustomerValue.toLocaleString()}
- SEO Investment: ${data.currency}${data.input.monthlySeoInvestment.toLocaleString()}/mo
- Campaign: ${data.input.campaignMonths} months
- Organic Conversion Rate: ${(data.input.organicConversionRate * 100).toFixed(1)}%
- Lead-to-Customer Rate: ${(data.input.leadToCustomerRate * 100).toFixed(1)}%

## Scenario Results (at campaign end)
Conservative (${(data.conservative.growthRate * 100).toFixed(0)}% growth): ROI ${data.conservative.summary.roi}%, Additional Revenue ${data.currency}${data.conservative.summary.additionalRevenue.toLocaleString()}
Moderate (${(data.moderate.growthRate * 100).toFixed(0)}% growth): ROI ${data.moderate.summary.roi}%, Additional Revenue ${data.currency}${data.moderate.summary.additionalRevenue.toLocaleString()}
Aggressive (${data.aggressive.growthRate * 100}% growth): ROI ${data.aggressive.summary.roi}%, Additional Revenue ${data.currency}${data.aggressive.summary.additionalRevenue.toLocaleString()}

## Break-Even: ${data.breakEvenMonth ? `Month ${data.breakEvenMonth}` : 'Not within campaign period'}

## Sensitivity
${data.sensitivity.map(s => `${s.factor}: ${s.level} impact`).join('\n')}

Return JSON:
{
  "executive_summary": "2-3 sentence business interpretation",
  "key_insights": ["3-5 key takeaways"],
  "largest_levers": [{ "factor": "", "explanation": "" }],
  "risks": ["array of risks to consider"],
  "recommendations": ["actionable recommendations"],
  "measurement_plan": ["what to measure and track"],
  "seo_strategy_notes": ["strategy considerations"]
}`
}

function validateAIReport(data) {
  return {
    executive_summary: typeof data.executive_summary === 'string' ? data.executive_summary : 'SEO ROI analysis complete.',
    key_insights: Array.isArray(data.key_insights) ? data.key_insights : [],
    largest_levers: Array.isArray(data.largest_levers) ? data.largest_levers : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    measurement_plan: Array.isArray(data.measurement_plan) ? data.measurement_plan : [],
    seo_strategy_notes: Array.isArray(data.seo_strategy_notes) ? data.seo_strategy_notes : [],
  }
}

function generateFallback(data) {
  const moderateROI = data.moderate.summary.roi
  const breakEven = data.breakEvenMonth ? `around month ${data.breakEvenMonth}` : 'beyond the campaign period'

  return {
    executive_summary: `Based on your assumptions, the moderate scenario models a ${moderateROI}% estimated ROI over ${data.input.campaignMonths} months, with break-even ${breakEven}. The actual results will depend on market conditions, competition, implementation quality, and other factors.`,
    key_insights: [
      `The moderate scenario projects a ${data.moderate.summary.roi}% estimated ROI over the campaign period.`,
      `Customer value (${data.currency}${data.input.averageCustomerValue.toLocaleString()}) is a significant driver of ROI.`,
      `Converting ${(data.input.organicConversionRate * 100).toFixed(1)}% of organic visitors to leads is a key assumption.`,
      `The sensitivity analysis shows which factors most impact your results.`,
    ],
    largest_levers: data.sensitivity.slice(0, 3).map(s => ({
      factor: s.factor,
      explanation: `Changing ${s.factor.toLowerCase()} by 20% has a ${s.level.toLowerCase()} impact on estimated ROI.`,
    })),
    risks: [
      'SEO results take time — early months may show minimal returns.',
      'Competition and algorithm changes can affect actual traffic growth.',
      'These estimates assume consistent investment and implementation quality.',
      'Actual conversion rates may vary by traffic source and landing page quality.',
    ],
    recommendations: [
      'Track actual organic traffic, conversion rates, and revenue monthly.',
      'Set up proper attribution to measure SEO-driven conversions.',
      'Review and adjust assumptions after 3 months of actual data.',
      'Consider investing in conversion rate optimization alongside SEO.',
    ],
    measurement_plan: [
      'Track organic traffic growth in Google Analytics.',
      'Monitor lead volume and conversion rates by channel.',
      'Measure revenue attributed to organic search.',
      'Review keyword rankings for target terms monthly.',
    ],
    seo_strategy_notes: [
      'Focus on high-intent commercial keywords for faster ROI.',
      'Build content authority in your core topic areas.',
      'Improve technical SEO to maximize crawl efficiency.',
      'Invest in conversion rate optimization to amplify traffic value.',
    ],
  }
}

export async function interpretROI(data) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — using fallback ROI report')
    return generateFallback(data)
  }

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(data) },
    ], { temperature: 0.3, maxTokens: 4000, jsonMode: true })

    console.log('✓ AI ROI interpretation complete')
    return validateAIReport(parsed)
  } catch (err) {
    console.error('AI ROI interpretation failed:', err.message)
    return generateFallback(data)
  }
}
