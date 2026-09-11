import { useState, useEffect, useRef, useCallback } from 'react'
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
  ArrowLeft,
} from 'lucide-react'
import {
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingStats,
  LandingAnimatedStats,
  LandingFAQ,
  LandingCTA,
  LandingCaseStudyShowcase,
  LandingDistributionChannels,
  LandingLiveDemo,
} from '../components/landing'
import CaseStudyGeneratorPage from '../tools/case-study-generator/CaseStudyGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Case Study Generator - Missive Digital',
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
        text: 'Six outputs. A full case study with KPIs, blog weaving with internal link opportunities, a sales battlecard with objection handlers, paid ads and social media repurposing, video scripts and newsletter copy, and AI search and GEO citations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the case study generator free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The AI Case Study Generator by Missive Digital is free with no sign-up required. Generate unlimited case studies with all 6 distribution channels at no cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this follow Missive QA checklist rules?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Every generated case study follows Himani Kankaria's 12-Pillar Content QA Framework. No em dashes, no robotic buzzwords, real numbers backing every claim, and clear E‑E‑A‑T proof.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use sample presets to test the tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The tool includes 3 sample presets, SaaS Churn Reduction, Fintech Organic Growth, and DTC E-Commerce CRO, so you can see a full generated output before entering your own data.',
      },
    },
    {
      '@type': 'Question',
      name: 'What industries work with this tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Any B2B or B2C industry. SaaS, fintech, e-commerce, healthcare, agencies, professional services, and more. The AI adapts the narrative, metrics, and distribution channels to your niche.',
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
      'LinkedIn carousels, Twitter threads, paid ad copy, video scripts, and newsletter content. All from one case study.',
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
      "Built on Himani Kankaria's QA rules. No em dashes, no robotic buzzwords, at least 3 concrete metrics, and tight, scannable paragraphs.",
  },
  {
    icon: Zap,
    title: '8 Tone Profiles',
    description:
      'Authoritative, Conversational, Storytelling, Fun, Bold, Empathetic, Witty, or Data-Driven. Match your brand voice.',
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
    description: 'Choose your tone of voice and target audience for the case study narrative.',
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
  { value: '25-30 sec', label: 'Average generation time' },
  { value: 'E‑E‑A‑T', label: 'Fully compliant' },
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
      'Six outputs. A full case study with KPIs, blog weaving with internal link opportunities, a sales battlecard with objection handlers, paid ads and social media repurposing, video scripts and newsletter copy, and AI search and GEO citations.',
  },
  {
    question: 'Is the case study generator free?',
    answer:
      'Yes. The AI Case Study Generator by Missive Digital is free with no sign-up required. Generate unlimited case studies with all 6 distribution channels at no cost.',
  },
  {
    question: 'Does this follow Missive QA checklist rules?',
    answer:
      "Every generated case study follows Himani Kankaria's 12-Pillar Content QA Framework. No em dashes, no robotic buzzwords, real numbers backing every claim, and clear E‑E‑A‑T proof.",
  },
  {
    question: 'Can I use sample presets to test the tool?',
    answer:
      'Yes. The tool includes 3 sample presets. SaaS Churn Reduction, Fintech Organic Growth, and DTC E-Commerce CRO, so you can see a full generated output before entering your own data.',
  },
  {
    question: 'What industries work with this tool?',
    answer:
      'Any B2B or B2C industry. SaaS, fintech, e-commerce, healthcare, agencies, professional services, and more. The AI adapts the narrative, metrics, and distribution channels to your niche.',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const items = [
    { icon: Users, value: '2,500+', label: 'Sales & marketing teams' },
    { icon: FileText, value: '40,000+', label: 'Case studies generated' },
    { icon: Clock, value: '25-30 sec', label: 'Average generation time' },
  ]

  return <LandingAnimatedStats stats={items} />
}

/* ─────────────── Landing Page Component ─────────────── */
export default function CaseStudyLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewCaseStudy = () => {
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
      <Helmet>
        <title>AI Case Study Generator - Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Turn client transformations into evidence-backed B2B case studies with sales battlecards, social repurposing, video scripts, and AI search citations. Free, no sign-up."
        />
        <meta
          name="keywords"
          content="case study generator, B2B case study, sales battlecard, client success story, AI case study, content repurposing, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/case-study-generator" />
        <meta property="og:title" content="AI Case Study Generator - Free Tool | Missive Digital" />
        <meta
          property="og:description"
          content="Turn client transformations into evidence-backed B2B case studies with 6 distribution channels. Free, no sign-up."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/case-study-generator" />
        <meta property="og:site_name" content="Missive's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Case Study Generator - Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate evidence-backed B2B case studies with sales battlecards, social content, and AI search citations. Free."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-white font-sans ${hasResults ? 'pt-20' : ''}`}>
        {/* 1. Hero with embedded tool */}
        <LandingHero
          hideHeroCopy={hasResults}
          badge="Missive's SEO Tools • Missive Digital"
          title={[{ text: 'Turn Client Wins Into ' }, { text: 'Revenue Engines', gradient: true }]}
          subtitle="Generate evidence-backed B2B case studies with sales battlecards, social repurposing, video scripts, and AI search citations. All from one form."
          ctaLabel="Generate Case Study Free"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See 6 Output Channels',
            onClick: () => scrollToSection('channels'),
          }}
          trustBadges={[
            'No sign-up required',
            'Free to use',
            '6 distribution channels',
            'Sales battlecards included',
          ]}
          toolRef={toolRef}
          toolLabel={hasResults ? 'Generated Case Study Playbook' : 'Generate Case Study - Live'}
          toolSlot={
            <CaseStudyGeneratorPage
              isEmbedded={true}
              onResultStateChange={setHasResults}
              resetSignal={resetSignal}
            />
          }
        />

        {!hasResults && (
          <>
            {/* 2. Stats */}
            <LandingStats stats={STATS} />

            {/* 2.5 Animated Live Demo */}
            <LandingLiveDemo
              badge="See It Transform"
              heading="Watch a Client Win Turn Into a Commercial Playbook"
              subheading="Type in raw client metrics and watch the AI generate executive summaries, sales battlecards, and multi-channel distribution assets."
              accentIcon={TrendingUp}
              examples={[
                {
                  label: 'Enterprise ROI Transformation',
                  input: 'FinTech SaaS · 312% Pipeline Growth in 90 Days',
                  outputTitle: 'Executive Snapshot for Faster Enterprise Deals',
                  outputBody:
                    '"How a leading merchant payments provider eliminated $420,000 in operational friction by replacing manual spreadsheet underwriting with automated compliance workflows."',
                  outputMeta: ['Quantified ROI', '312% Growth', 'Zero Em Dashes'],
                },
                {
                  label: 'Sales Enablement Battlecard',
                  input: 'Displacing Legacy ERP with Modern Modular Tech',
                  outputTitle: 'Sales Battlecard With 3 Counter-Objections',
                  outputBody:
                    '"Arms sales reps with proven answers to \'Why change now?\', a side-by-side migration timeline comparison, and empirical data proving a 45-day go-live milestone."',
                  outputMeta: ['Sales Battlecard', '3 Objections Handled', 'CFO-Ready Proof'],
                },
                {
                  label: '6-Channel Repurposing Engine',
                  input: 'Omnichannel B2B Campaign Repurposing',
                  outputTitle: 'One Case Study Turned Into 6 Assets',
                  outputBody:
                    '"Synthesizes 1 long-form pillar case study, 1 LinkedIn narrative carousel, 1 outbound cold email cadence, 1 executive PDF brief, and 3 slide deck benchmark visuals."',
                  outputMeta: ['6 Channels', 'Omnichannel ROI', 'Instant Repurposing'],
                },
              ]}
            />

            {/* 3. Case study showcase */}
            <LandingCaseStudyShowcase />

            {/* 4. Distribution channels */}
            <LandingDistributionChannels />

            {/* 5. Features grid */}
            <LandingFeatures
              sectionLabel="Why This Tool?"
              heading="One Case Study. Complete Commercial Playbook."
              subheading="Not just a narrative. A full distribution engine that feeds your sales team, content calendar, social feeds, and AI search presence."
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
              subheading="Common questions about outputs, presets, and how the case study data is used."
              faqs={FAQS}
            />

            {/* 9. Final CTA */}
            <LandingCTA
              heading="Stop Letting Client Wins Collect Dust"
              subheading="Generate a full commercial playbook from your best client results. Case study, battlecard, social content, and AI citations. Free, no sign-up."
              ctaLabel="Build My Case Study"
              ctaOnClick={scrollToTool}
            />
          </>
        )}
      </div>
    </>
  )
}
