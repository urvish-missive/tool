/**
 * Centralized API URL helper.
 * Resolves API base URL from VITE_API_URL or defaults to Render backend / local fallback.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://tool-2jmg.onrender.com/api'

// Ensure no trailing slash and ends with /api
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '')

/**
 * Returns full API URL for a given relative endpoint path.
 * @param {string} path e.g. '/tools/public' or 'content/analyze'
 */
export function getApiUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  // If path already starts with /api and API_BASE_URL ends with /api, avoid /api/api
  if (cleanPath.startsWith('/api') && API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}${cleanPath.substring(4)}`
  }
  return `${API_BASE_URL}${cleanPath}`
}

export default API_BASE_URL
