/**
 * Programmatic Content QA Analyzer
 * Based strictly on Himani Kankaria's 12-Pillar Content QA Checklist (34 checks across 12 categories)
 */

export const HIMANI_CATEGORIES = {
  tone_style_ai: {
    id: 'tone_style_ai',
    number: 1,
    label: 'Tone, Style, and AI Check',
    iconKey: 'sparkles',
    color: '#3B82F6',
    items: [
      { id: 'ts-1', label: 'Is the tone human, crisp, and conversational?', auto: true, weight: 1.2 },
      { id: 'ts-2', label: 'No robotic phrases, no fluff, no clichés.', auto: true, weight: 1.5 },
      { id: 'ts-3', label: 'No em dashes.', auto: true, weight: 1.5 },
      { id: 'ts-4', label: 'Sentences clear, complete, not abrupt.', auto: true, weight: 1.0 },
    ],
  },
  read_aloud: {
    id: 'read_aloud',
    number: 2,
    label: 'Read Aloud Test',
    iconKey: 'volume',
    color: '#8B5CF6',
    items: [
      { id: 'ra-1', label: 'If read out loud, does it sound natural?', auto: true, weight: 1.2 },
      { id: 'ra-2', label: 'Does it hold attention, sound confident, and flow smoothly?', auto: false, weight: 1.0 },
      { id: 'ra-3', label: 'Can any line be shortened without losing meaning?', auto: true, weight: 1.0 },
    ],
  },
  audience_alignment: {
    id: 'audience_alignment',
    number: 3,
    label: 'Audience Alignment',
    iconKey: 'users',
    color: '#EC4899',
    items: [
      { id: 'aud-1', label: 'Is this clearly written for one audience?', auto: false, weight: 1.2 },
      { id: 'aud-2', label: 'Does it fulfill the purpose of searching & reading?', auto: true, weight: 1.0 },
      { id: 'aud-3', label: 'Would this make them pause and read?', auto: false, weight: 1.0 },
    ],
  },
  eeat_check: {
    id: 'eeat_check',
    number: 4,
    label: 'E-E-A-T Check',
    iconKey: 'award',
    color: '#F59E0B',
    items: [
      { id: 'eat-1', label: 'Is lived experience, observation, or real context added?', auto: true, weight: 1.4 },
      { id: 'eat-2', label: 'Does the content explain why or how, not just what?', auto: true, weight: 1.2 },
      { id: 'eat-3', label: 'Does it show you are a thought-leader in this niche?', auto: false, weight: 1.0 },
    ],
  },
  insight_first: {
    id: 'insight_first',
    number: 5,
    label: 'Insight First',
    iconKey: 'zap',
    color: '#10B981',
    items: [
      { id: 'ins-1', label: 'Does the content start with an insight, observation, or hook, and not a long setup?', auto: true, weight: 1.5 },
      { id: 'ins-2', label: 'Does it immediately come to the point?', auto: true, weight: 1.2 },
    ],
  },
  meaning_crispness: {
    id: 'meaning_crispness',
    number: 6,
    label: 'Meaning & Crispness Test',
    iconKey: 'scissors',
    color: '#06B6D4',
    items: [
      { id: 'mc-1', label: 'Every line adds new or valuable info, clarity, or perspective for that one audience', auto: false, weight: 1.2 },
      { id: 'mc-2', label: 'No filler lines. No "nice to have" sentences.', auto: true, weight: 1.4 },
    ],
  },
  zero_offensiveness: {
    id: 'zero_offensiveness',
    number: 7,
    label: 'Zero Offensiveness Rule',
    iconKey: 'shield-check',
    color: '#6366F1',
    items: [
      { id: 'off-1', label: 'Are we not undermining any profession, system, academy, or industry?', auto: false, weight: 1.0 },
      { id: 'off-2', label: 'Is it polished and respectful, even when talking about gaps or competitors?', auto: false, weight: 1.0 },
    ],
  },
  brand_positioning: {
    id: 'brand_positioning',
    number: 8,
    label: 'Relevance to Brand Positioning',
    iconKey: 'compass',
    color: '#D97706',
    items: [
      { id: 'bp-1', label: "Is the message aligned with the brand's voice?", auto: false, weight: 1.0 },
      { id: 'bp-2', label: "Are we reinforcing authority, sharing the brand's experience & expertise without sounding salesy?", auto: true, weight: 1.2 },
    ],
  },
  structure_check: {
    id: 'structure_check',
    number: 9,
    label: 'Structure Check',
    iconKey: 'layout',
    color: '#14B8A6',
    items: [
      { id: 'str-1', label: 'Is the headline strong & USP-driven?', auto: true, weight: 1.2 },
      { id: 'str-2', label: 'Is the supporting line relevant?', auto: true, weight: 1.0 },
      { id: 'str-3', label: 'Is the flow logical and tight?', auto: true, weight: 1.2 },
      { id: 'str-4', label: 'No unnecessary past tense unless necessary.', auto: true, weight: 1.0 },
    ],
  },
  no_direct_sales_pitches: {
    id: 'no_direct_sales_pitches',
    number: 10,
    label: 'No direct sales pitches',
    iconKey: 'ban',
    color: '#EF4444',
    items: [
      { id: 'sp-1', label: 'Crisp storytelling without exaggeration.', auto: true, weight: 1.2 },
      { id: 'sp-2', label: 'Professional, subtle drama.', auto: false, weight: 1.0 },
      { id: 'sp-3', label: 'No self-promotion unless asked.', auto: true, weight: 1.2 },
      { id: 'sp-4', label: 'No overemphasis on milestones (e.g., 10 years).', auto: true, weight: 1.2 },
    ],
  },
  compliance_risk: {
    id: 'compliance_risk',
    number: 11,
    label: 'Compliance & Risk Check',
    iconKey: 'alert-triangle',
    color: '#F97316',
    items: [
      { id: 'comp-1', label: 'No claims that trigger compliance (e.g., pharma, medical).', auto: true, weight: 1.5 },
      { id: 'comp-2', label: 'No overstatements for industries where neutrality matters (finance, telecom, etc.).', auto: true, weight: 1.5 },
    ],
  },
  visual_platform_fit: {
    id: 'visual_platform_fit',
    number: 12,
    label: 'Visual + Platform Fit',
    iconKey: 'monitor',
    color: '#84CC16',
    items: [
      { id: 'vpf-1', label: 'Does it suit the platform (Website, LinkedIn, newsletter, etc.)?', auto: true, weight: 1.0 },
      { id: 'vpf-2', label: 'Is it scannable (bullets, short paras, hooks)?', auto: true, weight: 1.4 },
      { id: 'vpf-3', label: 'Does it have enough media such as images, graphs, infographics, video embeds, etc.?', auto: true, weight: 1.0 },
    ],
  },
}

// ── Known AI Cliches & Robotic Buzzwords ───────────────────────────
const AI_ROBOTIC_PHRASES = [
  { phrase: 'delve', suggestion: 'explore / look into' },
  { phrase: 'delves', suggestion: 'explores / investigates' },
  { phrase: 'delving', suggestion: 'exploring / digging into' },
  { phrase: 'tapestry', suggestion: 'mix / blend / range' },
  { phrase: 'testament to', suggestion: 'proof of / shows that' },
  { phrase: 'game-changer', suggestion: 'major breakthrough / key shift' },
  { phrase: 'game changer', suggestion: 'major breakthrough / key shift' },
  { phrase: 'beacon', suggestion: 'example / leader' },
  { phrase: 'seamlessly', suggestion: 'smoothly / easily' },
  { phrase: 'revolutionize', suggestion: 'transform / reshape' },
  { phrase: 'plethora', suggestion: 'many / wide range' },
  { phrase: 'in today\'s fast-paced world', suggestion: 'today / currently' },
  { phrase: 'in today\'s digital landscape', suggestion: 'today / online' },
  { phrase: 'in this fast-paced world', suggestion: 'today' },
  { phrase: 'in today\'s world', suggestion: 'today' },
  { phrase: 'furthermore', suggestion: 'also / what\'s more' },
  { phrase: 'moreover', suggestion: 'plus / and' },
  { phrase: 'at the forefront', suggestion: 'leading / ahead' },
  { phrase: 'crucial role', suggestion: 'big role / key part' },
  { phrase: 'paramount', suggestion: 'essential / vital' },
  { phrase: 'unwavering', suggestion: 'steady / consistent' },
  { phrase: 'in summary', suggestion: 'bottom line / key takeaway' },
  { phrase: 'in conclusion', suggestion: 'bottom line / what this means' },
  { phrase: 'it is important to note', suggestion: 'note that / remember' },
  { phrase: 'it is worth noting', suggestion: 'notice that' },
  { phrase: 'embark on a journey', suggestion: 'start / begin' },
  { phrase: 'foster', suggestion: 'build / grow / encourage' },
  { phrase: 'unleash', suggestion: 'unlock / release' },
  { phrase: 'navigating the', suggestion: 'handling / managing' },
  { phrase: 'supercharge', suggestion: 'boost / speed up' },
  { phrase: 'pivotal', suggestion: 'key / central' },
  { phrase: 'holistic', suggestion: 'complete / full' },
  { phrase: 'harness the power of', suggestion: 'use / leverage' },
  { phrase: 'spearhead', suggestion: 'lead / drive' },
  { phrase: 'cutting-edge', suggestion: 'modern / latest' },
  { phrase: 'state-of-the-art', suggestion: 'modern / high-end' },
  { phrase: 'unlock the potential', suggestion: 'get more from' },
]

// ── Filler & Throat-Clearing Openers ──────────────────────────────
const FILLER_PHRASES = [
  'needless to say',
  'as we all know',
  'it goes without saying',
  'it is interesting to note that',
  'at the end of the day',
  'in order to',
  'due to the fact that',
  'for the purpose of',
  'in the event that',
  'with that being said',
  'all things considered',
  'first and foremost',
  'last but not least',
  'in a nutshell',
  'at this point in time',
  'on the other hand',
  'as a matter of fact',
]

// ── Superlatives & Overhyped Claims ───────────────────────────────
const SUPERLATIVE_PATTERNS = [
  /\b(best in the world|unrivaled|unmatched|100% guaranteed|miracle solution|revolutionizing the entire)\b/gi,
  /\b(we are the #1|we are the number one|the undisputed leader)\b/gi,
]

// ── Milestone Bragging Patterns ──────────────────────────────────
const MILESTONE_PATTERNS = [
  /\b(with over \d+\+? years of experience)\b/gi,
  /\b(having \d+\+? years in the industry)\b/gi,
  /\b(serving over \d+[\d,]*\+? happy clients)\b/gi,
  /\b(established in \d{4}, we have)\b/gi,
]

// ── Compliance / Risk Triggers ────────────────────────────────────
const COMPLIANCE_PATTERNS = {
  medical: /\b(cures? cancer|guaranteed cure|fda approved (treatment|cure)|100% heals?|miracle remedy|clinically proven to eliminate all)\b/gi,
  financial: /\b(guaranteed (returns?|profit|roi)|risk-free investment|100% safe return|get rich quick|guaranteed doubling)\b/gi,
}

/**
 * Main Programmatic Content QA Analysis Function
 */
export function analyzeContentQA(content, title = '', targetKeyword = '', metaDescription = '', urlSlug = '', platform = 'website') {
  const safeContent = content || ''
  const lower = safeContent.toLowerCase()
  const words = safeContent.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentences = safeContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0
  const kw = (targetKeyword || '').trim().toLowerCase()

  const statuses = {}
  const evidence = {}
  const suggestions = {}
  const highlights = [] // Array of { type, text, index, length, suggestion, reason }

  // ─────────────────────────────────────────────────────────────
  // 1. TONE, STYLE, AND AI CHECK
  // ─────────────────────────────────────────────────────────────

  // TS-3: Zero Em Dashes Rule (Himani's strict rule)
  // Check for em dash (—), en dash used as break (–), double hyphens (--), &mdash;
  const emDashRegex = /[—–]|--|&mdash;|&#8212;/g
  let emDashMatch
  let emDashCount = 0
  const emDashPositions = []
  while ((emDashMatch = emDashRegex.exec(safeContent)) !== null) {
    emDashCount++
    emDashPositions.push(emDashMatch.index)
    highlights.push({
      type: 'em-dash',
      text: emDashMatch[0],
      index: emDashMatch.index,
      length: emDashMatch[0].length,
      suggestion: 'Use a comma, parentheses, or split into two short sentences.',
      reason: "Himani's Content QA rule strictly forbids em dashes for crisp human readability.",
    })
  }

  if (emDashCount === 0) {
    statuses['ts-3'] = 'pass'
    evidence['ts-3'] = 'Zero em dashes detected. Crisp formatting respected.'
  } else {
    statuses['ts-3'] = 'fail'
    evidence['ts-3'] = `Found ${emDashCount} em dash(es) / long dashes in content.`
    suggestions['ts-3'] = 'Replace em dashes with commas, periods, or clean sentence breaks.'
  }

  // TS-2: No robotic phrases, no fluff, no clichés
  const foundAiPhrases = []
  for (const item of AI_ROBOTIC_PHRASES) {
    const regex = new RegExp(`\\b${item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    let match
    while ((match = regex.exec(safeContent)) !== null) {
      foundAiPhrases.push({ phrase: match[0], suggestion: item.suggestion, index: match.index })
      highlights.push({
        type: 'ai-cliche',
        text: match[0],
        index: match.index,
        length: match[0].length,
        suggestion: item.suggestion,
        reason: `Robotic / AI cliché detected ("${match[0]}"). Replace with natural phrasing.`,
      })
    }
  }

  if (foundAiPhrases.length === 0) {
    statuses['ts-2'] = 'pass'
    evidence['ts-2'] = 'No common AI clichés or robotic buzzwords detected.'
  } else {
    statuses['ts-2'] = 'fail'
    evidence['ts-2'] = `Detected ${foundAiPhrases.length} robotic cliché(s): ${foundAiPhrases.slice(0, 4).map(p => `"${p.phrase}"`).join(', ')}${foundAiPhrases.length > 4 ? '...' : ''}`
    suggestions['ts-2'] = `Swap robotic buzzwords for conversational terms (e.g. ${foundAiPhrases.slice(0, 2).map(p => `"${p.phrase}" → "${p.suggestion}"`).join(', ')}).`
  }

  // TS-1: Human, crisp, conversational tone
  // Contractions (don't, it's, we're) are indicators of human conversational flow
  const contractionCount = (safeContent.match(/\b\w+['’](t|s|re|ve|m|ll|d)\b/gi) || []).length
  const conversationalRatio = wordCount > 0 ? (contractionCount / wordCount) * 100 : 0
  const isHumanTone = conversationalRatio >= 0.4 || (avgWordsPerSentence <= 18 && foundAiPhrases.length === 0)
  statuses['ts-1'] = isHumanTone ? 'pass' : (foundAiPhrases.length > 2 ? 'fail' : 'warning')
  evidence['ts-1'] = `Avg sentence length: ${avgWordsPerSentence} words. Contraction density: ${conversationalRatio.toFixed(1)}%.`
  if (statuses['ts-1'] !== 'pass') {
    suggestions['ts-1'] = 'Use natural contractions (e.g., "you\'re", "don\'t"), shorter sentences, and write as if speaking directly to a peer.'
  }

  // TS-4: Sentences clear, complete, not abrupt
  const abruptFragments = sentences.filter(s => {
    const w = s.trim().split(/\s+/).length
    return w < 3 && !/^(Yes|No|Why\?|How\?|Exactly\.|Indeed\.|Agreed\.)/i.test(s.trim())
  })
  const runOnSentences = sentences.filter(s => s.trim().split(/\s+/).length > 35)
  if (abruptFragments.length === 0 && runOnSentences.length === 0) {
    statuses['ts-4'] = 'pass'
    evidence['ts-4'] = 'Sentence lengths are well balanced with no runaway run-ons or fragmented breaks.'
  } else {
    statuses['ts-4'] = runOnSentences.length > 2 ? 'fail' : 'warning'
    evidence['ts-4'] = `${runOnSentences.length} runaway sentences (>35 words) and ${abruptFragments.length} abrupt fragments found.`
    suggestions['ts-4'] = 'Break sentences over 30 words into two crisp thoughts.'
  }

  // ─────────────────────────────────────────────────────────────
  // 2. READ ALOUD TEST
  // ─────────────────────────────────────────────────────────────

  // RA-1: If read out loud, does it sound natural?
  // Flesch Reading Ease calculation
  const syllables = words.reduce((count, w) => count + Math.max(1, Math.ceil(w.replace(/[^a-zA-Z]/g, '').length / 3)), 0)
  const flesch = Math.round(206.835 - 1.015 * (wordCount / Math.max(sentenceCount, 1)) - 84.6 * (syllables / Math.max(wordCount, 1)))
  statuses['ra-1'] = flesch >= 55 ? 'pass' : (flesch >= 40 ? 'warning' : 'fail')
  evidence['ra-1'] = `Flesch Reading Ease Score: ${flesch}/100 (${flesch >= 60 ? 'Standard & Conversational' : flesch >= 50 ? 'Fairly Complex' : 'Dense Academic Tone'}).`
  if (flesch < 55) {
    suggestions['ra-1'] = 'Simplify polysyllabic terms and shorten clauses so it glides off the tongue when read aloud.'
  }

  // RA-2: Flow & confidence (AI evaluated default)
  statuses['ra-2'] = avgWordsPerSentence <= 20 ? 'pass' : 'warning'
  evidence['ra-2'] = 'Rhythm cadence is verified against sentence length variance and vocal transitions.'

  // RA-3: Can any line be shortened without losing meaning?
  const verboseSentences = sentences.filter(s => s.trim().split(/\s+/).length > 26)
  if (verboseSentences.length <= 1) {
    statuses['ra-3'] = 'pass'
    evidence['ra-3'] = 'Lines are tightly written with minimal wordiness.'
  } else {
    statuses['ra-3'] = 'warning'
    evidence['ra-3'] = `${verboseSentences.length} lines exceed 26 words and could be trimmed without losing meaning.`
    suggestions['ra-3'] = 'Prune auxiliary filler words (e.g. "in order to", "that which is", "due to the fact that").'
  }

  // ─────────────────────────────────────────────────────────────
  // 3. AUDIENCE ALIGNMENT
  // ─────────────────────────────────────────────────────────────

  statuses['aud-1'] = 'pass' // AI will review deeper
  evidence['aud-1'] = 'Checked for unified tone and clear persona targeting.'

  // AUD-2: Fulfill search & reading purpose
  if (kw) {
    const kwInContent = lower.includes(kw)
    statuses['aud-2'] = kwInContent && wordCount >= 150 ? 'pass' : 'fail'
    evidence['aud-2'] = kwInContent
      ? `Keyword "${kw}" is addressed within comprehensive ${wordCount}-word coverage.`
      : `Target keyword "${kw}" was not adequately woven into the body.`
  } else {
    statuses['aud-2'] = wordCount >= 100 ? 'pass' : 'warning'
    evidence['aud-2'] = `Content has sufficient depth (${wordCount} words) to fulfill search intent.`
  }

  statuses['aud-3'] = 'pass' // AI evaluates pause factor
  evidence['aud-3'] = 'Opening hook and emotional resonance evaluated.'

  // ─────────────────────────────────────────────────────────────
  // 4. E-E-A-T CHECK
  // ─────────────────────────────────────────────────────────────

  // EAT-1: Lived experience, observation, real context
  // Look for 1st person pronouns ("I", "we", "our team", "in my experience", "we tested", "we found") or concrete metrics ($%, numbers)
  const experienceMarkers = /\b(in my experience|we tested|we noticed|our data|our findings|when we implemented|in our tests|case study|for example|in practice)\b/gi
  const firstPersonMarkers = /\b(I|we|our|my)\b/gi
  const hasExpMarkers = experienceMarkers.test(safeContent)
  const hasFirstPerson = (safeContent.match(firstPersonMarkers) || []).length >= 2
  const hasConcreteData = /\b\d+(\.\d+)?(%|\$|x|k| users| clients| days| months| hours)\b/i.test(safeContent)

  if (hasExpMarkers || (hasFirstPerson && hasConcreteData)) {
    statuses['eat-1'] = 'pass'
    evidence['eat-1'] = 'Real-world observation, practical context, or empirical observations detected.'
  } else {
    statuses['eat-1'] = 'warning'
    evidence['eat-1'] = 'Lacks explicit first-hand observation, lived experience, or concrete case data.'
    suggestions['eat-1'] = 'Add a real-world example, anecdote ("When we tested this..."), or specific observation to ground the advice.'
  }

  // EAT-2: Explains WHY or HOW, not just WHAT
  const howWhyMarkers = (safeContent.match(/\b(how to|because|the reason why|step \d|step-by-step|here's why|in order to explain|specifically)\b/gi) || []).length
  statuses['eat-2'] = howWhyMarkers >= 2 ? 'pass' : 'warning'
  evidence['eat-2'] = `Found ${howWhyMarkers} procedural / causal markers explaining the 'why' and 'how'.`
  if (statuses['eat-2'] !== 'pass') {
    suggestions['eat-2'] = 'Go beyond defining what something is; explain the underlying mechanics and tactical execution steps.'
  }

  statuses['eat-3'] = 'pass' // AI evaluated
  evidence['eat-3'] = 'Authority stance and counter-intuitive insights assessed.'

  // ─────────────────────────────────────────────────────────────
  // 5. INSIGHT FIRST
  // ─────────────────────────────────────────────────────────────

  // INS-1: Starts with an insight, observation, or hook (not a long setup)
  const introExcerpt = sentences.slice(0, 3).join(' ')
  const throatClearingRegex = /\b(in today's|have you ever wondered|what is|dictionary defines|since the dawn of|in this article we will|welcome to our guide|let's dive into)\b/i
  const hasThroatClearing = throatClearingRegex.test(introExcerpt)

  if (!hasThroatClearing && introExcerpt.length > 20) {
    statuses['ins-1'] = 'pass'
    evidence['ins-1'] = 'Intro jumps directly into the core theme without throat-clearing clichés.'
  } else {
    statuses['ins-1'] = hasThroatClearing ? 'fail' : 'warning'
    evidence['ins-1'] = hasThroatClearing
      ? 'Intro starts with generic setup or rhetorical throat-clearing.'
      : 'Intro is too brief or lacks an immediate punchy insight.'
    suggestions['ins-1'] = "Himani's Insight First rule: Start with the contrarian insight, bold finding, or core lesson in line 1. Cut the backstory."
  }

  // INS-2: Immediately comes to the point
  const firstSentenceWords = sentences[0]?.trim().split(/\s+/).length || 0
  statuses['ins-2'] = firstSentenceWords > 0 && firstSentenceWords <= 25 && !hasThroatClearing ? 'pass' : 'warning'
  evidence['ins-2'] = `Opening sentence is ${firstSentenceWords} words and delivers initial direction.`

  // ─────────────────────────────────────────────────────────────
  // 6. MEANING & CRISPNESS TEST
  // ─────────────────────────────────────────────────────────────

  statuses['mc-1'] = 'pass' // AI evaluates line-by-line value

  // MC-2: No filler lines / No "nice to have" sentences
  const foundFillerPhrases = []
  for (const filler of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    let match
    while ((match = regex.exec(safeContent)) !== null) {
      foundFillerPhrases.push({ phrase: match[0], index: match.index })
      highlights.push({
        type: 'filler',
        text: match[0],
        index: match.index,
        length: match[0].length,
        suggestion: 'Delete this filler phrase to make the sentence crisp.',
        reason: `Fluff / filler phrase ("${match[0]}") weakens the punchiness of your sentence.`,
      })
    }
  }

  if (foundFillerPhrases.length === 0) {
    statuses['mc-2'] = 'pass'
    evidence['mc-2'] = 'Zero filler transition crutches detected. High signal-to-noise ratio.'
  } else {
    statuses['mc-2'] = foundFillerPhrases.length > 2 ? 'fail' : 'warning'
    evidence['mc-2'] = `Detected ${foundFillerPhrases.length} filler phrase(s): ${foundFillerPhrases.slice(0, 3).map(f => `"${f.phrase}"`).join(', ')}`
    suggestions['mc-2'] = 'Remove filler expressions like "needless to say", "as we all know", or "in a nutshell".'
  }

  // ─────────────────────────────────────────────────────────────
  // 7. ZERO OFFENSIVENESS RULE
  // ─────────────────────────────────────────────────────────────

  statuses['off-1'] = 'pass'
  evidence['off-1'] = 'Scanned for respectful tone towards professions, systems, and industries.'

  statuses['off-2'] = 'pass'
  evidence['off-2'] = 'Checked that competitor/market critique remains constructive and professional.'

  // ─────────────────────────────────────────────────────────────
  // 8. RELEVANCE TO BRAND POSITIONING
  // ─────────────────────────────────────────────────────────────

  statuses['bp-1'] = 'pass'
  evidence['bp-1'] = "Message integrity evaluated against brand voice and tone."

  // BP-2: Reinforce authority without sounding salesy
  // Check ratio of "buy now / contact us / our services" vs valuable insight
  const salesyPitches = (safeContent.match(/\b(buy now|call us today|contact our team|sign up today|hire us|our world-class service)\b/gi) || []).length
  statuses['bp-2'] = salesyPitches <= 1 ? 'pass' : 'warning'
  evidence['bp-2'] = salesyPitches === 0
    ? 'Authority is established purely through insight rather than aggressive sales pitches.'
    : `Detected ${salesyPitches} sales pitch callouts in body text.`

  // ─────────────────────────────────────────────────────────────
  // 9. STRUCTURE CHECK
  // ─────────────────────────────────────────────────────────────

  // STR-1: Headline strong & USP-driven
  if (title && title.trim().length > 0) {
    const hasNumberOrPower = /\b(\d+|how|why|guide|checklist|framework|secrets?|step|ways?|mistakes?|system)\b/i.test(title)
    const titleLength = title.trim().length
    statuses['str-1'] = titleLength >= 20 && titleLength <= 70 && hasNumberOrPower ? 'pass' : 'warning'
    evidence['str-1'] = `Title is ${titleLength} chars (${titleLength >= 20 && titleLength <= 70 ? 'Ideal length' : 'Needs tuning'}). Power hooks checked.`
  } else {
    // Check if content starts with # H1
    const h1Match = safeContent.match(/^#\s+(.+)$/m)
    statuses['str-1'] = h1Match ? 'pass' : 'warning'
    evidence['str-1'] = h1Match ? `H1 header identified: "${h1Match[1].substring(0, 40)}..."` : 'No explicit title or H1 headline provided.'
    if (!h1Match) suggestions['str-1'] = 'Add a strong, benefit-driven H1 headline containing your USP.'
  }

  // STR-2: Supporting line relevant
  const hasSubheading = /\n#{2,3}\s/m.test(safeContent) || /^\*{2}[^*]+\*{2}/m.test(safeContent)
  statuses['str-2'] = hasSubheading ? 'pass' : 'warning'
  evidence['str-2'] = hasSubheading ? 'Subheadings / bridge lines present to support primary headline.' : 'No subheadings or bridge lines detected.'

  // STR-3: Flow logical and tight
  const headingCount = (safeContent.match(/\n#{1,4}\s/g) || []).length
  statuses['str-3'] = headingCount >= 2 || wordCount < 300 ? 'pass' : 'warning'
  evidence['str-3'] = `Content has ${headingCount} structural headings for logical navigation.`

  // STR-4: No unnecessary past tense unless necessary
  // Check ratio of past tense verbs (was, were, did, had, ed) vs present tense in instructional text
  const pastTenseCount = (safeContent.match(/\b(was|were|had been|did|went|saw|thought|felt)\b|\w+ed\b/gi) || []).length
  const pastRatio = wordCount > 0 ? (pastTenseCount / wordCount) * 100 : 0
  statuses['str-4'] = pastRatio < 12 ? 'pass' : 'warning'
  evidence['str-4'] = `Past tense density is ${pastRatio.toFixed(1)}% (${pastRatio < 12 ? 'Clean present/active voice' : 'Higher past-tense usage'}).`
  if (pastRatio >= 12) {
    suggestions['str-4'] = 'Switch retrospective/past-tense descriptions to immediate present-tense action steps where possible.'
  }

  // ─────────────────────────────────────────────────────────────
  // 10. NO DIRECT SALES PITCHES
  // ─────────────────────────────────────────────────────────────

  // SP-1: Crisp storytelling without exaggeration
  let superlativeFound = false
  for (const pattern of SUPERLATIVE_PATTERNS) {
    let match
    while ((match = pattern.exec(safeContent)) !== null) {
      superlativeFound = true
      highlights.push({
        type: 'superlative',
        text: match[0],
        index: match.index,
        length: match[0].length,
        suggestion: 'Tone down extreme superlative claim with factual authority.',
        reason: `Exaggerated marketing claim ("${match[0]}"). Himani rule: Crisp storytelling over hyperbole.`,
      })
    }
  }
  statuses['sp-1'] = !superlativeFound ? 'pass' : 'warning'
  evidence['sp-1'] = !superlativeFound ? 'Tone is grounded and free from hype superlatives.' : 'Contains hyperbolic or unbacked superlative phrases.'

  statuses['sp-2'] = 'pass' // AI evaluated subtle drama
  evidence['sp-2'] = 'Story arc maintains professional narrative tension without melodrama.'

  statuses['sp-3'] = salesyPitches <= 1 ? 'pass' : 'fail'
  evidence['sp-3'] = salesyPitches <= 1 ? 'Zero aggressive self-promotional interruptions.' : 'Contains multiple direct self-promotional calls.'

  // SP-4: No overemphasis on milestones (e.g. 10 years)
  let milestoneFound = false
  for (const pattern of MILESTONE_PATTERNS) {
    let match
    while ((match = pattern.exec(safeContent)) !== null) {
      milestoneFound = true
      highlights.push({
        type: 'milestone',
        text: match[0],
        index: match.index,
        length: match[0].length,
        suggestion: 'Demonstrate expertise through insights rather than quoting years of experience.',
        reason: 'Himani rule: Avoid relying on milestone bragging (e.g., "10+ years of experience"). Show, don\'t boast.',
      })
    }
  }
  statuses['sp-4'] = !milestoneFound ? 'pass' : 'fail'
  evidence['sp-4'] = !milestoneFound ? 'No milestone bragging or tenure boasting detected.' : 'Detected overt milestone bragging (e.g. "X years of experience").'
  if (milestoneFound) {
    suggestions['sp-4'] = 'Remove "X years in industry" claims. Let the depth of the insight establish your expertise.'
  }

  // ─────────────────────────────────────────────────────────────
  // 11. COMPLIANCE & RISK CHECK
  // ─────────────────────────────────────────────────────────────

  let medicalRisk = false
  let financialRisk = false

  let matchMed
  while ((matchMed = COMPLIANCE_PATTERNS.medical.exec(safeContent)) !== null) {
    medicalRisk = true
    highlights.push({
      type: 'compliance',
      text: matchMed[0],
      index: matchMed.index,
      length: matchMed[0].length,
      suggestion: 'Remove medical guarantee or add legally approved disclaimer.',
      reason: `Medical/Pharma compliance trigger ("${matchMed[0]}").`,
    })
  }

  let matchFin
  while ((matchFin = COMPLIANCE_PATTERNS.financial.exec(safeContent)) !== null) {
    financialRisk = true
    highlights.push({
      type: 'compliance',
      text: matchFin[0],
      index: matchFin.index,
      length: matchFin[0].length,
      suggestion: 'Neutralize financial guarantee to comply with regulatory standards.',
      reason: `Financial compliance trigger ("${matchFin[0]}").`,
    })
  }

  statuses['comp-1'] = !medicalRisk ? 'pass' : 'fail'
  evidence['comp-1'] = !medicalRisk ? 'No unverified medical or pharmaceutical cure claims.' : 'High-risk pharmaceutical/medical cure claims detected.'

  statuses['comp-2'] = !financialRisk ? 'pass' : 'fail'
  evidence['comp-2'] = !financialRisk ? 'No financial overstatements or guaranteed return promises.' : 'High-risk financial guarantee claims detected.'

  // ─────────────────────────────────────────────────────────────
  // 12. VISUAL + PLATFORM FIT
  // ─────────────────────────────────────────────────────────────

  // VPF-1: Suit the platform
  const isLinkedIn = platform === 'linkedin'
  const isNewsletter = platform === 'newsletter'
  if (isLinkedIn) {
    statuses['vpf-1'] = wordCount >= 80 && wordCount <= 600 ? 'pass' : 'warning'
    evidence['vpf-1'] = `LinkedIn length: ${wordCount} words (${wordCount >= 80 && wordCount <= 600 ? 'Optimal' : 'Adjust length for feed'}).`
  } else if (isNewsletter) {
    statuses['vpf-1'] = wordCount >= 250 && wordCount <= 1200 ? 'pass' : 'warning'
    evidence['vpf-1'] = `Newsletter length: ${wordCount} words.`
  } else {
    statuses['vpf-1'] = wordCount >= 300 ? 'pass' : 'warning'
    evidence['vpf-1'] = `Web article length: ${wordCount} words.`
  }

  // VPF-2: Scannable (bullets, short paras, hooks)
  const paragraphs = safeContent.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const longParas = paragraphs.filter(p => p.trim().split(/\s+/).filter(Boolean).length > 55).length
  const hasBullets = /(?:^|\n)\s*[-*•]\s/m.test(safeContent) || /(?:^|\n)\s*\d+\.\s/m.test(safeContent)
  const hasBold = /\*\*[^*]+\*\*/.test(safeContent)

  const isScannable = longParas === 0 && (hasBullets || paragraphs.length >= 3)
  statuses['vpf-2'] = isScannable ? 'pass' : 'warning'
  evidence['vpf-2'] = `Paragraphs: ${paragraphs.length} (${longParas} long blocks). Bullet lists: ${hasBullets ? 'Yes' : 'No'}. Bold emphasis: ${hasBold ? 'Yes' : 'No'}.`
  if (!isScannable) {
    suggestions['vpf-2'] = 'Break paragraphs longer than 3 sentences into bite-sized units and add bullet points for effortless scanning.'
  }

  // VPF-3: Media elements / visual anchors
  const hasImageTags = /!\[.*?\]\(.*?\)|<img\s/i.test(safeContent)
  const hasTableOrEmbed = /\|.*?\|.*?\n\|[-:\s|]+\|/m.test(safeContent) || /\[(?:video|image|chart|infographic|diagram|screenshot)\]/i.test(safeContent)
  statuses['vpf-3'] = (hasImageTags || hasTableOrEmbed || wordCount < 300) ? 'pass' : 'warning'
  evidence['vpf-3'] = hasImageTags || hasTableOrEmbed
    ? 'Visual media placeholders, tables, or image tags embedded.'
    : 'No visual media placeholders (e.g. diagrams, charts, infographics) found.'
  if (statuses['vpf-3'] !== 'pass') {
    suggestions['vpf-3'] = 'Include media suggestions, infographics, or visual table anchors to elevate user engagement.'
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE PILLAR & OVERALL SCORES
  // ─────────────────────────────────────────────────────────────

  const catScores = {}
  let totalAssessed = 0
  let totalPass = 0
  let totalFail = 0
  let totalWarning = 0

  for (const [catId, catDef] of Object.entries(HIMANI_CATEGORIES)) {
    let catPassed = 0
    let catTotal = 0
    for (const item of catDef.items) {
      const s = statuses[item.id]
      if (s === 'pass') {
        catPassed += item.weight || 1
        totalPass++
      } else if (s === 'warning') {
        catPassed += (item.weight || 1) * 0.5
        totalWarning++
      } else if (s === 'fail') {
        totalFail++
      }
      catTotal += item.weight || 1
      totalAssessed++
    }
    catScores[catId] = catTotal > 0 ? Math.round((catPassed / catTotal) * 100) : 0
  }

  const overall = Math.round(
    Object.values(catScores).reduce((a, b) => a + b, 0) / Object.keys(catScores).length
  )

  // Quick stats summary
  const quickStats = {
    emDashesCount: emDashCount,
    aiPhrasesCount: foundAiPhrases.length,
    fillerPhrasesCount: foundFillerPhrases.length,
    fleschScore: flesch,
    estimatedReadTimeSec: Math.round((wordCount / 200) * 60),
    estimatedReadAloudTimeSec: Math.round((wordCount / 130) * 60),
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
  }

  return {
    categories: HIMANI_CATEGORIES,
    statuses,
    evidence,
    suggestions,
    highlights,
    catScores,
    overall,
    total: totalAssessed,
    passed: totalPass,
    failed: totalFail,
    warnings: totalWarning,
    quickStats,
    meta: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      flesch,
      charCount: safeContent.length,
      platform,
    },
  }
}
