import { useEffect, useRef, useCallback, useState } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  Target,
  Layers,
  TrendingUp,
  Compass,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  MessageSquare,
  BookOpen,
  PenTool,
  ShieldCheck,
  Ban,
  RefreshCw,
  Lightbulb,
  ClipboardList,
  Check,
  ArrowUpRight,
  ArrowLeft,
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
  LandingConclusionAnatomy,
  LandingBannedWordsWall,
  LandingFrameworksGallery,
  LandingLiveDemo,
  LandingResultsTopbar,
} from '../components/landing'
import BlogConclusionGeneratorPage from '../tools/blog-conclusion-generator/BlogConclusionGeneratorPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Blog Conclusion Generator: Missive Digital',
  description:
    'Free AI-powered blog conclusion generator by Missive Digital. Create specific, loop-closing blog conclusions with custom H2 headlines and high-converting CTAs for TOFU, MOFU, and BOFU stages.',
  url: 'https://tools.missivedigital.com/blog-conclusion-generator',
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
    ratingCount: '280',
  },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a blog conclusion generator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A blog conclusion generator is an AI-powered tool that writes high-converting ending sections for blog posts. It closes the open loops from your introduction, delivers specific takeaway headlines (never generic "In Conclusion" text), and bridges the reader to a measurable next action: a demo, trial, download, or related post.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why shouldn\'t a blog conclusion just say "In Conclusion"?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Generic "In Conclusion" or "To Sum Up" headings signal to both readers and Google that the content is padded and low-value. A specific, benefit-driven H2 headline (for example: "How to Cut CAC by 30% in 90 Days") improves dwell time, reduces bounce rates, and reinforces topical depth: all of which are E-E-A-T quality signals Google evaluates.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does this tool close intro open loops?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you paste your blog introduction, the AI analyzes the curiosity gaps, questions, and promises made in the opening. It then synthesizes conclusions that explicitly resolve those threads, ensuring the reader feels the article delivered on its core premise.',
      },
    },
    {
      '@type': 'Question',
      name: 'What funnel stages does the Blog Conclusion Generator support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The tool supports TOFU (Awareness) conclusions focused on mindset shifts and low-friction CTAs, MOFU (Consideration) conclusions with framework recaps and resource lead magnets, and BOFU (Decision) conclusions with direct ROI verdicts and consultation or trial CTAs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does this tool follow Missive QA standards?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Every conclusion strictly follows Himani Kankaria's 12-Pillar Content QA framework: zero em dashes, zero robotic clichés, quantifiable E-E-A-T proof metrics, insight-first structure, and high visual scannability.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Blog Conclusion Generator free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Blog Conclusion Generator by Missive Digital is 100% free with no sign-up required. Generate multiple conclusion variations across all funnel stages, copy them directly, or export as Markdown for your CMS.',
      },
    },
  ],
}

/* ─────────────── Feature Data ─────────────── */
const FEATURES = [
  {
    icon: Target,
    title: 'Specific, Benefit-Driven H2 Headlines',
    description:
      'Never write "In Conclusion" again. Every conclusion receives a specific, benefit-driven H2 that reinforces what the reader achieved: improving dwell time, E-E-A-T, and search rankings.',
  },
  {
    icon: Layers,
    title: 'Funnel-Stage-Aware CTAs',
    description:
      'TOFU conclusions drive curiosity and newsletter opt-ins. MOFU conclusions present framework downloads and checklists. BOFU conclusions deliver ROI verdicts and direct trial or demo CTAs.',
  },
  {
    icon: MessageSquare,
    title: 'Intro Loop Closure',
    description:
      'Paste your blog introduction and the AI identifies every open loop: unanswered questions, teased data, and promised insights: then resolves them explicitly in the conclusion.',
  },
  {
    icon: ShieldCheck,
    title: 'Missive 12-Pillar QA Certified',
    description:
      "Built strictly on Himani Kankaria's QA rules: zero em dashes, zero robotic buzzwords (delve, tapestry, game changer), 3+ concrete metrics, and short scannable paragraphs.",
  },
  {
    icon: Zap,
    title: '8 Distinct Tone Profiles',
    description:
      'Authoritative, Conversational, Storytelling, Fun, Bold, Empathetic, Witty, or Data-Driven: match your brand voice and reader expectations with high fidelity.',
  },
  {
    icon: BookOpen,
    title: 'SEO & Google E-E-A-T Compliant',
    description:
      "Every output follows Google's E-E-A-T quality rater guidelines: specific, experience-led, authoritative, and defensible: with zero filler summaries.",
  },
]

const STEPS = [
  {
    icon: PenTool,
    title: 'Enter Your Blog Topic',
    description:
      'Type the title or main topic of your blog post. Be specific for conclusions that fit your exact strategic context.',
  },
  {
    icon: Compass,
    title: 'Paste the Introduction (Optional)',
    description:
      'Paste your opening paragraph. The AI extracts open curiosity loops and resolves them explicitly in your conclusion.',
  },
  {
    icon: Sparkles,
    title: 'Pick Funnel Stage & Tone',
    description:
      'Select TOFU, MOFU, or BOFU, select your desired CTA goal, and let the AI synthesize specific H2 headlines and CTA bridges.',
  },
  {
    icon: CheckCircle2,
    title: 'Copy, Export & Publish',
    description:
      'Review each conclusion card, copy the H2, body, or full CTA bridge, star favorites, or export the complete set as Markdown.',
  },
]


const STATS = [
  { value: '0', label: 'Generic "In Conclusion" headings' },
  { value: '100%', label: 'Intro open loop resolution rate' },
  { value: '42%', label: 'Higher CTA click-through rate' },
  { value: '20-30 sec', label: 'Average generation time' },
]

const FAQS = [
  {
    question: 'What is a blog conclusion generator?',
    answer:
      'A blog conclusion generator is an AI-powered tool that writes high-converting ending sections for blog posts. It generates specific, non-generic H2 headlines, closes the open loops from your introduction, and bridges the reader to a measurable next action: demo, trial, download, related post, or comment.',
    tag: 'Basics',
  },
  {
    question: 'Why does Missive Digital ban "In Conclusion" headings?',
    answer:
      'Generic headings like "In Conclusion" or "Wrapping Up" tell readers that no new information is coming, triggering an immediate bounce back to Google. Replacing them with specific, benefit-driven H2 headlines reinforces the primary takeaway, boosts dwell time, and signals topical authority to search engine crawlers.',
    tag: 'Headlines',
  },
  {
    question: 'How do Missive QA checklist rules apply to blog conclusions?',
    answer:
      "Conclusions generated by this tool strictly enforce Himani Kankaria's 12-Pillar Content QA standard: zero em dashes or double hyphens, zero robotic clichés (delve, tapestry, beacon, game changer, plethora), at least 3 concrete quantifiable metrics, and tight 1 to 3 sentence scannable paragraphs.",
    tag: 'QA Rules',
  },
  {
    question: 'How many conclusions can I generate at once?',
    answer:
      'You can generate 3, 6, or 9 conclusion variations per request. When you select "All Funnel Stages", you receive a balanced distribution across TOFU (Awareness), MOFU (Consideration), and BOFU (Decision), each utilizing a distinct psychological framework.',
    tag: 'Output',
  },
  {
    question: 'Do I need to paste my blog introduction?',
    answer:
      'Pasting your introduction is optional but strongly recommended. When provided, our engine inspects the opening promises and tension points, then explicitly resolves them in the conclusion. This loop closure creates a deeply satisfying reader experience that directly increases conversion rates.',
    tag: 'Inputs',
  },
  {
    question: 'Can I customize the call to action?',
    answer:
      'Yes. Choose from six CTA goals: Book a Strategy Call or Demo, Start Free Trial or Sign Up, Download Checklist or Guide, Read Next Related Post, Leave a Comment or Discuss, or Custom Call to Action. For custom CTAs, simply input your exact button copy and the AI weaves it into the narrative bridge.',
    tag: 'CTAs',
  },
  {
    question: 'Is the Blog Conclusion Generator free to use?',
    answer:
      'Yes. The Blog Conclusion Generator by Missive Digital is 100% free with no sign-up required, no credit card, and no usage caps. Generate, copy, and export conclusions across all funnel stages at no cost.',
    tag: 'Pricing',
  },
]

/* ─────────────── Conclusion Funnel Stages Data for LandingFunnelFlow ─────────────── */
const CONCLUSION_FUNNEL_STAGES = [
  {
    id: 'tofu',
    stage: 'TOFU (Top of Funnel)',
    tagline: 'Awareness & Mindset Shifts',
    badge: 'Cold Readers',
    icon: Compass,
    accent: 'sky',
    gradient: 'from-sky-500 to-blue-600',
    borderActive: 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg shadow-sky-500/15',
    pillBg: 'bg-sky-50 text-sky-700 border-sky-200',
    goal: 'Synthesize the mental model shift, eliminate reactive shortcuts, and invite low-friction ongoing engagement.',
    formulas: [
      'The Perspective Shift & Open Loop Closer',
      'The Big-Picture Horizon',
      'The Contrarian Challenge',
    ],
    sampleTitle: 'The Verdict: Turning Organic Architecture Into Your Moat',
    sampleHook:
      '## The Verdict: Turning Organic Architecture Into Your Lasting Moat\n\nRemember the question we started with? Mastering organic reach is not about chasing every new tactic. It is about mastering the underlying fundamentals that compound quarter over quarter.\n\nThe difference between teams that struggle and those that lead is deliberate consistency in execution.',
    sampleBridge:
      'Where will your team focus your efforts first? Choose one high-impact principle from this guide and benchmark your current workflow this week.',
    metric: '3.4x Reader Dwell Time',
  },
  {
    id: 'mofu',
    stage: 'MOFU (Middle of Funnel)',
    tagline: 'Consideration & Implementation',
    badge: 'Warm Leads',
    icon: TrendingUp,
    accent: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    borderActive: 'border-amber-500 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/15',
    pillBg: 'bg-amber-50 text-amber-700 border-amber-200',
    goal: 'Summarize decision criteria, provide an actionable implementation blueprint, and drive lead magnet downloads.',
    formulas: [
      'The Execution Blueprint & Download',
      'The Comparison Verdict & Decision Matrix',
      'The Common Pitfall Warning',
    ],
    sampleTitle: 'Your Implementation Blueprint: Putting Content Architecture to Work',
    sampleHook:
      '## Your Implementation Blueprint: Putting Content Architecture to Work\n\nThe concepts we broke down are not theoretical. They represent the exact operational playbook needed to execute modern content QA with confidence.\n\nStart with a structured audit of your highest-priority landing pages before scaling across the organization.',
    sampleBridge:
      'To make rollout effortless, download our 12-point pre-flight checklist containing all formulas, benchmarks, and QA rules covered in this guide.',
    metric: '34% Lead Magnet Opt-Ins',
  },
  {
    id: 'bofu',
    stage: 'BOFU (Bottom of Funnel)',
    tagline: 'Decision & High-Intent ROI',
    badge: 'Ready to Convert',
    icon: Target,
    accent: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/15',
    pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    goal: 'Establish definitive commercial ROI, highlight the compounding cost of delay, and prompt direct trial or demo action.',
    formulas: [
      'The Definitive ROI Verdict & Free Trial',
      'The Cost of Inaction & Demo Booking',
      'The Fast-Track Implementation Pitch',
    ],
    sampleTitle: "The Bottom Line: Don't Let Inaction Delay Your Pipeline",
    sampleHook:
      "## The Bottom Line: Don't Let Inaction Delay Your Organic Pipeline\n\nEvery month your team delays modernizing your content operations, the compounding cost of inaction quietly increases.\n\nTop performers choose momentum. With verified QA guardrails supporting your workflow, your team can begin seeing validated impact in as little as 14 days.",
    sampleBridge:
      'Ready to see how much faster your team can ship rank-ready copy? Test drive our platform today and unlock full access with zero commitments.',
    metric: '42% Higher CTA Clicks',
  },
]

/* ─────────────── Conclusion Signature Pills for LandingPillCloud ─────────────── */
const CONCLUSION_PILLS = [
  {
    text: 'Specific H2 Hook Closures',
    color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    icon: Target,
  },
  {
    text: 'Zero Robotic Buzzwords',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    icon: Ban,
  },
  {
    text: 'Intro Loop Resolution',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    icon: RefreshCw,
  },
  {
    text: 'TOFU Mindset Shifts',
    color: 'bg-blue-50 text-[#0C81F3] border-blue-200 hover:bg-blue-100',
    icon: Lightbulb,
  },
  {
    text: 'MOFU Blueprint Downloads',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    icon: ClipboardList,
  },
  {
    text: 'BOFU High-Intent Demos',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    icon: Zap,
  },
  {
    text: 'Strictly Zero Em Dashes',
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    icon: PenTool,
  },
  {
    text: 'Definitive ROI Verdicts',
    color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    icon: TrendingUp,
  },
  {
    text: 'Google E-E-A-T Aligned',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    icon: Check,
  },
  {
    text: 'Cost of Delay Urgency',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    icon: Clock,
  },
  {
    text: 'Contextual CTA Bridges',
    color: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100',
    icon: ArrowUpRight,
  },
  {
    text: '12-Pillar Missive QA',
    color: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: ShieldCheck,
  },
]

/* ─────────────── Trust Section ─────────────── */
function TrustSection() {
  const items = [
    { icon: Users, value: '2,000+', label: 'Active content strategists monthly' },
    { icon: BarChart3, value: '50,000+', label: 'Conclusions generated and published' },
    { icon: Clock, value: '20-30 sec', label: 'Average generation and audit time' },
  ]

  return (
    <LandingAnimatedStats
      sectionLabel="Built by SEO Strategists"
      heading="Trusted by Content Teams Who Care About Ending Strong"
      subheading="Built by Himani Kankaria, an SEO strategist with 10+ years of experience optimizing enterprise copy for Google's quality guidelines and direct reader conversions."
      stats={items}
    />
  )
}

/* ─────────────── E-E-A-T Authority Banner (Uniform Spacing) ─────────────── */
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
              title: 'Loop-Closure & CTA Certified',
              text: 'Resolves every open curiosity hook from your intro and bridges the reader to a measurable commercial step.',
            },
            {
              icon: CheckCircle2,
              title: 'E-E-A-T Quality Safeguards',
              text: 'Ensures conclusions deliver topical closure, author authority, and defensible action steps.',
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

/* ─────────────── Main Landing Page Component ─────────────── */
export default function BlogConclusionLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewConclusion = () => {
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
        <title>Blog Conclusion Generator: Free AI Tool | Missive Digital</title>
        <meta
          name="description"
          content="Generate high-converting blog conclusions in seconds. AI-powered specific H2 headlines, intro loop closure, and funnel-matched CTAs for TOFU, MOFU, and BOFU stages. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="blog conclusion generator, blog ending generator, AI blog conclusion, blog CTA generator, TOFU MOFU BOFU conclusion, blog wrap-up tool, content marketing tool, SEO blog conclusion, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/blog-conclusion-generator" />
        <meta
          property="og:title"
          content="Blog Conclusion Generator: Free AI Tool | Missive Digital"
        />
        <meta
          property="og:description"
          content="Generate specific, loop-closing blog conclusions with custom H2 headlines and high-converting CTAs. AI-powered, funnel-optimized, free."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://tools.missivedigital.com/blog-conclusion-generator"
        />
        <meta property="og:site_name" content="Missive Digital: Himani's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Conclusion Generator: Missive Digital" />
        <meta
          name="twitter:description"
          content="Generate specific, loop-closing blog conclusions with custom H2 headlines and high-converting CTAs. Free, AI-powered, funnel-optimized."
        />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-white ${hasResults ? 'pt-20' : ''}`}>
        {hasResults && (
          <LandingResultsTopbar
            onBack={handleNewConclusion}
            backLabel="New Conclusion Search"
            backHint="Start Over"
            title="Generated Blog Conclusions Workspace"
            badge="Live Conclusions"
          />
        )}

        {/* ═══════════════ 1. HERO WITH CUSTOM FLOATING GLASS CARDS ═══════════════ */}
        <LandingHero
          hideHeroCopy={hasResults}
          badge="Himani's SEO Tools • Missive Digital"
          title={[
            { text: 'Turn Reader Attention into ' },
            { text: 'Measurable Commercial Action', gradient: true },
            { text: ': With Conclusions That Actually Close the Loop' },
          ]}
          subtitle="Most blog conclusions waste the trust and attention earned earlier in the post. Our AI writes specific H2 headlines, resolves every open loop from your introduction, and bridges the reader to a measurable next action: demo, trial, download, or related article."
          ctaLabel="Start Generating Free →"
          ctaOnClick={scrollToTool}
          secondaryCta={{
            label: 'See Conclusion Anatomy ↓',
            onClick: () => scrollToSection('anatomy'),
          }}
          trustBadges={[
            'No sign-up required',
            '100% free forever',
            'Missive 12-Pillar QA Certified',
            'Loop-closing conclusions',
          ]}
          toolRef={toolRef}
          toolLabel={hasResults ? 'Active Blog Conclusions' : 'Generate Blog Conclusions • Live'}
          toolSlot={
            <BlogConclusionGeneratorPage
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
          badge="See It Close the Loop"
          heading="Watch a Conclusion Get Engineered Live"
          subheading="Paste your topic and intro, and watch the AI resolve every open loop into a specific H2 and CTA bridge."
          accentIcon={ShieldCheck}
          examples={[
            {
              label: 'BOFU · ROI Verdict',
              input: 'Enterprise Content QA Automation',
              outputTitle: 'The Bottom Line: Don\'t Let Inaction Delay Your Pipeline',
              outputBody:
                'Every month your team delays automating QA, the compounding cost of inaction quietly increases. Start your trial today with zero commitments.',
              outputMeta: ['BOFU', 'Zero Em Dashes', '100% Loop Closure'],
            },
            {
              label: 'MOFU · Blueprint Recap',
              input: 'Content Operations Audit Framework',
              outputTitle: 'Your Implementation Blueprint: Putting the Audit to Work',
              outputBody:
                'The concepts above are not theoretical. Download our 12-point checklist to roll this out across your editorial team this quarter.',
              outputMeta: ['MOFU', 'Lead Magnet CTA', '34% Opt-In Lift'],
            },
            {
              label: 'TOFU · Mindset Shift',
              input: 'Programmatic SEO Content Architecture',
              outputTitle: 'The Verdict: Turning Architecture Into Your Moat',
              outputBody:
                'Mastering organic reach is not about chasing tactics. It is about the fundamentals that compound quarter over quarter. Benchmark your workflow this week.',
              outputMeta: ['TOFU', 'Perspective Shift', '3.4x Dwell Time'],
            },
          ]}
        />

        {/* ═══════════════ 4. INTERACTIVE CONCLUSION FUNNEL FLOW VISUALIZER ═══════════════ */}
        <LandingFunnelFlow
          stages={CONCLUSION_FUNNEL_STAGES}
          badge="Conversion Architecture"
          heading={
            <>
              Conclusions Engineered Across the{' '}
              <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                Entire Funnel
              </span>
            </>
          }
          subheading="A generic ending treats every visitor the same. Our generator adapts takeaway depth and CTA triggers to where your reader is in their buying journey."
          sampleLabel1="Specific H2 & Loop-Closing Synthesis:"
          sampleLabel2="Contextual Call-to-Action Bridge:"
          ctaButtonText={(s) => `Generate ${s.id.toUpperCase()} Conclusions Now`}
          onTryTool={scrollToTool}
        />

        {/* ═══════════════ 5. STATS ROW ═══════════════ */}
        <LandingStats stats={STATS} />

        {/* ═══════════════ 6. FEATURES GRID ═══════════════ */}
        <LandingFeatures
          sectionLabel="Why This Tool?"
          heading="Conclusions That Convert: Not Just Summarize"
          subheading="A great conclusion does not repeat the article. It resolves the tension you built, reinforces the core promise, and moves the reader to one specific, measurable next step."
          features={FEATURES}
          columns={3}
        />

        {/* ═══════════════ 7. NEW VISUAL SECTION: ANATOMY OF A 10/10 CONCLUSION ═══════════════ */}
        <LandingConclusionAnatomy />

        {/* ═══════════════ 8. NEW VISUAL SECTION: BANNED WORDS WALL VS MISSIVE STANDARDS ═══════════════ */}
        <LandingBannedWordsWall />

        {/* ═══════════════ 9. NEW VISUAL SECTION: 12 CONCLUSION FRAMEWORKS GALLERY ═══════════════ */}
        <LandingFrameworksGallery onTryTool={scrollToTool} />

        {/* ═══════════════ 10. SIGNATURE FLOATING PILL CLOUD ═══════════════ */}
        <LandingPillCloud
          pills={CONCLUSION_PILLS}
          badge="Conversion Psychology"
          heading="Every Conversion Trigger At Your Fingertips"
          subheading="We analyzed top-ranking B2B and SaaS publications to extract the exact ending frameworks that eliminate drop-off and drive measurable next actions."
          note="Hover over any framework to see the depth built into every AI generation."
        />

        {/* ═══════════════ 11. HOW IT WORKS (STEP CARDS) ═══════════════ */}
        <LandingHowItWorks
          sectionLabel="How It Works"
          heading="From Topic to High-Converting Conclusion in 4 Steps"
          subheading="No complex prompts needed. Paste your topic, optionally add your intro, and let the AI close open loops and engineer the CTA bridge."
          steps={STEPS}
        />

        {/* ═══════════════ 12. SIGNATURE DARK IMPACT SECTION (Tailored for Conclusions) ═══════════════ */}
        <LandingDarkImpact
          watermark="CONVERSION"
          badge="The Conclusion Imperative"
          title={
            <>
              The Final 100 Words Decide{' '}
              <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                Your Reader's Next Commercial Move
              </span>
            </>
          }
          subtitle="You spent hours researching, writing, and optimizing. But if your article ends with a generic summary or an abrupt stop, 85% of readers bounce without taking action. A strategic conclusion converts passive attention into pipeline."
          stats={[
            {
              value: '42%',
              label: 'Higher CTA Conversions',
              sub: 'When using contextual bridges vs generic "contact us" endings',
              gradient: 'from-[#0C81F3] to-[#67A7FF]',
            },
            {
              value: '0',
              label: 'Banned Robotic Buzzwords',
              sub: 'Strictly zero em dashes and zero AI clichés',
              gradient: 'from-[#67A7FF] to-[#EB8988]',
            },
            {
              value: '100%',
              label: 'Open Loop Resolution',
              sub: 'Satisfies every promise and question from the intro',
              gradient: 'from-[#EB8988] to-[#FFB7B2]',
            },
            {
              value: '20-30s',
              label: 'Multi-Stage Generation',
              sub: 'Instant TOFU, MOFU, and BOFU variations',
              gradient: 'from-[#0C81F3] to-[#EB8988]',
            },
          ]}
          quote='"The purpose of a conclusion is not to repeat what you already said. It is to give the reader a compelling, actionable reason to take the next step."'
          author="Himani Kankaria, Founder of Missive Digital"
          ctaLabel="Close the Loop: Generate High-Converting Conclusions"
          onCtaClick={scrollToTool}
        />

        {/* ═══════════════ 13. E-E-A-T AUTHORITY BANNER ═══════════════ */}
        <AuthorityBanner />

        {/* ═══════════════ 14. TRUST / E-E-A-T SECTION ═══════════════ */}
        <TrustSection />

        {/* ═══════════════ 15. FAQ ACCORDION ═══════════════ */}
        <LandingFAQ
          sectionLabel="Frequently Asked Questions"
          heading="Blog Conclusion Generator FAQs"
          subheading="Learn how AI-powered conclusions close open loops, drive CTA clicks, and follow Missive's QA standards."
          faqs={FAQS}
        />

          {/* ═══════════════ 16. FINAL RADIANT CTA ═══════════════ */}
          <LandingCTA
            heading="Stop Ending Blog Posts Weakly"
            subheading="Generate high-converting blog conclusions that close loops, reinforce value, and drive measurable action. 100% free with no sign-up required."
            ctaLabel="Generate My Conclusions Free"
            ctaOnClick={scrollToTool}
          />
        </>
      )}
    </div>
  </>
)
}
