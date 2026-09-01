import { calculateCategoryScore, countSeverities, clampScore } from '../../utils/helpers.js'

const WEIGHTS = {
  technical: 0.25, onPage: 0.20, content: 0.20,
  performance: 0.15, indexability: 0.10, links: 0.05, structuredData: 0.05,
}

export function calculateScores(technicalResult, onpageResult, linkResult, schemaResult, crawlData) {
  const allIssues = [...technicalResult.issues, ...onpageResult.issues, ...linkResult.issues, ...schemaResult.issues]
  const allSeverities = countSeverities(allIssues)

  const technicalScore = calculateCategoryScore(technicalResult.checks, technicalResult.issues.length, countSeverities(technicalResult.issues))
  const onPageScore = calculateCategoryScore(null, onpageResult.issues.length, countSeverities(onpageResult.issues))
  const contentScore = clampScore(100 - (onpageResult.summary.thinContentPages * 10))
  const performanceScore = 75 // default — no external API yet
  const indexabilityScore = calculateCategoryScore(
    { indexability: technicalResult.checks.indexability }, 0,
    countSeverities(technicalResult.issues.filter(i => i.title?.includes('index')))
  )
  const linksScore = calculateCategoryScore(null, linkResult.issues.length, countSeverities(linkResult.issues))
  const structuredDataScore = calculateCategoryScore(null, schemaResult.issues.length, countSeverities(schemaResult.issues))

  const overallScore = Math.round(
    technicalScore * WEIGHTS.technical + onPageScore * WEIGHTS.onPage +
    contentScore * WEIGHTS.content + performanceScore * WEIGHTS.performance +
    indexabilityScore * WEIGHTS.indexability + linksScore * WEIGHTS.links +
    structuredDataScore * WEIGHTS.structuredData
  )

  return {
    overallScore: clampScore(overallScore),
    technicalScore, onPageScore, contentScore, performanceScore,
    indexabilityScore, linksScore, structuredDataScore,
    allIssues, severityCounts: allSeverities,
  }
}
