import { useState, useEffect, useRef, useCallback } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
import { Helmet } from 'react-helmet-async'
import {
  Compass,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  PenTool,
  ShieldCheck,
  Globe,
  Bot,
  Search,
  Crown,
  Database,
  Wand2,
  ArrowLeft,
} from 'lucide-react'
import {
  LandingHero,
  LandingMarquee,
  LandingPillCloud,
  LandingDarkImpact,
  LandingFeatures,
  LandingHowItWorks,
  LandingStats,
  LandingAnimatedStats,
  LandingFAQ,
  LandingCTA,
  LandingEeatAuditMatrix,
  LandingLiveDemo,
} from '../components/landing'
import EeatAnalyzerPage from '../tools/eeat-analyzer/EeatAnalyzerPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'E‑E‑A‑T & AI Search Authority Analyzer by Missive Digital',
  description:
    "Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness (E‑E‑A‑T). Use AI-powered analysis to rank higher in Google's AI Search results. Free SEO quality audit tool.",
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
      name: 'What is E‑E‑A‑T and why does it matter for AI Search?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "E‑E‑A‑T stands for Expertise, Experience, Authoritativeness and Trustworthiness, Google's core framework for content quality. It matters more than ever with AI Search, because AI models need to pull authoritative signals from your content to give accurate, citable answers.",
      },
    },
    {
      '@type': 'Question',
      name: 'How does this analyzer differ from regular SEO tools?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It analyzes content depth, author credibility, primary source citations, hands-on experience indicators, and E‑E‑A‑T compliance across 15+ quality dimensions. It returns specific, actionable recommendations rather than generic checklists, so you know exactly what to fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I really rank higher in AI Search with this tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Google AI Search strongly weights E‑E‑A‑T signals. Content scoring 90% or higher on the analyzer tends to rank 2-3x higher in AI Search results because it gives the AI clear signals it can confidently extract and cite.',
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
      name: 'Is the E‑E‑A‑T analyzer free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The E‑E‑A‑T & AI Search Authority Analyzer by Missive Digital is free with no sign-up or credit card required.',
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
    title: 'AI-Powered E‑E‑A‑T Analysis',
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
      "Get prioritized, concrete fixes instead of generic advice. You'll know exactly what signals to add for authoritative, citable content.",
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
    description: 'Analyze any published page by URL or paste draft text for a full E‑E‑A‑T read.',
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
    description:
      'Act on the prioritized recommendations and watch your citations and rankings climb.',
  },
]

const STATS = [
  { value: '10M+', label: 'Pages analyzed with the framework' },
  { value: '2-3x', label: 'Higher AI Search rankings' },
  { value: '15', label: 'E‑E‑A‑T quality dimensions scored' },
  { value: '25-30 sec', label: 'Average full audit time' },
]

const FAQS = [
  {
    question: 'What is E‑E‑A‑T and why does it matter for AI Search?',
    answer:
      "E‑E‑A‑T stands for Expertise, Experience, Authoritativeness and Trustworthiness, Google's core framework for content quality. It matters more than ever with AI Search, because AI models need to pull authoritative signals from your content to give accurate, citable answers.",
    tag: 'Basics',
  },
  {
    question: 'How does this analyzer differ from regular SEO tools?',
    answer:
      'It analyzes content depth, author credibility, primary source citations, hands-on experience indicators, and E‑E‑A‑T compliance across 15+ quality dimensions. It returns specific, actionable recommendations rather than generic checklists, so you know exactly what to fix.',
    tag: 'Detection',
  },
  {
    question: 'Can I really rank higher in AI Search with this tool?',
    answer:
      'Yes. Google AI Search strongly weights E‑E‑A‑T signals. Content scoring 90% or higher on the analyzer tends to rank 2-3x higher in AI Search results because it gives the AI clear signals it can confidently extract and cite.',
    tag: 'Rankings',
  },
  {
    question: 'Do I need a website for the analyzer to work?',
    answer:
      'No. The analyzer works on any URL or on pasted draft text. It analyzes existing content, provides improvement recommendations, and tells you exactly what signals are missing for stronger citations in AI search results.',
    tag: 'Inputs',
  },
  {
    question: 'Does this tool work for YMYL content?',
    answer:
      'Yes. It is designed for Your Money or Your Life content with enhanced validation for Health, Finance, Legal, and Safety topics, checking credentials, citations, disclaimers, and compliance more rigorously.',
    tag: 'YMYL',
  },
  {
    question: 'Is the E‑E‑A‑T analyzer free?',
    answer:
      'Yes. The E‑E‑A‑T & AI Search Authority Analyzer by Missive Digital is free with no sign-up or credit card required.',
    tag: 'Pricing',
  },
]

/* ─────────────── EEAT Pills for LandingPillCloud ─────────────── */
const EEAT_PILLS = [
  {
    text: 'Hands-On Experience Signals',
    color: 'bg-sky-50 text-[#0C81F3] border-sky-200 hover:bg-sky-100',
    icon: '',
  },
  {
    text: 'Author Credentials',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: '',
  },
  {
    text: 'Primary Source Citations',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    icon: '',
  },
  {
    text: 'AI Overview Optimization',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: '',
  },
  {
    text: 'Trust & Transparency',
    color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    icon: '',
  },
  {
    text: 'Content Depth vs Breadth',
    color: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100',
    icon: '',
  },
  {
    text: 'Quantifiable Proof & Metrics',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    icon: '',
  },
  {
    text: 'Insight-First Structure',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: '',
  },
  {
    text: 'Read Aloud Test',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    icon: '',
  },
  {
    text: 'Zero Em Dashes',
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    icon: '',
  },
  {
    text: 'Missive 12-Pillar Compliance',
    color: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: '',
  },
  {
    text: 'Google E‑E‑A‑T Aligned',
    color: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
    icon: '',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const items = [
    { icon: Users, value: '2,000+', label: 'Active content strategists monthly' },
    { icon: BarChart3, value: '45,000+', label: 'Content pieces audited' },
    { icon: Clock, value: '25-30 sec', label: 'Average audit time' },
  ]

  return (
    <LandingAnimatedStats
      sectionLabel="Built by SEO Strategists"
      heading="Trusted by Content Teams Who Care About Authority"
      subheading="Built on Himani Kankaria's frameworks, refined over 15+ years of experience optimizing enterprise copy for Google's quality guidelines and AI Search visibility."
      stats={items}
    />
  )
}

/* ─────────────── E‑E‑A‑T Authority Banner ─────────────── */
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
              text: 'SEO Strategist with 15+ years of experience optimizing B2B and SaaS content for Google search intent and conversions.',
            },
            {
              icon: CheckCircle2,
              title: 'Google Quality Rater Aligned',
              text: 'Forensically evaluated against official Search Quality Evaluator Guidelines and AI Overview citation criteria.',
            },
            {
              icon: CheckCircle2,
              title: 'E‑E‑A‑T & AI Search Ready',
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

/* ─────────────── Landing Page Component ─────────────── */
export default function EeatAuthorityAnalyzerLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewAudit = () => {
    setResetSignal((c) => c + 1)
    setHasResults(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToTool = useCallback(() => {
    const el = toolRef.current || document.getElementById('tool')
    if (!el) return
    const navHeight = 90
    const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [])

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId)
    if (!el) return
    const navHeight = 90
    const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
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
        <title>E‑E‑A‑T &amp; AI Search Authority Analyzer - Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Use AI-powered analysis to rank higher in Google AI Search results. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="E‑E‑A‑T analyzer, AI search optimization, Google helpful content, authority analyzer, E‑E‑A‑T checker, SEO quality tool, content authority, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/eeat-analyzer" />
        <meta
          property="og:title"
          content="E‑E‑A‑T & AI Search Authority Analyzer - Free Tool | Missive Digital"
        />
        <meta
          property="og:description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Free AI-powered analysis to rank higher in Google AI Search results."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/eeat-analyzer" />
        <meta property="og:site_name" content="Missive's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="E‑E‑A‑T & AI Search Authority Analyzer by Missive Digital"
        />
        <meta
          name="twitter:description"
          content="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness. Free, AI-powered."
        />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-white ${hasResults ? 'pt-20' : ''}`}>
        {/* ═══════════════ 1. HERO ═══════════════ */}
        <LandingHero
          hideHeroCopy={hasResults}
          badge="Missive's SEO Tools • Missive Digital"
          title={[
            { text: 'Rank Higher in Google' },
            { text: ' AI Search Results', gradient: true },
            { text: ' With Strong E‑E‑A‑T' },
          ]}
          subtitle="Analyze your content for Expertise, Experience, Authoritativeness and Trustworthiness using advanced AI. Get a scored 15-pillar breakdown and prioritized fixes so Google AI can confidently extract and cite your content."
          ctaLabel="Analyze Your Content Free"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'Explore 15-Pillar Matrix',
            onClick: () => scrollToSection('features'),
          }}
          trustBadges={[
            'No sign-up required',
            'Free forever',
            '15-Pillar authority matrix',
            'AI Search ready',
          ]}
          toolRef={toolRef}
          toolLabel={hasResults ? 'Forensic E‑E‑A‑T Audit Results' : 'Run the E‑E‑A‑T Audit • Live'}
          toolSlot={
            <EeatAnalyzerPage
              isEmbedded={true}
              onResultStateChange={setHasResults}
              resetSignal={resetSignal}
            />
          }
        />

        {!hasResults && (
          <>
            {/* ═══════════════ 2. INFINITE CMS & PUBLISHING MARQUEE ═══════════════ */}
            <LandingMarquee />

            {/* ═══════════════ 3. ANIMATED LIVE DEMO ═══════════════ */}
            <LandingLiveDemo
              badge="See It Audit"
              heading="Watch an E‑E‑A‑T Audit Run Live"
              subheading="Drop in a URL or draft and watch the AI score authority signals across the quality matrix in real time."
              accentIcon={ShieldCheck}
              examples={[
                {
                  label: 'B2B SaaS & Tech',
                  input: 'https://yoursite.com/blog/enterprise-seo-migration-guide',
                  outputTitle: 'Experience Pillar (14/20)',
                  outputBody:
                    'Missing first-hand deployment data. Add a specific before/after metric from a real migration to lift this pillar into the 18+ range.',
                  outputMeta: ['Experience', '-6 pts', 'Fixable in 1 edit'],
                },
                {
                  label: 'YMYL · Finance',
                  input: 'https://yoursite.com/guides/business-loan-rates-2026',
                  outputTitle: 'Trust Pillar (11/20)',
                  outputBody:
                    'No author credentials or last-reviewed date detected. YMYL content needs verifiable expertise disclosure to pass Google quality checks.',
                  outputMeta: ['Trust', 'YMYL Flag', 'High Priority'],
                },
                {
                  label: 'How-To Guide',
                  input: '"Our new dashboard cuts audit time by..."',
                  outputTitle: 'Overall Score (92/100)',
                  outputBody:
                    'Strong primary-source citations and hands-on proof. Content is structured for confident AI Search extraction and citation.',
                  outputMeta: ['15/15 Pillars', 'AI Search Ready', 'Publish Ready'],
                },
              ]}
            />

            {/* ═══════════════ 4. STATS ROW ═══════════════ */}
            <LandingStats stats={STATS} />

            {/* ═══════════════ 5. FORENSIC E‑E‑A‑T & AI CITATION MATRIX ═══════════════ */}
            <LandingEeatAuditMatrix />

            {/* ═══════════════ 6. FEATURES GRID ═══════════════ */}
            <LandingFeatures
              sectionLabel="Why This Tool?"
              heading="Optimize for the AI Search Era"
              subheading="Weak authority signals quietly kill rankings and AI citations. This tool scores every content piece across 15 quality dimensions and gives you concrete fixes to turn it into a citable, authoritative resource."
              features={FEATURES}
              columns={3}
            />

            {/* ═══════════════ 7. SIGNATURE FLOATING PILL CLOUD ═══════════════ */}
            <LandingPillCloud
              pills={EEAT_PILLS}
              badge="Authority Signals"
              heading="Every E‑E‑A‑T Signal At Your Fingertips"
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
                  <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                    Build E‑E‑A‑T Before AI Overlooks You
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
                  value: '20-30s',
                  label: 'Full Audit Time',
                  sub: 'Then prioritized, actionable fixes',
                  gradient: 'from-[#0C81F3] to-[#EB8988]',
                },
              ]}
              quote="Authority is not claimed. It is earned through experience, evidence, and trust, which is exactly what Google AI extracts and ranks on."
              author="Himani Kankaria, Founder of Missive Digital"
              ctaLabel="Analyze Your Content Now"
              onCtaClick={scrollToTool}
            />

            {/* ═══════════════ 10. E‑E‑A‑T AUTHORITY BANNER ═══════════════ */}
            <AuthorityBanner />

            {/* ═══════════════ 11. TRUST / E‑E‑A‑T SECTION ═══════════════ */}
            <TrustSection />

            {/* ═══════════════ 12. FAQ ACCORDION ═══════════════ */}
            <LandingFAQ
              sectionLabel="Frequently Asked Questions"
              heading="E‑E‑A‑T Analyzer FAQs"
              subheading="Understand how this tool scores authority, catches weak signals, and gives you actionable fixes."
              faqs={FAQS}
            />

            {/* ═══════════════ 13. FINAL RADIANT CTA ═══════════════ */}
            <LandingCTA
              heading="Stop Publishing Content AI Overlooks"
              subheading="Audit your content for E‑E‑A‑T and AI search readiness. Free, no sign-up required."
              ctaLabel="Analyze My Content Free"
              ctaOnClick={scrollToTool}
            />
          </>
        )}
      </div>
    </>
  )
}
