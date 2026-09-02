import { callAIAndParseJSON, getConfiguredProviders } from '../../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are a C-suite financial consultant and enterprise SEO economist.
You interpret SEO ROI financial models, diagnose critical growth levers, and formulate executive business cases for leadership and investors.

Rules:
- NEVER guarantee exact revenues, traffic, or search rankings.
- NEVER alter the calculated mathematical figures.
- Frame projections as diagnostic financial modeling under specified assumptions.
- Provide strategic, high-leverage business guidance (CAC reduction, LTV compounding, conversion multiplier).
- Return ONLY valid JSON, no markdown outside JSON.`

function buildPrompt(data) {
  return `Interpret these modeled SEO ROI calculator results and generate an executive business case.

## Input Parameters:
- Baseline Monthly Traffic: ${data.input.monthlyTraffic.toLocaleString()}
- Baseline Leads: ${data.input.baselineLeads.toLocaleString()}/mo
- Average Customer Value (LTV): ${data.currency}${data.input.averageCustomerValue.toLocaleString()}
- Monthly SEO Investment: ${data.currency}${data.input.monthlySeoInvestment.toLocaleString()}/mo
- Total Campaign Horizon: ${data.input.campaignMonths} months
- Organic Traffic-to-Lead Conversion Rate: ${(data.input.organicConversionRate * 100).toFixed(1)}%
- Lead-to-Customer Close Rate: ${(data.input.leadToCustomerRate * 100).toFixed(1)}%

## Projected Scenarios:
- Conservative (${(data.conservative.growthRate * 100).toFixed(0)}% traffic growth): ROI ${data.conservative.summary.roi}%, Additional Revenue ${data.currency}${data.conservative.summary.additionalRevenue.toLocaleString()}, Net Profit ${data.currency}${data.conservative.summary.netReturn.toLocaleString()}
- Moderate (${(data.moderate.growthRate * 100).toFixed(0)}% traffic growth): ROI ${data.moderate.summary.roi}%, Additional Revenue ${data.currency}${data.moderate.summary.additionalRevenue.toLocaleString()}, Net Profit ${data.currency}${data.moderate.summary.netReturn.toLocaleString()}
- Aggressive (${(data.aggressive.growthRate * 100).toFixed(0)}% traffic growth): ROI ${data.aggressive.summary.roi}%, Additional Revenue ${data.currency}${data.aggressive.summary.additionalRevenue.toLocaleString()}, Net Profit ${data.currency}${data.aggressive.summary.netReturn.toLocaleString()}

## Break-Even Milestone:
${data.breakEvenMonth ? `Month ${data.breakEvenMonth}` : 'Beyond initial campaign horizon'}

## Sensitivity Levers:
${data.sensitivity.map(s => `${s.factor}: ${s.level} sensitivity impact`).join('\n')}

Return a JSON object with this EXACT structure:
{
  "cSuitePitch": "1-sentence punchy elevator pitch for CFO/CEO justifying the investment",
  "executive_summary": "2-3 sentence strategic executive summary of modeled returns and profitability timeline.",
  "key_insights": ["3-5 high-impact business takeaways"],
  "phasedRoadmap": [
    {
      "phase": "Phase 1: Foundation & Early Momentum (Months 1-3)",
      "focus": "What gets built and measured",
      "expectedOutcome": "Expected milestone indicator"
    },
    {
      "phase": "Phase 2: Compounding Authority & Net Profit (Months 4+)",
      "focus": "How traffic scales and customer acquisition cost drops",
      "expectedOutcome": "Compounding margin expansion"
    }
  ],
  "largest_levers": [
    {
      "factor": "Factor Name",
      "explanation": "Why this lever multiplies ROI the most"
    }
  ],
  "paidSearchComparison": "Brief context on how this organic customer acquisition cost compares to recurring PPC ad spend.",
  "risks": ["2-4 operational or market risks to monitor"],
  "recommendations": ["3-5 concrete action recommendations"],
  "measurement_plan": ["Specific KPI attribution checkpoints"]
}`
}

function validateAIReport(data, defaultData) {
  return {
    cSuitePitch: typeof data.cSuitePitch === 'string' ? data.cSuitePitch : 'SEO operates as a capital asset that compounds customer acquisition efficiency over time.',
    executive_summary: typeof data.executive_summary === 'string' ? data.executive_summary : 'SEO ROI analysis complete.',
    key_insights: Array.isArray(data.key_insights) ? data.key_insights : [],
    phasedRoadmap: Array.isArray(data.phasedRoadmap) ? data.phasedRoadmap : [
      {
        phase: 'Phase 1: Foundation (Months 1-3)',
        focus: 'Technical audits, high-intent bottom-funnel pages, and conversion rate optimization',
        expectedOutcome: 'Early ranking momentum and lead velocity improvements',
      },
      {
        phase: 'Phase 2: Compounding Returns (Months 4+)',
        focus: 'Topical authority expansion and brand-building link acquisition',
        expectedOutcome: 'Break-even reached and diminishing cost per acquisition',
      },
    ],
    largest_levers: Array.isArray(data.largest_levers) ? data.largest_levers : [],
    paidSearchComparison: typeof data.paidSearchComparison === 'string' ? data.paidSearchComparison : 'Unlike paid search ads which stop generating leads the moment ad spend halts, organic SEO builds permanent domain equity and lowers blended CAC.',
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    measurement_plan: Array.isArray(data.measurement_plan) ? data.measurement_plan : [],
  }
}

function generateFallback(data) {
  const moderateROI = data.moderate.summary.roi
  const breakEven = data.breakEvenMonth ? `Month ${data.breakEvenMonth}` : 'Months 6-12'

  return {
    cSuitePitch: `Investing ${data.currency}${data.input.monthlySeoInvestment.toLocaleString()}/mo in organic SEO models an estimated ${moderateROI}% ROI, building permanent brand equity while drastically reducing blended customer acquisition costs.`,
    executive_summary: `Under the moderate projection, your campaign models ${data.currency}${data.moderate.summary.additionalRevenue.toLocaleString()} in incremental revenue over ${data.input.campaignMonths} months, reaching break-even around ${breakEven}. The model indicates strong upside potential driven primarily by your average customer value (${data.currency}${data.input.averageCustomerValue.toLocaleString()}).`,
    key_insights: [
      `The moderate scenario projects ${data.moderate.summary.roi}% ROI with ${data.currency}${data.moderate.summary.netReturn.toLocaleString()} in net profit above the investment.`,
      `Customer lifetime value of ${data.currency}${data.input.averageCustomerValue.toLocaleString()} creates substantial margin for compounding search gains.`,
      `A 20% improvement in conversion rate delivers a disproportionate increase in net revenue.`,
      `SEO creates durable organic equity that continues generating pipeline beyond the active campaign horizon.`,
    ],
    phasedRoadmap: [
      {
        phase: 'Phase 1: Foundation & Quick Wins (Months 1-3)',
        focus: 'Technical infrastructure, high-intent commercial landing page optimization, and CRO fixes.',
        expectedOutcome: 'Stabilized baseline, accelerated indexation, and early lead conversion velocity.',
      },
      {
        phase: 'Phase 2: Compounding Scale & Break-Even (Months 4+)',
        focus: 'Topical authority cluster publishing and authority link acquisition.',
        expectedOutcome: `Break-even achieved around ${breakEven} with declining cost-per-lead.`,
      },
    ],
    largest_levers: data.sensitivity.slice(0, 3).map(s => ({
      factor: s.factor,
      explanation: `Optimizing ${s.factor.toLowerCase()} by 20% creates a ${s.level.toLowerCase()} financial impact on overall program returns.`,
    })),
    paidSearchComparison: `Unlike Google Ads where traffic ceases immediately when spend stops, organic search acts as a capital investment that continues driving leads with zero incremental cost-per-click.`,
    risks: [
      'Search engine algorithm volatility may cause temporary traffic fluctuations.',
      'Lag time between technical deployment and ranking realization (typically 60-90 days).',
      'Assumes sales closing rates remain consistent as lead volume scales.',
    ],
    recommendations: [
      'Prioritize bottom-of-funnel, high-commercial-intent keywords first for accelerated cash flow.',
      'Implement multi-touch conversion tracking in Google Analytics 4 and CRM.',
      'Pair organic SEO with landing page conversion rate optimization (CRO) to maximize traffic value.',
    ],
    measurement_plan: [
      'Track monthly organic search impressions and qualified goal completions.',
      'Measure Organic Pipeline Generated and Closed-Won Revenue in CRM.',
      'Audit search visibility for target commercial keyword clusters bi-weekly.',
    ],
  }
}

export async function interpretROIWithAI(calculatorResults, options = {}) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    return generateFallback(calculatorResults)
  }

  try {
    const prompt = buildPrompt(calculatorResults)
    const result = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], {
      preferredProvider: options.preferredProvider,
      temperature: 0.3,
      maxTokens: 4000,
      jsonMode: true,
    })

    return validateAIReport(result, calculatorResults)
  } catch (err) {
    console.error('AI ROI Interpretation failed, using fallback:', err.message)
    return generateFallback(calculatorResults)
  }
}

export const interpretROI = interpretROIWithAI
