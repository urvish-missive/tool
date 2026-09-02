import { useMemo } from 'react'
import { useGetPublicToolsQuery } from '../services/apiSlice'

/**
 * Hook to get the admin-configured form field visibility for a specific tool using RTK Query.
 *
 * @param {string} toolSlug - e.g. 'content-analyzer'
 * @returns {{ fields: Object, isFieldEnabled: (fieldKey: string) => boolean, getFieldConfig: (fieldKey: string) => Object, loading: boolean }}
 */
export default function useToolFields(toolSlug) {
  const { data, isLoading } = useGetPublicToolsQuery()

  const fields = useMemo(() => {
    if (data?.success && data?.tools) {
      const tool = data.tools.find(t => t.slug === toolSlug)
      if (tool?.formFields) {
        try {
          return typeof tool.formFields === 'string' ? JSON.parse(tool.formFields) : tool.formFields
        } catch {
          return {}
        }
      }
    }
    return {}
  }, [data, toolSlug])

  const isFieldEnabled = (fieldKey) => {
    if (!fields[fieldKey]) return true
    return fields[fieldKey].enabled !== false
  }

  const getFieldConfig = (fieldKey) => {
    return fields[fieldKey] || { enabled: true, label: fieldKey, required: false }
  }

  return { fields, isFieldEnabled, getFieldConfig, loading: isLoading }
}
