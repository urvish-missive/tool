import useScrollReveal from './useScrollReveal'
import {
  Globe,
  Layers,
  Sparkles,
  Share2,
  FileText,
  Bookmark,
  Send,
  ShoppingBag,
} from 'lucide-react'

const PLATFORMS = [
  { name: 'WordPress', icon: Globe, color: 'text-sky-600', badge: 'CMS' },
  { name: 'Webflow', icon: Layers, color: 'text-blue-600', badge: 'Design' },
  { name: 'HubSpot', icon: Sparkles, color: 'text-orange-500', badge: 'Inbound' },
  { name: 'Ghost', icon: FileText, color: 'text-emerald-600', badge: 'Publishing' },
  { name: 'Substack', icon: Bookmark, color: 'text-amber-600', badge: 'Newsletter' },
  { name: 'Medium', icon: Share2, color: 'text-slate-800', badge: 'Articles' },
  { name: 'LinkedIn Articles', icon: Send, color: 'text-blue-700', badge: 'B2B' },
  { name: 'Shopify Blog', icon: ShoppingBag, color: 'text-teal-600', badge: 'Ecommerce' },
]

/**
 * LandingMarquee — infinite smooth sliding ticker inspired by Missive Digital.
 */
export default function LandingMarquee({
  title = 'Engineered for Content Teams, Agencies & Creators Publishing On',
}) {
  const ref = useScrollReveal({ threshold: 0.1 })
  const marqueeItems = [...PLATFORMS, ...PLATFORMS, ...PLATFORMS]

  return (
    <section className="relative py-8 sm:py-10 bg-gradient-to-b from-white via-slate-50/60 to-white border-y border-slate-200/60 overflow-hidden">
      <div ref={ref} className="lp-reveal max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-5 sm:mb-6">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[.2em] text-slate-400">
          {title}
        </p>
      </div>

      {/* Gradient Mask for Smooth Fade at Edges */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="lp-marquee gap-4 sm:gap-6 py-2 items-center">
          {marqueeItems.map((p, i) => {
            const Icon = p.icon
            return (
              <div
                key={i}
                className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-slate-200/80 shadow-xs hover:border-[#0C81F3]/40 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200 shrink-0 cursor-default select-none group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                  {p.name}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#0C81F3] transition-colors">
                  {p.badge}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
