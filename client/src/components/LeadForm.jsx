import { useState, useMemo } from 'react'
import { useSubmitLeadMutation, useGetPublicToolsQuery } from '../services/apiSlice'

const DEFAULT_CONFIG = { requireEmail: true, requireName: true, requirePhone: false, requireCompany: false }

export default function LeadForm({ analysisId, toolSlug = 'content-analyzer' }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', phone: '' })
  const [submitLead, { isLoading }] = useSubmitLeadMutation()
  const { data: toolsData } = useGetPublicToolsQuery()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const fieldConfig = useMemo(() => {
    if (toolsData?.success && toolsData?.tools) {
      const tool = toolsData.tools.find(t => t.slug === toolSlug)
      if (tool) {
        return {
          requireEmail: tool.requireEmail ?? true,
          requireName: tool.requireName ?? true,
          requirePhone: tool.requirePhone ?? false,
          requireCompany: tool.requireCompany ?? false,
        }
      }
    }
    return DEFAULT_CONFIG
  }, [toolsData, toolSlug])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await submitLead({ ...form, analysisId }).unwrap()
      setSubmitted(true)
    } catch (err) {
      setError(err?.data?.error || 'Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-800">Thank you!</h3>
        <p className="text-green-700 mt-1">We'll be in touch within 24 hours with your free SEO strategy.</p>
      </div>
    )
  }

  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: fieldConfig.requireName, col: true },
    { name: 'email', label: 'Business Email', type: 'email', required: fieldConfig.requireEmail, col: true },
    { name: 'company', label: 'Company', type: 'text', required: fieldConfig.requireCompany, col: true },
    { name: 'website', label: 'Website', type: 'url', required: false, col: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: fieldConfig.requirePhone, col: false },
  ].filter(f => f.required || form[f.name])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.name} className={!f.col ? 'sm:col-span-2' : ''}>
            <label htmlFor={`lead-${f.name}`} className="block text-sm font-medium text-gray-700 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={`lead-${f.name}`}
              name={f.name}
              type={f.type}
              required={f.required}
              value={form[f.name]}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isLoading}
        className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40">
        {isLoading ? 'Submitting...' : 'Get My SEO Strategy'}
      </button>
    </form>
  )
}
