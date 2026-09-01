import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || '/api'

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
            { icon: '📊', label: 'Telecom AI SEO', badge: 'BLOG', badgeColor: 'bg-white text-gray-900', href: '#' },
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
            { icon: '✅', label: 'Content QA Checklist', href: '#' },
            { icon: '🔍', label: 'SEO Strategies', badge: 'WEBINAR', badgeColor: 'bg-white text-gray-900', href: '#' },
            { icon: '📊', label: 'Case Study', href: '#' },
          ],
        },
      ],
    },
  },
  {
    label: 'Free SEO Tools',
    dropdown: {
      columns: [
        {
          items: [
            { icon: '📝', label: 'AI Content Analyzer', href: '/content-analyzer' },
            { icon: '🔍', label: 'SEO Website Audit', href: '/seo-audit' },
            { icon: '🎯', label: 'Keyword Research', href: '/keyword-research' },
            { icon: '💡', label: 'Blog Topic Generator', badgeColor: 'bg-green-500 text-white', href: '/blog-topic-generator' },
            { icon: '🎨', label: 'Logo Maker',badgeColor: 'bg-blue-500 text-white', href: '/logo-maker' },
            { icon: '❓', label: 'FAQ Generator', badgeColor: 'bg-purple-500 text-white', href: '/faq-generator' },
            { icon: '🕵️', label: 'Competitor Analysis', badgeColor: 'bg-red-500 text-white', href: '/competitor-analysis' },
            { icon: '💰', label: 'ROI Calculator', href: '/seo-roi-calculator' },
            { icon: '✅', label: 'Content QA', badge: 'NEW', badgeColor: 'bg-green-500 text-white', href: '/content-qa' },
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
            { icon: '✉️', label: 'hello@missivedigital.com', href: 'mailto:hello@missivedigital.com' },
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
  const [disabledTools, setDisabledTools] = useState(new Set())

  useEffect(() => {
    fetch(`${API}/tools/public`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const disabled = new Set()
          data.tools.forEach(t => { if (!t.enabled) disabled.add(t.slug) })
          setDisabledTools(disabled)
        }
      })
      .catch(() => {})
  }, [])

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
      <nav className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-white/60 px-4 sm:px-6" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Missive Digital" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item, idx) => (
              <div key={item.label} className="relative"
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
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max rounded-2xl overflow-hidden shadow-2xl border border-white/40"
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="p-6" style={{ background: 'linear-gradient(77deg, #0C81F3 32%, #EB8988 100%)' }}>
                      <div className={`grid gap-8 ${item.dropdown.columns.length === 1 ? 'grid-cols-1' : item.dropdown.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {item.dropdown.columns.map((col, ci) => (
                          <div key={ci} className="space-y-0.5 min-w-0">
                            {col.items.filter(sub => {
                              const slug = TOOL_HREF_SLUGS[sub.href]
                              return !slug || !disabledTools.has(slug)
                            }).map((sub) => (
                              <a
                                key={sub.label}
                                href={sub.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition-colors text-[13px]"
                              >
                                {sub.icon && <span className="text-sm w-5 h-5 flex items-center justify-center shrink-0 leading-none">{sub.icon}</span>}
                                <span className="leading-snug">{sub.label}</span>
                                {sub.badge && (
                                  <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.badgeColor}`}>
                                    {sub.badge}
                                  </span>
                                )}
                              </a>
                            ))}
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
            <a href="#" className="hidden sm:inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm">
              Book a Consultation
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${mobileExpanded === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {mobileExpanded === idx && (
                      <div className="pl-4 pb-2">
                        {item.dropdown.columns.flatMap(col => col.items).filter(sub => {
                          const slug = TOOL_HREF_SLUGS[sub.href]
                          return !slug || !disabledTools.has(slug)
                        }).map((sub) => (
                          <a key={sub.label} href={sub.href} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg">
                            {sub.icon && <span className="text-sm w-5 h-5 flex items-center justify-center shrink-0">{sub.icon}</span>}
                            {sub.label}
                            {sub.badge && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sub.badgeColor}`}>{sub.badge}</span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a href={item.href} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">
                    {item.label}
                  </a>
                )}
              </div>
            ))}
            <div className="px-4 pt-2">
              <a href="#" className="block w-full text-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
                Book a Consultation
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
