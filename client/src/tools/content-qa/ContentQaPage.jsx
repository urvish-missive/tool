import { useState, useEffect, useMemo } from 'react'
import { ClipboardCheck, ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle, AlertTriangle, FileText, Eye, Type, PenTool, Layout, Flag, Download, Wand2 } from 'lucide-react'
import { downloadQaPdf } from '../../utils/generateQaPdf'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'
import LoadingProgress from '../../components/LoadingProgress'
import useToolFields from '../../hooks/useToolFields'

const CATEGORY_DEFS = [
  {
    id: 'objective', label: 'Content Objective & Intent', iconKey: 'flag', color: '#0C81F3',
    items: [
      { id: 'obj-1', label: 'Content clearly states its purpose/goal', auto: true },
      { id: 'obj-2', label: 'Primary search intent matches the content type', auto: true },
      { id: 'obj-3', label: 'Content delivers on the promise of the title/meta', auto: true },
      { id: 'obj-4', label: 'Each section has a clear takeaway', auto: false },
      { id: 'obj-5', label: 'Call-to-action is present and relevant', auto: false },
      { id: 'obj-6', label: 'No filler or tangential content', auto: false },
    ],
  },
  {
    id: 'audience', label: 'Audience Relevance', iconKey: 'eye', color: '#a855f7',
    items: [
      { id: 'aud-1', label: 'Content addresses the target audience directly', auto: false },
      { id: 'aud-2', label: 'Tone matches audience sophistication level', auto: false },
      { id: 'aud-3', label: 'Examples and references are relatable to audience', auto: false },
      { id: 'aud-4', label: 'Jargon is explained or appropriate for audience', auto: false },
      { id: 'aud-5', label: 'Content solves a real audience pain point', auto: false },
    ],
  },
  {
    id: 'seo', label: 'SEO & On-Page Fundamentals', iconKey: 'search', color: '#22c55e',
    items: [
      { id: 'seo-1', label: 'Target keyword appears in title (H1)', auto: true },
      { id: 'seo-2', label: 'Target keyword appears in first 100 words', auto: true },
      { id: 'seo-3', label: 'Meta description is present and optimized', auto: true },
      { id: 'seo-4', label: 'URL slug is clean and keyword-rich', auto: true },
      { id: 'seo-5', label: 'Heading hierarchy is logical (H1 → H2 → H3)', auto: true },
      { id: 'seo-6', label: 'Internal links are included', auto: false },
      { id: 'seo-7', label: 'External authoritative sources cited where needed', auto: false },
      { id: 'seo-8', label: 'Images have descriptive alt text', auto: false },
      { id: 'seo-9', label: 'Keyword density is natural (1-2%)', auto: true },
      { id: 'seo-10', label: 'No keyword stuffing detected', auto: true },
    ],
  },
  {
    id: 'grammar', label: 'Grammar, Clarity & Editorial', iconKey: 'pen', color: '#f97316',
    items: [
      { id: 'gra-1', label: 'No spelling errors', auto: true },
      { id: 'gra-2', label: 'No grammar mistakes', auto: true },
      { id: 'gra-3', label: 'Sentence structure is clear and concise', auto: false },
      { id: 'gra-4', label: 'No passive voice overuse (< 15%)', auto: true },
      { id: 'gra-5', label: 'Consistent tense throughout', auto: false },
      { id: 'gra-6', label: 'No redundant phrases or clichés', auto: false },
      { id: 'gra-7', label: 'Flesch Reading Ease score >= 50', auto: true },
      { id: 'gra-8', label: 'Average sentence length <= 20 words', auto: true },
    ],
  },
  {
    id: 'ux', label: 'UX, Formatting & Readability', iconKey: 'layout', color: '#ec4899',
    items: [
      { id: 'ux-1', label: 'Content uses short paragraphs (<= 3 sentences)', auto: true },
      { id: 'ux-2', label: 'Bullet points / lists used for scanability', auto: true },
      { id: 'ux-3', label: 'Bold text highlights key points', auto: false },
      { id: 'ux-4', label: 'Table of contents or section navigation', auto: false },
      { id: 'ux-5', label: 'White space is adequate for readability', auto: false },
      { id: 'ux-6', label: 'Content is skimmable (headings, subheadings)', auto: true },
      { id: 'ux-7', label: 'No walls of text (max 150 words per section)', auto: true },
    ],
  },
  {
    id: 'brand', label: 'Brand Voice & Style', iconKey: 'type', color: '#6366f1',
    items: [
      { id: 'brd-1', label: 'Tone matches brand guidelines', auto: false },
      { id: 'brd-2', label: 'Brand name spelled correctly throughout', auto: true },
      { id: 'brd-3', label: 'Consistent terminology (no synonyms for key terms)', auto: false },
      { id: 'brd-4', label: 'No competitor mentions without context', auto: false },
      { id: 'brd-5', label: 'Product/service names used accurately', auto: false },
    ],
  },
  {
    id: 'final', label: 'Pre-Publish Sign-Off', iconKey: 'check', color: '#14b8a6',
    items: [
      { id: 'fin-1', label: 'Title tag <= 60 characters', auto: true },
      { id: 'fin-2', label: 'Meta description <= 155 characters', auto: true },
      { id: 'fin-3', label: 'Featured image is relevant and optimized', auto: false },
      { id: 'fin-4', label: 'Content has been reviewed by a second person', auto: false },
      { id: 'fin-5', label: 'All links are working (no 404s)', auto: false },
      { id: 'fin-6', label: 'Content is mobile-friendly formatted', auto: false },
      { id: 'fin-7', label: 'Schema markup is implemented', auto: false },
      { id: 'fin-8', label: 'Social sharing metadata is set', auto: false },
    ],
  },
]

const LOADING_STEPS = ['parse', 'objective', 'seo', 'grammar', 'ux', 'brand', 'ai', 'report']

const ICON_MAP = {
  flag: <Flag className="w-4 h-4" />,
  eye: <Eye className="w-4 h-4" />,
  search: <span className="text-sm">🔍</span>,
  pen: <PenTool className="w-4 h-4" />,
  layout: <Layout className="w-4 h-4" />,
  type: <Type className="w-4 h-4" />,
  check: <ClipboardCheck className="w-4 h-4" />,
}

export default function ContentQaPage() {
  const CATEGORIES = CATEGORY_DEFS.map(c => ({ ...c, icon: ICON_MAP[c.iconKey] }))
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [urlSlug, setUrlSlug] = useState('')
  const [aiModel, setAiModel] = useState('openrouter')
  const [validationError, setValidationError] = useState('')
  const [loadingStep, setLoadingStep] = useState('parse')
  const [report, setReport] = useState(null)
  const [qaId, setQaId] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [expandedCats, setExpandedCats] = useState({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose, triggerPopup } = useLeadPopup('content-qa')
  const { isFieldEnabled } = useToolFields('content-qa')

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const charCount = content.length

  useEffect(() => {
    if (!isAnalyzing) return
    let idx = 0
    const interval = setInterval(() => { idx++; if (idx < LOADING_STEPS.length) setLoadingStep(LOADING_STEPS[idx]) }, 2500)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  useEffect(() => {
    if (report) {
      setTimeout(() => document.getElementById('qa-report')?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [report])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (isFieldEnabled('content') && (!content.trim() || content.trim().length < 20)) {
      setValidationError('Content must be at least 20 characters.')
      return
    }

    if (popupEnabled) { triggerPopup(); return }
    runAnalysis()
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true); setError(null); setReport(null); setLoadingStep('parse')
    try {
      const res = await fetch('/api/content-qa/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          title: title.trim() || undefined,
          targetKeyword: targetKeyword.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          urlSlug: urlSlug.trim() || undefined,
          preferredProvider: aiModel,
        }),
      })
      if (!res.ok) {
        let errMsg = 'Analysis failed'
        try { const errData = await res.json(); errMsg = errData.error || errMsg } catch {}
        throw new Error(errMsg)
      }
      const text = await res.text()
      if (!text || text.trim().length === 0) throw new Error('Server returned empty response')
      let data
      try { data = JSON.parse(text) } catch { throw new Error('Invalid response from server') }
      if (!data.success) throw new Error(data.error || 'Analysis failed')
      setReport(data.report)
      setQaId(data.qaId)
      if (data.report?.statuses) {
        setStatuses(data.report.statuses)
      }
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleStatus = (itemId) => {
    setStatuses(prev => {
      const current = prev[itemId] || 'pending'
      const next = current === 'pending' ? 'pass' : current === 'pass' ? 'fail' : current === 'fail' ? 'na' : 'pending'
      return { ...prev, [itemId]: next }
    })
  }

  const toggleCat = (catId) => setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }))

  function getStatus(item) {
    if (item.auto && report?.statuses?.[item.id]) return report.statuses[item.id]
    return statuses[item.id] || 'pending'
  }

  const scores = useMemo(() => {
    if (!report) return { cats: {}, overall: 0, total: 0, passed: 0, failed: 0 }
    const catScores = report.categoryScores || {}
    let totalItems = 0, totalPass = 0, totalFail = 0
    for (const cat of CATEGORIES) {
      let pass = 0, fail = 0, na = 0, pending = 0
      for (const item of cat.items) {
        const s = getStatus(item)
        if (s === 'pass') pass++
        else if (s === 'fail') fail++
        else if (s === 'na') na++
        else pending++
      }
      const assessed = pass + fail
      totalItems += assessed; totalPass += pass; totalFail += fail
    }
    return {
      cats: catScores,
      overall: report.overall || 0,
      total: totalItems, passed: totalPass, failed: totalFail,
    }
  }, [report, statuses])

  const pendingCount = CATEGORIES.reduce((acc, cat) =>
    acc + cat.items.filter(i => !i.auto && !statuses[i.id]).length, 0)

  const getScoreColor = (score) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const getScoreBg = (score) => score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

  const exportReport = () => {
    downloadQaPdf(report, {
      title,
      keyword: targetKeyword,
      wordCount,
      score: scores.overall,
      passed: scores.passed,
      total: scores.total,
      date: new Date().toLocaleDateString(),
    })
  }

  return (
    <div>
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => { handlePopupSubmit(); runAnalysis() }}
        toolSlug="content-qa"
        title="Get Your Free Content QA Report"
        subtitle="Enter your details to unlock the Content QA Checklist"
      />

      {/* Hero */}
      <section className="relative !pt-36 overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase">Free Tool</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gray-900">Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">QA Checklist</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            42 quality checks across 7 categories. Based on Himani Kankaria's Content QA Checklist.
          </p>
        </div>
      </section>

      {/* Form / Loading / Report */}
      <section className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {!report && !isAnalyzing && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5">
              {isFieldEnabled('content') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Content *</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={12}
                    placeholder="Paste your article, blog post, or page content here..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y min-h-[200px]" />
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>{wordCount} words • {charCount} characters</span>
                    {wordCount > 0 && wordCount < 20 && <span className="text-amber-600">Min 20 words</span>}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {isFieldEnabled('title') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Content title / H1"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                )}
                {isFieldEnabled('targetKeyword') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Target Keyword</label>
                    <input type="text" value={targetKeyword} onChange={e => setTargetKeyword(e.target.value)} placeholder="e.g. content QA checklist"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {isFieldEnabled('metaDescription') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Meta Description</label>
                    <input type="text" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="Page meta description"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    {metaDescription && <p className={`text-xs mt-1 ${metaDescription.length > 155 ? 'text-red-500' : 'text-gray-400'}`}>{metaDescription.length}/155</p>}
                  </div>
                )}
                {isFieldEnabled('urlSlug') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">URL Slug</label>
                    <input type="text" value={urlSlug} onChange={e => setUrlSlug(e.target.value)} placeholder="e.g. content-qa-checklist"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                )}
              </div>

              <ModelSelector value={aiModel} onChange={setAiModel} />

              {validationError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{validationError}</div>}

              <button type="submit" disabled={isAnalyzing}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-8 py-3.5 text-sm font-semibold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25">
                {isAnalyzing ? 'Analyzing...' : 'Run QA Checklist'}
              </button>
            </form>
          )}

          {isAnalyzing && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center max-w-md mx-auto">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Running Content QA...</h3>
              <p className="text-sm text-gray-500 mb-6">Checking 42 items across 7 categories</p>
              <div className="space-y-3 text-left">
                {['parse', 'objective', 'seo', 'grammar', 'ux', 'brand', 'ai', 'report'].map((step, i) => {
                  const idx = LOADING_STEPS.indexOf(loadingStep)
                  const status = i < idx ? 'done' : i === idx ? 'active' : 'pending'
                  return (
                    <div key={step} className="flex items-center gap-3">
                      {status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                      {status === 'active' && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />}
                      {status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className={`text-sm ${status === 'active' ? 'font-medium text-gray-900' : status === 'done' ? 'text-green-700' : 'text-gray-400'}`}>
                        {step === 'parse' ? 'Parsing content' : step === 'ai' ? 'AI review' : step === 'report' ? 'Generating report' : `Checking ${step}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {error && !isAnalyzing && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900">Analysis Failed</h3>
              <p className="text-gray-600 mt-2">{error}</p>
              <button onClick={() => { setError(null); setReport(null) }} className="mt-4 px-6 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">Try Again</button>
            </div>
          )}

          {/* ===== REPORT ===== */}
          {report && !isAnalyzing && (
            <div id="qa-report" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">QA Report</h2>
                <div className="flex gap-2">
                  <button onClick={() => { setReport(null); setStatuses({}) }} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">← New Check</button>
                  <button onClick={exportReport} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1.5"><Download className="w-4 h-4" /> Export</button>
                </div>
              </div>

              {/* Overall Score */}
              <div className={`rounded-2xl border p-8 text-center ${getScoreBg(scores.overall)}`}>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Overall QA Score</p>
                <div className={`text-5xl sm:text-6xl font-bold ${getScoreColor(scores.overall)}`}>{scores.overall}%</div>
                <p className="text-sm text-gray-500 mt-2">{scores.passed}/{scores.total} checks passed • {pendingCount} pending</p>
              </div>

              {/* AI Summary */}
              {report.ai && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">AI Assessment</h3>
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">AI</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{report.ai.summary}</p>
                  {report.ai.topIssues?.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-700 mb-2">Top Issues</h4>
                      {report.ai.topIssues.map((issue, i) => <p key={i} className="text-sm text-yellow-800 mb-1">⚠ {issue}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* Category Cards */}
              {CATEGORIES.map(cat => {
                const catScore = scores.cats[cat.id] || 0
                const isExpanded = expandedCats[cat.id]
                return (
                  <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button onClick={() => toggleCat(cat.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '15', color: cat.color }}>{cat.icon}</div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                          <p className="text-xs text-gray-500">{cat.items.length} checks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${getScoreColor(catScore)}`}>{catScore}%</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 py-3 space-y-1">
                        {cat.items.map(item => {
                          const st = getStatus(item)
                          return (
                            <button key={item.id} onClick={() => item.auto ? null : toggleStatus(item.id)}
                              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-colors ${item.auto ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}>
                              {st === 'pass' ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> :
                               st === 'fail' ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> :
                               st === 'na' ? <MinusCircle className="w-5 h-5 text-gray-400 shrink-0" /> :
                               <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />}
                              <span className={`text-sm flex-1 ${st === 'pass' ? 'text-green-700' : st === 'fail' ? 'text-red-700' : 'text-gray-700'}`}>{item.label}</span>
                              {item.auto ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">auto</span> : <span className="text-[10px] text-gray-400 shrink-0">{st === 'pending' ? 'click' : ''}</span>}
                            </button>
                          )
                        })}
                        {report.ai?.[cat.id] && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {report.ai[cat.id].issues?.length > 0 && (
                              <div><p className="text-xs font-medium text-red-600 mb-1">Issues</p>
                              {report.ai[cat.id].issues.map((issue, i) => <p key={i} className="text-xs text-gray-600 mb-0.5">⚠ {issue}</p>)}</div>
                            )}
                            {report.ai[cat.id].suggestions?.length > 0 && (
                              <div><p className="text-xs font-medium text-blue-600 mb-1">Suggestions</p>
                              {report.ai[cat.id].suggestions.map((s, i) => <p key={i} className="text-xs text-gray-600 mb-0.5">→ {s}</p>)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <p className="text-xs text-gray-400 text-center">Auto-checked items are verified programmatically. Manual items require your judgment.</p>

              {/* CTA */}
              <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C81F3] via-[#67A7FF] to-[#EB8988]" />
                <div className="relative">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Need Help Improving Your Content?</h3>
                  <p className="mt-3 text-white/80 max-w-lg mx-auto">Our content team can review, optimize, and polish your content for maximum impact.</p>
                </div>
              </div>

              <DynamicLeadForm
                toolSlug="content-qa"
                relatedIdField="contentQaId"
                relatedIdValue={qaId}
                title="Get Content Help"
                subtitle="Our content experts can review and optimize your content."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
