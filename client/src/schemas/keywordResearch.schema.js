import { z } from 'zod'
import { normalizeUrl } from '../utils/normalizeUrl'

export const keywordResearchSchema = z
  .object({
    seedKeyword: z
      .string()
      .trim()
      .min(2, 'Keyword must be at least 2 characters.')
      .max(100)
      .optional()
      .or(z.literal('')),
    websiteUrl: z.string().trim().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),
    businessType: z.string().optional().or(z.literal('')),
    preferredProvider: z.enum(['openrouter', 'gemini', 'groq']).default('openrouter'),
  })
  .refine(
    (data) => {
      const hasKeyword = data.seedKeyword && data.seedKeyword.trim().length >= 2
      const hasUrl = data.websiteUrl && data.websiteUrl.trim().length > 0
      return hasKeyword || hasUrl
    },
    {
      message: 'Enter a seed keyword or a website URL (at least one is required).',
      path: ['seedKeyword'],
    }
  )

export function parseKeywordResearchForm(data) {
  const result = keywordResearchSchema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { success: false, error: firstError.message }
  }
  const d = result.data
  const normalizedUrl = d.websiteUrl ? normalizeUrl(d.websiteUrl) : ''
  return {
    success: true,
    data: {
      ...d,
      websiteUrl: normalizedUrl || undefined,
      seedKeyword: d.seedKeyword || undefined,
      country: d.country || undefined,
      businessType: d.businessType || undefined,
    },
  }
}
