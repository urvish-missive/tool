import { useState } from 'react'
import {
  useExtractWebsiteContentMutation,
} from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  Globe,
  Search,
  Sparkles,
  FileText,
  ShieldCheck,
  Building,
  User,
  Mail,
  Phone,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Eye,
  CheckCircle2,
  Tag,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react'

const LOADING_STEPS = [
  'Connecting to website & resolving DNS securely',
  'Fetching HTML and bypassing bot hurdles',
  'Parsing metadata, Open Graph tags & canonical links',
  'Extracting JSON-LD schema & structured entity data',
  'Scanning ownership clues, copyright notices & contact signals',
  'Synthesizing clean markdown & generating AI entity profile',
]

const FAQ_ITEMS = [
  {
    q: 'How does the Website Content Extractor work?',
    a: 'Our crawler securely fetches the page HTML, strips clutter (scripts, styles, cookie banners, navigation menus, ads), and extracts structured metadata, JSON-LD schemas, heading hierarchies, contact details, and clean markdown text.',
  },
  {
    q: 'How does it detect the owner of the website?',
    a: 'The system searches multiple authoritative signals: Schema.org JSON-LD (Organization and Person markup), legal copyright notices in the footer, author and publisher meta tags, official corporate social links, and domain registrations.',
  },
  {
    q: 'Can I export the extracted text or markdown?',
    a: 'Yes! You can copy the clean formatted text, copy the markdown with heading hierarchy preserved, or download the full structured extraction as JSON, Markdown, or TXT with one click.',
  },
  {
    q: 'Are private or internal IP addresses blocked?',
    a: 'Yes, full SSRF (Server-Side Request Forgery) protection is enabled. Localhost, 127.0.0.1, internal private networks, and non-HTTP protocols are blocked for security.',
  },
]

export default function WebsiteContentExtractorPage() {
  // Input State
  const [url, setUrl] = useState('')
  const [preferredProvider, setPreferredProvider] = useState('gemini-3.7-flash')
  const [extractAIOverview, setExtractAIOverview] = useState(true)

  // API Mutations
  const [extractWebsite, { isLoading: isExtracting }] = useExtractWebsiteContentMutation()

  // Result & UI State
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'content' | 'metadata'
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Lead Popup Integration
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('website-content-extractor')
  const [pendingPayload, setPendingPayload] = useState(null)

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Handle Extraction Submit
  const handleExtractSubmit = async (e) => {
    e?.preventDefault?.()
    if (!url.trim()) {
      setError('Please enter a website URL.')
      return
    }

    setError('')

    const payload = {
      url: url.trim(),
      preferredProvider,
      extractAIOverview,
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
      return
    }

    executeExtraction(payload)
  }

  const executeExtraction = async (payload, leadId = null) => {
    try {
      const result = await extractWebsite({
        ...payload,
        leadId,
      }).unwrap()

      setExtractedData(result)

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('extractor-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      setError(
        err?.data?.error || err?.message || 'Failed to extract website content. Please verify the URL.'
      )
    }
  }

  const onLeadModalSuccess = (leadId) => {
    if (pendingPayload) {
      executeExtraction(pendingPayload, leadId)
      setPendingPayload(null)
    }
  }

  const handleReset = () => {
    setUrl('')
    setExtractedData(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Download Handler
  const handleDownload = (format) => {
    if (!extractedData) return
    let blob, filename

    if (format === 'json') {
      blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' })
      filename = `${extractedData.hostname || 'website'}-extracted.json`
    } else if (format === 'markdown') {
      blob = new Blob([extractedData.content?.markdown || ''], { type: 'text/markdown' })
      filename = `${extractedData.hostname || 'website'}-content.md`
    } else {
      blob = new Blob([extractedData.content?.plainText || ''], { type: 'text/plain' })
      filename = `${extractedData.hostname || 'website'}-content.txt`
    }

    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmitSuccess={onLeadModalSuccess}
        toolSlug="website-content-extractor"
        title="Unlock Free Website Content Extractor"
        subtitle="Extract clean text, analyze JSON-LD schema, and ask AI questions grounded directly in website content."
      />

      {/* Hero Header matching Missive Digital Brand Theme */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Himani's SEO Tools • Missive Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Website Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Extractor & AI Analysis
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Extract clean article text, metadata, headings, structured schema, and ownership clues from any URL. Ask AI questions grounded strictly in the website content with evidence quotes.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search & Extraction Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10 transition-all">
          <form onSubmit={handleExtractSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="website-url-input" className="block text-sm font-bold text-slate-800">
                Website or Web Page URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  id="website-url-input"
                  type="text"
                  placeholder="https://example.com or company.com/about"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm sm:text-base font-medium"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-24 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (text) setUrl(text.trim())
                    } catch {}
                  }}
                  className="absolute right-3 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Options & Action Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full sm:w-48">
                  <ModelSelector value={preferredProvider} onChange={setPreferredProvider} compact={true} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={extractAIOverview}
                    onChange={(e) => setExtractAIOverview(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0C81F3] focus:ring-[#0C81F3]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Deep AI Entity Synthesis & Overview
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                {extractedData && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm text-center cursor-pointer order-2 sm:order-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                      <span>Extracting Content...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Extract & Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Extraction Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Loader Progress State */}
        {isExtracting && (
          <div className="py-8">
            <UnifiedToolLoader
              steps={LOADING_STEPS}
              currentStep={2}
              title="Extracting Website Content & Entity Intelligence"
            />
          </div>
        )}

        {/* Extracted Results Dashboard */}
        {extractedData && !isExtracting && (
          <div id="extractor-results" className="space-y-4 pt-2">
            {/* Top Quick Summary Bar */}
            <div className="bg-white rounded-3xl px-5 py-4 sm:px-6 sm:py-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {extractedData.metadata?.favicon ? (
                  <img
                    src={extractedData.metadata.favicon}
                    alt="favicon"
                    className="w-10 h-10 rounded-xl p-1 border border-slate-200 bg-white object-contain shadow-2xs"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0C81F3] flex items-center justify-center font-bold text-sm shadow-2xs">
                    {extractedData.hostname?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                      {extractedData.metadata?.title || extractedData.hostname}
                    </h2>
                    <a
                      href={extractedData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#0C81F3] transition-colors"
                      title="Open website in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{extractedData.url}</p>
                </div>
              </div>

              {/* Action Badges & Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {extractedData.content?.wordCount?.toLocaleString() || 0} words
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  ~{extractedData.content?.readingTimeMinutes || 1} min read
                </span>
                {extractedData.aiOverview?.detectedOwner?.name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0C81F3] text-xs font-bold">
                    <Building className="w-3.5 h-3.5" />
                    {extractedData.aiOverview.detectedOwner.name}
                  </span>
                )}

                <button
                  onClick={() => handleDownload('json')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            </div>            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-3xl sm:px-6 px-3 pt-1 gap-1 sm:gap-3 overflow-x-auto shadow-2xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#0C81F3] text-[#0C81F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Entity & Ownership Clues</span>
                <span className="sm:hidden">Entity</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-[#0C81F3] text-[#0C81F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Extracted Clean Content</span>
                <span className="sm:hidden">Content</span>
              </button>

              <button
                onClick={() => setActiveTab('metadata')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'metadata'
                    ? 'border-[#0C81F3] text-[#0C81F3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">SEO & Schema Markup</span>
                <span className="sm:hidden">Schema</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & OWNERSHIP CLUES */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Word Count</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {extractedData.content?.wordCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {extractedData.content?.charCount?.toLocaleString() || 0} characters
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reading Time</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      ~{extractedData.content?.readingTimeMinutes || 1} min
                    </div>
                    <div className="text-xs text-slate-500 mt-1">based on 200 WPM</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Headings</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {extractedData.content?.headingsCount?.total || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      H1: {extractedData.content?.headingsCount?.h1 || 0} | H2:{' '}
                      {extractedData.content?.headingsCount?.h2 || 0} | H3:{' '}
                      {extractedData.content?.headingsCount?.h3 || 0}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Links Found</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {extractedData.content?.links?.total || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {extractedData.content?.links?.internal || 0} internal •{' '}
                      {extractedData.content?.links?.external || 0} external
                    </div>
                  </div>
                </div>

                {/* Detected Ownership & Entity Spotlight */}
                <div
                  className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #102A43 0%, #1a1a2e 100%)' }}
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0C81F3]/20 to-[#EB8988]/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Detected Website Owner & Entity
                      </div>
                      {extractedData.aiOverview?.detectedOwner?.confidence && (
                        <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-200 font-semibold border border-white/15">
                          {extractedData.aiOverview.detectedOwner.confidence} Confidence Detection
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {extractedData.aiOverview?.detectedOwner?.name ||
                          extractedData.jsonLd?.detectedOrganization?.name ||
                          extractedData.metadata?.og?.siteName ||
                          'Entity Name Unspecified on Page'}
                      </h3>
                      <p className="text-sm text-indigo-200 font-medium">
                        Type: {extractedData.aiOverview?.detectedOwner?.entityType || 'Web Organization'} • Business Model:{' '}
                        {extractedData.aiOverview?.businessModel || 'Digital Service'}
                      </p>
                    </div>

                    {/* Evidence Quote */}
                    {extractedData.aiOverview?.detectedOwner?.evidence && (
                      <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200 space-y-1.5 leading-relaxed">
                        <span className="font-bold text-[#A7D2FF]">Detection Evidence:</span>
                        <p className="italic">"{extractedData.aiOverview.detectedOwner.evidence}"</p>
                      </div>
                    )}

                    {/* Copyright statement */}
                    {extractedData.contacts?.copyright && (
                      <div className="text-xs text-slate-400 font-mono pt-1">
                        Copyright Notice: {extractedData.contacts.copyright}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Social Footprint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emails & Phones */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0C81F3]" />
                      Contact Emails & Phones Found
                    </h4>

                    <div className="space-y-3.5">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Email Addresses ({extractedData.contacts?.emails?.length || 0})
                        </div>
                        {extractedData.contacts?.emails?.length > 0 ? (
                          <div className="space-y-2">
                            {extractedData.contacts.emails.map((email, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                              >
                                <a href={`mailto:${email}`} className="text-[#0C81F3] font-semibold hover:underline">
                                  {email}
                                </a>
                                <button
                                  onClick={() => handleCopy(email, `email-${idx}`)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                  {copiedKey === `email-${idx}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No direct email addresses found in page text.</p>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Phone Numbers ({extractedData.contacts?.phones?.length || 0})
                        </div>
                        {extractedData.contacts?.phones?.length > 0 ? (
                          <div className="space-y-2">
                            {extractedData.contacts.phones.map((phone, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                              >
                                <a href={`tel:${phone}`} className="text-slate-800 font-semibold hover:underline">
                                  {phone}
                                </a>
                                <button
                                  onClick={() => handleCopy(phone, `phone-${idx}`)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                  {copiedKey === `phone-${idx}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No telephone numbers found on this page.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Profiles */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#0C81F3]" />
                      Official Social Media Footprint
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.entries(extractedData.contacts?.socialLinks || {}).map(([network, link]) => (
                        <div
                          key={network}
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs capitalize ${
                            link
                              ? 'bg-blue-50/50 border-blue-200 text-slate-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 font-medium'
                          }`}
                        >
                          <span>{network}</span>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#0C81F3] hover:text-blue-800"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-[10px]">Not found</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Trust Signals */}
                    {extractedData.aiOverview?.trustSignals?.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="text-xs font-bold text-slate-800">Verified Trust Signals:</div>
                        <ul className="space-y-1.5">
                          {extractedData.aiOverview.trustSignals.map((signal, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Executive Summary & Core Offerings */}
                {extractedData.aiOverview && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#0C81F3]" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {extractedData.aiOverview.executiveSummary}
                      </p>
                    </div>

                    {extractedData.aiOverview.keyOfferings?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Key Offerings & Focus Topics
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {extractedData.aiOverview.keyOfferings.map((offering, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                            >
                              <Tag className="w-4 h-4 text-[#0C81F3] mt-0.5 shrink-0" />
                              <span>{offering}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXTRACTED CLEAN CONTENT & STRUCTURE */}
            {activeTab === 'content' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                {/* Content Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Clean Extracted Page Content</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Noise stripped (scripts, styles, navigations, ads removed). Ready to copy or download.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopy(extractedData.content?.markdown, 'copy-md')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {copiedKey === 'copy-md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Markdown
                    </button>
                    <button
                      onClick={() => handleCopy(extractedData.content?.plainText, 'copy-txt')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {copiedKey === 'copy-txt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Plain Text
                    </button>
                    <button
                      onClick={() => handleDownload('markdown')}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .MD
                    </button>
                  </div>
                </div>

                {/* Headings Hierarchy Tree */}
                {extractedData.content?.headings?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Headings Outline ({extractedData.content.headings.length})
                    </h4>
                    <div className="max-h-64 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      {extractedData.content.headings.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex items-baseline gap-2 text-xs text-slate-800"
                          style={{
                            paddingLeft: h.level === 'h1' ? '0' : h.level === 'h2' ? '1rem' : h.level === 'h3' ? '2rem' : '3rem',
                          }}
                        >
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                            {h.level}
                          </span>
                          <span className="truncate font-medium">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Formatted Content Preview</span>
                    <span>{extractedData.content?.plainText?.length || 0} characters</span>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {extractedData.content?.markdown || extractedData.content?.plainText || 'No content found.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEO & METADATA */}
            {activeTab === 'metadata' && (
              <div className="space-y-6">
                {/* Meta Tags Table */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#0C81F3]" />
                    Essential Meta Tags
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                        <tr>
                          <th className="px-4 py-3.5">Element</th>
                          <th className="px-4 py-3.5">Content</th>
                          <th className="px-4 py-3.5">Characters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="px-4 py-3.5 font-bold text-slate-800">Page Title</td>
                          <td className="px-4 py-3.5 text-slate-900 break-words">{extractedData.metadata?.title || 'Not specified'}</td>
                          <td className="px-4 py-3.5 text-slate-500">{extractedData.metadata?.title?.length || 0} chars</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-bold text-slate-800">Meta Description</td>
                          <td className="px-4 py-3.5 text-slate-900 break-words">{extractedData.metadata?.description || 'Not specified'}</td>
                          <td className="px-4 py-3.5 text-slate-500">{extractedData.metadata?.description?.length || 0} chars</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-bold text-slate-800">Canonical URL</td>
                          <td className="px-4 py-3.5 text-slate-900 break-all">{extractedData.metadata?.canonical || 'None'}</td>
                          <td className="px-4 py-3.5 text-slate-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-bold text-slate-800">Robots Directive</td>
                          <td className="px-4 py-3.5 text-slate-900">{extractedData.metadata?.robots || 'index, follow'}</td>
                          <td className="px-4 py-3.5 text-slate-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-bold text-slate-800">HTML Language</td>
                          <td className="px-4 py-3.5 text-slate-900">{extractedData.metadata?.language || 'en'}</td>
                          <td className="px-4 py-3.5 text-slate-500">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Social Card Preview (Open Graph) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0C81F3]" />
                    Open Graph Social Share Card Preview
                  </h3>

                  <div className="max-w-md mx-auto rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
                    {extractedData.metadata?.og?.image ? (
                      <img
                        src={extractedData.metadata.og.image}
                        alt="Social preview"
                        className="w-full h-48 object-cover bg-slate-100"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                        No OG image found
                      </div>
                    )}
                    <div className="p-4 space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono uppercase font-bold">{extractedData.hostname}</div>
                      <h5 className="font-bold text-sm text-slate-900 line-clamp-2">
                        {extractedData.metadata?.og?.title || extractedData.metadata?.title}
                      </h5>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {extractedData.metadata?.og?.description || extractedData.metadata?.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* JSON-LD Schemas */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Code className="w-4 h-4 text-[#0C81F3]" />
                      Structured Data (JSON-LD Schemas) ({extractedData.jsonLd?.rawCount || 0})
                    </h3>
                    <button
                      onClick={() => handleCopy(JSON.stringify(extractedData.jsonLd?.schemas, null, 2), 'schema-json')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      {copiedKey === 'schema-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Schemas
                    </button>
                  </div>

                  {extractedData.jsonLd?.schemas?.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto p-5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs shadow-inner">
                      <pre>{JSON.stringify(extractedData.jsonLd.schemas, null, 2)}</pre>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No JSON-LD structured data detected on this page.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-sm mt-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-sm text-slate-600">
              Everything you need to know about website content extraction and analysis
            </p>
          </div>

          <div className="space-y-3.5 max-w-3xl mx-auto pt-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors hover:border-slate-300 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm text-slate-900 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="p-5 pt-0 text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
