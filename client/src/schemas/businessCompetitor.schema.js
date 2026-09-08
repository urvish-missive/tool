import { z } from 'zod'

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/

export const businessCompetitorSchema = z.object({
  competitorUrl: z
    .string()
    .min(1, 'Competitor website URL is required')
    .refine(
      (val) => {
        const cleaned = val.startsWith('http') ? val : `https://${val}`
        try {
          new URL(cleaned)
          return true
        } catch {
          return URL_REGEX.test(val)
        }
      },
      { message: 'Please enter a valid website URL' }
    ),
  companyName: z
    .string()
    .max(200, 'Company name must be under 200 characters')
    .optional()
    .or(z.literal('')),
  industry: z
    .string()
    .max(100, 'Industry must be under 100 characters')
    .optional()
    .or(z.literal('')),
})

export const businessCompetitorLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
})
