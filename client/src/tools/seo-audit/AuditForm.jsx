import { useState } from 'react'
import ModelSelector from '../shared/ModelSelector'

const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'Other']

export default function AuditForm({ onSubmit, isLoading }) {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [country, setCountry] = useState('')
  const [aiModel, setAiModel] = useState('openrouter')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!websiteUrl.trim()) {
      setError('Please enter a website URL.')
      return
    }

    try {
      const parsed = new URL(websiteUrl.trim())
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('Please enter a valid HTTP or HTTPS URL.')
        return
      }
    } catch {
      setError('Please enter a valid website URL (e.g. https://example.com)')
      return
    }

    onSubmit({
      websiteUrl: websiteUrl.trim(),
      targetKeyword: targetKeyword.trim() || undefined,
      country: country || undefined,
      preferredProvider: aiModel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5">
      {/* Website URL */}
      <div>
        <label htmlFor="website-url" className="block text-sm font-semibold text-gray-900 mb-1">Website URL *</label>
        <input
          id="website-url"
          type="url"
          required
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Target Keyword */}
      <div>
        <label htmlFor="audit-keyword" className="block text-sm font-semibold text-gray-900 mb-1">Target Keyword (optional)</label>
        <input
          id="audit-keyword"
          type="text"
          value={targetKeyword}
          onChange={(e) => setTargetKeyword(e.target.value)}
          placeholder="e.g. enterprise SEO services"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Country + AI Model */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="audit-country" className="block text-sm font-semibold text-gray-900 mb-1">Country / Market (optional)</label>
          <select
            id="audit-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Select country...</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <ModelSelector value={aiModel} onChange={setAiModel} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={isLoading}
        className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40">
        {isLoading ? 'Analyzing...' : 'Analyze My Website'}
      </button>
    </form>
  )
}
