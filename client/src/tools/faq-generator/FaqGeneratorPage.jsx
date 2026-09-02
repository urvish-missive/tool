import { useState, useMemo } from 'react'
import { useGenerateFaqsMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  Code,
  Globe,
  Smartphone,
  Monitor,
  List,
  Layers,
  FileText,
  ExternalLink,
  Tag,
  CheckCircle2,
} from 'lucide-react'

const QUESTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'what', label: 'Definitions (What)' },
  { value: 'how', label: 'Processes (How)' },
  { value: 'why', label: 'Reasons (Why)' },
  { value: 'pricing', label: 'Pricing & Cost' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'which', label: 'Comparisons (Which)' },
]

const INTENT_BADGES = {
  informational: 'bg-blue-50 text-blue-700 border-blue-200',
  commercial: 'bg-purple-50 text-purple-700 border-purple-200',
  transactional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function FaqGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [count, setCount] = useState(8)
  const [preferredProvider, setPreferredProvider] = useState('openrouter')
  const [generateFaqs, { isLoading, reset: resetMutation }] = useGenerateFaqsMutation()
  
  const [dataResult, setDataResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedState, setCopiedState] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('faqs') // 'faqs' | 'serp' | 'schema' | 'export'
  const [serpDevice, setSerpDevice] = useState('desktop') // 'desktop' | 'mobile'
  const [serpExpanded, setSerpExpanded] = useState({})

  const faqs = dataResult?.faqs || []
  const schema = dataResult?.schema || null
  const paa = dataResult?.peopleAlsoAsk || []
  const summary = dataResult?.summary || ''

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!topic.trim() || topic.trim().length < 2) {
      setError('Please enter a topic (at least 2 characters)')
      return
    }
    setError('')
    setDataResult(null)

    try {
      const result = await generateFaqs({
        topic: topic.trim(),
        targetKeywords: targetKeywords.trim() || undefined,
        count: Number(count),
        preferredProvider,
      }).unwrap()

      setDataResult(result)
      const expanded = {}
      result.faqs?.forEach((_, i) => (expanded[i] = true))
      setExpandedItems(expanded)
      setSerpExpanded({ 0: true, 1: true })

      setTimeout(() => {
        document.getElementById('faq-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err?.data?.error || 'Failed to generate FAQs. Please try again.')
    }
  }

  const handleReset = () => {
    setTopic('')
    setTargetKeywords('')
    setCount(8)
    setDataResult(null)
    setError('')
    setExpandedItems({})
    setFilterType('all')
    setActiveTab('faqs')
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedState(key)
    setTimeout(() => setCopiedState(null), 2000)
  }

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const toggleAllExpand = (expand) => {
    const updated = {}
    faqs.forEach((_, i) => { updated[i] = expand })
    setExpandedItems(updated)
  }

  const toggleSerpFaq = (i) => {
    setSerpExpanded(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const filteredFaqs = useMemo(() => {
    if (filterType === 'all') return faqs
    return faqs.filter((f) => (f.type || '').toLowerCase() === filterType)
  }, [faqs, filterType])

  // Export formats
  const markdownText = useMemo(() => {
    return faqs.map(f => {
      let content = `### ${f.question}\n\n${f.answer}\n`
      if (f.bulletPoints?.length) {
        content += '\n' + f.bulletPoints.map(b => `- ${b}`).join('\n') + '\n'
      }
      return content
    }).join('\n')
  }, [faqs])

  const htmlDetailsText = useMemo(() => {
    return faqs.map(f => {
      let body = `<p>${f.answer}</p>`
      if (f.bulletPoints?.length) {
        body += `<ul>${f.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>`
      }
      return `<details class="faq-item">\n  <summary><strong>${f.question}</strong></summary>\n  <div class="faq-answer">\n    ${body}\n  </div>\n</details>`
    }).join('\n\n')
  }, [faqs])

  const jsonLdString = useMemo(() => {
    if (schema && typeof schema === 'object' && Object.keys(schema).length > 0) {
      return JSON.stringify(schema, null, 2)
    }
    if (typeof schema === 'string' && schema.trim().length > 0) {
      try {
        return JSON.stringify(JSON.parse(schema), null, 2)
      } catch {
        return schema
      }
    }
    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      const generatedSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer + (faq.bulletPoints?.length ? ` <ul>${faq.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>` : ''),
          },
        })),
      }
      return JSON.stringify(generatedSchema, null, 2)
    }
    return ''
  }, [schema, faqs])

  const handleDownloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Featured Snippet & Schema.org Optimizer
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI FAQ & Schema </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate high-converting FAQs formulated to win Google Featured Snippets, People Also Ask boxes, and valid Schema.org FAQPage JSON-LD.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Input Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10 backdrop-blur-sm">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic Input */}
              <div className="md:col-span-2">
                <label htmlFor="topic" className="block text-sm font-bold text-slate-800 mb-2">
                  Topic, Product, or Page Subject <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Technical SEO Audit, Organic Coffee Subscription, SaaS Lead Generation"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all text-base"
                    required
                  />
                  <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Target Keywords */}
              <div>
                <label htmlFor="keywords" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Keywords <span className="text-xs font-normal text-slate-500">(Optional, comma separated)</span>
                </label>
                <input
                  id="keywords"
                  type="text"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  placeholder="e.g., best seo audit, site audit cost, technical seo checklist"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              {/* Count Selector */}
              <div>
                <label htmlFor="count" className="block text-sm font-bold text-slate-800 mb-2">
                  Number of FAQs
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[4, 6, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                        count === num
                          ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {num} FAQs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Selector & Submit */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto sm:min-w-[190px]">
                <ModelSelector
                  value={preferredProvider}
                  onChange={setPreferredProvider}
                  compact={true}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                {faqs.length > 0 && (
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
                  disabled={isLoading}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md hover:shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                      <span>Generating FAQs & Schema...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Generate Optimized FAQs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Synthesizing High-Converting FAQs & Schema..."
            subtitle={`Mining search queries, Featured Snippets, and People Also Ask questions for "${topic}".`}
            steps={[
              'Analyzing topic intent & keyword entities',
              'Mining Google "People Also Ask" questions',
              'Drafting concise, authoritative answers',
              'Structuring bulleted steps & comparison criteria',
              'Generating valid Schema.org FAQPage JSON-LD',
            ]}
          />
        )}

        {/* Results Section */}
        {dataResult && (
          <div id="faq-results" className="space-y-6 animate-fade-in">
            {/* Executive Strategy Banner */}
            {summary && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 shrink-0">
                    <Sparkles className="w-5 h-5 text-[#67A7FF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs tracking-wide text-blue-300 uppercase mb-1">
                      SEO Placement Strategy
                    </h3>
                    <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                      {summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* People Also Ask Insights */}
            {paa?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Google "People Also Ask" Query Clusters
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {paa.map((q, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* View Tab Switcher */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('faqs')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'faqs'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Interactive FAQs ({faqs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('serp')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'serp'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Google SERP Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'schema'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Schema.org JSON-LD</span>
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'export'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Quick Export Suite</span>
              </button>
            </div>

            {/* TAB 1: INTERACTIVE FAQS */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                {/* Filter and Global Controls */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUESTION_TYPES.map((type) => {
                      const countForType = type.value === 'all'
                        ? faqs.length
                        : faqs.filter(f => (f.type || '').toLowerCase() === type.value).length
                      
                      if (type.value !== 'all' && countForType === 0) return null

                      return (
                        <button
                          key={type.value}
                          onClick={() => setFilterType(type.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filterType === type.value
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {type.label} ({countForType})
                        </button>
                      )
                    })}
                  </div>

                  {/* Expand / Collapse All */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <button
                      onClick={() => toggleAllExpand(true)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => toggleAllExpand(false)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {/* FAQ Cards List */}
                <div className="space-y-3">
                  {filteredFaqs.map((faq, idx) => {
                    const isExpanded = !!expandedItems[idx]
                    const intentClass = INTENT_BADGES[faq.searchIntent] || 'bg-slate-100 text-slate-700 border-slate-200'

                    return (
                      <div
                        key={faq.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Header Bar */}
                        <div
                          onClick={() => toggleExpand(idx)}
                          className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-start gap-3.5 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1.5 flex-1">
                              <h4 className="text-base font-bold text-slate-900 leading-snug">
                                {faq.question}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {faq.searchIntent && (
                                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${intentClass}`}>
                                    {faq.searchIntent}
                                  </span>
                                )}
                                {faq.type && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium capitalize">
                                    Type: {faq.type}
                                  </span>
                                )}
                                {faq.targetKeyword && (
                                  <span className="text-slate-500 font-medium">
                                    Target: <strong className="text-slate-700">{faq.targetKeyword}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expandable Body */}
                        {isExpanded && (
                          <div className="px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40">
                            <p className="text-slate-800 text-sm sm:text-base leading-relaxed mb-3">
                              {faq.answer}
                            </p>

                            {/* Bullet points if any */}
                            {faq.bulletPoints?.length > 0 && (
                              <div className="mb-4 pl-4 border-l-2 border-blue-400 space-y-1">
                                {faq.bulletPoints.map((b, bIdx) => (
                                  <div key={bIdx} className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                                    <span>{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Tools */}
                            <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs text-slate-500">
                                {faq.answer.split(' ').length} words • Formatted for Direct Answer Featured Snippets
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    triggerCopy(`${faq.question}\n\n${faq.answer}`, `faq-${idx}`)
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                                >
                                  {copiedState === `faq-${idx}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Copy Q&A</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const detailsCode = `<details>\n  <summary><strong>${faq.question}</strong></summary>\n  <p>${faq.answer}</p>\n</details>`
                                    triggerCopy(detailsCode, `html-${idx}`)
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                                >
                                  {copiedState === `html-${idx}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">HTML Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Code className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Copy HTML Tag</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SERP PREVIEW */}
            {activeTab === 'serp' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Google Rich Snippet Live Simulator</h3>
                    <p className="text-xs text-slate-500">Preview how your FAQs will display and expand inside Google Search Results.</p>
                  </div>
                  <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                    <button
                      onClick={() => setSerpDevice('desktop')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        serpDevice === 'desktop'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => setSerpDevice('mobile')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        serpDevice === 'mobile'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Google Search Result Container */}
                <div className={`mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${
                  serpDevice === 'mobile' ? 'max-w-md shadow-lg border-slate-300' : 'max-w-3xl'
                }`}>
                  {/* Google Breadcrumb & Domain */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      G
                    </div>
                    <div className="text-xs text-slate-700 leading-none">
                      <span className="font-medium text-slate-900">yourdomain.com</span>
                      <span className="text-slate-400 mx-1">›</span>
                      <span className="text-slate-500">{topic.toLowerCase().replace(/\s+/g, '-')}</span>
                    </div>
                  </div>

                  {/* Title Link */}
                  <h3 className="text-blue-800 text-lg font-medium hover:underline cursor-pointer leading-snug mb-1.5">
                    {topic}: Complete Guide & Frequently Asked Questions (2025)
                  </h3>

                  {/* Snippet Description */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    Explore authoritative answers to the most common questions regarding {topic}. Learn actionable best practices, implementation steps, and key tips.
                  </p>

                  {/* Accordion List under SERP result */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Google Rich Results FAQ Accordion</span>
                    </div>
                    {faqs.slice(0, 4).map((faq, i) => {
                      const isExpanded = !!serpExpanded[i]
                      return (
                        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div
                            onClick={() => toggleSerpFaq(i)}
                            className="px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <span>{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          {isExpanded && (
                            <div className="px-3.5 pb-3 text-xs sm:text-sm text-slate-600 bg-slate-50/50 leading-relaxed border-t border-slate-100">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SCHEMA.ORG JSON-LD */}
            {activeTab === 'schema' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">Valid Schema.org FAQPage JSON-LD</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Valid Syntax
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Paste this script tag into the <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code> of your page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerCopy(`<script type="application/ld+json">\n${jsonLdString}\n</script>`, 'schema-script')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      {copiedState === 'schema-script' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Script Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy &lt;script&gt; Code</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadFile(jsonLdString, `faq-schema-${topic.toLowerCase().replace(/\s+/g, '-')}.json`, 'application/json')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
                  <pre className="text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto max-h-96 leading-relaxed">
                    {jsonLdString}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 4: QUICK EXPORT SUITE */}
            {activeTab === 'export' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HTML Details / Summary Block */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-base">HTML &lt;details&gt; Semantic Code</h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">HTML5</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Native accordion markup that works out of the box with zero JavaScript.
                    </p>
                    <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-xl max-h-48 overflow-y-auto mb-4">
                      {htmlDetailsText}
                    </pre>
                  </div>
                  <button
                    onClick={() => triggerCopy(htmlDetailsText, 'export-html')}
                    className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {copiedState === 'export-html' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedState === 'export-html' ? 'Copied HTML!' : 'Copy HTML Markup'}</span>
                  </button>
                </div>

                {/* Markdown FAQ Block */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-base">Markdown Format</h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">.md</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Ready to paste into Notion, Obsidian, GitHub, Ghost, or markdown blog editors.
                    </p>
                    <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-xl max-h-48 overflow-y-auto mb-4">
                      {markdownText}
                    </pre>
                  </div>
                  <button
                    onClick={() => triggerCopy(markdownText, 'export-md')}
                    className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {copiedState === 'export-md' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedState === 'export-md' ? 'Copied Markdown!' : 'Copy Markdown'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
