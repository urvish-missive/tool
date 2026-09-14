import prisma from './prisma.js'
import { sendPdfEmail } from '../services/emailService.js'

/**
 * Registry of result types wired into the "store PDF at generation time,
 * send later (automatic or manual)" pipeline. Adding a new tool to this
 * pipeline means adding one entry here — the send logic below never
 * hardcodes a specific tool.
 */
export const PDF_SEND_RESULT_TYPES = [
  {
    leadField: 'contentQaId',
    model: 'contentQA',
    toolSlug: 'content-qa',
    getTitle: (r) => r.title || 'Content QA Report',
  },
  {
    leadField: 'blogConclusionId',
    model: 'blogConclusion',
    toolSlug: 'blog-conclusion-generator',
    getTitle: (r) => `Blog Conclusions for "${r.topic}"`,
  },
  {
    leadField: 'auditId',
    model: 'audit',
    toolSlug: 'seo-audit',
    getTitle: (r) => `SEO Audit for ${r.websiteUrl}`,
  },
  {
    leadField: 'blogTopicId',
    model: 'blogTopic',
    toolSlug: 'blog-topics',
    getTitle: (r) => `Blog Topic Strategy for "${r.niche}"`,
  },
  {
    leadField: 'researchId',
    model: 'keywordResearch',
    toolSlug: 'keyword-research',
    getTitle: (r) => `Keyword Research for "${r.seedKeyword}"`,
  },
  {
    leadField: 'roiCalculationId',
    model: 'rOICalculation',
    toolSlug: 'seo-roi',
    getTitle: () => 'Your SEO ROI Projection',
  },
  {
    leadField: 'contentWriterId',
    model: 'contentWriter',
    toolSlug: 'ai-content-writer',
    getTitle: (r) => r.title || 'Your Generated Content',
  },
  {
    leadField: 'businessCompetitorId',
    model: 'businessCompetitor',
    toolSlug: 'business-competitor-analytics',
    getTitle: (r) => `Competitor Analysis: ${r.companyName || r.competitorUrl}`,
  },
  {
    leadField: 'faqId',
    model: 'faqGeneration',
    toolSlug: 'faq-generator',
    getTitle: (r) => `FAQ Guide for "${r.topic}"`,
  },
  {
    leadField: 'competitorAnalysisId',
    model: 'competitorAnalysis',
    toolSlug: 'competitor-analyzer',
    getTitle: (r) => `Competitor Analysis vs ${r.competitorUrl}`,
  },
  {
    leadField: 'eeatAnalysisId',
    model: 'eeatAnalysis',
    toolSlug: 'eeat-analyzer',
    getTitle: (r) => `E-E-A-T Analysis for "${r.targetKeyword || r.url || 'Your Content'}"`,
  },
  {
    leadField: 'caseStudyId',
    model: 'caseStudy',
    toolSlug: 'case-study-generator',
    getTitle: (r) => `Case Study: ${r.companyName || 'Your Business'}`,
  },
  {
    leadField: 'blogIntroId',
    model: 'blogIntro',
    toolSlug: 'blog-intro-generator',
    getTitle: (r) => `Blog Intros for "${r.topic}"`,
  },
]

// Whitelist of model names the generic store-pdf endpoint is allowed to
// write to — derived from the registry above so it can never write to an
// unrelated Prisma model even if a client sent an unexpected value.
export const PDF_STORABLE_MODELS = new Set(PDF_SEND_RESULT_TYPES.map((t) => t.model))

// Every Lead field that links to a registered result type — used by
// leadController.js to accept/link any of these generically instead of
// hardcoding each tool's field name.
export const LEAD_RESULT_FIELDS = PDF_SEND_RESULT_TYPES.map((t) => t.leadField)

function resolveResultType(lead) {
  return PDF_SEND_RESULT_TYPES.find((t) => lead[t.leadField])
}

/**
 * Sends the already-stored PDF for a lead's linked result, and records the
 * outcome (sent/failed + timestamp + error) back onto the lead. Shared by
 * both the automatic send-on-capture path (leadController.js) and the
 * manual admin "Send" button (adminController.js) — same logic, different
 * trigger, so the recorded status is trustworthy regardless of which one
 * fired it.
 */
export async function sendStoredPdfForLead(lead, triggeredBy) {
  const resultType = resolveResultType(lead)
  if (!resultType) {
    return { success: false, error: 'This lead has no linked result to send a PDF for.' }
  }

  const result = await prisma[resultType.model].findUnique({ where: { id: lead[resultType.leadField] } })
  const pdfBase64 = result?.pdfBase64
  if (!pdfBase64) {
    return { success: false, error: 'No PDF has been generated for this result yet.' }
  }

  try {
    await sendPdfEmail({
      to: lead.email,
      name: lead.name,
      reportTitle: resultType.getTitle(result),
      pdfBuffer: Buffer.from(pdfBase64, 'base64'),
      filename: `missive-report-${Date.now()}.pdf`,
    })
    await prisma.lead.update({
      where: { id: lead.id },
      data: { pdfSendStatus: 'sent', pdfSentAt: new Date(), pdfSendError: null, pdfSendTriggeredBy: triggeredBy },
    })
    return { success: true, status: 'sent', sentTo: lead.email }
  } catch (sendErr) {
    const errorMessage = sendErr.message || 'Failed to send email.'
    await prisma.lead.update({
      where: { id: lead.id },
      data: { pdfSendStatus: 'failed', pdfSentAt: new Date(), pdfSendError: errorMessage, pdfSendTriggeredBy: triggeredBy },
    })
    return { success: false, status: 'failed', sentTo: lead.email, error: errorMessage }
  }
}

/**
 * Whether automatic send-on-capture is enabled for the tool a lead was just
 * captured on, based on its linked result type's registered toolSlug.
 */
export async function shouldAutoSendForLead(lead) {
  const resultType = resolveResultType(lead)
  if (!resultType) return false
  const toolConfig = await prisma.toolConfig.findUnique({ where: { slug: resultType.toolSlug } })
  return toolConfig?.pdfSendMode === 'automatic'
}
