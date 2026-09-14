import { useEffect, useRef, useCallback } from 'react'

/**
 * useScrollReveal — adds .revealed class when element enters viewport.
 *
 * Usage:
 *   const ref = useScrollReveal()
 *   <div ref={ref} className="lp-reveal">...</div>
 *
 * Stagger children:
 *   <div ref={ref} className="lp-reveal lp-stagger">
 *     <div className="lp-reveal-child">...</div>  ← animates with delay
 *   </div>
 */
export default function useScrollReveal(options = {}) {
  const elementRef = useRef(null)
  const observerRef = useRef(null)

  const threshold = options.threshold ?? 0.15
  const rootMargin = options.rootMargin ?? '0px 0px -40px 0px'

  const observeElement = useCallback(
    (el) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (!el) return

      // If browser doesn't support IntersectionObserver, reveal immediately
      if (typeof window === 'undefined' || !window.IntersectionObserver) {
        el.classList.add('revealed')
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('revealed')
            // Stagger children if present
            const children = el.querySelectorAll('.lp-reveal-child')
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * 0.1}s`
              child.classList.add('revealed')
            })
            observer.unobserve(el)
          }
        },
        { threshold, rootMargin }
      )

      observer.observe(el)
      observerRef.current = observer
    },
    [threshold, rootMargin]
  )

  useEffect(() => {
    if (elementRef.current) {
      observeElement(elementRef.current)
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [observeElement])

  // Support both ref={ref} as object and callback
  const refCallback = useCallback(
    (node) => {
      elementRef.current = node
      if (node) {
        observeElement(node)
      }
    },
    [observeElement]
  )

  // Attach .current for compatibility with components reading ref.current
  Object.defineProperty(refCallback, 'current', {
    get: () => elementRef.current,
    set: (node) => {
      elementRef.current = node
      if (node) {
        observeElement(node)
      }
    },
    configurable: true,
  })

  return refCallback
}

