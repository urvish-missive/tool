import { z } from 'zod'

export const eeatSchema = z
  .object({
    mode: z.enum(['url', 'text']).default('url'),
    url: z.string().optional().default(''),
    content: z.string().optional().default(''),
    title: z.string().max(300).optional().default(''),
    contentType: z
      .enum([
        'auto',
        'technical_commercial',
        'product_review',
        'high_sensitivity_ymyl',
        'educational_guide',
        'news_analysis',
        // Legacy aliases
        'b2b_saas',
        'review',
        'ymyl',
        'guide',
        'news',
      ])
      .default('auto'),
    targetKeywords: z.string().max(500).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'url') {
      const val = data.url?.trim() || ''
      if (val.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['url'],
          message: 'Please enter a valid website or article URL (e.g. https://example.com/blog/seo-guide).',
        })
      }
    } else {
      const val = data.content?.trim() || ''
      if (val.length < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content'],
          message: 'Please paste at least 50 characters of article content or draft text.',
        })
      }
    }
  })

export function parseEeatForm(data) {
  try {
    const parsed = eeatSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return { success: false, error: firstError?.message || 'Invalid form input' }
    }
    return { success: true, data: parsed.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
