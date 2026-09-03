import { useState, useMemo } from 'react'
import {
  useExtractWebsiteContentMutation,
  useAskWebsiteQuestionMutation,
} from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  Globe,
  Search,
  Sparkles,
  Send,
  MessageSquare,
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
} from 'lucide-react'

const LOADING_STEPS = [
  'Connecting to website & resolving DNS securely',
  'Fetching HTML and bypassing bot hurdles',
  'Parsing metadata, Open Graph tags & canonical links',
  'Extracting JSON-LD schema & structured entity data',
  'Scanning ownership clues, copyright notices & contact signals',
  'Synthesizing clean markdown & generating AI entity profile',
]

const PRESET_QUESTIONS = [
  {
    icon: '👤',
    label: 'Who is the owner?',
    q: 'Who is the owner, founder, or company behind this website, and what evidence supports this?',
  },
  {
    icon: '🏢',
    label: 'What does this business do?',
    q: 'What is the core purpose of this website, what products or services do they offer, and who is their target audience?',
  },
  {
    icon: '💰',
    label: 'Pricing & Packages',
    q: 'What are their pricing plans, packages, or costs mentioned on the page?',
  },
  {
    icon: '📞',
    label: 'Contact & Location',
    q: 'What are all the contact details, emails, phone numbers, physical office locations, or social handles listed on this website?',
  },
  {
    icon: '📋',
    label: '5 Key Takeaways',
    q: 'Provide a 5-bullet executive summary highlighting the most critical points from this page.',
  },
  {
    icon: '🛡️',
    label: 'Is this site legit?',
    q: 'Analyze the trust signals, E-E-A-T credentials, and legitimacy of this website based on the extracted content.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'How does the Website Content Extractor work?',
    a: 'Our crawler securely fetches the page HTML, strips clutter (scripts, styles, cookie banners, navigation menus, ads), and extracts structured metadata, JSON-LD schemas, heading hierarchies, contact details, and clean markdown text.',
  },
  {
    q: 'How does the AI Question & Answer feature answer questions?',
    a: 'Unlike generic AI bots that make up information, our AI Assistant is strictly grounded in the extracted text and metadata of the target website. It cites exact evidence quotes from the page to prove its answers.',
  },
  {
    q: 'How does it detect the owner of the website?',
    a: 'The system searches multiple authoritative signals: Schema.org JSON-LD (Organization and Person markup), legal copyright notices in the footer, author and publisher meta tags, official corporate social links, and domain registrations.',
  },
  {
    q: 'Can I export the extracted text or markdown?',
    a: 'Yes! You can copy the clean formatted text, copy the markdown with heading hierarchy preserved, or download the full structured extraction as JSON or TXT with one click.',
  },
  {
    q: 'Are private or internal IP addresses blocked?',
    a: 'Yes, full SSRF (Server-Side Request Forgery) protection is enabled. Localhost, 127.0.0.1, internal private networks, and non-HTTP protocols are blocked for security.',
  },
]

export default function WebsiteContentExtractorPage() {
  // Input State
  const [url, setUrl] = useState('')
  const [preferredProvider, setPreferredProvider] = useState('gemini')
  const [extractAIOverview, setExtractAIOverview] = useState(true)

  // API Mutations
  const [extractWebsite, { isLoading: isExtracting }] = useExtractWebsiteContentMutation()
  const [askQuestion, { isLoading: isAnswering }] = useAskWebsiteQuestionMutation()

  // Result & UI State
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('qa') // 'qa' | 'overview' | 'content' | 'metadata'
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Q&A Chat State
  const [questionInput, setQuestionInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])

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
      // Initialize Q&A history with auto-generated greeting/summary
      if (result.aiOverview) {
        setChatHistory([
          {
            role: 'assistant',
            question: 'Executive Overview',
            answer: result.aiOverview.executiveSummary,
            confidence: 'High',
            evidenceQuotes: result.aiOverview.detectedOwner?.evidence
              ? [result.aiOverview.detectedOwner.evidence]
              : [],
            sourceSection: 'AI Intelligence Overview',
            followUpQuestions: result.aiOverview.suggestedQuestions || [],
            timestamp: new Date().toISOString(),
          },
        ])
      } else {
        setChatHistory([])
      }

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

  // Handle Asking Question
  const handleAskQuestion = async (customQ = null) => {
    const qToSend = (customQ || questionInput).trim()
    if (!qToSend || isAnswering) return

    setQuestionInput('')

    // Append user question optimistically
    const newChatTurn = {
      role: 'user',
      content: qToSend,
      timestamp: new Date().toISOString(),
    }

    const previousTurns = [...chatHistory]

    try {
      const response = await askQuestion({
        url: extractedData.url,
        question: qToSend,
        extractedData,
        chatHistory: previousTurns.map((t) => ({
          role: t.role || (t.question ? 'assistant' : 'user'),
          content: t.answer || t.content || t.question,
        })),
        preferredProvider,
      }).unwrap()

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          question: qToSend,
          answer: response.answer,
          confidence: response.confidence,
          evidenceQuotes: response.evidenceQuotes || [],
          sourceSection: response.sourceSection || 'Website Content',
          followUpQuestions: response.followUpQuestions || [],
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          question: qToSend,
          answer: `⚠️ Sorry, unable to answer this question: ${err?.data?.error || err.message}`,
          confidence: 'Low',
          evidenceQuotes: [],
          sourceSection: 'Error',
          followUpQuestions: [],
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  // Reset form
  const handleReset = () => {
    setUrl('')
    setExtractedData(null)
    setError('')
    setChatHistory([])
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showPopup}
        onClose={handlePopupClose}
        onSubmitSuccess={onLeadModalSuccess}
        toolSlug="website-content-extractor"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI Website Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Website Content Extractor <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">& AI Q&A</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600">
            Extract clean article text, metadata, headings, structured schema, and ownership clues from any URL. Ask questions and get answers grounded directly in the website content.
          </p>
        </div>

        {/* Search & Extraction Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 transition-all hover:shadow-md">
          <form onSubmit={handleExtractSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="website-url-input" className="block text-sm font-semibold text-slate-800">
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
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-24 text-xs font-medium text-slate-400 hover:text-slate-600"
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
                  className="absolute right-3 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-48">
                  <ModelSelector value={preferredProvider} onChange={setPreferredProvider} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={extractAIOverview}
                    onChange={(e) => setExtractAIOverview(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Deep AI Entity Synthesis & Overview
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isExtracting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract & Analyze
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Extraction Error</p>
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
          <div id="extractor-results" className="space-y-6 pt-4">
            {/* Top Quick Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {extractedData.metadata?.favicon ? (
                  <img
                    src={extractedData.metadata.favicon}
                    alt="favicon"
                    className="w-8 h-8 rounded-md p-0.5 border border-slate-200 bg-white object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {extractedData.hostname?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 truncate max-w-md">
                      {extractedData.metadata?.title || extractedData.hostname}
                    </h2>
                    <a
                      href={extractedData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-blue-600"
                      title="Open website in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{extractedData.url}</p>
                </div>
              </div>

              {/* Action Badges & Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {extractedData.content?.wordCount?.toLocaleString() || 0} words
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  ~{extractedData.content?.readingTimeMinutes || 1} min read
                </span>
                {extractedData.aiOverview?.detectedOwner?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    {extractedData.aiOverview.detectedOwner.name}
                  </span>
                )}

                <div className="relative group">
                  <button
                    onClick={() => handleDownload('json')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New URL
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('qa')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'qa'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Q&A Assistant
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Ground Truth
                </span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="w-4 h-4" />
                Entity & Ownership Clues
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'content'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Extracted Clean Content
              </button>

              <button
                onClick={() => setActiveTab('metadata')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'metadata'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                SEO & Schema Markup
              </button>
            </div>

            {/* TAB 1: AI Q&A ASSISTANT */}
            {activeTab === 'qa' && (
              <div className="bg-white rounded-b-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                {/* Preset Chips */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Instant Questions Grounded in this Website
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_QUESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(item.q)}
                        disabled={isAnswering}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-medium transition-all"
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Stream / Q&A Dialogue */}
                <div className="space-y-4 pt-2">
                  {chatHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">No questions asked yet.</p>
                      <p className="text-xs">Click one of the prompt chips above or type a question below.</p>
                    </div>
                  ) : (
                    chatHistory.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        {/* Question Bubble */}
                        {item.question && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                              Q
                            </div>
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-900 text-sm font-semibold max-w-2xl">
                              {item.question}
                            </div>
                          </div>
                        )}

                        {/* Answer Card */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                            AI
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    item.confidence === 'High'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.confidence === 'Medium'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {item.confidence || 'Grounded'} Confidence
                                </span>
                                {item.sourceSection && (
                                  <span className="text-xs text-slate-500 font-medium">
                                    Source: {item.sourceSection}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleCopy(item.answer, `ans-${idx}`)}
                                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
                              >
                                {copiedKey === `ans-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Markdown Rendered Content */}
                            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </div>

                            {/* Evidence Quotes */}
                            {item.evidenceQuotes && item.evidenceQuotes.length > 0 && (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                  Evidence Quoted from Website:
                                </div>
                                {item.evidenceQuotes.map((q, qIdx) => (
                                  <blockquote
                                    key={qIdx}
                                    className="text-xs text-slate-600 italic border-l-2 border-blue-500 pl-2.5 my-1"
                                  >
                                    "{q}"
                                  </blockquote>
                                ))}
                              </div>
                            )}

                            {/* Follow-up Suggestions */}
                            {item.followUpQuestions && item.followUpQuestions.length > 0 && (
                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-medium">Related:</span>
                                {item.followUpQuestions.map((fq, fIdx) => (
                                  <button
                                    key={fIdx}
                                    onClick={() => handleAskQuestion(fq)}
                                    className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition-colors"
                                  >
                                    {fq}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {isAnswering && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Analyzing extracted website text and verifying evidence...
                      </span>
                    </div>
                  )}
                </div>

                {/* Question Input Box */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Ask any question about this website (e.g. Who is the founder? What is their refund policy? Where are they based?)"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAskQuestion()
                        }
                      }}
                      disabled={isAnswering}
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAskQuestion()}
                      disabled={!questionInput.trim() || isAnswering}
                      className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OVERVIEW & OWNERSHIP CLUES */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Word Count</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {extractedData.content?.wordCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {extractedData.content?.charCount?.toLocaleString() || 0} characters
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reading Time</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {extractedData.content?.readingTimeMinutes || 1} min
                    </div>
                    <div className="text-xs text-slate-500 mt-1">based on 200 WPM</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Headings</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {extractedData.content?.headingsCount?.total || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      H1: {extractedData.content?.headingsCount?.h1 || 0} | H2:{' '}
                      {extractedData.content?.headingsCount?.h2 || 0} | H3:{' '}
                      {extractedData.content?.headingsCount?.h3 || 0}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Links Found</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {extractedData.content?.links?.total || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {extractedData.content?.links?.internal || 0} internal •{' '}
                      {extractedData.content?.links?.external || 0} external
                    </div>
                  </div>
                </div>

                {/* Detected Ownership & Entity Spotlight */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Detected Website Owner & Entity
                      </div>
                      {extractedData.aiOverview?.detectedOwner?.confidence && (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-slate-300">
                          {extractedData.aiOverview.detectedOwner.confidence} Confidence Detection
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {extractedData.aiOverview?.detectedOwner?.name ||
                          extractedData.jsonLd?.detectedOrganization?.name ||
                          extractedData.metadata?.og?.siteName ||
                          'Entity Name Unspecified on Page'}
                      </h3>
                      <p className="text-sm text-indigo-200">
                        Type: {extractedData.aiOverview?.detectedOwner?.entityType || 'Web Organization'} • Business Model:{' '}
                        {extractedData.aiOverview?.businessModel || 'Digital Service'}
                      </p>
                    </div>

                    {/* Evidence Quote */}
                    {extractedData.aiOverview?.detectedOwner?.evidence && (
                      <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 space-y-1">
                        <span className="font-semibold text-blue-300">Detection Evidence:</span>
                        <p className="italic">"{extractedData.aiOverview.detectedOwner.evidence}"</p>
                      </div>
                    )}

                    {/* Copyright statement */}
                    {extractedData.contacts?.copyright && (
                      <div className="text-xs text-slate-400 font-mono">
                        Copyright Notice: {extractedData.contacts.copyright}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Social Footprint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emails & Phones */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Contact Emails & Phones Found
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Email Addresses ({extractedData.contacts?.emails?.length || 0})
                        </div>
                        {extractedData.contacts?.emails?.length > 0 ? (
                          <div className="space-y-1.5">
                            {extractedData.contacts.emails.map((email, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                              >
                                <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                                  {email}
                                </a>
                                <button
                                  onClick={() => handleCopy(email, `email-${idx}`)}
                                  className="text-slate-400 hover:text-slate-700"
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
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Phone Numbers ({extractedData.contacts?.phones?.length || 0})
                        </div>
                        {extractedData.contacts?.phones?.length > 0 ? (
                          <div className="space-y-1.5">
                            {extractedData.contacts.phones.map((phone, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                              >
                                <a href={`tel:${phone}`} className="text-slate-800 hover:underline">
                                  {phone}
                                </a>
                                <button
                                  onClick={() => handleCopy(phone, `phone-${idx}`)}
                                  className="text-slate-400 hover:text-slate-700"
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
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      Official Social Media Footprint
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.entries(extractedData.contacts?.socialLinks || {}).map(([network, link]) => (
                        <div
                          key={network}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs capitalize ${
                            link
                              ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="font-semibold">{network}</span>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800"
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
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="text-xs font-semibold text-slate-700">Verified Trust Signals:</div>
                        <ul className="space-y-1">
                          {extractedData.aiOverview.trustSignals.map((signal, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {signal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Executive Summary & Core Offerings */}
                {extractedData.aiOverview && (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {extractedData.aiOverview.executiveSummary}
                      </p>
                    </div>

                    {extractedData.aiOverview.keyOfferings?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Key Offerings & Focus Topics
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {extractedData.aiOverview.keyOfferings.map((offering, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                            >
                              <Tag className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
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

            {/* TAB 3: EXTRACTED CLEAN CONTENT & STRUCTURE */}
            {activeTab === 'content' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                {/* Content Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Clean Extracted Page Content</h3>
                    <p className="text-xs text-slate-500">
                      Noise stripped (scripts, styles, navigations, ads removed). Ready to copy or download.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopy(extractedData.content?.markdown, 'copy-md')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                    >
                      {copiedKey === 'copy-md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Markdown
                    </button>
                    <button
                      onClick={() => handleCopy(extractedData.content?.plainText, 'copy-txt')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                    >
                      {copiedKey === 'copy-txt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Plain Text
                    </button>
                    <button
                      onClick={() => handleDownload('markdown')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .MD
                    </button>
                  </div>
                </div>

                {/* Headings Hierarchy Tree */}
                {extractedData.content?.headings?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Headings Outline ({extractedData.content.headings.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      {extractedData.content.headings.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex items-baseline gap-2 text-xs text-slate-800"
                          style={{
                            paddingLeft: h.level === 'h1' ? '0' : h.level === 'h2' ? '1rem' : h.level === 'h3' ? '2rem' : '3rem',
                          }}
                        >
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                            {h.level}
                          </span>
                          <span className="truncate">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Formatted Content Preview</span>
                    <span>{extractedData.content?.plainText?.length || 0} characters</span>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto p-6 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {extractedData.content?.markdown || extractedData.content?.plainText || 'No content found.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SEO & METADATA */}
            {activeTab === 'metadata' && (
              <div className="space-y-6">
                {/* Meta Tags Table */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Essential Meta Tags
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Element</th>
                          <th className="px-4 py-3 font-semibold">Content</th>
                          <th className="px-4 py-3 font-semibold">Characters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700">Page Title</td>
                          <td className="px-4 py-3 text-slate-900 break-words">{extractedData.metadata?.title || 'Not specified'}</td>
                          <td className="px-4 py-3 text-slate-500">{extractedData.metadata?.title?.length || 0} chars</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700">Meta Description</td>
                          <td className="px-4 py-3 text-slate-900 break-words">{extractedData.metadata?.description || 'Not specified'}</td>
                          <td className="px-4 py-3 text-slate-500">{extractedData.metadata?.description?.length || 0} chars</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700">Canonical URL</td>
                          <td className="px-4 py-3 text-slate-900 break-all">{extractedData.metadata?.canonical || 'None'}</td>
                          <td className="px-4 py-3 text-slate-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700">Robots Directive</td>
                          <td className="px-4 py-3 text-slate-900">{extractedData.metadata?.robots || 'index, follow'}</td>
                          <td className="px-4 py-3 text-slate-500">-</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-bold text-slate-700">HTML Language</td>
                          <td className="px-4 py-3 text-slate-900">{extractedData.metadata?.language || 'en'}</td>
                          <td className="px-4 py-3 text-slate-500">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Social Card Preview (Open Graph) */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Open Graph Social Share Card Preview
                  </h3>

                  <div className="max-w-md mx-auto rounded-xl border border-slate-200 overflow-hidden shadow-xs bg-white">
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
                      <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                        No OG image found
                      </div>
                    )}
                    <div className="p-4 space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono uppercase">{extractedData.hostname}</div>
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
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-600" />
                      Structured Data (JSON-LD Schemas) ({extractedData.jsonLd?.rawCount || 0})
                    </h3>
                    <button
                      onClick={() => handleCopy(JSON.stringify(extractedData.jsonLd?.schemas, null, 2), 'schema-json')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium"
                    >
                      {copiedKey === 'schema-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Schemas
                    </button>
                  </div>

                  {extractedData.jsonLd?.schemas?.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-sm text-slate-600">
              Everything you need to know about website extraction and grounded AI Q&A
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto pt-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-colors hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-900 bg-white hover:bg-slate-50"
                >
                  <span>{item.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="p-4 pt-0 text-sm text-slate-600 bg-white border-t border-slate-100">
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
