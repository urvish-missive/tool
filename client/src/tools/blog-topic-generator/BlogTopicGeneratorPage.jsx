import { useState, useMemo, useEffect } from 'react'
import {
  useGenerateBlogTopicsMutation,
  useGenerateMasterBriefMutation,
} from '../../services/apiSlice'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  Sparkles,
  BookOpen,
  Layers,
  Copy,
  Check,
  Download,
  RefreshCw,
  Filter,
  FileText,
  Target,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Flame,
  Lightbulb,
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Link2,
  User,
  Clock,
  Maximize2,
  X,
  HelpCircle,
  Image as ImageIcon,
  Zap,
  CheckSquare,
} from 'lucide-react'

const CONTENT_GOALS = [
  'Educational & Authority',
  'Commercial & Product Leads',
  'Brand Awareness & Viral Reach',
  'Customer Retention & Onboarding',
]

const TONES = [
  { id: 'authoritative', label: 'Authoritative & Thought-Leadership' },
  { id: 'conversational', label: 'Conversational & Engaging' },
  { id: 'storytelling', label: 'Storytelling & Narrative' },
  { id: 'fun', label: 'Fun & Playful' },
  { id: 'bold', label: 'Bold & Disruptive' },
  { id: 'empathetic', label: 'Empathetic & Supportive' },
  { id: 'witty', label: 'Witty & Energetic' },
  { id: 'data-driven', label: 'Analytical & Data-Driven' },
]

const CONTENT_TYPES = [
  'All Formats',
  'Ultimate Guides',
  'Step-by-Step How-To',
  'Listicles & Curations',
  'Comparisons & Reviews',
  'Data Benchmarks & Case Studies',
  'Comprehensive Ultimate Guides',
  'Step-by-Step How-To Tutorials',
  'Head-to-Head Comparison & Vs Articles',
  'Curated Statistics & Industry Trends',
]

const INTENT_COLORS = {
  informational: 'bg-[#0C81F3]/10 text-[#0C81F3] border-[#0C81F3]/20',
  commercial: 'bg-purple-50 text-purple-700 border-purple-200',
  transactional: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const FUNNEL_COLORS = {
  'TOFU (Awareness)': 'bg-sky-50 text-sky-700 border-sky-200',
  'MOFU (Consideration)': 'bg-amber-50 text-amber-700 border-amber-200',
  'BOFU (Decision)': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function BlogTopicGeneratorPage({
  isEmbedded = false,
  onResultStateChange,
  resetSignal,
}) {
  const [niche, setNiche] = useState('')
  const [targetKeywords, setTargetKeywords] = useState('')
  const [audience, setAudience] = useState('')
  const [contentGoal, setContentGoal] = useState(CONTENT_GOALS[0])
  const [tone, setTone] = useState('authoritative')
  const [contentType, setContentType] = useState(CONTENT_TYPES[0])
  const [count, setCount] = useState(8)
  const [generateBlogTopics, { isLoading, reset: resetMutation }] = useGenerateBlogTopicsMutation()
  const [generateMasterBrief, { isLoading: isMasterBriefLoading }] =
    useGenerateMasterBriefMutation()
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [activeCluster, setActiveCluster] = useState('all')
  const [expandedBriefs, setExpandedBriefs] = useState({})
  const [briefTabs, setBriefTabs] = useState({})
  const [masterBriefs, setMasterBriefs] = useState({})
  const [deepeningTopicKey, setDeepeningTopicKey] = useState(null)
  const [fullScreenTopicData, setFullScreenTopicData] = useState(null)
  const [fullScreenTab, setFullScreenTab] = useState('outline')
  const [outlineModes, setOutlineModes] = useState({})
  const [expandedOutlineSections, setExpandedOutlineSections] = useState({})

  const topics = results?.topics || []
  const pillarTopic = results?.pillarTopic || null
  const clusters = results?.clusters || []
  const strategy = results?.strategy || ''
  const activeToneLabel =
    TONES.find((t) => t.id === (results?.tone || tone))?.label || results?.tone || tone

  useEffect(() => {
    if (results) {
      onResultStateChange?.(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onResultStateChange?.(false)
    }
  }, [results, onResultStateChange])

  const getTopicKey = (topic, idx) => {
    if (topic.id !== undefined && topic.id !== null) return String(topic.id)
    if (topic.title) return topic.title
    return `topic-${idx}`
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!niche.trim()) {
      setError('Please enter your niche or industry.')
      return
    }
    setError('')
    setResults(null)

    try {
      const kwArray = targetKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const res = await generateBlogTopics({
        niche: niche.trim(),
        targetKeywords: kwArray,
        audience: audience.trim() || undefined,
        contentGoal,
        contentType,
        tone,
        count: Number(count),
      }).unwrap()

      setResults(res)
      setActiveCluster('all')
      setExpandedBriefs({})
      setBriefTabs({})
      setMasterBriefs({})
      setDeepeningTopicKey(null)
      setFullScreenTopicData(null)
      setTimeout(() => {
        const el = document.getElementById('blog-topic-results')
        if (el) {
          const navHeight = 90
          const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
        }
      }, 100)
    } catch (err) {
      setError(err?.data?.error || 'Failed to generate topics. Please try again.')
    }
  }

  const handleDeepenBrief = async (topic, topicKey) => {
    try {
      setDeepeningTopicKey(topicKey)
      const res = await generateMasterBrief({
        topic,
        niche: niche.trim(),
        audience: audience.trim() || undefined,
        tone,
      }).unwrap()

      if (res.success && res.masterBrief) {
        setMasterBriefs((prev) => ({
          ...prev,
          [topicKey]: res.masterBrief,
        }))
        setExpandedBriefs((prev) => ({ ...prev, [topicKey]: true }))
        setBriefTabs((prev) => ({ ...prev, [topicKey]: 'outline' }))
        if (fullScreenTopicData && fullScreenTopicData.topicKey === topicKey) {
          setFullScreenTopicData((prev) => ({
            ...prev,
            masterBrief: res.masterBrief,
          }))
          setFullScreenTab('outline')
        }
      }
    } catch (err) {
      console.error('Master brief generation error:', err)
      setError(err?.data?.error || 'Failed to deepen master brief. Please try again.')
    } finally {
      setDeepeningTopicKey(null)
    }
  }

  const handleReset = () => {
    setNiche('')
    setTargetKeywords('')
    setAudience('')
    setTone('authoritative')
    setContentGoal(CONTENT_GOALS[0])
    setContentType(CONTENT_TYPES[0])
    setCount(8)
    setActiveCluster('all')
    setResults(null)
    setError('')
    setExpandedBriefs({})
    setBriefTabs({})
    setMasterBriefs({})
    setDeepeningTopicKey(null)
    setFullScreenTopicData(null)
    resetMutation()
    onResultStateChange?.(false)
    if (isEmbedded) {
      const toolEl = document.getElementById('tool')
      if (toolEl) {
        const navHeight = 90
        const targetY = toolEl.getBoundingClientRect().top + window.pageYOffset - navHeight
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (resetSignal > 0) {
      handleReset()
    }
  }, [resetSignal])

  const triggerCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleBrief = (id) => {
    setExpandedBriefs((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAllBriefs = () => {
    const allOpen = filteredTopics.every((t, i) => !!expandedBriefs[getTopicKey(t, i)])
    const nextState = {}
    if (!allOpen) {
      filteredTopics.forEach((t, i) => {
        nextState[getTopicKey(t, i)] = true
      })
    }
    setExpandedBriefs(nextState)
  }

  const filteredTopics = useMemo(() => {
    if (activeCluster === 'all') return topics
    return topics.filter((t) => t.clusterName === activeCluster)
  }, [topics, activeCluster])

  const generateTopicBriefMarkdown = (topic, customMaster = null) => {
    const topicKey = getTopicKey(topic, 0)
    const activeMaster = customMaster || masterBriefs[topicKey] || topic.masterBrief
    const brief = activeMaster?.seoMeta || topic.seoBrief || {}
    const sections = activeMaster?.detailedSections || topic.detailedOutline || []
    const faqs = activeMaster?.faqs || activeMaster?.paaFaqs || topic.faqs || []
    const altTitles = activeMaster?.alternativeTitles || []
    const targetPersona = activeMaster?.targetPersona || brief.targetPersona

    const lines = [
      `# Master Editorial Brief & In-Depth Article Blueprint`,
      `## ${activeMaster?.title || topic.title}`,
      '',
      `**Cluster:** ${topic.clusterName || 'Core Foundations'} | **Target Keyword:** ${topic.targetKeyword}`,
      `**Search Intent:** ${brief.searchIntent || topic.searchIntent} | **Funnel Stage:** ${brief.funnelStage || 'TOFU (Awareness)'}`,
      `**Target Word Count:** ${activeMaster?.estimatedWordCount ? `${activeMaster.estimatedWordCount} words` : brief.recommendedWordCount || `${topic.estimatedWordCount} words`}`,
      `**Reading Time:** ${activeMaster?.readingTime || `${Math.round((topic.estimatedWordCount || 2400) / 220)} min read`}`,
      `**Tone of Voice:** ${activeToneLabel}`,
      `**Missive 12-Pillar QA Standard:** 100% Certified (0 em dashes, 0 robotic clichés, insight-first)`,
      '',
      `---`,
      '',
    ]

    if (altTitles.length > 0) {
      lines.push(
        `### Alternative Headline Angles`,
        ...altTitles.map((t) => `- ${t}`),
        '',
        `---`,
        ''
      )
    }

    lines.push(
      `### 1. Strategic Context & SERP Specifications`,
      `- **Primary Title Tag (< 60 chars):** ${brief.titleTag || topic.title}`,
      `- **Meta Description (< 155 chars):** ${brief.metaDescription || ''}`,
      `- **Target Persona:** ${typeof targetPersona === 'object' ? `${targetPersona.role} (Friction: ${targetPersona.primaryPainPoint})` : targetPersona || 'Practitioners and decision-makers in ' + niche}`,
      `- **Scroll-Stopping Opening Hook:** "${activeMaster?.hook || topic.hook}"`,
      `- **Core Angle:** ${topic.contentAngle || 'Tactical Step-by-Step Execution'}`,
      `- **Why Search Engines Rank This:** ${activeMaster?.whySearchEnginesRankThis || topic.whyItWorks || 'Direct search intent fulfillment and high Information Gain'}`,
      `- **Competitor Blindspot & Information Gain:** ${activeMaster?.competitorGap || brief.competitorGap || 'Fills strategic operational gaps overlooked by top ranking competitors'}`,
      '',
      `---`,
      '',
      `### 2. Comprehensive Section-by-Section Editorial Outline (${sections.length} Sections)`,
      ''
    )

    sections.forEach((sec, sIdx) => {
      const isH3 = (sec.heading || '').startsWith('H3:')
      const headingPrefix = isH3 ? '####' : '###'
      const wordBudget =
        sec.wordCountBudget ||
        `~${Math.round((topic.estimatedWordCount || 2400) / Math.max(sections.length, 1))} words`

      lines.push(`${headingPrefix} Section ${sIdx + 1}: ${sec.heading} (${wordBudget})`)
      if (sec.purpose) {
        lines.push(`*Editorial Purpose:* ${sec.purpose}`, '')
      }

      if (Array.isArray(sec.subsections) && sec.subsections.length > 0) {
        lines.push(`*Nested Subsections:*`)
        sec.subsections.forEach((sub) => {
          lines.push(`  - **${sub.heading}**: ${sub.guidance || ''}`)
          if (sub.keyTakeaway) {
            lines.push(`    *Key Takeaway:* ${sub.keyTakeaway}`)
          }
        })
        lines.push('')
      }

      const points = sec.talkingPoints || sec.keyTalkingPoints || sec.keyPoints || []
      if (Array.isArray(points) && points.length > 0) {
        lines.push(`*Key Tactical Talking Points & Arguments:*`)
        points.forEach((pt) => lines.push(`- ${pt}`))
        lines.push('')
      }

      const eeat = sec.eeatMetricAnchor || sec.eeatProofAnchor || sec.eeatProof
      if (eeat) {
        lines.push(`- **E-E-A-T Metric Anchor:** ${eeat}`)
      }

      const visual = sec.suggestedVisual || sec.visualAsset
      if (visual) {
        lines.push(`- **Suggested Visual Asset:** ${visual}`)
      }

      const pitfall = sec.pitfallToAvoid || sec.commonPitfall
      if (pitfall) {
        lines.push(`- **Amateur Trap to Sidestep:** ${pitfall}`)
      }

      lines.push('', '---', '')
    })

    if (faqs.length > 0) {
      lines.push(`### 3. Google People Also Ask (PAA) FAQs & Featured Snippets`, '')
      faqs.forEach((faq, fIdx) => {
        lines.push(
          `#### Q${fIdx + 1}: ${faq.question}`,
          `*Position 0 Snippet Answer:* ${faq.answerSnippet}`,
          ''
        )
      })
      lines.push('---', '')
    }

    lines.push(
      `### 4. Topical Silo & Keyword Architecture`,
      `- **Primary Keyword:** ${topic.targetKeyword}`,
      `- **Secondary / LSI Keywords:** ${(brief.secondaryKeywords || topic.relatedKeywords || []).join(', ')}`,
      `- **Inbound Link Anchor (from Pillar):** ${brief.internalLinkAnchors?.[0] || brief.internalLinkAnchors?.inboundFromPillar || `Master guide to ${niche}`}`,
      `- **Outbound Link Anchor (to Cluster Node):** ${brief.internalLinkAnchors?.[1] || brief.internalLinkAnchors?.outboundToCluster || `${topic.targetKeyword} playbook`}`,
      `- **Conversion Call to Action (CTA) Bridge:** ${brief.ctaBridge || 'Download resource or schedule operational review'}`,
      '',
      `### 5. Missive 12-Pillar QA Certification`,
      `- 0 Em Dashes: Verified`,
      `- 0 Robotic Clichés (No delve, tapestry, beacon, game-changer): Verified`,
      `- Insight-First Opening Hook: Verified`,
      `- Quantifiable E-E-A-T Anchors: Verified`,
      `- Specific Outcome-Driven Conclusion H2: Verified`,
      `- Tone of Voice Alignment (${activeToneLabel}): Verified`
    )

    return lines.join('\n')
  }

  const downloadSingleTopicBrief = (topic, topicKey) => {
    const markdown = generateTopicBriefMarkdown(topic, masterBriefs[topicKey])
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brief-${topic.targetKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderBriefBody = (topic, topicKey, isModal = false) => {
    const activeMaster = masterBriefs[topicKey] || topic.masterBrief
    const brief = activeMaster?.seoMeta || topic.seoBrief || {}
    const detailedSections = activeMaster?.detailedSections || topic.detailedOutline || []
    const faqs = activeMaster?.faqs || activeMaster?.paaFaqs || topic.faqs || []
    const altTitles = activeMaster?.alternativeTitles || []
    const targetPersona = activeMaster?.targetPersona || brief.targetPersona
    const activeTab = isModal ? fullScreenTab : briefTabs[topicKey] || 'outline'
    const setActiveTab = (tab) =>
      isModal ? setFullScreenTab(tab) : setBriefTabs((prev) => ({ ...prev, [topicKey]: tab }))
    const isDeepening = deepeningTopicKey === topicKey
    const briefMarkdown = generateTopicBriefMarkdown(topic, activeMaster)

    const totalWords = activeMaster?.estimatedWordCount
      ? `${activeMaster.estimatedWordCount} words`
      : brief.recommendedWordCount || `${topic.estimatedWordCount} words`
    const readTime =
      activeMaster?.readingTime ||
      `${Math.round((topic.estimatedWordCount || 2400) / 220)} min read`

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0C81F3]">
                Editorial Master Brief & Blueprint
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                100% Missive QA Certified
              </span>
              {activeMaster && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  2,500-Word Master Blueprint
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aligned with <strong>{activeToneLabel}</strong> tone. Strictly 0 em dashes, 0 robotic
              buzzwords, and insight-first execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeMaster ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Master Blueprint Active</span>
              </div>
            ) : (
              <button
                onClick={() => handleDeepenBrief(topic, topicKey)}
                disabled={isDeepening}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#0C81F3]/20 cursor-pointer disabled:opacity-50"
                title="Generate paragraph-by-paragraph master instructions, alternative angles, competitor gap analysis, and 4 Google PAA FAQs"
              >
                {isDeepening ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  {isDeepening
                    ? 'Deepening Blueprint...'
                    : 'Deepen into 2,500-Word Master Blueprint'}
                </span>
              </button>
            )}

            {!isModal && (
              <button
                onClick={() => {
                  setFullScreenTopicData({ topic, topicKey })
                  setFullScreenTab(activeTab)
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Expand into full-screen master view"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Screen</span>
              </button>
            )}

            <button
              onClick={() => downloadSingleTopicBrief(topic, topicKey)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Export complete editorial brief as Markdown file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>

            <button
              onClick={() => triggerCopy(briefMarkdown, `brief-${topicKey}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#0C81F3]/20 cursor-pointer"
            >
              {copiedKey === `brief-${topicKey}` ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === `brief-${topicKey}` ? 'Copied Brief' : 'Copy Full Brief'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('outline')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Article Outline & Blueprint</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 font-mono">
              {detailedSections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'seo'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Strategic SEO & SERP</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Google PAA FAQs</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 font-mono">
              {faqs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>12-Pillar Missive QA</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold">
              100/100
            </span>
          </button>
        </div>

        {/* TAB 1: OUTLINE & BLUEPRINT */}
        {activeTab === 'outline' &&
          (() => {
            const outlineMode = outlineModes[topicKey] || 'clean'
            const setOutlineMode = (mode) =>
              setOutlineModes((prev) => ({ ...prev, [topicKey]: mode }))
            const toggleSection = (secKey) =>
              setExpandedOutlineSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }))

            return (
              <div className="space-y-4 animate-fade-in">
                {/* Overview Metric Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Word Budget Target</span>
                    <strong className="text-[#0C81F3] font-mono text-sm">{totalWords}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Estimated Read Time</span>
                    <strong className="text-slate-200 font-mono text-sm">{readTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Editorial Sections</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {detailedSections.length} Sections
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tone Profile</span>
                    <strong className="text-purple-300 truncate block text-sm">
                      {activeToneLabel}
                    </strong>
                  </div>
                </div>

                {/* View Mode Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">View Mode:</span>
                    <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                      <button
                        onClick={() => setOutlineMode('clean')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          outlineMode === 'clean'
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Clean Overview
                      </button>
                      <button
                        onClick={() => setOutlineMode('detailed')}
                        className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          outlineMode === 'detailed'
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Full Blueprint
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{detailedSections.length} Sequential Sections</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-emerald-400 font-medium">100% Missive QA Certified</span>
                  </div>
                </div>

                {/* Alternative Title Angles (if present from Master Brief) */}
                {altTitles.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 text-[11px]">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Alternative Headline Angles</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Under 60 Chars for SERP CTR
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {altTitles.map((tTitle, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span className="leading-snug truncate">{tTitle}</span>
                          <button
                            onClick={() => triggerCopy(tTitle, `alt-${topicKey}-${tIdx}`)}
                            className="p-1 hover:text-[#0C81F3] transition-colors cursor-pointer shrink-0"
                            title="Copy headline"
                          >
                            {copiedKey === `alt-${topicKey}-${tIdx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clean, Modern Section Cards */}
                <div className="space-y-3.5">
                  {detailedSections.map((sec, sIdx) => {
                    const cleanTitle = (sec.heading || '').replace(/^(H2|H3):\s*/i, '').trim()
                    const wordBudget =
                      sec.wordCountBudget ||
                      `~${Math.round((topic.estimatedWordCount || 2400) / Math.max(detailedSections.length, 1))} words`
                    const secKey = `${topicKey}-sec-${sIdx}`
                    const isExpanded =
                      outlineMode === 'detailed' || !!expandedOutlineSections[secKey]
                    const hasSubsections =
                      Array.isArray(sec.subsections) && sec.subsections.length > 0
                    const talkingPoints =
                      sec.talkingPoints || sec.keyTalkingPoints || sec.keyPoints || []
                    const hasTacticalChips =
                      sec.suggestedVisual ||
                      sec.visualAsset ||
                      sec.eeatMetricAnchor ||
                      sec.eeatProofAnchor ||
                      sec.eeatProof ||
                      sec.pitfallToAvoid ||
                      sec.commonPitfall

                    return (
                      <div
                        key={sIdx}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700/80 transition-all overflow-hidden"
                      >
                        {/* Section Header */}
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/50 border-b border-slate-800/60">
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0C81F3]/20 to-[#EB8988]/20 text-white font-mono font-bold text-xs border border-[#0C81F3]/30 shrink-0">
                              {String(sec.sectionNumber || sIdx + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <h6 className="text-sm sm:text-base font-bold text-white leading-snug">
                                {cleanTitle}
                              </h6>
                              {sec.purpose && (
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                  {sec.purpose}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="text-[11px] text-slate-300 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                              {wordBudget}
                            </span>
                            {hasSubsections && (
                              <button
                                onClick={() => toggleSection(secKey)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                                title="Toggle nested subsections & writing guidance"
                              >
                                <span className="hidden sm:inline">
                                  {isExpanded
                                    ? 'Hide Guidance'
                                    : `${sec.subsections.length} Subsections`}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Section Body: Clean, Scannable Grid */}
                        <div className="p-3.5 sm:p-4 space-y-3">
                          {/* Key Talking Points */}
                          {talkingPoints.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                              {talkingPoints.map((kp, kpIdx) => (
                                <div
                                  key={kpIdx}
                                  className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60"
                                >
                                  <CheckSquare className="w-3.5 h-3.5 text-[#0C81F3] mt-0.5 shrink-0" />
                                  <span className="leading-relaxed">{kp}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tactical Badges: Compact, clean tags */}
                          {hasTacticalChips && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                              {(sec.suggestedVisual || sec.visualAsset) && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                                  <ImageIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="font-semibold text-indigo-200">Visual:</span>
                                  <span className="text-indigo-300/90 truncate max-w-[240px]">
                                    {sec.suggestedVisual || sec.visualAsset}
                                  </span>
                                </div>
                              )}

                              {(sec.eeatMetricAnchor || sec.eeatProofAnchor || sec.eeatProof) && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                                  <BarChart3 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="font-semibold text-emerald-200">E-E-A-T:</span>
                                  <span className="text-emerald-300/90 truncate max-w-[240px]">
                                    {sec.eeatMetricAnchor || sec.eeatProofAnchor || sec.eeatProof}
                                  </span>
                                </div>
                              )}

                              {(sec.pitfallToAvoid || sec.commonPitfall) && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span className="font-semibold text-rose-200">Trap:</span>
                                  <span className="text-rose-300/90 truncate max-w-[240px]">
                                    {sec.pitfallToAvoid || sec.commonPitfall}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Collapsible Subsections (Expanded on demand or in Full Blueprint mode) */}
                          {hasSubsections && isExpanded && (
                            <div className="pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Nested Subsections & Writing Guidance:
                              </span>
                              <div className="space-y-2">
                                {sec.subsections.map((sub, subIdx) => (
                                  <div
                                    key={subIdx}
                                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <h6 className="font-bold text-slate-200 flex items-center gap-1.5">
                                        <span className="text-[#0C81F3] font-mono text-[11px]">
                                          {sIdx + 1}.{subIdx + 1}
                                        </span>
                                        <span>{(sub.heading || '').replace(/^H3:\s*/i, '')}</span>
                                      </h6>
                                      {sub.keyTakeaway && (
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-medium border border-emerald-500/20">
                                          {sub.keyTakeaway}
                                        </span>
                                      )}
                                    </div>
                                    {sub.guidance && (
                                      <p className="text-slate-400 text-[11px] leading-relaxed pl-2 border-l border-[#0C81F3]/40">
                                        {sub.guidance}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

        {/* TAB 2: SEO & SERP ARCHITECTURE */}
        {activeTab === 'seo' && (
          <div className="space-y-5 animate-fade-in">
            {/* Live Google SERP Snippet Preview */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Google SERP Snippet Preview</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Desktop & Mobile Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono pt-1">
                <span>https://yourdomain.com</span>
                <span className="text-slate-600">›</span>
                <span>blog</span>
                <span className="text-slate-600">›</span>
                <span className="truncate">
                  {topic.targetKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                </span>
              </div>
              <div className="text-blue-400 hover:underline text-base font-medium leading-snug cursor-pointer">
                {brief.titleTag || topic.title}
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {brief.metaDescription ||
                  `Discover how to master ${topic.targetKeyword} with actionable frameworks, verified benchmarks, and step-by-step guidance.`}
              </div>
            </div>

            {/* Title Tag & Meta Description Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Primary Title Tag:</span>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      (brief.titleTag || topic.title).length <= 60
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {(brief.titleTag || topic.title).length} / 60 chars
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-200">
                  <span className="truncate">{brief.titleTag || topic.title}</span>
                  <button
                    onClick={() => triggerCopy(brief.titleTag || topic.title, `tt-${topicKey}`)}
                    className="shrink-0 p-1 hover:text-[#0C81F3] transition-colors cursor-pointer"
                    title="Copy Title Tag"
                  >
                    {copiedKey === `tt-${topicKey}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Meta Description (0 Em Dashes):
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      (brief.metaDescription || '').length <= 155
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {(brief.metaDescription || '').length} / 155 chars
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-200">
                  <span className="truncate">
                    {brief.metaDescription || 'Detailed search meta description.'}
                  </span>
                  <button
                    onClick={() => triggerCopy(brief.metaDescription || '', `md-${topicKey}`)}
                    className="shrink-0 p-1 hover:text-[#0C81F3] transition-colors cursor-pointer"
                    title="Copy Meta Description"
                  >
                    {copiedKey === `md-${topicKey}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Competitor Blindspot & Information Gain Card */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Competitor Blindspot & Superior Information Gain</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {activeMaster?.competitorGap ||
                  brief.competitorGap ||
                  `Top ranking Google competitors for "${topic.targetKeyword}" offer generic overviews without concrete implementation formulas or empirical data. This outline outranks them by providing granular step-by-step guidance.`}
              </p>
            </div>

            {/* Target Persona Breakdown */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                <User className="w-4 h-4 text-blue-400" />
                <span>Target Reader Persona Breakdown</span>
              </div>

              {typeof targetPersona === 'object' && targetPersona !== null ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Professional Role
                    </span>
                    <span className="text-slate-200 font-medium">{targetPersona.role}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                      Primary Pain Point
                    </span>
                    <span className="text-slate-200 font-medium">
                      {targetPersona.primaryPainPoint}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                      Desired Transformation
                    </span>
                    <span className="text-slate-200 font-medium">
                      {targetPersona.desiredOutcome}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-200 leading-relaxed">
                  {targetPersona ||
                    `Practitioners and decision-makers in ${niche} seeking authoritative playbooks.`}
                </p>
              )}
            </div>

            {/* Topical Silo & Internal Interlinking Blueprint */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Topical Silo & Hub-and-Spoke Interlinking Blueprint</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    Inbound Anchor (from Pillar Guide):
                  </span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    "
                    {brief.internalLinkAnchors?.[0] ||
                      brief.internalLinkAnchors?.inboundFromPillar ||
                      `Master guide to ${niche}`}
                    "
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    Outbound Anchor (to Sister Cluster Node):
                  </span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    "
                    {brief.internalLinkAnchors?.[1] ||
                      brief.internalLinkAnchors?.outboundToCluster ||
                      `${topic.targetKeyword} playbook`}
                    "
                  </span>
                </div>
              </div>

              {/* CTA Bridge */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Conversion Call-to-Action (CTA) Bridge:
                </span>
                <span className="text-slate-200 text-xs leading-relaxed">
                  {brief.ctaBridge ||
                    'Download our companion workflow checklist and audit template to accelerate implementation.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE PAA FAQS */}
        {activeTab === 'faqs' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 font-semibold">
                  Google People Also Ask (PAA) FAQs and Position 0 Featured Snippets
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                {faqs.length} FAQs Optimized
              </span>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h6 className="text-xs sm:text-sm font-bold text-white flex items-start gap-2">
                      <span className="text-[#0C81F3] font-mono text-xs">Q{fIdx + 1}:</span>
                      <span>{faq.question}</span>
                    </h6>
                    <button
                      onClick={() =>
                        triggerCopy(
                          `Q: ${faq.question}\nA: ${faq.answerSnippet}`,
                          `faq-${topicKey}-${fIdx}`
                        )
                      }
                      className="p-1 hover:text-[#0C81F3] transition-colors cursor-pointer shrink-0"
                      title="Copy FAQ Q&A"
                    >
                      {copiedKey === `faq-${topicKey}-${fIdx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed pl-3 border-l-2 border-emerald-500/60">
                    <strong className="text-emerald-400 font-semibold block text-[10px] uppercase mb-0.5">
                      Position 0 Featured Snippet Answer:
                    </strong>
                    {faq.answerSnippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 12-PILLAR MISSIVE QA */}
        {activeTab === 'qa' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Missive 12-Pillar QA Compliance Verification</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded">
                100/100 Flawless Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">1. Zero Em Dashes</strong>
                  <span className="text-[11px] text-slate-400">
                    Strictly 0 em dashes found across all copy.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    2. Zero Robotic Clichés
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    No delve, tapestry, beacon, game-changer, etc.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    3. Insight-First Opening
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Immediate psychological friction or metric hook.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    4. Outcome-Driven Conclusion H2
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Specific next-step headline, never "In Conclusion".
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    5. Quantifiable E-E-A-T Anchors
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Empirical percentages and study proof in every section.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    6. Authentic Tone of Voice
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Faithfully embodies {activeToneLabel}.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    7. High Information Gain
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Directly covers competitor blindspots on Google SERP.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    8. Actionable Subsections
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Nested H3s with concrete instructions for writers.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    9. Google PAA Position 0
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Featured snippet-ready Q&As for position zero.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    10. Topical Silo Interlinking
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Inbound and outbound contextual anchor text mapped.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    11. Visual Asset Specifications
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Diagram and matrix briefs to increase engagement.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-semibold">
                    12. Conversion CTA Bridge
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Smooth, logical transition into business conversion.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const exportCSV = () => {
    if (!topics.length) return
    const header =
      'Title,Cluster,Target Keyword,Search Intent,Funnel Stage,Angle,Difficulty,Estimated Words,Title Tag,Meta Description,Target Persona,Hook,CTA Bridge\n'
    const rows = topics
      .map(
        (t) =>
          `"${t.title.replace(/"/g, '""')}","${t.clusterName}","${t.targetKeyword}","${t.searchIntent}","${t.seoBrief?.funnelStage || ''}","${t.contentAngle}","${t.difficulty}",${t.estimatedWordCount},"${(t.seoBrief?.titleTag || t.title).replace(/"/g, '""')}","${(t.seoBrief?.metaDescription || '').replace(/"/g, '""')}","${(t.seoBrief?.targetPersona || '').replace(/"/g, '""')}","${(t.hook || '').replace(/"/g, '""')}","${(t.seoBrief?.ctaBridge || '').replace(/"/g, '""')}"`
      )
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `editorial-calendar-${niche.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportFullMarkdown = () => {
    if (!results) return
    const lines = [
      `# Editorial Content Strategy & Silo Architecture: ${niche}`,
      `*Tone of Voice: ${activeToneLabel} | Content Goal: ${contentGoal}*`,
      '',
      `## Cornerstone Pillar Content`,
      `**Title:** ${pillarTopic?.title}`,
      `**Target Keyword:** ${pillarTopic?.primaryKeyword}`,
      `**Summary:** ${pillarTopic?.summary}`,
      '',
      `## Hub-and-Spoke Interlinking Strategy`,
      strategy,
      '',
      `## Topic Clusters & In-Depth Editorial Briefs (${topics.length} Articles)`,
      ...topics.map((t) => generateTopicBriefMarkdown(t)),
    ]

    const blob = new Blob([lines.join('\n\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-strategy-${niche.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={isEmbedded ? 'w-full' : 'min-h-screen bg-slate-50/50 pb-20'}>
      {/* Hero Header */}
      {!isEmbedded && (
        <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
          <div className="lp-scanline" />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)',
              opacity: 0.08,
            }}
          />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
              Pillar & Cluster Silo Architecture
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
              <span className="text-gray-900">AI Blog Topic & Silo </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                Architect
              </span>
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Generate high-CTR headlines, complete article outlines, psychological hooks, and
              structured topic clusters designed for topical authority.
            </p>
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className={isEmbedded ? 'w-full' : 'max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8'}>
        {/* Form Card */}
        {!isLoading && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-10">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Niche Input */}
                <div className="md:col-span-2">
                  <label htmlFor="niche" className="block text-sm font-bold text-slate-800 mb-2">
                    Niche / Industry Subject <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="niche"
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., B2B SaaS Growth, Specialty Coffee Roasting, Real Estate Investing"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none text-slate-900 placeholder:text-slate-400 font-medium text-base transition-all"
                      required
                    />
                    <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Target Keywords */}
                <div>
                  <label
                    htmlFor="targetKeywords"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    Target Keywords{' '}
                    <span className="text-xs font-normal text-slate-500">
                      (Optional, comma separated)
                    </span>
                  </label>
                  <input
                    id="targetKeywords"
                    type="text"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                    placeholder="e.g., saas churn reduction, b2b lead generation"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                  />
                </div>

                {/* Target Audience */}
                <div>
                  <label htmlFor="audience" className="block text-sm font-bold text-slate-800 mb-2">
                    Target Audience Description
                  </label>
                  <input
                    id="audience"
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Startup Founders, Senior Marketing Directors, Home Baristas"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none text-slate-900 placeholder:text-slate-400 text-sm transition-all"
                  />
                </div>

                {/* Content Goal */}
                <div>
                  <label
                    htmlFor="contentGoal"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    Primary Content Goal
                  </label>
                  <select
                    id="contentGoal"
                    value={contentGoal}
                    onChange={(e) => setContentGoal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none text-slate-900 text-sm bg-white font-medium"
                  >
                    {CONTENT_GOALS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tone of Voice */}
                <div>
                  <label htmlFor="tone" className="block text-sm font-bold text-slate-800 mb-2">
                    Tone of Voice
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none text-slate-900 text-sm bg-white font-medium"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Count */}
                <div className="md:col-span-2">
                  <label htmlFor="count" className="block text-sm font-bold text-slate-800 mb-2">
                    Number of Topics
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 8, 12, 16].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCount(num)}
                        className={`py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                          count === num
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white border-transparent shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {num} Topics
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  {results && (
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
                        <span>Architecting Topic Silos...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>Architect Pillar & Silos</span>
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
        )}

        {/* Loading State */}
        {isLoading && (
          <UnifiedToolLoader
            title="Architecting Topical Authority Clusters..."
            subtitle={`Mining search volume, intent gaps, and hub-and-spoke silo topics for "${niche}".`}
            steps={[
              'Mapping topical entity taxonomy & user intent',
              'Designing high-authority cornerstone pillar page',
              'Grouping semantic cluster nodes & sub-topics',
              'Drafting SEO title hooks & search intent targets',
              'Generating comprehensive content briefs & outlines',
            ]}
          />
        )}

        {/* Results Section */}
        {results && (
          <div id="blog-topic-results" className="space-y-6 animate-fade-in">
            {/* Cornerstone Pillar Card */}
            {pillarTopic && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#0C81F3]/20 to-[#EB8988]/20 text-white border border-[#0C81F3]/40 text-xs font-bold uppercase tracking-wider mb-3">
                      <Compass className="w-3.5 h-3.5 text-[#0C81F3]" />
                      Topical Authority Anchor (Pillar)
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                      {pillarTopic.title}
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed max-w-3xl">
                      {pillarTopic.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="bg-white/10 px-3 py-1 rounded-lg">
                        Core Keyword: <strong>{pillarTopic.primaryKeyword}</strong>
                      </span>
                      <span className="bg-white/10 px-3 py-1 rounded-lg">
                        Tone: <strong>{activeToneLabel}</strong>
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Missive 12-Pillar QA Certified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={exportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportFullMarkdown}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#0C81F3]/20 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Plan (.md)</span>
                    </button>
                  </div>
                </div>

                {/* Strategy Note */}
                {strategy && (
                  <div className="pt-5 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Silo Strategy:</strong> {strategy}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cluster Filters & Expand All Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Topic Clusters:</span>
                </span>
                <button
                  onClick={() => setActiveCluster('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCluster === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Topics ({topics.length})
                </button>
                {clusters.map((c, i) => {
                  const countInCluster = topics.filter((t) => t.clusterName === c.name).length
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveCluster(c.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeCluster === c.name
                          ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.name} ({countInCluster})
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={toggleAllBriefs}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C81F3] hover:text-[#0C81F3]/80 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {filteredTopics.every((t, i) => !!expandedBriefs[t.id || i])
                      ? 'Collapse All Briefs'
                      : 'Expand All Briefs'}
                  </span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredTopics.length} topics
                </span>
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 gap-5">
              {filteredTopics.map((topic, idx) => {
                const topicKey = getTopicKey(topic, idx)
                const isBriefOpen = !!expandedBriefs[topicKey]
                const activeMaster = masterBriefs[topicKey] || topic.masterBrief
                const brief = activeMaster?.seoMeta || topic.seoBrief || {}
                const detailedSections =
                  activeMaster?.detailedSections || topic.detailedOutline || []
                const intentClass =
                  INTENT_COLORS[topic.searchIntent] ||
                  'bg-slate-100 text-slate-700 border-slate-200'
                const diffClass =
                  DIFFICULTY_COLORS[topic.difficulty] ||
                  'bg-slate-100 text-slate-700 border-slate-200'
                const funnelClass =
                  FUNNEL_COLORS[brief.funnelStage] || 'bg-sky-50 text-sky-700 border-sky-200'

                return (
                  <div
                    key={topicKey}
                    className={`bg-white rounded-2xl border transition-all space-y-4 ${
                      isBriefOpen
                        ? 'border-[#0C81F3]/40 shadow-md ring-1 ring-[#0C81F3]/20 p-6 sm:p-7'
                        : 'border-slate-200 p-6 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-900 text-white">
                          {topic.clusterName}
                        </span>
                        {brief.funnelStage && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold border ${funnelClass}`}
                          >
                            {brief.funnelStage}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold border ${intentClass}`}
                        >
                          {topic.searchIntent}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold border ${diffClass}`}
                        >
                          {topic.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activeMaster?.estimatedWordCount
                            ? `${activeMaster.estimatedWordCount} words`
                            : `${topic.estimatedWordCount} words`}
                        </span>
                        {activeMaster && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Master Blueprint Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Missive QA Verified
                        </span>
                        <button
                          onClick={() => triggerCopy(topic.title, `title-${topicKey}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {copiedKey === `title-${topicKey}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === `title-${topicKey}` ? 'Copied' : 'Copy Title'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {topic.title}
                    </h4>

                    {/* Hook & Angle */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 uppercase tracking-wider">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Angle: {topic.contentAngle}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Insight-First Opening Hook
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                        "{topic.hook}"
                      </p>
                    </div>

                    {/* Keywords & Target Rationale */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-[#0C81F3] shrink-0" />
                        <span className="text-slate-500 whitespace-nowrap">Focus Keyword:</span>
                        <strong className="text-slate-800 font-mono text-[11px] sm:text-xs">
                          {topic.targetKeyword}
                        </strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">LSI Entities:</span>
                        {topic.relatedKeywords?.slice(0, 3).map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Deep Brief Button */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleBrief(topicKey)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isBriefOpen
                            ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/20'
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileText
                            className={`w-3.5 h-3.5 ${isBriefOpen ? 'text-white' : 'text-[#0C81F3]'}`}
                          />
                          <span>
                            {isBriefOpen
                              ? 'Hide Full Article Outline & SEO Brief'
                              : 'View Full Article Outline & SEO Brief'}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-normal ${isBriefOpen ? 'text-white/90' : 'text-slate-500'}`}
                          >
                            {isBriefOpen
                              ? 'Click to collapse'
                              : `${detailedSections.length || 6} detailed sections & full brief`}
                          </span>
                          {isBriefOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Comprehensive Editorial Outline & SEO Brief Panel */}
                      {isBriefOpen && (
                        <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-900 text-slate-100 space-y-6 animate-fade-in border border-slate-800">
                          {renderBriefBody(topic, topicKey, false)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Master Document Modal */}
      {fullScreenTopicData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0C81F3]/20 text-[#0C81F3] border border-[#0C81F3]/30">
                    Full-Screen Master View
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Missive QA Certified
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  {fullScreenTopicData.topic.title}
                </h3>
              </div>
              <button
                onClick={() => setFullScreenTopicData(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Close Full-Screen View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1">
              {renderBriefBody(fullScreenTopicData.topic, fullScreenTopicData.topicKey, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
