import { useState, useEffect, useMemo } from 'react'
import { useSubmitLeadMutation, useGetPublicToolsQuery } from '../services/apiSlice'

const DEFAULT_CONFIG = {
  requireName: true,
  requireEmail: true,
  requirePhone: false,
  requireCompany: false,
}

/**
 * LeadCaptureModal — shows as a popup before tool use
 * Props:
 *  - show: boolean to control visibility
 *  - onClose: called when user clicks X or backdrop (only if not required)
 *  - onSubmit: called after successful lead submission (unlocks the tool)
 *  - toolSlug: which tool config to fetch
 *  - title: modal title
 *  - subtitle: modal description
 */
export default function LeadCaptureModal({ show, onClose, onSubmit, toolSlug, title, subtitle }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', phone: '' })
  const [submitLead, { isLoading }] = useSubmitLeadMutation()
  const { data: toolsData } = useGetPublicToolsQuery()
  const [error, setError] = useState('')
  const [leadCaptured, setLeadCaptured] = useState(false)

  const fieldConfig = useMemo(() => {
    if (toolsData?.success && toolsData?.tools) {
      const tool = toolsData.tools.find((t) => t.slug === toolSlug)
      if (tool) {
        return {
          requireName: tool.requireName ?? true,
          requireEmail: tool.requireEmail ?? true,
          requirePhone: tool.requirePhone ?? false,
          requireCompany: tool.requireCompany ?? false,
        }
      }
    }
    return DEFAULT_CONFIG
  }, [toolsData, toolSlug])

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setForm({ name: '', email: '', company: '', website: '', phone: '' })
      setError('')
      setLeadCaptured(false)
    }
  }, [show])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await submitLead({ ...form, source: toolSlug }).unwrap()
      setLeadCaptured(true)
      // Auto-close after brief success animation
      setTimeout(() => {
        onSubmit?.()
      }, 800)
    } catch (err) {
      setError(err?.data?.error || 'Something went wrong. Please try again.')
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  if (!show) return null

  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: fieldConfig.requireName, col: true },
    {
      name: 'email',
      label: 'Business Email',
      type: 'email',
      required: fieldConfig.requireEmail,
      col: true,
    },
    {
      name: 'company',
      label: 'Company',
      type: 'text',
      required: fieldConfig.requireCompany,
      col: true,
    },
    { name: 'website', label: 'Website', type: 'url', required: false, col: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: fieldConfig.requirePhone, col: false },
  ]

  if (leadCaptured) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-500 text-sm">Loading your results...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        {/* Gradient header */}
        <div
          className="relative h-2"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)' }}
        />

        <div className="p-6 sm:p-8">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-3 tracking-wide uppercase">
              Free Tool
            </span>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {title || 'Get Your Free Results'}
            </h2>
            <p className="text-sm text-gray-500">
              {subtitle || 'Enter your details to unlock this free SEO tool'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.name} className={!f.col ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                    {f.required && ' *'}
                  </label>
                  <input
                    name={f.name}
                    type={f.type}
                    required={f.required}
                    value={form[f.name]}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={
                      f.type === 'email'
                        ? 'you@company.com'
                        : f.type === 'tel'
                          ? '+1 234 567 890'
                          : ''
                    }
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40"
            >
              {isLoading ? 'Submitting...' : 'Unlock Free Tool →'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Your information is secure. We'll only use it to provide you with better results.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
