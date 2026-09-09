import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGenerateContentMutation } from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import { aiContentWriterSchema, parseAiContentWriterForm } from '../../schemas/aiContentWriter.schema'
import {
  PenTool,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Code,
  BarChart3,
  Globe,
  Tag,
  Clock,
  Hash,
  Target,
  Lightbulb,
  Link,
  CheckCircle2,
  AlertCircle,
  AlignLeft,
  Search,
  ShoppingBag,
  Landmark,
  ListOrdered,
  BookOpen,
  Mail,
} from 'lucide-react'

const CONTENT_TYPES = [
  { value: 'blog-post', label: 'Blog Post', icon: FileText },
  { value: 'product-page', label: 'Product Page', icon: ShoppingBag },
  { value: 'landing-page', label: 'Landing Page', icon: Globe },
  { value: 'pillar-page', label: 'Pillar Page', icon: Landmark },
  { value: 'listicle', label: 'Listicle', icon: ListOrdered },
  { value: 'how-to', label: 'How-To Guide', icon: BookOpen },
  { value: 'case-study', label: 'Case Study', icon: BarChart3 },
  { value: 'email', label: 'Email Copy', icon: Mail },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'educational', label: 'Educational' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'friendly', label: 'Friendly' },
]

const WORD_COUNTS = [800, 1200, 1500, 2000, 3000, 5000]

function ScoreRing({ score, size = 64, strokeWidth = 5, label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{score}</span>
        </div>
      </div>
      {label && <span className="text-[11px] font-semibold text-gray-500">{label}</span>}
    </div>
  )
}

export default function AiContentWriterPage() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(aiContentWriterSchema),
    shouldUnregister: false,
    defaultValues: {
      keyword: '',
      contentType: 'blog-post',
      tone: 'professional',
      wordCount: 1500,
      targetAudience: '',
      secondaryKeywords: '',
    },
  })

  const keyword = watch('keyword')
  const [generateContent, { isLoading, reset: resetMutation }] = useGenerateContentMutation()

  const [dataResult, setDataResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedState, setCopiedState] = useState(null)
  const [activeTab, setActiveTab] = useState('content')
  const [headingsExpanded, setHeadingsExpanded] = useState(true)
  const [faqExpanded, setFaqExpanded] = useState({})

  const headings = dataResult?.headings || []
  const faqs = dataResult?.faqSection || []
  const meta = dataResult ? {
    titleTag: dataResult.title,
    metaDescription: dataResult.metaDescription,
  } : null
  const seoScore = dataResult?.seoScore || null

  const onFormValid = (formData) => {
    const parsed = parseAiContentWriterForm(formData)
    if (!parsed.success) {
      setError(parsed.error)
      return
    }
    setError('')
    setDataResult(null)

    generateContent({
      keyword: parsed.data.keyword,
      contentType: parsed.data.contentType,
      tone: parsed.data.tone,
      wordCount: Number(parsed.data.wordCount),
      targetAudience: parsed.data.targetAudience,
      secondaryKeywords: parsed.data.secondaryKeywords,
    })
      .unwrap()
      .then((result) => {
        setDataResult(result)
        setFaqExpanded({})
        setTimeout(() => {
          document.getElementById('cw-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      })
      .catch((err) => {
        setError(err?.data?.error || 'Failed to generate content. Please try again.')
      })
  }

  const handleReset = () => {
    resetForm()
    setDataResult(null)
    setError('')
    setFaqExpanded({})
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedState(key)
    setTimeout(() => setCopiedState(null), 2000)
  }

  const toggleFaq = (i) => {
    setFaqExpanded((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  // Build full HTML content
  const fullHtmlContent = useMemo(() => {
    if (!dataResult) return ''
    let html = `<h1>${dataResult.title}</h1>\n`
    html += `<p><em>${dataResult.introduction || ''}</em></p>\n`
    for (const h of headings) {
      html += `<h2>${h.text}</h2>\n<p>${h.content}</p>\n`
      for (const sub of h.subheadings || []) {
        html += `<h3>${sub.text}</h3>\n<p>${sub.content}</p>\n`
      }
    }
    html += `<h2>Conclusion</h2>\n<p>${dataResult.conclusion || ''}</p>\n`
    return html
  }, [dataResult, headings])

  const fullMarkdownContent = useMemo(() => {
    if (!dataResult) return ''
    let md = `# ${dataResult.title}\n\n`
    md += `> ${dataResult.introduction || ''}\n\n`
    for (const h of headings) {
      md += `## ${h.text}\n\n${h.content}\n\n`
      for (const sub of h.subheadings || []) {
        md += `### ${sub.text}\n\n${sub.content}\n\n`
      }
    }
    md += `## Conclusion\n\n${dataResult.conclusion || ''}\n\n`
    if (dataResult.keyTakeaways?.length) {
      md += `## Key Takeaways\n\n`
      md += dataResult.keyTakeaways.map(t => `- ${t}`).join('\n') + '\n\n'
    }
    if (faqs.length) {
      md += `## FAQ\n\n`
      for (const faq of faqs) {
        md += `**Q: ${faq.question}**\n\n${faq.answer}\n\n`
      }
    }
    return md
  }, [dataResult, headings, faqs])

  const plainTextContent = useMemo(() => {
    if (!dataResult) return ''
    let text = dataResult.title + '\n\n'
    text += (dataResult.introduction || '') + '\n\n'
    for (const h of headings) {
      text += h.text + '\n\n' + h.content + '\n\n'
      for (const sub of h.subheadings || []) {
        text += sub.text + '\n\n' + sub.content + '\n\n'
      }
    }
    text += 'Conclusion\n\n' + (dataResult.conclusion || '') + '\n\n'
    return text
  }, [dataResult, headings])

  const handleDownloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const schemaJson = useMemo(() => {
    if (dataResult?.schemaMarkup) {
      return JSON.stringify(dataResult.schemaMarkup, null, 2)
    }
    return ''
  }, [dataResult])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Himani's SEO Tools • Missive Digital
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-gray-900">AI SEO Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Writer
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate publication-ready, SEO-optimized blog posts, articles, product pages, and landing pages
            with AI. Includes meta tags, schema markup, and content scoring.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Input Form Card */}
        {!isLoading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onFormValid)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic / Primary Keyword */}
              <div className="md:col-span-2">
                <label htmlFor="keyword" className="block text-sm font-bold text-slate-800 mb-2">
                  Topic / Primary Keyword <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="keyword"
                    type="text"
                    {...register('keyword')}
                    placeholder="e.g., How to improve website loading speed, Best project management tools"
                    className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all text-base ${errors.keyword ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-300'}`}
                  />
                  <PenTool className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                {errors.keyword && (
                  <p className="mt-1 text-xs text-red-600">{errors.keyword.message}</p>
                )}
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Content Type</label>
                <Controller
                  control={control}
                  name="contentType"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {CONTENT_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => field.onChange(ct.value)}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                            field.value === ct.value
                              ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {ct.icon && <ct.icon className="w-4 h-4 shrink-0" />}
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Tone + Word Count */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Tone of Voice</label>
                  <Controller
                    control={control}
                    name="tone"
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 text-sm bg-white"
                      >
                        {TONES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Target Word Count</label>
                  <Controller
                    control={control}
                    name="wordCount"
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {WORD_COUNTS.map((wc) => (
                          <button
                            key={wc}
                            type="button"
                            onClick={() => field.onChange(wc)}
                            className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                              field.value === wc
                                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {wc.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="audience" className="block text-sm font-bold text-slate-800 mb-2">
                  Target Audience <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  id="audience"
                  type="text"
                  {...register('targetAudience')}
                  placeholder="e.g., Small business owners, SaaS founders, Marketing managers"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>

              {/* Secondary Keywords */}
              <div>
                <label htmlFor="secKeywords" className="block text-sm font-bold text-slate-800 mb-2">
                  Secondary Keywords <span className="text-xs font-normal text-slate-500">(Optional, comma separated)</span>
                </label>
                <input
                  id="secKeywords"
                  type="text"
                  {...register('secondaryKeywords')}
                  placeholder="e.g., page speed optimization, website performance, core web vitals"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                {dataResult && (
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
                      <span>Writing Content...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </form>
        </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Writing SEO-Optimized Content..."
            subtitle="Researching keyword landscape, crafting compelling copy, and optimizing for search engines."
            steps={[
              'Analyzing keyword intent & competitive landscape',
              'Crafting compelling headline & introduction',
              'Writing structured content with H2/H3 headings',
              'Optimizing for readability, keywords & engagement',
              'Generating meta tags, schema markup & SEO score',
            ]}
          />
        )}

        {/* Results */}
        {dataResult && !isLoading && (
          <div id="cw-results" className="space-y-6 animate-fade-in">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Content Generated Successfully</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      {dataResult.actualWordCount || dataResult.wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {dataResult.estimatedReadTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {dataResult.focusKeyword}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-[#0C81F3] hover:bg-blue-50 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  ← New Article
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 overflow-x-auto">
              <div className="flex gap-2 sm:gap-4 min-w-max">
                {[
                  { id: 'content', label: 'Written Content', icon: FileText },
                  { id: 'meta', label: 'Meta Tags', icon: Tag },
                  { id: 'schema', label: 'Schema', icon: Code },
                  { id: 'score', label: 'SEO Score', icon: BarChart3 },
                  { id: 'faq', label: `FAQ (${faqs.length})`, icon: Search },
                  { id: 'export', label: 'Export', icon: Download },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-slate-500 hover:text-slate-900'} cursor-pointer`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Tab: Written Content ─── */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article Title</h3>
                    <button
                      onClick={() => triggerCopy(dataResult.title, 'title')}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0C81F3] bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedState === 'title' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedState === 'title' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{dataResult.title}</h2>
                </div>

                {/* Introduction */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Introduction</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{dataResult.introduction}</p>
                </div>

                {/* Headings & Content */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setHeadingsExpanded(!headingsExpanded)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <h3 className="text-sm font-bold text-slate-900">
                      Article Body ({headings.length} sections)
                    </h3>
                    {headingsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {headingsExpanded && (
                    <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-5">
                      {headings.map((h, i) => (
                        <div key={i}>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{h.text}</h3>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{h.content}</p>
                          {(h.subheadings || []).length > 0 && (
                            <div className="ml-4 mt-4 space-y-4">
                              {h.subheadings.map((sub, j) => (
                                <div key={j}>
                                  <h4 className="text-base font-semibold text-slate-800 mb-1">{sub.text}</h4>
                                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{sub.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conclusion */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Conclusion</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{dataResult.conclusion}</p>
                </div>

                {/* Key Takeaways */}
                {dataResult.keyTakeaways?.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2">
                      {dataResult.keyTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Internal Link Suggestions */}
                {dataResult.internalLinkSuggestions?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Link className="w-4 h-4 text-[#0C81F3]" />
                      Internal Link Suggestions
                    </h3>
                    <div className="space-y-2">
                      {dataResult.internalLinkSuggestions.map((link, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm bg-slate-50 rounded-lg p-3">
                          <span className="font-semibold text-[#0C81F3] shrink-0">"{link.anchorText}"</span>
                          <span className="text-slate-600">— {link.context}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: Meta Tags ─── */}
            {activeTab === 'meta' && (
              <div className="space-y-4">
                {/* SERP Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Google SERP Preview</h3>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl">
                    <div className="text-xs text-green-700 mb-1">https://example.com/{dataResult.slug || 'article-slug'}</div>
                    <h3 className="text-blue-700 text-base font-medium hover:underline cursor-pointer line-clamp-1">
                      {dataResult.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {dataResult.metaDescription}
                    </p>
                  </div>
                </div>

                {/* Meta Tags */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Generated Meta Tags</h3>

                  {[
                    { label: 'Title Tag', value: dataResult.title, charLimit: 60, key: 'titleTag' },
                    { label: 'Meta Description', value: dataResult.metaDescription, charLimit: 160, key: 'metaDesc' },
                    { label: 'URL Slug', value: dataResult.slug, key: 'slug' },
                    { label: 'Focus Keyword', value: dataResult.focusKeyword, key: 'focusKw' },
                  ].map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.charLimit && (
                            <span className={`text-xs ${(item.value || '').length > item.charLimit ? 'text-red-500' : 'text-green-600'}`}>
                              {(item.value || '').length}/{item.charLimit}
                            </span>
                          )}
                          <button
                            onClick={() => triggerCopy(item.value || '', item.key)}
                            className="text-xs font-semibold text-[#0C81F3] hover:bg-blue-50 rounded px-2 py-1 cursor-pointer"
                          >
                            {copiedState === item.key ? (
                              <Check className="w-3.5 h-3.5 text-green-600 inline" />
                            ) : (
                              'Copy'
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Tab: Schema ─── */}
            {activeTab === 'schema' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Article Schema.org JSON-LD</h3>
                  <button
                    onClick={() => triggerCopy(schemaJson, 'schema')}
                    className="px-3 py-1.5 text-xs font-semibold text-[#0C81F3] bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedState === 'schema' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedState === 'schema' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {schemaJson ? (
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-96">
                    {schemaJson}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">No schema markup generated.</p>
                )}
              </div>
            )}

            {/* ─── Tab: SEO Score ─── */}
            {activeTab === 'score' && seoScore && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-6">SEO Content Score</h3>
                <div className="flex flex-wrap justify-center gap-8 mb-8">
                  <ScoreRing score={seoScore.overall} size={80} strokeWidth={6} label="Overall" />
                  <ScoreRing score={seoScore.title_optimization} label="Title" />
                  <ScoreRing score={seoScore.keyword_usage} label="Keywords" />
                  <ScoreRing score={seoScore.readability} label="Readability" />
                  <ScoreRing score={seoScore.content_depth} label="Depth" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {[
                    { label: 'Title Optimization', score: seoScore.title_optimization, desc: 'Keyword in title, compelling, under 60 chars' },
                    { label: 'Keyword Usage', score: seoScore.keyword_usage, desc: 'Primary & secondary keyword placement' },
                    { label: 'Readability', score: seoScore.readability, desc: 'Flesch score, sentence length, paragraph structure' },
                    { label: 'Content Depth', score: seoScore.content_depth, desc: 'Comprehensive coverage, examples, sub-sections' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        item.score >= 80 ? 'bg-green-100 text-green-700' : item.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.score}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Tab: FAQ ─── */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {faqs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No FAQ section generated.</p>
                  </div>
                ) : (
                  faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleFaq(i)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                        </div>
                        {faqExpanded[i] ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {faqExpanded[i] && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                          <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                          <button
                            onClick={() => triggerCopy(faq.question + '\n\n' + faq.answer, `faq-${i}`)}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#0C81F3] bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                          >
                            {copiedState === `faq-${i}` ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-green-600" /> Copied
                              </span>
                            ) : (
                              'Copy FAQ'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ─── Tab: Export ─── */}
            {activeTab === 'export' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Export Options</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleDownloadFile(fullMarkdownContent, `${dataResult.slug || 'article'}.md`, 'text/markdown')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-[#0C81F3] mb-2" />
                    <div className="text-sm font-bold text-slate-900">Markdown</div>
                    <div className="text-xs text-slate-500">.md file for docs / CMS</div>
                  </button>
                  <button
                    onClick={() => handleDownloadFile(fullHtmlContent, `${dataResult.slug || 'article'}.html`, 'text/html')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left cursor-pointer"
                  >
                    <Code className="w-5 h-5 text-purple-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">HTML</div>
                    <div className="text-xs text-slate-500">Formatted HTML article</div>
                  </button>
                  <button
                    onClick={() => handleDownloadFile(plainTextContent, `${dataResult.slug || 'article'}.txt`, 'text/plain')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#0C81F3] hover:bg-blue-50/30 transition-all text-left cursor-pointer"
                  >
                    <AlignLeft className="w-5 h-5 text-emerald-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">Plain Text</div>
                    <div className="text-xs text-slate-500">Clean text, no formatting</div>
                  </button>
                </div>

                {/* Copy All Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => triggerCopy(fullMarkdownContent, 'allMd')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedState === 'allMd' ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-green-600" /> Copied Markdown
                      </span>
                    ) : (
                      'Copy as Markdown'
                    )}
                  </button>
                  <button
                    onClick={() => triggerCopy(fullHtmlContent, 'allHtml')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedState === 'allHtml' ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-green-600" /> Copied HTML
                      </span>
                    ) : (
                      'Copy as HTML'
                    )}
                  </button>
                  <button
                    onClick={() => triggerCopy(plainTextContent, 'allText')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedState === 'allText' ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-green-600" /> Copied Text
                      </span>
                    ) : (
                      'Copy as Plain Text'
                    )}
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
