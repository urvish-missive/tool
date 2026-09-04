import { z } from 'zod'
import { normalizeUrl } from '../utils/normalizeUrl'

const urlField = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return false
      const normalized = normalizeUrl(val)
      try {
        const parsed = new URL(normalized)
        return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.')
      } catch {
        return false
      }
    },
    { message: 'Please enter a valid website URL (e.g. example.com or https://example.com)' }
  )

export const seoAuditSchema = z.object({
  websiteUrl: urlField,
  preferredProvider: z.enum(['openrouter', 'gemini', 'gemini-3.5-flash', 'gemini-3.7-flash', 'groq']).default('openrouter'),
})

export function parseSeoAuditForm(data) {
  const result = seoAuditSchema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { success: false, error: firstError.message }
  }
  const normalized = normalizeUrl(result.data.websiteUrl)
  return {
    success: true,
    data: {
      ...result.data,
      websiteUrl: normalized,
    },
  }
}
