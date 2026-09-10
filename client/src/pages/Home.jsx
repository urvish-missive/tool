import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Search,
  Target,
  Lightbulb,
  Palette,
  CheckSquare,
  HelpCircle,
  Swords,
  DollarSign,
  Map,
  TrendingUp,
  Globe,
  Image,
  Zap,
  PenTool,
  Rocket,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowUpRight,
  Quote,
  ArrowDown,
  ArrowRight,
  LayoutGrid,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react'
import { useGetPublicToolsQuery } from '../services/apiSlice'
import useScrollReveal from '../components/landing/useScrollReveal'
import { LandingMarquee, LandingFAQ, LandingCTA } from '../components/landing'

const TOOL_SLUG_MAP = {
  content_analyzer: 'content-analyzer',
  seo_audit: 'seo-audit',
  keyword_research: 'keyword-research',
  blog_topic_generator: 'blog-topics',
  logo_maker: 'logo-maker',
  faq_generator: 'faq-generator',
  competitor_analysis: 'competitor-analyzer',
  seo_roi_calculator: 'seo-roi',
  content_qa: 'content-qa',
  xml_sitemap_generator: 'xml-sitemap-generator',
  google_rank_checker: 'google-rank-checker',
  website_content_extractor: 'website-content-extractor',
  website_image_extractor: 'website-image-extractor',
  website_tech_inspector: 'website-tech-inspector',
  ai_content_writer: 'ai-content-writer',
  blog_intro_generator: 'blog-intro-generator',
  blog_conclusion_generator: 'blog-conclusion-generator',
  eeat_analyzer: 'eeat-analyzer',
  business_competitor_analytics: 'business-competitor-analytics',
  case_study_generator: 'case-study-generator',
}

/* ─────────────── Category Taxonomy ─────────────── */
const CATEGORIES = [
  { id: 'all', label: 'All Tools', icon: LayoutGrid },
  { id: 'content', label: 'Content Creation', icon: PenTool },
  { id: 'seo', label: 'SEO & Site Audits', icon: Search },
  { id: 'research', label: 'Research & Competitive Intel', icon: Target },
]

const TOOLS = [
  {
    id: 'content_analyzer',
    title: 'Content Analyzer',
    description:
      'AI-driven on-page SEO analyzer with real-time scoring, content gaps, readability, and strategic insights.',
    icon: BarChart3,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/content-analyzer',
    badge: 'Free Tool',
    category: 'research',
  },
  {
    id: 'seo_audit',
    title: 'SEO Audit',
    description:
      'Deep technical SEO website crawler analyzing meta tags, headings, schema markup, and performance.',
    icon: Search,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/seo-audit',
    badge: 'Free Tool',
    category: 'seo',
  },
  {
    id: 'keyword_research',
    title: 'Keyword Research',
    description:
      'Discover high-intent keyword opportunities, topic clusters, search intent, and long-tail ideas.',
    icon: Target,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/keyword-research',
    badge: 'Free Tool',
    category: 'research',
  },
  {
    id: 'blog_topic_generator',
    title: 'Blog Topic Generator',
    description:
      'Generate catchy, SEO-optimized blog topic ideas with headlines, target keywords, and content briefs.',
    icon: Lightbulb,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/blog-topic-generator',
    badge: 'Free Tool',
    category: 'content',
  },
  {
    id: 'logo_maker',
    title: 'AI Logo Maker',
    description:
      'Create unique, customizable SVG vector logos for your brand with instant downloads in multiple formats.',
    icon: Palette,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/logo-maker',
    badge: 'Free Tool',
    category: 'content',
  },
  {
    id: 'content_qa',
    title: 'Content QA Checklist',
    description:
      'Comprehensive 12-pillar pre-publish QA checklist to catch errors, polish tone, and verify claims.',
    icon: CheckSquare,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/content-qa',
    badge: 'Free Tool',
    category: 'content',
  },
  {
    id: 'faq_generator',
    title: 'FAQ Generator',
    description:
      'Generate high-converting FAQs formulated to win Google Featured Snippets and valid Schema.org JSON-LD.',
    icon: HelpCircle,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/faq-generator',
    badge: 'Free Tool',
    category: 'content',
  },
  {
    id: 'competitor_analysis',
    title: 'Competitor Analysis',
    description:
      'Reverse-engineer competitor rankings, find content gaps, and get a customized 10x outrank playbook.',
    icon: Swords,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/competitor-analysis',
    badge: 'Free Tool',
    category: 'research',
  },
  {
    id: 'seo_roi_calculator',
    title: 'SEO ROI Calculator',
    description:
      'Model organic growth scenarios, calculate break-even timelines, and build an executive business case.',
    icon: DollarSign,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/seo-roi-calculator',
    badge: 'Free Tool',
    category: 'research',
  },
  {
    id: 'xml_sitemap_generator',
    title: 'XML Sitemap Generator',
    description:
      'Deep crawler creating Google-compliant XML sitemaps with image tags, hreflang alternates, and Search Console readiness.',
    icon: Map,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/xml-sitemap-generator',
    badge: 'New Tool',
    category: 'seo',
  },
  {
    id: 'google_rank_checker',
    title: 'Google Rank Checker',
    description:
      'Real-time Google search rankings with top 10 competitor landscape, SERP features breakdown, and 10x outrank roadmap.',
    icon: TrendingUp,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/google-rank-checker',
    badge: 'New Tool',
    category: 'research',
  },
  {
    id: 'website_content_extractor',
    title: 'Website Content Extractor',
    description:
      'Extract clean text, metadata, schema, and ownership clues with grounded AI Q&A answering anything about the site.',
    icon: Globe,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/website-content-extractor',
    badge: 'New Tool',
    category: 'seo',
  },
  {
    id: 'website_image_extractor',
    title: 'Website Image Extractor',
    description:
      'Extract all high-res images, vector SVGs, logos, and social share graphics with SEO alt text analysis and bulk download.',
    icon: Image,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/website-image-extractor',
    badge: 'New Tool',
    category: 'seo',
  },
  {
    id: 'website_tech_inspector',
    title: 'Website Tech & Theme Inspector',
    description:
      'Extract website theme color palettes, technology stack, CMS, and Google Font typography with 1-click token exports.',
    icon: Zap,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/website-tech-inspector',
    badge: 'New Tool',
    category: 'seo',
  },
  {
    id: 'ai_content_writer',
    title: 'AI Content Writer',
    description:
      'Generate publication-ready, SEO-optimized blog posts, articles, product pages, and landing pages with AI. Includes meta tags, schema, and scoring.',
    icon: PenTool,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/ai-content-writer',
    badge: 'New Tool',
    category: 'content',
  },
  {
    id: 'blog_intro_generator',
    title: 'Multiple Blog Intro Generator',
    description:
      'Generate high-converting, scroll-stopping blog post introductions across TOFU, MOFU, and BOFU funnel categories with psychological conversion hooks.',
    icon: Rocket,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/blog-intro-generator',
    badge: 'New Tool',
    category: 'content',
  },
  {
    id: 'blog_conclusion_generator',
    title: 'Blog Conclusion Generator',
    description:
      'Craft high-impact, search-optimized conclusions featuring specific, creative H2 headlines (never "Conclusion") with intro loop closure and high-converting CTAs.',
    icon: Target,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/blog-conclusion-generator',
    badge: 'New Tool',
    category: 'content',
  },
  {
    id: 'eeat_analyzer',
    title: 'E-E-A-T & AI Authority Analyzer',
    description:
      'Forensically audit Experience, Expertise, Authoritativeness, and Trustworthiness with 1-click E-E-A-T boosters, JSON-LD schema, and AI Overview citation readiness.',
    icon: ShieldCheck,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/eeat-analyzer',
    badge: 'New Tool',
    category: 'research',
  },
  {
    id: 'business_competitor_analytics',
    title: 'Business Competitor Intelligence',
    description:
      'Deep business intelligence on any competitor: history, mergers & acquisitions, product lines, market position, marketing & sales strategies.',
    icon: Building2,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/business-competitor-analytics',
    badge: 'New Tool',
    category: 'research',
  },
  {
    id: 'case_study_generator',
    title: 'Case Study Generator',
    description:
      'Generate conversion-engineered B2B case studies following Missive QA rules, complete with multi-channel distribution playbooks (blog weaving, same-domain links, testimonials, social & video).',
    icon: BarChart3,
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/case-study-generator',
    badge: 'New Tool',
    category: 'content',
  },
]

/* ─────────────── Workflow Pipeline: unique to the hub page ───────────────
 * Maps every tool to the stage of a real content pipeline it belongs to,
 * instead of a generic "type X, get Y" demo. Nothing else in the suite
 * uses this stage-based, auto-advancing rail pattern. */
const WORKFLOW_STAGES = [
  {
    id: 'research',
    label: 'Research',
    tagline: 'Know the landscape before you write a single word.',
    icon: Target,
    toolIds: [
      'keyword_research',
      'competitor_analysis',
      'business_competitor_analytics',
      'google_rank_checker',
    ],
  },
  {
    id: 'create',
    label: 'Create',
    tagline: 'Turn research into published, on-brand content.',
    icon: PenTool,
    toolIds: [
      'blog_topic_generator',
      'ai_content_writer',
      'blog_intro_generator',
      'blog_conclusion_generator',
      'faq_generator',
      'case_study_generator',
      'logo_maker',
    ],
  },
  {
    id: 'audit',
    label: 'Audit',
    tagline: 'Catch every issue before Google or your readers do.',
    icon: CheckSquare,
    toolIds: [
      'content_qa',
      'seo_audit',
      'eeat_analyzer',
      'xml_sitemap_generator',
      'website_tech_inspector',
      'content_analyzer',
    ],
  },
  {
    id: 'prove',
    label: 'Prove',
    tagline: 'Show the business case and mine what already works.',
    icon: DollarSign,
    toolIds: ['seo_roi_calculator', 'website_content_extractor', 'website_image_extractor'],
  },
]

function WorkflowPipeline({ tools }) {
  const sectionRef = useScrollReveal({ threshold: 0.2 })
  const [activeStage, setActiveStage] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % WORKFLOW_STAGES.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [autoPlay])

  const stage = WORKFLOW_STAGES[activeStage]
  const stageTools = stage.toolIds.map((id) => tools.find((t) => t.id === id)).filter(Boolean)

  const selectStage = (i) => {
    setActiveStage(i)
    setAutoPlay(false)
  }

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-slate-950 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#0C81F3]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div ref={sectionRef} className="lp-reveal relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/15 text-[10px] sm:text-xs font-bold rounded-full mb-3 tracking-wider uppercase text-blue-300">
            Your Workflow, Mapped
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2.5 leading-tight">
            Every Tool Has a Place in the Pipeline
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Real content work moves through four stages. Click a stage to see exactly which tools
            cover it.
          </p>
        </div>

        {/* Stage rail */}
        <div className="relative flex items-start justify-between mb-10 sm:mb-12">
          <div className="absolute top-6 left-6 right-6 h-[2px] bg-white/10 overflow-hidden">
            <div className="lp-flow-travel w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#67A7FF] to-[#EB8988] shadow-[0_0_12px_2px_rgba(103,167,255,0.7)]" />
          </div>

          {WORKFLOW_STAGES.map((s, i) => {
            const Icon = s.icon
            const isActive = i === activeStage
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectStage(i)}
                className="relative z-10 flex flex-col items-center gap-2.5 cursor-pointer group flex-1"
              >
                <span
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#0C81F3] to-[#EB8988] border-transparent shadow-lg shadow-[#0C81F3]/40 scale-110'
                      : 'bg-slate-900 border-white/15 group-hover:border-white/30'
                  }`}
                >
                  {isActive && <span className="absolute inset-0 rounded-full lp-tick" />}
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                  />
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')} · {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active stage panel */}
        <div
          key={stage.id}
          className="lp-drop rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-7 lg:p-8 backdrop-blur-sm"
        >
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5 sm:mb-6 max-w-2xl">
            <span className="text-white font-bold">{stage.label}: </span>
            {stage.tagline}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {stageTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#0C81F3]/50 hover:bg-white/[0.08] transition-all"
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0C81F3]/20 to-[#EB8988]/20 flex items-center justify-center shrink-0">
                  {tool.icon && <tool.icon className="w-4 h-4 text-blue-300" />}
                </span>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-200 leading-tight group-hover:text-white transition-colors">
                  {tool.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0 group-hover:text-[#67A7FF] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const HOME_FAQS = [
  {
    question: "What is Himani's SEO Tools?",
    answer:
      'A free suite of AI-powered SEO and content tools built by Missive Digital: research, writing, auditing, and competitive intelligence tools that run on the same battle-tested frameworks the agency uses for its own clients.',
    tag: 'Basics',
  },
  {
    question: 'Are all the tools really free?',
    answer:
      'Yes. Every tool in the suite is 100% free with unlimited generations. No credit card, no trial period, and no feature paywalls.',
    tag: 'Pricing',
  },
  {
    question: 'Do I need to create an account or sign up?',
    answer:
      'No sign-up is required for any tool. Open a tool, fill in the form, and get your results immediately.',
    tag: 'Access',
  },
  {
    question: 'Which tool should I start with?',
    answer:
      'Use the category filters above: Content Creation for writing and generation tools, SEO & Site Audits for technical checks, or Research & Competitive Intel for keyword and competitor analysis. Most workflows start with research, move to content creation, then finish with an audit.',
    tag: 'Guidance',
  },
  {
    question: 'What AI models power these tools?',
    answer:
      'The suite rotates across multiple AI providers, including Google Gemini and Groq, automatically choosing a fast, reliable model for each request and falling back to another provider if one is unavailable.',
    tag: 'Engine',
  },
  {
    question: 'Who built these tools and why?',
    answer:
      'Himani Kankaria, an SEO strategist with 10+ years optimizing B2B and SaaS content, built this suite at Missive Digital to turn the frameworks her team uses on client work into free, self-serve tools for growth leads and creators.',
    tag: 'Authority',
  },
]

export default function Home() {
  const { data: toolsData } = useGetPublicToolsQuery()
  const [activeCategory, setActiveCategory] = useState('all')

  const heroRef = useScrollReveal({ threshold: 0.1 })
  const gridHeaderRef = useScrollReveal({ threshold: 0.1 })
  const gridRef = useScrollReveal({ threshold: 0.05 })
  const spotlightRef = useScrollReveal({ threshold: 0.15 })

  const disabled = useMemo(() => {
    const d = new Set()
    if (toolsData?.success && toolsData?.tools) {
      toolsData.tools.forEach((t) => {
        if (!t.enabled) d.add(t.slug)
      })
    }
    return d
  }, [toolsData])

  const visibleTools = TOOLS.filter((t) => !disabled.has(TOOL_SLUG_MAP[t.id]))
  const filteredTools =
    activeCategory === 'all'
      ? visibleTools
      : visibleTools.filter((t) => t.category === activeCategory)

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      const navHeight = 90
      const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        {/* ═══════════════ 1. HERO ═══════════════ */}
        <section className="relative overflow-hidden !pt-36 sm:!pt-40 py-16 sm:py-20 lg:py-28">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)',
                opacity: 0.08,
              }}
            />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none lp-float" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none lp-float-delay" />
          </div>

          <div
            ref={heroRef}
            className="lp-reveal relative max-w-4xl mx-auto px-4 sm:px-6 text-center z-20"
          >
            <span className="inline-flex items-center gap-2 px-5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase shadow-lg shadow-[#0C81F3]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated by Himani Kankaria • Missive Digital</span>
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gray-900">Himani's </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">
                SEO Tools
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Bespoke, AI-powered SEO & content intelligence tools crafted by{' '}
              <strong>Himani Kankaria</strong> and the <strong>Missive Digital</strong> team. The
              exact battle-tested frameworks we use to rank clients on Google.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => scrollToSection('tools-grid')}
                className="w-full sm:w-auto whitespace-nowrap rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] px-7 py-3.5 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-[#0C81F3]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Free SEO Tools</span>
                <ArrowDown className="w-4 h-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('spotlight')}
                className="w-full sm:w-auto whitespace-nowrap rounded-full border-2 border-slate-300 bg-white/90 backdrop-blur-xs px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                Why We Built Them
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {['No sign-up required', '100% free forever', 'Zero em dashes, zero AI fluff'].map(
                (b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full shadow-2xs"
                  >
                    <ShieldCheckIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                    {b}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════ 2. PUBLISHING PLATFORMS MARQUEE ═══════════════ */}
        <LandingMarquee title="One Suite Powering Content Across" />

        {/* ═══════════════ 3. WORKFLOW PIPELINE (unique to this page) ═══════════════ */}
        <WorkflowPipeline tools={visibleTools} />

        {/* ═══════════════ 4. TOOLS GRID WITH CATEGORY FILTER ═══════════════ */}
        <section id="tools-grid" className="py-14 sm:py-16 lg:py-20 scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div ref={gridHeaderRef} className="lp-reveal text-center mb-8 sm:mb-10">
              <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-2.5">
                The Full Toolkit
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 leading-tight">
                {visibleTools.length} Tools. One AI Engine. Zero Cost.
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
                Filter by what you need right now, or browse the entire suite.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-9 sm:mb-11">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                const count =
                  cat.id === 'all'
                    ? visibleTools.length
                    : visibleTools.filter((t) => t.category === cat.id).length
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-md shadow-[#0C81F3]/25'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0C81F3]/40 hover:text-[#0C81F3]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div ref={gridRef} className="lp-reveal">
              <div
                key={activeCategory}
                className="lp-pop grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
              >
                {filteredTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative w-12 h-12 rounded-2xl border border-blue-100 shadow-xs overflow-hidden group-hover:scale-110 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-[#0C81F3]/30 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                          />
                          <div className="relative w-full h-full flex items-center justify-center text-[#0C81F3] group-hover:text-white transition-colors duration-300">
                            {tool.icon && <tool.icon className="w-6 h-6" />}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 bg-gradient-to-r ${tool.color} text-white text-xs font-bold rounded-full`}
                        >
                          {tool.badge}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {tool.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                        Try it free →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ 5. HIMANI & MISSIVE DIGITAL SPOTLIGHT ═══════════════ */}
        <section
          id="spotlight"
          className="py-16 bg-gradient-to-b from-white to-slate-50 border-t border-b border-slate-200/70 scroll-mt-24"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div
              ref={spotlightRef}
              className="lp-reveal relative bg-gradient-to-br from-slate-900 via-[#101b33] to-[#1a1429] text-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl border border-slate-800 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0C81F3]/25 via-[#EB8988]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#EB8988]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-blue-300 font-semibold mb-5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agency-Grade SEO Architecture</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-6">
                  Why We Created{' '}
                  <span className="bg-gradient-to-r from-[#67A7FF] to-[#F7B7B3] bg-clip-text text-transparent">
                    Himani's SEO Tools
                  </span>
                </h3>

                <Quote className="w-7 h-7 text-white/20 mx-auto mb-3" />
                <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-medium mb-9">
                  Search algorithms evolve every month, but Google always rewards depth, relevance,
                  and human intent. We built these AI tools at Missive Digital to give growth
                  leaders and creators the exact frameworks we use for our high-growth clients.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 pt-7 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] p-0.5 shrink-0 shadow-lg shadow-[#0C81F3]/20">
                      <div className="w-full h-full rounded-[13px] bg-slate-950 flex items-center justify-center">
                        <span className="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#67A7FF] to-[#F7B7B3]">
                          HK
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <strong className="text-white text-sm block leading-tight">
                        Himani Kankaria
                      </strong>
                      <span className="text-xs text-slate-400">Founder & CEO, Missive Digital</span>
                    </div>
                  </div>

                  <a
                    href="https://missivedigital.com/"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-sm font-bold hover:opacity-95 active:scale-[0.98] transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <span>Explore Missive Digital</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ 6. FAQ ═══════════════ */}
        <LandingFAQ
          sectionLabel="Got Questions?"
          heading="Frequently Asked Questions"
          subheading="Everything you need to know about the tool suite."
          faqs={HOME_FAQS}
        />

        {/* ═══════════════ 7. FINAL CTA ═══════════════ */}
        <LandingCTA
          heading="Pick a Tool. Start Free. No Sign-Up."
          subheading="20 AI-powered SEO and content tools, all free, all built on the same Missive QA standards."
          ctaLabel="Explore All Tools"
          ctaOnClick={() => scrollToSection('tools-grid')}
        />
      </main>
    </div>
  )
}
