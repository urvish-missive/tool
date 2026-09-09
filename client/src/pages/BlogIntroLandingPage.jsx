import { useEffect, useRef, useCallback } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
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
  LandingFAQ,
  LandingCTA,
  LandingLiveDemo,
} from '../components/landing'
import BlogIntroGeneratorPage from '../tools/blog-intro-generator/BlogIntroGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Blog Introduction Generator: Missive Digital',
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
        text: 'The tool supports three funnel stages: TOFU (Top of Funnel / Awareness) with curiosity gaps and statistics, MOFU (Middle of Funnel / Consideration) with Problem-Agitate-Solve frameworks, and BOFU (Bottom of Funnel / Decision) with direct ROI verdicts and proof-driven hooks.',
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
      'Conversational, Authoritative, Storytelling, Fun, Bold, Empathetic, Witty, or Data-Driven: match your brand voice precisely.',
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
      'Powered by Google Gemini, Groq, or OpenRouter: generating psychologically validated introductions, not generic fill-in-the-blank templates.',
  },
  {
    icon: BookOpen,
    title: 'SEO & E-E-A-T Compliant',
    description:
      'Every output follows Google\'s E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) quality guidelines and SEO best practices.',
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
    description: 'Our AI analyzes search intent and psychological triggers to craft high-converting openings.',
  },
  {
    icon: CheckCircle2,
    title: 'Copy & Publish',
    description: 'Review, favorite, and copy your best intro. Export as Markdown for your CMS.',
  },
]

const STATS = [
  { value: '67%', label: 'Lower bounce rate with strong intros' },
  { value: '3x', label: 'More engagement vs generic openings' },
  { value: '9', label: 'Psychological hook formulas' },
  { value: '20-30 sec', label: 'Average generation time' },
]

const FAQS = [
  {
    question: 'What is a blog introduction generator?',
    answer:
      'A blog introduction generator is an AI-powered tool that creates compelling opening paragraphs for blog posts. It generates multiple hook types, including curiosity gaps, statistics, story-led, PAS frameworks, and ROI verdicts, each optimized for different funnel stages (TOFU, MOFU, BOFU) to maximize reader engagement and reduce bounce rate.',
  },
  {
    question: 'How many blog introductions can I generate at once?',
    answer:
      'You can generate 6, 9, 12, or 15 variations per request. The default is 9: 3 per funnel stage (TOFU, MOFU, BOFU). Each variation uses a different psychological hook formula and emotional trigger.',
  },
  {
    question: 'What funnel stages does this tool support?',
    answer:
      'The tool supports three funnel stages: TOFU (Top of Funnel / Awareness) with curiosity gaps and statistics for cold audiences, MOFU (Middle of Funnel / Consideration) with Problem-Agitate-Solve frameworks for warm leads, and BOFU (Bottom of Funnel / Decision) with ROI verdicts and proof-driven hooks for ready-to-buy readers.',
  },
  {
    question: 'Is the Blog Introduction Generator free?',
    answer:
      'Yes, the Blog Introduction Generator by Missive Digital is completely free to use. No sign-up, no credit card, no limits. Generate unlimited blog introductions across all funnel stages.',
  },
  {
    question: 'Can I customize the tone of voice?',
    answer:
      'Yes. Choose from 8 tones: Conversational & Engaging, Authoritative & Thought-Leadership, Storytelling & Narrative, Fun & Playful, Bold & Disruptive, Empathetic & Supportive, Witty & Energetic, or Analytical & Data-Driven.',
  },
  {
    question: 'What AI model powers the introductions?',
    answer:
      'You can choose between Google Gemini, Groq, or OpenRouter models. Each uses advanced language understanding to generate psychologically validated hooks, not generic templates.',
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const headerRef = useScrollReveal()
  const gridRef = useScrollReveal({ threshold: 0.1 })
  const items = [
    { icon: Users, value: '2,000+', label: 'Active users monthly' },
    { icon: BarChart3, value: '50,000+', label: 'Intros generated' },
    { icon: Clock, value: '20-30 sec', label: 'Average generation time' },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="lp-reveal text-center mb-8 sm:mb-12">
          <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2 sm:mb-2.5">
            Built by SEO Experts
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3 leading-tight">
            Trusted by 2,000+ Content Marketers
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            Built by Himani Kankaria, an SEO strategist with 10+ years of experience
            optimizing content for Google's E-E-A-T guidelines.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
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
                <div className="text-2xl xs:text-3xl sm:text-4xl font-black text-slate-900 leading-none mt-1">{item.value}</div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function BlogIntroLandingPage() {
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

  /* Scroll to tool section if URL has #tool-hash */
  useEffect(() => {
    if (window.location.hash === '#tool') {
      setTimeout(scrollToTool, 300)
    }
  }, [scrollToTool])

  return (
    <>
      {/* ── SEO Meta Tags ── */}
      <Helmet>
        <title>Blog Introduction Generator: Free AI Tool | Missive Digital</title>
        <meta
          name="description"
          content="Generate high-converting blog introductions in seconds. AI-powered TOFU, MOFU & BOFU hooks with 9 psychological formulas. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="blog introduction generator, blog hook generator, AI blog intro, TOFU MOFU BOFU intro, blog opening paragraph, content marketing tool, SEO blog intro"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/blog-intro-generator" />
        <meta property="og:title" content="Blog Introduction Generator: Free AI Tool | Missive Digital" />
        <meta
          property="og:description"
          content="Generate high-converting blog introductions in seconds. AI-powered TOFU, MOFU & BOFU hooks with 9 psychological formulas."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/blog-intro-generator" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Introduction Generator: Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate high-converting blog introductions in seconds. Free, AI-powered, funnel-optimized."
        />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className="landing-page min-h-screen bg-white">
        {/* ═══════════════ 1. HERO WITH FLOATING GLASS CARDS ═══════════════ */}
        <LandingHero
          badge="Himani's SEO Tools • Missive Digital"
          title={[
            { text: 'Generate High-Converting ' },
            { text: 'Blog Introductions', gradient: true },
            { text: ' in Seconds' },
          ]}
          subtitle="AI-powered blog hooks engineered across the full funnel: TOFU (Awareness), MOFU (Consideration), and BOFU (Decision). 9 psychological formulas, 8 tones, zero writer's block."
          ctaLabel="Start Generating Free →"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See 9 Hook Formulas ↓',
            onClick: () => scrollToSection('frameworks'),
          }}
          trustBadges={[
            'No sign-up required',
            '100% free',
            'SEO & E-E-A-T optimized',
            'Unlimited generations',
          ]}
          toolRef={toolRef}
          toolLabel="Generate Blog Introductions • Live"
          toolSlot={<BlogIntroGeneratorPage isEmbedded={true} />}
        />

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
          heading="From Topic to High-Converting Intro in 4 Steps"
          subheading="No writing skills needed. Just enter your topic and let the AI do the heavy lifting."
          steps={STEPS}
        />

        {/* ═══════════════ 9. SIGNATURE DARK IMPACT SECTION (#171720) ═══════════════ */}
        <LandingDarkImpact onCtaClick={scrollToTool} />

        {/* ═══════════════ 10. TRUST / E-E-A-T SECTION ═══════════════ */}
        <TrustSection />

        {/* ═══════════════ 11. FAQ ACCORDION ═══════════════ */}
        <LandingFAQ
          sectionLabel="Frequently Asked Questions"
          heading="Blog Intro Generator FAQs"
          subheading="Everything you need to know about creating high-converting blog introductions with AI."
          faqs={FAQS}
        />

        {/* ═══════════════ 12. FINAL RADIANT CTA ═══════════════ */}
        <LandingCTA
          heading="Stop Writing Boring Blog Intros"
          subheading="Try the Blog Intro Generator free. Create psychologically validated openings that reduce bounce rates and boost engagement. No sign-up required."
          ctaLabel="Start Generating Free"
          ctaOnClick={scrollToTool}
        />
      </div>
    </>
  )
}
