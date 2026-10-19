// Shared helpers for the Hub & Spoke planner.

export const list = (a) => (Array.isArray(a) ? a : a ? [a] : [])

export const stageKey = (s) =>
  /tofu|top/i.test(s || '')
    ? 'tofu'
    : /mofu|mid/i.test(s || '')
      ? 'mofu'
      : /bofu|bottom/i.test(s || '')
        ? 'bofu'
        : 'other'

const STAGE = {
  tofu: 'Awareness · ToFu',
  mofu: 'Consideration · MoFu',
  bofu: 'Decision · BoFu',
}
export const stageLabel = (s) => STAGE[stageKey(s)] || s || ''
export const stageShort = (s) => stageLabel(s).split(' · ')[0]

export const hostOf = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}
export const pathOf = (u) => {
  try {
    const x = new URL(u)
    return x.pathname === '/' ? x.hostname : x.pathname
  } catch {
    return u
  }
}
export const slugOf = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

export const isExisting = (r) =>
  r && r.status === 'existing' && /^https?:\/\//i.test(r.existing_url || '')

// localStorage keys for the shortlist, plan history, outlines, drafts and lead unlock
export const STORE_KEYS = {
  lead: 'hsp-lead',
  saved: 'hsp-saved',
  history: 'hsp-history',
  outlines: 'hsp-outlines',
  drafts: 'hsp-drafts',
  side: 'hsp-side',
}
export const store = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k) || 'null')
    } catch {
      return null
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {
      /* storage full or blocked: the data stays on screen */
    }
  },
}

export const BLANK_FIELDS = {
  input: '',
  info: '',
  level: 'Balanced',
  existing: '',
  industry: '',
  saved: '',
  url: '',
  source: '',
  source_name: '',
}

// One row of the plan as a flat record (pillar when i < 0)
export function rowData(plan, i, topic = '') {
  const h = plan.hub
  const x = plan.spokes[i]
  return i < 0
    ? {
        type: 'Pillar',
        title: h.working_title,
        stage: h.funnel_stage,
        level: h.reading_level,
        purpose: h.business_goal,
        format: h.content_format,
        intent: h.search_intent || '',
        link: '',
        cta: h.cta || '',
        topic,
      }
    : {
        type: 'Supporting',
        title: x.working_title,
        stage: x.funnel_stage,
        level: x.audience_level,
        purpose: x.business_purpose,
        format: x.format_angle,
        intent: x.search_intent,
        link: x.linking_hook,
        cta: x.cta,
        topic,
      }
}

// The request body for an outline of row i
export function outlineContext(plan, i, fields) {
  const s = plan.summary || {}
  const d = rowData(plan, i, fields?.input || '')
  return {
    page: d,
    pillar: plan.hub.working_title,
    siblings: plan.spokes
      .map((x) => x.working_title)
      .filter((t) => t !== d.title)
      .slice(0, 14),
    audience: s.target_icp || '',
    offer: s.product_offer || '',
    industry: fields?.industry || '',
    pages: list(plan.site?.pages)
      .slice(0, 40)
      .map((p) => p.url + ' | ' + (p.title || '')),
  }
}

// Outline as editable strings: list fields become one item per line
export function normOutline(o, d) {
  const lines = (a) =>
    list(a)
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .join('\n')
  return {
    title: String(o.title || d.title),
    meta_title: String(o.meta_title || ''),
    meta_description: String(o.meta_description || ''),
    primary_keyword: String(o.primary_keyword || ''),
    secondary_keywords: list(o.secondary_keywords).join(', '),
    search_intent: String(o.search_intent || d.intent || ''),
    word_count: String(o.word_count || ''),
    sections: list(o.sections)
      .filter((x) => x && x.heading)
      .map((x) => ({ heading: String(x.heading), points: lines(x.points) })),
    faqs: lines(o.faqs),
    internal_links: list(o.internal_links)
      .filter((x) => x && (x.anchor || x.target))
      .map((x) => `${x.anchor || ''} -> ${x.target || ''}`)
      .join('\n'),
    cta: String(o.cta || d.cta || ''),
  }
}

export function outlineMd(d) {
  const pts = (t) =>
    String(t || '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
  return (
    `# ${d.title}\n\n- **Meta title:** ${d.meta_title}\n- **Meta description:** ${d.meta_description}\n- **Primary keyword:** ${d.primary_keyword}\n- **Secondary keywords:** ${d.secondary_keywords}\n- **Search intent:** ${d.search_intent}\n- **Suggested length:** ${d.word_count} words\n\n` +
    d.sections
      .map(
        (x) =>
          `## ${x.heading}\n${pts(x.points)
            .map((l) => (/^h3:\s*/i.test(l) ? `\n### ${l.replace(/^h3:\s*/i, '')}` : `- ${l}`))
            .join('\n')}`
      )
      .join('\n\n') +
    `\n\n## FAQs\n${pts(d.faqs)
      .map((l) => `- ${l}`)
      .join('\n')}\n\n## Internal links\n${pts(d.internal_links)
      .map((l) => `- ${l}`)
      .join('\n')}\n\n## Call to action\n${d.cta}\n`
  )
}

const LABEL_RE =
  /\*\*\s*(how it works|what (this|it) means|the benefit|benefits?|why it matters|example( scenario)?|key takeaway|takeaway|the problem|the solution|in practice|pro tip|bottom line)\s*:?\s*\*\*\s*:?/gi

// Problems the page can see for itself in a draft; fed back automatically on every rewrite.
export function autoFeedback(md) {
  const out = []
  const labels = (md.match(LABEL_RE) || []).length
  const media = (md.match(/\[(IMAGE|INFOGRAPHIC|VIDEO|TABLE):/g) || []).length
  const proof = (md.match(/\[(STAT|EXAMPLE|QUOTE):/g) || []).length
  const words = md.split(/\s+/).length
  if (labels)
    out.push(
      `The previous draft used ${labels} labelled lead-ins such as "How it works:", "Example scenario:" or "The benefit:". Remove every one and write each section as one flowing piece where the why, the how and the proof are blended, never named.`
    )
  if (media < (words > 1200 ? 4 : 3))
    out.push(
      `The previous draft had only ${media} media placeholders. Add an [IMAGE] in the first screen, an [INFOGRAPHIC] or [TABLE] where data or steps pile up, and a [VIDEO] where a walkthrough helps.`
    )
  if (proof < 3)
    out.push(
      `Only ${proof} proof slots ([STAT], [EXAMPLE], [QUOTE]). Every section needs proof: a sourced number, a before-and-after, a real scenario or a practitioner quote, placed where it belongs.`
    )
  return out.join('\n')
}

export function spokeText(x, i) {
  return `Supporting page ${i + 1}: ${x.working_title}\nFunnel stage: ${x.funnel_stage}\nWritten for: ${x.audience_level}\nPurpose: ${x.business_purpose}\nFormat: ${x.format_angle}\nSearch intent: ${x.search_intent}\nLink back to pillar: ${x.linking_hook}\nCall to action: ${x.cta}`
}

export function toMarkdown(d, withSummary) {
  const s = withSummary ? d.summary || {} : {}
  const h = d.hub || {}
  const l = d.linking || {}
  const b = (a) =>
    list(a)
      .map((x) => `- ${x}`)
      .join('\n')
  const head = withSummary
    ? `## Content Strategy Summary
- **Target ICP:** ${s.target_icp}
- **Primary Goal:** ${s.primary_goal}
- **Product / Offer:** ${s.product_offer}
- **Core Search Intent:** ${s.core_search_intent}
- **Hub Concept:** ${s.hub_concept}${s.business_type ? `\n- **Business Type:** ${s.business_type}` : ''}${
        list(s.our_suggestions).length
          ? `\n- **What We Would Also Suggest:**\n${list(s.our_suggestions)
              .map((x) => `  - ${x}`)
              .join('\n')}`
          : ''
      }
- **Assumptions Made:**
${list(s.assumptions)
  .map((x) => `  - ${x}`)
  .join('\n')}

---

`
    : ''
  return (
    head +
    `## HUB PAGE (Pillar Content)
* **Working Title:** ${h.working_title}
* **Funnel Stage:** ${h.funnel_stage}
* **Target Reading Level:** ${h.reading_level}
* **Primary Business Goal:** ${h.business_goal}
* **Content Format:** ${h.content_format}
* **Target Search & Reading Intent:** ${h.intent}
${withSummary ? `* **Strategic Value:** ${h.strategic_value}\n` : ''}
---

## SPOKE PAGES (Cluster Content)
${list(d.spokes)
  .map(
    (x, i) => `
### Spoke ${i + 1}: ${x.working_title}
* **Group:** ${x.group || ''}
* **Funnel Stage:** ${x.funnel_stage}
* **Audience Level:** ${x.audience_level}
* **Business Purpose:** ${x.business_purpose}
* **Format Angle:** ${x.format_angle}
* **Search Intent:** ${x.search_intent}
* **Internal Linking Hook:** ${x.linking_hook}
* **CTA / Conversion Trigger:** ${x.cta}`
  )
  .join('\n')}

---

## Internal Linking & Cluster Architecture Plan
**1. Spokes -> Hub**
${b(l.spoke_to_hub)}

**2. Cross-spoke links**
${b(l.cross_spoke)}

**3. Bottom-of-funnel conversion paths**
${b(l.bofu_paths)}
${
  list(d.more_pillars).length
    ? `\n---\n\n## More Pillar Pages to Build Next\n${list(d.more_pillars)
        .map((x) => `- **${x.working_title}:** ${x.why}`)
        .join('\n')}\n`
    : ''
}`
  )
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const csvRows = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')

export function toCsv(d) {
  const h = d.hub || {}
  return csvRows([
    [
      'Type',
      '#',
      'Group',
      'Working Title',
      'Funnel Stage',
      'Audience Level',
      'Business Purpose',
      'Format',
      'Search Intent',
      'Linking Hook / Strategic Value',
      'CTA',
      'Link From (existing pages)',
      'Status',
      'Existing URL',
      'Action',
    ],
    [
      'Hub',
      '',
      '',
      h.working_title,
      h.funnel_stage,
      h.reading_level,
      h.business_goal,
      h.content_format,
      h.intent,
      h.strategic_value,
      h.cta || '',
      '',
      h.status || 'new',
      h.existing_url || '',
      h.status === 'existing' ? 'Keep as the pillar' : 'Write',
    ],
    ...list(d.spokes).map((x, i) => [
      'Spoke',
      i + 1,
      x.group,
      x.working_title,
      x.funnel_stage,
      x.audience_level,
      x.business_purpose,
      x.format_angle,
      x.search_intent,
      x.linking_hook,
      x.cta,
      list(x.site_links)
        .map((l) => l.url + (l.anchor ? ' (' + l.anchor + ')' : ''))
        .join('; '),
      x.status || 'new',
      x.existing_url || '',
      x.action || 'Write',
    ]),
  ])
}

export function savedToCsv(saved) {
  return csvRows([
    [
      'From topic',
      'Type',
      'Working Title',
      'Funnel Stage',
      'Audience Level',
      'Business Purpose',
      'Format',
      'Search Intent',
      'Internal Link',
      'CTA',
    ],
    ...saved.map((x) => [
      x.topic,
      x.type,
      x.title,
      x.stage,
      x.level,
      x.purpose,
      x.format,
      x.intent,
      x.link,
      x.cta,
    ]),
  ])
}

export function downloadBlob(name, blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
