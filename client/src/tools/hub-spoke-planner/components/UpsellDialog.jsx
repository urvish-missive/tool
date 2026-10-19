import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'

// "This is part of the upgraded plan" dialog, shown when a locked feature is used.
export default function UpsellDialog({ open, onClose, upgradeUrl }) {
  const ref = useRef(null)
  const [noLink, setNoLink] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setNoLink(false)
      try {
        d.showModal()
      } catch {
        d.setAttribute('open', '')
      }
    } else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      id="upsell"
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="upbox">
        <span className="lockico">
          <Lock aria-hidden="true" />
        </span>
        <h3>This is part of the upgraded plan</h3>
        <ul className="ticks">
          <li>
            We read your website, suggest topics that fit it, and point internal links at your real
            pages
          </li>
          <li>A structured outline for any topic, ready to review, edit, approve and copy</li>
          <li>
            A full first draft written from your approved outline, checked against our content QA
            checklist, with the stats, examples and visuals it needs marked in
          </li>
          <li>The strategy summary: audience, goal and our recommendations</li>
        </ul>
        <div className="row">
          <a
            className="btn grad"
            href={upgradeUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!upgradeUrl) {
                e.preventDefault()
                setNoLink(true)
              }
            }}
          >
            Upgrade to unlock
          </a>
          <button className="btn" type="button" onClick={onClose}>
            Not now
          </button>
        </div>
        {noLink && <span className="help">Upgrade link not connected yet.</span>}
      </div>
    </dialog>
  )
}
