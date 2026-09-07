/**
 * Persistent Device ID Generator & Storage
 * Ensures the same browser/device maintains a consistent identity across sessions.
 */

const DEVICE_ID_KEY = 'seo_device_id'

export function getOrCreateDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (deviceId && typeof deviceId === 'string' && deviceId.length >= 8) {
      return deviceId
    }

    // Generate a unique device identifier
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID()
    } else {
      deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)
    }

    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    return deviceId
  } catch (err) {
    console.warn('LocalStorage unavailable for device ID:', err)
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 10)
  }
}
