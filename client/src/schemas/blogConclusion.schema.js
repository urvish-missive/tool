import { z } from 'zod'

export const blogConclusionSchema = z.object({
  topic: z
    .string()
    .min(3, 'Blog topic or title must be at least 3 characters')
    .max(300, 'Topic must be under 300 characters'),
  intro: z.string().max(5000, 'Introduction must be under 5,000 characters').optional().default(''),
  keyTakeaways: z.string().max(1000, 'Takeaways must be under 1,000 characters').optional().default(''),
  ctaGoal: z
    .enum(['demo', 'trial', 'lead_magnet', 'internal_link', 'comment', 'custom'])
    .default('demo'),
  ctaCustomText: z.string().max(200).optional().default(''),
  funnelStage: z
    .enum(['all', 'tofu', 'mofu', 'bofu'])
    .default('all'),
  targetKeywords: z.string().max(500).optional().default(''),
  targetAudience: z.string().max(300).optional().default(''),
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
  numVariations: z.number().min(3).max(9).default(6),
})

export function parseBlogConclusionForm(data) {
  try {
    const parsed = blogConclusionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return { success: false, error: firstError?.message || 'Invalid form inputs' }
    }
    return { success: true, data: parsed.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
