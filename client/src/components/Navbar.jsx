import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetPublicToolsQuery } from '../services/apiSlice'

const TOOL_HREF_SLUGS = {
  '/content-analyzer': 'content-analyzer',
  '/seo-audit': 'seo-audit',
  '/keyword-research': 'keyword-research',
  '/blog-topic-generator': 'blog-topics',
  '/logo-maker': 'logo-maker',
  '/faq-generator': 'faq-generator',
  '/competitor-analysis': 'competitor-analyzer',
  '/seo-roi-calculator': 'seo-roi',
  '/content-qa': 'content-qa',
  '/xml-sitemap-generator': 'xml-sitemap-generator',
  '/google-rank-checker': 'google-rank-checker',
  '/website-content-extractor': 'website-content-extractor',
  '/website-image-extractor': 'website-image-extractor',
  '/website-tech-inspector': 'website-tech-inspector',
}

const NAV_ITEMS = [
  {
    label: 'AI',
    dropdown: {
      columns: [
        {
          items: [
            { icon: '🤖', label: 'AI SEO', href: '#' },
            { icon: '📱', label: 'CAF Framework', href: '#' },
            { icon: '🎯', label: 'GEO Readiness Score', href: '#' },
            {
              icon: '📊',
              label: 'Telecom AI SEO',
              badge: 'BLOG',
              badgeColor: 'bg-white text-gray-900',
              href: '#',
            },
          ],
        },
      ],
    },
  },
  {
    label: 'What We Do',
    dropdown: {
      columns: [
        {
          items: [
            { icon: '🔍', label: 'SEO', href: '#' },
            { icon: '📝', label: 'Content Consulting', href: '#' },
            { icon: '💼', label: 'LinkedIn Marketing', href: '#' },
            { icon: '📊', label: 'Personal Branding', href: '#' },
            { icon: '🛒', label: 'Ecommerce SEO', href: '#' },
          ],
        },
        {
          items: [
            { icon: '✏️', label: 'Content Optimization', href: '#' },
            { icon: '✍️', label: 'Content Writing', href: '#' },
            { icon: '🏷️', label: 'Content Audit', href: '#' },
            { icon: '🌐', label: 'Digital Marketing', href: '#' },
            { icon: '💻', label: 'Web Design & Development', href: '#' },
          ],
        },
      ],
    },
  },
  {
    label: 'Industry',
    dropdown: {
      columns: [
        {
          items: [
            { icon: '☁️', label: 'SaaS', href: '#' },
            { icon: '📶', label: 'Telecom', href: '#' },
            { icon: '🏥', label: 'Healthcare', href: '#' },
            { icon: '💰', label: 'Fintech', href: '#' },
            { icon: '📞', label: 'Tele Marketing', href: '#' },
          ],
        },
        {
          items: [
            { icon: '💎', label: 'Jewelry', href: '#' },
            { icon: '🏠', label: 'Real Estate', href: '#' },
            { icon: '🍽️', label: 'Restaurant', href: '#' },
            { icon: '🍷', label: 'Food and Beverages', href: '#' },
          ],
        },
      ],
    },
  },
  {
    label: 'Resources',
    dropdown: {
      columns: [
        {
          items: [
            { icon: '✏️', label: 'Blog', href: '#' },
            { icon: '✅', label: 'Content QA Checklist', href: '/content-qa' },
            {
              icon: '🔍',
              label: 'SEO Strategies',
              badge: 'WEBINAR',
              badgeColor: 'bg-white text-gray-900',
              href: '#',
            },
            { icon: '📊', label: 'Case Study', href: '#' },
          ],
        },
      ],
    },
  },
  {
    label: "Himani's SEO Tools",
    dropdown: {
      columns: [
        {
          title: 'Content & Strategy',
          items: [
            { icon: '📝', label: 'AI Content Analyzer', href: '/content-analyzer' },
            { icon: '✅', label: 'Content QA Checklist', href: '/content-qa' },
            { icon: '💡', label: 'Blog Topic Generator', href: '/blog-topic-generator' },
            { icon: '❓', label: 'FAQ Generator', href: '/faq-generator' },
            { icon: '🎨', label: 'Logo Maker', href: '/logo-maker' },
          ],
        },
        {
          title: 'Rankings & Audits',
          items: [
            {
              icon: '📈',
              label: 'Google Rank Checker',
              badge: 'POPULAR',
              badgeColor: 'bg-white text-gray-900',
              href: '/google-rank-checker',
            },
            { icon: '🔍', label: 'SEO Website Audit', href: '/seo-audit' },
            { icon: '🎯', label: 'Keyword Research', href: '/keyword-research' },
            {
              icon: '🕵️',
              label: 'Competitor Analysis',
              href: '/competitor-analysis',
            },
            { icon: '💰', label: 'SEO ROI Calculator', href: '/seo-roi-calculator' },
          ],
        },
        {
          title: 'Crawling & Extraction',
          items: [
            {
              icon: '🌐',
              label: 'Website Content Extractor',
              badge: 'AI Q&A',
              badgeColor: 'bg-white text-gray-900',
              href: '/website-content-extractor',
            },
            {
              icon: '🖼️',
              label: 'Website Image Extractor',
              badge: 'NEW',
              badgeColor: 'bg-amber-300 text-slate-950',
              href: '/website-image-extractor',
            },
            {
              icon: '🗺️',
              label: 'XML Sitemap Generator',
              href: '/xml-sitemap-generator',
            },
            {
              icon: '⚡',
              label: 'Tech & Theme Inspector',
              badge: 'NEW',
              badgeColor: 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white',
              href: '/website-tech-inspector',
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Company',
    dropdown: {
      columns: [
        {
          items: [
            { icon: 'ℹ️', label: 'About', href: '#' },
            { icon: '👥', label: 'Contact', href: '#' },
          ],
        },
        {
          items: [
            { icon: '📞', label: '+91 95370 95025', href: 'tel:+919537095025' },
            {
              icon: '✉️',
              label: 'hello@missivedigital.com',
              href: 'mailto:hello@missivedigital.com',
            },
            { icon: '📍', label: '825, Iconic Shyamal, Ahmedabad, 380015', href: '#' },
          ],
        },
      ],
    },
  },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const navRef = useRef(null)
  const timeoutRef = useRef(null)
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = (idx) => {
    clearTimeout(timeoutRef.current)
    setActiveDropdown(idx)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4" ref={navRef}>
      <nav
        className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-white/60 px-4 sm:px-6"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img src="/logo.png" alt="Missive Digital" className="h-8 w-auto" />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0C81F3]/10 to-[#EB8988]/15 border border-[#0C81F3]/20 text-[10px] font-bold text-slate-700 tracking-tight">
              by Himani Kankaria
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item, idx) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.dropdown && handleMouseEnter(idx)}
                onMouseLeave={item.dropdown ? handleMouseLeave : undefined}
              >
                <button
                  onClick={() => {
                    if (item.dropdown) {
                      setActiveDropdown(activeDropdown === idx ? null : idx)
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    activeDropdown === idx
                      ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>

                {/* Desktop dropdown */}
                {item.dropdown && activeDropdown === idx && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/40 z-50"
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      className="p-5 sm:p-6"
                      style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)' }}
                    >
                      <div
                        className={`grid gap-4 sm:gap-5 ${
                          item.dropdown.columns.length === 1
                            ? 'grid-cols-1'
                            : item.dropdown.columns.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                        }`}
                      >
                        {item.dropdown.columns.map((col, ci) => (
                          <div key={ci} className="space-y-1 min-w-[195px]">
                            {col.title && (
                              <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/75 border-b border-white/15 mb-1.5 flex items-center justify-between">
                                <span>{col.title}</span>
                              </div>
                            )}
                            {col.items
                              .filter((sub) => {
                                const slug = TOOL_HREF_SLUGS[sub.href]
                                return !slug || !disabledTools.has(slug)
                              })
                              .map((sub) => {
                                const isInternal = sub.href && sub.href.startsWith('/')
                                const LinkComponent = isInternal ? Link : 'a'
                                return (
                                  <LinkComponent
                                    key={sub.label}
                                    {...(isInternal ? { to: sub.href } : { href: sub.href })}
                                    onClick={() => setActiveDropdown(null)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/95 hover:bg-white/20 hover:text-white transition-all text-[13px] font-medium group"
                                  >
                                    {sub.icon && (
                                      <span className="text-sm w-5 h-5 flex items-center justify-center shrink-0 leading-none group-hover:scale-110 transition-transform">
                                        {sub.icon}
                                      </span>
                                    )}
                                    <span className="leading-snug truncate">{sub.label}</span>
                                    {sub.badge && (
                                      <span
                                        className={`ml-auto shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${sub.badgeColor || 'bg-white text-gray-900'}`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </LinkComponent>
                                )
                              })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="hidden sm:inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              Book a Consultation
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1">
            {NAV_ITEMS.map((item, idx) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${mobileExpanded === idx ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>
                    {mobileExpanded === idx && (
                      <div className="pl-4 pb-2 space-y-3">
                        {item.dropdown.columns.map((col, cIdx) => (
                          <div key={cIdx} className="space-y-1">
                            {col.title && (
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 px-4 pt-2">
                                {col.title}
                              </div>
                            )}
                            {col.items
                              .filter((sub) => {
                                const slug = TOOL_HREF_SLUGS[sub.href]
                                return !slug || !disabledTools.has(slug)
                              })
                              .map((sub) => {
                                const isInternal = sub.href && sub.href.startsWith('/')
                                const LinkComponent = isInternal ? Link : 'a'
                                return (
                                  <LinkComponent
                                    key={sub.label}
                                    {...(isInternal ? { to: sub.href } : { href: sub.href })}
                                    onClick={() => {
                                      setMobileOpen(false)
                                      setMobileExpanded(null)
                                    }}
                                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                                  >
                                    {sub.icon && (
                                      <span className="text-sm w-5 h-5 flex items-center justify-center shrink-0">
                                        {sub.icon}
                                      </span>
                                    )}
                                    <span className="truncate">{sub.label}</span>
                                    {sub.badge && (
                                      <span
                                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sub.badgeColor || 'bg-gray-100 text-gray-800'}`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </LinkComponent>
                                )
                              })}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={item.href}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <div className="px-4 pt-2">
              <a
                href="#"
                className="block w-full text-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Book a Consultation
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
