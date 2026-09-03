
import { useState, useMemo } from 'react'
import { useExtractWebsiteImagesMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  Globe,
  Sparkles,
  Zap,
  RefreshCw,
  AlertCircle,
  Download,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  FileCode2,
  Share2,
  AlertTriangle,
  Search,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react'
import { getApiUrl } from '../../utils/apiUrl'

const LOADING_STEPS = [
  'Connecting to website & resolving DNS securely',
  'Scanning HTML for <img>, picture sources, and lazy-load data',
  'Detecting vector SVGs, brand favicons & icons',
  'Extracting Open Graph and Twitter share banners',
  'Normalizing URLs, checking SEO alt text & file formats',
]

const FAQ_ITEMS = [
  {
    q: 'How does the Website Image Extractor work?',
    a: 'Our extractor scans the entire page DOM including standard <img> elements, modern responsive <picture> sources, lazy-loaded images (data-src, data-srcset), inline CSS backgrounds, SVG vector icons, and Open Graph / Twitter social banners. It converts all paths into absolute URLs and organizes them with SEO metadata.',
  },
  {
    q: 'Why are some images missing Alt text and why does it matter?',
    a: 'Alt text (alternative text) is crucial for search engine optimization and accessibility. Search engines use alt text to understand the subject of an image, and screen readers read it aloud to visually impaired users. You can use our "Missing Alt Text" filter to identify images needing SEO optimization.',
  },
  {
    q: 'How does the direct download button work without CORS errors?',
    a: 'Many websites block direct browser downloading of images via Cross-Origin Resource Sharing (CORS) rules. Our tool routes download requests through a secure server proxy with proper attachment headers, ensuring you can download any image directly to your device.',
  },
  {
    q: 'Can I export all image URLs at once?',
    a: 'Yes! You can copy all image URLs to your clipboard with one click, or download a structured CSV spreadsheet containing image filenames, URLs, formats, and alt texts for easy cataloging.',
  },
  {
    q: 'Can I extract SVGs and logos?',
    a: 'Absolutely. The tool automatically detects standalone SVG files, embedded vector objects, and brand favicons, grouping them under the "Logos & SVGs" filter.',
  },
]

export default function WebsiteImageExtractorPage() {
  const [url, setUrl] = useState('')
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'photo' | 'vector' | 'social' | 'missingAlt'
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [previewImage, setPreviewImage] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [error, setError] = useState('')

  // Multi-select & Batch Download state
  const [selectedUrls, setSelectedUrls] = useState(new Set())
  const [downloadingUrl, setDownloadingUrl] = useState(null)
  const [batchProgress, setBatchProgress] = useState(null) // { current: 1, total: 5 }

  // Mutation
  const [extractImages, { isLoading }] = useExtractWebsiteImagesMutation()
  const [results, setResults] = useState(null)

  // Lead Modal Integration
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('website-image-extractor')
  const [pendingPayload, setPendingPayload] = useState(null)

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Handle Form Submission
  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!url.trim()) {
      setError('Please enter a website URL.')
      return
    }

    setError('')
    const payload = { url: url.trim() }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
      return
    }

    executeExtraction(payload)
  }

  const executeExtraction = async (payload, leadId = null) => {
    try {
      const data = await extractImages({
        ...payload,
        leadId,
      }).unwrap()

      setResults(data)
      setActiveCategory('all')
      setSearchQuery('')
      setSelectedUrls(new Set())
      setBatchProgress(null)

      setTimeout(() => {
        document.getElementById('image-extractor-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to extract images from website.')
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
    setResults(null)
    setError('')
    setPreviewImage(null)
    setSelectedUrls(new Set())
    setBatchProgress(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filtered images list
  const filteredImages = useMemo(() => {
    if (!results?.images) return []
    let list = results.images

    // Filter by category
    if (activeCategory === 'missingAlt') {
      list = list.filter((img) => !img.hasAlt)
    } else if (activeCategory !== 'all') {
      list = list.filter((img) => img.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (img) =>
          (img.filename && img.filename.toLowerCase().includes(q)) ||
          (img.alt && img.alt.toLowerCase().includes(q)) ||
          (img.format && img.format.toLowerCase().includes(q)) ||
          (img.url && img.url.toLowerCase().includes(q))
      )
    }

    return list
  }, [results, activeCategory, searchQuery])

  // Helper: Derive safe filename with proper extension (.svg, .png, .jpg, .webp)
  const getSafeFilename = (img) => {
    const extMap = {
      svg: '.svg',
      png: '.png',
      jpg: '.jpg',
      jpeg: '.jpg',
      webp: '.webp',
      gif: '.gif',
      avif: '.avif',
      ico: '.ico',
    }
    const fmt = (img.format || '').toLowerCase()
    const expectedExt = extMap[fmt] || (img.url?.toLowerCase().includes('.svg') ? '.svg' : '.png')
    let base = (img.filename || 'image')
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
    if (!base || base === '_') base = 'image'
    return `${base}${expectedExt}`
  }

  // Reliable Image Download (Blob-based to prevent saving as .html)
  const downloadSingleImage = async (img) => {
    const safeFilename = getSafeFilename(img)
    setDownloadingUrl(img.url)

    try {
      if (img.url.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = img.url
        a.download = safeFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }

      const downloadEndpoint = getApiUrl(
        `/image-extractor/download?url=${encodeURIComponent(img.url)}&filename=${encodeURIComponent(safeFilename)}`
      )
      const resp = await fetch(downloadEndpoint)
      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`)
      }
      const blob = await resp.blob()
      if (blob.type && blob.type.includes('text/html')) {
        throw new Error('Received an HTML page instead of an image')
      }

      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = safeFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
    } catch (err) {
      console.warn('Proxy download error, opening directly in new tab:', err.message)
      window.open(img.url, '_blank')
    } finally {
      setDownloadingUrl(null)
    }
  }

  // Toggle selection for a single image
  const toggleSelect = (imgUrl) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      if (next.has(imgUrl)) next.delete(imgUrl)
      else next.add(imgUrl)
      return next
    })
  }

  // Check if all currently filtered images are selected
  const isAllSelected =
    filteredImages.length > 0 && filteredImages.every((img) => selectedUrls.has(img.url))

  // Select / Unselect all filtered images
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUrls((prev) => {
        const next = new Set(prev)
        filteredImages.forEach((img) => next.delete(img.url))
        return next
      })
    } else {
      setSelectedUrls((prev) => {
        const next = new Set(prev)
        filteredImages.forEach((img) => next.add(img.url))
        return next
      })
    }
  }

  // Batch Download all selected images with spacing
  const downloadSelectedImages = async () => {
    const toDownload = filteredImages.filter((img) => selectedUrls.has(img.url))
    if (toDownload.length === 0) return

    setBatchProgress({ current: 0, total: toDownload.length })

    for (let i = 0; i < toDownload.length; i++) {
      setBatchProgress({ current: i + 1, total: toDownload.length })
      await downloadSingleImage(toDownload[i])
      // 350ms delay between files so browser does not block multiple triggers
      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    setBatchProgress(null)
  }

  // Copy all URLs
  const copyAllUrls = () => {
    if (!filteredImages.length) return
    const text = filteredImages.map((img) => img.url).join('\n')
    handleCopy(text, 'copy-all-urls')
  }

  // Export CSV
  const exportCsv = () => {
    if (!filteredImages.length) return
    const headers = 'Filename,Format,Category,Has Alt,Alt Text,Dimensions,Image URL\n'
    const rows = filteredImages
      .map((img) => {
        const dimensions = img.width && img.height ? `"${img.width}x${img.height}"` : '""'
        const cleanAlt = `"${(img.alt || '').replace(/"/g, '""')}"`
        const cleanName = `"${(img.filename || '').replace(/"/g, '""')}"`
        return `${cleanName},${img.format || 'unknown'},${img.category},${img.hasAlt ? 'Yes' : 'No'},${cleanAlt},${dimensions},"${img.url}"`
      })
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `extracted-images-${results?.hostname || 'website'}.csv`
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
        toolSlug="website-image-extractor"
        title="Unlock Free Website Image Extractor"
        subtitle="Extract all images, vector SVGs, and social banners from any URL with 1-click downloads."
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
            <span className="text-gray-900">Website Image </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Extractor & Downloader
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Extract and download all images, vector SVGs, brand logos, and social share graphics from any website. Inspect SEO alt tags, preview resolutions, and export in bulk.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* URL Input Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10 transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="image-extractor-url-input" className="block text-sm font-bold text-slate-800">
                Website or Page URL to Extract Images From <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  id="image-extractor-url-input"
                  type="text"
                  placeholder="https://example.com or company.com/blog/article"
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
                  className="absolute right-3 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  Paste
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Captures standard images, responsive pictures, SVGs, Open Graph, and favicons</span>
              </div>

              <div className="flex items-center gap-3">
                {results && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-3 rounded-full border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                      <span>Extracting Images...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Extract All Images</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
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

        {/* Loader Progress */}
        {isLoading && (
          <div className="py-8">
            <UnifiedToolLoader
              steps={LOADING_STEPS}
              currentStep={2}
              title="Crawling Website & Discovering High-Res Images"
            />
          </div>
        )}

        {/* Results Section */}
        {results && !isLoading && (
          <div id="image-extractor-results" className="space-y-8 pt-2">
            {/* Top Stats Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#0C81F3]" />
                  Total Images
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {results.totalImages?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">{results.hostname}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  With Alt Text
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                  {results.stats?.withAlt || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">{results.stats?.altPercentage || 0}% SEO coverage</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Missing Alt Text
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-black mt-1 ${
                    results.stats?.withoutAlt > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {results.stats?.withoutAlt || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">SEO improvement opportunity</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  File Formats
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {Object.keys(results.stats?.formatCounts || {}).length}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {Object.entries(results.stats?.formatCounts || {})
                    .map(([fmt, count]) => `${fmt.toUpperCase()} (${count})`)
                    .slice(0, 3)
                    .join(', ')}
                </div>
              </div>
            </div>

            {/* Controls Bar: Categories, Search, View Toggle, and Bulk Actions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    All Images ({results.totalImages || 0})
                  </button>

                  <button
                    onClick={() => setActiveCategory('photo')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === 'photo'
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Photos & Content ({results.stats?.categories?.photos || 0})
                  </button>

                  <button
                    onClick={() => setActiveCategory('vector')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === 'vector'
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Logos & SVGs ({results.stats?.categories?.vectors || 0})
                  </button>

                  <button
                    onClick={() => setActiveCategory('social')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === 'social'
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Social Cards ({results.stats?.categories?.social || 0})
                  </button>

                  <button
                    onClick={() => setActiveCategory('missingAlt')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === 'missingAlt'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Missing Alt Text ({results.stats?.categories?.missingAlt || 0})
                  </button>
                </div>

                {/* Bulk Export Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAllUrls}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'copy-all-urls' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>URLs Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All URLs</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Search and Layout Toggle */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by filename, format (png, svg, webp) or alt text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-xs font-bold text-slate-500">
                    Showing {filteredImages.length} of {results.totalImages} images
                  </span>

                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white shadow-xs text-[#0C81F3]' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        viewMode === 'list' ? 'bg-white shadow-xs text-[#0C81F3]' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Selection & Batch Action Toolbar */}
              {filteredImages.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      {isAllSelected ? (
                        <>
                          <CheckSquare className="w-4 h-4 text-[#0C81F3]" />
                          <span>Unselect All</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 text-slate-400" />
                          <span>Select All ({filteredImages.length})</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs text-slate-600 font-medium">
                      Selected: <strong className="text-slate-900">{selectedUrls.size}</strong> of {filteredImages.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadSelectedImages}
                      disabled={selectedUrls.size === 0 || Boolean(batchProgress)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      {batchProgress ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Downloading {batchProgress.current} / {batchProgress.total}...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Selected ({selectedUrls.size})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Images Display */}
            {filteredImages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-bold text-slate-800">No images match your filter.</p>
                <p className="text-xs text-slate-500 mt-1">Try selecting "All Images" or clearing your search query.</p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredImages.map((img, idx) => {
                  const isSelected = selectedUrls.has(img.url)
                  const isDownloading = downloadingUrl === img.url

                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-2xl border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group relative ${
                        isSelected ? 'border-[#0C81F3] ring-2 ring-[#0C81F3]/40 bg-blue-50/15' : 'border-slate-200'
                      }`}
                    >
                      {/* Checkbox Overlay (Top Right) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(img.url)
                        }}
                        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-white/95 backdrop-blur-xs text-slate-700 hover:text-[#0C81F3] shadow-md transition-all cursor-pointer"
                        title={isSelected ? 'Unselect Image' : 'Select Image'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#0C81F3]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Thumbnail Frame */}
                      <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                        <img
                          src={img.url}
                          alt={img.alt || img.filename}
                          loading="lazy"
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.classList.add('bg-slate-50')
                          }}
                        />

                        {/* Format Badge */}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                          {img.format || 'img'}
                        </span>

                        {/* Category Badge */}
                        {img.category === 'social' && (
                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                            OG Banner
                          </span>
                        )}
                        {img.category === 'vector' && (
                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                            SVG / Vector
                          </span>
                        )}

                        {/* Zoom Trigger Button */}
                        <button
                          onClick={() => setPreviewImage(img)}
                          className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          title="Preview Full Size"
                        >
                          <div className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </button>
                      </div>

                      {/* Metadata Section */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-slate-900 truncate" title={img.filename}>
                            {img.filename}
                          </div>

                          {/* Alt Text Display */}
                          {img.hasAlt ? (
                            <p className="text-[11px] text-slate-600 line-clamp-2 italic" title={img.alt}>
                              "{img.alt}"
                            </p>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Missing Alt Text</span>
                            </div>
                          )}
                        </div>

                        {/* Actions Row */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleCopy(img.url, `card-url-${idx}`)}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                            title="Copy Image URL"
                          >
                            {copiedKey === `card-url-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy URL</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-[#0C81F3] rounded-lg hover:bg-slate-50 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => downloadSingleImage(img)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-gradient-to-r hover:from-[#0C81F3] hover:to-[#EB8988] text-slate-700 hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Direct Download"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>{isDownloading ? 'Saving...' : 'Save'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr>
                        <th className="px-4 py-3.5 w-10">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="cursor-pointer"
                            title={isAllSelected ? 'Unselect All' : 'Select All'}
                          >
                            {isAllSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#0C81F3]" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3.5">Preview</th>
                        <th className="px-4 py-3.5">Filename</th>
                        <th className="px-4 py-3.5">Format</th>
                        <th className="px-4 py-3.5">Alt Text</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredImages.map((img, idx) => {
                        const isSelected = selectedUrls.has(img.url)
                        const isDownloading = downloadingUrl === img.url

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <td className="px-4 py-3 w-10">
                              <button
                                type="button"
                                onClick={() => toggleSelect(img.url)}
                                className="cursor-pointer"
                                title={isSelected ? 'Unselect' : 'Select'}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#0C81F3]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 w-16">
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                                <img
                                  src={img.url}
                                  alt="thumbnail"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate" title={img.filename}>
                              {img.filename}
                            </td>
                            <td className="px-4 py-3 font-mono uppercase font-bold text-slate-600">
                              {img.format || 'img'}
                            </td>
                            <td className="px-4 py-3 max-w-sm">
                              {img.hasAlt ? (
                                <span className="text-slate-700 italic line-clamp-1">{img.alt}</span>
                              ) : (
                                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Missing Alt</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleCopy(img.url, `list-url-${idx}`)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                                  title="Copy URL"
                                >
                                  {copiedKey === `list-url-${idx}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <a
                                  href={img.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-500 hover:text-[#0C81F3] rounded-md hover:bg-slate-100"
                                  title="Open URL"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadSingleImage(img)}
                                  disabled={isDownloading}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Full Preview */}
        {previewImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="truncate max-w-lg">
                  <h4 className="font-bold text-slate-900 text-sm">{previewImage.filename}</h4>
                  <p className="text-xs text-slate-500 font-mono truncate">{previewImage.url}</p>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Image Frame */}
              <div className="p-4 max-h-[60vh] flex items-center justify-center bg-slate-950 overflow-hidden">
                <img
                  src={previewImage.url}
                  alt={previewImage.alt || previewImage.filename}
                  className="max-w-full max-h-[55vh] object-contain"
                />
              </div>

              {/* Modal Footer Info */}
              <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Format:</span>
                    <span className="font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {previewImage.format}
                    </span>
                    <span className="font-bold text-slate-800 ml-2">Type:</span>
                    <span className="capitalize text-slate-600">{previewImage.category}</span>
                  </div>
                  {previewImage.alt && (
                    <div className="text-slate-600">
                      <span className="font-bold text-slate-800">Alt Text:</span> {previewImage.alt}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(previewImage.url, 'modal-url')}
                    className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'modal-url' ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSingleImage(previewImage)}
                    disabled={downloadingUrl === previewImage.url}
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold text-xs transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {downloadingUrl === previewImage.url ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-sm mt-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-sm text-slate-600">
              Everything you need to know about website image extraction, SEO alt text, and formats
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
