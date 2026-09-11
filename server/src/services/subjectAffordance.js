export const UNIVERSAL_AFFORDANCES = [
  'understandOverview', // what is it / how it works at a high level
  'chooseOrDecide', // what to look for / how to pick the right one
  'avoidMistakes', // common mistakes, misconceptions, pitfalls
  'costOrValue', // price, value, what it's worth, budgeting
  'compareOptions', // compare types, alternatives, variants
  'faq', // direct answers to common questions
]

export const CONDITIONAL_AFFORDANCES = [
  {
    id: 'setupOrImplement',
    requires: (ctx) => ctx.isHowToSuggestive || ctx.isB2BSuggestive || ctx.isTechnicalProcess,
    reason: 'requires an explicit how-to / setup / implementation signal in the input',
  },
  {
    id: 'troubleshoot',
    requires: (ctx) => ctx.isTechnicalProcess || ctx.isHowToSuggestive,
    reason: 'requires the subject to behave like a system or process that can malfunction',
  },
  {
    id: 'configure',
    requires: (ctx) => ctx.isTechnicalProcess || ctx.isB2BSuggestive,
    reason: 'requires a software/technical-configuration signal',
  },
  {
    id: 'scaleOrOptimize',
    requires: (ctx) => ctx.isB2BSuggestive,
    reason: 'requires a B2B / operational signal',
  },
  {
    id: 'roiOrBusinessCase',
    requires: (ctx) => ctx.isB2BSuggestive || ctx.isCommercialGoal,
    reason: 'requires a B2B signal or an explicit commercial content goal',
  },
  {
    id: 'legalOrRegulatorySteps',
    requires: (ctx) => ctx.isYMYLSuggestive,
    reason: 'requires a legal/medical/financial (YMYL) signal',
  },
  {
    id: 'travelLogistics',
    requires: (ctx) => ctx.isTravelSuggestive,
    reason: 'requires a travel/destination signal',
  },
  {
    id: 'styleOrWear',
    requires: (ctx) => ctx.isWearableOrStylable,
    reason: 'requires a wearable/appearance signal',
  },
  {
    id: 'learnAsSkill',
    requires: (ctx) => ctx.isSkillSuggestive,
    reason: 'requires a skill/practice-learning signal',
  },
]

const PROCESS_ONLY_VERBS = [
  'troubleshoot',
  'troubleshooting',
  'configure',
  'configuring',
  'configuration',
  'implement',
  'implementation',
  'implementing',
  'deploy',
  'deployment',
  'deploying',
  'install',
  'installation',
  'installing',
  'debug',
  'debugging',
]

export function buildAffordanceContext(
  baseCtx,
  { contentGoal = '', subjectTypeAnalysis = null } = {}
) {
  const goal = (contentGoal || '').toLowerCase()
  const isCommercialGoal = /\b(commercial|product|sales|lead|purchase|conversion|revenue)\b/.test(
    goal
  )
  const isEducationalGoal = /\b(educational|awareness|authority|informational|brand)\b/.test(goal)

  // isB2BSuggestive already requires a software/platform/API/SaaS-style
  // word (see deriveInputContext), so on its own it is a reasonable signal
  // that the subject behaves like a configurable system, not just that it
  // is "a business thing." isHowToSuggestive covers the non-B2B case where
  // the input explicitly reads like a process (e.g. "how to set up X").
  const isTechnicalProcess = baseCtx.isHowToSuggestive || baseCtx.isB2BSuggestive

  const isWearableOrStylable = /\b(wear|wearing|worn|outfit|style|styling|accessor)\w*\b/.test(
    baseCtx.text
  )
  const isSkillSuggestive =
    /\b(learn|practice|skill|technique|master(?:ing)?|training|lesson)\b/.test(baseCtx.text)

  const ai = subjectTypeAnalysis || {}

  return {
    ...baseCtx,
    isCommercialGoal,
    isEducationalGoal,
    isTechnicalProcess:
      typeof ai.isActionableProcess === 'boolean' ? ai.isActionableProcess : isTechnicalProcess,
    isWearableOrStylable: typeof ai.isWearable === 'boolean' ? ai.isWearable : isWearableOrStylable,
    isSkillSuggestive: typeof ai.isSkill === 'boolean' ? ai.isSkill : isSkillSuggestive,
    isPurchasable:
      typeof ai.isPurchasable === 'boolean'
        ? ai.isPurchasable
        : baseCtx.isConsumerSuggestive || isCommercialGoal,
  }
}

export function resolveValidAffordances(ctx) {
  const validAffordances = [...UNIVERSAL_AFFORDANCES]
  const invalidOrLowFitAffordances = []
  const confidence = {}

  for (const affordance of CONDITIONAL_AFFORDANCES) {
    const ok = affordance.requires(ctx)
    confidence[affordance.id] = ok ? 0.8 : 0.15
    if (ok) {
      validAffordances.push(affordance.id)
    } else {
      invalidOrLowFitAffordances.push({ id: affordance.id, reason: affordance.reason })
    }
  }

  for (const id of UNIVERSAL_AFFORDANCES) confidence[id] = 0.9

  return { validAffordances, invalidOrLowFitAffordances, confidence }
}

export function validateActionObjectFit(phrase = '', ctx) {
  const lower = String(phrase || '').toLowerCase()
  const matchedVerb = PROCESS_ONLY_VERBS.find((v) => new RegExp(`\\b${v}\\b`, 'i').test(lower))

  if (!matchedVerb) {
    return { natural: true, score: 1, reason: 'No process-only verb present.' }
  }

  if (ctx.isTechnicalProcess || ctx.isB2BSuggestive || ctx.isHowToSuggestive) {
    return {
      natural: true,
      score: 0.9,
      reason: `"${matchedVerb}" fits a process/technical context signal.`,
    }
  }

  return {
    natural: false,
    score: 0.1,
    reason: `"${matchedVerb}" implies a system or process, but nothing in the subject, keywords, or goal suggests this is a process/technical/software subject.`,
  }
}

export function evaluateAngleAffordance({ affordanceId, ctx }) {
  if (UNIVERSAL_AFFORDANCES.includes(affordanceId)) {
    return { natural: true, score: 0.9, reason: 'Universally applicable affordance.' }
  }
  const conditional = CONDITIONAL_AFFORDANCES.find((a) => a.id === affordanceId)
  if (!conditional) {
    return { natural: true, score: 0.5, reason: 'Unknown affordance id, no restriction applied.' }
  }
  const ok = conditional.requires(ctx)
  return {
    natural: ok,
    score: ok ? 0.85 : 0.15,
    reason: ok ? `Signal supports "${affordanceId}".` : conditional.reason,
  }
}

export function prioritizeAffordances(validAffordances, ctx) {
  // B2B contexts (isB2BSuggestive already requires a software/platform/API/
  // SaaS-style signal — see deriveInputContext) lead with the operational
  // concerns that come with running or buying a system: implementation,
  // scaling, and the business case. This is a general "B2B" bucket, not a
  // per-product list.
  const b2bPriority = ['setupOrImplement', 'scaleOrOptimize', 'roiOrBusinessCase', 'configure', 'troubleshoot']
  const commercialPriority = ['chooseOrDecide', 'compareOptions', 'costOrValue', 'roiOrBusinessCase']
  const educationalPriority = ['avoidMistakes', 'faq', 'setupOrImplement', 'learnAsSkill']

  let priorityOrder
  if (ctx.isB2BSuggestive) {
    priorityOrder = [...b2bPriority, ...commercialPriority, ...educationalPriority]
  } else if (ctx.isCommercialGoal) {
    priorityOrder = [...commercialPriority, ...educationalPriority]
  } else {
    priorityOrder = [...educationalPriority, ...commercialPriority]
  }

  return [
    ...priorityOrder,
    ...validAffordances.filter((id) => !priorityOrder.includes(id)),
  ].filter((id, idx, arr) => validAffordances.includes(id) && arr.indexOf(id) === idx)
}

export const AFFORDANCE_ANGLE_META = {
  understandOverview: { label: 'Practical Overview', intent: 'informational' },
  chooseOrDecide: { label: 'Buyer Decision Guide', intent: 'commercial investigation' },
  avoidMistakes: { label: 'Common Mistakes & Traps', intent: 'informational' },
  costOrValue: { label: 'Cost & Value Breakdown', intent: 'commercial investigation' },
  compareOptions: { label: 'Direct Comparison & Versus', intent: 'comparison' },
  faq: { label: 'Reader Questions Answered', intent: 'informational' },
  setupOrImplement: { label: 'Setup & Implementation Guide', intent: 'how-to' },
  troubleshoot: { label: 'Troubleshooting & Fixes', intent: 'problem-solving' },
  configure: { label: 'Configuration Guide', intent: 'how-to' },
  scaleOrOptimize: { label: 'Scaling & Optimization', intent: 'informational' },
  roiOrBusinessCase: { label: 'ROI & Business Case', intent: 'commercial investigation' },
  legalOrRegulatorySteps: { label: 'Rights, Process & Key Steps', intent: 'informational' },
  travelLogistics: { label: 'Logistics & Planning', intent: 'how-to' },
  styleOrWear: { label: 'Styling & Pairing Guide', intent: 'informational' },
  learnAsSkill: { label: 'Skill-Building Roadmap', intent: 'how-to' },
}
