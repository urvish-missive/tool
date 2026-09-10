import { useEffect, useRef, useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  PenTool,
  Target,
  Layers,
  Compass,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  MessageSquare,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'
import {
  LandingHero,
  LandingMarquee,
  LandingFunnelFlow,
  LandingPillCloud,
  LandingDarkImpact,
  LandingFeatures,
  LandingHowItWorks,
  LandingStats,
  LandingAnimatedStats,
  LandingFAQ,
  LandingCTA,
  LandingLiveDemo,
} from '../components/landing'
import BlogIntroGeneratorPage from '../tools/blog-intro-generator/BlogIntroGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Blog Introduction Generator by Missive Digital',
  description:
    'Free AI-powered blog introduction generator by Missive Digital. Create high-converting TOFU, MOFU, and BOFU blog hooks and introductions in seconds.',
  url: 'https://tools.missivedigital.com/blog-intro-generator',
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
    ratingValue: '4.8',
    ratingCount: '240',
  },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a blog introduction generator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A blog introduction generator is an AI-powered tool that creates compelling opening paragraphs for blog posts. It generates multiple hook types, including curiosity gaps, statistics, story-led, PAS frameworks, and ROI verdicts, each optimized for different funnel stages (TOFU, MOFU, BOFU) to maximize reader engagement and reduce bounce rate.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many blog introductions can I generate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can generate up to 15 blog introduction variations per request, distributed across TOFU (Awareness), MOFU (Consideration), and BOFU (Decision) funnel stages. Each variation uses a different psychological hook formula and emotional trigger to maximize conversion.',
      },
    },
    {
      '@type': 'Question',
      name: 'What funnel stages does this tool support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The tool supports three funnel stages. TOFU (Top of Funnel / Awareness) uses curiosity gaps and statistics, MOFU (Middle of Funnel / Consideration) uses Problem-Agitate-Solve frameworks, and BOFU (Bottom of Funnel / Decision) uses direct ROI verdicts and proof-driven hooks.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Blog Introduction Generator free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the Blog Introduction Generator by Missive Digital is completely free to use with no sign-up required. You can generate unlimited blog introductions across all funnel stages without any cost.',
      },
    },
  ],
}

/* ─────────────── Feature Data ─────────────── */
const FEATURES = [
  {
    icon: Target,
    title: 'Funnel-Optimized Hooks',
    description:
      'Generate introductions tailored to TOFU (Awareness), MOFU (Consideration), and BOFU (Decision) stages, each using a different psychological trigger.',
  },
  {
    icon: Layers,
    title: '9 Hook Formulas',
    description:
      'Curiosity Gap, Statistics Bomb, Myth Buster, PAS Framework, Problem-Solution, ROI Verdict, Social Proof, Bold Statement, and Story-Led hooks.',
  },
  {
    icon: MessageSquare,
    title: '8 Tone Options',
    description:
      'Conversational, Authoritative, Storytelling, Fun, Bold, Empathetic, Witty, or Data-Driven. Pick the tone that matches your brand voice.',
  },
  {
    icon: PenTool,
    title: 'H2 Bridge Transitions',
    description:
      'Every intro includes a seamless bridge sentence that connects the hook to your first subheading, keeping readers scrolling.',
  },
  {
    icon: Zap,
    title: 'AI-Powered, Not Template-Based',
    description:
      'Powered by Google Gemini, Groq, or OpenRouter, generating psychologically validated introductions, not generic fill-in-the-blank templates.',
  },
  {
    icon: BookOpen,
    title: 'SEO & E‑E‑A‑T Compliant',
    description:
      "Every output follows Google's E‑E‑A‑T (Experience, Expertise, Authoritativeness, Trustworthiness) quality guidelines and SEO best practices.",
  },
]

const STEPS = [
  {
    icon: PenTool,
    title: 'Enter Your Blog Topic',
    description: 'Type your blog post title or topic. Be specific for higher-converting hooks.',
  },
  {
    icon: Compass,
    title: 'Choose Funnel Stage',
    description: 'Select TOFU, MOFU, BOFU, or all three for a balanced mix of hooks.',
  },
  {
    icon: Sparkles,
    title: 'AI Generates Intros',
    description:
      'Our AI analyzes search intent and psychological triggers to craft high-converting openings.',
  },
  {
    icon: CheckCircle2,
    title: 'Copy & Publish',
    description: 'Review, favorite, and copy your best intro. Export as Markdown for your CMS.',
  },
]

const STATS = [
  { value: '8', label: 'Tone-of-voice profiles available' },
  { value: '3', label: 'Funnel stages covered (TOFU, MOFU, BOFU)' },
  { value: '15', label: 'Max unique hooks per generation' },
  { value: '15s-20s', label: 'Real-time AI generation speed' },
]

const RETENTION_STATS = [
  {
    value: '82%',
    label: 'First-Scroll Retention',
    sub: 'Readers continue past the opening hook into H2',
    gradient: 'from-[#0C81F3] to-[#67A7FF]',
  },
  {
    value: '4.2m',
    label: 'Average Time on Page',
    sub: 'Driven by curiosity gaps and narrative tension',
    gradient: 'from-[#67A7FF] to-[#EB8988]',
  },
  {
    value: '0',
    label: 'Robotic Buzzwords',
    sub: 'Zero throat-clearing clichés or em dashes',
    gradient: 'from-[#EB8988] to-[#FFB7B2]',
  },
  {
    value: '48%',
    label: 'Higher CTA Click-Through',
    sub: 'More readers reach your conversion bridge',
    gradient: 'from-[#0C81F3] to-[#EB8988]',
  },
]

const FAQS = [
  {
    question: 'What is a blog introduction generator?',
    answer:
      'A blog introduction generator is an AI-powered tool that creates compelling opening paragraphs for blog posts. It generates multiple hook types, including curiosity gaps, statistics, story-led, PAS frameworks, and ROI verdicts, each optimized for different funnel stages (TOFU, MOFU, BOFU) to maximize reader engagement and reduce bounce rate.',
    tag: 'Basics',
  },
  {
    question: 'How many blog introductions can I generate at once?',
    answer:
      'You can generate 6, 9, 12, or 15 variations per request. The default is 9, which is 3 per funnel stage (TOFU, MOFU, BOFU). Each variation uses a different psychological hook formula and emotional trigger.',
    tag: 'Output',
  },
  {
    question: 'What funnel stages does this tool support?',
    answer:
      'The tool supports three funnel stages. TOFU (Top of Funnel / Awareness) uses curiosity gaps and statistics for cold audiences, MOFU (Middle of Funnel / Consideration) uses Problem-Agitate-Solve frameworks for warm leads, and BOFU (Bottom of Funnel / Decision) uses ROI verdicts and proof-driven hooks for ready-to-buy readers.',
    tag: 'Funnel',
  },
  {
    question: 'Is the Blog Introduction Generator free?',
    answer:
      'Yes, the Blog Introduction Generator by Missive Digital is completely free to use. No sign-up, no credit card, no limits. Generate unlimited blog introductions across all funnel stages.',
    tag: 'Pricing',
  },
  {
    question: 'Can I customize the tone of voice?',
    answer:
      'Yes. Choose from 8 tones, including Conversational & Engaging, Authoritative & Thought-Leadership, Storytelling & Narrative, Fun & Playful, Bold & Disruptive, Empathetic & Supportive, Witty & Energetic, or Analytical & Data-Driven.',
    tag: 'Tone',
  },
  {
    question: 'What AI model powers the introductions?',
    answer:
      'You can choose between Google Gemini, Groq, or OpenRouter models. Each uses advanced language understanding to generate psychologically validated hooks, not generic templates.',
    tag: 'Engine',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const items = [
    { icon: Users, value: '12,000+', label: 'Content strategists & editors' },
    { icon: BarChart3, value: '185,000+', label: 'Opening hooks generated' },
    { icon: ShieldCheck, value: '12-Pillar', label: 'Content QA framework compliant' },
  ]

  return (
    <LandingAnimatedStats
      sectionLabel="Built by SEO Experts"
      heading="Trusted by 12,000+ Content Marketers"
      subheading="Built by Himani Kankaria, an SEO strategist with 15+ years of experience optimizing content for Google's E‑E‑A‑T guidelines."
      stats={items}
    />
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function BlogIntroLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewIntro = () => {
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
        <title>Multiple Blog Introduction Generator - Free Tool | Missive Digital</title>
        <meta
          name="description"
          content="Generate multiple high-converting blog post introductions across TOFU, MOFU, and BOFU stages. 9 hook formulas, 8 tone profiles, Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="blog introduction generator, blog hook generator, blog opening generator, content writing tool, blog intro ideas, TOFU MOFU BOFU content, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/blog-intro-generator" />
        <meta
          property="og:title"
          content="Multiple Blog Introduction Generator - Free Tool | Missive Digital"
        />
        <meta
          property="og:description"
          content="Generate multiple high-converting blog post introductions across TOFU, MOFU, and BOFU stages. Free, no sign-up."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/blog-intro-generator" />
        <meta property="og:site_name" content="Missive's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Introduction Generator by Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate high-converting blog introductions in seconds. Free, AI-powered, funnel-optimized."
        />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-white ${hasResults ? 'pt-20' : ''}`}>
        {/* ═══════════════ 1. HERO WITH FLOATING GLASS CARDS ═══════════════ */}
        <LandingHero
          hideHeroCopy={hasResults}
          badge="Missive's SEO Tools • Missive Digital"
          title={[
            { text: 'Generate High-Converting ' },
            { text: 'Blog Introductions', gradient: true },
            { text: ' in Seconds' },
          ]}
          subtitle="AI-powered blog hooks for every funnel stage, TOFU (Awareness), MOFU (Consideration), and BOFU (Decision). 9 psychological formulas, 8 tones, zero writer's block."
          ctaLabel="Start Generating Free"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See 9 Hook Formulas ↓',
            onClick: () => scrollToSection('frameworks'),
          }}
          trustBadges={[
            'No sign-up required',
            'Free to use',
            'SEO & E‑E‑A‑T optimized',
            'Unlimited generations',
          ]}
          toolRef={toolRef}
          toolLabel={
            hasResults ? 'Active Blog Introductions' : 'Generate Blog Introductions • Live'
          }
          toolSlot={
            <BlogIntroGeneratorPage
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
              badge="See It Think"
              heading="Watch a Blog Intro Get Written Live"
              subheading="Type a topic, pick a funnel stage, and watch the AI craft a psychologically validated hook in seconds."
              accentIcon={Target}
              examples={[
                {
                  label: 'TOFU · Curiosity Gap',
                  input: 'How to Scale Organic Traffic with Programmatic SEO',
                  outputTitle: 'Curiosity Gap Hook',
                  outputBody:
                    '"93% of SaaS founders are one algorithm update away from losing their entire organic pipeline. Here\'s the programmatic framework that made ours update-proof."',
                  outputMeta: ['TOFU', 'Curiosity Gap', '38 words'],
                },
                {
                  label: 'MOFU · PAS Framework',
                  input: 'B2B Content Marketing ROI Measurement',
                  outputTitle: 'Problem-Agitate-Solve Hook',
                  outputBody:
                    '"Most B2B teams track vanity metrics while pipeline attribution stays a mystery. The 3-metric framework below fixes that in one sprint."',
                  outputMeta: ['MOFU', 'PAS Framework', '31 words'],
                },
                {
                  label: 'BOFU · ROI Verdict',
                  input: 'Enterprise SEO Tooling Comparison',
                  outputTitle: 'ROI Verdict Hook',
                  outputBody:
                    '"We audited 40 enterprise SEO stacks. Only 3 paid for themselves inside 90 days. Here is the exact criteria that separated them."',
                  outputMeta: ['BOFU', 'ROI Verdict', '29 words'],
                },
              ]}
            />

            {/* ═══════════════ 4. INTERACTIVE FUNNEL FLOW VISUALIZER ═══════════════ */}
            <LandingFunnelFlow onTryTool={scrollToTool} />

            {/* ═══════════════ 5. STATS ROW ═══════════════ */}
            <LandingStats stats={STATS} />

            {/* ═══════════════ 6. FEATURES GRID (UPGRADED CARDS) ═══════════════ */}
            <LandingFeatures
              sectionLabel="Why This Tool?"
              heading="Blog Introductions That Actually Convert"
              subheading="Most blog intros fail because they're generic. Our AI generates psychologically validated openings tailored to your funnel stage and audience."
              features={FEATURES}
              columns={3}
            />

            {/* ═══════════════ 7. SIGNATURE FLOATING PILL CLOUD ═══════════════ */}
            <LandingPillCloud />

            {/* ═══════════════ 8. HOW IT WORKS (STEP CARDS) ═══════════════ */}
            <LandingHowItWorks
              sectionLabel="How It Works"
              heading="From Blank Page to Converting Intros in 4 Steps"
              subheading="No complex setup. Enter your topic, select your audience parameters, and let the AI generate 6-15 tailored options."
              steps={STEPS}
            />

            {/* ═══════════════ 9. SIGNATURE DARK IMPACT SECTION (#171720) ═══════════════ */}
            <LandingDarkImpact stats={RETENTION_STATS} onCtaClick={scrollToTool} />

            {/* ═══════════════ 10. TRUST / E‑E‑A‑T SECTION ═══════════════ */}
            <TrustSection />

            {/* ═══════════════ 11. FAQ ACCORDION ═══════════════ */}
            <LandingFAQ
              sectionLabel="Frequently Asked Questions"
              heading="Blog Intro Generator FAQs"
              subheading="Common questions about hook formulas, funnel stages, and tone options."
              faqs={FAQS}
            />

            {/* ═══════════════ 12. FINAL RADIANT CTA ═══════════════ */}
            <LandingCTA
              heading="Stop Writing Boring Blog Intros"
              subheading="Try the Blog Intro Generator free. Create psychologically validated openings that reduce bounce rates and boost engagement. No sign-up required."
              ctaLabel="Write My Blog Intro"
              ctaOnClick={scrollToTool}
            />
          </>
        )}
      </div>
    </>
  )
}
