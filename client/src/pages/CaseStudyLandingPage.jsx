import { useEffect, useRef, useCallback } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Clock,
  Users,
  FileText,
  Share2,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import {
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingStats,
  LandingFAQ,
  LandingCTA,
  LandingCaseStudyShowcase,
  LandingDistributionChannels,
} from '../components/landing'
import CaseStudyGeneratorPage from '../tools/case-study-generator/CaseStudyGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Case Study Generator — Missive Digital',
  description:
    'Free AI-powered case study generator by Missive Digital. Turn client transformations into evidence-backed B2B case studies with sales battlecards, social repurposing, and AI search citations.',
  url: 'https://tools.missivedigital.com/case-study-generator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  author: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  provider: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '280' },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a case study generator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A case study generator is an AI-powered tool that transforms your client success stories into structured, evidence-backed B2B case studies. It produces the full narrative (Challenge, Solution, Results) plus KPIs, sales battlecards, social repurposing, and AI search citations.',
      },
    },
    {
      '@type': 'Question',
      name: 'What outputs does the case study generator produce?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Six outputs: (1) Full case study with KPIs, (2) Blog weaving with internal link opportunities, (3) Sales battlecard with objection handlers, (4) Paid ads and social media repurposing, (5) Video scripts and newsletter copy, (6) AI search and GEO citations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the case study generator free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The AI Case Study Generator by Missive Digital is 100% free with no sign-up required. Generate unlimited case studies with all 6 distribution channels at no cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this follow Missive QA checklist rules?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Every generated case study follows Himani Kankaria's 12-Pillar Content QA Framework: zero em dashes, zero robotic buzzwords, quantified metrics, and E-E-A-T proof signals.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use sample presets to test the tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The tool includes 3 sample presets — SaaS Churn Reduction, Fintech Organic Growth, and DTC E-Commerce CRO — so you can see a full generated output before entering your own data.',
      },
    },
    {
      '@type': 'Question',
      name: 'What industries work with this tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Any B2B or B2C industry — SaaS, fintech, e-commerce, healthcare, agencies, professional services, and more. The AI adapts the narrative, metrics, and distribution channels to your niche.',
      },
    },
  ],
}

/* ─────────────── Data ─────────────── */
const FEATURES = [
  {
    icon: FileText,
    title: 'Evidence-Backed Narratives',
    description:
      'Structured Challenge → Solution → Results format with quantified KPIs. Every claim backed by metrics, not vague assertions.',
  },
  {
    icon: Target,
    title: 'Sales Battlecards',
    description:
      'Competitive positioning, objection handlers, and talk tracks your sales team can use immediately on calls.',
  },
  {
    icon: Share2,
    title: 'Multi-Channel Distribution',
    description:
      'LinkedIn carousels, Twitter threads, paid ad copy, video scripts, and newsletter content — all from one case study.',
  },
  {
    icon: Globe,
    title: 'AI Search & GEO Citations',
    description:
      'Structured data, entity signals, and citable excerpts optimized for Google AI Search and ChatGPT citations.',
  },
  {
    icon: ShieldCheck,
    title: 'Missive 12-Pillar QA Certified',
    description:
      "Built on Himani Kankaria's QA rules: zero em dashes, zero robotic buzzwords, 3+ concrete metrics, and tight scannable paragraphs.",
  },
  {
    icon: Zap,
    title: '8 Tone Profiles',
    description:
      'Authoritative, Conversational, Storytelling, Fun, Bold, Empathetic, Witty, or Data-Driven — match your brand voice.',
  },
]

const STEPS = [
  {
    icon: Target,
    title: 'Enter Client Details',
    description:
      'Provide client name, niche, challenge, solution, and results. Or use a sample preset to see it in action.',
  },
  {
    icon: Sparkles,
    title: 'Pick Tone & Audience',
    description:
      'Choose your tone of voice and target audience for the case study narrative.',
  },
  {
    icon: TrendingUp,
    title: 'Generate Full Playbook',
    description:
      'The AI produces the case study, battlecard, social content, video scripts, and AI search citations.',
  },
  {
    icon: Share2,
    title: 'Export & Distribute',
    description:
      'Copy, download, or export each channel output. Drop it into your CMS, sales deck, or social scheduler.',
  },
]

const STATS = [
  { value: '6', label: 'Distribution channels' },
  { value: '3', label: 'Sample presets included' },
  { value: '20-30 sec', label: 'Average generation time' },
  { value: '100%', label: 'E-E-A-T compliant' },
]

const FAQS = [
  {
    question: 'What is a case study generator?',
    answer:
      'A case study generator is an AI-powered tool that transforms your client success stories into structured, evidence-backed B2B case studies. It produces the full narrative (Challenge, Solution, Results) plus KPIs, sales battlecards, social repurposing, and AI search citations.',
  },
  {
    question: 'What outputs does the case study generator produce?',
    answer:
      'Six outputs: (1) Full case study with KPIs, (2) Blog weaving with internal link opportunities, (3) Sales battlecard with objection handlers, (4) Paid ads and social media repurposing, (5) Video scripts and newsletter copy, (6) AI search and GEO citations.',
  },
  {
    question: 'Is the case study generator free?',
    answer:
      'Yes. The AI Case Study Generator by Missive Digital is 100% free with no sign-up required. Generate unlimited case studies with all 6 distribution channels at no cost.',
  },
  {
    question: 'Does this follow Missive QA checklist rules?',
    answer:
      "Every generated case study follows Himani Kankaria's 12-Pillar Content QA Framework: zero em dashes, zero robotic buzzwords, quantified metrics, and E-E-A-T proof signals.",
  },
  {
    question: 'Can I use sample presets to test the tool?',
    answer:
      'Yes. The tool includes 3 sample presets — SaaS Churn Reduction, Fintech Organic Growth, and DTC E-Commerce CRO — so you can see a full generated output before entering your own data.',
  },
  {
    question: 'What industries work with this tool?',
    answer:
      'Any B2B or B2C industry — SaaS, fintech, e-commerce, healthcare, agencies, professional services, and more. The AI adapts the narrative, metrics, and distribution channels to your niche.',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const ref = useScrollReveal()
  const items = [
    { icon: Users, value: '2,500+', label: 'Sales & marketing teams' },
    { icon: FileText, value: '40,000+', label: 'Case studies generated' },
    { icon: Clock, value: '20-30 sec', label: 'Average generation time' },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="lp-reveal grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white mb-3 shadow-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{item.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function CaseStudyLandingPage() {
  const toolRef = useRef(null)

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
      <Helmet>
        <title>AI Case Study Generator — Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Turn client transformations into evidence-backed B2B case studies with sales battlecards, social repurposing, video scripts, and AI search citations. Free, no sign-up."
        />
        <meta
          name="keywords"
          content="case study generator, B2B case study, sales battlecard, client success story, AI case study, content repurposing, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/case-study-generator" />
        <meta property="og:title" content="AI Case Study Generator — Free Tool | Missive Digital" />
        <meta
          property="og:description"
          content="Turn client transformations into evidence-backed B2B case studies with 6 distribution channels. Free, no sign-up."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/case-study-generator" />
        <meta property="og:site_name" content="Missive Digital: Himani's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Case Study Generator — Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate evidence-backed B2B case studies with sales battlecards, social content, and AI search citations. Free."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className="landing-page min-h-screen bg-white font-sans">
        {/* 1. Hero with embedded tool */}
        <LandingHero
          badge="Himani's SEO Tools • Missive Digital"
          title={[
            { text: 'Turn Client Wins Into ' },
            { text: 'Revenue Engines', gradient: true },
          ]}
          subtitle="Generate evidence-backed B2B case studies with sales battlecards, social repurposing, video scripts, and AI search citations — all from one form."
          ctaLabel="Generate Case Study Free →"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See 6 Output Channels ↓',
            onClick: () => scrollToSection('channels'),
          }}
          trustBadges={[
            'No sign-up required',
            '100% free',
            '6 distribution channels',
            'Sales battlecards included',
          ]}
          toolRef={toolRef}
          toolLabel="Generate Case Study — Live"
          toolSlot={<CaseStudyGeneratorPage isEmbedded={true} />}
        />

        {/* 2. Stats */}
        <LandingStats stats={STATS} />

        {/* 3. Case study showcase */}
        <LandingCaseStudyShowcase />

        {/* 4. Distribution channels */}
        <LandingDistributionChannels />

        {/* 5. Features grid */}
        <LandingFeatures
          sectionLabel="Why This Tool?"
          heading="One Case Study. Complete Commercial Playbook."
          subheading="Not just a narrative — a full distribution engine that feeds your sales team, content calendar, social feeds, and AI search presence."
          features={FEATURES}
          columns={3}
        />

        {/* 6. How it works */}
        <LandingHowItWorks
          sectionLabel="How It Works"
          heading="From Client Win to Multi-Channel Playbook in 4 Steps"
          subheading="Enter your client details, pick a tone, and let the AI generate the full case study and distribution package."
          steps={STEPS}
        />

        {/* 7. Trust section */}
        <TrustSection />

        {/* 8. FAQ */}
        <LandingFAQ
          sectionLabel="Frequently Asked Questions"
          heading="Case Study Generator FAQs"
          subheading="Everything you need to know about generating evidence-backed case studies with AI."
          faqs={FAQS}
        />

        {/* 9. Final CTA */}
        <LandingCTA
          heading="Stop Letting Client Wins Collect Dust"
          subheading="Generate a full commercial playbook from your best client results. Case study, battlecard, social content, and AI citations — free, no sign-up."
          ctaLabel="Start Generating Free"
          ctaOnClick={scrollToTool}
        />
      </div>
    </>
  )
}
