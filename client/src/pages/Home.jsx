import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useGetPublicToolsQuery } from '../services/apiSlice'

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
}

const TOOLS = [
  {
    id: 'content_analyzer',
    title: 'Content Analyzer',
    description: 'AI-driven on-page SEO analyzer with real-time scoring, content gaps, readability, and strategic insights.',
    icon: '📊',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/content-analyzer',
    badge: 'Free Tool',
  },
  {
    id: 'seo_audit',
    title: 'SEO Audit',
    description: 'Deep technical SEO website crawler analyzing meta tags, headings, schema markup, and performance.',
    icon: '🔍',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/seo-audit',
    badge: 'Free Tool',
  },
  {
    id: 'keyword_research',
    title: 'Keyword Research',
    description: 'Discover high-intent keyword opportunities, topic clusters, search intent, and long-tail ideas.',
    icon: '🎯',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/keyword-research',
    badge: 'Free Tool',
  },
  {
    id: 'blog_topic_generator',
    title: 'Blog Topic Generator',
    description: 'Generate catchy, SEO-optimized blog topic ideas with headlines, target keywords, and content briefs.',
    icon: '💡',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/blog-topic-generator',
    badge: 'Free Tool',
  },
  {
    id: 'logo_maker',
    title: 'AI Logo Maker',
    description: 'Create unique, customizable SVG vector logos for your brand with instant downloads in multiple formats.',
    icon: '🎨',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/logo-maker',
    badge: 'Free Tool',
  },
  {
    id: 'content_qa',
    title: 'Content QA Checklist',
    description: 'Comprehensive 12-pillar pre-publish QA checklist to catch errors, polish tone, and verify claims.',
    icon: '✅',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/content-qa',
    badge: 'Free Tool',
  },
  {
    id: 'faq_generator',
    title: 'FAQ Generator',
    description: 'Generate high-converting FAQs formulated to win Google Featured Snippets and valid Schema.org JSON-LD.',
    icon: '❓',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/faq-generator',
    badge: 'Free Tool',
  },
  {
    id: 'competitor_analysis',
    title: 'Competitor Analysis',
    description: 'Reverse-engineer competitor rankings, find content gaps, and get a customized 10x outrank playbook.',
    icon: '⚔️',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/competitor-analysis',
    badge: 'Free Tool',
  },
  {
    id: 'seo_roi_calculator',
    title: 'SEO ROI Calculator',
    description: 'Model organic growth scenarios, calculate break-even timelines, and build an executive business case.',
    icon: '💰',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/seo-roi-calculator',
    badge: 'Free Tool',
  },
  {
    id: 'xml_sitemap_generator',
    title: 'XML Sitemap Generator',
    description: 'Deep crawler creating Google-compliant XML sitemaps with image tags, hreflang alternates, and Search Console readiness.',
    icon: '🗺️',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/xml-sitemap-generator',
    badge: 'New Tool',
  },
  {
    id: 'google_rank_checker',
    title: 'Google Rank Checker',
    description: 'Real-time Google search rankings with top 10 competitor landscape, SERP features breakdown, and 10x outrank roadmap.',
    icon: '📈',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/google-rank-checker',
    badge: 'New Tool',
  },
]

export default function Home() {
  const { data: toolsData } = useGetPublicToolsQuery()

  const disabled = useMemo(() => {
    const d = new Set()
    if (toolsData?.success && toolsData?.tools) {
      toolsData.tools.forEach(t => { if (!t.enabled) d.add(t.slug) })
    }
    return d
  }, [toolsData])

  const visibleTools = TOOLS.filter(t => !disabled.has(TOOL_SLUG_MAP[t.id]))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden !pt-36 sm:!pt-40 py-16 sm:py-20 lg:py-28">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-2 px-5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase shadow-lg shadow-[#0C81F3]/25">
              <span>✨ Curated by Himani Kankaria • Missive Digital</span>
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gray-900">Himani's </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">SEO Tools</span>
            </h1>
            <p className="mt-6 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Bespoke, AI-powered SEO & content intelligence tools crafted by <strong>Himani Kankaria</strong> and the <strong>Missive Digital</strong> team. The exact battle-tested frameworks we use to rank clients on Google.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              {visibleTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{tool.icon}</span>
                      <span className={`px-3 py-1 bg-gradient-to-r ${tool.color} text-white text-xs font-bold rounded-full`}>
                        {tool.badge}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {tool.title || tool.name}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">{tool.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                      Try it free →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Himani & Missive Digital Spotlight */}
        <section className="py-16 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative bg-gradient-to-br from-slate-900 via-[#101b33] to-[#1a1429] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-800 overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0C81F3]/25 via-[#EB8988]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] p-1 shrink-0 shadow-xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#67A7FF] to-[#F7B7B3]">
                      HK
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                      Missive
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-300 font-semibold">
                    <span>💡 Agency-Grade SEO Architecture</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Why We Created <span className="bg-gradient-to-r from-[#67A7FF] to-[#F7B7B3] bg-clip-text text-transparent">Himani's SEO Tools</span>
                  </h3>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed italic">
                    "Search algorithms evolve every month, but Google always rewards depth, relevance, and human intent. We built these AI tools at Missive Digital to give growth leaders and creators the exact frameworks we use for our high-growth clients."
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 text-xs text-slate-400">
                    <div>
                      <strong className="text-white text-sm block">Himani Kankaria</strong>
                      <span>Founder & CEO, Missive Digital • International SEO & Content Strategist</span>
                    </div>

                    <a
                      href="https://missivedigital.com/"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white font-bold hover:opacity-95 transition-all shadow-md shrink-0"
                    >
                      <span>Explore Missive Digital</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
