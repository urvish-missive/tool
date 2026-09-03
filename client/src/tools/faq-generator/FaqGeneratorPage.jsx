import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGenerateFaqsMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import { faqGeneratorSchema, parseFaqGeneratorForm } from '../../schemas/faqGenerator.schema'
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
  const { register, handleSubmit, control, watch, formState: { errors }, reset: resetForm, setValue } = useForm({
    resolver: zodResolver(faqGeneratorSchema),
    defaultValues: { topic: '', targetKeywords: '', count: 8, preferredProvider: 'openrouter' },
  })

  const topic = watch('topic')
  const [generateFaqs, { isLoading, reset: resetMutation }] = useGenerateFaqsMutation()

  const [dataResult, setDataResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedState, setCopiedState] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('faqs')
  const [serpDevice, setSerpDevice] = useState('desktop')
  const [serpExpanded, setSerpExpanded] = useState({})

  const faqs = dataResult?.faqs || []
  const schema = dataResult?.schema || null
  const paa = dataResult?.peopleAlsoAsk || []
  const summary = dataResult?.summary || ''

  const onFormValid = (formData) => {
    const parsed = parseFaqGeneratorForm(formData)
    if (!parsed.success) {
      setError(parsed.error)
      return
    }
    setError('')
    setDataResult(null)

    generateFaqs({
      topic: parsed.data.topic,
      targetKeywords: parsed.data.targetKeywords,
      count: Number(parsed.data.count),
      preferredProvider: parsed.data.preferredProvider,
    }).unwrap()
      .then(result => {
        setDataResult(result)
        const expanded = {}
        result.faqs?.forEach((_, i) => (expanded[i] = true))
        setExpandedItems(expanded)
        setSerpExpanded({ 0: true, 1: true })
        setTimeout(() => {
          document.getElementById('faq-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      })
      .catch(err => {
        setError(err?.data?.error || 'Failed to generate FAQs. Please try again.')
      })
  }

  const handleReset = () => {
    resetForm()
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
            Himani's SEO Tools • Missive Digital
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
          <form onSubmit={handleSubmit(onFormValid)} className="space-y-6">
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
                    {...register('topic')}
                    placeholder="e.g., Technical SEO Audit, Organic Coffee Subscription, SaaS Lead Generation"
                    className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all text-base ${errors.topic ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-300'}`}
                  />
                  <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                {errors.topic && <p className="mt-1 text-xs text-red-600">{errors.topic.message}</p>}
              </div>

              {/* Target Keywords */}
              <div>
                <label htmlFor="keywords" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Keywords <span className="text-xs font-normal text-slate-500">(Optional, comma separated)</span>
                </label>
                <input
                  id="keywords"
                  type="text"
                  {...register('targetKeywords')}
                  placeholder="e.g., best seo audit, site audit cost, technical seo checklist"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              {/* Count Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Number of FAQs
                </label>
                <Controller control={control} name="count"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[4, 6, 8, 12].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => field.onChange(num)}
                          className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                            field.value === num
                              ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {num} FAQs
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Model Selector & Submit */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto sm:min-w-[190px]">
                <Controller control={control} name="preferredProvider"
                  render={({ field }) => <ModelSelector value={field.value} onChange={field.onChange} compact={true} />} />
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
                      <span>Generate FAQ Content & Schema</span>
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
            title="Generating Featured Snippet-Optimized FAQs..."
            subtitle="Analyzing search intent, crafting concise answers, and building valid Schema.org JSON-LD."
            steps={[
              'Analyzing topic & competitive SERP landscape',
              'Generating question variations & PAA opportunities',
              'Crafting concise Featured Snippet-ready answers',
              'Building FAQ Schema.org JSON-LD markup',
              'Optimizing for Informational, Commercial & Transactional intent',
            ]}
          />
        )}

        {/* Results */}
        {dataResult && !isLoading && (
          <div id="faq-results" className="space-y-6 animate-fade-in">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">FAQ Research Report</h3>
                  <p className="text-sm text-slate-500 mt-1">{summary}</p>
                </div>
                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-[#0C81F3] hover:bg-blue-50 rounded-lg">
                  ← New Research
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {[
                  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
                  { id: 'serp', label: 'SERP Preview', icon: Search },
                  { id: 'schema', label: 'Schema JSON-LD', icon: Code },
                  { id: 'export', label: 'Export', icon: Download },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === tab.id ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List Tab */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `All (${faqs.length})` },
                    ...QUESTION_TYPES.filter(t => t.value !== 'all' && faqs.some(f => (f.type || '').toLowerCase() === t.value)).map(t => ({ id: t.value, label: t.label })),
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === f.id ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* FAQ Items */}
                <div className="space-y-3">
                  {filteredFaqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleExpand(i)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                            {faq.type && (
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${INTENT_BADGES[faq.type] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {faq.type}
                              </span>
                            )}
                          </div>
                        </div>
                        {expandedItems[i] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>

                      {expandedItems[i] && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                          <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                          {faq.bulletPoints?.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {faq.bulletPoints.map((bp, j) => (
                                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="text-[#0C81F3] mt-1 shrink-0">•</span>
                                  {bp}
                                </li>
                              ))}
                            </ul>
                          )}
                          <button
                            onClick={() => triggerCopy(faq.question + '\n\n' + faq.answer, `faq-${i}`)}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#0C81F3] bg-blue-50 rounded-lg hover:bg-blue-100"
                          >
                            {copiedState === `faq-${i}` ? '✓ Copied' : 'Copy FAQ'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SERP Preview Tab */}
            {activeTab === 'serp' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Google SERP Preview</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSerpDevice('desktop')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${serpDevice === 'desktop' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                      <Monitor className="w-3.5 h-3.5 inline mr-1" />Desktop
                    </button>
                    <button onClick={() => setSerpDevice('mobile')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${serpDevice === 'mobile' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                      <Smartphone className="w-3.5 h-3.5 inline mr-1" />Mobile
                    </button>
                  </div>
                </div>
                <div className={`bg-white rounded-xl border border-slate-200 p-5 ${serpDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
                  <div className="text-xs text-green-700 mb-1">https://example.com › faq</div>
                  <h3 className="text-blue-700 text-base font-medium hover:underline cursor-pointer">{topic || 'FAQ Topic'}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{faqs[0]?.answer?.substring(0, 160)}...</p>
                  {faqs.slice(0, 3).map((faq, i) => (
                    <div key={i} className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{faq.question}</span>
                        {serpExpanded[i] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => toggleSerpFaq(i)} />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => toggleSerpFaq(i)} />
                        )}
                      </div>
                      {serpExpanded[i] && (
                        <p className="text-xs text-slate-600 mt-1">{faq.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schema Tab */}
            {activeTab === 'schema' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">FAQ Schema.org JSON-LD</h3>
                  <button
                    onClick={() => triggerCopy(jsonLdString, 'schema')}
                    className="px-3 py-1.5 text-xs font-semibold text-[#0C81F3] bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1.5"
                  >
                    {copiedState === 'schema' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedState === 'schema' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-96">
                  {jsonLdString}
                </pre>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Export Options</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button onClick={() => handleDownloadFile(markdownText, 'faqs.md', 'text/markdown')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left">
                    <FileText className="w-5 h-5 text-[#0C81F3] mb-2" />
                    <div className="text-sm font-bold text-slate-900">Markdown</div>
                    <div className="text-xs text-slate-500">.md file for docs</div>
                  </button>
                  <button onClick={() => handleDownloadFile(htmlDetailsText, 'faqs.html', 'text/html')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left">
                    <Code className="w-5 h-5 text-purple-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">HTML Details</div>
                    <div className="text-xs text-slate-500">Collapsible FAQ HTML</div>
                  </button>
                  <button onClick={() => handleDownloadFile(jsonLdString, 'faq-schema.json', 'application/json')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left">
                    <Layers className="w-5 h-5 text-emerald-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">JSON-LD Schema</div>
                    <div className="text-xs text-slate-500">For your website</div>
                  </button>
                </div>
              </div>
            )}

            {/* People Also Ask */}
            {paa.length > 0 && activeTab === 'faqs' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3">People Also Ask</h3>
                <div className="space-y-2">
                  {paa.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-[#0C81F3] shrink-0">?</span>
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
