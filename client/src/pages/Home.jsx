import { Link } from 'react-router-dom'

const TOOLS = [
  {
    id: 'content-analyzer',
    name: 'AI Content Analyzer',
    description: 'Analyze your content for SEO, readability, search intent and overall quality with AI-powered insights.',
    icon: '📝',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/content-analyzer',
    badge: 'AI Powered',
  },
  {
    id: 'seo-audit',
    name: 'SEO Website Audit',
    description: 'Get a comprehensive technical and on-page SEO audit of your website with actionable recommendations.',
    icon: '🔍',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/seo-audit',
    badge: 'Free Tool',
  },
  {
    id: 'keyword-research',
    name: 'AI Keyword Research',
    description: 'Discover keyword ideas, search intent, long-tail opportunities, topic clusters and content ideas.',
    icon: '🎯',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/keyword-research',
    badge: 'AI Powered',
  },
  {
    id: 'blog-topic-generator',
    name: 'Blog Topic Generator',
    description: 'Generate SEO-optimized blog topics and topic clusters with outlines, related keywords, and a content strategy.',
    icon: '💡',
    color: 'from-[#0C81F3] to-[#EB8988]',
    path: '/blog-topic-generator',
    badge: 'New',
  },
  // {
  //   id: 'seo-roi',
  //   name: 'SEO ROI Calculator',
  //   description: 'Estimate potential organic traffic, leads, revenue and ROI from your SEO investment.',
  //   icon: '💰',
  //   color: 'from-[#0C81F3] to-[#EB8988]',
  //   path: '/seo-roi-calculator',
  //   badge: 'Free Tool',
  // },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)', opacity: 0.08 }} />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#A7D2FF]/40 to-[#F7B7B3]/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#A7D2FF]/30 to-[#F7B7B3]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block px-5 py-1.5 bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase shadow-lg shadow-[#0C81F3]/25">Free SEO Tools</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gray-900">Professional </span>
              <span className="bg-gradient-to-r from-[#0C81F3] via-[#67A7FF] to-[#EB8988] bg-clip-text text-transparent">SEO Tools</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Free, AI-powered SEO tools built by an agency for real-world use. No credit card required.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-8">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{tool.icon}</span>
                      <span className={`px-3 py-1 bg-gradient-to-r ${tool.color} text-white text-xs font-bold rounded-full`}>
                        {tool.badge}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{tool.name}</h2>
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
