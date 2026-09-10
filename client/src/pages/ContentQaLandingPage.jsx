import { useEffect, useRef, useCallback, useState } from 'react'
import useScrollReveal from '../components/landing/useScrollReveal'
import { Helmet } from 'react-helmet-async'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Wand2,
  FileText,
  ScanEye,
  Gauge,
  BadgeCheck,
  CircleDot,
  ArrowRight,
} from 'lucide-react'
import { LandingLiveDemo, LandingFAQ, LandingResultsTopbar } from '../components/landing'
import ContentQaPage from '../tools/content-qa/ContentQaPage'

/* ─────────────── SEO Structured Data (JSON-LD) ─────────────── */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Content QA Checklist by Missive Digital',
  description:
    "Free AI-powered content QA tool by Missive Digital. Audit blog posts, newsletters, and landing pages against Himani Kankaria's 12-Pillar Content QA Framework: zero em dashes, zero robotic buzzwords, and quantifiable E-E-A-T proof.",
  url: 'https://tools.missivedigital.com/content-qa',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  author: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  provider: { '@type': 'Organization', name: 'Missive Digital', url: 'https://missivedigital.com' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '260' },
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a content QA checklist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "A content QA checklist is a structured set of quality checks applied to writing before it is published. It audits tone, readability, audience fit, E-E-A-T proof, structure, and visual scannability. This free tool runs every piece of copy against Himani Kankaria's 12-Pillar Content QA Framework.",
      },
    },
    {
      '@type': 'Question',
      name: 'How does the Content QA tool detect robotic AI content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The tool scans for banned cliches such as delve, tapestry, beacon, game changer, and plethora, and enforces a strict zero em dash rule. It also flags throat-clearing preamble, fluff, and dense paragraphs.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the 12 pillars of the Missive QA framework?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tone, Style and AI Check; Read Aloud Test; Audience Alignment; E-E-A-T and Practical Proof; Insight First; Meaning and Crispness; Zero Offensiveness; Relevance to Brand Positioning; Structure and Narrative Flow; No Direct Sales Pitches; Compliance and Risk Check; and Visual and Platform Fit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I import content from Google Docs, a URL, or a file?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Paste or write content directly, import from a Google Doc link, pull a live URL, or upload a file. Everything normalizes into one clean audit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the Content QA tool provide one-click polish?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. After the audit you can run one-click polish. The AI rewrites flagged sections, removes em dashes and buzzwords, adds metrics, tightens paragraphs, and shows a before and after diff.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Content QA tool free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Content QA Checklist by Missive Digital is 100% free with no sign-up required. Run unlimited audits, export PDF reports, and polish with one click.',
      },
    },
  ],
}

/* ─────────────── Data ─────────────── */
const PILLARS = [
  {
    n: '01',
    name: 'Tone, Style & AI Check',
    rule: 'Zero em dashes, zero robotic cliches, natural human cadence.',
    status: 'PASS',
  },
  {
    n: '02',
    name: 'Read Aloud Test',
    rule: 'Smooth spoken cadence that holds attention without verbose pauses.',
    status: 'PASS',
  },
  {
    n: '03',
    name: 'Audience Alignment',
    rule: 'Written for one buyer persona solving one operational bottleneck.',
    status: 'PASS',
  },
  {
    n: '04',
    name: 'E-E-A-T & Practical Proof',
    rule: 'Real metrics and lived experience explaining how and why.',
    status: 'PASS',
  },
  {
    n: '05',
    name: 'Insight First',
    rule: 'Opens with the core finding. Zero throat-clearing preamble.',
    status: 'PASS',
  },
  {
    n: '06',
    name: 'Meaning & Crispness',
    rule: 'Every line adds value. Zero filler or generic padding.',
    status: 'PASS',
  },
  {
    n: '07',
    name: 'Zero Offensiveness',
    rule: 'Constructive critique without demeaning industry peers.',
    status: 'PASS',
  },
  {
    n: '08',
    name: 'Brand Relevance',
    rule: 'Domain mastery without sounding pushy or salesy.',
    status: 'PASS',
  },
  {
    n: '09',
    name: 'Structure & Flow',
    rule: 'Specific H2 with a logical arc from challenge to quantified ROI.',
    status: 'PASS',
  },
  {
    n: '10',
    name: 'No Sales Pitches',
    rule: 'Evidence and verified proof sell the capability, not hype.',
    status: 'PASS',
  },
  {
    n: '11',
    name: 'Compliance & Risk',
    rule: 'Defensible claims without unrealistic guarantees.',
    status: 'PASS',
  },
  {
    n: '12',
    name: 'Visual Scannability',
    rule: 'Tight 1 to 3 sentence paragraphs with bold anchors.',
    status: 'PASS',
  },
]

const BANNED = [
  'delve',
  'tapestry',
  'beacon',
  'game changer',
  'testament',
  'plethora',
  'revolutionize',
  'unleash',
  'furthermore',
  'moreover',
  'in conclusion',
  'dive deep',
  "in today's world",
  'look no further',
  'at the end of the day',
]

const FEATURES = [
  {
    code: 'QA-01',
    icon: ScanEye,
    title: '34-Point Deep Scan',
    desc: 'Every pillar broken into precise checks with a clear PASS or FAIL verdict.',
  },
  {
    code: 'QA-02',
    icon: AlertTriangle,
    title: 'Banned Word Radar',
    desc: 'Catches dirty AI cliches and every stray em dash, line by line.',
  },
  {
    code: 'QA-03',
    icon: Gauge,
    title: 'Overall Score Meter',
    desc: 'One weighted score that tells you instantly if it is publish ready.',
  },
  {
    code: 'QA-04',
    icon: Wand2,
    title: 'One-Click Polish',
    desc: 'Rewrites flagged sections and shows you the exact diff to approve.',
  },
  {
    code: 'QA-05',
    icon: FileText,
    title: 'Any Source, One Audit',
    desc: 'Paste, Google Doc, live URL, or file upload. All normalized to one sheet.',
  },
  {
    code: 'QA-06',
    icon: BadgeCheck,
    title: 'PDF Score Report',
    desc: 'Export a shareable audit you can drop into your editorial workflow.',
  },
]

const STEPS = [
  {
    k: 'STEP 01',
    t: 'Feed the scanner',
    d: 'Paste text, a Google Doc link, a live URL, or upload any file.',
    tag: 'Any Source',
  },
  {
    k: 'STEP 02',
    t: 'Set the context',
    d: 'Add title, target keyword, publication platform, and ideal reader persona.',
    tag: 'Context',
  },
  {
    k: 'STEP 03',
    t: 'Run the audit',
    d: 'Get an instant scored sheet across 12 pillars with clear PASS and FAIL flags.',
    tag: '12 Pillars',
  },
  {
    k: 'STEP 04',
    t: 'Polish and ship',
    d: 'Fix weak copy with one click, review the diff side by side, and export the PDF report.',
    tag: '1-Click Polish',
  },
]

const FAQS = [
  {
    q: 'What exactly is a content QA checklist?',
    a: 'A structured set of quality checks applied to writing before publishing. It audits tone, readability, audience fit, E-E-A-T proof, structure, and scannability, and it runs every draft against the 12-Pillar Missive framework.',
    sev: 'Basics',
  },
  {
    q: 'How does it catch robotic AI writing?',
    a: 'It scans for banned cliches like delve and tapestry, flags every em dash, spots throat-clearing openings, and calls out dense paragraphs that read like a machine wrote them.',
    sev: 'Detection',
  },
  {
    q: 'Which sources can I audit?',
    a: 'Paste or write directly, import from a Google Doc link, pull any live URL, or upload a file. Everything is normalized into one clean audit sheet.',
    sev: 'Inputs',
  },
  {
    q: 'Does it really rewrite my content?',
    a: 'One-click polish yes. The AI rewrites flagged sections to meet every pillar, then shows a side-by-side before and after diff so you approve every change.',
    sev: 'Polish',
  },
  {
    q: 'Is there a free plan?',
    a: 'The whole tool is free. Unlimited audits, one-click polish, and PDF exports with no sign-up and no credit card.',
    sev: 'Pricing',
  },
  {
    q: 'Who built the framework behind it?',
    a: 'Himani Kankaria, an SEO strategist with 10+ years optimizing B2B and SaaS content. The 12 pillars formalize the checklist her team uses on every client deliverable.',
    sev: 'Authority',
  },
]

/* ─────────────── Shared Primitives ─────────────── */

function Eyebrow({ children, icon: Icon = Sparkles }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm mb-3.5">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  )
}

function GradientButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-9 py-[18px] text-base font-semibold tracking-[-0.01em] hover:bg-gradient-to-l transition-all duration-300 shadow-[0_32px_53px_rgba(52,124,156,0.36)] cursor-pointer"
    >
      {children}
    </button>
  )
}

/* ─────────────── Banned Word Ticker ─────────────── */
function BannedTicker() {
  const row = (key) => (
    <div className="flex items-center shrink-0 gap-3 pr-3">
      {BANNED.map((w) => (
        <span key={`${key}-${w}`} className="flex items-center gap-1.5 shrink-0">
          <XCircle className="w-4 h-4 text-[#EB8988]" />
          <span className="line-through decoration-[#EB8988] decoration-2 text-[#54595F] font-sans text-xs sm:text-sm whitespace-nowrap">
            {w}
          </span>
          <span className="mx-2 text-[#DEDEDE]">•</span>
        </span>
      ))}
    </div>
  )
  return (
    <section className="border-y border-[#DEDEDE]/60 bg-[#F9F7F6] py-4 overflow-hidden">
      <div className="lp-marquee items-center">
        {row('a')}
        {row('b')}
      </div>
    </section>
  )
}

/* ─────────────── Hero ─────────────── */
function QaHero({ onCta, toolRef, onResultStateChange, hideHeroCopy, resetSignal }) {
  const ref = useScrollReveal()
  return (
    <section className={`relative bg-[#F9F7F6] ${hideHeroCopy ? 'py-4 sm:py-6' : 'py-20 sm:py-28'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] bg-[#DAD0FF]/50 rounded-full blur-3xl lp-float-slow" />
        <div className="absolute -bottom-28 -left-24 w-[420px] h-[420px] bg-[#D8FFD8]/60 rounded-full blur-3xl lp-float-reverse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full border border-[#0C81F3]/5" />
      </div>
      <div className="lp-scanline" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeroCopy && (
          <div ref={ref} className="lp-reveal max-w-2xl mx-auto text-center mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-5 py-2 text-[13px] font-semibold tracking-[-0.01em] shadow-[0_18px_40px_rgba(12,129,243,0.25)] mb-7">
              <ShieldCheck className="w-4 h-4" />
              Missive Digital
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-display font-semibold tracking-[-0.03em] text-[#292929] leading-[1.05]">
              Publish Copy That{' '}
              <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
                Passes Inspection
              </span>{' '}
              On The First Run
            </h1>
            <p className="mt-7 max-w-xl mx-auto text-[17px] leading-relaxed text-[#54595F]">
              Run every draft through an automated 12-pillar quality gate. Catch em dashes, kill
              robotic buzzwords, score the whole piece, and ship clean copy with confidence.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <GradientButton onClick={onCta}>
                Run The QA Scan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('checksheet')
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.pageYOffset - 90
                    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
                  }
                }}
                className="w-full sm:w-auto rounded-full border-2 border-slate-300 bg-white/90 backdrop-blur-xs px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                See 12 Quality Pillars ↓
              </button>
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-2.5">
              {['Zero em dashes', 'Zero buzzwords', 'Score + diff', 'PDF report'].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#DEDEDE] text-[#292929] px-3.5 py-1.5 text-[13px] font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0C81F3]" /> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div ref={toolRef} id="tool" className="relative scroll-mt-24">
          <div className="rounded-[36px] bg-white border border-white/80 shadow-[0_33px_44px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 sm:px-7 py-4 border-b border-[#EEE9E5] bg-[#F9F7F6]">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#292929]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {hideHeroCopy ? 'Content QA Inspection Workspace & Results' : 'Live QA Terminal'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#292929] bg-white border border-[#DEDEDE] rounded-full px-3 py-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-[#0C81F3]" /> No Sign-Up
              </span>
            </div>
            <div className="p-5 sm:p-7">
              <ContentQaPage isEmbedded={true} onResultStateChange={onResultStateChange} resetSignal={resetSignal} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Check Sheet Section ─────────────── */
function CheckSheet() {
  const ref = useScrollReveal()
  const gridRef = useScrollReveal()
  const [open, setOpen] = useState(0)
  return (
    <section id="checksheet" className="py-20 sm:py-24 lg:py-28 bg-white scroll-mt-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div ref={ref} className="lp-reveal max-w-2xl">
          <Eyebrow icon={ShieldCheck}>The Check Sheet</Eyebrow>
          <h2 className="mt-4 text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98]">
            12 Pillars. Scored Line By Line.
          </h2>
          <p className="mt-5 text-[17px] text-[#54595F] leading-relaxed">
            Expand any pillar to read the exact standard. Every draft is measured against all 12
            before it earns publish approval.
          </p>
        </div>

        <div ref={gridRef} className="lp-reveal lp-stagger mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p, i) => {
            const Icon = i % 2 === 0 ? CheckCircle2 : CircleDot
            const isOpen = open === i
            return (
              <div
                key={p.n}
                className={`lp-reveal-child rounded-3xl border transition-all ${
                  isOpen
                    ? 'border-[#0C81F3]/40 bg-[#F9F7F6] shadow-[0_33px_44px_rgba(0,0,0,0.04)]'
                    : 'border-[#E5E1DE] bg-white hover:border-[#0C81F3]/30 hover:bg-[#F9F7F6]'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="font-display text-[13px] font-semibold text-[#0C81F3]">
                    {p.n}
                  </span>
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isOpen ? 'text-[#0C81F3]' : 'text-[#C5C1BD]'}`}
                  />
                  <span className="flex-1 text-[15px] font-semibold text-[#292929] font-display">
                    {p.name}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EAF4EC] text-[#2E7D4F]">
                    <CheckCircle2 className="w-3 h-3" /> {p.status}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#54595F] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 -mt-1 pl-[74px]">
                    <p className="text-[14px] text-[#54595F] leading-relaxed">{p.rule}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Before / After Scrub ─────────────── */
function ScrubComparison() {
  const ref = useScrollReveal()
  const beforeRef = useScrollReveal()
  const afterRef = useScrollReveal()
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#F9F7F6] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#DAD0FF]/40 rounded-full blur-3xl lp-float-slow" />
      <div className="relative max-w-[1140px] mx-auto px-6 sm:px-8">
        <div ref={ref} className="lp-reveal text-center max-w-2xl mx-auto mb-12">
          <div className="flex justify-center mb-1">
            <Eyebrow icon={Sparkles}>Raw Output vs Polished</Eyebrow>
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98]">
            The Same Sentence, Before The Scan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            ref={beforeRef}
            className="lp-reveal-left rounded-[28px] bg-white border border-[#F3D6D4] p-7 shadow-[0_33px_44px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-[#EB8988]" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#C4564F]">
                Caught
              </span>
              <span className="ml-auto font-display text-[12px] text-[#54595F]">3 violations</span>
            </div>
            <p className="text-[15px] text-[#54595F] leading-relaxed">
              "In today's fast-paced world, our game-changing solution will{' '}
              <span className="line-through decoration-[#EB8988] decoration-2">revolutionize</span>{' '}
              your workflow and{' '}
              <span className="line-through decoration-[#EB8988] decoration-2">unleash</span> the
              true potential of your team."
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FDF0EF] text-[#C4564F]">
                buzzword x2
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FDF0EF] text-[#C4564F]">
                cliche
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B07A12]">
                no metric
              </span>
            </div>
          </div>

          <div
            ref={afterRef}
            className="lp-reveal-right rounded-[28px] bg-white border border-[#CDEBDA] p-7 shadow-[0_33px_44px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#2E7D4F]" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#2E7D4F]">
                Approved
              </span>
              <span className="ml-auto font-display text-[12px] text-[#54595F]">1 click polish</span>
            </div>
            <p className="text-[15px] text-[#292929] leading-relaxed">
              "Teams using the old workflow lost 3.2 hours per draft. The same teams now ship 6
              posts a week with the same headcount, and reader retention on those posts is up 28%."
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAF4EC] text-[#2E7D4F]">
                metric x3
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAF4EC] text-[#2E7D4F]">
                insight first
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAF4EC] text-[#2E7D4F]">
                zero cliches
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Workbench Features ─────────────── */
function Workbench() {
  const ref = useScrollReveal()
  const gridRef = useScrollReveal()
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div ref={ref} className="lp-reveal max-w-2xl">
          <Eyebrow icon={Wand2}>The Workbench</Eyebrow>
          <h2 className="mt-4 text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98]">
            Inspector-Grade Tooling For Content
          </h2>
        </div>
        <div
          ref={gridRef}
          className="lp-reveal lp-stagger mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.code}
                className="lp-reveal-child group rounded-[28px] bg-[#F9F7F6] border border-[#EEE9E5] p-7 hover:border-[#0C81F3]/30 hover:bg-white hover:shadow-[0_33px_44px_rgba(0,0,0,0.05)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display text-[12px] font-semibold tracking-[0.08em] text-[#54595F]">
                    {f.code}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-white border border-[#EEE9E5] flex items-center justify-center text-[#0C81F3] group-hover:bg-gradient-to-r group-hover:from-[#0C81F3] group-hover:to-[#EB8988] group-hover:text-white group-hover:border-transparent transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#292929] font-display mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#54595F] leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Runbook Steps ─────────────── */
function Runbook() {
  const ref = useScrollReveal()
  const listRef = useScrollReveal()
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#F9F7F6]">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <div ref={ref} className="lp-reveal lg:sticky lg:top-28">
            <Eyebrow icon={FileText}>The Runbook</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98]">
              From Draft To Approval in 4 Steps
            </h2>
            <p className="mt-5 text-[17px] text-[#54595F] leading-relaxed">
              A repeatable gate your whole team can use before anything goes live.
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div ref={listRef} className="lp-reveal relative space-y-5 sm:space-y-6">
            {/* Connected vertical animated beam */}
            <div className="absolute left-[23px] sm:left-[27px] top-6 bottom-6 w-[2px] lp-timeline-line rounded-full" />
            {STEPS.map((s, i) => (
              <div key={s.k} className="relative flex items-start gap-4 sm:gap-6 group">
                {/* Node / Dot */}
                <div className="relative z-10 shrink-0 w-12 sm:w-14 flex items-center justify-center">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-display font-bold text-xs sm:text-sm text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      i === 3
                        ? 'bg-gradient-to-r from-[#0C81F3] to-[#EB8988] shadow-[#EB8988]/30 ring-4 ring-white'
                        : 'bg-gradient-to-br from-[#0C81F3] to-[#2B95FF] shadow-[#0C81F3]/30 ring-4 ring-white'
                    } lp-dot-glow`}
                  >
                    0{i + 1}
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 rounded-[24px] border border-[#EEE9E5] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0C81F3]/40 hover:shadow-[0_24px_48px_rgba(12,129,243,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-blue-50 text-[#0C81F3] border border-blue-100/80">
                      {s.k}
                    </span>
                    <span className="text-[11px] font-semibold text-[#54595F]/70 uppercase tracking-wider">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-[18px] font-semibold text-[#292929] font-display group-hover:text-[#0C81F3] transition-colors">
                    {s.t}
                  </h3>
                  <p className="text-[14px] text-[#54595F] mt-1.5 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Stamp CTA ─────────────── */
function StampCta({ onCta }) {
  const ref = useScrollReveal()
  return (
    <section className="py-20 sm:py-28 bg-[#F9F7F6]">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div ref={ref} className="lp-reveal relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#DAD0FF] via-[#E7E4FF] to-[#D8FFD8] px-6 sm:px-14 py-14 sm:py-20 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-white/50" />
          <span className="inline-block font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.24em] text-[#292929] border-2 border-[#292929]/70 rounded-xl px-4 py-2 rotate-[-4deg] mb-8 opacity-90 bg-white/40">
            APPROVED FOR PUBLISHING
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-semibold tracking-[-0.02em] text-[#292929] leading-[0.98] max-w-2xl mx-auto">
            Stop Shipping Copy That Fails QA
          </h2>
          <p className="mt-6 text-[17px] text-[#54595F] max-w-xl mx-auto leading-relaxed">
            Run the scan on your next draft. 12 pillars, 34 checks, one-click polish, and a clean
            PDF report: free, no sign-up.
          </p>
          <div className="mt-10 flex justify-center">
            <GradientButton onClick={onCta}>
              Audit My Content Free
              <Sparkles className="w-4 h-4" />
            </GradientButton>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── Landing Page Component ─────────────── */
export default function ContentQaLandingPage() {
  const [hasResults, setHasResults] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const toolRef = useRef(null)

  const handleNewAudit = () => {
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

  useEffect(() => {
    if (window.location.hash === '#tool') {
      setTimeout(scrollToTool, 300)
    }
  }, [scrollToTool])

  return (
    <>
      <Helmet>
        <title>Content QA Checklist: Free AI Tool | Missive Digital</title>
        <meta
          name="description"
          content="Audit blog posts, newsletters, and landing pages against Himani Kankaria's 12-Pillar Content QA Framework. Catch robotic AI fluff, fix weak copy with one-click polish, and publish rank-ready content. Free, no sign-up required."
        />
        <meta
          name="keywords"
          content="content QA checklist, content quality checker, AI content detector, content audit tool, em dash checker, robotic AI writing, content polishing tool, SEO content quality, Himani Kankaria, Missive Digital"
        />
        <link rel="canonical" href="https://tools.missivedigital.com/content-qa" />
        <meta property="og:title" content="Content QA Checklist: Free AI Tool | Missive Digital" />
        <meta
          property="og:description"
          content="Audit any copy against the 12-Pillar Missive QA Framework, catch robotic AI fluff, and fix weak writing with one-click polish. Free, no sign-up required."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tools.missivedigital.com/content-qa" />
        <meta property="og:site_name" content="Missive Digital: Himani's SEO Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Content QA Checklist: Missive Digital" />
        <meta
          name="twitter:description"
          content="Audit any copy against the 12-Pillar Missive QA Framework, catch robotic AI fluff, and fix weak writing with one-click polish."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <div className={`landing-page min-h-screen bg-[#F9F7F6] font-sans ${hasResults ? 'pt-20' : ''}`}>
        {hasResults && (
          <LandingResultsTopbar
            onBack={handleNewAudit}
            backLabel="New Audit / Edit Draft"
            backHint="Reset"
            title="Content QA Inspection Workspace"
            badge="Live Audit"
            maxWidth="max-w-[1400px]"
          />
        )}

        <QaHero
          onCta={scrollToTool}
          toolRef={toolRef}
          onResultStateChange={setHasResults}
          hideHeroCopy={hasResults}
          resetSignal={resetSignal}
        />
        {!hasResults && (
          <>
            <BannedTicker />
            <LandingLiveDemo
              badge="See It Scan"
              heading="Watch a Draft Get Audited Live"
              subheading="Paste a paragraph and watch the scanner catch em dashes, cliches, and weak structure in real time."
              accentIcon={ShieldCheck}
              examples={[
                {
                  label: 'Tone, Style & AI Check',
                  input: 'In today\'s fast-paced world, our game-changing solution will revolutionize your workflow.',
                  outputTitle: '2 Violations Caught',
                  outputBody:
                    'Flagged: throat-clearing preamble ("In today\'s fast-paced world") and banned buzzword ("game-changing"). Replace with a direct, metric-led opening.',
                  outputMeta: ['Tone & Style', '2 Cliches', 'Zero Em Dashes'],
                },
                {
                  label: 'E-E-A-T & Practical Proof',
                  input: 'We help teams write better content faster with AI.',
                  outputTitle: 'Missing Quantifiable Proof',
                  outputBody:
                    'No concrete metric or lived experience detected. Add a specific number: "Teams cut draft time from 3 hours to 40 minutes."',
                  outputMeta: ['E-E-A-T', '0 Metrics Found', 'Insight First'],
                },
                {
                  label: 'Overall Score',
                  input: 'Final pass: polished draft ready for review.',
                  outputTitle: 'Score: 92 / 100',
                  outputBody:
                    '12/12 pillars passed. Zero em dashes, zero robotic cliches, 5 metric anchors, 100% scannable paragraphs. Ready to publish.',
                  outputMeta: ['12/12 Pillars', 'Ready to Publish', 'PDF Export Ready'],
                },
              ]}
            />
            <CheckSheet />
            <ScrubComparison />
            <Workbench />
            <Runbook />
            <LandingFAQ faqs={FAQS} />
            <StampCta onCta={scrollToTool} />
          </>
        )}
      </div>
    </>
  )
}