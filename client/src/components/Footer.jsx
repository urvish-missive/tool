import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetPublicToolsQuery } from '../services/apiSlice'

const FOOTER_TOOLS = [
  { label: 'Content Analyzer', href: '/content-analyzer', slug: 'content-analyzer' },
  { label: 'SEO Website Audit', href: '/seo-audit', slug: 'seo-audit' },
  { label: 'Keyword Research', href: '/keyword-research', slug: 'keyword-research' },
  { label: 'Blog Topic Generator', href: '/blog-topic-generator', slug: 'blog-topics' },
  { label: 'Logo Maker', href: '/logo-maker', slug: 'logo-maker' },
  { label: 'Content QA Checklist', href: '/content-qa', slug: 'content-qa' },
  { label: 'FAQ Generator', href: '/faq-generator', slug: 'faq-generator' },
  { label: 'Competitor Analysis', href: '/competitor-analysis', slug: 'competitor-analyzer' },
  { label: 'ROI Calculator', href: '/seo-roi-calculator', slug: 'seo-roi' },
  { label: 'XML Sitemap Generator', href: '/xml-sitemap-generator', slug: 'xml-sitemap-generator' },
  { label: 'Google Rank Checker', href: '/google-rank-checker', slug: 'google-rank-checker' },
  { label: 'Website Content Extractor', href: '/website-content-extractor', slug: 'website-content-extractor' },
]

export default function Footer() {
  const { data: toolsData } = useGetPublicToolsQuery()

  const disabledTools = useMemo(() => {
    const disabled = new Set()
    if (toolsData?.success && toolsData?.tools) {
      toolsData.tools.forEach((t) => {
        if (!t.enabled) disabled.add(t.slug)
      })
    }
    return disabled
  }, [toolsData])

  const visibleTools = useMemo(() => {
    return FOOTER_TOOLS.filter((tool) => !disabledTools.has(tool.slug))
  }, [disabledTools])

  return (
    <footer className="bg-[#1a1a2e] text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">Services</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  SEO
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Content Consultancy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  LinkedIn Marketing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Content Optimization
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Personal Branding
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Content Writing
                </a>
              </li>
            </ul>
          </div>

          {/* Himani's SEO Tools — Dynamic & Filtered by Admin Status */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">Himani's SEO Tools</h3>
            <ul className="space-y-3 text-sm">
              {visibleTools.map((tool) => (
                <li key={tool.slug}>
                  <Link to={tool.href} className="hover:text-white transition-colors">
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">Company</h3>
            <div className="space-y-5">
              <div>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-gray-500">
                  Call Us
                </span>
                <p className="text-white font-semibold text-sm mt-1">+91 95370 95025</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-gray-500">
                  Email Us
                </span>
                <p className="text-white font-semibold text-sm mt-1">hello@missivedigital.com</p>
              </div>
            </div>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">Connect With Us</h3>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  label: 'Facebook',
                  path: 'M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z',
                },
                {
                  label: 'X',
                  path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
                },
                {
                  label: 'YouTube',
                  path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
                },
                {
                  label: 'Instagram',
                  path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
                },
                {
                  label: 'LinkedIn',
                  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
                },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all"
                >
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 24 24">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Missive Digital. Curated & Founded by Himani Kankaria. All
          rights reserved.
        </div>
      </div>
    </footer>
  )
}
