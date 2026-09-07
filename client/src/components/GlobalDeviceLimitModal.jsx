import { useState, useEffect } from 'react'
import DeviceLimitModal from './DeviceLimitModal'

export default function GlobalDeviceLimitModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [limitData, setLimitData] = useState(null)

  useEffect(() => {
    const handleDeviceLimit = (event) => {
      if (event?.detail) {
        setLimitData(event.detail)
        setIsOpen(true)
      }
    }

    window.addEventListener('seo:device-limit-reached', handleDeviceLimit)
    window.addEventListener('seo:device-blocked', handleDeviceLimit)
    return () => {
      window.removeEventListener('seo:device-limit-reached', handleDeviceLimit)
      window.removeEventListener('seo:device-blocked', handleDeviceLimit)
    }
  }, [])

  return (
    <DeviceLimitModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      limitData={limitData}
    />
  )
}
