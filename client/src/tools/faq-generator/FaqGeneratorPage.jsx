import { useState } from 'react'
import { useGenerateFaqsMutation } from '../../services/apiSlice'
import { HelpCircle, Sparkles, Copy, Check, Download, RefreshCw, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

const QUESTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'what', label: 'What' },
  { value: 'how', label: 'How' },
  { value: 'why', label: 'Why' },
  { value: 'when', label: 'When' },
  { value: 'where', label: 'Where' },
  { value: 'which', label: 'Which' },
]

export default function FaqGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [count, setCount] = useState(8)
  const [generateFaqs, { isLoading }] = useGenerateFaqsMutation()
  const [faqs, setFaqs] = useState([])
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [filterType, setFilterType] = useState('all')

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!topic.trim() || topic.trim().length < 2) {
      setError('Please enter a topic (at least 2 characters)')
      return
    }
    setError('')
    setFaqs([])
    try {
      const result = await generateFaqs({
        topic: topic.trim(),
        targetKeywords: targetKeywords.trim() || undefined,
        count,
      }).unwrap()
      setFaqs(result.faqs || [])
      const expanded = {}
      result.faqs?.forEach((_, i) => (expanded[i] = true))
      setExpandedItems(expanded)
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
    setFaqs([])
    setError('')
    setExpandedItems({})
    setFilterType('all')
  }

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyAll = () => {
    const all = faqs
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}\n`)
      .join('\n')
    navigator.clipboard.writeText(all)
    setCopiedIndex('all')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify({ topic, faqs }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faqs-${topic.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    }
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/ld+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faq-schema-${topic.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const filteredFaqs = filterType === 'all' ? faqs : faqs.filter((f) => f.type === filterType)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free SEO Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">AI </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">FAQ Generator</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Create SEO-optimized FAQ questions and answers that rank in featured snippets and drive organic traffic to your site.
          </p>
        </div>
      </section>

      {/* Generator Form */}
      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Generate Your FAQs</h2>

            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-gray-900 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. email marketing, cloud computing, dog training"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="target-keywords" className="block text-sm font-semibold text-gray-900 mb-1">
                Target Keywords <span className="text-xs text-gray-400 font-normal">(optional, comma-separated)</span>
              </label>
              <input
                id="target-keywords"
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="email marketing tips, email campaigns, newsletter"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1.5">Keywords to weave naturally into answers</p>
            </div>

            <div>
              <label htmlFor="count" className="block text-sm font-semibold text-gray-900 mb-1">
                Number of Questions: <span className="text-blue-600">{count}</span>
              </label>
              <input
                id="count"
                type="range"
                min="3"
                max="15"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3</span>
                <span>15</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating FAQs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate FAQs
                  </>
                )}
              </button>
              {(faqs.length > 0 || topic) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      {faqs.length > 0 && (
        <section id="faq-results" className="py-8 sm:py-12 bg-gray-50/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {faqs.length} FAQs Generated
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
                >
                  {copiedIndex === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy All
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={handleDownloadSchema}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Schema
                </button>
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isExpanded = expandedItems[index]
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(index)}
                      className="w-full px-5 py-4 flex items-start gap-3 text-left"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                        {faq.type && (
                          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {faq.type}
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pl-16">
                        <p className="text-gray-700 leading-relaxed mb-3">{faq.answer}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(`Q: ${faq.question}\nA: ${faq.answer}`, index)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors flex items-center gap-1.5"
                          >
                            {copiedIndex === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIndex === index ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Tips */}
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Pro Tips for Using These FAQs
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  Add the JSON-LD schema to your page for Google rich results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  Place FAQs near the bottom of articles for better user experience
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  Match question phrasing to actual search queries in Google Search Console
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  Update answers regularly to maintain freshness and accuracy
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {faqs.length === 0 && !isLoading && (
        <section className="pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center py-12 text-gray-400">
            <HelpCircle className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Your generated FAQs will appear here</p>
          </div>
        </section>
      )}
    </div>
  )
}
