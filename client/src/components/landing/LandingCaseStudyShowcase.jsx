import { useState } from 'react'
import useScrollReveal from './useScrollReveal'
import {
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  Share2,
  Video,
  Quote,
  ChevronRight,
  BookOpen,
  Mail,
  Flame,
  ArrowRight,
  FileText,
  Star,
} from 'lucide-react'

const NARRATIVE = {
  title: 'How Acme Flow Slashed Churn by 77% in 6 Months',
  badge: 'Full Case Study',
  challenge: {
    context:
      'Acme Flow, a B2B SaaS platform for product-led growth, was hemorrhaging customers at 18% MoM churn. Their onboarding flow required 14 steps across 4 screens, causing 65% of new users to abandon before reaching the activation milestone. Support tickets related to "getting started" accounted for 40% of total volume, and CAC payback had stretched to 11 months.',
    bottlenecks: [
      '14-step onboarding across 4 disconnected screens with no progress indicator',
      'No behavioral triggers at critical drop-off points (Step 3, Step 7, Step 11)',
      'Success team relied on manual CSV exports to identify at-risk accounts (48hr delay)',
      'Time-to-first-value averaged 9.2 days vs. industry benchmark of 3.1 days',
    ],
  },
  solution: {
    overview:
      "We rebuilt Acme Flow's entire onboarding from a 14-step linear flow into a guided 3-step checklist that compressed time-to-first-value from 9.2 days to under 24 hours. Behavioral email triggers were deployed at the exact moments users historically dropped off, and a real-time health score dashboard gave the success team instant visibility into account risk.",
    steps: [
      {
        step: 1,
        title: 'Onboarding Compression',
        desc: 'Rebuilt 14-step linear flow into 3 guided steps with progressive disclosure and contextual tooltips. Added progress bar with estimated completion time.',
      },
      {
        step: 2,
        title: 'Behavioral Email Triggers',
        desc: 'Deployed 6 automated emails at drop-off thresholds (Steps 1, 2, 3 completion + 24hr/48hr/7day inactivity). Each email included a direct deep-link back to the exact step.',
      },
      {
        step: 3,
        title: 'Health Score Dashboard',
        desc: 'Built real-time scoring combining login frequency, feature adoption depth, and support ticket sentiment. Alerts fire when score drops below threshold.',
      },
    ],
  },
  kpis: [
    { label: 'Churn Rate', before: '18% MoM', after: '4.2% MoM', delta: '-77%' },
    { label: 'Onboarding Completion', before: '35%', after: '94%', delta: '+84%' },
    { label: 'Time-to-First-Value', before: '9.2 days', after: '<24 hours', delta: '-89%' },
    { label: 'Net ARR Expansion', before: '$2.1M', after: '$3.5M', delta: '+$1.4M' },
  ],
  quote: {
    text: 'We were burning cash trying to acquire users who never even reached activation. The onboarding rebuild changed everything — we went from losing 1 in 5 customers to losing fewer than 1 in 20.',
    author: 'Sarah Chen',
    role: 'VP of Product',
    company: 'Acme Flow',
  },
  takeaways: [
    'Onboarding friction is the highest-leverage churn driver — fixing it delivered 3x the impact of pricing changes tested in Q1.',
    'Behavioral triggers outperform calendar-based emails by 4.2x in activation rate.',
    'Real-time health scores cut success team response time from 48 hours to 12 minutes.',
  ],
}

const BATTLECARD = {
  title: 'Sales Battlecard — Acme Flow',
  badge: 'Competitive Intel',
  killMetric:
    '77% churn reduction in 6 months — verified client outcome, not a projection. Acme Flow clients see $1.4M net ARR expansion within one fiscal quarter.',
  objectionHandlers: [
    {
      objection: '"Your price is higher than Competitor X"',
      rebuttal:
        '"Competitor X offers a basic checklist. Acme Flow delivers behavioral triggers tied to activation milestones, real-time health scoring for the success team, and a compressed onboarding that drove 77% churn reduction. Teams that switch see ROI within 3 months — not 12."',
    },
    {
      objection: '"We already have an onboarding flow built in-house"',
      rebuttal:
        '"Your in-house flow likely covers feature navigation. What it probably does not cover is behavioral trigger deployment at drop-off thresholds, real-time health score alerts, and automated re-engagement sequences. That is the difference between 35% completion and 94% completion."',
    },
    {
      objection: '"We need to see ROI before committing"',
      rebuttal:
        '"Every Acme Flow client receives a 30-day activation audit. If onboarding completion does not improve by at least 40%, you pay nothing. The data is clear: 94% completion rate, $1.4M ARR expansion, 89% faster time-to-first-value."',
    },
  ],
  emailSubjectLines: [
    'Acme Flow cut churn 77% in 6 months — here is the exact playbook',
    'Your onboarding is losing 65% of users. Here is how Acme Flow fixed it.',
    '$1.4M ARR expansion from 3 onboarding changes (case study)',
  ],
  emailBody: `Hi [First Name],

Acme Flow was losing 18% of customers every month. Their 14-step onboarding was the root cause — 65% of users dropped off before reaching activation.

We compressed it to 3 steps, deployed behavioral triggers at drop-off points, and gave the success team real-time health alerts.

Result: churn dropped from 18% to 4.2%. Onboarding completion jumped from 35% to 94%. Net ARR expanded by $1.4M in one quarter.

Worth a 15-minute call to walk through the exact changes?`,
  emailSoftCta: 'Would it make sense to run a 30-day activation audit on your current onboarding?',
}

const SOCIAL_POSTS = {
  title: 'LinkedIn + Twitter + Newsletter',
  badge: 'Repurposed Content',
  linkedIn: `We helped Acme Flow cut churn from 18% to 4.2% in 6 months.

Here is the 3-step playbook we deployed (no budget increase required):

1/ Onboarding Compression
Their 14-step flow was killing activation. We rebuilt it into 3 guided steps with progressive disclosure and contextual tooltips. Completion went from 35% to 94%.

2/ Behavioral Email Triggers
6 automated emails deployed at the exact drop-off thresholds — not calendar-based. Each email includes a deep-link back to the specific step where users stalled.

3/ Real-Time Health Scoring
The success team went from exporting CSVs every 48 hours to real-time alerts when account health drops below threshold. Response time: 48 hours to 12 minutes.

The result:
- Churn: 18% → 4.2% (-77%)
- Onboarding completion: 35% → 94%
- Time-to-first-value: 9.2 days → <24 hours
- Net ARR expansion: +$1.4M in one quarter

Full case study breakdown in comments 👇`,
  twitterThread: `1/ Most SaaS onboarding fails because it optimizes for setup speed, not first-value speed.

Here is how we flipped that for Acme Flow — and cut churn by 77%.

2/ The Problem:
- 14-step onboarding across 4 screens
- 65% of users abandoned before activation
- Churn at 18% MoM
- Support tickets for "getting started" = 40% of total volume

3/ The Fix:
We compressed 14 steps into 3 guided steps with progressive disclosure. Added a progress bar with estimated completion time.

Onboarding completion: 35% → 94%

4/ The Multiplier:
Deployed 6 behavioral emails at the exact drop-off thresholds (not calendar-based). Each email links directly to the step where users stalled.

Time-to-first-value: 9.2 days → <24 hours

5/ The Result:
- Churn: 18% → 4.2%
- Net ARR expansion: +$1.4M in one quarter
- Support tickets for "getting started": 40% → 8%

The full playbook with objection handlers and distribution strategy: [link]`,
  newsletter: `In our latest case breakdown, we detail the exact 3-step onboarding overhaul that drove an 84% uplift in completion for Acme Flow. The key insight: behavioral triggers at drop-off thresholds outperform calendar-based email sequences by 4.2x in activation rate. We also cover the real-time health scoring system that cut success team response time from 48 hours to 12 minutes — and the objection handlers that helped Acme Flow's sales team close 3 enterprise deals using this case study as proof.`,
}

const VIDEO_SCRIPT = {
  title: '60-Second Explainer Script',
  badge: 'Video Ready',
  scenes: [
    {
      time: '0-5s',
      label: 'Hook',
      text: '"What if you could cut churn by 77% without spending a dollar on acquisition?"',
      direction: 'Close-up, direct to camera, bold text overlay',
    },
    {
      time: '5-15s',
      label: 'Problem',
      text: '"Acme Flow was losing 18% of customers every month. Their onboarding had 14 steps across 4 screens. 65% of users dropped off before seeing any value."',
      direction: 'B-roll of cluttered UI, red metrics overlay',
    },
    {
      time: '15-30s',
      label: 'Solution',
      text: '"We rebuilt it into 3 guided steps. Added behavioral triggers at the exact moments users were dropping off. Gave the success team real-time health alerts instead of 48-hour-old CSVs."',
      direction: 'Split-screen: before/after onboarding flow, animated triggers',
    },
    {
      time: '30-50s',
      label: 'Results',
      text: '"Churn fell to 4.2%. Onboarding completion jumped to 94%. And Acme Flow added $1.4M in net ARR — in a single quarter."',
      direction: 'Animated KPI counters, upward trend graph',
    },
    {
      time: '50-60s',
      label: 'CTA',
      text: '"Same playbook. Same team. No budget increase. Want to see the exact steps?"',
      direction: 'End card with URL, QR code',
    },
  ],
}

const INPUT_FIELDS = [
  { label: 'Client / Brand', value: 'Acme Flow', icon: Target },
  { label: 'Industry / Niche', value: 'B2B SaaS / Product-Led Growth', icon: BarChart3 },
  {
    label: 'Challenge',
    value: 'Churn at 18% MoM, onboarding abandonment at 65%, 14-step flow',
    icon: Zap,
  },
  {
    label: 'Solution',
    value: '3-step checklist, behavioral email triggers, real-time health scoring',
    icon: TrendingUp,
  },
  { label: 'Results', value: 'Churn 4.2%, +84% onboarding, +$1.4M ARR expansion', icon: Star },
]

const OUTPUT_TABS = [
  { id: 'narrative', label: 'Case Study', icon: FileText },
  { id: 'battlecard', label: 'Battlecard', icon: Target },
  { id: 'social', label: 'Social Content', icon: Share2 },
  { id: 'video', label: 'Video Script', icon: Video },
]

export default function LandingCaseStudyShowcase() {
  const headerRef = useScrollReveal()
  const cardRef = useScrollReveal({ threshold: 0.1 })
  const [activeTab, setActiveTab] = useState('narrative')

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F9F7F6] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#DAD0FF]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#D8FFD8]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="lp-reveal text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0C81F3] to-[#EB8988] text-white px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Real Output Preview
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            5 Fields In,{' '}
            <span className="bg-gradient-to-r from-[#0C81F3] to-[#EB8988] bg-clip-text text-transparent">
              a Full Revenue Playbook Out
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Enter your client details once. The AI generates a complete case study, sales
            battlecards, objection handlers, social content, video scripts, and AI search citations
            — all Missive QA certified.
          </p>
        </div>

        {/* Main Card */}
        <div
          ref={cardRef}
          className="lp-reveal grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 max-w-6xl mx-auto"
        >
          {/* ── Left: Input Form ── */}
          <div className="rounded-[20px] bg-white border border-[#EEE9E5] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#EEE9E5] bg-[#F9F7F6] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#0C81F3] to-[#EB8988] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </span>
              <div>
                <span className="text-[12px] font-bold text-slate-800 block leading-tight">
                  Case Study Form
                </span>
                <span className="text-[10px] text-slate-500">All fields visible in output</span>
              </div>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {INPUT_FIELDS.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.label} className="group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      {f.label}
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-[#0C81F3]/40 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-[13px] text-slate-700 leading-snug">{f.value}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3.5 border-t border-[#EEE9E5] bg-[#F9F7F6]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0C81F3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3]" />
                  ~30 seconds to fill
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <span>3 sample presets</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Output Panel ── */}
          <div className="rounded-[20px] bg-white border border-[#EEE9E5] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-[#EEE9E5] bg-[#F9F7F6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </span>
                <div>
                  <span className="text-[12px] font-bold text-slate-800 block leading-tight">
                    AI-Generated Output
                  </span>
                  <span className="text-[10px] text-slate-500">
                    6 distribution channels from 5 fields
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Generated
              </span>
            </div>

            {/* Tab Bar */}
            <div className="px-4 pt-3 border-b border-[#EEE9E5] flex gap-1">
              {OUTPUT_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-lg text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0C81F3] border border-[#EEE9E5] border-b-white -mb-px shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[620px]">
              {/* ── Narrative Tab ── */}
              {activeTab === 'narrative' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex-1">{NARRATIVE.title}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#0C81F3] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 flex-shrink-0">
                      {NARRATIVE.badge}
                    </span>
                  </div>

                  {/* Challenge */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[9px] font-black">
                        C
                      </span>
                      The Core Challenge
                    </div>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      {NARRATIVE.challenge.context}
                    </p>
                    <ul className="space-y-1.5">
                      {NARRATIVE.challenge.bottlenecks.map((b, i) => (
                        <li key={i} className="text-[12px] text-slate-600 flex items-start gap-2">
                          <span className="text-rose-400 font-bold mt-0.5">▸</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-black">
                        S
                      </span>
                      The Strategic Solution
                    </div>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      {NARRATIVE.solution.overview}
                    </p>
                    <div className="space-y-2">
                      {NARRATIVE.solution.steps.map((s) => (
                        <div
                          key={s.step}
                          className="flex items-start gap-2.5 bg-white/70 p-2.5 rounded-lg border border-emerald-100"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                            {s.step}
                          </span>
                          <div>
                            <span className="text-[12px] font-bold text-slate-900">{s.title}</span>
                            <span className="text-[12px] text-slate-500"> — {s.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPI Table */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Verified KPIs
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {NARRATIVE.kpis.map((kpi) => (
                        <div
                          key={kpi.label}
                          className="grid grid-cols-[1fr_80px_80px_70px] gap-2 px-4 py-2.5 items-center"
                        >
                          <span className="text-[12px] font-semibold text-slate-800">
                            {kpi.label}
                          </span>
                          <span className="text-[12px] text-slate-400 text-right">
                            {kpi.before}
                          </span>
                          <span className="text-[12px] text-slate-700 text-right font-medium">
                            {kpi.after}
                          </span>
                          <span className="text-[12px] font-bold text-emerald-600 text-right">
                            {kpi.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/60 p-4 relative">
                    <Quote className="w-8 h-8 text-blue-200 absolute top-3 right-3 opacity-50" />
                    <p className="text-[13px] font-medium italic text-slate-700 leading-relaxed pr-6">
                      "{NARRATIVE.quote.text}"
                    </p>
                    <div className="mt-2 text-[11px] font-bold text-[#0C81F3]">
                      {NARRATIVE.quote.author}{' '}
                      <span className="font-normal text-slate-500">
                        · {NARRATIVE.quote.role}, {NARRATIVE.quote.company}
                      </span>
                    </div>
                  </div>

                  {/* Takeaways */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      Key Strategic Takeaways
                    </div>
                    {NARRATIVE.takeaways.map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0C81F3] flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-[12px] text-slate-600 leading-relaxed">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Battlecard Tab ── */}
              {activeTab === 'battlecard' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex-1">{BATTLECARD.title}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0">
                      {BATTLECARD.badge}
                    </span>
                  </div>

                  {/* Kill Metric */}
                  <div className="rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-5 text-white space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Flame className="w-3.5 h-3.5" />
                      The Kill Metric
                    </div>
                    <p className="text-[15px] font-extrabold leading-snug">
                      {BATTLECARD.killMetric}
                    </p>
                  </div>

                  {/* Objection Handlers */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-[#0C81F3]" />
                      Objection Handlers
                    </div>
                    {BATTLECARD.objectionHandlers.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2"
                      >
                        <span className="text-[12px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 inline-block">
                          {item.objection}
                        </span>
                        <p className="text-[13px] text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                          {item.rebuttal}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Email Template */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5" />
                      Cold Outreach Email
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {BATTLECARD.emailSubjectLines.map((subj, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-white text-slate-700 border border-emerald-200 font-mono"
                        >
                          {subj}
                        </span>
                      ))}
                    </div>
                    <pre className="text-[12px] text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-emerald-200">
                      {BATTLECARD.emailBody}
                    </pre>
                    <div className="text-[12px] text-slate-600">
                      <strong className="text-slate-800">Soft CTA: </strong>
                      <span className="text-emerald-600 font-semibold">
                        "{BATTLECARD.emailSoftCta}"
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Social Content Tab ── */}
              {activeTab === 'social' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex-1">
                      {SOCIAL_POSTS.title}
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#0C81F3] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 flex-shrink-0">
                      {SOCIAL_POSTS.badge}
                    </span>
                  </div>

                  {/* LinkedIn */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-200 flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                        LinkedIn Post
                      </span>
                      <span className="text-[10px] text-sky-500 ml-auto">Ready to publish</span>
                    </div>
                    <pre className="p-4 text-[12px] text-slate-700 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {SOCIAL_POSTS.linkedIn}
                    </pre>
                  </div>

                  {/* Twitter Thread */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        X / Twitter Thread
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">5-part thread</span>
                    </div>
                    <pre className="p-4 text-[12px] text-slate-700 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-50">
                      {SOCIAL_POSTS.twitterThread}
                    </pre>
                  </div>

                  {/* Newsletter */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                        Newsletter Excerpt
                      </span>
                    </div>
                    <p className="p-4 text-[12px] text-slate-700 leading-relaxed">
                      {SOCIAL_POSTS.newsletter}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Video Script Tab ── */}
              {activeTab === 'video' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex-1">
                      {VIDEO_SCRIPT.title}
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 flex-shrink-0">
                      {VIDEO_SCRIPT.badge}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {VIDEO_SCRIPT.scenes.map((scene, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white">
                          <span className="text-[11px] font-bold text-[#0C81F3] bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 font-mono">
                            {scene.time}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            {scene.label}
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-[13px] text-slate-800 leading-relaxed italic">
                            {scene.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Video className="w-3 h-3" />
                            {scene.direction}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#EEE9E5] bg-[#F9F7F6] flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />6 outputs
                </span>
                <span className="w-px h-3 bg-slate-200" />
                <span>~15 seconds</span>
                <span className="w-px h-3 bg-slate-200" />
                <span>No sign-up</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0C81F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0C81F3]" />
                All Missive QA certified
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
