import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 * Automatically scrolls window to (0, 0) whenever the route path changes,
 * ensuring users always see the destination tool starting from its hero section.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    // If there is an explicit hash anchor, scroll to it; otherwise always scroll to the very top (hero section)
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Scroll window immediately to top (hero section)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname, search, hash])

  return null
}
