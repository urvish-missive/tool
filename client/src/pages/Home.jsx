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
            <span className="inline-block px-5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase shadow-lg shadow-[#0C81F3]/25">
              Free SEO Tools
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gray-900">Professional </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">SEO Tools</span>
            </h1>
            <p className="mt-6 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Free, AI-powered SEO tools built by an agency for real-world use. No credit card required.
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
      </main>
    </div>
  )
}
