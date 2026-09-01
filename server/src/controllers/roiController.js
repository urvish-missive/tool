import { calculateROI } from '../services/roi/calculator.js'
import { interpretROI } from '../services/roi/aiInterpreter.js'
import { withTimeout } from '../utils/helpers.js'
import prisma from '../utils/prisma.js'

export async function calculateROIHandler(req, res) {
  try {
    const {
      currency = 'USD',
      monthlyTraffic, monthlyLeads, averageCustomerValue,
      leadToCustomerRate, organicConversionRate,
      monthlySeoInvestment, campaignMonths,
      growthScenario = {},
      preferredProvider,
    } = req.body

    // Validate
    if (!monthlyTraffic || monthlyTraffic < 1 || monthlyTraffic > 10000000) {
      return res.status(400).json({ success: false, error: 'Monthly traffic must be between 1 and 10,000,000.' })
    }
    if (!averageCustomerValue || averageCustomerValue < 0) {
      return res.status(400).json({ success: false, error: 'Customer value must be a positive number.' })
    }
    if (monthlySeoInvestment < 0) {
      return res.status(400).json({ success: false, error: 'SEO investment must be non-negative.' })
    }

    const input = {
      currency,
      monthlyTraffic: Math.round(monthlyTraffic),
      monthlyLeads: monthlyLeads ? Math.round(monthlyLeads) : 0,
      averageCustomerValue: parseFloat(averageCustomerValue) || 1000,
      leadToCustomerRate: Math.min(1, Math.max(0, parseFloat(leadToCustomerRate) || 0.10)),
      organicConversionRate: Math.min(1, Math.max(0, parseFloat(organicConversionRate) || 0.03)),
      monthlySeoInvestment: parseFloat(monthlySeoInvestment) || 5000,
      campaignMonths: Math.min(60, Math.max(1, parseInt(campaignMonths) || 12)),
      conservativeGrowth: Math.min(1, Math.max(0, parseFloat(growthScenario.conservative) || 0.10)),
      moderateGrowth: Math.min(1, Math.max(0, parseFloat(growthScenario.moderate) || 0.20)),
      aggressiveGrowth: Math.min(1, Math.max(0, parseFloat(growthScenario.aggressive) || 0.35)),
    }

    console.log(`Calculating ROI for: ${input.monthlyTraffic} visitors, $${input.monthlySeoInvestment}/mo investment`)

    // Deterministic calculation
    const results = calculateROI(input)

    // AI interpretation (optional, with timeout)
    let aiInsights = null
    try {
      aiInsights = await withTimeout(interpretROI(results, { preferredProvider }), 30000, 'AI interpretation')
    } catch {
      console.log('AI interpretation skipped (timeout)')
    }

    // Save to DB
    let calculationId = null
    try {
      const calc = await prisma.rOICalculation.create({
        data: {
          currency, monthlyTraffic: input.monthlyTraffic,
          monthlyLeads: input.monthlyLeads || null,
          averageCustomerValue: input.averageCustomerValue,
          leadToCustomerRate: input.leadToCustomerRate,
          organicConversionRate: input.organicConversionRate,
          monthlySeoInvestment: input.monthlySeoInvestment,
          campaignMonths: input.campaignMonths,
          conservativeGrowth: input.conservativeGrowth,
          moderateGrowth: input.moderateGrowth,
          aggressiveGrowth: input.aggressiveGrowth,
          resultJson: JSON.stringify({ results, aiInsights }),
        },
      })
      calculationId = calc.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    console.log(`✓ ROI calculated — moderate: ${results.moderate.summary.roi}%`)
    res.json({ success: true, calculationId, results, aiInsights })
  } catch (err) {
    console.error('ROI calculation error:', err.message)
    res.status(500).json({ success: false, error: 'Calculation failed. Please try again.' })
  }
}
