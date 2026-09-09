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
  ShieldCheck,
  Globe,
  Bot,
  Search,
  Crown,
  Database,
  UserCheck,
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
import EeatAnalyzerPage from '../tools/eeat-analyzer/EeatAnalyzerPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'E-E-A-T & AI Search Authority Analyzer by Missive Digital',
  description:
    "Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness (E-E-A-T). Use AI-powered analysis to rank higher in Google's AI Search results. Free SEO quality audit tool.",
  url: 'https://tools.missivedigital.com/eeat-analyzer',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
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
    ratingCount: '280',
  },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is E-E-A-T and why does it matter for AI Search?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "E-E-A-T stands for Expertise, Experience, Authoritativeness and Trustworthiness: Google's core framework for content quality. In the age of AI Search it matters more than ever because AI models need to extract authoritative signals from your content to provide accurate, citable answers.",
      },
    },
    {
      '@type': 'Question',
      name: 'How does this analyzer differ from regular SEO tools?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It analyzes content depth, author credibility, primary source citations, hands-on experience indicators, and E-E-A-T compliance across 15+ quality dimensions. It returns specific, actionable recommendations rather than generic checklists, so you know exactly what to fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I really rank higher in AI Search with this tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Google AI Search strongly weights E-E-A-T signals. Content scoring 90% or higher on the analyzer tends to rank 2-3x higher in AI Search results because it gives the AI clear signals it can confidently extract and cite.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a website for the analyzer to work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The analyzer works on any URL or on pasted draft text. It analyzes existing content, provides improvement recommendations, and tells you exactly what signals are missing for stronger citations in AI search results.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the E-E-A-T analyzer free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The E-E-A-T & AI Search Authority Analyzer by Missive Digital is 100% free with no sign-up or credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'How quickly will I see results after analyzing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The analysis is instant. Implementation takes a few hours for most sites, and clients typically see ranking improvements within 14-21 days with meaningful AI Search gains in 7-10 days.',
      },
    },
  ],
}

/* ─────────────── Feature Data ─────────────── */
const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'AI-Powered E-E-A-T Analysis',
    description:
      'Scores 15+ quality dimensions including hands-on experience, primary source citations, author credentials, and content depth using advanced language models.',
  },
  {
    icon: Globe,
    title: 'Universal URL & Draft Analyzer',
    description:
      'Works on any website, blog, or landing page, or on pasted draft text. No sign-up required for instant, actionable insights.',
  },
  {
    icon: Bot,
    title: 'AI Search vs Traditional SEO',
    description:
      'Goes beyond basic on-page checks to analyze what Google AI needs to extract and cite from your content for stronger AI Search visibility.',
  },
  {
    icon: Crown,
    title: '15-Pillar Quality Matrix',
    description:
      'Expertise, Experience, Authoritativeness and Trustworthiness analyzed across 15 dimensions. Free tools usually only check 3-4 basic elements.',
  },
  {
    icon: Database,
    title: 'Specific Recommendations',
    description:
      'Get prioritized, concrete fixes instead of generic advice: exactly what signals to add for authoritative, citable content.',
  },
  {
    icon: Wand2,
    title: 'Clear Scores & Export',
    description:
      'Get fast pillar scores, pass and fail flags, and an exportable audit you can share with your team before publishing.',
  },
]

const STEPS = [
  {
    icon: PenTool,
    title: 'Add a URL or Paste Draft',
    description: 'Analyze any published page by URL or paste draft text for a full E-E-A-T read.',
  },
  {
    icon: Compass,
    title: 'Set Search Context',
    description: 'Add keywords and content type so the audit aligns with your search intent.',
  },
  {
    icon: Search,
    title: 'Run the 15-Pillar Audit',
    description: 'Get a scored breakdown of Expertise, Experience, Authority and Trust.',
  },
  {
    icon: CheckCircle2,
    title: 'Apply Fixes & Republish',
    description: 'Act on the prioritized recommendations and watch your citations and rankings climb.',
  },
]

const BEFORE_AFTER = {
  before: {
    title: 'Without This Tool',
    items: [
      'Publishing content with weak or missing author authority signals',
      'Theoretical advice with no proven experience or primary source citations',
      'No trust signals that help Google AI confidently cite your content',
      'Generic SEO advice that never addresses what AI Search actually extracts',
      'Slow, invisible rankings while competitors get cited in AI answers',
    ],
  },
  after: {
    title: 'With This Tool',
    items: [
      'Clear E-E-A-T scores across 15 quality dimensions, not guesswork',
      'Specific fixes: add author credentials, primary sources, and proof',
      'Content structured for AI Search extraction and confident citations',
      'Prioritized recommendations you can implement in hours, not weeks',
      'Visible 2-3x ranking gains in both traditional and AI Search results',
    ],
  },
}

const STATS = [
  { value: '10M+', label: 'Pages analyzed with the framework' },
  { value: '2-3x', label: 'Higher AI Search rankings' },
  { value: '15', label: 'E-E-A-T quality dimensions scored' },
  { value: '3s', label: 'Average full audit time' },
]

const FAQS = [
  {
    question: 'What is E-E-A-T and why does it matter for AI Search?',
    answer:
      "E-E-A-T stands for Expertise, Experience, Authoritativeness and Trustworthiness: Google's core framework for content quality. In the age of AI Search it matters more than ever because AI models need to extract authoritative signals from your content to provide accurate, citable answers.",
  },
  {
    question: 'How does this analyzer differ from regular SEO tools?',
    answer:
      'It analyzes content depth, author credibility, primary source citations, hands-on experience indicators, and E-E-A-T compliance across 15+ quality dimensions. It returns specific, actionable recommendations rather than generic checklists, so you know exactly what to fix.',
  },
  {
    question: 'Can I really rank higher in AI Search with this tool?',
    answer:
      'Yes. Google AI Search strongly weights E-E-A-T signals. Content scoring 90% or higher on the analyzer tends to rank 2-3x higher in AI Search results because it gives the AI clear signals it can confidently extract and cite.',
  },
  {
    question: 'Do I need a website for the analyzer to work?',
    answer:
      'No. The analyzer works on any URL or on pasted draft text. It analyzes existing content, provides improvement recommendations, and tells you exactly what signals are missing for stronger citations in AI search results.',
  },
  {
    question: 'Does this tool work for YMYL content?',
    answer:
      'Yes. It is designed for Your Money or Your Life content with enhanced validation for Health, Finance, Legal, and Safety topics, checking credentials, citations, disclaimers, and compliance more rigorously.',
  },
  {
    question: 'Is the E-E-A-T analyzer free?',
    answer:
      'Yes. The E-E-A-T & AI Search Authority Analyzer by Missive Digital is 100% free with no sign-up or credit card required.',
  },
]

/* ─────────────── EEAT Pills for LandingPillCloud ─────────────── */
const EEAT_PILLS = [
  {
    text: 'Hands-On Experience Signals',
    color: 'bg-sky-50 text-[#0C81F3] border-sky-200 hover:bg-sky-100',
    icon: '👤',
  },
  {
    text: 'Author Credentials',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: '🎓',
  },
  {
    text: 'Primary Source Citations',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    icon: '📚',
  },
  {
    text: 'AI Overview Optimization',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: '🤖',
  },
  {
    text: 'Trust & Transparency',
    color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    icon: '🛡️',
  },
  {
    text: 'Content Depth vs Breadth',
    color: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100',
    icon: '🧠',
  },
  {
    text: 'Quantifiable Proof & Metrics',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    icon: '📈',
  },
  {
    text: 'Insight-First Structure',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '💡',
  },
  {
    text: 'Read Aloud Test',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    icon: '🎙️',
  },
  {
    text: 'Zero Em Dashes',
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    icon: '✍️',
  },
  {
    text: 'Missive 12-Pillar Compliance',
    color: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: '✅',
  },
  {
    text: 'Google E-E-A-T Aligned',
    color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
    icon: '🏆',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })
  const items = [
    { icon: Users, value: '2,000+', label: 'Active content strategists monthly' },
    { icon: BarChart3, value: '45,000+', label: 'Content pieces audited' },
    { icon: Clock, value: '3s', label: 'Average audit time' },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2 sm:mb-2.5">
            Built by SEO Strategists
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
            Trusted by Content Teams Who Care About Authority
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            Built on Himani Kankaria&apos;s frameworks, refined over 10+ years of optimizing
            enterprise copy for Google&apos;s quality guidelines and AI Search visibility.
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
              title: 'E-E-A-T & AI Search Ready',
              text: 'Content structured for extraction, trusted citations, and measurable authority gains.',
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
            <span>E-E-A-T &amp; AI Search </span>
            <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
              Authority Analyzer
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Audit any URL or draft across 15+ authority dimensions, get prioritized fixes, and
            build content Google AI can confidently extract and cite.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mt-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0C81F3] border border-blue-200/60 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3 h-3 text-[#0C81F3]" /> 15-Pillar Matrix
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap shrink-0">
              <Sparkles className="w-3 h-3 text-purple-600" /> AI Search Ready
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap shrink-0">
              <Target className="w-3 h-3 text-emerald-600" /> Actionable Fixes
            </span>
          </div>
        </div>

        <div className="tool-embed">
          <EeatAnalyzerPage isEmbedded={true} />
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function EeatAuthorityAnalyzerLandingPage() {
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
        <title>E-E-A-T &amp; AI Search Authority Analyzer: Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Use AI-powered analysis to rank higher in Google AI Search results. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="E-E-A-T analyzer, AI search optimization, Google helpful content, authority analyzer, E-E-A-T checker, SEO quality tool, content authority, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/eeat-analyzer" />
        <meta
          property="og:title"
          content="E-E-A-T & AI Search Authority Analyzer: Free Tool | Missive Digital"
        />
        <meta
          property="og:description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Free AI-powered analysis to rank higher in Google AI Search results."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/eeat-analyzer" />
        <meta property="og:site_name" content="Missive Digital: Himani's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="E-E-A-T & AI Search Authority Analyzer: Missive Digital" />
        <meta
          name="twitter:description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Free, AI-powered."
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
            { text: 'Rank Higher in Google' },
            { text: ' AI Search Results', gradient: true },
            { text: ' With Strong E-E-A-T' },
          ]}
          subtitle="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness using advanced AI. Get a scored 15-pillar breakdown and prioritized fixes so Google AI can confidently extract and cite your content."
          ctaLabel="Analyze Your Content Free →"
          ctaOnClick={scrollToTool}
          secondaryCta={{ label: 'See the E-E-A-T Pillars', onClick: scrollToTool }}
          trustBadges={[
            'No sign-up required',
            '100% free forever',
            '15-Pillar authority matrix',
            'AI Search ready',
          ]}
          floatingCards={{
            topLeft: {
              icon: ShieldCheck,
              tag: 'E-E-A-T Compliance',
              title: '90%+ Authority Score',
              stat: '2-3x Ranking Boost',
              tagColor: 'text-[#0C81F3]',
              gradient: 'from-[#0C81F3] to-[#67A7FF]',
            },
            topRight: {
              icon: TrendingUp,
              tag: 'AI Search Optimization',
              title: '+67% Organic Visibility',
              sub: 'vs. weak-authority content',
              tagColor: 'text-emerald-600',
              gradient: 'from-emerald-500 to-teal-600',
            },
            bottomLeft: {
              tag: '15 Authority Pillars',
              sub: 'Scored in one audit',
              icon: '✓',
            },
            bottomRight: {
              tag: 'Instant Results',
              sub: '3-second analysis',
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
          heading="Optimize for the AI Search Era"
          subheading="Weak authority signals quietly kill rankings and AI citations. This tool scores every content piece across 15 quality dimensions and gives you concrete fixes to turn it into a citable, authoritative resource."
          features={FEATURES}
          columns={3}
        />

        {/* ═══════════════ 6. BANNED WORDS WALL VS MISSIVE STANDARDS ═══════════════ */}
        <LandingBannedWordsWall />

        {/* ═══════════════ 7. SIGNATURE FLOATING PILL CLOUD ═══════════════ */}
        <LandingPillCloud
          pills={EEAT_PILLS}
          badge="Authority Signals"
          heading="Every E-E-A-T Signal At Your Fingertips"
          subheading="We turned Google's quality rater guidelines and Missive's editorial standards into a repeatable, automated audit so no weak authority signal slips through."
          note="Hover over any signal to see the standard behind every AI audit."
        />

        {/* ═══════════════ 8. HOW IT WORKS (STEP CARDS) ═══════════════ */}
        <LandingHowItWorks
          sectionLabel="How It Works"
          heading="From URL or Draft to Citable Authority in 4 Steps"
          subheading="No complex prompts needed. Add your content, set the context, run the audit, and act on the prioritized fixes."
          steps={STEPS}
        />

        {/* ═══════════════ 9. SIGNATURE DARK IMPACT SECTION ═══════════════ */}
        <LandingDarkImpact
          watermark="AUTHORITY"
          badge="The Authority Imperative"
          title={
            <>
              Weak Authority Means Invisible Content.{' '}
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                Build E-E-A-T Before AI Overlooks You
              </span>
            </>
          }
          subtitle="AI Search models pick winners by how confidently they can extract and cite authoritative signals. Without hands-on experience, credible sources, and transparent trust markers, your content gets passed over for answers your competitors already win."
          stats={[
            {
              value: '2-3x',
              label: 'Higher AI Search Rankings',
              sub: 'For content scoring 90%+ on authority',
              gradient: 'from-[#0C81F3] to-[#67A7FF]',
            },
            {
              value: '15',
              label: 'Quality Dimensions Scored',
              sub: 'From experience to trust, per page',
              gradient: 'from-[#67A7FF] to-[#EB8988]',
            },
            {
              value: '+67%',
              label: 'Organic Visibility Lift',
              sub: 'When authority fixes are applied',
              gradient: 'from-[#EB8988] to-[#FFB7B2]',
            },
            {
              value: '3s',
              label: 'Full Audit Time',
              sub: 'Then prioritized, actionable fixes',
              gradient: 'from-[#0C81F3] to-[#EB8988]',
            },
          ]}
          quote="Authority is not claimed. It is earned through experience, evidence, and trust: which is exactly what Google AI extracts and ranks on."
          author="Himani Kankaria, Founder of Missive Digital"
          ctaLabel="Analyze Your Content Now"
          onCtaClick={scrollToTool}
        />

        {/* ═══════════════ 10. E-E-A-T AUTHORITY BANNER ═══════════════ */}
        <AuthorityBanner />

        {/* ═══════════════ 11. BEFORE / AFTER COMPARISON ═══════════════ */}
        <LandingBeforeAfter
          sectionLabel="Results"
          heading="The Difference Strong E-E-A-T Makes"
          subheading="Every dimension in the framework exists to catch a specific signal gap that hurts rankings or AI citations. Here is what changes when your content actually demonstrates authority."
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
          subheading="Got questions about our E-E-A-T analyzer? We have answered the most common ones below."
          faqs={FAQS}
        />

        {/* ═══════════════ 15. FINAL RADIANT CTA ═══════════════ */}
        <LandingCTA
          heading="Stop Publishing Content AI Overlooks"
          subheading="Join 2,000+ content strategists who audit authority before they publish. 100% free, no sign-up required."
          ctaLabel="Analyze My Content Free"
          ctaOnClick={scrollToTool}
        />
      </div>
    </>
  )
}
