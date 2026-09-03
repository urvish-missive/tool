import { useState, useMemo } from 'react'
import { useGetPublicToolsQuery } from '../services/apiSlice'

/**
 * Custom hook to manage lead popup logic for any tool page using RTK Query.
 *
 * Usage:
 *   const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } = useLeadPopup('content-analyzer')
 *
 * In handleSubmit: if (popupEnabled) { setShowPopup(true); return }
 * In JSX: <LeadCaptureModal show={showPopup} onClose={handlePopupClose} onSubmit={handlePopupSubmit} toolSlug="content-analyzer" ... />
 */
export function useLeadPopup(toolSlug) {
  const [showPopup, setShowPopup] = useState(false)
  const { data } = useGetPublicToolsQuery()

  const popupEnabled = useMemo(() => {
    if (data?.success && data?.tools) {
      const tool = data.tools.find((t) => t.slug === toolSlug)
      return Boolean(tool?.showLeadPopup)
    }
    return false
  }, [data, toolSlug])

  const handlePopupSubmit = () => {
    setShowPopup(false)
    return true
  }

  const handlePopupClose = () => {
    setShowPopup(false)
  }

  const triggerPopup = () => {
    setShowPopup(true)
  }

  return {
    popupEnabled,
    showPopup,
    setShowPopup,
    handlePopupSubmit,
    handlePopupClose,
    triggerPopup,
  }
}
