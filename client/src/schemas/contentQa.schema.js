import { z } from 'zod'

export const contentQaSchema = z.object({
  content: z
    .string()
    .trim()
    .min(20, 'Content must be at least 20 characters.')
    .max(50000, 'Content must be under 50,000 characters.'),
  title: z.string().trim().max(200).optional().or(z.literal('')),
  targetKeyword: z.string().trim().max(100).optional().or(z.literal('')),
  platform: z
    .enum(['website', 'linkedin', 'newsletter', 'landing_page', 'social'])
    .default('website'),
  targetAudience: z.string().trim().max(200).optional().or(z.literal('')),
  contentTemplate: z
    .enum(['blog', 'landing_page', 'social', 'newsletter'])
    .default('blog')
    .optional(),
  supportingLineMode: z
    .enum(['recommended', 'required', 'not_applicable'])
    .default('recommended')
    .optional(),
  insightFirstScope: z
    .enum(['DOCUMENT_INTRO', 'SECTION_INTROS', 'ALL_OPENINGS'])
    .default('DOCUMENT_INTRO')
    .optional(),
})

export function parseContentQaForm(data) {
  const result = contentQaSchema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return { success: false, error: firstError.message }
  }
  return {
    success: true,
    data: {
      ...result.data,
      title: result.data.title || undefined,
      targetKeyword: result.data.targetKeyword || undefined,
      targetAudience: result.data.targetAudience || undefined,
      contentTemplate: result.data.contentTemplate || 'blog',
      supportingLineMode: result.data.supportingLineMode || 'recommended',
      insightFirstScope: result.data.insightFirstScope || 'DOCUMENT_INTRO',
    },
  }
}
