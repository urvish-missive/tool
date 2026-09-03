import { useState, useMemo } from 'react'
import { useGenerateSocialPlanMutation } from '../../services/apiSlice'
import ModelSelector from '../shared/ModelSelector'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import {
  Sparkles,
  Zap,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Download,
  Calendar,
  Layers,
  Send,
  Share2,
  Clock,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  Eye,
  Hash,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'

const LOADING_STEPS = [
  'Analyzing topic angle & target audience intent',
  'Crafting algorithm-friendly viral opening hooks',
  'Generating platform-tailored post copy & whitespace formatting',
  'Structuring hashtag clusters & optimal posting windows',
  'Assembling visual content calendar & export data',
]

const PLATFORM_OPTIONS = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-[#0A66C2] text-white', border: 'border-[#0A66C2]' },
  { id: 'twitter', label: 'Twitter / X', icon: '𝕏', color: 'bg-black text-white', border: 'border-black' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white', border: 'border-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: '👥', color: 'bg-[#1877F2] text-white', border: 'border-[#1877F2]' },
]

const TONE_OPTIONS = [
  { id: 'thought_leadership', label: 'Thought Leadership', icon: '💡' },
  { id: 'bold_contrarian', label: 'Bold & Contrarian', icon: '🔥' },
  { id: 'educational', label: 'Educational & Actionable', icon: '📚' },
  { id: 'conversational', label: 'Conversational & Relatable', icon: '☕' },
  { id: 'storytelling', label: 'Personal Storytelling', icon: '📖' },
  { id: 'witty', label: 'Witty & Punchy', icon: '⚡' },
]

const AUDIENCE_OPTIONS = [
  'B2B Founders, Execs & Leaders',
  'Marketers, SEOs & Agency Owners',
  'Tech Developers & SaaS Creators',
  'E-Commerce & DTC Brands',
  'Freelancers & Solopreneurs',
  'General Consumers & Students',
]

const CTA_OPTIONS = [
  { id: 'engagement', label: 'Discussion & Comments', icon: '💬' },
  { id: 'traffic', label: 'Drive Clicks to Website', icon: '🔗' },
  { id: 'lead_gen', label: 'DM for Guide / Lead Magnet', icon: '📥' },
  { id: 'repost', label: 'Saves & Reposts / Retweets', icon: '🔄' },
]

const FAQ_ITEMS = [
  {
    q: 'How does the AI Social Media Content Planner work?',
    a: 'Our planner takes your core topic or article and uses platform-specific copywriting formulas. For LinkedIn, it formats posts with high-hook whitespace and discussion prompts; for Twitter/X, it drafts viral 280-character punches and 5-tweet threads; for Instagram, it structures carousel slides and multi-tier hashtags.',
  },
  {
    q: 'Can I export the planned posts directly into scheduling tools like Buffer or Hootsuite?',
    a: 'Yes! Click "Export CSV" to download a spreadsheet with pre-formatted columns (Date, Time, Platform, Content, Hashtags) compatible with Buffer, Hootsuite, Later, Sprout Social, or Notion content calendars.',
  },
  {
    q: 'How do the 5 Viral Hook variations work?',
    a: 'For every generated post, the AI creates 5 distinct hook types: Question, Contrarian, Statistic/Proof, Personal Story, and How-To. You can click any hook pill to swap that opening line directly into your draft!',
  },
  {
    q: 'What is the 7-Day Content Sprint plan?',
    a: 'The 7-Day Sprint maps your topic across 7 strategic content pillars (How-To, Thought Leadership, Case Study, Contrarian, Personal Story, Community Question, and Weekly Recap) so your feed stays engaging without feeling repetitive.',
  },
]

export default function SocialPlannerPage() {
  const [topic, setTopic] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'twitter', 'instagram'])
  const [planType, setPlanType] = useState('single') // 'single' | 'sprint_7d' | 'calendar_30d'
  const [tone, setTone] = useState('thought_leadership')
  const [audience, setAudience] = useState('B2B Founders, Marketers & Creators')
  const [ctaType, setCtaType] = useState('engagement')
  const [preferredProvider, setPreferredProvider] = useState('')

  // UI & Result State
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'mockup' | 'calendar'
  const [activeMockupPlatform, setActiveMockupPlatform] = useState('linkedin')
  const [activeHookKeys, setActiveHookKeys] = useState({}) // { [postId]: 'default' | 'question' | 'contrarian' | ... }
  const [copiedKey, setCopiedKey] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [error, setError] = useState('')

  // API Mutation
  const [generateSocialPlan, { isLoading }] = useGenerateSocialPlanMutation()
  const [planResult, setPlanResult] = useState(null)

  // Lead Popup Integration
  const { popupEnabled, showPopup, setShowPopup, handlePopupSubmit, handlePopupClose } =
    useLeadPopup('social-media-planner')
  const [pendingPayload, setPendingPayload] = useState(null)

  // Platform Toggle Helper
  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    )
  }

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Handle Form Submission
  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!topic.trim()) {
      setError('Please enter a topic, concept, or summary.')
      return
    }

    setError('')
    const payload = {
      topic: topic.trim(),
      platforms: selectedPlatforms,
      planType,
      tone,
      audience,
      ctaType,
      preferredProvider,
    }

    if (popupEnabled) {
      setPendingPayload(payload)
      setShowPopup(true)
      return
    }

    executeGeneration(payload)
  }

  const executeGeneration = async (payload, leadId = null) => {
    try {
      const data = await generateSocialPlan({
        ...payload,
        leadId,
      }).unwrap()

      setPlanResult(data)
      setActiveHookKeys({})
      if (data.posts?.[0]) {
        setActiveMockupPlatform(data.posts[0].platform)
      }

      setTimeout(() => {
        document.getElementById('social-planner-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to generate social media content plan.')
    }
  }

  const onLeadModalSuccess = (leadId) => {
    if (pendingPayload) {
      executeGeneration(pendingPayload, leadId)
      setPendingPayload(null)
    }
  }

  const handleReset = () => {
    setTopic('')
    setPlanResult(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get active post content with selected hook variant
  const getPostContent = (post) => {
    const activeHookKey = activeHookKeys[post.id]
    if (!activeHookKey || activeHookKey === 'default' || !post.hookVariants?.[activeHookKey]) {
      return post.content
    }

    const customHook = post.hookVariants[activeHookKey]
    // Replace the first line/hook with custom hook
    const lines = post.content.split('\n')
    lines[0] = customHook
    return lines.join('\n')
  }

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!planResult) return
    const rows = [
      ['Date/Day', 'Platform', 'Time', 'Content Pillar', 'Post Text', 'Hashtags', 'Status'],
    ]

    if (planResult.calendar && planResult.calendar.length > 0) {
      planResult.calendar.forEach((item) => {
        const matchingPost = planResult.posts.find((p) => p.platform === item.platform) || planResult.posts[0]
        const text = matchingPost ? getPostContent(matchingPost).replace(/"/g, '""') : item.draftSnippet
        const tags = matchingPost ? matchingPost.hashtags.join(' ') : ''
        rows.push([
          `Day ${item.dayNumber} (${item.dayName})`,
          item.platform.toUpperCase(),
          item.time,
          `"${item.contentPillar}"`,
          `"${text}"`,
          `"${tags}"`,
          item.status || 'Ready',
        ])
      })
    } else {
      planResult.posts.forEach((p, idx) => {
        const text = getPostContent(p).replace(/"/g, '""')
        rows.push([
          `Scheduled Post ${idx + 1}`,
          p.platform.toUpperCase(),
          p.bestTimeToPost,
          'Core Campaign',
          `"${text}"`,
          `"${p.hashtags.join(' ')}"`,
          'Ready to Post',
        ])
      })
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `social_content_plan_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export ICS calendar file helper
  const handleExportICS = () => {
    if (!planResult || !planResult.calendar) return
    let icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Himani SEO Tools//Social Media Planner//EN',
    ]

    const baseDate = new Date()
    planResult.calendar.forEach((item, idx) => {
      const eventDate = new Date(baseDate.getTime() + idx * 24 * 60 * 60 * 1000)
      const dateStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 8) + 'T130000Z'

      icsData.push('BEGIN:VEVENT')
      icsData.push(`UID:social-post-${idx}-${Date.now()}@missivedigital.com`)
      icsData.push(`DTSTAMP:${dateStr}`)
      icsData.push(`DTSTART:${dateStr}`)
      icsData.push(`SUMMARY:[${item.platform.toUpperCase()}] ${item.headline}`)
      icsData.push(`DESCRIPTION:${item.draftSnippet.replace(/\n/g, '\\n')}`)
      icsData.push('STATUS:CONFIRMED')
      icsData.push('END:VEVENT')
    })

    icsData.push('END:VCALENDAR')

    const blob = new Blob([icsData.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `social_schedule_${Date.now()}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy All Posts
  const handleCopyAll = () => {
    if (!planResult?.posts) return
    const fullBundle = planResult.posts
      .map((p) => {
        return `=== ${p.platformLabel.toUpperCase()} POST ===\nBest Time: ${p.bestTimeToPost}\n\n${getPostContent(p)}\n\nHashtags: ${p.hashtags.join(' ')}\n\n`
      })
      .join('\n----------------------------------------\n\n')

    handleCopy(fullBundle, 'copy-all')
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmitSuccess={onLeadModalSuccess}
        toolSlug="social-media-planner"
        title="Unlock Free Social Media Post & Content Planner"
        subtitle="Generate tailored viral posts across LinkedIn, Twitter/X, and Instagram with 1-click scheduling."
      />

      {/* Hero Header */}
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
            <span className="text-gray-900">Social Media </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Post & Content Planner
            </span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Generate high-converting, algorithm-optimized social posts for LinkedIn, Twitter/X, and Instagram. Plan multi-platform campaigns, viral hooks, and 7-day content calendars in seconds.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 mb-8 transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="social-topic-input" className="block text-sm font-bold text-slate-800">
                  Topic, Blog Post Idea, or Offer to Promote <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">Be as detailed or brief as you like</span>
              </div>
              <textarea
                id="social-topic-input"
                rows={3}
                placeholder="e.g., 5 AI automation workflows every marketing agency needs in 2026 to save 20 hours a week..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3] transition-all text-sm sm:text-base font-medium resize-y"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Quick examples:</span>
                {[
                  'Why consistency beats intensity in B2B organic growth',
                  'How we scaled organic search traffic by 240% in 90 days',
                  'The 4 biggest mistakes founders make with AI tools',
                ].map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(ex)}
                    className="text-[11px] text-[#0C81F3] bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Platforms */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Target Platforms ({selectedPlatforms.length} selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PLATFORM_OPTIONS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id)
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatform(plat.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? `${plat.border} bg-slate-50/80 shadow-xs ring-2 ring-slate-900/5`
                          : 'border-slate-200 bg-white opacity-60 hover:opacity-90'
                      }`}
                    >
                      <span className="text-xl shrink-0">{plat.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {plat.label}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isSelected ? 'Enabled' : 'Click to add'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Plan Type & Tone Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Plan Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Planning Mode
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                >
                  <option value="single">Multi-Platform Campaign (1 Tailored Post Each)</option>
                  <option value="sprint_7d">7-Day Content Sprint Plan (Daily Schedule)</option>
                  <option value="calendar_30d">30-Day Monthly Content Grid</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Voice & Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CTA Goal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Primary CTA Goal
                </label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                >
                  {CTA_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience & AI Provider Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., B2B Founders, Agency Marketers, DTC Creators"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C81F3]/20 focus:border-[#0C81F3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  AI Model
                </label>
                <ModelSelector
                  value={preferredProvider}
                  onChange={setPreferredProvider}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Includes 5 viral hook variants, hashtag clusters, and Buffer/Hootsuite CSV export</span>
              </div>

              <div className="flex items-center gap-3">
                {planResult && (
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
                      <span>Planning Content...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Generate Content Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error display */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Planning Error</p>
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
              title="Generating Social Posts, Viral Hooks & Calendar"
            />
          </div>
        )}

        {/* Results Section */}
        {planResult && !isLoading && (
          <div id="social-planner-results" className="space-y-6 pt-1">
            {/* Top Overview & Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0C81F3] border border-blue-200 uppercase">
                    {planResult.planType === 'calendar_30d' ? '30-Day Grid' : planResult.planType === 'sprint_7d' ? '7-Day Sprint' : 'Multi-Platform'}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                    {planResult.topic}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{planResult.strategySummary}</p>
              </div>

              {/* View Switchers & Export Suite */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* View Switchers */}
                <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs font-bold">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'cards' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Post Cards
                  </button>
                  <button
                    onClick={() => setViewMode('mockup')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'mockup' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Live Mockup
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'calendar' ? 'bg-white text-[#0C81F3] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Calendar Grid
                  </button>
                </div>

                {/* Export Buttons */}
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Export Buffer / Hootsuite CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleExportICS}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Download .ics calendar events"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0C81F3]" />
                  <span>ICS</span>
                </button>

                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedKey === 'copy-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy All</span>
                </button>
              </div>
            </div>

            {/* VIEW 1: POST CARDS VIEW */}
            {viewMode === 'cards' && (
              <div className="space-y-6">
                {planResult.posts.map((post) => {
                  const activeHookKey = activeHookKeys[post.id] || 'default'
                  const displayContent = getPostContent(post)
                  const isTwitter = post.platform === 'twitter'

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5"
                    >
                      {/* Platform Card Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {post.platform === 'linkedin' ? '💼' : post.platform === 'twitter' ? '𝕏' : post.platform === 'instagram' ? '📸' : '👥'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {post.platformLabel} Post Draft
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                                {displayContent.length} chars
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Best Time: <strong>{post.bestTimeToPost}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(displayContent, `post-${post.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            {copiedKey === `post-${post.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy Post</span>
                          </button>
                        </div>
                      </div>

                      {/* 5 Viral Hook Switcher */}
                      {post.hookVariants && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>5 Viral Hook Variations (Click to swap opening line):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { key: 'default', label: 'Original Hook' },
                              { key: 'question', label: '❓ Question' },
                              { key: 'contrarian', label: '🔥 Contrarian' },
                              { key: 'statistic', label: '📊 Proof / Stat' },
                              { key: 'story', label: '📖 Story' },
                              { key: 'howTo', label: '⚡ How-To' },
                            ].map((hk) => {
                              const isHookActive = activeHookKey === hk.key
                              return (
                                <button
                                  key={hk.key}
                                  type="button"
                                  onClick={() =>
                                    setActiveHookKeys((prev) => ({
                                      ...prev,
                                      [post.id]: hk.key,
                                    }))
                                  }
                                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                    isHookActive
                                      ? 'bg-slate-900 text-white shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {hk.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Post Content Box */}
                      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-line font-normal">
                        {displayContent}
                      </div>

                      {/* Twitter Thread Section (If Twitter) */}
                      {isTwitter && post.threadTweets && post.threadTweets.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Full 5-Tweet Thread Alternative:
                            </span>
                            <button
                              onClick={() => handleCopy(post.threadTweets.join('\n\n---\n\n'), `thread-${post.id}`)}
                              className="text-xs font-bold text-[#0C81F3] hover:underline cursor-pointer"
                            >
                              {copiedKey === `thread-${post.id}` ? 'Copied Thread' : 'Copy Thread'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {post.threadTweets.map((t, tIdx) => (
                              <div key={tIdx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800">
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Recommendation & Hashtags Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                        {/* Media Recommendation */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="font-bold text-slate-700 uppercase tracking-wider block">
                            Recommended Media: {post.mediaRecommendation?.type || 'Image'}
                          </span>
                          <p className="text-slate-600">{post.mediaRecommendation?.description}</p>
                          {post.mediaRecommendation?.slides && post.mediaRecommendation.slides.length > 0 && (
                            <div className="pt-1.5 space-y-1">
                              <span className="font-bold text-slate-500 text-[10px] uppercase">Carousel Slides:</span>
                              {post.mediaRecommendation.slides.map((s, sIdx) => (
                                <div key={sIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3]" />
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hashtag Cluster */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 uppercase tracking-wider">
                              Hashtags ({post.hashtags?.length || 0})
                            </span>
                            <button
                              onClick={() => handleCopy(post.hashtags.join(' '), `tags-${post.id}`)}
                              className="text-[11px] font-bold text-[#0C81F3] hover:underline cursor-pointer"
                            >
                              {copiedKey === `tags-${post.id}` ? 'Copied Tags' : 'Copy All Tags'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags?.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* VIEW 2: REALISTIC SOCIAL MEDIA FEED MOCKUP */}
            {viewMode === 'mockup' && (
              <div className="space-y-6">
                {/* Mockup Platform Tab Bar */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  {planResult.posts.map((p) => (
                    <button
                      key={p.platform}
                      onClick={() => setActiveMockupPlatform(p.platform)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        activeMockupPlatform === p.platform
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.platform === 'linkedin' ? '💼' : p.platform === 'twitter' ? '𝕏' : p.platform === 'instagram' ? '📸' : '👥'}</span>
                      <span>{p.platformLabel} Preview</span>
                    </button>
                  ))}
                </div>

                {/* Selected Mockup Card */}
                {(() => {
                  const activePost = planResult.posts.find((p) => p.platform === activeMockupPlatform) || planResult.posts[0]
                  const content = getPostContent(activePost)

                  return (
                    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                      {/* LinkedIn Mockup */}
                      {activeMockupPlatform === 'linkedin' && (
                        <div className="p-5 sm:p-6 space-y-4 font-sans text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] flex items-center justify-center font-bold text-white shadow-sm">
                              MD
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>Himani Kankaria</span>
                                <span className="text-[11px] text-slate-400 font-normal">• 1st</span>
                              </div>
                              <div className="text-xs text-slate-500">Founder at Missive Digital | SEO & Content Strategist</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>Just now</span> • <span>🌐</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-slate-900 whitespace-pre-line leading-relaxed text-[13.5px]">
                            {content}
                          </div>

                          <div className="flex flex-wrap gap-1 text-[#0A66C2] font-semibold text-xs">
                            {activePost.hashtags.map((h, i) => (
                              <span key={i}>{h}</span>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs px-2">
                            <span className="flex items-center gap-1.5 hover:text-[#0A66C2] cursor-pointer">
                              👍 Like
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-[#0A66C2] cursor-pointer">
                              💬 Comment
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-[#0A66C2] cursor-pointer">
                              🔄 Repost
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-[#0A66C2] cursor-pointer">
                              📤 Send
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Twitter / X Mockup */}
                      {activeMockupPlatform === 'twitter' && (
                        <div className="p-5 sm:p-6 space-y-4 font-sans text-sm bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                                𝕏
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1">
                                  <span>Himani Kankaria</span>
                                  <span className="text-xs text-slate-400 font-normal">@himanikankaria</span>
                                </div>
                                <div className="text-[11px] text-slate-400">SEO & Growth Strategy</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-slate-400">···</span>
                          </div>

                          <div className="text-slate-900 whitespace-pre-line leading-relaxed text-[14px]">
                            {content}
                          </div>

                          <div className="text-xs text-slate-400 border-b border-slate-100 pb-3">
                            8:30 AM · Today · <strong className="text-slate-900">4,281</strong> Views
                          </div>

                          <div className="flex items-center justify-around text-slate-400 text-xs pt-1">
                            <span className="flex items-center gap-1 hover:text-[#1D9BF0] cursor-pointer">
                              <MessageCircle className="w-4 h-4" /> 24
                            </span>
                            <span className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer">
                              <Repeat2 className="w-4 h-4" /> 58
                            </span>
                            <span className="flex items-center gap-1 hover:text-rose-500 cursor-pointer">
                              <Heart className="w-4 h-4" /> 312
                            </span>
                            <span className="flex items-center gap-1 hover:text-[#1D9BF0] cursor-pointer">
                              <Bookmark className="w-4 h-4" /> 89
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Instagram Mockup */}
                      {activeMockupPlatform === 'instagram' && (
                        <div className="font-sans text-sm bg-white">
                          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4] p-0.5">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-800">
                                  MD
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-900">missivedigital</span>
                            </div>
                            <span className="text-sm font-bold text-slate-400">···</span>
                          </div>

                          {/* Image/Graphic Placeholder */}
                          <div className="aspect-square bg-gradient-to-br from-[#0C81F3] via-[#67A7FF] to-[#EB8988] flex flex-col items-center justify-center p-8 text-center text-white shadow-inner">
                            <Sparkles className="w-10 h-10 mb-3 opacity-80" />
                            <h4 className="text-xl sm:text-2xl font-black leading-tight max-w-xs">
                              {activePost.hook}
                            </h4>
                            <span className="mt-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                              SWIPE ➡️
                            </span>
                          </div>

                          {/* Engagement Icons */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-slate-800">
                              <div className="flex items-center gap-3">
                                <Heart className="w-5 h-5 cursor-pointer hover:text-rose-500" />
                                <MessageCircle className="w-5 h-5 cursor-pointer hover:text-blue-500" />
                                <Send className="w-5 h-5 cursor-pointer hover:text-blue-500" />
                              </div>
                              <Bookmark className="w-5 h-5 cursor-pointer hover:text-amber-500" />
                            </div>

                            <div className="text-xs font-bold text-slate-900">482 likes</div>

                            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                              <strong>missivedigital</strong> {content}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Facebook Mockup */}
                      {activeMockupPlatform === 'facebook' && (
                        <div className="p-5 sm:p-6 space-y-4 font-sans text-sm bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold">
                              f
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">Missive Digital</div>
                              <div className="text-[11px] text-slate-400">Sponsored / Organic · 🌐 Public</div>
                            </div>
                          </div>

                          <div className="text-slate-900 whitespace-pre-line leading-relaxed text-[13.5px]">
                            {content}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-slate-500 text-xs">
                            <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#1877F2]">
                              👍 Like
                            </span>
                            <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#1877F2]">
                              💬 Comment
                            </span>
                            <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#1877F2]">
                              ↪️ Share
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* VIEW 3: VISUAL CALENDAR SCHEDULE GRID */}
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {planResult.planType === 'calendar_30d' ? '30-Day Monthly Content Grid' : '7-Day Content Sprint Calendar'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Structured daily schedule mapped to 7 core marketing pillars
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportICS}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Add to Calendar (.ICS)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {planResult.calendar?.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            Day {item.dayNumber} • {item.dayName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 uppercase font-mono">
                            {item.platform}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0C81F3] text-[10px] font-bold">
                          {item.contentPillar}
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                          {item.headline}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                          {item.draftSnippet}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">⏰ {item.time}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {item.status || 'Ready'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-sm mt-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
            <p className="text-sm text-slate-600">
              Best practices for social media planning, algorithm optimization, and scheduling
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
