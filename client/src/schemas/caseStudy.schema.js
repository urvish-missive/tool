import { z } from 'zod'

export const caseStudySchema = z.object({
  clientName: z.string().max(120, 'Client name must be under 120 characters').optional().default(''),
  niche: z
    .string()
    .min(2, 'Niche or industry is required (at least 2 characters)')
    .max(200, 'Niche must be under 200 characters'),
  challenge: z
    .string()
    .min(5, 'Please describe the business challenge or bottleneck (at least 5 characters)')
    .max(2500, 'Challenge description must be under 2,500 characters'),
  solution: z
    .string()
    .min(5, 'Please describe the strategic solution or methodology (at least 5 characters)')
    .max(2500, 'Solution description must be under 2,500 characters'),
  metrics: z
    .string()
    .min(2, 'Please provide at least one quantifiable metric or business result')
    .max(1200, 'Metrics text must be under 1,200 characters'),
  targetAudience: z.string().max(300, 'Target audience must be under 300 characters').optional().default(''),
  tone: z
    .enum([
      'authoritative',
      'conversational',
      'storytelling',
      'fun',
      'bold',
      'empathetic',
      'witty',
      'data-driven',
    ])
    .default('authoritative'),
})

export function parseCaseStudyForm(data) {
  try {
    const parsed = caseStudySchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return { success: false, error: firstError?.message || 'Invalid form inputs' }
    }
    return { success: true, data: parsed.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
