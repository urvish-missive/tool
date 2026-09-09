import { useEffect, useRef, useCallback } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  Target,
  TrendingUp,
  Compass,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  BookOpen,
  PenTool,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Wand2,
} from 'lucide-react'
import {
  LandingHero,
  LandingMarquee,
  LandingPillCloud,
  LandingDarkImpact,
  LandingFeatures,
  LandingHowItWorks,
  LandingBeforeAfter,
  LandingStats,
  LandingFAQ,
  LandingCTA,
  LandingMissiveQA,
  LandingBannedWordsWall,
} from '../components/landing'
import ContentQaPage from '../tools/content-qa/ContentQaPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Content QA Checklist by Missive Digital',
  description:
    'Free AI-powered content QA tool by Missive Digital. Audit blog posts, newsletters, and landing pages against Himani Kankaria\u2019s 12-Pillar Content QA Framework: zero em dashes, zero robotic buzzwords, and quantifiable E-E-A-T proof. Free SEO quality checker.',
  url: 'https://tools.missivedigital.com/content-qa',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  author: {
    '@type': 'Organization',
    name: 'Missive Digital',
    url: 'https://missivedigital.com',
  },
  provider: {
    '@type': 'Organization',
    name: 'Missive Digital',
    url: 'https://missivedigital.com',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '260',
  },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a content QA checklist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A content QA checklist is a structured set of quality checks applied to writing before it is published. It audits tone, readability, audience fit, E-E-A-T proof, structure, and visual scannability. This free tool runs every piece of copy against Himani Kankaria\u2019s 12-Pillar Content QA Framework to catch weak writing before it goes live.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the Content QA tool detect robotic AI content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The tool programmatically scans for banned AI clichés such as delve, tapestry, beacon, game changer, and plethora, and enforces a strict zero em dash rule. It also flags throat-clearing preamble, fluff, and overly dense paragraphs so your writing sounds human and credible.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the 12 pillars of the Missive QA framework?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The 12 pillars are: Tone, Style and AI Check; Read Aloud Test; Audience Alignment; E-E-A-T and Practical Proof; Insight First; Meaning and Crispness; Zero Offensiveness; Relevance to Brand Positioning; Structure and Narrative Flow; No Direct Sales Pitches; Compliance and Risk Check; and Visual and Platform Fit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I import content from Google Docs, a URL, or a file?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can paste or write content directly, import from a Google Doc link, pull a page from any URL, or upload a supported file. The tool normalizes everything into one clean audit so you can QA across blog posts, newsletters, landing pages, and LinkedIn drafts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the Content QA tool provide one-click polish?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. After the audit, you can run one-click polish. The AI rewrites flagged sections to meet every pillar: it removes em dashes and buzzwords, adds quantitative proof, tightens paragraphs, and shows you a side-by-side before and after diff so you see exactly what changed.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Content QA tool free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Content QA Checklist by Missive Digital is 100% free with no sign-up required. Run unlimited audits, export full PDF reports, and polish content with one click.',
      },
    },
  ],
}

/* ─────────────── Feature Data ─────────────── */
const FEATURES = [
  {
    icon: ClipboardCheck,
    title: '12-Pillar Missive QA Audit',
    description:
      'Every piece of copy is scored across Himani Kankaria\u2019s full 12-Pillar framework: tone, audience, E-E-A-T proof, insight-first structure, scannability, and more.',
  },
  {
    icon: AlertTriangle,
    title: 'Catches Robotic AI Fluff',
    description:
      'Automatically detects banned clichés like delve, tapestry, and game changer, plus strict zero em dashes, so your writing reads human and credible.',
  },
  {
    icon: Wand2,
    title: 'One-Click Polish',
    description:
      'With a single click the AI rewrites weak sections, adds quantitative proof, and tidies structure. Review the exact changes in a clean side-by-side diff.',
  },
  {
    icon: FileText,
    title: 'Multi-Format Import',
    description:
      'Paste text, import from a Google Doc link, pull a live URL, or upload a file. QA blog posts, newsletters, landing pages, and LinkedIn drafts in one place.',
  },
  {
    icon: BookOpen,
    title: 'Google E-E-A-T Focused',
    description:
      'Every check maps directly to Google\u2019s quality rater guidelines: experience, expertise, authoritativeness, and trustworthiness.',
  },
  {
    icon: Zap,
    title: 'Instant Score & PDF Export',
    description:
      'Get a fast overall score, clear pass and fail checks, and export a polished PDF report to share with your team before publishing.',
  },
]

const STEPS = [
  {
    icon: PenTool,
    title: 'Add Your Content',
    description: 'Paste text, import from Google Docs, pull a URL, or upload a file to audit.',
  },
  {
    icon: Compass,
    title: 'Set the Context',
    description:
      'Add your title, target keyword, platform, and audience so checks fit your intent.',
  },
  {
    icon: Sparkles,
    title: 'Run the 12-Pillar Audit',
    description: 'Get a scored report against every pillar with clear pass and fail flags.',
  },
  {
    icon: CheckCircle2,
    title: 'Polish, Export & Publish',
    description:
      'Fix weak copy with one-click polish, review the diff, and export a PDF you can act on.',
  },
]

const BEFORE_AFTER = {
  before: {
    title: 'Without This Tool',
    items: [
      'Publishing robotic copy riddled with AI clichés like delve and tapestry',
      'Em dashes and fluff that make readers bounce and signal low quality',
      'No insight-first opening: generic throat-clearing that wastes the first 50 words',
      'Vague claims with zero quantifiable E-E-A-T proof or concrete metrics',
      'Dense paragraphs that fail Google\u2019s scannability and readability standards',
    ],
  },
  after: {
    title: 'With This Tool',
    items: [
      'Clean, human copy that passes every Missive QA check before it goes live',
      'Strictly zero em dashes and zero robotic buzzwords, every single time',
      'Insight-first hooks that open with the core finding, not preamble',
      'At least 3 concrete metrics backing every claim for credible E-E-A-T signal',
      'Tight, scannable 1 to 3 sentence paragraphs that hold your reader',
    ],
  },
}

const STATS = [
  { value: '34', label: 'Precision checks in every audit' },
  { value: '12', label: 'Missive QA pillars enforced' },
  { value: '0', label: 'Em dashes or robotic clichés allowed' },
  { value: '<60s', label: 'Average full content audit' },
]

const FAQS = [
  {
    question: 'What is a content QA checklist?',
    answer:
      'A content QA checklist is a structured set of quality checks applied to writing before it is published. It audits tone, readability, audience fit, E-E-A-T proof, structure, and visual scannability. This free tool runs every piece of copy against Himani Kankaria\u2019s 12-Pillar Content QA Framework to catch weak writing before it goes live.',
  },
  {
    question: 'How does the tool detect robotic AI content?',
    answer:
      'The tool programmatically scans for banned AI clichés such as delve, tapestry, beacon, game changer, and plethora, and enforces a strict zero em dash rule. It also flags throat-clearing preamble, fluff, and overly dense paragraphs so your writing sounds human and credible.',
  },
  {
    question: 'What are the 12 pillars of the Missive QA framework?',
    answer:
      'The 12 pillars are: Tone, Style and AI Check; Read Aloud Test; Audience Alignment; E-E-A-T and Practical Proof; Insight First; Meaning and Crispness; Zero Offensiveness; Relevance to Brand Positioning; Structure and Narrative Flow; No Direct Sales Pitches; Compliance and Risk Check; and Visual and Platform Fit.',
  },
  {
    question: 'Can I import content from Google Docs, a URL, or a file?',
    answer:
      'Yes. You can paste or write content directly, import from a Google Doc link, pull a page from any URL, or upload a supported file. The tool normalizes everything into one clean audit so you can QA across blog posts, newsletters, landing pages, and LinkedIn drafts.',
  },
  {
    question: 'Does the tool provide one-click polish?',
    answer:
      'Yes. After the audit, you can run one-click polish. The AI rewrites flagged sections to meet every pillar: it removes em dashes and buzzwords, adds quantitative proof, tightens paragraphs, and shows you a side-by-side before and after diff so you see exactly what changed.',
  },
  {
    question: 'Is the Content QA tool free to use?',
    answer:
      'Yes. The Content QA Checklist by Missive Digital is 100% free with no sign-up required. Run unlimited audits, export full PDF reports, and polish content with one click.',
  },
]

/* ─────────────── QA Pills for LandingPillCloud ─────────────── */
const QA_PILLS = [
  {
    text: 'Zero Em Dashes',
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    icon: '✍️',
  },
  {
    text: 'Zero Robotic Buzzwords',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    icon: '🚫',
  },
  {
    text: 'Insight First Hooks',
    color: 'bg-sky-50 text-[#0C81F3] border-sky-200 hover:bg-sky-100',
    icon: '💡',
  },
  {
    text: 'Quantifiable E-E-A-T Proof',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    icon: '📈',
  },
  {
    text: 'Audience Alignment',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: '🎯',
  },
  {
    text: 'Read Aloud Test',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '🎙️',
  },
  {
    text: 'Crisp Scannable Paragraphs',
    color: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100',
    icon: '📋',
  },
  {
    text: 'No Sales Pitches',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    icon: '🛡️',
  },
  {
    text: 'Structure & Narrative Flow',
    color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    icon: '🧭',
  },
  {
    text: 'Compliance & Risk Check',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    icon: '⚖️',
  },
  {
    text: 'One-Click Polish',
    color: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: '✨',
  },
  {
    text: 'Google E-E-A-T Aligned',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: '✓',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })
  const items = [
    { icon: Users, value: '2,000+', label: 'Active content strategists monthly' },
    { icon: BarChart3, value: '45,000+', label: 'Copies audited and published' },
    { icon: Clock, value: '<60s', label: 'Average full audit time' },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2 sm:mb-2.5">
            Built by SEO Strategists
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
            Trusted by Content Teams Who Refuse to Publish Weak Copy
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            Built on Himani Kankaria&apos;s 12-Pillar Content QA Framework, refined over 10+ years
            of optimizing enterprise copy for Google&apos;s quality guidelines and reader
            conversion.
          </p>
        </div>

        <div
          ref={gridRef}
          className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5"
        >
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="lp-reveal-child text-center p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-[#0C81F3]/40 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0C81F3] to-[#EB8988] flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#0C81F3]/15">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl xs:text-3xl sm:text-4xl font-black text-slate-900 leading-none mt-1">
                  {item.value}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── E-E-A-T Authority Banner ─────────────── */
function AuthorityBanner() {
  const ref = useScrollReveal()
  return (
    <section className="py-10 sm:py-12 bg-slate-50 border-y border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="lp-reveal flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-center md:text-left"
        >
          {[
            {
              icon: CheckCircle2,
              title: 'Curated by Himani Kankaria',
              text: 'SEO Strategist with 10+ years optimizing B2B and SaaS content for Google search intent and conversions.',
            },
            {
              icon: CheckCircle2,
              title: 'Missive 12-Pillar QA Certified',
              text: 'Zero em dashes, zero robotic buzzwords, and verifiable quantitative performance proof metrics.',
            },
            {
              icon: CheckCircle2,
              title: 'E-E-A-T Quality Safeguards',
              text: 'Ensures every draft delivers topical closure, author authority, and defensible action steps.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 max-w-sm"
            >
              <span className="text-emerald-500 mt-0.5 shrink-0">
                <item.icon className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">{item.title}</span>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Tool Section ─────────────── */
function ToolSection({ toolRef }) {
  const headerRef = useScrollReveal()

  return (
    <section
      ref={toolRef}
      id="tool"
      className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-y border-slate-200/70 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[10px] sm:text-xs font-bold rounded-full mb-3 tracking-wider uppercase shadow-md shadow-[#0C81F3]/20">
            <Zap className="w-3.5 h-3.5" />
            Try It Now: 100% Free
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 sm:mb-2.5 leading-tight">
            <span>Content </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              QA Checklist
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Audit any piece of copy against all 12 pillars, catch robotic AI fluff, and fix weak
            writing with one-click polish: all before it goes live.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mt-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0C81F3] border border-blue-200/60 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3 h-3 text-[#0C81F3]" /> 34 Precision Checks
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap shrink-0">
              <Sparkles className="w-3 h-3 text-purple-600" /> One-Click Polish
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap shrink-0">
              <Target className="w-3 h-3 text-emerald-600" /> Zero Em Dashes
            </span>
          </div>
        </div>

        <div className="tool-embed">
          <ContentQaPage isEmbedded={true} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function ContentQaLandingPage() {
  const toolRef = useRef(null)

  const scrollToTool = useCallback(() => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (window.location.hash === '#tool') {
      setTimeout(scrollToTool, 300)
    }
  }, [scrollToTool])

  return (
    <>
      {/* ── SEO Meta Tags (Zero Em Dashes) ── */}
      <Helmet>
        <title>Content QA Checklist: Free AI Tool | Missive Digital</title>
        <meta
          name="description"
          content="Audit blog posts, newsletters, and landing pages against Himani Kankaria's 12-Pillar Content QA Framework. Catch robotic AI fluff, fix weak copy with one-click polish, and publish rank-ready content. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="content QA checklist, content quality checker, AI content detector, content audit tool, em dash checker, robotic AI writing, content polishing tool, SEO content quality, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/content-qa" />
        <meta property="og:title" content="Content QA Checklist: Free AI Tool | Missive Digital" />
        <meta
          property="og:description"
          content="Audit any copy against the 12-Pillar Missive QA Framework, catch robotic AI fluff, and fix weak writing with one-click polish. Free, no sign-up required."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/content-qa" />
        <meta property="og:site_name" content="Missive Digital: Himani's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Content QA Checklist: Missive Digital" />
        <meta
          name="twitter:description"
          content="Audit any copy against the 12-Pillar Missive QA Framework, catch robotic AI fluff, and fix weak writing with one-click polish. Free, no sign-up required."
        />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className="landing-page min-h-screen bg-white">
        {/* ═══════════════ 1. HERO ═══════════════ */}
        <LandingHero
          badge="Himani's SEO Tools • Missive Digital"
          title={[
            { text: 'QA Every Piece of Content ' },
            { text: 'Like Himani Does', gradient: true },
            { text: ': Before It Goes Live' },
          ]}
          subtitle="Catch robotic AI fluff, banished em dashes, and weak openings before they cost you rankings. Audit blog posts, newsletters, and landing pages against Himani Kankaria's 12-Pillar Content QA Framework, then fix them with one-click polish."
          ctaLabel="Audit Your Content Free →"
          ctaOnClick={scrollToTool}
          secondaryCta={{ label: 'See the 12 Pillars', onClick: scrollToTool }}
          trustBadges={[
            'No sign-up required',
            '100% free forever',
            'Missive 12-Pillar QA Certified',
            'One-click polish included',
          ]}
          floatingCards={{
            topLeft: {
              icon: ClipboardCheck,
              tag: '12-Pillar Audit',
              title: '34 Precision QA Checks',
              stat: '100% Missive Compliance',
              tagColor: 'text-[#0C81F3]',
              gradient: 'from-[#0C81F3] to-[#67A7FF]',
            },
            topRight: {
              icon: TrendingUp,
              tag: 'Content Quality Signal',
              title: '+68% E-E-A-T Ranking Strength',
              sub: 'Zero robotic AI fluff',
              tagColor: 'text-emerald-600',
              gradient: 'from-emerald-500 to-teal-600',
            },
            bottomLeft: {
              tag: 'Zero Em Dashes',
              sub: 'Strictly enforced',
              icon: '✓',
            },
            bottomRight: {
              tag: 'One-Click Polish',
              sub: 'Fix & diff in seconds',
              icon: '⚡',
            },
          }}
        />

        {/* ═══════════════ 2. INFINITE CMS & PUBLISHING MARQUEE ═══════════════ */}
        <LandingMarquee />

        {/* ═══════════════ 3. STATS ROW ═══════════════ */}
        <LandingStats stats={STATS} />

        {/* ═══════════════ 4. 12-PILLAR MISSIVE QA AUDIT MATRIX ═══════════════ */}
        <LandingMissiveQA />

        {/* ═══════════════ 5. FEATURES GRID ═══════════════ */}
        <LandingFeatures
          sectionLabel="Why This Tool?"
          heading="Publish Copy That Passes Every Quality Check"
          subheading="Weak, robotic content quietly kills rankings and conversions. This tool runs every draft against a strict quality framework and gives you the exact fixes: even a full rewrite with one click."
          features={FEATURES}
          columns={3}
        />

        {/* ═══════════════ 6. BANNED WORDS WALL VS MISSIVE STANDARDS ═══════════════ */}
        <LandingBannedWordsWall />

        {/* ═══════════════ 7. SIGNATURE FLOATING PILL CLOUD ═══════════════ */}
        <LandingPillCloud
          pills={QA_PILLS}
          badge="Quality Guardrails"
          heading="Every Content QA Check At Your Fingertips"
          subheading="We turned Himani Kankaria's editorial checklist into a repeatable, automated audit so no weak sentence, cliché, or em dash slips through."
          note="Hover over any guardrail to see the standard behind every AI audit."
        />

        {/* ═══════════════ 8. HOW IT WORKS (STEP CARDS) ═══════════════ */}
        <LandingHowItWorks
          sectionLabel="How It Works"
          heading="From Rough Draft to Rank-Ready Copy in 4 Steps"
          subheading="No complex prompts needed. Add your content, set the context, run the audit, and let one-click polish handle the rest."
          steps={STEPS}
        />

        {/* ═══════════════ 9. SIGNATURE DARK IMPACT SECTION ═══════════════ */}
        <LandingDarkImpact
          watermark="QUALITY"
          badge="The Quality Imperative"
          title={
            <>
              Robotic Copy Kills Trust.{' '}
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                QA It Before Google Does
              </span>
            </>
          }
          subtitle="Readers and Google can both smell generic, robotic content in seconds. A 4% bounce difference compounds into outsized traffic and conversion loss over time. A proper content QA pass catches those issues before they ever go live."
          stats={[
            {
              value: '4%',
              label: 'Bounce Rate Uplift',
              sub: 'From removing em dashes, fluff, and weak openings',
              gradient: 'from-[#0C81F3] to-[#67A7FF]',
            },
            {
              value: '0',
              label: 'Banned Robotic Buzzwords',
              sub: 'Strictly zero em dashes and zero AI clichés',
              gradient: 'from-[#67A7FF] to-[#EB8988]',
            },
            {
              value: '34',
              label: 'Precision Quality Checks',
              sub: 'Every pillar scored, flagged, and explained',
              gradient: 'from-[#EB8988] to-[#FFB7B2]',
            },
            {
              value: '<60s',
              label: 'Full Content Audit',
              sub: 'Then one-click polish for instant fixes',
              gradient: 'from-[#0C81F3] to-[#EB8988]',
            },
          ]}
          quote="Good writing is not about sounding clever. It is about being clear, credible, and worth the reader time. QA is how you guarantee it."
          author="Himani Kankaria, Founder of Missive Digital"
          ctaLabel="Audit Your Content Now"
          onCtaClick={scrollToTool}
        />

        {/* ═══════════════ 10. E-E-A-T AUTHORITY BANNER ═══════════════ */}
        <AuthorityBanner />

        {/* ═══════════════ 11. BEFORE / AFTER COMPARISON ═══════════════ */}
        <LandingBeforeAfter
          sectionLabel="Results"
          heading="The Difference a Real QA Pass Makes"
          subheading="Every pillar in the framework exists to catch a specific failure that hurts rankings or conversions. Here is what changes when content actually passes."
          before={BEFORE_AFTER.before}
          after={BEFORE_AFTER.after}
        />

        {/* ═══════════════ 12. TRUST / E-E-A-T SECTION ═══════════════ */}
        <TrustSection />

        {/* ═══════════════ 13. EMBEDDED TOOL SECTION ═══════════════ */}
        <ToolSection toolRef={toolRef} />

        {/* ═══════════════ 14. FAQ ACCORDION ═══════════════ */}
        <LandingFAQ
          sectionLabel="Frequently Asked Questions"
          heading="Everything You Need to Know"
          subheading="Got questions about our content QA tool? We have answered the most common ones below."
          faqs={FAQS}
        />

        {/* ═══════════════ 15. FINAL RADIANT CTA ═══════════════ */}
        <LandingCTA
          heading="Stop Publishing Content That Fails QA"
          subheading="Join 2,000+ content strategists who run every draft through Himani's 12-Pillar framework before it goes live. 100% free, no sign-up required."
          ctaLabel="Audit My Content Free"
          ctaOnClick={scrollToTool}
        />
      </div>
    </>
  )
}
