import { z } from 'zod'

const COUNTRIES = ['US', 'GB', 'IN', 'CA', 'AU', 'DE', 'FR', 'AE', 'SG', 'NL']

export const googleRankCheckerSchema = z
  .object({
    domain: z
      .string()
      .min(1, 'Target domain is required')
      .min(3, 'Domain must be at least 3 characters')
      .refine(
        (val) => {
          // Allow domain with or without protocol
          const cleaned = val
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .split('?')[0]
          return cleaned.includes('.') && cleaned.length >= 4
        },
        { message: 'Please enter a valid domain (e.g. example.com)' }
      ),
    keyword: z.string().optional(),
    batchKeywords: z.string().optional(),
    country: z.enum(COUNTRIES, { message: 'Please select a valid country' }),
    device: z.enum(['desktop', 'mobile'], { message: 'Please select a device type' }),
  })
  .refine(
    (data) => {
      // Either keyword or batchKeywords must be provided
      const hasKeyword = data.keyword && data.keyword.trim().length > 0
      const hasBatch = data.batchKeywords && data.batchKeywords.trim().length > 0
      return hasKeyword || hasBatch
    },
    { message: 'Please enter at least one keyword', path: ['keyword'] }
  )

export const googleRankCheckerBatchSchema = z.object({
  domain: z
    .string()
    .min(1, 'Target domain is required')
    .min(3, 'Domain must be at least 3 characters')
    .refine(
      (val) => {
        const cleaned = val
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0]
          .split('?')[0]
        return cleaned.includes('.') && cleaned.length >= 4
      },
      { message: 'Please enter a valid domain (e.g. example.com)' }
    ),
  batchKeywords: z
    .string()
    .min(1, 'Please enter at least one keyword')
    .refine(
      (val) => {
        const lines = val
          .split(/[\n,]+/)
          .map((l) => l.trim())
          .filter(Boolean)
        return lines.length >= 1
      },
      { message: 'Please enter at least one keyword (one per line)' }
    ),
  country: z.enum(COUNTRIES, { message: 'Please select a valid country' }),
  device: z.enum(['desktop', 'mobile'], { message: 'Please select a device type' }),
})
