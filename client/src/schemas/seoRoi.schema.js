import { z } from 'zod'

export const seoRoiSchema = z.object({
  traffic: z.coerce.number().min(100, 'Traffic must be at least 100.').max(100000000),
  leads: z.coerce.number().min(0).max(10000000),
  customerValue: z.coerce.number().min(1, 'Customer value must be at least 1.').max(10000000),
  investment: z.coerce.number().min(100, 'Investment must be at least 100.').max(10000000),
  duration: z.coerce.number().refine(v => [3, 6, 12, 24].includes(v), 'Duration must be 3, 6, 12, or 24 months.'),
  currency: z.enum(['USD', 'GBP', 'EUR', 'INR', 'AUD', 'CAD', 'AED']).default('USD'),
  preferredProvider: z.enum(['openrouter', 'gemini', 'groq']).default('openrouter'),
})

export function parseSeoRoiForm(data) {
  const result = seoRoiSchema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { success: false, error: firstError.message }
  }
  return { success: true, data: result.data }
}
