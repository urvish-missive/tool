import { useEffect, useRef, useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  Target,
  Layers,
  Compass,
  Clock,
  Users,
  Link2,
  TrendingUp,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react'
import {
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingStats,
  LandingAnimatedStats,
  LandingFAQ,
  LandingTopicBlueprintCTA,
  LandingSiloArchitecture,
  LandingTopicCloud,
  LandingContentPillars,
  LandingLiveDemo,
} from '../components/landing'
import BlogTopicGeneratorPage from '../tools/blog-topic-generator/BlogTopicGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Blog Topic & Silo Generator - Missive Digital',
  description:
    'Free AI-powered blog topic generator and topical silo architect by Missive Digital. Generate pillar pages, cluster topics, interlinking blueprints, and editorial calendars for any niche.',
  url: 'https://tools.missivedigital.com/blog-topic-generator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  author: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  provider: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '320' },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a topical silo in SEO?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A topical silo is a content architecture strategy where you organize pages into pillar-cluster groups. The pillar page covers a broad topic, and cluster pages cover subtopics that link back to the pillar. This builds topical authority and helps search engines understand your expertise.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the AI generate blog topics?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The AI analyzes your niche, target keywords, audience, and content goals to generate topics scored by search intent (informational, commercial, transactional), funnel stage (TOFU, MOFU, BOFU), and difficulty. It also builds a silo architecture with pillar and cluster relationships.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a master brief?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A master brief is a detailed content outline for a specific topic, including H2/H3 structure, target keywords, content angle, word count estimate, and internal linking strategy. You can generate one for any topic with a single click.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Blog Topic & Silo Generator free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The AI Blog Topic & Silo Generator by Missive Digital is free with no sign-up required. Generate unlimited topic ideas, silo architectures, master briefs, and editorial calendars at no cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this for any niche or industry?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The tool works for any niche, including SaaS, e-commerce, healthcare, finance, education, local businesses, and more. Enter your niche and optional target keywords, and the AI generates a tailored content strategy.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between pillar and cluster content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pillar content is a comprehensive guide covering a broad topic (e.g., "Content Strategy"). Cluster content is a specific subtopic (e.g., "Editorial Calendar Planning") that links back to the pillar. Together they build topical authority and improve search rankings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this follow Missive QA checklist rules?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Every topic suggestion and master brief follows Himani Kankaria's 12-Pillar Content QA Framework. It keeps every insight clear, useful, and free of robotic buzzwords.",
      },
    },
  ],
}

/* ─────────────── Data ─────────────── */
const FEATURES = [
  {
    icon: Target,
    title: 'Multi-Keyword Niche Targeting',
    description:
      'Enter up to 20 target keywords and the AI turns them into a clear pillar and cluster plan.',
  },
  {
    icon: TrendingUp,
    title: 'Tone-of-Voice Customization',
    description:
      'Choose from 8 distinct tone profiles. Authoritative, conversational, bold, empathetic, storytelling, data-driven, witty, or fun. And every headline matches.',
  },
  {
    icon: Lightbulb,
    title: 'Difficulty & Priority Scoring',
    description:
      'Topics are scored by competitiveness, so you know which articles to publish first for the fastest wins.',
  },
  {
    icon: Link2,
    title: 'Internal Linking Strategy',
    description:
      'Every topic includes suggested anchor text and links connecting your pillar pages to their clusters.',
  },
  {
    icon: Layers,
    title: 'One-Click Master Briefs',
    description:
      'Expand any topic to generate a full editorial brief with H2/H3 structure, talking points, visual asset suggestions, and competitor gap analysis.',
  },
  {
    icon: Compass,
    title: 'Publishing Priority Queue',
    description:
      'The AI sequences your editorial calendar. Pillar pages first, then clusters, so you build authority from day one.',
  },
]

const STEPS = [
  {
    icon: Target,
    title: 'Enter Your Niche',
    description:
      'Type your industry or niche. Add optional target keywords for more specific results.',
  },
  {
    icon: Compass,
    title: 'Set Goals & Tone',
    description: 'Choose your content goal, preferred tone, and the number of topics to generate.',
  },
  {
    icon: Sparkles,
    title: 'Generate Topics & Silos',
    description:
      'The AI produces pillar topics, cluster ideas, silo architecture, and an interlinking blueprint.',
  },
  {
    icon: Layers,
    title: 'Deepen & Publish',
    description:
      'Click any topic to generate a full master brief, then export your editorial calendar.',
  },
]

const STATS = [
  { value: '8-15', label: 'Topics per generation' },
  { value: '3', label: 'Funnel stages mapped' },
  { value: '25-30 sec', label: 'Average generation time' },
  { value: 'E‑E‑A‑T', label: 'Fully aligned' },
]

const FAQS = [
  {
    question: 'What is a topical silo in SEO?',
    answer:
      'A topical silo is a content architecture strategy where you organize pages into pillar-cluster groups. The pillar page covers a broad topic, and cluster pages cover subtopics that link back to the pillar. This builds topical authority and helps search engines understand your expertise.',
  },
  {
    question: 'How does the AI generate blog topics?',
    answer:
      'The AI analyzes your niche, target keywords, audience, and content goals to generate topics scored by search intent (informational, commercial, transactional), funnel stage (TOFU, MOFU, BOFU), and difficulty. It also builds a silo architecture with pillar and cluster relationships.',
  },
  {
    question: 'What is a master brief?',
    answer:
      'A master brief is a detailed content outline for a specific topic, including H2/H3 structure, target keywords, content angle, word count estimate, and internal linking strategy. You can generate one for any topic with a single click.',
  },
  {
    question: 'Is the Blog Topic & Silo Generator free?',
    answer:
      'Yes. The AI Blog Topic & Silo Generator by Missive Digital is free with no sign-up required. Generate unlimited topic ideas, silo architectures, master briefs, and editorial calendars.',
  },
  {
    question: 'Can I use this for any niche or industry?',
    answer:
      'Yes. The tool works for any niche, including SaaS, e-commerce, healthcare, finance, education, local businesses, and more. Enter your niche and optional target keywords, and the AI generates a tailored content strategy.',
  },
  {
    question: 'What is the difference between pillar and cluster content?',
    answer:
      'Pillar content is a comprehensive guide covering a broad topic (e.g., "Content Strategy"). Cluster content is a specific subtopic (e.g., "Editorial Calendar Planning") that links back to the pillar. Together they build topical authority and improve search rankings.',
  },
  {
    question: 'Does this follow Missive QA checklist rules?',
    answer:
      "Every topic suggestion and master brief follows Himani Kankaria's 12-Pillar Content QA Framework. It keeps every insight clear, useful, and free of robotic buzzwords.",
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const items = [
    { icon: Users, value: '3,000+', label: 'Content strategists using this tool' },
    { icon: Layers, value: '75,000+', label: 'Topic silos generated' },
    { icon: Sparkles, value: '6', label: 'Tone profiles available' },
  ]

  return <LandingAnimatedStats stats={items} />
}

/* ─────────────── Landing Page Component ─────────────── */
export default function BlogTopicLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewSearch = () => {
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
        <title>AI Blog Topic &amp; Silo Generator - Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Generate blog topic ideas, topical silo architectures, pillar-cluster strategies, master briefs, and editorial calendars with AI. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="blog topic generator, topical silo, content strategy, pillar cluster, SEO content planning, editorial calendar, AI blog topics, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/blog-topic-generator" />
        <meta
          property="og:title"
          content="AI Blog Topic & Silo Generator - Free Tool | Missive Digital"
        />
        <meta
          property="og:description"
          content="Generate blog topic ideas, topical silo architectures, pillar-cluster strategies, and editorial calendars with AI. Free, no sign-up."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/blog-topic-generator" />
        <meta property="og:site_name" content="Missive's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Blog Topic & Silo Generator - Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate blog topic ideas, silo architectures, and editorial calendars with AI. Free, no sign-up."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-white font-sans ${hasResults ? 'pt-20' : ''}`}>
        {/* 1. Hero with embedded tool */}
        <LandingHero
          hideHeroCopy={hasResults}
          badge="Missive's SEO Tools • Missive Digital"
          title={[
            { text: 'Plan Your ' },
            { text: 'Blog Content', gradient: true },
            { text: ' With AI' },
          ]}
          subtitle="Generate pillar pages, cluster topics, silo architectures, interlinking blueprints, and editorial calendars. All scored by funnel stage, search intent, and difficulty."
          ctaLabel="Generate Topics Free"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See Silo Architecture',
            onClick: () => scrollToSection('silo-architecture'),
          }}
          trustBadges={[
            'No sign-up required',
            'Free to use',
            'Pillar + cluster silos',
            'Master briefs included',
          ]}
          toolRef={toolRef}
          toolLabel={
            hasResults ? 'Active Topic Silo & Master Briefs' : 'Generate Blog Topics & Silos - Live'
          }
          toolSlot={
            <BlogTopicGeneratorPage
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
              badge="See It Architect"
              heading="Watch a Topical Silo Get Mapped Live"
              subheading="Enter an industry niche and watch the AI architect pillar pages, cluster nodes, and master briefs in seconds."
              accentIcon={Compass}
              examples={[
                {
                  label: 'B2B SaaS · Topical Authority',
                  input: 'Cloud Cost Optimization Software',
                  outputTitle: 'A Complete Guide to Cutting Cloud Spend',
                  outputBody:
                    '"Built around 4 cluster topics covering cloud waste, billing across providers, container costs, and budget tracking. 1 pillar page and 12 supporting articles mapped."',
                  outputMeta: ['Pillar + 12 Clusters', 'No Em Dashes', 'Strong Topic Coverage'],
                },
                {
                  label: 'BOFU · Ready to Buy',
                  input: 'Healthcare Software Integration',
                  outputTitle: 'Healthcare Data Migration Roadmap',
                  outputBody:
                    '"Ranked first in the publishing order. Written for technical buyers and compliance teams, with a 2,600-word walkthrough, internal links, and compliance notes."',
                  outputMeta: ['Ready to Buy', 'Priority #1', 'High Search Value'],
                },
                {
                  label: 'Competitor Gap · Brief',
                  input: 'AI Document Scanning for Shipping',
                  outputTitle: 'Document Scanning Brief for Shipping Teams',
                  outputBody:
                    '"Most competitor articles stay generic. This brief adds 5 speed benchmarks, 3 diagrams, and clear section headings to win the featured snippet."',
                  outputMeta: ['Full Brief', 'Competitor Gap', 'E‑E‑A‑T Signals'],
                },
              ]}
            />

            {/* 3. Topic Cloud — sample generated topics */}
            <LandingTopicCloud />

            {/* 4. Silo Architecture visual */}
            <LandingSiloArchitecture />

            {/* 5. Features grid */}
            <LandingFeatures
              sectionLabel="Why This Tool?"
              heading="From Niche to Full Content Plan"
              subheading="Get more than topic ideas. Get silo mapping, an interlinking strategy, and a clear publishing order."
              features={FEATURES}
              columns={3}
            />

            {/* 6. Content Pillars — what you get */}
            <LandingContentPillars />

            {/* 7. How it works */}
            <LandingHowItWorks
              sectionLabel="How It Works"
              heading="From Niche to Content Plan in 4 Steps"
              subheading="Enter your niche, set your goals, and let the AI build your complete editorial strategy."
              steps={STEPS}
            />

            {/* 8. Trust section */}
            <TrustSection />

            {/* 9. FAQ */}
            <LandingFAQ
              sectionLabel="Frequently Asked Questions"
              heading="Blog Topic & Silo FAQs"
              subheading="Common questions about generating topics, silos, and master briefs with this tool."
              faqs={FAQS}
            />

            {/* 10. Bespoke Topic Blueprint Final CTA */}
            <LandingTopicBlueprintCTA onCta={scrollToTool} />
          </>
        )}
      </div>
    </>
  )
}
