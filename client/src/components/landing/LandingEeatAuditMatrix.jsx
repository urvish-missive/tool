import { useState } from 'react'
import {
  ShieldCheck,
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Globe,
  Bot,
  Check,
  Lock,
  Eye,
  BookOpen,
  ArrowRight,
  Flame,
  FileText,
} from 'lucide-react'
import useScrollReveal from './useScrollReveal'

const EEAT_PILLARS = [
  {
    id: 'experience',
    n: '01',
    name: 'Experience (First-Hand Proof)',
    badge: '20 Pts Weight',
    tagline: 'Lived, practical proof that cannot be simulated or scraped.',
    icon: Flame,
    color: 'from-[#0C81F3] to-[#67A7FF]',
    accentColor: '#0C81F3',
    summary:
      'Google added the extra "E" because LLMs flooded the web with surface-level synthesis. Experience evaluates whether the creator has genuine, first-person involvement with the topic.',
    signals: [
      {
        label: 'First-Person Test Markers',
        desc: 'Verifiable observational phrases like "In our benchmark", "After 30 days of testing", or "We measured".',
      },
      {
        label: 'Original Empirical Proof',
        desc: 'Custom data points, benchmark metrics, before/after metrics, or proprietary case results.',
      },
      {
        label: 'Practical Implementation Insights',
        desc: 'Detailed discussion of edge-cases, failure modes, setup friction, and practical trade-offs.',
      },
      {
        label: 'Visual & Methodological Evidence',
        desc: 'Original screenshots, benchmark diagrams, and step-by-step logs confirming authentic execution.',
      },
    ],
    whyItRanks:
      'AI models like Perplexity and Google Gemini prioritize pages with novel experiential data that cannot be extracted from generic documentation.',
    passFailExample: {
      fail: '"SEO audits are very important for SaaS companies to scale traffic."',
      pass: '"When we audited 42 enterprise SaaS domains in Q3, 78% had broken canonical tags causing a 24% crawl budget loss."',
    },
  },
  {
    id: 'expertise',
    n: '02',
    name: 'Expertise (Credentialed Depth)',
    badge: '20 Pts Weight',
    tagline: 'Verifiable subject mastery and technical precision.',
    icon: Award,
    color: 'from-[#67A7FF] to-[#0C81F3]',
    accentColor: '#67A7FF',
    summary:
      'High-quality content requires skilled authors with demonstrable background, professional accreditation, or clear domain track records.',
    signals: [
      {
        label: 'Named Author & Credentials',
        desc: 'Verifiable byline linking to author biographical profile, LinkedIn, and subject accreditation.',
      },
      {
        label: 'Author Schema Markup',
        desc: 'Valid JSON-LD `Person` or `author` schema connecting the author to established digital entity records.',
      },
      {
        label: 'Technical Accuracy & Nuance',
        desc: 'Use of domain-specific precision and industry standards without oversimplified, misleading analogies.',
      },
      {
        label: 'Editorial Fact-Checking Statement',
        desc: 'Transparent secondary reviewer, peer review, or subject-matter editor endorsement.',
      },
    ],
    whyItRanks:
      'Google\'s Knowledge Graph cross-references author entities. Content signed by recognized industry figures receives higher baseline quality thresholds.',
    passFailExample: {
      fail: 'Published by "Admin" or generic brand handle with zero bio.',
      pass: 'Written by Himani Kankaria (10+ yrs enterprise SEO), reviewed by senior technical architect with linked schema.',
    },
  },
  {
    id: 'authoritativeness',
    n: '03',
    name: 'Authoritativeness (Citation Weight)',
    badge: '20 Pts Weight',
    tagline: 'Topical breadth, industry citations, and digital consensus.',
    icon: Globe,
    color: 'from-[#0C81F3] to-[#EB8988]',
    accentColor: '#0C81F3',
    summary:
      'Authoritativeness measures your site\'s reputation as a go-to primary source. When other leaders in your niche cite your data, your authority compounds.',
    signals: [
      {
        label: 'Primary Source Citation Links',
        desc: 'Outbound citations referencing original research papers, official docs, government data, or peer studies.',
      },
      {
        label: 'Proprietary Benchmark Studies',
        desc: 'Original research, surveys, or statistical frameworks that industry publications cite back to.',
      },
      {
        label: 'Topical Entity Coverage',
        desc: 'Comprehensive coverage of subtopics, related entities, and search intent clusters without fluff.',
      },
      {
        label: 'Brand & Founder Digital Footprint',
        desc: 'Consistent brand co-occurrence with high-authority publications and industry conferences.',
      },
    ],
    whyItRanks:
      'Search engines evaluate semantic co-occurrence. Linking to and being cited by primary sources cements your site as a trusted node in the knowledge graph.',
    passFailExample: {
      fail: 'Zero external links or only circular internal marketing pitches.',
      pass: 'Cites Google official documentation, IEEE studies, and includes proprietary Missive Digital client dataset.',
    },
  },
  {
    id: 'trustworthiness',
    n: '04',
    name: 'Trustworthiness (Transparency & Safety)',
    badge: '20 Pts Weight',
    tagline: 'The foundational anchor of Google\'s entire quality framework.',
    icon: ShieldCheck,
    color: 'from-[#EB8988] to-[#FFB7B2]',
    accentColor: '#EB8988',
    summary:
      'Trust is the most critical pillar. Even high-experience, high-expertise content fails if the website lacks security, transparency, and consumer safety markers.',
    signals: [
      {
        label: 'Transparent Testing Disclosures',
        desc: 'Clear statements on how products or strategies were tested, funded, or evaluated.',
      },
      {
        label: 'Freshness & Last-Updated Timestamps',
        desc: 'Visible original publication date and prominent last-reviewed/updated timestamp with revision notes.',
      },
      {
        label: 'YMYL Compliance Guardrails',
        desc: 'Mandatory disclaimers, conflict-of-interest disclosures, and safety boundaries for financial/health queries.',
      },
      {
        label: 'Publisher Transparency & Contact',
        desc: 'Accessible physical address, legal terms, privacy policy, and direct contact email.',
      },
    ],
    whyItRanks:
      'Google explicitly states that a low Trust score invalidates high Experience and Expertise. Trust protects users from deception or outdated advice.',
    passFailExample: {
      fail: 'Undisclosed affiliate links, missing privacy policy, no date stamps.',
      pass: 'Clear testing methodology disclosure, visible last-audited date, and direct editorial contact channels.',
    },
  },
  {
    id: 'aiSearchReadiness',
    n: '05',
    name: 'AI Overview & Search Citation Readiness',
    badge: '20 Pts Weight',
    tagline: 'Structured for direct citation by Google AI, Perplexity & SearchGPT.',
    icon: Bot,
    color: 'from-[#0C81F3] to-[#EB8988]',
    accentColor: '#0C81F3',
    summary:
      'Generative Engine Optimization (GEO). How easily LLMs and AI Search engines can extract authoritative answers and credit your URL with a direct citation link.',
    signals: [
      {
        label: 'Direct Answer Architecture',
        desc: 'H2/H3 questions immediately followed by crisp 1-2 sentence factual answer blocks before deep analysis.',
      },
      {
        label: 'High Information-Gain Density',
        desc: 'Contains novel perspectives, statistics, or solutions absent from the existing top 10 search results.',
      },
      {
        label: 'Scannable Synthesized Blocks',
        desc: 'Structured comparison tables, bulleted takeaway lists, and step-by-step numbered workflows.',
      },
      {
        label: 'Rich JSON-LD Schema Matrix',
        desc: 'Nested Article, HowTo, FAQPage, and ItemList schema formatted for immediate LLM parsing.',
      },
    ],
    whyItRanks:
      'AI Overviews quote content that gives direct, factually verifiable answers. Structured answers yield 3.4x more prominent citation cards in generative results.',
    passFailExample: {
      fail: 'Wandering narrative without summary tables, missing schema.',
      pass: '3-sentence key takeaway block at top of each H2, comparison table, and valid JSON-LD schema.',
    },
  },
]

export default function LandingEeatAuditMatrix() {
  const [activePillar, setActivePillar] = useState(EEAT_PILLARS[0].id)
  const headerRef = useScrollReveal()
  const current = EEAT_PILLARS.find((p) => p.id === activePillar) || EEAT_PILLARS[0]

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50/70 border-y border-slate-200/70 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-gradient-to-b from-blue-100/40 to-pink-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-gradient-to-t from-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[.18em] text-[#0C81F3] mb-3.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Google Quality Rater &amp; GEO Standards
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            The Forensic{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              E-E-A-T &amp; AI Citation Matrix
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Search algorithms don&apos;t just index keywords: they grade your domain across 4 core
            E-E-A-T pillars and generative citation readiness. Here is the exact evaluation architecture
            our tool inspects on every audit.
          </p>
        </div>

        {/* 5 Pillar Navigation Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-8">
          {EEAT_PILLARS.map((p) => {
            const Icon = p.icon
            const isActive = p.id === activePillar
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePillar(p.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-[#0C81F3] shadow-md shadow-blue-500/10 ring-2 ring-[#0C81F3]/20'
                    : 'bg-white/70 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {p.badge}
                  </span>
                </div>
                <div>
                  <h3
                    className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 ${
                      isActive ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {p.name.split(' (')[0]}
                  </h3>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium truncate">
                    {p.tagline.split('.')[0]}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Deep-Dive Active Pillar Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-md shadow-slate-200/50">
          {/* Header of Active Pillar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6 sm:mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0C81F3] to-[#EB8988] p-0.5 shrink-0 shadow-md shadow-[#0C81F3]/20">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                  <current.icon className="w-6 h-6 text-[#0C81F3]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0C81F3]">
                    Pillar {current.n} Evaluation
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    {current.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {current.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {current.summary}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Signals Grid */}
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#0C81F3]" />
              Exact Forensic Signals Checked During Audit:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {current.signals.map((sig, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:bg-white hover:border-[#0C81F3]/30 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight mb-1">
                      {sig.label}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {sig.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Insights: Why It Ranks & Pass/Fail Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            {/* Why Google Cares */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0C81F3] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Why Google &amp; AI Search Value This Pillar:
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {current.whyItRanks}
              </p>
            </div>

            {/* Pass vs Fail Benchmark */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Pass vs Fail Authority Benchmark:
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-rose-800 bg-rose-50/80 p-2 rounded-xl border border-rose-200/60">
                    <span className="font-bold shrink-0 text-rose-600">FAIL:</span>
                    <span className="line-clamp-2">{current.passFailExample.fail}</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60">
                    <span className="font-bold shrink-0 text-emerald-600">PASS:</span>
                    <span className="line-clamp-2">{current.passFailExample.pass}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Quantitative Benchmarks Micro-Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-6 sm:mt-8">
          {[
            { label: '4 Core Pillars', sub: 'Experience, Expertise, Authoritativeness, Trust' },
            { label: 'AI Citation Ready', sub: 'Engineered for Google AI Overviews & Perplexity' },
            { label: 'YMYL Safety Checks', sub: 'High scrutiny for finance, health, and legal' },
            { label: '1-Click Fixes', sub: 'Direct schema & E-E-A-T booster generation' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs text-center"
            >
              <strong className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                {item.label}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
