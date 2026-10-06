/**
 * Extension identity.
 *
 * The existing backend has no end-user accounts: usage is metered per
 * anonymous device ID sent in the `x-device-id` header (see
 * server/src/middleware/toolAccess.js), with an optional email linked to the
 * device to request more free analyses. The extension reuses exactly that
 * model, so it is subject to the same per-device limits and admin controls
 * (block / custom limit) as the website.
 *
 * The device ID is a random UUID. It is not a credential and grants nothing
 * beyond the free quota, so chrome.storage.local is an appropriate place for it.
 */

const DEVICE_ID_KEY = 'missive_device_id'
const LINKED_EMAIL_KEY = 'missive_linked_email'

let cached: string | null = null

export async function getDeviceId(): Promise<string> {
  if (cached) return cached
  const stored = await chrome.storage.local.get(DEVICE_ID_KEY)
  const existing = stored[DEVICE_ID_KEY]
  if (typeof existing === 'string' && existing.length >= 8) {
    cached = existing
    return existing
  }
  const id = crypto.randomUUID()
  await chrome.storage.local.set({ [DEVICE_ID_KEY]: id })
  cached = id
  return id
}

export async function getLinkedEmail(): Promise<string | null> {
  const stored = await chrome.storage.local.get(LINKED_EMAIL_KEY)
  return typeof stored[LINKED_EMAIL_KEY] === 'string' ? stored[LINKED_EMAIL_KEY] : null
}

export async function setLinkedEmail(email: string | null): Promise<void> {
  if (email) await chrome.storage.local.set({ [LINKED_EMAIL_KEY]: email })
  else await chrome.storage.local.remove(LINKED_EMAIL_KEY)
}
