import { resolveValidAffordances, AFFORDANCE_ANGLE_META } from '../services/subjectAffordance.js'

export const CONTENT_ANGLES = {
  // Consumer / Product Angles
  buyingGuide: {
    id: 'buyingGuide',
    label: 'Buyer Decision Guide',
    description:
      'Comprehensive buying criteria, feature tradeoffs, pricing, and suitability evaluation.',
    allowedNiches: ['Consumer Technology', 'Consumer Product', 'Ecommerce', 'Gaming', 'Lifestyle'],
  },
  comparisonVs: {
    id: 'comparisonVs',
    label: 'Direct Comparison & Versus',
    description: 'Head-to-head comparison of competing models, generations, or alternatives.',
    allowedNiches: [
      'Consumer Technology',
      'Consumer Product',
      'B2B SaaS',
      'Ecommerce',
      'Gaming',
      'Software Development',
    ],
  },
  releaseAndRumors: {
    id: 'releaseAndRumors',
    label: 'Rumors, Leaks & Expected Features',
    description:
      'Speculation, supply chain reports, analyst expectations, and what we know so far.',
    allowedNiches: ['Consumer Technology', 'Entertainment', 'Gaming', 'Automotive'],
  },
  creatorWorkflow: {
    id: 'creatorWorkflow',
    label: 'Creator & Practical Use-Case Workflows',
    description:
      'Real-world application for video creators, photographers, vloggers, and content producers.',
    allowedNiches: ['Consumer Technology', 'Entertainment', 'Marketing', 'Lifestyle', 'Gaming'],
  },
  featuresAndSpecs: {
    id: 'featuresAndSpecs',
    label: 'Deep Dive: Features & Capabilities',
    description:
      'Thorough examination of hardware, software upgrades, design, and practical functionality.',
    allowedNiches: [
      'Consumer Technology',
      'Consumer Product',
      'Gaming',
      'Software Development',
      'B2B SaaS',
    ],
  },
  troubleshooting: {
    id: 'troubleshooting',
    label: 'Troubleshooting & Setup Guide',
    description:
      'Step-by-step resolution of common setup issues, optimizations, and configuration tips.',
    allowedNiches: [
      'Consumer Technology',
      'Consumer Product',
      'Software Development',
      'Gaming',
      'B2B SaaS',
    ],
  },

  // Travel / Lifestyle Angles
  bestTimeAndSeasons: {
    id: 'bestTimeAndSeasons',
    label: 'Best Time, Weather & Seasonal Guide',
    description:
      'Weather patterns, high vs low seasons, seasonal attractions, and timing considerations.',
    allowedNiches: ['Travel', 'Lifestyle', 'Entertainment'],
  },
  travelItinerary: {
    id: 'travelItinerary',
    label: 'Curated Itinerary & Practical Route',
    description:
      'Realistic day-by-day itineraries, logistical tips, transportation, and highlights.',
    allowedNiches: ['Travel'],
  },
  localTipsAndEtiquette: {
    id: 'localTipsAndEtiquette',
    label: 'Local Customs, Etiquette & Mistakes to Avoid',
    description:
      'Cultural etiquette, safety advice, local scams to avoid, and essential tourist tips.',
    allowedNiches: ['Travel', 'Lifestyle'],
  },
  costAndBudgeting: {
    id: 'costAndBudgeting',
    label: 'Realistic Budget & Expense Breakdown',
    description:
      'Practical costs, accommodation ranges, daily spending expectations, and saving tips.',
    allowedNiches: ['Travel', 'Lifestyle', 'Consumer Product', 'Finance'],
  },

  // Legal / Healthcare / YMYL Angles
  ymylLegalRights: {
    id: 'ymylLegalRights',
    label: 'Legal Rights & Process Overview',
    description:
      'Objective explanation of legal steps, documentation required, and statutory timelines.',
    allowedNiches: ['Legal / YMYL', 'Professional Services'],
  },
  ymylWhatToDo: {
    id: 'ymylWhatToDo',
    label: 'Immediate Steps After an Incident',
    description:
      'Clear, step-by-step actions to protect personal safety, health, and legal standing.',
    allowedNiches: ['Legal / YMYL', 'Healthcare'],
  },
  ymylSelectingProfessional: {
    id: 'ymylSelectingProfessional',
    label: 'How to Choose the Right Specialist',
    description: 'Questions to ask, credentials to look for, and red flags to avoid.',
    allowedNiches: ['Legal / YMYL', 'Healthcare', 'Finance', 'Professional Services'],
  },

  // B2B / SaaS / Enterprise Angles (STRICTLY DISALLOWED FOR ORDINARY CONSUMER GOODS)
  roi: {
    id: 'roi',
    label: 'Financial Modeling & ROI',
    description: 'Calculating economic returns, payback periods, cost reduction, and budget cases.',
    allowedNiches: ['B2B SaaS', 'B2B Services', 'Finance', 'Marketing'],
  },
  techStack: {
    id: 'techStack',
    label: 'Tech Stack & Infrastructure Integration',
    description: 'Architectural evaluation, API integrations, and developer infrastructure.',
    allowedNiches: ['Software Development', 'B2B SaaS', 'Marketing'],
  },
  scalingPlaybook: {
    id: 'scalingPlaybook',
    label: 'Operational Scaling & Team Governance',
    description:
      'Managing team throughput, cross-functional handoffs, and institutional playbooks.',
    allowedNiches: ['B2B SaaS', 'B2B Services', 'Software Development', 'Marketing'],
  },
  implementationRoadmap: {
    id: 'implementationRoadmap',
    label: 'Enterprise Implementation & Adoption',
    description: 'Rollout roadmaps, stakeholder alignment, change management, and user enablement.',
    allowedNiches: ['B2B SaaS', 'B2B Services', 'Software Development', 'Professional Services'],
  },

  // Universal / Educational Angles
  beginnerGuide: {
    id: 'beginnerGuide',
    label: 'Beginner Roadmap & Fundamentals',
    description: 'Jargon-free introduction, foundational concepts, and first steps.',
    allowedNiches: [
      'Consumer Technology',
      'Consumer Product',
      'Gaming',
      'Travel',
      'Lifestyle',
      'Finance',
      'Healthcare',
      'Education',
      'Software Development',
      'B2B SaaS',
      'Marketing',
    ],
  },
  mistakesToAvoid: {
    id: 'mistakesToAvoid',
    label: 'Common Mistakes & Critical Traps',
    description: 'Unpacking common blunders, misconceptions, and practical ways to sidestep them.',
    allowedNiches: [
      'Consumer Technology',
      'Consumer Product',
      'Gaming',
      'Travel',
      'Lifestyle',
      'Finance',
      'Healthcare',
      'Legal / YMYL',
      'Software Development',
      'B2B SaaS',
      'Marketing',
    ],
  },
}

/**
 * Banned B2B / Enterprise Jargon for Consumer, Travel, Lifestyle, and Legal niches.
 * Used by validators and QA hard gates.
 */
export const BANNED_B2B_TERMS_IN_CONSUMER = [
  'roi',
  'unit economics',
  'growth lever',
  'high-growth teams',
  'high growth teams',
  'tech stack',
  'workflow optimization',
  'enterprise scalability',
  'cfo',
  'ebitda',
  'operational cycle velocity',
  'throughput capacity',
  'venture capital due diligence',
  'serial reviews',
  'cross-team communication lag',
  'cross team communication lag',
  'team throughput',
  'bottleneck of manual approvals',
  'modular workflow architecture',
  'human-in-the-loop oversight at critical strategic inflection points',
  'tiered quality assurance review system',
  'internal rate of return',
  'irr',
]

/**
 * Check if an angle is compatible with the given niche.
 */
export function isAngleCompatible(angleId, nicheType) {
  const angle = CONTENT_ANGLES[angleId]
  if (!angle) return false
  return angle.allowedNiches.includes(nicheType)
}

/**
 * Return an array of all compatible angles for a niche and context.
 * Falls back to universal angles when the nicheType is unrecognized or 'Other',
 * ensuring the function always returns a non-empty list for any subject.
 */
export function getCompatibleAngles(nicheType, context = {}) {
  const { isUnreleased = false, isAudienceCreator = false, affordanceCtx = null } = context

  const matched = Object.values(CONTENT_ANGLES).filter((angle) => {
    if (!angle.allowedNiches.includes(nicheType)) return false

    // If product is unreleased/rumored, skip long-term ownership review angles
    if (isUnreleased && angle.id === 'experienceReview') return false
    if (!isUnreleased && angle.id === 'releaseAndRumors' && nicheType !== 'Entertainment')
      return false

    // If creator audience, ensure creator angle is included
    if (isAudienceCreator && angle.id === 'creatorWorkflow') return true

    return true
  })

  if (matched.length > 0) return matched

  // Unrecognized niche: derive angles from general affordance signals
  // instead of assuming a fixed set applies to every possible subject.
  if (affordanceCtx) {
    const { validAffordances } = resolveValidAffordances(affordanceCtx)
    const derived = validAffordances
      .filter((id) => id !== 'understandOverview')
      .map((id) => {
        const meta = AFFORDANCE_ANGLE_META[id]
        return meta
          ? { id, label: meta.label, description: meta.label, allowedNiches: [nicheType] }
          : null
      })
      .filter(Boolean)
    if (derived.length > 0) return derived
  }

  // No affordance context supplied at all (legacy callers): fall back to
  // the smallest set of angles safe for nearly any subject.
  return Object.values(CONTENT_ANGLES).filter((angle) =>
    ['beginnerGuide', 'mistakesToAvoid', 'comparisonVs'].includes(angle.id)
  )
}
