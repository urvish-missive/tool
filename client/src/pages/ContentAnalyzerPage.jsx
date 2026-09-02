import { useState, useRef, useCallback, useEffect } from 'react'
import LoadingProgress from '../components/LoadingProgress'
import { useAnalyzeContentMutation } from '../services/apiSlice'
import AIAnalyticsSection from '../components/AIAnalyticsSection'
import DynamicLeadForm from '../components/DynamicLeadForm'
import LeadCaptureModal from '../components/LeadCaptureModal'
import { useLeadPopup } from '../components/useLeadPopup'
import ModelSelector from '../tools/shared/ModelSelector'
import useToolFields from '../hooks/useToolFields'

const CONTENT_TYPES = ['Blog Post', 'Landing Page', 'Product Page', 'Service Page', 'Article', 'Other']
const SEARCH_INTENTS = ['Auto Detect', 'Informational', 'Commercial', 'Transactional', 'Navigational']
const LOADING_STEPS = ['reading', 'structure', 'seo', 'intent', 'recs', 'report']

export default function ContentAnalyzerPage() {
  // Form state (local — UI only)
  const [content, setContent] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [secondaryKeywords, setSecondaryKeywords] = useState('')
  const [contentType, setContentType] = useState('Blog Post')
  const [searchIntent, setSearchIntent] = useState('Auto Detect')
  const [aiModel, setAiModel] = useState('openrouter')
  const [validationError, setValidationError] = useState('')

  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit: onPopupSubmit, handlePopupClose, triggerPopup } = useLeadPopup('content-analyzer')

  // Admin-controlled field visibility
  const { isFieldEnabled } = useToolFields('content-analyzer')

  // RTK Query mutation
  const [analyzeContent, { isLoading, isError, error, data }] = useAnalyzeContentMutation()

  const report = data?.report || null
  const analysisId = data?.analysisId || null
  const status = isLoading ? 'loading' : isError ? 'error' : report ? 'success' : 'idle'

  const charCount = content.length

  // Loading progress
  const [loadingStep, setLoadingStep] = useState('reading')
  const formRef = useRef(null)

  // Simulate loading progress
  const simulateProgress = useCallback(() => {
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx < LOADING_STEPS.length) {
        setLoadingStep(LOADING_STEPS[idx])
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    // Validate only visible required fields
    if (isFieldEnabled('content')) {
      if (!content.trim()) {
        setValidationError('Please enter your content.')
        return
      }
      if (content.trim().length < 100) {
        setValidationError(`Content must be at least 100 characters. Currently ${content.trim().length}.`)
        return
      }
      if (content.trim().length > 50000) {
        setValidationError('Content must be under 50,000 characters.')
        return
      }
    }

    // Show lead popup if enabled
    if (popupEnabled) {
      triggerPopup()
      return
    }

    setLoadingStep('reading')
    runAnalysis()
  }

  // Scroll to report when data arrives
  useEffect(() => {
    if (report) {
      setTimeout(() => {
        document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [report])

  const handlePopupSubmit = () => {
    onPopupSubmit()
    setLoadingStep('reading')
    runAnalysis()
  }

  const runAnalysis = useCallback(async () => {
    const secondaryKws = secondaryKeywords
      ? secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : []
    const stopProgress = simulateProgress()
    try {
      await analyzeContent({
        content: content.trim(),
        targetKeyword: targetKeyword.trim() || undefined,
        secondaryKeywords: secondaryKws.length > 0 ? secondaryKws : undefined,
        contentType,
        searchIntent,
        preferredProvider: aiModel,
      }).unwrap()
      stopProgress()
    } catch {
      stopProgress()
    }
  }, [content, targetKeyword, secondaryKeywords, contentType, searchIntent, aiModel, analyzeContent, simulateProgress])

  const handleReset = () => {
    setContent('')
    setTargetKeyword('')
    setSecondaryKeywords('')
    setContentType('Blog Post')
    setSearchIntent('Auto Detect')
    setValidationError('')
    setLoadingStep('reading')
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const errorMessage = error?.data?.error || (isError ? "We couldn't complete the analysis right now. Please try again in a moment." : '')

    return (
    <div>
        {/* Lead Capture Modal */}
        <LeadCaptureModal
          show={showPopup}
          onClose={handlePopupClose}
          onSubmit={handlePopupSubmit}
          toolSlug="content-analyzer"
          title="Get Your Free SEO Analysis"
          subtitle="Enter your details to unlock the Content Analyzer"
        />

        {/* Hero */}
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free SEO Tool</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="text-gray-900">AI SEO </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Content Analyzer</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Analyze your content and discover how to improve its SEO, readability, structure, search intent and overall content quality.
            </p>
          </div>
        </section>

        {/* Analyzer Form */}
        <section ref={formRef} className="py-8 sm:py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {status === 'idle' && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-6">
                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-1">Content *</label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    placeholder="Paste your article, blog post, or page content here..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y min-h-[200px]"
                  />
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>{charCount.toLocaleString()} / 50,000 characters</span>
                    {charCount > 0 && charCount < 100 && (
                      <span className="text-amber-600">{100 - charCount} more needed</span>
                    )}
                  </div>
                </div>

                {/* Target Keyword */}
                {isFieldEnabled('keyword') && (
                <div>
                  <label htmlFor="target-keyword" className="block text-sm font-semibold text-gray-900 mb-1">Target Keyword (optional)</label>
                  <input
                    id="target-keyword"
                    type="text"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    placeholder="e.g. enterprise SEO services"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                )}

                {/* Secondary Keywords */}
                {isFieldEnabled('secondaryKeywords') && (
                <div>
                  <label htmlFor="secondary-keywords" className="block text-sm font-semibold text-gray-900 mb-1">Secondary Keywords (optional)</label>
                  <input
                    id="secondary-keywords"
                    type="text"
                    value={secondaryKeywords}
                    onChange={(e) => setSecondaryKeywords(e.target.value)}
                    placeholder="e.g. technical SEO, enterprise SEO strategy"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
                )}

                {/* Content Type + Search Intent + AI Model */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {isFieldEnabled('contentType') && (
                  <div>
                    <label htmlFor="content-type" className="block text-sm font-semibold text-gray-900 mb-1">Content Type</label>
                    <select id="content-type" value={contentType} onChange={(e) => setContentType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  )}
                  <div>
                    <label htmlFor="search-intent" className="block text-sm font-semibold text-gray-900 mb-1">Search Intent</label>
                    <select id="search-intent" value={searchIntent} onChange={(e) => setSearchIntent(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      {SEARCH_INTENTS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <ModelSelector value={aiModel} onChange={setAiModel} />
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                    {validationError}
                  </div>
                )}

                {/* Submit */}
                <button type="submit"
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] transition-all shadow-lg shadow-[#0C81F3]/25 hover:shadow-[#0C81F3]/40">
                  Analyze Content
                </button>
              </form>
            )}

            {/* Loading */}
            {status === 'loading' && (
              <LoadingProgress currentStep={loadingStep} />
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Analysis Failed</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">{errorMessage}</p>
                <button onClick={handleReset} className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {/* Report */}
            {status === 'success' && report && (
              <div id="report-section" className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Analysis Report</h2>
                  <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    ← New Analysis
                  </button>
                </div>
                <AIAnalyticsSection report={report} />

                {/* CTA */}
                <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988]" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                  <div className="relative text-white">
                    <span className="inline-block px-3.5 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 tracking-wide uppercase backdrop-blur-sm border border-white/20">Expert Review</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">Get a Professional SEO Strategy</h3>
                    <p className="mt-3 text-white/90 max-w-lg mx-auto text-sm sm:text-base leading-relaxed font-medium">
                      Want a deeper SEO analysis? Our SEO experts can review your content, competitors and search strategy.
                    </p>
                  </div>
                </div>

                {/* Lead Form */}
                <DynamicLeadForm
                  toolSlug="content-analyzer"
                  relatedIdField="analysisId"
                  relatedIdValue={analysisId}
                  title="Want a deeper SEO analysis?"
                  subtitle="Our SEO experts can review your content, competitors and search strategy."
                />
              </div>
            )}
          </div>
        </section>
    </div>
  )
}
