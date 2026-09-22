import { useState, useRef } from 'react'
import { useAuditWebsiteStructureMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import { exportStructureAuditToExcel, buildInventoryCategoryRows } from './excelExport'
import {
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Compass,
  FilePlus,
  GitBranch,
  ShieldAlert,
  BarChart3,
  Globe,
} from 'lucide-react'

const LOADING_STEPS = [
  'Resolving domain DNS & verifying website accessibility',
  'Crawling internal links & calculating click depth hierarchy',
  'Analyzing directory silos, path segments & orphan risks',
  'Synthesizing 301 redirect map & recommended taxonomy',
  'Generating multi-tier architecture & pages to create',
]

const FAQ_ITEMS = [
  {
    q: 'What is a Website Structure Audit?',
    a: 'A Website Structure Audit evaluates how your website pages are organized, linked, and nested. It identifies deep URLs (> 3 clicks from root), orphan pages with zero internal links, split topical silos, and keyword cannibalization, providing an optimized information architecture and 301 redirect roadmap.',
  },
  {
    q: 'Why does URL click depth matter for SEO?',
    a: 'Search engine crawlers have a finite crawl budget. Pages buried 4 or 5 clicks deep receive significantly less PageRank (link equity) and are indexed less frequently. Best-practice enterprise SEO mandates that all essential pages sit within 3 clicks of the homepage.',
  },
  {
    q: 'What does the Redirect Map do?',
    a: 'When you flatten deep URLs or modernize messy permalinks (e.g. changing /products/cloud/v2/module/ into /products/cloud-module/), 301 redirects preserve 100% of accumulated backlinks and prevent broken 404 errors for visitors.',
  },
  {
    q: 'What is included in the Download Excel export?',
    a: 'The Excel download (.xlsx) includes all 5 complete sheets: Summary (with KPI benchmarks and depth breakdown), Current Inventory (all audited URLs with inlinks and status), Redirect Map (301 sources and targets), Recommended Structure (future-proof taxonomy), and Pages to Create (high-ROI keyword gaps).',
  },
  {
    q: 'How are Pages to Create identified?',
    a: 'Our AI analyzes your topical domain footprint, identifies missing intent stages (such as comparison hubs, sub-service landing pages, and FAQ silos), and recommends specific high-value URLs to bridge architectural gaps.',
  },
]

export default function WebsiteStructureAuditPage() {
  const [url, setUrl] = useState('')
  const [focusNiche, setFocusNiche] = useState('')
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'inventory' | 'redirects' | 'recommended' | 'pages'
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  // Filters for tables
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventorySectionFilter, setInventorySectionFilter] = useState('all')
  const [inventoryPriorityFilter, setInventoryPriorityFilter] = useState('all')
  const [inventorySitemapFilter, setInventorySitemapFilter] = useState('all')
  const [inventoryHeaderFilter, setInventoryHeaderFilter] = useState('all')
  const [inventoryFooterFilter, setInventoryFooterFilter] = useState('all')
  const [redirectSearch, setRedirectSearch] = useState('')
  const [recommendedSearch, setRecommendedSearch] = useState('')
  const [pagesSearch, setPagesSearch] = useState('')
  const [pagesCategoryFilter, setPagesCategoryFilter] = useState('all')
  const [copiedUrl, setCopiedUrl] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Mutation
  const [auditWebsiteStructure, { isLoading }] = useAuditWebsiteStructureMutation()
  const [results, setResults] = useState(null)

  // Lead Popup Integration
  const { popupEnabled, showPopup, triggerPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('website-structure-audit')
  const pendingPayloadRef = useRef(null)

  const handleAudit = async (payload) => {
    try {
      setError('')
      const response = await auditWebsiteStructure(payload).unwrap()
      if (response?.data) {
        setResults(response.data)
        setActiveTab('summary')
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to complete structure audit. Please check the URL.')
    }
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!url.trim()) {
      setError('Please enter a website URL.')
      return
    }

    const payload = {
      websiteUrl: url.trim(),
      focusNiche: focusNiche.trim() || undefined,
    }

    if (popupEnabled) {
      pendingPayloadRef.current = payload
      triggerPopup()
      return
    }

    handleAudit(payload)
  }

  const handleLeadSubmitWithPayload = (leadData) => {
    handlePopupSubmit(leadData)
    if (pendingPayloadRef.current) {
      handleAudit({ ...pendingPayloadRef.current, leadId: leadData?.id })
    }
  }


  const handleExportExcel = () => {
    if (!results) return
    exportStructureAuditToExcel(results)
  }

  const handleCopyHtaccess = () => {
    if (!results?.redirectMap) return
    const htaccessText = results.redirectMap
      .map((r) => {
        try {
          const oldPath = new URL(r.sourceUrl).pathname
          return `Redirect 301 ${oldPath} ${r.targetUrl}`
        } catch {
          return `Redirect 301 ${r.sourceUrl} ${r.targetUrl}`
        }
      })
      .join('\n')

    navigator.clipboard.writeText(htaccessText)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Filtered lists
  const filteredInventory = (results?.currentInventory || []).filter((item) => {
    const matchSearch =
      inventorySearch === '' ||
      item.url?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.section?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.contentType?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sitemap?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.issue?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.recommendedAction?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.targetUrl?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.title?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.path?.toLowerCase().includes(inventorySearch.toLowerCase())

    const matchSection =
      inventorySectionFilter === 'all' ||
      item.section?.toLowerCase() === inventorySectionFilter.toLowerCase()

    const matchPriority =
      inventoryPriorityFilter === 'all' ||
      item.priority?.toLowerCase() === inventoryPriorityFilter.toLowerCase()

    const matchSitemap =
      inventorySitemapFilter === 'all' ||
      (inventorySitemapFilter === 'missing'
        ? item.sitemap === 'MISSING'
        : item.sitemap !== 'MISSING')

    const matchHeader =
      inventoryHeaderFilter === 'all' ||
      (inventoryHeaderFilter === 'yes' ? item.inHeaderNav !== 'No' : item.inHeaderNav === 'No')

    const matchFooter =
      inventoryFooterFilter === 'all' ||
      (inventoryFooterFilter === 'yes' ? item.inFooter !== 'No' : item.inFooter === 'No')

    return matchSearch && matchSection && matchPriority && matchSitemap && matchHeader && matchFooter
  })

  const filteredRedirects = (results?.redirectMap || []).filter((r) => {
    return (
      redirectSearch === '' ||
      r.sourceUrl?.toLowerCase().includes(redirectSearch.toLowerCase()) ||
      r.targetUrl?.toLowerCase().includes(redirectSearch.toLowerCase()) ||
      r.reason?.toLowerCase().includes(redirectSearch.toLowerCase())
    )
  })

  const filteredRecommended = (results?.recommendedStructure || []).filter((item) => {
    return (
      recommendedSearch === '' ||
      item.recommendedUrl?.toLowerCase().includes(recommendedSearch.toLowerCase()) ||
      item.page?.toLowerCase().includes(recommendedSearch.toLowerCase()) ||
      item.section?.toLowerCase().includes(recommendedSearch.toLowerCase()) ||
      item.notes?.toLowerCase().includes(recommendedSearch.toLowerCase())
    )
  })

  const filteredPages = (results?.pagesToCreate || []).filter((item) => {
    const category = item.section || ''
    const pageName = item.pageName || ''
    const proposedUrl = item.proposedUrl || ''
    const notes = item.why || ''

    const matchSearch =
      pagesSearch === '' ||
      pageName.toLowerCase().includes(pagesSearch.toLowerCase()) ||
      category.toLowerCase().includes(pagesSearch.toLowerCase()) ||
      proposedUrl.toLowerCase().includes(pagesSearch.toLowerCase()) ||
      notes.toLowerCase().includes(pagesSearch.toLowerCase())

    const matchCategory =
      pagesCategoryFilter === 'all' ||
      category.toLowerCase().startsWith(pagesCategoryFilter.toLowerCase())

    return matchSearch && matchCategory
  })

  // Extract distinct top-level categories for filter pills
  const availableCategories = [
    'all',
    ...new Set(
      (results?.pagesToCreate || [])
        .map((p) => (p.section || '').split(':')[0].trim())
        .filter(Boolean)
    ),
  ]

  // Distinct sections present in this audit (dynamic — matches crawled data)
  const sectionOptions = [
    ...new Set((results?.currentInventory || []).map((i) => i.section).filter(Boolean)),
  ].sort()

  // Exact Summary metrics matching user reference
  const invStats = results?.summary?.currentInventory || {
    totalUrls: results?.currentInventory?.length || 0,
    blogPosts: (results?.currentInventory || []).filter((p) => p.contentType === 'Blog post').length,
    featurePages: (results?.currentInventory || []).filter(
      (p) => p.section === 'Features' || p.contentType === 'Feature'
    ).length,
    industryPages: (results?.currentInventory || []).filter(
      (p) => p.section === 'Industries' || p.contentType === 'Industry'
    ).length,
    countryPages: (results?.currentInventory || []).filter(
      (p) => p.section === 'Locations' || p.contentType === 'Location'
    ).length,
    productPages: (results?.currentInventory || []).filter(
      (p) => p.section === 'Products' || p.contentType === 'Product'
    ).length,
  }

  const issueStats = results?.summary?.issues || {
    missingFromSitemap: (results?.currentInventory || []).filter((p) => p.sitemap === 'MISSING').length,
    notInHeaderNav: (results?.currentInventory || []).filter(
      (p) => p.inHeaderNav === 'No' && p.contentType !== 'Blog post'
    ).length,
    flaggedWithIssue: (results?.currentInventory || []).filter((p) => p.issue && p.issue.trim() !== '').length,
    highPriority: (results?.currentInventory || []).filter((p) => p.priority === 'High').length,
    mediumPriority: (results?.currentInventory || []).filter((p) => p.priority === 'Medium').length,
    urlsToRedirect: results?.redirectMap?.length || 0,
  }

  const recStats = results?.summary?.recommendedStructure || {
    pagesInRecommended: results?.recommendedStructure?.length || 0,
    keptAsIs: (results?.recommendedStructure || []).filter((r) => r.status === 'Keep').length,
    renamedMovedRebuilt: (results?.recommendedStructure || []).filter((r) => r.status === 'Rebuild').length,
    newPagesToCreate: results?.pagesToCreate?.length || 0,
  }

  const handleCopyUrl = (urlToCopy) => {
    navigator.clipboard.writeText(urlToCopy)
    setCopiedUrl(urlToCopy)
    setTimeout(() => setCopiedUrl(null), 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead capture popup */}
      {popupEnabled && showPopup && (
        <LeadCaptureModal
          isOpen={showPopup}
          onClose={handlePopupClose}
          onSubmit={handleLeadSubmitWithPayload}
          toolSlug="website-structure-audit"
        />
      )}

      {/* Hero Header Section */}
      <section className="relative overflow-hidden !pt-20 sm:!pt-28 lg:!pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Missive's SEO Tools • Information Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">Website Structure </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Audit & Taxonomy
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Crawl and audit website URL click depth, directory silos, internal linking PageRank distribution, 301
            redirect maps, and missing high-converting content gaps.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-10 relative z-10 space-y-8">
        {/* Input Card - hidden while loading */}
        {!isLoading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 transition-all">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-7 space-y-2">
                  <label className="block text-sm font-bold text-slate-800">
                    Website URL to Audit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm sm:text-base font-medium"
                    />
                  </div>
                </div>

                <div className="md:col-span-5 space-y-2">
                  <label className="block text-sm font-bold text-slate-800">
                    Industry / Focus Niche (Optional)
                  </label>
                  <input
                    type="text"
                    value={focusNiche}
                    onChange={(e) => setFocusNiche(e.target.value)}
                    placeholder="e.g. SaaS, eCommerce, FinTech"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm sm:text-base font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-5 h-5" />
                  <span>Audit Website Structure</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="py-4">
            <UnifiedToolLoader
              title="Crawling & Auditing Website Structure..."
              subtitle="Traversing XML sitemaps, calculating internal click depth hierarchy, analyzing topical silos, and identifying 301 redirects."
              steps={LOADING_STEPS}
              currentStep={2}
            />
          </div>
        )}

        {/* Results View */}
        {results && !isLoading && (
          <div className="space-y-6">
            {/* Top Results Overview Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shadow-inner ${
                    results.overallScore >= 85
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : results.overallScore >= 70
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  <span className="text-2xl leading-none">{results.overallScore}</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Score</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{results.domain}</h2>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                      Grade: {results.architectureGrade}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {results.totalPages} Discovered Pages • Max Click Depth: {results.maxDepth} • Silos:{' '}
                    {results.summary?.sectionBreakdown?.length || 1}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
                  title="Download all 5 sheets as Microsoft Excel file (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResults(null)
                    setUrl('')
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Audit
                </button>
              </div>
            </div>

            {/* 5 Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
              <nav className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'summary'
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Summary
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  Current Inventory
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {results.currentInventory?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('redirects')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'redirects'
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Redirect Map
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === 'redirects' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {results.redirectMap?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('recommended')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'recommended'
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Recommended Structure
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === 'recommended' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {results.recommendedStructure?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pages')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'pages'
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FilePlus className="w-4 h-4" />
                  Pages to Create
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === 'pages' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {results.pagesToCreate?.length || 0}
                  </span>
                </button>
              </nav>
            </div>

            {/* ────────────── TAB 1: SUMMARY ────────────── */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* 1:1 Spreadsheet Summary View matching User Reference */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight break-words">
                      {results.summary?.title || `${results.domain ? (results.domain.charAt(0).toUpperCase() + results.domain.slice(1)) : 'Website'} – Website Structure Audit`}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 italic mt-1 font-serif break-words">
                      {results.summary?.sourceDescription || `Source: ${results.domain} homepage navigation + discovered XML sitemaps.`}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        {/* Section 1: CURRENT INVENTORY */}
                        <tr className="bg-[#D9E1F2] border-y border-blue-200/80">
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] uppercase tracking-wider text-xs">
                            CURRENT INVENTORY
                          </td>
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] text-right w-44"></td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-800 font-medium">Total URLs audited</td>
                          <td className="py-2 px-6 font-bold text-gray-900 text-right font-mono">{invStats.totalUrls}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Blog posts</td>
                          <td className="py-2 px-6 font-bold text-gray-900 text-right font-mono">{invStats.blogPosts}</td>
                        </tr>
                        {buildInventoryCategoryRows(invStats, results?.currentInventory || []).map((row) => (
                          <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                            <td className="py-2 px-6 text-gray-700">{row.label}</td>
                            <td className="py-2 px-6 font-bold text-gray-900 text-right font-mono">{row.count}</td>
                          </tr>
                        ))}

                        {/* Section 2: ISSUES */}
                        <tr className="bg-[#D9E1F2] border-y border-blue-200/80">
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] uppercase tracking-wider text-xs">
                            ISSUES
                          </td>
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] text-right w-44"></td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Live/linked pages missing from sitemap</td>
                          <td className="py-2 px-6 font-bold text-amber-600 text-right font-mono">{issueStats.missingFromSitemap}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Pages not in header navigation (non-blog)</td>
                          <td className="py-2 px-6 font-bold text-gray-900 text-right font-mono">{issueStats.notInHeaderNav}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Pages flagged with an issue</td>
                          <td className="py-2 px-6 font-bold text-rose-600 text-right font-mono">{issueStats.flaggedWithIssue}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">High-priority actions</td>
                          <td className="py-2 px-6 font-bold text-rose-600 text-right font-mono">{issueStats.highPriority}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Medium-priority actions</td>
                          <td className="py-2 px-6 font-bold text-amber-600 text-right font-mono">{issueStats.mediumPriority}</td>
                        </tr>
                        <tr className="border-b border-gray-200/80 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-800 font-medium">URLs to 301 redirect / move</td>
                          <td className="py-2 px-6 font-bold text-[#0C81F3] text-right font-mono">{issueStats.urlsToRedirect}</td>
                        </tr>

                        {/* Section 3: RECOMMENDED STRUCTURE */}
                        <tr className="bg-[#D9E1F2] border-y border-blue-200/80">
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] uppercase tracking-wider text-xs">
                            RECOMMENDED STRUCTURE
                          </td>
                          <td className="py-2.5 px-6 font-bold text-[#1F497D] text-right w-44"></td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-800 font-medium">Pages in recommended structure</td>
                          <td className="py-2 px-6 font-bold text-gray-900 text-right font-mono">{recStats.pagesInRecommended}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Kept as-is</td>
                          <td className="py-2 px-6 font-bold text-emerald-600 text-right font-mono">{recStats.keptAsIs}</td>
                        </tr>
                        <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">Renamed / moved / rebuilt</td>
                          <td className="py-2 px-6 font-bold text-amber-600 text-right font-mono">{recStats.renamedMovedRebuilt}</td>
                        </tr>
                        <tr className="border-b border-gray-200/80 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-6 text-gray-700">New pages to create</td>
                          <td className="py-2 px-6 font-bold text-purple-600 text-right font-mono">{recStats.newPagesToCreate}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* How to use */}
                  <div className="p-6 bg-white space-y-3">
                    <h4 className="text-sm font-bold text-gray-900">How to use</h4>
                    <div className="space-y-3 text-xs text-gray-700 leading-relaxed font-sans">
                      <p><strong className="font-semibold text-gray-900">Current Inventory:</strong> every URL found, filterable by section, issue, and priority.</p>
                      <p><strong className="font-semibold text-gray-900">Redirect Map:</strong> hand this to your developer to set up 301s (canonical target in column B).</p>
                      <p><strong className="font-semibold text-gray-900">Recommended Structure:</strong> target information architecture; Level column drives indentation.</p>
                      <p><strong className="font-semibold text-gray-900">Pages to Create:</strong> new pages with Owner and Status columns for tracking (Status is a dropdown).</p>
                      <p className="text-gray-500 italic"><strong className="font-semibold text-gray-700 not-italic">Caveat:</strong> pages were classified from navigation, sitemaps and slugs. Run a full crawl (e.g. Screaming Frog) to catch 404s, redirect chains and thin content before redirecting.</p>
                    </div>
                  </div>
                </div>

                {/* Executive Overview Banner */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0C81F3]" />
                    Executive Architecture Summary
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {results.summary?.executiveOverview ||
                      'Comprehensive crawl and hierarchy analysis of the target website completed.'}
                  </p>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Total Pages</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {results.summary?.keyMetrics?.totalPages || results.totalPages}
                    </p>
                    <span className="text-[11px] text-emerald-600">Discovered URLs</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Max Depth</span>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        results.maxDepth <= 3 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {results.summary?.keyMetrics?.maxDepth || results.maxDepth}
                    </p>
                    <span className="text-[11px] text-gray-400">Target: &le; 3 clicks</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Avg Depth</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {results.summary?.keyMetrics?.averageDepth ?? '—'}
                    </p>
                    <span className="text-[11px] text-gray-400">Mean click levels</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Verified Live</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {results.summary?.keyMetrics?.verifiedPages ?? 0}
                    </p>
                    <span className="text-[11px] text-gray-400">HTTP-checked URLs</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Deep Pages</span>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        (results.summary?.depthDistribution?.[3]?.count || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {results.summary?.depthDistribution?.[3]?.count || 0}
                    </p>
                    <span className="text-[11px] text-gray-400">&ge; 4 clicks (Crawl Waste)</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                    <span className="text-xs text-gray-500 font-medium">Redirects Needed</span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{results.redirectMap?.length || 0}</p>
                    <span className="text-[11px] text-gray-400">301 candidates</span>
                  </div>
                </div>

                {/* Depth Distribution & Silo Breakdown Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Depth Distribution */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#0C81F3]" />
                        Click Depth Distribution
                      </h3>
                      <span className="text-xs text-gray-500 shrink-0">Benchmark: &le; 3 Levels</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {results.summary?.depthDistribution?.map((d, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline gap-3 text-xs font-semibold">
                            <span className="text-gray-700 min-w-0 break-words">{d.level}</span>
                            <span className="text-gray-900 font-bold shrink-0 whitespace-nowrap">
                              {d.count} pages ({d.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                idx === 0
                                  ? 'bg-emerald-500'
                                  : idx === 1
                                  ? 'bg-blue-500'
                                  : idx === 2
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, d.percentage))}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Silo Directory Breakdown */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-[#0C81F3]" />
                        Topical Silos & Directories
                      </h3>
                      <span className="text-xs text-gray-500 shrink-0">
                        {results.summary?.sectionBreakdown?.length || 0} Silos Identified
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {results.summary?.sectionBreakdown?.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 break-words">{s.siloName}</span>
                              <code className="text-[11px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 break-all">
                                {s.directoryPath}
                              </code>
                            </div>
                            <p className="text-gray-500 text-[11px] mt-0.5 break-words">{s.description}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span className="font-bold text-gray-900">{s.pageCount} URLs</span>
                            <div className="mt-0.5">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  s.status === 'Optimal'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority Architecture Recommendations */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#0C81F3]" />
                    Priority Restructuring Roadmap
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.summary?.priorityRecommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                rec.priority === 'High'
                                  ? 'bg-rose-100 text-rose-800'
                                  : rec.priority === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {rec.priority} Priority
                            </span>
                            <span className="text-xs text-gray-400 font-medium">{rec.category}</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 break-words">{rec.title}</h4>
                          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed break-words">{rec.description}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 text-[11px] font-medium text-emerald-700 break-words">
                          Impact: {rec.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ────────────── TAB 2: CURRENT INVENTORY ────────────── */}
            {activeTab === 'inventory' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                {/* Header Stats Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-[#0C81F3]" />
                      Current Inventory
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Every URL discovered via sitemaps and homepage navigation, with headers, footers, issues, and actions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                      Total: <strong className="text-gray-900 font-mono">{results.currentInventory?.length || 0}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                      Issues: <strong className="font-mono">{(results.currentInventory || []).filter(i => i.issue && i.issue.trim() !== '').length}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                      High Priority: <strong className="font-mono">{(results.currentInventory || []).filter(i => i.priority === 'High').length}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      Missing Sitemaps: <strong className="font-mono">{(results.currentInventory || []).filter(i => i.sitemap === 'MISSING').length}</strong>
                    </span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                  <div className="lg:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Search URLs, sections, issues, actions..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    />
                  </div>

                  <div>
                    <select
                      value={inventorySectionFilter}
                      onChange={(e) => setInventorySectionFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    >
                      <option value="all">All Sections</option>
                      {sectionOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={inventoryPriorityFilter}
                      onChange={(e) => setInventoryPriorityFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    >
                      <option value="all">All Priorities</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={inventorySitemapFilter}
                      onChange={(e) => setInventorySitemapFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    >
                      <option value="all">All Sitemaps</option>
                      <option value="in_sitemap">In Sitemap</option>
                      <option value="missing">Missing from Sitemap</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={inventoryHeaderFilter}
                      onChange={(e) => setInventoryHeaderFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    >
                      <option value="all">All Header Nav</option>
                      <option value="yes">In Header Nav</option>
                      <option value="no">Not in Header Nav</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={inventoryFooterFilter}
                      onChange={(e) => setInventoryFooterFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                    >
                      <option value="all">All Footer</option>
                      <option value="yes">In Footer</option>
                      <option value="no">Not in Footer</option>
                    </select>
                  </div>
                </div>

                {/* 10-Column Spreadsheet Table Matching User Screenshot */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200 text-xs border-collapse">
                    <thead className="bg-[#1F497D] text-white select-none">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold tracking-wide w-72 whitespace-nowrap">URL</th>
                        <th className="px-3 py-3 text-left font-bold tracking-wide w-28 whitespace-nowrap">Section</th>
                        <th className="px-3 py-3 text-left font-bold tracking-wide w-40 whitespace-nowrap">Content Type</th>
                        <th className="px-3 py-3 text-center font-bold tracking-wide w-24 whitespace-nowrap">Sitemap</th>
                        <th className="px-3 py-3 text-center font-bold tracking-wide w-28 whitespace-nowrap">In Header Nav</th>
                        <th className="px-3 py-3 text-center font-bold tracking-wide w-24 whitespace-nowrap">In Footer</th>
                        <th className="px-4 py-3 text-left font-bold tracking-wide min-w-[240px]">Issue</th>
                        <th className="px-4 py-3 text-left font-bold tracking-wide w-56 whitespace-nowrap">Recommended Action</th>
                        <th className="px-4 py-3 text-left font-bold tracking-wide w-64 whitespace-nowrap">Target URL</th>
                        <th className="px-3 py-3 text-center font-bold tracking-wide w-24 whitespace-nowrap">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredInventory.map((row, idx) => {
                        const isMissing = row.sitemap === 'MISSING'
                        const isHigh = row.priority === 'High'
                        const isMedium = row.priority === 'Medium'

                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isHigh
                                ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                : isMedium
                                ? 'bg-amber-50/15 hover:bg-amber-50/30'
                                : 'hover:bg-blue-50/30'
                            }`}
                          >
                            {/* 1. URL */}
                            <td className="px-4 py-2.5 w-72">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600 hover:text-blue-800 font-medium">
                                <a
                                  href={row.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={row.url}
                                  className="truncate block min-w-0 hover:underline"
                                >
                                  {row.url}
                                </a>
                                <span
                                  className="text-gray-400 hover:text-blue-600 shrink-0"
                                  aria-hidden="true"
                                >
                                  <ExternalLink className="w-3 h-3 inline" />
                                </span>
                              </div>
                            </td>

                            {/* 2. Section */}
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                                  row.section === 'Core'
                                    ? 'bg-slate-100 text-slate-700'
                                    : row.section === 'Company'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                                    : row.section === 'Partners'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                    : row.section === 'Legal'
                                    ? 'bg-gray-100 text-gray-700'
                                    : row.section === 'Resources'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200/60'
                                    : row.section === 'Products'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                    : row.section === 'Industries'
                                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'
                                    : row.section === 'Features'
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                                    : 'bg-sky-50 text-sky-800 border border-sky-200/60'
                                }`}
                              >
                                {row.section || 'Core'}
                              </span>
                            </td>

                            {/* 3. Content Type */}
                            <td className="px-3 py-2.5">
                              <span
                                className={`text-[11px] ${
                                  row.contentType === 'WordPress default'
                                    ? 'text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded'
                                    : row.contentType?.includes('hub') || row.contentType === 'Hub'
                                    ? 'text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded'
                                    : row.contentType === 'Conversion'
                                    ? 'text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded'
                                    : row.contentType?.includes('Industry')
                                    ? 'text-indigo-800 font-medium'
                                    : 'text-gray-800 font-medium'
                                }`}
                              >
                                {row.contentType || 'Page'}
                              </span>
                            </td>

                            {/* 4. Sitemap */}
                            <td className="px-3 py-2.5 text-center">
                              {isMissing ? (
                                <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
                                  MISSING
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] text-gray-700 bg-gray-100">
                                  {row.sitemap || 'page'}
                                </span>
                              )}
                            </td>

                            {/* 5. In Header Nav */}
                            <td className="px-3 py-2.5 text-center">
                              {row.inHeaderNav === 'Logo' ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-blue-700 bg-blue-50">
                                  Logo
                                </span>
                              ) : row.inHeaderNav?.includes('anchors') ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-amber-800 bg-amber-50 border border-amber-200/50">
                                  {row.inHeaderNav}
                                </span>
                              ) : row.inHeaderNav === 'Yes' ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-emerald-700 bg-emerald-50">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">No</span>
                              )}
                            </td>

                            {/* 6. In Footer */}
                            <td className="px-3 py-2.5 text-center">
                              {row.inFooter === 'Logo' ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-blue-700 bg-blue-50">
                                  Logo
                                </span>
                              ) : row.inFooter?.includes('x') ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-amber-800 bg-amber-50 border border-amber-200/50">
                                  {row.inFooter}
                                </span>
                              ) : row.inFooter === 'Yes' ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11px] text-emerald-700 bg-emerald-50">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">No</span>
                              )}
                            </td>

                            {/* 7. Issue */}
                            <td className="px-4 py-2.5">
                              {row.issue ? (
                                <span className="block max-w-[340px] break-words text-gray-800 text-xs leading-relaxed font-normal">
                                  {row.issue}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>

                            {/* 8. Recommended Action */}
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-block max-w-[210px] text-xs break-words ${
                                  row.recommendedAction?.includes('Delete') || row.recommendedAction?.includes('410')
                                    ? 'font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60'
                                    : row.recommendedAction?.includes('Merge + 301')
                                    ? 'font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60'
                                    : row.recommendedAction?.includes('Rebuild')
                                    ? 'font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60'
                                    : row.recommendedAction?.includes('Add to sitemap')
                                    ? 'font-bold text-rose-700'
                                    : row.recommendedAction?.includes('Keep')
                                    ? 'font-medium text-emerald-700'
                                    : 'font-medium text-gray-800'
                                }`}
                              >
                                {row.recommendedAction || row.action || 'Keep'}
                              </span>
                            </td>

                            {/* 9. Target URL */}
                            <td className="px-4 py-2.5 w-64">
                              {row.targetUrl ? (
                                <div className="flex items-center gap-1 font-mono text-[11px] text-blue-600 font-medium">
                                  <a
                                    href={row.targetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={row.targetUrl}
                                    className="truncate block min-w-0 hover:underline"
                                  >
                                    {row.targetUrl}
                                  </a>
                                  <span
                                    className="text-gray-400 hover:text-blue-600 shrink-0"
                                    aria-hidden="true"
                                  >
                                    <ExternalLink className="w-3 h-3 inline" />
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>

                            {/* 10. Priority */}
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isHigh
                                    ? 'bg-[#FCE8E6] text-[#C5221F] border border-rose-200'
                                    : isMedium
                                    ? 'bg-[#FEF7E0] text-[#B06000] border border-amber-200'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {row.priority || 'Low'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filteredInventory.length === 0 && (
                    <div className="p-12 text-center text-xs text-gray-400">
                      No URLs matched the selected filter criteria.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────────── TAB 3: REDIRECT MAP ────────────── */}
            {activeTab === 'redirects' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#0C81F3]" />
                      301 Permanent Redirect Roadmap
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Eliminate deep nesting and duplicate URLs while passing 100% PageRank authority.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyHtaccess}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied .htaccess!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          Copy .htaccess Rules
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={redirectSearch}
                    onChange={(e) => setRedirectSearch(e.target.value)}
                    placeholder="Search source / target URL or reason..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">From URL</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">To URL (301)</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Reason</th>
                        <th className="px-3 py-3 text-center font-bold text-gray-700">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRedirects.map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-rose-700">
                            <div className="max-w-[300px] truncate" title={r.sourceUrl}>
                              {r.sourceUrl}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-emerald-700">
                            <div className="flex items-center gap-1.5 max-w-[300px]" title={r.targetUrl}>
                              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate min-w-0">{r.targetUrl}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-[11px]">
                            <div className="max-w-[380px] break-words leading-snug">{r.reason}</div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                r.priority === 'High'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredRedirects.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400">
                      No redirects required! Current URL hierarchy is already optimal.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────────── TAB 4: RECOMMENDED STRUCTURE ────────────── */}
            {activeTab === 'recommended' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0C81F3]" />
                    Target Information Architecture & Silo Hierarchy
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Strategic, clean URL hierarchy designed for topical authority clustering and indexing velocity.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={recommendedSearch}
                    onChange={(e) => setRecommendedSearch(e.target.value)}
                    placeholder="Search page, section, URL or notes..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-center font-bold text-gray-700 w-16">Level</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-700">Section</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Page</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Recommended URL</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Current URL (source)</th>
                        <th className="px-3 py-3 text-center font-bold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRecommended.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-3 py-3 text-center font-mono text-[11px] text-gray-500">{item.level}</td>

                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-semibold text-[11px]">
                              {item.section}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div
                              className="max-w-[240px] truncate font-semibold text-gray-900"
                              title={item.page}
                            >
                              {item.page}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div
                              className="max-w-[300px] truncate font-mono text-[11px] text-blue-700"
                              title={item.recommendedUrl}
                            >
                              {item.recommendedUrl}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div
                              className="max-w-[300px] truncate font-mono text-[11px] text-gray-500"
                              title={item.currentUrl || ''}
                            >
                              {item.currentUrl || '-'}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                item.status === 'New'
                                  ? 'bg-purple-100 text-purple-800'
                                  : item.status === 'Rebuild'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div
                              className="max-w-[400px] break-words text-gray-600 text-[11px] leading-snug line-clamp-4"
                              title={item.notes || ''}
                            >
                              {item.notes || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ────────────── TAB 5: PAGES TO CREATE ────────────── */}
            {activeTab === 'pages' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <FilePlus className="w-4 h-4 text-[#0C81F3]" />
                      Architecture & Content Gap Roadmap
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Missing high-value pages, category hubs, integration directories, and conversion funnels needed to complete topical silos.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 self-start sm:self-auto">
                    <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                    {results.pagesToCreate?.length || 0} Pages Recommended
                  </span>
                </div>

                {/* Filters & Search */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={pagesSearch}
                        onChange={(e) => setPagesSearch(e.target.value)}
                        placeholder="Search proposed pages, URLs, categories, or notes..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span>Showing {filteredPages.length} of {results.pagesToCreate?.length || 0} pages</span>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  {availableCategories.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableCategories.map((cat) => {
                        const isAll = cat === 'all'
                        const count = isAll
                          ? results.pagesToCreate?.length || 0
                          : (results.pagesToCreate || []).filter((p) =>
                              (p.section || '').toLowerCase().startsWith(cat.toLowerCase())
                            ).length

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setPagesCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              pagesCategoryFilter === cat
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isAll ? 'All Categories' : cat}
                            <span
                              className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                                pagesCategoryFilter === cat
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white text-gray-600 border border-gray-200'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Table View matching Excel exact layout */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-center font-bold text-gray-700 w-12">#</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700 w-48">Section</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700 w-52">Page</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Recommended URL</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-700">Why</th>
                        <th className="px-3 py-3 text-center font-bold text-gray-700 w-24">Owner</th>
                        <th className="px-3 py-3 text-center font-bold text-gray-700 w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredPages.map((p, idx) => {
                        const category = p.section || 'General'
                        const pageName = p.pageName || ''
                        const proposedUrl = p.proposedUrl || ''
                        const notes = p.why || ''
                        const owner = p.owner || ''
                        const status = p.status || 'Not started'

                        // Dynamic Category Colors
                        const catLower = category.toLowerCase()
                        const badgeColor =
                          catLower.includes('product')
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : catLower.includes('feature')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : catLower.includes('integration') || catLower.includes('api')
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : catLower.includes('industr')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : catLower.includes('location')
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : catLower.includes('conversion') || catLower.includes('pricing') || catLower.includes('demo')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : catLower.includes('trust') || catLower.includes('security')
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : catLower.includes('resource') || catLower.includes('blog')
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : catLower.includes('partner')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'

                        return (
                          <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-3 py-3 text-center text-gray-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badgeColor}`}
                              >
                                {category}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold text-gray-900 break-words max-w-[220px]">
                              {pageName}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 group max-w-[360px]">
                                <a
                                  href={proposedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[11px] text-blue-700 hover:underline truncate min-w-0"
                                  title={proposedUrl}
                                >
                                  {proposedUrl}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(proposedUrl)}
                                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors shrink-0"
                                  title="Copy URL"
                                >
                                  {copiedUrl === proposedUrl ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div
                                className="max-w-[420px] break-words text-gray-600 text-[11px] leading-relaxed line-clamp-4"
                                title={notes}
                              >
                                {notes}
                              </div>
                            </td>

                            <td className="px-3 py-3 text-center text-gray-500 text-[11px]">
                              {owner || '-'}
                            </td>

                            <td className="px-3 py-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                {status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredPages.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No pages to create found matching your filter criteria.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SEO Information Architecture FAQ Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#0C81F3]" />
            Website Structure & Taxonomy FAQs
          </h3>

          <div className="divide-y divide-gray-100">
            {FAQ_ITEMS.map((faq, idx) => (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-gray-900 hover:text-[#0C81F3] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
