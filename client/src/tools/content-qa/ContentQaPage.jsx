import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ClipboardCheck, ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle,
  AlertTriangle, FileText, Download, Wand2, Sparkles, Volume2, Play, Pause,
  RotateCcw, Users, Award, Zap, Scissors, ShieldCheck, Compass, Layout, Ban,
  Monitor, Copy, Check, Eye, RefreshCw, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react'
import { downloadQaPdf } from '../../utils/generateQaPdf'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import ModelSelector from '../shared/ModelSelector'
import useToolFields from '../../hooks/useToolFields'

// ── 12 PILLARS DEFINITION (Matching Himani Kankaria's Checklist) ────
const HIMANI_CATEGORIES_DEF = [
  {
    id: 'tone_style_ai',
    number: 1,
    label: 'Tone, Style, and AI Check',
    icon: <Sparkles className="w-4 h-4 text-[#0C81F3]" />,
    color: '#0C81F3',
    items: [
      { id: 'ts-1', label: 'Is the tone human, crisp, and conversational?', auto: true },
      { id: 'ts-2', label: 'No robotic phrases, no fluff, no clichés.', auto: true },
      { id: 'ts-3', label: 'No em dashes.', auto: true },
      { id: 'ts-4', label: 'Sentences clear, complete, not abrupt.', auto: true },
    ],
  },
  {
    id: 'read_aloud',
    number: 2,
    label: 'Read Aloud Test',
    icon: <Volume2 className="w-4 h-4 text-purple-600" />,
    color: '#9333EA',
    items: [
      { id: 'ra-1', label: 'If read out loud, does it sound natural?', auto: true },
      { id: 'ra-2', label: 'Does it hold attention, sound confident, and flow smoothly?', auto: false },
      { id: 'ra-3', label: 'Can any line be shortened without losing meaning?', auto: true },
    ],
  },
  {
    id: 'audience_alignment',
    number: 3,
    label: 'Audience Alignment',
    icon: <Users className="w-4 h-4 text-pink-600" />,
    color: '#EC4899',
    items: [
      { id: 'aud-1', label: 'Is this clearly written for one audience?', auto: false },
      { id: 'aud-2', label: 'Does it fulfill the purpose of searching & reading?', auto: true },
      { id: 'aud-3', label: 'Would this make them pause and read?', auto: false },
    ],
  },
  {
    id: 'eeat_check',
    number: 4,
    label: 'E-E-A-T Check',
    icon: <Award className="w-4 h-4 text-amber-600" />,
    color: '#D97706',
    items: [
      { id: 'eat-1', label: 'Is lived experience, observation, or real context added?', auto: true },
      { id: 'eat-2', label: 'Does the content explain why or how, not just what?', auto: true },
      { id: 'eat-3', label: 'Does it show you are a thought-leader in this niche?', auto: false },
    ],
  },
  {
    id: 'insight_first',
    number: 5,
    label: 'Insight First',
    icon: <Zap className="w-4 h-4 text-emerald-600" />,
    color: '#059669',
    items: [
      { id: 'ins-1', label: 'Does the content start with an insight, observation, or hook, and not a long setup?', auto: true },
      { id: 'ins-2', label: 'Does it immediately come to the point?', auto: true },
    ],
  },
  {
    id: 'meaning_crispness',
    number: 6,
    label: 'Meaning & Crispness Test',
    icon: <Scissors className="w-4 h-4 text-cyan-600" />,
    color: '#0891B2',
    items: [
      { id: 'mc-1', label: 'Every line adds new or valuable info, clarity, or perspective for that one audience', auto: false },
      { id: 'mc-2', label: 'No filler lines. No "nice to have" sentences.', auto: true },
    ],
  },
  {
    id: 'zero_offensiveness',
    number: 7,
    label: 'Zero Offensiveness Rule',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
    color: '#4F46E5',
    items: [
      { id: 'off-1', label: 'Are we not undermining any profession, system, academy, or industry?', auto: false },
      { id: 'off-2', label: 'Is it polished and respectful, even when talking about gaps or competitors?', auto: false },
    ],
  },
  {
    id: 'brand_positioning',
    number: 8,
    label: 'Relevance to Brand Positioning',
    icon: <Compass className="w-4 h-4 text-[#0C81F3]" />,
    color: '#0C81F3',
    items: [
      { id: 'bp-1', label: "Is the message aligned with the brand's voice?", auto: false },
      { id: 'bp-2', label: "Are we reinforcing authority, sharing the brand's experience & expertise without sounding salesy?", auto: true },
    ],
  },
  {
    id: 'structure_check',
    number: 9,
    label: 'Structure Check',
    icon: <Layout className="w-4 h-4 text-teal-600" />,
    color: '#0D9488',
    items: [
      { id: 'str-1', label: 'Is the headline strong & USP-driven?', auto: true },
      { id: 'str-2', label: 'Is the supporting line relevant?', auto: true },
      { id: 'str-3', label: 'Is the flow logical and tight?', auto: true },
      { id: 'str-4', label: 'No unnecessary past tense unless necessary.', auto: true },
    ],
  },
  {
    id: 'no_direct_sales_pitches',
    number: 10,
    label: 'No direct sales pitches',
    icon: <Ban className="w-4 h-4 text-[#EB8988]" />,
    color: '#EB8988',
    items: [
      { id: 'sp-1', label: 'Crisp storytelling without exaggeration.', auto: true },
      { id: 'sp-2', label: 'Professional, subtle drama.', auto: false },
      { id: 'sp-3', label: 'No self-promotion unless asked.', auto: true },
      { id: 'sp-4', label: 'No overemphasis on milestones (e.g., 10 years).', auto: true },
    ],
  },
  {
    id: 'compliance_risk',
    number: 11,
    label: 'Compliance & Risk Check',
    icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
    color: '#EA580C',
    items: [
      { id: 'comp-1', label: 'No claims that trigger compliance (e.g., pharma, medical).', auto: true },
      { id: 'comp-2', label: 'No overstatements for industries where neutrality matters (finance, telecom, etc.).', auto: true },
    ],
  },
  {
    id: 'visual_platform_fit',
    number: 12,
    label: 'Visual + Platform Fit',
    icon: <Monitor className="w-4 h-4 text-emerald-600" />,
    color: '#10B981',
    items: [
      { id: 'vpf-1', label: 'Does it suit the platform (Website, LinkedIn, newsletter, etc.)?', auto: true },
      { id: 'vpf-2', label: 'Is it scannable (bullets, short paras, hooks)?', auto: true },
      { id: 'vpf-3', label: 'Does it have enough media such as images, graphs, infographics, video embeds, etc.?', auto: true },
    ],
  },
]

const LOADING_STEPS = [
  'Parsing content & measuring readability...',
  'Pillars 1-3: Tone, Em Dashes & Read-Aloud cadence...',
  'Pillars 4-6: E-E-A-T, Insight First & Crispness...',
  'Pillars 7-9: Offensiveness, Brand Positioning & Flow...',
  'Pillars 10-12: Sales Pitch filter, Compliance & Platform fit...',
  'Generating Himani Kankaria QA Audit & Pro Recommendations...',
]

const SAMPLE_CONTENT = `In today's fast-paced digital world, content marketing has become a crucial cornerstone and a true game-changer for businesses looking to delve deep into customer engagement. 

As we all know, our company has over 10+ years of experience in the industry, and we have revolutionized the way brands communicate. Needless to say, our state-of-the-art framework is a testament to our unwavering dedication—helping clients seamlessly achieve 100% guaranteed growth.

Here is how you can supercharge your content strategy:
- Focus on your core message and harness the power of modern storytelling.
- Ensure your paragraphs are bite-sized and engaging.
- Never settle for generic advice.`

export default function ContentQaPage() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [platform, setPlatform] = useState('website')
  const [targetAudience, setTargetAudience] = useState('')
  const [aiModel, setAiModel] = useState('openrouter')
  const [validationError, setValidationError] = useState('')
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [report, setReport] = useState(null)
  const [qaId, setQaId] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [expandedCats, setExpandedCats] = useState({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('grid') // 'grid' | 'inspector' | 'read_aloud' | 'polish'
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'needs_action' | 'passed' | 'manual'
  const [copiedAction, setCopiedAction] = useState(false)

  // One-Click Polish State
  const [polishedResult, setPolishedResult] = useState(null)
  const [isPolishing, setIsPolishing] = useState(false)
  const [polishError, setPolishError] = useState(null)
  const [copiedPolished, setCopiedPolished] = useState(false)

  // Speech Synthesizer State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)

  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose, triggerPopup } = useLeadPopup('content-qa')
  const { isFieldEnabled } = useToolFields('content-qa')

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const charCount = content.length

  // Loading timer simulation
  useEffect(() => {
    if (!isAnalyzing) return
    setLoadingStepIdx(0)
    const interval = setInterval(() => {
      setLoadingStepIdx(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 2200)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  // Scroll to report on complete
  useEffect(() => {
    if (report) {
      setTimeout(() => {
        document.getElementById('himani-qa-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [report])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleLoadSample = () => {
    setTitle('How to Elevate Your Content Strategy with First-Hand Insights')
    setTargetKeyword('content strategy')
    setPlatform('website')
    setTargetAudience('B2B Content Marketers & Agency Leaders')
    setContent(SAMPLE_CONTENT)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (isFieldEnabled('content') && (!content.trim() || content.trim().length < 20)) {
      setValidationError('Please enter at least 20 characters of content to run the QA Checklist.')
      return
    }

    if (popupEnabled) {
      triggerPopup()
      return
    }
    runAnalysis()
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)
    setReport(null)
    setPolishedResult(null)
    try {
      const res = await fetch('/api/content-qa/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          title: title.trim() || undefined,
          targetKeyword: targetKeyword.trim() || undefined,
          platform,
          targetAudience: targetAudience.trim() || undefined,
          preferredProvider: aiModel,
        }),
      })

      if (!res.ok) {
        let errMsg = 'Analysis failed'
        try {
          const errData = await res.json()
          errMsg = errData.error || errMsg
        } catch {}
        throw new Error(errMsg)
      }

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Analysis failed')

      setReport(data.report)
      setQaId(data.qaId)
      if (data.report?.statuses) {
        setStatuses(data.report.statuses)
      }

      // Auto-expand categories that have issues
      const initialExpanded = {}
      HIMANI_CATEGORIES_DEF.forEach(c => {
        const catScore = data.report.categoryScores?.[c.id] || 100
        if (catScore < 85) initialExpanded[c.id] = true
      })
      setExpandedCats(initialExpanded)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check your connection or AI provider.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // One-click Himani Polish
  const runHimaniPolish = async () => {
    setIsPolishing(true)
    setPolishError(null)
    try {
      const res = await fetch('/api/content-qa/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          title: title.trim() || undefined,
          targetKeyword: targetKeyword.trim() || undefined,
          platform,
          preferredProvider: aiModel,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Polishing failed')
      }

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Polish failed')
      setPolishedResult(data.polished)
      setActiveTab('polish')
    } catch (err) {
      setPolishError(err.message || 'Unable to polish content.')
    } finally {
      setIsPolishing(false)
    }
  }

  // Toggle checklist status manually
  const toggleStatus = (itemId) => {
    setStatuses(prev => {
      const current = prev[itemId] || 'pending'
      const next = current === 'pending' ? 'pass' : current === 'pass' ? 'warning' : current === 'warning' ? 'fail' : 'pass'
      return { ...prev, [itemId]: next }
    })
  }

  const toggleCat = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  function getStatus(item) {
    if (statuses[item.id]) return statuses[item.id]
    if (report?.statuses?.[item.id]) return report.statuses[item.id]
    return 'pending'
  }

  // Dynamic Live Score Calculation
  const scores = useMemo(() => {
    if (!report) return { cats: {}, overall: 0, total: 0, passed: 0, failed: 0, warnings: 0 }
    const catScores = {}
    let totalItems = 0
    let totalPass = 0
    let totalFail = 0
    let totalWarning = 0

    for (const cat of HIMANI_CATEGORIES_DEF) {
      let pass = 0, fail = 0, warning = 0
      for (const item of cat.items) {
        const s = getStatus(item)
        if (s === 'pass') pass++
        else if (s === 'fail') fail++
        else if (s === 'warning') warning++
      }
      const assessed = pass + fail + warning
      const catVal = assessed > 0 ? Math.round(((pass + (warning * 0.5)) / assessed) * 100) : 100
      catScores[cat.id] = catVal
      totalItems += assessed
      totalPass += pass
      totalFail += fail
      totalWarning += warning
    }

    const overall = totalItems > 0 ? Math.round(Object.values(catScores).reduce((a, b) => a + b, 0) / Object.keys(catScores).length) : 0
    return {
      cats: catScores,
      overall,
      total: totalItems,
      passed: totalPass,
      failed: totalFail,
      warnings: totalWarning,
    }
  }, [report, statuses])

  // Speech Synthesizer Functions
  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.')
      return
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    const textToSpeak = content.trim()
    if (!textToSpeak) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = speechRate
    utterance.pitch = 1.0

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
    setIsPlayingAudio(true)
  }

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsPlayingAudio(false)
  }

  // Export PDF
  const handleExportPdf = () => {
    downloadQaPdf(report, {
      title: title || 'Untitled Content',
      keyword: targetKeyword,
      wordCount,
      score: scores.overall,
      passed: scores.passed,
      total: scores.total,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })
  }

  // Copy Action Plan to Clipboard
  const handleCopyActionPlan = () => {
    if (!report) return
    const topFixes = report.ai?.topFixes?.length
      ? report.ai.topFixes.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : 'No critical fixes needed!'

    const text = `# Himani Kankaria's Content QA Checklist Audit
**Overall Himani Score:** ${scores.overall}/100
**Content Title:** ${title || 'Untitled'}
**Target Keyword:** ${targetKeyword || 'N/A'}
**Word Count:** ${wordCount} words

## Summary
${report.ai?.summary || 'Audited against 12 Himani QA Pillars.'}

## Critical Action Items
${topFixes}

## Key Metrics
- Em Dashes Detected: ${report.quickStats?.emDashesCount || 0} (Himani Rule: 0 allowed)
- AI Clichés Found: ${report.quickStats?.aiPhrasesCount || 0}
- Flesch Reading Ease: ${report.quickStats?.fleschScore || 0}/100
- Checks Passed: ${scores.passed}/${scores.total}

Audited with Missive Digital Content QA Tool.`

    navigator.clipboard.writeText(text)
    setCopiedAction(true)
    setTimeout(() => setCopiedAction(false), 2500)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-800'
    if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-800'
    return 'bg-rose-50 border-rose-200 text-rose-800'
  }

  // Filtered categories based on user filter pill
  const filteredCategories = useMemo(() => {
    if (filterMode === 'all') return HIMANI_CATEGORIES_DEF
    return HIMANI_CATEGORIES_DEF.filter(cat => {
      const catItems = cat.items
      if (filterMode === 'needs_action') {
        return catItems.some(i => ['fail', 'warning'].includes(getStatus(i)))
      }
      if (filterMode === 'passed') {
        return catItems.every(i => getStatus(i) === 'pass')
      }
      if (filterMode === 'manual') {
        return catItems.some(i => !i.auto)
      }
      return true
    })
  }, [filterMode, statuses, report])

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900">
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => { handlePopupSubmit(); runAnalysis() }}
        toolSlug="content-qa"
        title="Unlock Himani's 12-Pillar Content QA Report"
        subtitle="Enter your details to generate your full quality breakdown and AI audit."
      />

      {/* ── HERO BANNER (Site Brand Gradient: #0C81F3 to #EB8988) ──── */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Brand Free Tool Badge */}
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Free QA Tool
          </span>

          {/* Himani Signature Framework Tag */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              HK
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 tracking-wide">
              Himani Kankaria's Content QA Framework
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
            <span className="text-gray-900">Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">QA Checklist</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            QA every piece of content written for your brand the way Himani does.
            <span className="block text-sm text-gray-500 font-medium mt-1">12 Pillars • 34 Precision Checks • Zero AI Fluff & Zero Em Dashes</span>
          </p>

          {!report && !isAnalyzing && (
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#0C81F3] bg-blue-50/90 hover:bg-blue-100 border border-blue-200/60 transition-all shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Load Sample Content
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* ── INPUT FORM ────────────────────────────────────────── */}
          {!report && !isAnalyzing && (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-9 space-y-6">
              
              {/* Content Textarea */}
              {isFieldEnabled('content') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      Content to Audit <span className="text-[#0C81F3]">*</span>
                    </label>
                    <span className="text-xs font-medium text-gray-500">
                      {wordCount} words • {charCount} characters
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={12}
                    placeholder="Paste your blog post, article, LinkedIn draft, or newsletter content here..."
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-sm leading-relaxed text-gray-800 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all resize-y min-h-[220px]"
                  />
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>Himani's Rule: Every line must earn its place.</span>
                    {wordCount > 0 && wordCount < 20 && (
                      <span className="text-red-500 font-semibold">Minimum 20 words required</span>
                    )}
                  </div>
                </div>
              )}

              {/* Title & Target Keyword */}
              <div className="grid sm:grid-cols-2 gap-4">
                {isFieldEnabled('title') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Headline / H1 Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. 7 Content QA Secrets to 10x Readability"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                    />
                  </div>
                )}

                {isFieldEnabled('targetKeyword') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Keyword</label>
                    <input
                      type="text"
                      value={targetKeyword}
                      onChange={e => setTargetKeyword(e.target.value)}
                      placeholder="e.g. content QA checklist"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Platform & Audience */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Platform</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none font-medium"
                  >
                    <option value="website">Website / Long-form Blog Post</option>
                    <option value="linkedin">LinkedIn Post / Article</option>
                    <option value="newsletter">Email Newsletter</option>
                    <option value="landing_page">Landing Page / Sales Page</option>
                    <option value="social">Social Media Post</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Audience & Voice (Optional)</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. B2B Founders, Marketing Directors"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                  />
                </div>
              </div>

              {/* AI Model Selector */}
              <ModelSelector value={aiModel} onChange={setAiModel} />

              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Submit CTA Button (Site Theme Gradient) */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-9 py-4 text-sm font-bold text-white hover:from-[#0D73D1] hover:to-[#E77771] disabled:opacity-50 transition-all shadow-lg shadow-[#0C81F3]/25 flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Run 12-Pillar QA Audit</span>
              </button>
            </form>
          )}

          {/* ── LOADING ANIMATION ──────────────────────────────────── */}
          {isAnalyzing && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-12 text-center max-w-lg mx-auto">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-30" />
                <div className="w-16 h-16 rounded-full border-4 border-[#0C81F3] border-t-transparent animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Applying Himani's QA Standards...</h3>
              <p className="text-sm text-gray-500 mb-6">Auditing 34 checks across all 12 quality pillars</p>

              <div className="space-y-3 text-left bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                {LOADING_STEPS.map((step, idx) => {
                  const isDone = idx < loadingStepIdx
                  const isActive = idx === loadingStepIdx
                  return (
                    <div key={step} className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isActive ? (
                        <div className="w-4 h-4 border-2 border-[#0C81F3] border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                      )}
                      <span className={`text-xs ${isActive ? 'font-bold text-blue-950' : isDone ? 'text-emerald-800' : 'text-gray-400'}`}>
                        {step}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ERROR DISPLAY ──────────────────────────────────────── */}
          {error && !isAnalyzing && (
            <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-8 text-center max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">QA Audit Failed</h3>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <button
                onClick={() => { setError(null); setReport(null) }}
                className="mt-5 px-6 py-2.5 rounded-full bg-gray-900 text-sm font-semibold text-white hover:bg-black transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* ── AUDIT RESULTS DASHBOARD ────────────────────────────── */}
          {/* ═════════════════════════════════════════════════════════ */}
          {report && !isAnalyzing && (
            <div id="himani-qa-results" className="space-y-8">

              {/* Top Navigation & Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    HK
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Himani QA Report</h2>
                    <p className="text-xs text-gray-500">12 Pillars • 34 Precision Checks</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setReport(null); setPolishedResult(null); setStatuses({}) }}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    ← Audit New Content
                  </button>
                  <button
                    onClick={handleCopyActionPlan}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    {copiedAction ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAction ? 'Copied Plan!' : 'Copy Plan'}</span>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={runHimaniPolish}
                    disabled={isPolishing}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:from-[#0D73D1] hover:to-[#E77771] rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isPolishing ? 'Polishing...' : '✨ One-Click Himani Polish'}</span>
                  </button>
                </div>
              </div>

              {/* ── SCORE HERO CARD ─────────────────────────────────── */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                <div className="grid md:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Overall Himani Score */}
                  <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-100 md:pr-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0C81F3]">Overall Himani Score</span>
                    <div className="flex items-baseline justify-center md:justify-start gap-2 mt-2">
                      <span className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${getScoreColor(scores.overall)}`}>
                        {scores.overall}
                      </span>
                      <span className="text-2xl font-bold text-gray-400">/100</span>
                    </div>

                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBg(scores.overall)}`}>
                        {report.ai?.publicationReadiness || (scores.overall >= 80 ? 'Ready to Publish' : 'Minor Polish Needed')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {scores.passed} passed • {scores.warnings + scores.failed} need action
                    </p>
                  </div>

                  {/* Right Column: 4 Signature Quick Alert Cards */}
                  <div className="md:col-span-8 grid sm:grid-cols-2 gap-3.5">
                    
                    {/* Em Dash Sentinel (Himani Rule: 0 Em Dashes) */}
                    <div className={`p-4 rounded-2xl border ${report.quickStats?.emDashesCount === 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          🚫 Em Dashes Detected
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.quickStats?.emDashesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {report.quickStats?.emDashesCount || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        {report.quickStats?.emDashesCount === 0
                          ? "✓ Strict Himani rule satisfied: zero em dashes."
                          : `Found ${report.quickStats.emDashesCount} em dash(es). Replace with commas or sentence breaks.`}
                      </p>
                    </div>

                    {/* AI Cliches & Buzzwords */}
                    <div className={`p-4 rounded-2xl border ${report.quickStats?.aiPhrasesCount === 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          🤖 Robotic AI Cliches
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.quickStats?.aiPhrasesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {report.quickStats?.aiPhrasesCount || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        {report.quickStats?.aiPhrasesCount === 0
                          ? '✓ Clean human voice without detectable AI buzzwords.'
                          : `Detected ${report.quickStats.aiPhrasesCount} robotic phrase(s) (e.g., "delve", "tapestry").`}
                      </p>
                    </div>

                    {/* Read Aloud Cadence & Speech Time */}
                    <div className="p-4 rounded-2xl border bg-purple-50/80 border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          🗣 Read Aloud Cadence
                        </span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          ~{Math.ceil((report.quickStats?.estimatedReadAloudTimeSec || 60) / 60)} min speech
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800/80">
                        Flesch Ease: <strong>{report.quickStats?.fleschScore || 65}/100</strong>. Test audio flow in the studio tab.
                      </p>
                    </div>

                    {/* Insight-First Hook */}
                    <div className={`p-4 rounded-2xl border ${report.statuses?.['ins-1'] === 'pass' ? 'bg-emerald-50/80 border-emerald-200' : 'bg-blue-50/80 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          ⚡ Insight-First Opening
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.statuses?.['ins-1'] === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {report.statuses?.['ins-1'] === 'pass' ? 'Passed' : 'Needs Polish'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        {report.statuses?.['ins-1'] === 'pass'
                          ? '✓ Opens directly with a punchy hook or observation.'
                          : 'Intro has throat-clearing setup. Start with the core insight.'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* AI Executive Summary & Pro Tips */}
                {report.ai && (
                  <div className="mt-6 pt-6 border-t border-gray-100 grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-100/80">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                        Himani's Executive Assessment
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed">{report.ai.summary}</p>
                    </div>

                    <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100/80">
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#EB8988]" />
                        Top Priority Fixes
                      </h4>
                      <ul className="space-y-1">
                        {report.ai.topFixes?.slice(0, 3).map((fix, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-[#EB8988] font-bold shrink-0">{idx + 1}.</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ── MULTI-VIEW TAB NAVIGATION ────────────────────────── */}
              <div className="border-b border-gray-200">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('grid')}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === 'grid' ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>12-Pillar Checklist ({scores.passed}/{scores.total})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inspector')}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === 'inspector' ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Live Content Inspector ({report.highlights?.length || 0} flags)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('read_aloud')}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === 'read_aloud' ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Read Aloud Audio Studio</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!polishedResult && !isPolishing) runHimaniPolish()
                      else setActiveTab('polish')
                    }}
                    className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${activeTab === 'polish' ? 'border-[#0C81F3] text-[#0C81F3]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                  >
                    <Wand2 className="w-4 h-4 text-[#EB8988]" />
                    <span>✨ One-Click Himani Polish</span>
                  </button>
                </div>
              </div>

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 1: 12-PILLAR INFOGRAPHIC CHECKLIST GRID          */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'grid' && (
                <div className="space-y-6">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter:</span>
                      {[
                        { id: 'all', label: `All 12 Pillars (${scores.total})` },
                        { id: 'needs_action', label: `Needs Action (${scores.failed + scores.warnings})` },
                        { id: 'passed', label: `Passed (${scores.passed})` },
                        { id: 'manual', label: 'Manual Review' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFilterMode(f.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterMode === f.id ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const allOpen = Object.keys(expandedCats).length === HIMANI_CATEGORIES_DEF.length
                        if (allOpen) setExpandedCats({})
                        else {
                          const all = {}
                          HIMANI_CATEGORIES_DEF.forEach(c => all[c.id] = true)
                          setExpandedCats(all)
                        }
                      }}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline"
                    >
                      {Object.keys(expandedCats).length === HIMANI_CATEGORIES_DEF.length ? 'Collapse All' : 'Expand All Details'}
                    </button>
                  </div>

                  {/* 2-Column Responsive Card Grid (Mirroring Himani's Infographic Cheat Sheet) */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {filteredCategories.map(cat => {
                      const catScore = scores.cats[cat.id] ?? 100
                      const isExpanded = expandedCats[cat.id]
                      const aiCat = report.ai?.categories?.[cat.id]

                      return (
                        <div
                          key={cat.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-[#0C81F3]/40"
                        >
                          <div>
                            {/* Card Header */}
                            <button
                              onClick={() => toggleCat(cat.id)}
                              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-blue-50/30 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                  {cat.icon}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">#{cat.number}</span>
                                    <h3 className="text-sm font-bold text-gray-900">{cat.label}</h3>
                                  </div>
                                  <p className="text-[11px] text-gray-500">{cat.items.length} quality checks</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${getScoreBg(catScore)}`}>
                                  {catScore}%
                                </span>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              </div>
                            </button>

                            {/* Checklist Items */}
                            <div className="px-4 pb-4 space-y-1.5 border-t border-gray-100 pt-3">
                              {cat.items.map(item => {
                                const st = getStatus(item)
                                const evidenceText = report.evidence?.[item.id]

                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => toggleStatus(item.id)}
                                    className="p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-2.5 group"
                                  >
                                    <div className="mt-0.5 shrink-0">
                                      {st === 'pass' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      ) : st === 'warning' ? (
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-rose-500" />
                                      )}
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className={`text-xs leading-snug ${st === 'pass' ? 'text-gray-800 font-medium' : st === 'warning' ? 'text-amber-900 font-semibold' : 'text-rose-900 font-semibold'}`}>
                                          {item.label}
                                        </span>
                                        {item.auto ? (
                                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold shrink-0">
                                            AUTO
                                          </span>
                                        ) : (
                                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold shrink-0">
                                            MANUAL
                                          </span>
                                        )}
                                      </div>

                                      {/* Programmatic Evidence */}
                                      {evidenceText && (
                                        <p className="text-[11px] text-gray-500 mt-1 italic">
                                          {evidenceText}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Expanded AI Insights for Pillar */}
                          {isExpanded && aiCat && (
                            <div className="bg-blue-50/40 p-4 border-t border-blue-100 text-xs space-y-2">
                              {aiCat.issues?.length > 0 && (
                                <div>
                                  <span className="font-bold text-rose-700 block mb-1">Detected Issues:</span>
                                  {aiCat.issues.map((issue, idx) => (
                                    <p key={idx} className="text-gray-700 text-[11px] mb-0.5 flex items-start gap-1">
                                      <span className="text-rose-500">•</span>
                                      <span>{issue}</span>
                                    </p>
                                  ))}
                                </div>
                              )}

                              {aiCat.suggestions?.length > 0 && (
                                <div className="mt-2">
                                  <span className="font-bold text-blue-900 block mb-1">Himani's Fix Suggestion:</span>
                                  {aiCat.suggestions.map((sug, idx) => (
                                    <p key={idx} className="text-gray-700 text-[11px] mb-0.5 flex items-start gap-1">
                                      <span className="text-[#0C81F3]">→</span>
                                      <span>{sug}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 2: LIVE CONTENT INSPECTOR WITH HIGHLIGHTS       */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'inspector' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#0C81F3]" />
                          Interactive Content Inspector
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Highlighted terms violate Himani's checklist rules (e.g. em dashes, robotic phrases, filler sentences).
                        </p>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Em Dash (Strict 0 Rule)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500" /> AI / Robotic Cliché
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Filler / Fluff
                        </span>
                      </div>
                    </div>

                    {/* Flagged Items Summary */}
                    {report.highlights?.length > 0 ? (
                      <div className="mt-6 space-y-3">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Detected Violations ({report.highlights.length}):
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {report.highlights.map((hl, idx) => (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl border ${hl.type === 'em-dash' ? 'bg-red-50/60 border-red-200' : hl.type === 'ai-cliche' ? 'bg-purple-50/60 border-purple-200' : 'bg-amber-50/60 border-amber-200'}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-900">
                                  "{hl.text}"
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hl.type === 'em-dash' ? 'bg-red-200 text-red-800' : hl.type === 'ai-cliche' ? 'bg-purple-200 text-purple-800' : 'bg-amber-200 text-amber-800'}`}>
                                  {hl.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 mb-1.5">{hl.reason}</p>
                              <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                💡 Fix: {hl.suggestion}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-center py-8 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-emerald-900">Flawless Human Flow!</h4>
                        <p className="text-xs text-emerald-700 mt-1">Zero em dashes, zero detectable AI cliches, and zero filler phrases found.</p>
                      </div>
                    )}

                    {/* Raw Content Viewer */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Original Text:</h4>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 text-xs font-mono leading-relaxed text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {content}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 3: READ ALOUD AUDIO STUDIO                       */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'read_aloud' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                      <Volume2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Pillar 2: Read Aloud Voice Simulator</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Himani's rule: If it sounds stiff or awkward when spoken out loud, it won't connect with your reader.
                    </p>

                    {/* Audio Player Controls */}
                    <div className="mt-6 p-6 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={handleToggleSpeech}
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-md ${isPlayingAudio ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                          {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                        </button>
                        {isPlayingAudio && (
                          <button
                            onClick={handleStopSpeech}
                            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                            title="Reset Audio"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="text-xs font-bold text-purple-950">
                        {isPlayingAudio ? '🎙 Reading Content Aloud (Listen for rhythm & breath pauses)...' : 'Click Play to test speech flow'}
                      </div>

                      {/* Speed Adjustment */}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="text-xs text-gray-500 font-medium">Speed:</span>
                        {[0.8, 1.0, 1.2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => {
                              setSpeechRate(rate)
                              if (isPlayingAudio) handleStopSpeech()
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${speechRate === rate ? 'bg-purple-600 text-white' : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'}`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice Assessment Metrics */}
                    <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">Reading Ease</span>
                        <span className="text-base font-extrabold text-gray-900">{report.quickStats?.fleschScore || 65} / 100</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {report.quickStats?.fleschScore >= 60 ? 'Natural conversational rhythm' : 'Dense sentence structure'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">Avg Words / Sentence</span>
                        <span className="text-base font-extrabold text-gray-900">{report.quickStats?.avgWordsPerSentence || 14} words</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {report.quickStats?.avgWordsPerSentence <= 18 ? 'Crisp & breathable' : 'Trim lines > 25 words'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 4: ONE-CLICK HIMANI POLISH (AI OPTIMIZER)        */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'polish' && (
                <div className="space-y-6">
                  {isPolishing ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full border-4 border-[#0C81F3] border-t-transparent animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900">Applying 100% Himani Polish...</h3>
                      <p className="text-xs text-gray-500 mt-1">Removing em dashes, humanizing voice, and elevating insight-first structure.</p>
                    </div>
                  ) : polishError ? (
                    <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-md mx-auto">
                      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <h3 className="text-base font-bold text-gray-900">Polish Failed</h3>
                      <p className="text-xs text-gray-600 mt-1">{polishError}</p>
                      <button
                        onClick={runHimaniPolish}
                        className="mt-4 px-5 py-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold hover:opacity-90"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : polishedResult ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                      
                      {/* Header Badge */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0C81F3] border border-blue-200/60 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                            Himani-fied Edition (100% Compliant)
                          </span>
                          <h3 className="text-lg font-bold text-gray-900">{polishedResult.polishedTitle}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(polishedResult.polishedContent)
                              setCopiedPolished(true)
                              setTimeout(() => setCopiedPolished(false), 2000)
                            }}
                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:from-[#0D73D1] hover:to-[#E77771] rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            {copiedPolished ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPolished ? 'Copied Polished Draft!' : 'Copy Polished Draft'}</span>
                          </button>
                          <button
                            onClick={runHimaniPolish}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                            title="Regenerate Polish"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Improvements Made */}
                      {polishedResult.improvementsMade?.length > 0 && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">Key Refinements Applied:</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {polishedResult.improvementsMade.map((imp, idx) => (
                              <div key={idx} className="text-xs text-gray-800 flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>{imp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Polished Content Box */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Optimized Content Draft:</h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap font-sans">
                          {polishedResult.polishedContent}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ── FOOTER CALL TO ACTION (Brand Gradient) ──────────── */}
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-center bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] shadow-xl shadow-blue-500/10">
                <div className="relative z-10 max-w-xl mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Need Hands-On Editorial Mastery?</h3>
                  <p className="mt-2 text-white/90 text-sm leading-relaxed">
                    Our team of seasoned content strategists can polish, structure, and scale your brand's content the way Himani does.
                  </p>
                </div>
              </div>

              <DynamicLeadForm
                toolSlug="content-qa"
                relatedIdField="contentQaId"
                relatedIdValue={qaId}
                title="Get Expert Editorial Support"
                subtitle="Connect with Missive Digital's content optimization specialists."
              />
            </div>
          )}

        </div>
      </section>
    </div>
  )
}
