import { z } from 'zod'

export const hubSpokeSchema = z
  .object({
    input: z.string().trim().max(2000),
    info: z.string().trim().max(3000).optional().or(z.literal('')),
    url: z.string().trim().max(300).optional().or(z.literal('')),
  })
  .superRefine((v, ctx) => {
    if (v.url && !/^(https?:\/\/)?[^\s/.]+\.[^\s]+$/i.test(v.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message:
          'That does not look like a website address. Try something like https://www.yourwebsite.com',
      })
    }
  })

// hasSource: an uploaded file can stand in for the topic
export function parseHubSpokeForm(data, { hasSource = false } = {}) {
  const result = hubSpokeSchema.safeParse(data)
  if (!result.success) return { success: false, error: result.error.issues[0].message }
  let url = result.data.url || ''
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
  if (!result.data.input && !url && !hasSource)
    return { success: false, error: 'Please type a topic, keyword or brief first.' }
  return { success: true, data: { input: result.data.input, info: result.data.info || '', url } }
}
