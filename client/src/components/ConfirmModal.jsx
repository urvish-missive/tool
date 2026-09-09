import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, HelpCircle, Loader2, X } from 'lucide-react'

/**
 * Reusable Confirmation Modal to replace native JS confirm() boxes
 * 
 * Props:
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Cancel/Close callback
 * @param {function} onConfirm - Confirm action callback (can return a Promise)
 * @param {string} [title] - Modal heading
 * @param {string|React.ReactNode} [message] - Description / warning text
 * @param {string} [confirmText] - Confirm button label (default 'Confirm')
 * @param {string} [cancelText] - Cancel button label (default 'Cancel')
 * @param {'danger'|'warning'|'primary'} [variant] - Visual theme (default 'danger')
 * @param {boolean} [isLoading] - External loading indicator
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const [internalLoading, setInternalLoading] = useState(false)

  const busy = isLoading || internalLoading

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, busy, onClose])

  if (!isOpen) return null

  const handleConfirmClick = async () => {
    if (busy) return
    try {
      setInternalLoading(true)
      await onConfirm?.()
    } finally {
      setInternalLoading(false)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-50 border-amber-100',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
        }
      case 'primary':
        return {
          icon: <HelpCircle className="w-6 h-6 text-[#0C81F3]" />,
          iconBg: 'bg-blue-50 border-blue-100',
          confirmBtn: 'bg-[#0C81F3] hover:bg-[#0b74da] text-white focus:ring-[#0C81F3]',
        }
      case 'danger':
      default:
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-50 border-red-100',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!busy) onClose?.()
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            variant === 'danger'
              ? 'bg-red-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : 'bg-[#0C81F3]'
          }`}
        />

        {/* Close button */}
        {!busy && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${styles.iconBg}`}
          >
            {styles.icon}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {title}
            </h3>
            <div className="mt-1.5 text-xs text-gray-600 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleConfirmClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${styles.confirmBtn} cursor-pointer`}
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
