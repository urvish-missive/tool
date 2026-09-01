import { useState, useEffect } from 'react'

/**
 * Custom hook to manage lead popup logic for any tool page.
 * Checks if the tool has showLeadPopup enabled, manages popup state.
 *
 * Usage:
 *   const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } = useLeadPopup('content-analyzer')
 *
 * In handleSubmit: if (popupEnabled) { setShowPopup(true); return }
 * In JSX: <LeadCaptureModal show={showPopup} onClose={handlePopupClose} onSubmit={handlePopupSubmit} toolSlug="content-analyzer" ... />
 */
export function useLeadPopup(toolSlug) {
  const [popupEnabled, setPopupEnabled] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    fetch('/api/tools/public')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.tools) {
          const tool = data.tools.find(t => t.slug === toolSlug)
          if (tool?.showLeadPopup) setPopupEnabled(true)
        }
      })
      .catch(() => {})
  }, [toolSlug])

  const handlePopupSubmit = () => {
    setShowPopup(false)
    // Return true so the caller knows to proceed
    return true
  }

  const handlePopupClose = () => {
    setShowPopup(false)
  }

  const triggerPopup = () => {
    setShowPopup(true)
  }

  return { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose, triggerPopup }
}
