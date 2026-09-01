import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

/**
 * Hook to get the admin-configured form field visibility for a specific tool.
 *
 * @param {string} toolSlug - e.g. 'content-analyzer'
 * @returns {{ fields: Object, isFieldEnabled: (fieldKey: string) => boolean, getFieldConfig: (fieldKey: string) => Object, loading: boolean }}
 *
 * Usage:
 *   const { isFieldEnabled } = useToolFields('content-analyzer')
 *   {isFieldEnabled('secondaryKeywords') && <input ... />}
 */
export default function useToolFields(toolSlug) {
  const [fields, setFields] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchFields = async () => {
      try {
        const res = await fetch(`${API}/tools/public`)
        const data = await res.json()
        if (cancelled) return

        if (data.success) {
          const tool = data.tools.find(t => t.slug === toolSlug)
          if (tool?.formFields) {
            try {
              setFields(JSON.parse(tool.formFields))
            } catch {
              setFields({})
            }
          }
        }
      } catch {
        // Silently fail — fields default to all enabled
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchFields()
    return () => { cancelled = true }
  }, [toolSlug])

  const isFieldEnabled = (fieldKey) => {
    // If no config exists yet (loading or no formFields set), default to enabled
    if (!fields[fieldKey]) return true
    return fields[fieldKey].enabled !== false
  }

  const getFieldConfig = (fieldKey) => {
    return fields[fieldKey] || { enabled: true, label: fieldKey, required: false }
  }

  return { fields, isFieldEnabled, getFieldConfig, loading }
}
