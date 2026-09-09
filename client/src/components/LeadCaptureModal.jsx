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
        let popup = {}
        try {
          if (tool.popupFields) {
            popup = typeof tool.popupFields === 'string' ? JSON.parse(tool.popupFields) : tool.popupFields
          }
        } catch {}

        return {
          name: {
            show: popup.name?.show !== undefined ? popup.name.show : true,
            required: popup.name?.required !== undefined ? popup.name.required : (tool.requireName ?? true),
          },
          email: {
            show: popup.email?.show !== undefined ? popup.email.show : true,
            required: popup.email?.required !== undefined ? popup.email.required : (tool.requireEmail ?? true),
          },
          phone: {
            show: popup.phone?.show !== undefined ? popup.phone.show : true,
            required: popup.phone?.required !== undefined ? popup.phone.required : (tool.requirePhone ?? false),
          },
          company: {
            show: popup.company?.show !== undefined ? popup.company.show : true,
            required: popup.company?.required !== undefined ? popup.company.required : (tool.requireCompany ?? false),
          },
          website: {
            show: popup.website?.show !== undefined ? popup.website.show : true,
            required: popup.website?.required !== undefined ? popup.website.required : false,
          },
        }
      }
    }
    return {
      name: { show: true, required: true },
      email: { show: true, required: true },
      phone: { show: true, required: false },
      company: { show: true, required: false },
      website: { show: true, required: false },
    }
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

  const allFieldDefs = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'Your Name' },
    { name: 'email', label: 'Business Email', type: 'email', placeholder: 'you@company.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 890' },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'Company Name' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
  ]

  const fields = allFieldDefs
    .filter((f) => fieldConfig[f.name]?.show !== false)
    .map((f) => ({
      ...f,
      required: Boolean(fieldConfig[f.name]?.required),
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate only visible and required fields
    for (const f of fields) {
      if (f.required && !form[f.name]?.trim()) {
        setError(`Please provide your ${f.label.toLowerCase()}.`)
        return
      }
    }

    try {
      const payload = { source: toolSlug }
      fields.forEach((f) => {
        if (form[f.name]?.trim()) {
          payload[f.name] = form[f.name].trim()
        }
      })

      await submitLead(payload).unwrap()
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
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
            <div className={fields.length === 1 ? 'space-y-4' : 'grid sm:grid-cols-2 gap-4'}>
              {fields.map((f, idx) => {
                const isSpanTwo = fields.length === 1 || (fields.length % 2 === 1 && idx === fields.length - 1)
                return (
                  <div key={f.name} className={isSpanTwo ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label}
                      {f.required && <span className="text-red-500 font-bold"> *</span>}
                    </label>
                    <input
                      name={f.name}
                      type={f.type}
                      required={f.required}
                      value={form[f.name]}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={f.placeholder}
                    />
                  </div>
                )
              })}
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40 cursor-pointer"
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
