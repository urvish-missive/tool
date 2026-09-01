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
      // Expand all by default
      const expanded = {}
      result.faqs?.forEach((_, i) => (expanded[i] = true))
      setExpandedItems(expanded)
    } catch (err) {
      setError(err?.data?.error || 'Failed to generate FAQs. Please try again.')
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered FAQ Generator
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            Generate SEO-Optimized FAQs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create FAQ content that ranks in featured snippets and drives organic traffic. Enter a topic and get ready-to-use Q&A pairs.
          </p>
        </div>

        {/* Generator Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. email marketing, cloud computing, dog training"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Keywords (optional)
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="email marketing tips, email campaigns, newsletter"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1.5">Comma-separated keywords to weave into answers</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Questions: <span className="text-purple-600">{count}</span>
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating FAQs...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate FAQs
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {faqs.length > 0 && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {faqs.length} FAQs Generated
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedIndex === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy All
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={handleDownloadSchema}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                        {faq.type && (
                          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
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
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
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
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Pro Tips for Using These FAQs
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Add the JSON-LD schema to your page for Google rich results</li>
                <li>✓ Place FAQs near the bottom of articles for better user experience</li>
                <li>✓ Match question phrasing to actual search queries in Google Search Console</li>
                <li>✓ Update answers regularly to maintain freshness and accuracy</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {faqs.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <HelpCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg">Your generated FAQs will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
