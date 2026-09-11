/**
 * Search Intent & Entity Lifecycle Classifier
 * Accurately determines multi-intent search categorization and identifies
 * whether an entity is unreleased or rumored.
 */

export const INTENT_TYPES = [
  'informational',
  'commercial investigation',
  'transactional',
  'navigational',
  'comparison',
  'how-to',
  'news/trending',
  'product research',
  'problem-solving',
]

/**
 * Classifies search intent for a given keyword, subject, and niche type.
 * Returns an array of applicable intents with primaryIntent highlighted.
 */
export function classifySearchIntent(keyword = '', subject = '', nicheType = 'Other') {
  const combined = `${keyword} ${subject}`.toLowerCase()
  const intents = new Set()

  // Comparison intent
  if (/\b(vs|versus|compare|comparison|difference between|alternative|or)\b/i.test(combined)) {
    intents.add('comparison')
  }

  // How-to / Tutorial
  if (/\b(how to|guide|tutorial|steps|walkthrough|setup|configure|build)\b/i.test(combined)) {
    intents.add('how-to')
  }

  // Problem-solving / Troubleshooting
  if (/\b(fix|error|issue|problem|broken|troubleshoot|not working|why does|repair)\b/i.test(combined)) {
    intents.add('problem-solving')
  }

  // Transactional (direct purchase / hiring / download intent)
  if (/\b(buy|order|price|pricing|discount|coupon|hire|deal|quote|cost)\b/i.test(combined)) {
    intents.add('transactional')
  }

  // Commercial investigation (evaluating options before buying)
  if (/\b(best|top|review|worth it|should i buy|pros and cons|recommended|buyers guide|buying guide)\b/i.test(combined)) {
    intents.add('commercial investigation')
  }

  // Product research (broad product query looking for specifications, features, releases)
  if (
    nicheType === 'Consumer Technology' ||
    nicheType === 'Consumer Product' ||
    /\b(specs|specifications|features|camera|battery|screen|model|unboxing)\b/i.test(combined)
  ) {
    intents.add('product research')
  }

  // News / Trending
  if (/\b(news|rumor|rumors|leak|leaks|announced|upcoming|release date|launch|update|2026|2027)\b/i.test(combined)) {
    intents.add('news/trending')
  }

  // If consumer tech product (like "iPhone 18"), multiple natural intents exist
  if (nicheType === 'Consumer Technology') {
    intents.add('product research')
    intents.add('informational')
    if (detectEntityLifecycle(subject, keyword).lifecycleState !== 'released') {
      intents.add('news/trending')
    }
  }

  // Default fallback: informational
  if (intents.size === 0) {
    intents.add('informational')
  }

  const intentList = Array.from(intents)
  const primaryIntent = intentList[0] || 'informational'

  return {
    primaryIntent,
    intents: intentList,
  }
}

/**
 * Detects entity lifecycle state:
 * - 'released': Currently on the market, established user base
 * - 'announced': Officially announced by manufacturer but not yet in stores
 * - 'rumored': Unreleased, based on supply-chain leaks and analyst reports
 * - 'upcoming': Confirmed for near future release
 * - 'unknown': Standard evergreen subject
 */
export function detectEntityLifecycle(subject = '', keyword = '') {
  const text = `${subject} ${keyword}`.toLowerCase()

  // Future iPhone versions check (iPhone 17+ considered rumored/upcoming)
  const iphoneMatch = text.match(/iphone\s*(\d+)/i)
  if (iphoneMatch) {
    const versionNum = parseInt(iphoneMatch[1], 10)
    // iPhone 16 was released in late 2024. iPhone 17+ is rumored/upcoming
    if (versionNum >= 17) {
      return {
        lifecycleState: 'rumored',
        isUnreleased: true,
        reasoning: `iPhone ${versionNum} is a future unreleased generation subject to rumors and leaks.`,
        recommendedPhrasing: ['rumored features', 'what reports suggest', 'what creators should watch for', 'expected upgrades'],
        disallowedPhrasing: ['owners experienced', 'users saw', 'testing proved', 'battery lasts', 'benchmarks show'],
      }
    }
  }

  // Future tech heuristics (e.g. PS6, Switch 2, RTX 6090, Galaxy S26)
  if (/\b(ps6|playstation 6|switch 2|rtx 60\d{2}|galaxy s2[6-9]|pixel 1[0-9])\b/i.test(text)) {
    return {
      lifecycleState: 'rumored',
      isUnreleased: true,
      reasoning: 'Product version indicates a future unannounced or rumored device.',
      recommendedPhrasing: ['what reports suggest', 'what we know so far', 'early leaks', 'features to watch'],
      disallowedPhrasing: ['our testing showed', 'in our hands-on review', 'verified battery life'],
    }
  }

  // Explicit keyword cues
  if (/\b(rumor|rumors|leak|leaks|unannounced|concept|expected|predicted)\b/i.test(text)) {
    return {
      lifecycleState: 'rumored',
      isUnreleased: true,
      reasoning: 'Subject text explicitly references rumors or leaks.',
      recommendedPhrasing: ['what reports suggest', 'rumored specs', 'industry leaks'],
      disallowedPhrasing: ['confirmed test results', 'user feedback indicates'],
    }
  }

  if (/\b(upcoming|coming soon|release date|launch date)\b/i.test(text)) {
    return {
      lifecycleState: 'upcoming',
      isUnreleased: true,
      reasoning: 'Subject focuses on upcoming product release timing.',
      recommendedPhrasing: ['what to expect', 'expected announcement', 'timeline'],
      disallowedPhrasing: ['our long-term test', 'user complaints show'],
    }
  }

  return {
    lifecycleState: 'released',
    isUnreleased: false,
    reasoning: 'Subject appears to be an active, released product or general evergreen topic.',
    recommendedPhrasing: [],
    disallowedPhrasing: [],
  }
}
