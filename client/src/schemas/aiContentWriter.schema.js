import { z } from 'zod'

export const aiContentWriterSchema = z.object({
  keyword: z
    .string()
    .min(2, 'Topic / keyword must be at least 2 characters')
    .max(200, 'Topic / keyword must be under 200 characters'),
  contentType: z.enum([
    'blog-post',
    'product-page',
    'landing-page',
    'pillar-page',
    'listicle',
    'how-to',
    'case-study',
    'email',
  ]).default('blog-post'),
  tone: z.enum([
    'professional',
    'casual',
    'technical',
    'persuasive',
    'educational',
    'conversational',
    'authoritative',
    'friendly',
  ]).default('professional'),
  wordCount: z.number().min(300).max(5000).default(1500),
  targetAudience: z.string().max(300).optional().default(''),
  secondaryKeywords: z.string().max(500).optional().default(''),
  preferredProvider: z.string().default('openrouter'),
})

export function parseAiContentWriterForm(data) {
  try {
    const parsed = aiContentWriterSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return { success: false, error: firstError?.message || 'Invalid form data' }
    }
    return { success: true, data: parsed.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
