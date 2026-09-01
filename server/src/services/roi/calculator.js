/**
 * SEO ROI Calculation Engine — deterministic, no AI.
 * All forecasts are labeled as estimates/assumptions.
 */

export function calculateROI(input) {
  const {
    monthlyTraffic = 10000,
    monthlyLeads = 0,
    averageCustomerValue = 1000,
    leadToCustomerRate = 0.10,
    organicConversionRate = 0.03,
    monthlySeoInvestment = 5000,
    campaignMonths = 12,
    conservativeGrowth = 0.10,
    moderateGrowth = 0.20,
    aggressiveGrowth = 0.35,
    currency = 'USD',
  } = input

  // Calculate derived baseline
  const baselineLeads = monthlyLeads > 0 ? monthlyLeads : Math.round(monthlyTraffic * organicConversionRate)
  const baselineCustomers = Math.round(baselineLeads * leadToCustomerRate)
  const baselineRevenue = baselineCustomers * averageCustomerValue

  // Calculate each scenario
  const conservative = runScenario(monthlyTraffic, baselineLeads, organicConversionRate, leadToCustomerRate, averageCustomerValue, monthlySeoInvestment, campaignMonths, conservativeGrowth)
  const moderate = runScenario(monthlyTraffic, baselineLeads, organicConversionRate, leadToCustomerRate, averageCustomerValue, monthlySeoInvestment, campaignMonths, moderateGrowth)
  const aggressive = runScenario(monthlyTraffic, baselineLeads, organicConversionRate, leadToCustomerRate, averageCustomerValue, monthlySeoInvestment, campaignMonths, aggressiveGrowth)

  // Break-even for moderate scenario
  const breakEvenMonth = findBreakEven(moderate.forecast, monthlySeoInvestment)

  // Sensitivity analysis
  const sensitivity = calculateSensitivity(monthlyTraffic, organicConversionRate, leadToCustomerRate, averageCustomerValue, monthlySeoInvestment, campaignMonths, moderateGrowth)

  return {
    currency,
    input: { monthlyTraffic, baselineLeads, organicConversionRate, leadToCustomerRate, averageCustomerValue, monthlySeoInvestment, campaignMonths },
    conservative,
    moderate,
    aggressive,
    breakEvenMonth,
    sensitivity,
    baseline: { monthlyTraffic, baselineLeads, baselineCustomers, baselineRevenue },
  }
}

function runScenario(traffic, baselineLeads, convRate, custRate, custValue, investment, months, growthRate) {
  const forecast = []
  let cumInvestment = 0
  let cumRevenue = 0

  for (let m = 1; m <= months; m++) {
    const monthlyTraffic = Math.round(traffic * Math.pow(1 + growthRate, m))
    const monthlyLeads = Math.round(monthlyTraffic * convRate)
    const monthlyCustomers = Math.round(monthlyLeads * custRate)
    const monthlyRevenue = monthlyCustomers * custValue
    const additionalTraffic = monthlyTraffic - traffic
    const additionalLeads = monthlyLeads - baselineLeads
    const additionalCustomers = monthlyCustomers - Math.round(baselineLeads * custRate)
    const additionalRevenue = monthlyRevenue - (Math.round(baselineLeads * custRate) * custValue)

    cumInvestment += investment
    cumRevenue += monthlyRevenue

    forecast.push({
      month: m,
      traffic: monthlyTraffic,
      leads: monthlyLeads,
      customers: monthlyCustomers,
      revenue: monthlyRevenue,
      additionalTraffic,
      additionalLeads,
      additionalCustomers,
      additionalRevenue,
      cumInvestment,
      cumRevenue,
    })
  }

  const totalInvestment = investment * months
  const totalRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
  const baselineRevenueTotal = (Math.round(baselineLeads * custRate) * custValue) * months
  const additionalRevenueTotal = totalRevenue - baselineRevenueTotal
  const netReturn = additionalRevenueTotal - totalInvestment
  const roi = totalInvestment > 0 ? Math.round((netReturn / totalInvestment) * 100) : 0

  const lastMonth = forecast[forecast.length - 1]

  return {
    growthRate,
    forecast,
    summary: {
      totalInvestment,
      totalRevenue,
      additionalRevenue: additionalRevenueTotal,
      netReturn,
      roi,
      finalMonthlyTraffic: lastMonth.traffic,
      finalMonthlyLeads: lastMonth.leads,
      finalMonthlyCustomers: lastMonth.customers,
      finalMonthlyRevenue: lastMonth.revenue,
    },
  }
}

function findBreakEven(forecast, monthlyInvestment) {
  let cumInvestment = 0
  let cumAdditionalRevenue = 0
  const baselineRevenue = forecast[0]?.revenue || 0

  for (const f of forecast) {
    cumInvestment += monthlyInvestment
    cumAdditionalRevenue += (f.revenue - baselineRevenue)
    if (cumAdditionalRevenue >= cumInvestment) return f.month
  }
  return null // doesn't break even within campaign
}

function calculateSensitivity(traffic, convRate, custRate, custValue, investment, months, growthRate) {
  const base = runScenario(traffic, Math.round(traffic * convRate), convRate, custRate, custValue, investment, months, growthRate)
  const baseROI = base.summary.roi

  function testChange(param, change) {
    const inputs = { traffic, convRate, custRate, custValue, investment }
    inputs[param] = inputs[param] * (1 + change)
    const leads = Math.round(inputs.traffic * inputs.convRate)
    const result = runScenario(inputs.traffic, leads, inputs.convRate, inputs.custRate, inputs.custValue, inputs.investment, months, growthRate)
    return Math.abs(result.summary.roi - baseROI)
  }

  const factors = [
    { factor: 'Traffic Growth', impact: testChange('traffic', 0.15) },
    { factor: 'Conversion Rate', impact: testChange('convRate', 0.20) },
    { factor: 'Customer Value', impact: testChange('custValue', 0.20) },
    { factor: 'SEO Investment', impact: testChange('investment', -0.20) },
    { factor: 'Lead-to-Customer Rate', impact: testChange('custRate', 0.20) },
  ]

  const maxImpact = Math.max(...factors.map(f => f.impact), 1)

  return factors.map(f => ({
    ...f,
    level: f.impact / maxImpact > 0.7 ? 'High' : f.impact / maxImpact > 0.4 ? 'Medium' : 'Low',
    percentage: Math.round((f.impact / maxImpact) * 100),
  })).sort((a, b) => b.impact - a.impact)
}

export function formatCurrency(amount, currency = 'USD') {
  const symbols = { USD: '$', GBP: '£', EUR: '€', INR: '₹', AUD: 'A$', CAD: 'C$', AED: 'د.إ' }
  const sym = symbols[currency] || '$'
  const abs = Math.abs(amount)
  if (abs >= 10000000) return `${sym}${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${sym}${(abs / 1000).toFixed(0)}K`
  return `${sym}${abs.toLocaleString()}`
}
