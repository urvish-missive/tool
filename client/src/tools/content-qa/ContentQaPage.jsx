import { useState, useEffect, useMemo, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Volume2,
  VolumeX,
  RefreshCw,
  Copy,
  Check,
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  Wand2,
  Share2,
  Eye,
  Edit3,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Target,
  Search,
  MessageSquare,
  BarChart3,
  ArrowRight,
  ClipboardCheck,
  AlertCircle,
  Layers,
  ArrowUpRight,
  CheckCheck,
  Maximize2,
  Minimize2,
  Quote,
  Lightbulb,
  Users,
  Award,
  Zap,
  Scissors,
  Compass,
  Layout,
  Ban,
  Monitor,
  UploadCloud,
  Globe,
  Link2,
  FileUp,
  FileCheck2,
} from 'lucide-react'
import ModelSelector from '../shared/ModelSelector'
import DynamicLeadForm from '../../components/DynamicLeadForm'
import LeadCaptureModal from '../../components/LeadCaptureModal'
import { useLeadPopup } from '../../components/useLeadPopup'
import useToolFields from '../../hooks/useToolFields'
import UnifiedToolLoader from '../../components/UnifiedToolLoader'
import {
  useAnalyzeContentQaMutation,
  usePolishContentQaMutation,
  useImportContentQaMutation,
} from '../../services/apiSlice'
import { contentQaSchema, parseContentQaForm } from '../../schemas/contentQa.schema'
import { getScoreColor, getScoreBg } from '../../utils/scoreHelpers'
import {
  computeWordDiff,
  computeParagraphDiff,
  computePolishMetrics,
} from '../../utils/textDiff'

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
      {
        id: 'ra-2',
        label: 'Does it hold attention, sound confident, and flow smoothly?',
        auto: false,
      },
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
      {
        id: 'eat-1',
        label: 'Is lived experience, observation, or real context added?',
        auto: true,
      },
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
      {
        id: 'ins-1',
        label:
          'Does the content start with an insight, observation, or hook, and not a long setup?',
        auto: true,
      },
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
      {
        id: 'mc-1',
        label:
          'Every line adds new or valuable info, clarity, or perspective for that one audience',
        auto: false,
      },
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
      {
        id: 'off-1',
        label: 'Are we not undermining any profession, system, academy, or industry?',
        auto: false,
      },
      {
        id: 'off-2',
        label: 'Is it polished and respectful, even when talking about gaps or competitors?',
        auto: false,
      },
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
      {
        id: 'bp-2',
        label:
          "Are we reinforcing authority, sharing the brand's experience & expertise without sounding salesy?",
        auto: true,
      },
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
      {
        id: 'comp-1',
        label: 'No claims that trigger compliance (e.g., pharma, medical).',
        auto: true,
      },
      {
        id: 'comp-2',
        label:
          'No overstatements for industries where neutrality matters (finance, telecom, etc.).',
        auto: true,
      },
    ],
  },
  {
    id: 'visual_platform_fit',
    number: 12,
    label: 'Visual + Platform Fit',
    icon: <Monitor className="w-4 h-4 text-emerald-600" />,
    color: '#10B981',
    items: [
      {
        id: 'vpf-1',
        label: 'Does it suit the platform (Website, LinkedIn, newsletter, etc.)?',
        auto: true,
      },
      { id: 'vpf-2', label: 'Is it scannable (bullets, short paras, hooks)?', auto: true },
      {
        id: 'vpf-3',
        label:
          'Does it have enough media such as images, graphs, infographics, video embeds, etc.?',
        auto: true,
      },
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

function downloadQaPdf(report, meta) {
  import('../../utils/generateQaPdf').then((m) => m.downloadQaPdf(report, meta))
}

export default function ContentQaPage() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset: resetForm,
    setValue,
  } = useForm({
    resolver: zodResolver(contentQaSchema),
    defaultValues: {
      content: '',
      title: '',
      targetKeyword: '',
      platform: 'website',
      targetAudience: '',
      preferredProvider: 'openrouter',
    },
  })

  const content = watch('content')
  const title = watch('title')
  const targetKeyword = watch('targetKeyword')
  const platform = watch('platform')
  const targetAudience = watch('targetAudience')
  const aiModel = watch('preferredProvider')

  const [report, setReport] = useState(null)
  const [qaId, setQaId] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [expandedCats, setExpandedCats] = useState({})
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('grid')
  const [filterMode, setFilterMode] = useState('all')
  const [copiedAction, setCopiedAction] = useState(false)

  // One-Click Polish State & Views
  const [polishedResult, setPolishedResult] = useState(null)
  const [polishError, setPolishError] = useState(null)
  const [copiedPolish, setCopiedPolish] = useState(false)
  const [copiedTitle, setCopiedTitle] = useState(false)
  const [polishViewMode, setPolishViewMode] = useState('diff') // 'diff' | 'clean' | 'split'
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [copiedDocs, setCopiedDocs] = useState(false)

  // Multi-Format Content Input State
  const [inputSourceMode, setInputSourceMode] = useState('text') // 'text' | 'gdoc' | 'web' | 'file'
  const [gdocUrl, setGdocUrl] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [importError, setImportError] = useState(null)
  const [importSuccessMsg, setImportSuccessMsg] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef(null)

  // Memoized Word Diff & Metrics
  const polishDiff = useMemo(() => {
    if (!polishedResult) return []
    const oldText = (content || '').trim()
    const newText = (typeof polishedResult === 'string' ? polishedResult : polishedResult.polishedContent || '').trim()
    return computeWordDiff(oldText, newText)
  }, [content, polishedResult])

  const polishParagraphDiff = useMemo(() => {
    if (!polishedResult) return []
    const oldText = (content || '').trim()
    const newText = (typeof polishedResult === 'string' ? polishedResult : polishedResult.polishedContent || '').trim()
    return computeParagraphDiff(oldText, newText)
  }, [content, polishedResult])

  const polishMetrics = useMemo(() => {
    if (!polishedResult) return null
    const oldText = (content || '').trim()
    const newText = (typeof polishedResult === 'string' ? polishedResult : polishedResult.polishedContent || '').trim()
    return computePolishMetrics(oldText, newText)
  }, [content, polishedResult])

  // Speech Synthesizer State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)

  // Live Inspector Grouping & Filter State
  const [inspectorFilter, setInspectorFilter] = useState('all')
  const [expandedHighlights, setExpandedHighlights] = useState({})

  const toggleHighlightExpand = (id) => {
    setExpandedHighlights((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Highlighted snippet renderer
  const renderHighlightedSnippet = (context, matchText) => {
    if (!context) return null
    if (!matchText) return <span>{context}</span>
    try {
      const escaped = matchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      const parts = context.split(regex)
      return (
        <span>
          {parts.map((part, idx) =>
            part.toLowerCase() === matchText.toLowerCase() ? (
              <mark
                key={idx}
                className="bg-rose-200/90 text-rose-950 font-bold px-1.5 py-0.5 rounded border border-rose-300 mx-0.5 inline-block font-mono text-xs shadow-2xs"
              >
                {part}
              </mark>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </span>
      )
    } catch {
      return <span>{context}</span>
    }
  }

  // Group highlights by type + match text so multiple occurrences (e.g. 11 em dashes) collapse into 1 card with occurrences
  const groupedHighlights = useMemo(() => {
    if (!report?.highlights || !Array.isArray(report.highlights) || report.highlights.length === 0) {
      return []
    }

    const groupsMap = new Map()

    for (const h of report.highlights) {
      const type = h.type || 'flag'
      const normText = (h.text || '').trim()
      const groupKey = `${type}::${normText.toLowerCase()}`

      if (!groupsMap.has(groupKey)) {
        const isError =
          h.severity === 'error' ||
          type === 'em-dash' ||
          type === 'milestone' ||
          type === 'compliance'

        const label =
          h.label ||
          (type === 'em-dash'
            ? 'Em Dash Detected'
            : type === 'ai-cliche'
              ? 'Robotic AI Cliché'
              : type === 'filler'
                ? 'Filler / Fluff Transition'
                : type === 'superlative'
                  ? 'Exaggerated Superlative'
                  : type === 'milestone'
                    ? 'Milestone / Tenure Boasting'
                    : type === 'compliance'
                      ? 'Compliance Risk'
                      : 'Editorial Flag')

        const reason =
          h.reason ||
          h.message ||
          "Needs editorial refinement according to Himani's Content QA checklist."

        const suggestion =
          h.suggestion ||
          (type === 'em-dash'
            ? 'Use a comma, parentheses, or split into two short sentences.'
            : 'Remove or replace with conversational human phrasing.')

        groupsMap.set(groupKey, {
          id: groupKey,
          type,
          label,
          text: h.text,
          severity: h.severity || (isError ? 'error' : 'warning'),
          isError,
          reason,
          suggestion,
          occurrences: [],
        })
      }

      const group = groupsMap.get(groupKey)
      group.occurrences.push({
        index: h.index,
        length: h.length,
        context: h.context,
        message: h.message,
      })
    }

    return Array.from(groupsMap.values())
  }, [report?.highlights])

  const filteredGroupedHighlights = useMemo(() => {
    if (inspectorFilter === 'all') return groupedHighlights
    return groupedHighlights.filter((g) => g.type === inspectorFilter)
  }, [groupedHighlights, inspectorFilter])

  const highlightCategoryCounts = useMemo(() => {
    const counts = { all: report?.highlights?.length || 0 }
    if (!report?.highlights) return counts
    for (const h of report.highlights) {
      const t = h.type || 'other'
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [report?.highlights])

  const [analyzeContentQa, { isLoading: isAnalyzing, reset: resetMutation }] =
    useAnalyzeContentQaMutation()
  const [polishContentQa, { isLoading: isPolishing }] = usePolishContentQaMutation()
  const [importContentQa, { isLoading: isImporting }] = useImportContentQaMutation()

  // Google Docs URL Import Handler
  const handleImportGdoc = async () => {
    if (!gdocUrl.trim()) {
      setImportError('Please enter a Google Doc link.')
      return
    }
    setImportError(null)
    setImportSuccessMsg(null)
    try {
      const res = await importContentQa({ url: gdocUrl.trim() }).unwrap()
      if (res.content) {
        setValue('content', res.content, { shouldValidate: true })
        if (res.title && !title) setValue('title', res.title)
        setImportSuccessMsg(`✓ Successfully imported ${res.wordCount || 0} words from Google Doc!`)
        setInputSourceMode('text')
      }
    } catch (err) {
      setImportError(
        err?.data?.error ||
          err.message ||
          'Failed to import Google Doc. Make sure "Anyone with the link can view" is enabled in Google Docs.'
      )
    }
  }

  // Web Article URL Import Handler
  const handleImportWebUrl = async () => {
    if (!webUrl.trim()) {
      setImportError('Please enter a valid website or article URL.')
      return
    }
    setImportError(null)
    setImportSuccessMsg(null)
    try {
      const res = await importContentQa({ url: webUrl.trim() }).unwrap()
      if (res.content) {
        setValue('content', res.content, { shouldValidate: true })
        if (res.title && !title) setValue('title', res.title)
        setImportSuccessMsg(`✓ Successfully imported ${res.wordCount || 0} words from article!`)
        setInputSourceMode('text')
      }
    } catch (err) {
      setImportError(
        err?.data?.error || err.message || 'Failed to extract content from this URL.'
      )
    }
  }

  // Document File Upload Handler (.docx, .doc, .txt, .md, .html)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccessMsg(null)
    setUploadedFileName(file.name)

    const ext = file.name.split('.').pop().toLowerCase()

    if (['txt', 'md', 'html', 'htm'].includes(ext)) {
      const reader = new FileReader()
      reader.onload = (event) => {
        let text = event.target?.result || ''
        if (ext === 'html' || ext === 'htm') {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          const pageTitle = doc.querySelector('title')?.innerText || ''
          if (pageTitle && !title) setValue('title', pageTitle)
          text = doc.body?.innerText || text
        }
        setValue('content', text.trim(), { shouldValidate: true })
        const words = text.trim().split(/\s+/).filter(Boolean).length
        setImportSuccessMsg(`✓ Successfully loaded "${file.name}" (${words} words)!`)
        setInputSourceMode('text')
      }
      reader.readAsText(file)
    } else if (ext === 'docx') {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const rawBase64 = (event.target?.result || '').split(',')[1]
          const res = await importContentQa({
            base64Data: rawBase64,
            filename: file.name,
            mimeType: file.type,
          }).unwrap()
          if (res.content) {
            setValue('content', res.content, { shouldValidate: true })
            if (res.title && !title) setValue('title', res.title)
            setImportSuccessMsg(
              `✓ Successfully extracted ${res.wordCount || 0} words from Word document!`
            )
            setInputSourceMode('text')
          }
        } catch (err) {
          setImportError(
            err?.data?.error ||
              err.message ||
              'Could not extract text from .docx file. You can also paste text directly.'
          )
        }
      }
      reader.readAsDataURL(file)
    } else {
      setImportError('Supported formats: .docx, .txt, .md, .html')
    }
  }

  // Google Docs Export Handler
  const handleExportToGoogleDocs = async () => {
    const rawContent = typeof polishedResult === 'string' ? polishedResult : polishedResult.polishedContent || ''
    const polishedHeadline = polishedResult?.polishedTitle || title || 'Polished Content'

    // Format rich HTML for clipboard so it pastes into Google Docs with headings and styling
    const htmlBody = rawContent
      .split('\n\n')
      .map((para) => {
        const trimmed = para.trim()
        if (trimmed.startsWith('### ')) return `<h3 style="font-size: 14pt; color: #1E293B; margin-top: 10pt; margin-bottom: 3pt;">${trimmed.substring(4)}</h3>`
        if (trimmed.startsWith('## ')) return `<h2 style="font-size: 16pt; color: #0C81F3; margin-top: 14pt; margin-bottom: 4pt;">${trimmed.substring(3)}</h2>`
        if (trimmed.startsWith('# ')) return `<h1 style="font-size: 20pt; color: #0C81F3; margin-top: 16pt; margin-bottom: 6pt;">${trimmed.substring(2)}</h1>`
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed
            .split('\n')
            .map((li) => `<li style="margin-bottom: 3pt;">${li.replace(/^[-*]\s+/, '')}</li>`)
            .join('')
          return `<ul style="margin-bottom: 8pt; padding-left: 20pt;">${items}</ul>`
        }
        return `<p style="margin-bottom: 8pt; font-size: 11pt; line-height: 1.6;">${trimmed.replace(/\n/g, '<br/>')}</p>`
      })
      .join('')

    const fullHtml = `
      <div style="font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 800px;">
        <h1 style="color: #0C81F3; font-size: 22pt; margin-bottom: 4pt;">${polishedHeadline}</h1>
        <p style="font-size: 10pt; color: #64748B; margin-bottom: 16pt; border-bottom: 1pt solid #E2E8F0; padding-bottom: 6pt;">
          <em>Himani Kankaria 12-Pillar Editorial Polish • Missive Digital (missivedigital.com)</em>
        </p>
        ${htmlBody}
      </div>
    `

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([fullHtml], { type: 'text/html' }),
            'text/plain': new Blob([`${polishedHeadline}\n\n${rawContent}`], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(`${polishedHeadline}\n\n${rawContent}`)
      }
    } catch {
      await navigator.clipboard.writeText(`${polishedHeadline}\n\n${rawContent}`)
    }

    // Open Docs blank creation
    window.open('https://docs.new', '_blank')
    setShowDocsModal(true)
  }

  // Download .doc file (Microsoft Word & Google Docs compatible)
  const handleDownloadDocx = () => {
    const rawContent = typeof polishedResult === 'string' ? polishedResult : polishedResult.polishedContent || ''
    const polishedHeadline = polishedResult?.polishedTitle || title || 'Polished Content'
    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${polishedHeadline}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; margin: 20pt; }
        h1 { color: #0C81F3; font-size: 18pt; margin-bottom: 6pt; font-weight: bold; }
        h2 { color: #1E293B; font-size: 14pt; margin-top: 12pt; margin-bottom: 4pt; font-weight: bold; }
        h3 { color: #334155; font-size: 12pt; margin-top: 10pt; margin-bottom: 3pt; font-weight: bold; }
        p { margin-bottom: 8pt; }
        ul, ol { margin-bottom: 8pt; }
        .meta { color: #64748B; font-size: 9.5pt; border-bottom: 1pt solid #E2E8F0; padding-bottom: 6pt; margin-bottom: 14pt; }
        .footer { font-size: 9pt; color: #64748B; border-top: 1pt solid #E2E8F0; padding-top: 6pt; margin-top: 20pt; }
      </style>
      </head>
      <body>
        <h1>${polishedHeadline}</h1>
        <div class="meta">Himani Kankaria 12-Pillar Editorial Polish • Missive Digital (missivedigital.com)</div>
        ${rawContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')}
        <div class="footer">Exported from Missive Digital Content QA Checklist (missivedigital.com)</div>
      </body>
      </html>
    `
    const blob = new Blob(['\ufeff' + htmlDoc], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `himani-polished-${(title || 'content').toLowerCase().replace(/[^a-z0-9]/g, '-')}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const {
    popupEnabled,
    showPopup,
    setShowPopup,
    handlePopupSubmit,
    handlePopupClose,
    triggerPopup,
  } = useLeadPopup('content-qa')
  const { isFieldEnabled } = useToolFields('content-qa')

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const charCount = content.length

  const handleReset = () => {
    resetForm()
    setReport(null)
    setQaId(null)
    setStatuses({})
    setPolishedResult(null)
    setError(null)
    resetMutation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    setValue('title', 'How to Elevate Your Content Strategy with First-Hand Insights')
    setValue('targetKeyword', 'content strategy')
    setValue('platform', 'website')
    setValue('targetAudience', 'B2B Content Marketers & Agency Leaders')
    setValue('content', SAMPLE_CONTENT)
  }

  const onFormValid = (formData) => {
    if (popupEnabled) {
      triggerPopup()
      return
    }
    runAnalysis(formData)
  }

  const runAnalysis = async (formData) => {
    const parsed = parseContentQaForm(formData || watch())
    if (!parsed.success) return

    setError(null)
    setReport(null)
    setPolishedResult(null)
    try {
      const data = await analyzeContentQa({
        content: parsed.data.content,
        title: parsed.data.title,
        targetKeyword: parsed.data.targetKeyword,
        platform: parsed.data.platform,
        targetAudience: parsed.data.targetAudience,
        preferredProvider: parsed.data.preferredProvider,
      }).unwrap()

      setReport(data.report)
      setQaId(data.qaId)
      if (data.report?.statuses) {
        setStatuses(data.report.statuses)
      }

      // Auto-expand categories that have issues
      const initialExpanded = {}
      HIMANI_CATEGORIES_DEF.forEach((c) => {
        const catScore = data.report.categoryScores?.[c.id] || 100
        if (catScore < 85) initialExpanded[c.id] = true
      })
      setExpandedCats(initialExpanded)
    } catch (err) {
      setError(
        err?.data?.error ||
          err.message ||
          'Analysis failed. Please check your connection or AI provider.'
      )
    }
  }

  // One-click Himani Polish
  const runHimaniPolish = async () => {
    setPolishError(null)
    const textToPolish = (content || '').trim()
    if (textToPolish.length < 20) {
      setPolishError('Please enter at least 20 characters of content to polish.')
      setActiveTab('polish')
      return
    }

    try {
      const data = await polishContentQa({
        content: textToPolish,
        title: title.trim() || undefined,
        targetKeyword: targetKeyword.trim() || undefined,
        platform,
        preferredProvider: aiModel,
      }).unwrap()

      setPolishedResult(data.polished)
      setActiveTab('polish')
    } catch (err) {
      setPolishError(err?.data?.error || err.message || 'Unable to polish content.')
      setActiveTab('polish')
    }
  }

  // Toggle checklist status manually
  const toggleStatus = (itemId) => {
    setStatuses((prev) => {
      const current = prev[itemId] || 'pending'
      const next =
        current === 'pending'
          ? 'pass'
          : current === 'pass'
            ? 'warning'
            : current === 'warning'
              ? 'fail'
              : 'pass'
      return { ...prev, [itemId]: next }
    })
  }

  const toggleCat = (catId) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }))
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
      let pass = 0,
        fail = 0,
        warning = 0
      for (const item of cat.items) {
        const s = getStatus(item)
        if (s === 'pass') pass++
        else if (s === 'fail') fail++
        else if (s === 'warning') warning++
      }
      const assessed = pass + fail + warning
      const catVal = assessed > 0 ? Math.round(((pass + warning * 0.5) / assessed) * 100) : 100
      catScores[cat.id] = catVal
      totalItems += assessed
      totalPass += pass
      totalFail += fail
      totalWarning += warning
    }

    const overall =
      totalItems > 0
        ? Math.round(
            Object.values(catScores).reduce((a, b) => a + b, 0) / Object.keys(catScores).length
          )
        : 0
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
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
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

  // Filtered categories based on user filter pill
  const filteredCategories = useMemo(() => {
    if (filterMode === 'all') return HIMANI_CATEGORIES_DEF
    return HIMANI_CATEGORIES_DEF.filter((cat) => {
      const catItems = cat.items
      if (filterMode === 'needs_action') {
        return catItems.some((i) => ['fail', 'warning'].includes(getStatus(i)))
      }
      if (filterMode === 'passed') {
        return catItems.every((i) => getStatus(i) === 'pass')
      }
      if (filterMode === 'manual') {
        return catItems.some((i) => !i.auto)
      }
      return true
    })
  }, [filterMode, statuses, report])

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900">
      <LeadCaptureModal
        show={showPopup}
        onClose={handlePopupClose}
        onSubmit={() => {
          handlePopupSubmit()
          runAnalysis()
        }}
        toolSlug="content-qa"
        title="Unlock Himani's 12-Pillar Content QA Report"
        subtitle="Enter your details to generate your full quality breakdown and AI audit."
      />

      {/* ── HERO BANNER (Site Brand Gradient: #0C81F3 to #EB8988) ──── */}
      <section className="relative overflow-hidden !pt-36 py-16 sm:py-20 lg:py-24">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-5 tracking-wide uppercase shadow-sm">
            Free QA Tool
          </span>

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
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              QA Checklist
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            QA every piece of content written for your brand the way Himani does.
            <span className="block text-sm text-gray-500 font-medium mt-1">
              12 Pillars • 34 Precision Checks • Zero AI Fluff & Zero Em Dashes
            </span>
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
            <form
              onSubmit={handleSubmit(onFormValid)}
              className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-9 space-y-6"
            >
              {/* Content Input Mode Selector Tabs */}
              {isFieldEnabled('content') && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-gray-100">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      Content to Audit <span className="text-[#0C81F3]">*</span>
                    </label>

                    {/* Mode Switcher Tabs */}
                    <div className="inline-flex p-1 bg-gray-100/90 rounded-2xl border border-gray-200/80 gap-1 text-xs font-semibold text-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          setInputSourceMode('text')
                          setImportError(null)
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          inputSourceMode === 'text'
                            ? 'bg-white text-[#0C81F3] shadow-sm font-bold'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Paste / Write</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputSourceMode('gdoc')
                          setImportError(null)
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          inputSourceMode === 'gdoc'
                            ? 'bg-white text-[#0C81F3] shadow-sm font-bold'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Google Doc</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputSourceMode('web')
                          setImportError(null)
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          inputSourceMode === 'web'
                            ? 'bg-white text-[#0C81F3] shadow-sm font-bold'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Web URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputSourceMode('file')
                          setImportError(null)
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          inputSourceMode === 'file'
                            ? 'bg-white text-[#0C81F3] shadow-sm font-bold'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>

                  {/* ── GOOGLE DOCS IMPORT CARD ── */}
                  {inputSourceMode === 'gdoc' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#0C81F3]" />
                            Import Content Directly from Google Docs
                          </h4>
                          <p className="text-xs text-blue-800/80 mt-1">
                            Paste your Google Doc share link. Make sure General Access is set to{' '}
                            <strong>"Anyone with the link (Viewer)"</strong> in Google Docs.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Link2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type="url"
                            value={gdocUrl}
                            onChange={(e) => setGdocUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleImportGdoc()
                              }
                            }}
                            placeholder="https://docs.google.com/document/d/.../edit"
                            className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleImportGdoc}
                          disabled={isImporting || !gdocUrl.trim()}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Fetching Doc...</span>
                            </>
                          ) : (
                            <>
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Import Content</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── WEB URL / ARTICLE IMPORT CARD ── */}
                  {inputSourceMode === 'web' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-emerald-600" />
                          Import from Live Blog or Web Page URL
                        </h4>
                        <p className="text-xs text-emerald-800/80 mt-1">
                          Paste any published article or blog link to automatically extract the
                          headline and main article body.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type="url"
                            value={webUrl}
                            onChange={(e) => setWebUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleImportWebUrl()
                              }
                            }}
                            placeholder="https://example.com/blog/my-awesome-post"
                            className="w-full rounded-xl border border-emerald-200 bg-white pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleImportWebUrl}
                          disabled={isImporting || !webUrl.trim()}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Scraping URL...</span>
                            </>
                          ) : (
                            <>
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Fetch Article</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── FILE UPLOAD DROPZONE CARD ── */}
                  {inputSourceMode === 'file' && (
                    <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-purple-600" />
                          Upload Document File
                        </h4>
                        <p className="text-xs text-purple-800/80 mt-1">
                          Supports <strong>Microsoft Word (.docx)</strong>, <strong>Plain Text (.txt)</strong>, <strong>Markdown (.md)</strong>, or <strong>HTML (.html)</strong>.
                        </p>
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 bg-white/80 text-center cursor-pointer transition-all hover:bg-white flex flex-col items-center justify-center gap-2 group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".docx,.txt,.md,.html,.htm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-purple-900">
                            Click to browse or drop your document here
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            .docx, .txt, .md, .html (Up to 10MB)
                          </p>
                        </div>
                        {uploadedFileName && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                            ✓ {uploadedFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Import Success Notification */}
                  {importSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{importSuccessMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImportSuccessMsg(null)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Import Error Notification */}
                  {importError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>{importError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImportError(null)}
                        className="text-rose-700 hover:text-rose-900 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Textarea Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-500">
                        {wordCount} words • {charCount} characters
                      </span>
                      {content && (
                        <button
                          type="button"
                          onClick={() => setValue('content', '')}
                          className="text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                    <textarea
                      {...register('content')}
                      rows={12}
                      placeholder="Paste or edit your blog post, article, LinkedIn draft, or newsletter content here..."
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm leading-relaxed text-gray-800 focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none transition-all resize-y min-h-[220px] ${errors.content ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300'}`}
                    />
                    {errors.content && (
                      <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
                    )}
                    <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                      <span>Himani's Rule: Every line must earn its place.</span>
                      {wordCount > 0 && wordCount < 20 && (
                        <span className="text-red-500 font-semibold">Minimum 20 words required</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Target Keyword */}
              <div className="grid sm:grid-cols-2 gap-4">
                {isFieldEnabled('title') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Headline / H1 Title
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="e.g. 7 Content QA Secrets to 10x Readability"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                    />
                  </div>
                )}

                {isFieldEnabled('targetKeyword') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Target Keyword
                    </label>
                    <input
                      type="text"
                      {...register('targetKeyword')}
                      placeholder="e.g. content QA checklist"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Platform & Audience */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Platform
                  </label>
                  <select
                    {...register('platform')}
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
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Audience & Voice (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('targetAudience')}
                    placeholder="e.g. B2B Founders, Marketing Directors"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#0C81F3] focus:border-[#0C81F3] outline-none"
                  />
                </div>
              </div>

              {/* AI Model Selector */}
              <Controller
                control={control}
                name="preferredProvider"
                render={({ field }) => (
                  <ModelSelector value={field.value} onChange={field.onChange} />
                )}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
            <UnifiedToolLoader
              title="Auditing 34 Checks Across All 12 Quality Pillars..."
              subtitle="Eliminating AI clichés, scanning structural flow, and verifying E-E-A-T trust signals."
              steps={LOADING_STEPS}
            />
          )}

          {/* ── ERROR DISPLAY ──────────────────────────────────────── */}
          {error && !isAnalyzing && (
            <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-8 text-center max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">QA Audit Failed</h3>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setReport(null)
                }}
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
                    onClick={handleReset}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    ← Audit New Content
                  </button>
                  <button
                    onClick={handleCopyActionPlan}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    {copiedAction ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
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
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0C81F3]">
                      Overall Himani Score
                    </span>
                    <div className="flex items-baseline justify-center md:justify-start gap-2 mt-2">
                      <span
                        className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${getScoreColor(scores.overall)}`}
                      >
                        {scores.overall}
                      </span>
                      <span className="text-2xl font-bold text-gray-400">/100</span>
                    </div>

                    <div className="mt-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreBg(scores.overall)}`}
                      >
                        {report.ai?.publicationReadiness ||
                          (scores.overall >= 80 ? 'Ready to Publish' : 'Minor Polish Needed')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {scores.passed} passed • {scores.warnings + scores.failed} need action
                    </p>
                  </div>

                  {/* Right Column: 4 Signature Quick Alert Cards */}
                  <div className="md:col-span-8 grid sm:grid-cols-2 gap-3.5">
                    {/* Em Dash Sentinel */}
                    <div
                      className={`p-4 rounded-2xl border ${report.quickStats?.emDashesCount === 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          🚫 Em Dashes Detected
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.quickStats?.emDashesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {report.quickStats?.emDashesCount || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        {report.quickStats?.emDashesCount === 0
                          ? '✓ Strict Himani rule satisfied: zero em dashes.'
                          : `Found ${report.quickStats.emDashesCount} em dash(es). Replace with commas or sentence breaks.`}
                      </p>
                    </div>

                    {/* AI Cliches & Buzzwords */}
                    <div
                      className={`p-4 rounded-2xl border ${report.quickStats?.aiPhrasesCount === 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          🤖 Robotic AI Cliches
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.quickStats?.aiPhrasesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                        >
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
                          ~{Math.ceil((report.quickStats?.estimatedReadAloudTimeSec || 60) / 60)}{' '}
                          min speech
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800/80">
                        Flesch Ease: <strong>{report.quickStats?.fleschScore || 65}/100</strong>.
                        Test audio flow in the studio tab.
                      </p>
                    </div>

                    {/* Insight-First Hook */}
                    <div
                      className={`p-4 rounded-2xl border ${report.statuses?.['ins-1'] === 'pass' ? 'bg-emerald-50/80 border-emerald-200' : 'bg-blue-50/80 border-blue-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          ⚡ Insight-First Opening
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${report.statuses?.['ins-1'] === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}
                        >
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
                    <span>
                      12-Pillar Checklist ({scores.passed}/{scores.total})
                    </span>
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
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Filter:
                      </span>
                      {[
                        { id: 'all', label: `All 12 Pillars (${scores.total})` },
                        {
                          id: 'needs_action',
                          label: `Needs Action (${scores.failed + scores.warnings})`,
                        },
                        { id: 'passed', label: `Passed (${scores.passed})` },
                        { id: 'manual', label: 'Manual Review' },
                      ].map((f) => (
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
                        const allOpen =
                          Object.keys(expandedCats).length === HIMANI_CATEGORIES_DEF.length
                        if (allOpen) setExpandedCats({})
                        else {
                          const all = {}
                          HIMANI_CATEGORIES_DEF.forEach((c) => (all[c.id] = true))
                          setExpandedCats(all)
                        }
                      }}
                      className="text-xs font-semibold text-[#0C81F3] hover:underline"
                    >
                      {Object.keys(expandedCats).length === HIMANI_CATEGORIES_DEF.length
                        ? 'Collapse All'
                        : 'Expand All Details'}
                    </button>
                  </div>

                  {/* 2-Column Responsive Card Grid */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {filteredCategories.map((cat) => {
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
                                    <span className="text-xs font-bold text-gray-400">
                                      #{cat.number}
                                    </span>
                                    <h3 className="text-sm font-bold text-gray-900">{cat.label}</h3>
                                  </div>
                                  <p className="text-[11px] text-gray-500">
                                    {cat.items.length} quality checks
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${getScoreBg(catScore)}`}
                                >
                                  {catScore}%
                                </span>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </button>

                            {/* Checklist Items */}
                            <div className="px-4 pb-4 space-y-1.5 border-t border-gray-100 pt-3">
                              {cat.items.map((item) => {
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
                                        <span
                                          className={`text-xs leading-snug ${st === 'pass' ? 'text-gray-800 font-medium' : st === 'warning' ? 'text-amber-900 font-semibold' : 'text-rose-900 font-semibold'}`}
                                        >
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
                                  <span className="font-bold text-rose-700 block mb-1">
                                    Detected Issues:
                                  </span>
                                  {aiCat.issues.map((issue, idx) => (
                                    <p
                                      key={idx}
                                      className="text-gray-700 text-[11px] mb-0.5 flex items-start gap-1"
                                    >
                                      <span className="text-rose-500">•</span>
                                      {issue}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {aiCat.suggestions?.length > 0 && (
                                <div>
                                  <span className="font-bold text-[#0C81F3] block mb-1">
                                    Himani's Suggestions:
                                  </span>
                                  {aiCat.suggestions.map((s, idx) => (
                                    <p
                                      key={idx}
                                      className="text-gray-700 text-[11px] mb-0.5 flex items-start gap-1"
                                    >
                                      <span className="text-[#0C81F3]">→</span>
                                      {s}
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
              {/* TAB 2: LIVE CONTENT INSPECTOR                       */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'inspector' && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>🔍 Live Content Inspector</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-[#0C81F3]">
                          {report.highlights?.length || 0} Total Flag(s)
                        </span>
                        {groupedHighlights.length > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                            {groupedHighlights.length} Unique Issue Type(s)
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Deep scan of every sentence for em dashes, robotic AI clichés, filler phrasing, and compliance triggers. Issues are grouped by rule to prevent repetitive clutter.
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  {report.highlights?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pb-2">
                      <button
                        type="button"
                        onClick={() => setInspectorFilter('all')}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                          inspectorFilter === 'all'
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Issues ({report.highlights?.length || 0})
                      </button>

                      {highlightCategoryCounts['em-dash'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('em-dash')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'em-dash'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>🚫 Em Dashes</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['em-dash']}
                          </span>
                        </button>
                      )}

                      {highlightCategoryCounts['ai-cliche'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('ai-cliche')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'ai-cliche'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span>🤖 AI Clichés</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['ai-cliche']}
                          </span>
                        </button>
                      )}

                      {highlightCategoryCounts['filler'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('filler')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'filler'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          <span>✂️ Fluff & Fillers</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['filler']}
                          </span>
                        </button>
                      )}

                      {highlightCategoryCounts['superlative'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('superlative')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'superlative'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          <span>⚡ Superlatives</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['superlative']}
                          </span>
                        </button>
                      )}

                      {highlightCategoryCounts['milestone'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('milestone')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'milestone'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <span>🏆 Milestones</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['milestone']}
                          </span>
                        </button>
                      )}

                      {highlightCategoryCounts['compliance'] > 0 && (
                        <button
                          type="button"
                          onClick={() => setInspectorFilter('compliance')}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                            inspectorFilter === 'compliance'
                              ? 'bg-red-700 text-white shadow-xs'
                              : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span>⚖️ Compliance</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
                            {highlightCategoryCounts['compliance']}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {filteredGroupedHighlights.length > 0 ? (
                    <div className="space-y-4">
                      {/* Interactive Grouped Highlight Cards List */}
                      <div className="grid gap-4">
                        {filteredGroupedHighlights.map((group) => {
                          const occCount = group.occurrences?.length || 1
                          const isExpanded = expandedHighlights[group.id] || occCount <= 2

                          return (
                            <div
                              key={group.id}
                              className={`p-5 rounded-2xl border transition-all shadow-xs ${
                                group.isError
                                  ? 'bg-red-50/60 border-red-200 text-red-950'
                                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base">
                                    {group.type === 'em-dash'
                                      ? '🚫'
                                      : group.type === 'ai-cliche'
                                        ? '🤖'
                                        : group.type === 'filler'
                                          ? '✂️'
                                          : group.type === 'milestone'
                                            ? '🏆'
                                            : group.type === 'superlative'
                                              ? '⚡'
                                              : '⚠️'}
                                  </span>
                                  <span className="text-sm font-bold tracking-tight text-gray-900">
                                    {group.label}
                                  </span>
                                  {group.text && (
                                    <code className="text-xs px-2.5 py-0.5 rounded-md bg-white border border-gray-300 font-mono font-bold text-gray-900 shadow-2xs">
                                      "{group.text}"
                                    </code>
                                  )}

                                  {/* Occurrence Pill Badge */}
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                      occCount > 1
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    <span>⚡</span>
                                    <span>
                                      {occCount > 1
                                        ? `Found ${occCount} times in content`
                                        : '1 occurrence'}
                                    </span>
                                  </span>
                                </div>

                                <span
                                  className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full ${
                                    group.isError
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {group.isError ? 'Action Required' : 'Warning'}
                                </span>
                              </div>

                              {/* Reason & Suggestion */}
                              <div className="space-y-2 text-xs text-gray-700 bg-white/80 p-3.5 rounded-xl border border-gray-200/80 mb-3">
                                <p className="leading-relaxed">
                                  <strong className="text-gray-900">Reason:</strong> {group.reason}
                                </p>
                                {group.suggestion && (
                                  <p className="text-emerald-900 font-medium flex items-start gap-1.5 pt-1 border-t border-gray-100">
                                    <span className="text-emerald-700 font-bold shrink-0">💡 Himani's Fix:</span>{' '}
                                    <span>{group.suggestion}</span>
                                  </p>
                                )}
                              </div>

                              {/* Occurrence Context Snippets */}
                              {group.occurrences?.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                      Context Snippets ({occCount})
                                    </span>
                                    {occCount > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => toggleHighlightExpand(group.id)}
                                        className="text-xs font-semibold text-[#0C81F3] hover:underline flex items-center gap-1"
                                      >
                                        <span>
                                          {expandedHighlights[group.id]
                                            ? 'Collapse snippets'
                                            : `View all ${occCount} occurrences`}
                                        </span>
                                        {expandedHighlights[group.id] ? (
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    {(isExpanded
                                      ? group.occurrences
                                      : group.occurrences.slice(0, 2)
                                    ).map((occ, occIdx) => (
                                      <div
                                        key={occIdx}
                                        className="text-xs p-2.5 rounded-lg bg-white/95 border border-gray-200 font-sans text-gray-800 leading-relaxed shadow-2xs flex items-start gap-2.5"
                                      >
                                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-mono mt-0.5">
                                          #{occIdx + 1}
                                        </span>
                                        <div className="flex-1">
                                          {occ.context ? (
                                            renderHighlightedSnippet(occ.context, group.text)
                                          ) : (
                                            <span className="italic text-gray-500">
                                              {occ.message || `Match found at character position ${occ.index || 0}`}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                    {!isExpanded && occCount > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => toggleHighlightExpand(group.id)}
                                        className="w-full py-1.5 text-center text-xs font-semibold text-gray-600 bg-white/60 hover:bg-white rounded-lg border border-dashed border-gray-300 transition-colors"
                                      >
                                        + {occCount - 2} more occurrence(s)... Click to expand all
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-emerald-900">
                        {inspectorFilter === 'all'
                          ? 'Zero Editorial Flags Detected!'
                          : `Zero ${inspectorFilter} flags detected!`}
                      </h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        {inspectorFilter === 'all'
                          ? 'Your content passes all em-dash, AI buzzword, and fluff filters.'
                          : `Your content is free of ${inspectorFilter} issues.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 3: READ ALOUD AUDIO STUDIO                     */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'read_aloud' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Read Aloud Audio Studio</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Listen to your content to check cadence and flow.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleSpeech}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-sm font-semibold flex items-center gap-2"
                    >
                      {isPlayingAudio ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      {isPlayingAudio ? 'Stop' : 'Play'}
                    </button>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-600">Speed:</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-xs text-gray-500">{speechRate}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════ */}
              {/* TAB 4: ONE-CLICK HIMANI POLISH                     */}
              {/* ═════════════════════════════════════════════════════ */}
              {activeTab === 'polish' && (
                <div className="space-y-6">
                  {/* Hero Card */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider mb-2">
                          <Wand2 className="w-3.5 h-3.5 text-[#EB8988]" />
                          Himani Kankaria 12-Pillar Editorial Polish
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          Flawless 100% QA Content Rewrite
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
                          Automatically applies zero em-dash rules, insight-first hooks, eliminates
                          robotic AI clichés, and crafts conversational cadence.
                        </p>
                      </div>

                      {!isPolishing && (
                        <button
                          onClick={runHimaniPolish}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{polishedResult ? 'Re-Polish Content' : 'Polish Now'}</span>
                        </button>
                      )}
                    </div>

                    {/* Score Lift if polished */}
                    {polishedResult && (() => {
                      const origScore =
                        polishedResult.himaniScoreBefore ??
                        (scores.overall > 0 ? scores.overall : 60)
                      const newScore = polishedResult.himaniScoreAfter ?? 98
                      const lift =
                        polishedResult.qualityLift ?? Math.max(0, newScore - origScore)
                      const beforeEmDashes =
                        polishedResult.statsBefore?.emDashesCount ??
                        report?.quickStats?.emDashesCount ??
                        0
                      const afterEmDashes = polishedResult.statsAfter?.emDashesCount ?? 0
                      const beforeCliches =
                        polishedResult.statsBefore?.aiPhrasesCount ??
                        report?.quickStats?.aiPhrasesCount ??
                        0
                      const afterCliches = polishedResult.statsAfter?.aiPhrasesCount ?? 0

                      return (
                        <div className="space-y-4 mt-6 pt-6 border-t border-white/10">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-white/10 rounded-2xl p-3.5 text-center">
                              <span className="text-[11px] font-semibold text-slate-300 uppercase">
                                Original Score
                              </span>
                              <p className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5">
                                {origScore}{' '}
                                <span className="text-xs text-slate-400">/ 100</span>
                              </p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3.5 text-center">
                              <span className="text-[11px] font-semibold text-slate-300 uppercase">
                                Polished Score
                              </span>
                              <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
                                {newScore}{' '}
                                <span className="text-xs text-slate-400">/ 100</span>
                              </p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-3.5 text-center flex flex-col justify-center">
                              <span className="text-[11px] font-semibold text-emerald-200 uppercase">
                                Total Quality Lift
                              </span>
                              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                                +{lift} pts
                              </p>
                            </div>
                          </div>

                          {/* Dynamic Metric Comparison Chips */}
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-300">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                              🚫 Em Dashes: <strong className="text-rose-300">{beforeEmDashes}</strong> →{' '}
                              <strong className="text-emerald-300">{afterEmDashes}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                              🤖 AI Clichés: <strong className="text-amber-300">{beforeCliches}</strong> →{' '}
                              <strong className="text-emerald-300">{afterCliches}</strong>
                            </span>
                            {polishedResult.statsAfter?.fleschScore && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                                📖 Flesch Ease:{' '}
                                <strong className="text-purple-300">
                                  {polishedResult.statsBefore?.fleschScore ??
                                    report?.quickStats?.fleschScore ??
                                    55}
                                </strong>{' '}
                                →{' '}
                                <strong className="text-emerald-300">
                                  {polishedResult.statsAfter.fleschScore}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Loading State */}
                  {isPolishing && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] flex items-center justify-center mx-auto text-white shadow-lg animate-pulse">
                        <Wand2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Polishing Content with Himani's 12 Editorial Pillars...
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Eliminating em-dashes, cutting throat-clearing fluff, replacing robotic
                          clichés, and crafting an insight-first hook.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {polishError && !isPolishing && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Polish Notice</p>
                        <p className="text-rose-700">{polishError}</p>
                      </div>
                    </div>
                  )}

                  {/* Not Polished Yet Prompt */}
                  {!polishedResult && !isPolishing && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0C81F3] flex items-center justify-center mx-auto">
                        <Wand2 className="w-7 h-7" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-base font-bold text-slate-900">
                          Ready to Polish Your Content
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Click below to execute an automated 12-pillar audit rewrite crafted to
                          match Himani Kankaria's exact editorial standards.
                        </p>
                      </div>
                      <button
                        onClick={runHimaniPolish}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] hover:opacity-95 text-white text-sm font-bold shadow-md inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Polish My Content Now</span>
                      </button>
                    </div>
                  )}

                  {/* Polished Results Display */}
                  {polishedResult && !isPolishing && (
                    <div className="space-y-6">
                      {/* Editorial Refinements & Key Metrics Strip */}
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Editorial Quality Refinements Applied</span>
                          </div>

                          {/* Metric Badges */}
                          {polishMetrics && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300">
                                ✓ {polishMetrics.emDashesRemoved} Em-Dashes Eliminated
                              </span>
                              {polishMetrics.clichesRemoved > 0 && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                                  ✓ {polishMetrics.clichesRemoved} AI Clichés Removed
                                </span>
                              )}
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                {polishMetrics.wordCountBefore} → {polishMetrics.wordCountAfter} Words
                              </span>
                            </div>
                          )}
                        </div>

                        {Array.isArray(polishedResult.improvementsMade) &&
                          polishedResult.improvementsMade.length > 0 && (
                            <ul className="grid sm:grid-cols-2 gap-2 text-xs text-emerald-950">
                              {polishedResult.improvementsMade.map((imp, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>

                      {/* Content Card with Interactive View Mode Switcher */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
                        {/* Title Header & View Switcher Bar */}
                        <div className="pb-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Polished Headline (Hook-First)
                            </span>
                            <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                              {polishedResult.polishedTitle || 'Polished Content Blueprint'}
                            </h4>
                          </div>

                          {/* View Mode Toggle */}
                          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 self-start lg:self-auto">
                            <button
                              onClick={() => setPolishViewMode('diff')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                polishViewMode === 'diff'
                                  ? 'bg-white text-[#0C81F3] shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#EB8988]" />
                              <span>Highlighted Changes</span>
                            </button>
                            <button
                              onClick={() => setPolishViewMode('clean')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                polishViewMode === 'clean'
                                  ? 'bg-white text-[#0C81F3] shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Clean Text</span>
                            </button>
                            <button
                              onClick={() => setPolishViewMode('split')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                polishViewMode === 'split'
                                  ? 'bg-white text-[#0C81F3] shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Side-by-Side</span>
                            </button>
                          </div>
                        </div>

                        {/* VIEW 1: HIGHLIGHTED CHANGES (DIFF) */}
                        {polishViewMode === 'diff' && (
                          <div className="space-y-4">
                            {/* Legend Bar & Change Counters */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>🎨 Visual Editorial Diffs:</span>
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5">
                                  <del className="bg-rose-100 text-rose-800 line-through rounded px-1.5 py-0.5 font-bold decoration-rose-600 decoration-2">
                                    red strikethrough
                                  </del>
                                  <span className="text-[11px] text-gray-500">= removed fluff / em-dashes</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <ins className="bg-emerald-100 text-emerald-950 font-bold no-underline rounded px-1.5 py-0.5 border border-emerald-400/80 shadow-xs">
                                    green highlight
                                  </ins>
                                  <span className="text-[11px] text-gray-500">= polished phrasing & hooks</span>
                                </span>
                              </div>
                            </div>

                            {/* Diff Body Container: Paragraph Cards with Section Status Indicators */}
                            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                              {polishParagraphDiff.map((block) => {
                                const isModified = block.status === 'modified'
                                const isAdded = block.status === 'added'
                                const isRemoved = block.status === 'removed'

                                return (
                                  <div
                                    key={block.id}
                                    className={`p-4 rounded-2xl border transition-all ${
                                      isAdded
                                        ? 'bg-emerald-50/50 border-emerald-200 border-l-4 border-l-emerald-500'
                                        : isRemoved
                                          ? 'bg-rose-50/50 border-rose-200 border-l-4 border-l-rose-500'
                                          : isModified
                                            ? 'bg-white border-blue-200/80 border-l-4 border-l-[#0C81F3] shadow-xs'
                                            : 'bg-slate-50/70 border-slate-200/80 border-l-4 border-l-slate-300'
                                    }`}
                                  >
                                    {/* Paragraph Header Badge */}
                                    <div className="flex items-center justify-between mb-2 text-[11px] font-bold">
                                      <span
                                        className={`${
                                          isAdded
                                            ? 'text-emerald-700'
                                            : isRemoved
                                              ? 'text-rose-700'
                                              : isModified
                                                ? 'text-[#0C81F3]'
                                                : 'text-slate-500'
                                        }`}
                                      >
                                        {isAdded
                                          ? '✨ New Insight / Section Added'
                                          : isRemoved
                                            ? '🚫 Fluff / Redundant Section Removed'
                                            : isModified
                                              ? '⚡ Polished & Streamlined Line'
                                              : '✓ Unchanged Paragraph'}
                                      </span>
                                    </div>

                                    {/* Text Content with Word-Level Diffs */}
                                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                                      {block.words.map((chunk, idx) => {
                                        if (chunk.type === 'removed') {
                                          return (
                                            <del
                                              key={idx}
                                              className="bg-rose-100 text-rose-900 line-through rounded px-1.5 py-0.5 mx-0.5 font-medium inline decoration-rose-600 decoration-2"
                                              title="Removed during polish"
                                            >
                                              {chunk.value}
                                            </del>
                                          )
                                        }
                                        if (chunk.type === 'added') {
                                          return (
                                            <ins
                                              key={idx}
                                              className="bg-emerald-100 text-emerald-950 font-bold no-underline rounded px-1.5 py-0.5 mx-0.5 inline border border-emerald-300 shadow-xs"
                                              title="Added / refined during polish"
                                            >
                                              {chunk.value}
                                            </ins>
                                          )
                                        }
                                        return <span key={idx}>{chunk.value}</span>
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* VIEW 2: CLEAN POLISHED PROSE */}
                        {polishViewMode === 'clean' && (
                          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans border border-slate-200/80 max-h-[520px] overflow-y-auto">
                            {typeof polishedResult === 'string'
                              ? polishedResult
                              : polishedResult.polishedContent || ''}
                          </div>
                        )}

                        {/* VIEW 3: SIDE-BY-SIDE SPLIT WITH HIGHLIGHTS */}
                        {polishViewMode === 'split' && (
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Original with Removed Highlights */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase px-1">
                                <span>Original Draft</span>
                                <span className="text-slate-400 font-normal">{content.length} chars</span>
                              </div>
                              <div className="bg-rose-50/20 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans border border-rose-200/60 max-h-[500px] overflow-y-auto">
                                {polishDiff.map((chunk, idx) => {
                                  if (chunk.type === 'removed') {
                                    return (
                                      <del
                                        key={idx}
                                        className="bg-rose-100 text-rose-900 line-through rounded px-1 py-0.5 mx-0.5 font-medium inline decoration-rose-600 decoration-2"
                                      >
                                        {chunk.value}
                                      </del>
                                    )
                                  }
                                  if (chunk.type === 'unchanged') {
                                    return <span key={idx}>{chunk.value}</span>
                                  }
                                  return null
                                })}
                              </div>
                            </div>

                            {/* Polished with Added Highlights */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase px-1">
                                <span>Polished 100% QA Rewrite</span>
                                <span className="text-emerald-600 font-normal">
                                  {typeof polishedResult === 'string'
                                    ? polishedResult.length
                                    : (polishedResult.polishedContent || '').length}{' '}
                                  chars
                                </span>
                              </div>
                              <div className="bg-emerald-50/30 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-sans border border-emerald-200 max-h-[500px] overflow-y-auto">
                                {polishDiff.map((chunk, idx) => {
                                  if (chunk.type === 'added') {
                                    return (
                                      <ins
                                        key={idx}
                                        className="bg-emerald-100 text-emerald-950 font-bold no-underline rounded px-1.5 py-0.5 mx-0.5 inline border border-emerald-300"
                                      >
                                        {chunk.value}
                                      </ins>
                                    )
                                  }
                                  if (chunk.type === 'unchanged') {
                                    return <span key={idx}>{chunk.value}</span>
                                  }
                                  return null
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Bar with Google Docs Export & Downloads */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Export to Google Docs */}
                            <button
                              onClick={handleExportToGoogleDocs}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#0A6ECF] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                              title="Opens docs.new in Google Docs and copies formatted text to clipboard"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Export to Google Docs</span>
                            </button>

                            {/* Copy Polished Content */}
                            <button
                              onClick={() => {
                                const text =
                                  typeof polishedResult === 'string'
                                    ? polishedResult
                                    : polishedResult.polishedContent || ''
                                navigator.clipboard.writeText(text)
                                setCopiedPolish(true)
                                setTimeout(() => setCopiedPolish(false), 2000)
                              }}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedPolish ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {copiedPolish ? 'Copied to Clipboard!' : 'Copy Polished Content'}
                              </span>
                            </button>

                            {/* Apply to Content Editor */}
                            <button
                              onClick={() => {
                                const text =
                                  typeof polishedResult === 'string'
                                    ? polishedResult
                                    : polishedResult.polishedContent || ''
                                setValue('content', text)
                                if (polishedResult.polishedTitle)
                                  setValue('title', polishedResult.polishedTitle)
                                setActiveTab('grid')
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0C81F3] border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Apply to Editor</span>
                            </button>
                          </div>

                          {/* Download Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Download .doc (Word / Google Docs compatible) */}
                            <button
                              onClick={handleDownloadDocx}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              title="Download Microsoft Word / Google Docs compatible .doc file"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span>Download .doc</span>
                            </button>

                            {/* Download Markdown */}
                            <button
                              onClick={() => {
                                const text =
                                  typeof polishedResult === 'string'
                                    ? polishedResult
                                    : polishedResult.polishedContent || ''
                                const blob = new Blob([text], { type: 'text/markdown' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `himani-polished-${(title || 'content').toLowerCase().replace(/\s+/g, '-')}.md`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download .md</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Google Docs Export Notification Modal */}
                  {showDocsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0C81F3] flex items-center justify-center mx-auto shadow-sm">
                          <ExternalLink className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-lg font-black text-slate-900">
                            New Google Doc Opened!
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Your polished content with headings, bullet points, and editorial formatting has been copied to your clipboard.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-950 text-left space-y-2">
                          <p className="font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#0C81F3]" />
                            <span>Quick Paste Instructions:</span>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-slate-700">
                            <li>Switch to the newly opened Google Docs tab.</li>
                            <li>Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px] font-bold">Ctrl + V</kbd> (or <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px] font-bold">Cmd + V</kbd> on Mac).</li>
                            <li>Your content will paste with full formatting intact.</li>
                          </ol>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => setShowDocsModal(false)}
                            className="px-6 py-2.5 rounded-full bg-[#0C81F3] hover:bg-[#0A6ECF] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                          >
                            Got It, Thanks!
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lead Form */}
              <DynamicLeadForm
                toolSlug="content-qa"
                relatedIdField="qaId"
                relatedIdValue={qaId}
                title="Get Your Free Content Strategy"
                subtitle="Our experts will review your QA report and share a personalized content improvement plan."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
