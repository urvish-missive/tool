import { useEffect, useRef } from 'react'

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
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

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
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}
