import { z } from 'zod'

export const blogIntroSchema = z.object({
  topic: z
    .string()
    .min(2, 'Blog topic or title must be at least 2 characters')
    .max(300, 'Topic must be under 300 characters'),
  funnelStage: z
    .enum(['all', 'tofu', 'mofu', 'bofu'])
    .default('all'),
  targetKeywords: z.string().max(500).optional().default(''),
  targetAudience: z.string().max(300).optional().default(''),
  tone: z
    .enum([
      'conversational',
      'authoritative',
      'storytelling',
      'fun',
      'bold',
      'empathetic',
      'witty',
      'data-driven',
    ])
    .default('conversational'),
  count: z.number().min(3).max(18).default(9),
})

export function parseBlogIntroForm(data) {
  try {
    const parsed = blogIntroSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return { success: false, error: firstError?.message || 'Invalid form inputs' }
    }
    return { success: true, data: parsed.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
