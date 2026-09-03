import { z } from 'zod'

export const faqGeneratorSchema = z.object({
  topic: z.string().trim().min(2, 'Topic must be at least 2 characters.').max(200),
  targetKeywords: z.string().trim().max(300).optional().or(z.literal('')),
  count: z.coerce
    .number()
    .refine((v) => [4, 6, 8, 12].includes(v), 'Count must be 4, 6, 8, or 12.'),
  preferredProvider: z.enum(['openrouter', 'gemini', 'gemini-3.5-flash', 'gemini-3.7-flash', 'groq']).default('openrouter'),
})

export function parseFaqGeneratorForm(data) {
  const result = faqGeneratorSchema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { success: false, error: firstError.message }
  }
  return {
    success: true,
    data: {
      ...result.data,
      targetKeywords: result.data.targetKeywords || undefined,
    },
  }
}
