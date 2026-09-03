import { useMemo, useState } from 'react'
import {
  useGenerateSitemapMutation,
  useValidateSitemapMutation,
} from '../../services/apiSlice'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  Globe,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Search,
  Zap,
  RefreshCw,
  Layers,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  XCircle,
  Calendar,
  ListOrdered,
} from 'lucide-react'

const LOADING_STEPS = [
  'Resolving domain and validating server reachability',
  'Crawling internal link tree and discovering pages',
  'Auditing canonical URLs and robots.txt directives',
  'Extracting images, hreflang tags, and lastmod timestamps',
  'Formatting Sitemaps.org 0.9 XML schema & deliverables',
]

const CHANGEFREQ_OPTIONS = [
  { value: 'always', label: 'Always' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily (Recommended for News/Blogs)' },
  { value: 'weekly', label: 'Weekly (Recommended for General Sites)' },
  { value: 'monthly', label: 'Monthly (Static / Corporate)' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'never', label: 'Never' },
]

const PRIORITY_PRESETS = [
  { value: 'auto', label: 'Auto (Intelligent depth-based calculation)' },
  { value: '1.0', label: '1.0 (Maximum Priority)' },
  { value: '0.8', label: '0.8 (High Priority)' },
  { value: '0.6', label: '0.6 (Standard Priority)' },
  { value: '0.4', label: '0.4 (Low Priority)' },
]

const FAQ_ITEMS = [
  {
    q: 'What is an XML Sitemap and why is it essential for SEO?',
    a: 'An XML sitemap is a structured file listing all essential URLs of your website. It acts as a direct roadmap for search engines like Google, Bing, and Yandex to discover, crawl, and understand your site structure, new content updates, and media assets.',
  },
  {
    q: 'What are the technical limits of an XML sitemap?',
    a: 'According to Sitemaps.org standards, a single sitemap file can contain a maximum of 50,000 URLs and must not exceed 50 MB uncompressed. Websites with more than 50,000 URLs or larger file sizes should split their URLs across multiple sitemaps and bundle them in a Sitemap Index file (<sitemapindex>).',
  },
  {
    q: 'Does having an XML sitemap guarantee 100% indexing by Google?',
    a: 'No. An XML sitemap helps search engines discover your pages quickly, but indexing decisions depend on your content quality, on-page SEO, technical health, search intent match, and internal link structure.',
  },
  {
    q: 'Should I include image tags in my XML sitemap?',
    a: 'Yes! Google Image Sitemaps allow you to provide additional metadata like image URLs, titles, and captions, dramatically boosting your visibility in Google Images and rich snippets.',
  },
  {
    q: 'How do I submit my generated sitemap to Google Search Console?',
    a: 'Upload sitemap.xml to your website root directory (e.g. https://yourdomain.com/sitemap.xml). Then open Google Search Console → Indexing → Sitemaps → enter "sitemap.xml" in the submission field and click Submit.',
  },
]

export default function XmlSitemapGeneratorPage() {
  // Mode: 'crawler' | 'manual' | 'validator'
  const [mode, setMode] = useState('crawler')

  // Crawler Form State
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [maxPages, setMaxPages] = useState('50')
  const [crawlDepth, setCrawlDepth] = useState('3')
  const [defaultChangefreq, setDefaultChangefreq] = useState('weekly')
  const [defaultPriority, setDefaultPriority] = useState('auto')
  const [includeImages, setIncludeImages] = useState(true)
  const [excludePattern, setExcludePattern] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Manual Form State
  const [manualUrls, setManualUrls] = useState('')

  // Validator Form State
  const [validatorUrl, setValidatorUrl] = useState('')
  const [validatorXml, setValidatorXml] = useState('')

  // UI & Active Tabs
  const [activeTab, setActiveTab] = useState('xml') // 'xml' | 'table' | 'index' | 'robots' | 'guide'
  const [tableSearch, setTableSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedRobots, setCopiedRobots] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  // API Mutations
  const [generateSitemap, { isLoading: isGenerating, data: sitemapData, error: generateError }] = useGenerateSitemapMutation()
  const [validateSitemap, { isLoading: isValidating, data: validationData, error: validateError }] = useValidateSitemapMutation()

  // Lead Popup
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } = useLeadPopup('xml-sitemap-generator')
  const [pendingPayload, setPendingPayload] = useState(null)

  const isLoading = isGenerating || isValidating
  const errorMessage = generateError?.data?.error || validateError?.data?.error || null

  const handleCrawlerSubmit = (e) => {
    e.preventDefault()
    if (!websiteUrl.trim()) return

    let formattedUrl = websiteUrl.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`
    }

    const payload = {
      mode: 'crawler',
      websiteUrl: formattedUrl,
      maxPages: parseInt(maxPages) || 50,
      crawlDepth: parseInt(crawlDepth) || 3,
      includeImages,
      defaultChangefreq,
      defaultPriority: defaultPriority === 'auto' ? '' : defaultPriority,
      excludePatterns: excludePattern ? excludePattern.split(',').map(s => s.trim()) : [],
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
    } else {
      generateSitemap(payload)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualUrls.trim()) return

    const payload = {
      mode: 'manual',
      urls: manualUrls,
      includeImages,
      defaultChangefreq,
      defaultPriority: defaultPriority === 'auto' ? '' : defaultPriority,
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
    } else {
      generateSitemap(payload)
    }
  }

  const handleValidatorSubmit = (e) => {
    e.preventDefault()
    if (!validatorUrl.trim() && !validatorXml.trim()) return

    const payload = {
      sitemapUrl: validatorUrl.trim() || undefined,
      xmlContent: validatorXml.trim() || undefined,
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
    } else {
      validateSitemap(payload)
    }
  }

  const handleModalSuccess = () => {
    handlePopupSubmit()
    if (pendingPayload) {
      if (pendingPayload.sitemapUrl || pendingPayload.xmlContent) {
        validateSitemap(pendingPayload)
      } else {
        generateSitemap(pendingPayload)
      }
      setPendingPayload(null)
    }
  }

  // Copy helpers
  const copyToClipboard = (text, setCopyState) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopyState(true)
      setTimeout(() => setCopyState(false), 2200)
    })
  }

  // Download helpers
  const downloadFile = (content, filename, type = 'application/xml') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadUrlsTxt = () => {
    if (!sitemapData?.urls?.length) return
    const text = sitemapData.urls.map(u => u.loc).join('\n')
    downloadFile(text, 'sitemap-urls.txt', 'text/plain')
  }

  const downloadUrlsCsv = () => {
    if (!sitemapData?.urls?.length) return
    const headers = 'URL,Status,Priority,Changefreq,Lastmod,Images\n'
    const rows = sitemapData.urls
      .map(u => `"${u.loc}",${u.statusCode || 200},${u.priority || 0.8},${u.changefreq || 'weekly'},${u.lastmod || ''},${u.images?.length || 0}`)
      .join('\n')
    downloadFile(headers + rows, 'sitemap-report.csv', 'text/csv')
  }

  // Filtered URLs for table view
  const filteredUrls = useMemo(() => {
    if (!sitemapData?.urls) return []
    if (!tableSearch.trim()) return sitemapData.urls
    const q = tableSearch.toLowerCase()
    return sitemapData.urls.filter(u => u.loc.toLowerCase().includes(q))
  }, [sitemapData, tableSearch])

  // Split sitemap index preview
  const sitemapIndexXml = useMemo(() => {
    if (!sitemapData?.websiteUrl) return ''
    const domain = sitemapData.websiteUrl
    const today = new Date().toISOString().split('T')[0]
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${domain}/sitemap-pages.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${domain}/sitemap-posts.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${domain}/sitemap-categories.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n</sitemapindex>`
  }, [sitemapData])

  const resetAll = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead Capture Modal if configured by Admin */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={handleModalSuccess}
        toolSlug="xml-sitemap-generator"
        title="Unlock Free XML Sitemap Generator"
        subtitle="Get instant access to unlimited XML sitemap generation, image tags, and Google Search Console optimization."
      />

      {/* Hero Header */}
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
            <span className="text-gray-900">XML </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Sitemap Generator
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate clean, search-engine ready XML sitemaps with deep crawling, Google image extensions, canonical checks, and instant Search Console readiness.
          </p>

          {/* Mode Switcher Buttons */}
          <div className="mt-8 inline-flex p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm gap-1 sm:gap-2">
            <button
              onClick={() => { setMode('crawler'); setValidatorUrl(''); setValidatorXml('') }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${mode === 'crawler'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Globe className="w-4 h-4" />
              <span>Website Crawler</span>
            </button>

            <button
              onClick={() => { setMode('manual'); setValidatorUrl(''); setValidatorXml('') }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${mode === 'manual'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Manual / Bulk URLs</span>
            </button>

            <button
              onClick={() => setMode('validator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${mode === 'validator'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sitemap Validator</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Form & Work Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold">Generation Notice</p>
              <p className="text-xs sm:text-sm mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Loading Screen with UnifiedToolLoader */}
        {isLoading && (
          <UnifiedToolLoader
            title={mode === 'validator' ? 'Validating XML Sitemap Schema...' : 'Crawling Website & Generating Sitemap...'}
            subtitle={
              mode === 'validator'
                ? 'Inspecting XML tags, testing URL reachability, and verifying 50MB / 50,000 limits.'
                : 'Traversing internal link structure, filtering noindex pages, and extracting image metadata.'
            }
            steps={LOADING_STEPS}
          />
        )}

        {/* Input Forms (visible when not loading) */}
        {!isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
            {/* MODE 1: Automated Crawler */}
            {mode === 'crawler' && (
              <form onSubmit={handleCrawlerSubmit} className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Target Website URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setWebsiteUrl('https://example.com')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Sample
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Enter any root domain or homepage. The crawler will automatically discover all reachable internal links.
                  </p>
                </div>

                {/* Quick Crawl Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Max URLs to Crawl
                    </label>
                    <select
                      value={maxPages}
                      onChange={(e) => setMaxPages(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                    >
                      <option value="25">25 URLs (Instant preview)</option>
                      <option value="50">50 URLs (Standard site)</option>
                      <option value="100">100 URLs (Medium site)</option>
                      <option value="200">200 URLs (Deep crawl)</option>
                      <option value="250">250 URLs (Maximum)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Crawl Depth
                    </label>
                    <select
                      value={crawlDepth}
                      onChange={(e) => setCrawlDepth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                    >
                      <option value="1">Level 1 (Homepage only)</option>
                      <option value="2">Level 2 (Main menu & top sections)</option>
                      <option value="3">Level 3 (Recommended - 3 clicks deep)</option>
                      <option value="4">Level 4 (Deep directory)</option>
                      <option value="5">Level 5 (Exhaustive search)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Change Frequency
                    </label>
                    <select
                      value={defaultChangefreq}
                      onChange={(e) => setDefaultChangefreq(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                    >
                      {CHANGEFREQ_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Advanced Accordion */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings (Images, Priorities, Exclusions)'}</span>
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="includeImages"
                          checked={includeImages}
                          onChange={(e) => setIncludeImages(e.target.checked)}
                          className="w-4 h-4 text-[#0C81F3] rounded border-slate-300 focus:ring-[#0C81F3]"
                        />
                        <label htmlFor="includeImages" className="text-slate-800 font-medium cursor-pointer">
                          Include Google Image Sitemaps tags (<code className="text-[#0C81F3]">&lt;image:image&gt;</code>)
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Default Priority Override
                          </label>
                          <select
                            value={defaultPriority}
                            onChange={(e) => setDefaultPriority(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#0C81F3]"
                          >
                            {PRIORITY_PRESETS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Exclude Path Patterns (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. /tag/, /category/, /wp-admin/"
                            value={excludePattern}
                            onChange={(e) => setExcludePattern(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#0C81F3]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Respects robots meta noindex & canonical tags</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold rounded-2xl shadow-lg shadow-[#0C81F3]/20 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Crawl & Generate Sitemap</span>
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: Manual URL List */}
            {mode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      Paste URL List (one per line) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setManualUrls(
                          'https://example.com/\nhttps://example.com/about\nhttps://example.com/services\nhttps://example.com/blog\nhttps://example.com/contact'
                        )
                      }
                      className="text-xs text-[#0C81F3] hover:underline font-semibold cursor-pointer"
                    >
                      Paste Sample URLs
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    placeholder="https://example.com/&#10;https://example.com/services&#10;https://example.com/about"
                    value={manualUrls}
                    onChange={(e) => setManualUrls(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Paste any number of clean URLs. Sitemaps.org standards require absolute URLs with http:// or https://.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Change Frequency
                    </label>
                    <select
                      value={defaultChangefreq}
                      onChange={(e) => setDefaultChangefreq(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                    >
                      {CHANGEFREQ_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Default Priority
                    </label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C81F3]"
                    >
                      {PRIORITY_PRESETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold rounded-2xl shadow-lg shadow-[#0C81F3]/20 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Generate Sitemaps.org XML</span>
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: Validator & Health Audit */}
            {mode === 'validator' && (
              <form onSubmit={handleValidatorSubmit} className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Validate by Live Sitemap URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="https://example.com/sitemap.xml"
                      value={validatorUrl}
                      onChange={(e) => {
                        setValidatorUrl(e.target.value)
                        if (e.target.value) setValidatorXml('')
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    We will fetch your live XML sitemap, check response headers, syntax validity, and size limits.
                  </p>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    OR PASTE RAW XML CODE
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Raw XML Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;&#10;&lt;urlset xmlns=&quot;http://www.sitemaps.org/schemas/sitemap/0.9&quot;&gt;&#10;  &lt;url&gt;&#10;    &lt;loc&gt;https://example.com/&lt;/loc&gt;&#10;  &lt;/url&gt;&#10;&lt;/urlset&gt;"
                    value={validatorXml}
                    onChange={(e) => {
                      setValidatorXml(e.target.value)
                      if (e.target.value) setValidatorUrl('')
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold rounded-2xl shadow-lg shadow-[#0C81F3]/20 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Sitemap Health Audit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* RESULTS SECTION: Sitemap Generation Results */}
        {sitemapData && !isLoading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total URLs</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0C81F3] mt-1">
                  {sitemapData.totalUrls.toLocaleString()}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">Discovered</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Images Included</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#EB8988] mt-1">
                  {sitemapData.totalImages.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 inline-block">&lt;image:image&gt;</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">200 OK Status</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                  {sitemapData.status200Count}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">100% Reachable</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Priority</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">
                  {sitemapData.avgPriority}
                </p>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 inline-block">Scale 0.0 - 1.0</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">File Size</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                  {sitemapData.fileSizeKb} <span className="text-xs font-bold text-slate-500">KB</span>
                </p>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 inline-block">&lt; 50 MB Limit</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm text-center flex flex-col justify-center items-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">GSC Ready</span>
                <div className="flex items-center gap-1 mt-1 text-emerald-700 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Valid XML</span>
                </div>
                <span className="text-[10px] text-emerald-600 mt-0.5">Sitemaps.org 0.9</span>
              </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Tab Navigation Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setActiveTab('xml')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'xml'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    XML Code View
                  </button>

                  <button
                    onClick={() => setActiveTab('table')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'table'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    Visual URL Table ({sitemapData.urls.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('robots')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'robots'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    Robots.txt Directive
                  </button>

                  <button
                    onClick={() => setActiveTab('index')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'index'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    Sitemap Index
                  </button>

                  <button
                    onClick={() => setActiveTab('guide')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'guide'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    GSC Submission Guide
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(sitemapData.xmlContent, setCopied)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy XML'}</span>
                  </button>

                  <button
                    onClick={() => downloadFile(sitemapData.xmlContent, 'sitemap.xml')}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download sitemap.xml</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: XML Code View */}
              {activeTab === 'xml' && (
                <div className="p-6">
                  <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                        <span className="ml-2 font-mono text-slate-300">sitemap.xml</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {sitemapData.totalUrls} URLs • {sitemapData.fileSizeKb} KB
                      </span>
                    </div>

                    <pre className="p-5 font-mono text-xs sm:text-[13px] text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-blue-600 selection:text-white">
                      <code>{sitemapData.xmlContent}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: Visual Table View */}
              {activeTab === 'table' && (
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search URLs in sitemap..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0C81F3]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadUrlsCsv}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={downloadUrlsTxt}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export TXT</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">URL Location</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Priority</th>
                          <th className="py-3 px-3">Frequency</th>
                          <th className="py-3 px-3">Last Modified</th>
                          <th className="py-3 px-3 text-center">Images</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredUrls.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-900 max-w-sm truncate" title={entry.loc}>
                              {entry.loc}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {entry.statusCode || 200}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${entry.priority >= 0.8
                                  ? 'bg-blue-100 text-blue-800'
                                  : entry.priority >= 0.6
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'bg-amber-50 text-amber-800'
                                  }`}
                              >
                                {Number(entry.priority).toFixed(1)}
                              </span>
                            </td>
                            <td className="py-3 px-3 capitalize text-slate-600">{entry.changefreq || 'weekly'}</td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{entry.lastmod}</td>
                            <td className="py-3 px-3 text-center">
                              {entry.images?.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <ImageIcon className="w-3 h-3 text-emerald-500" />
                                  {entry.images.length}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={entry.loc}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0C81F3] text-xs font-semibold"
                              >
                                <span>Visit</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Robots.txt Directive */}
              {activeTab === 'robots' && (
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
                    <p className="font-bold text-sm mb-1">Add this directive to your website's robots.txt file</p>
                    <p>
                      Adding the <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-950 font-semibold">Sitemap:</code> directive helps search engine crawlers locate your sitemap instantly upon their very first visit to your domain.
                    </p>
                  </div>

                  <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                      <span className="font-mono text-slate-300">robots.txt</span>
                      <button
                        onClick={() => copyToClipboard(sitemapData.robotsSnippet, setCopiedRobots)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedRobots ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRobots ? 'Copied!' : 'Copy Directive'}</span>
                      </button>
                    </div>

                    <pre className="p-5 font-mono text-xs sm:text-sm text-emerald-400 leading-relaxed">
                      <code>{sitemapData.robotsSnippet}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: Sitemap Index */}
              {activeTab === 'index' && (
                <div className="p-6 space-y-4">
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold text-sm mb-1">When to use a Sitemap Index?</p>
                    <p>
                      If your website has over 50,000 URLs or exceeds 50MB, or if you prefer segmenting your content by category (e.g. Pages, Blog Posts, Ecommerce Products), use a Sitemap Index file (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">&lt;sitemapindex&gt;</code>).
                    </p>
                  </div>

                  <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                      <span className="font-mono text-slate-300">sitemap-index.xml</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(sitemapIndexXml, setCopiedIndex)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIndex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => downloadFile(sitemapIndexXml, 'sitemap-index.xml')}
                          className="px-2.5 py-1 bg-[#0C81F3] hover:bg-blue-600 text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Index</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-5 font-mono text-xs sm:text-sm text-emerald-400 leading-relaxed overflow-x-auto">
                      <code>{sitemapIndexXml}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: GSC Submission Guide */}
              {activeTab === 'guide' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      How to Submit Your XML Sitemap to Search Engines
                    </h3>
                    <p className="text-xs text-slate-500">
                      Follow these 3 simple steps to ensure Google and Bing index your fresh URLs.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="w-8 h-8 rounded-full bg-[#0C81F3] text-white font-bold flex items-center justify-center text-sm shadow">
                        1
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Upload to Server</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Download the <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">sitemap.xml</code> file and upload it to the root directory of your website (e.g. <code className="text-[#0C81F3]">https://yourdomain.com/sitemap.xml</code>).
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="w-8 h-8 rounded-full bg-[#0C81F3] text-white font-bold flex items-center justify-center text-sm shadow">
                        2
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Open Google Search Console</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-[#0C81F3] underline font-semibold">Google Search Console</a>, select your property, and navigate to <strong>Indexing → Sitemaps</strong> in the sidebar.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
                        3
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">Submit & Track</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Enter <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">sitemap.xml</code> in the "Add a new sitemap" input and click <strong>Submit</strong>. Google will verify the XML format and start discovering your pages immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Compass className="w-4 h-4 text-[#0C81F3]" />
                <span>Generated for <strong>{sitemapData.websiteUrl}</strong> with {sitemapData.totalUrls} discovered URLs</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Sitemap</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VALIDATOR RESULTS SECTION */}
        {validationData && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Audit Source: {validationData.source}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">XML Sitemap Health Score</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Analyzed against Sitemaps.org 0.9 schema, Google standards, and indexability best practices.
                  </p>
                </div>

                {/* Score Circle Banner */}
                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-extrabold text-white shadow-md ${validationData.healthScore >= 80
                      ? 'bg-emerald-500'
                      : validationData.healthScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                      }`}
                  >
                    <span className="text-xl leading-none">{validationData.healthScore}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold">/ 100</span>
                  </div>

                  <div className="text-xs">
                    <p className="font-bold text-slate-900">
                      {validationData.healthScore >= 80
                        ? 'Excellent Health'
                        : validationData.healthScore >= 60
                          ? 'Needs Attention'
                          : 'Critical Issues Found'}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {validationData.criticalCount} Critical • {validationData.warningCount} Warnings
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Parsed URLs</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {validationData.totalUrls.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">File Size</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{validationData.sizeKb} KB</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Type</span>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {validationData.isSitemapIndex ? 'Sitemap Index' : 'Standard Urlset'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Size Cap</span>
                  <p className="text-lg font-bold text-emerald-600 mt-1">&lt; 50 MB Safe</p>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Diagnostic Findings & Remediations</h4>

                {validationData.allIssues?.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">No Issues Detected!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Your sitemap conforms 100% to Sitemaps.org guidelines and is ready for submission to Google Search Console.
                      </p>
                    </div>
                  </div>
                ) : (
                  validationData.allIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${issue.severity === 'CRITICAL'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : issue.severity === 'HIGH'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-blue-50/70 border-blue-200 text-blue-950'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${issue.severity === 'CRITICAL'
                            ? 'bg-rose-200 text-rose-900'
                            : issue.severity === 'HIGH'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-200 text-blue-900'
                            }`}
                        >
                          {issue.severity}
                        </span>
                        <span>{issue.title}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">{issue.description}</p>
                      {issue.recommendation && (
                        <p className="text-xs font-semibold text-slate-800 pt-0.5">
                          💡 <strong>Fix:</strong> {issue.recommendation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Lead Capture Form at page bottom */}
        <div className="mt-16 mb-16">
          <DynamicLeadForm
            toolSlug="xml-sitemap-generator"
            title="Need a Complete Technical SEO & Crawl Audit?"
            subtitle="Get a complimentary manual SEO audit from Missive Digital's senior search consultants."
          />
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto mt-12 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about XML sitemaps, crawl budgets, and search engine discovery.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
