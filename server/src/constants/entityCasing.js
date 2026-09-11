/**
 * Extensible Canonical Entity Casing Dictionary
 * Preserves exact trademark and branded entity capitalization.
 * Prevents naive title-casing from producing "Iphone", "Ios", "Tiktok", etc.
 */

export const CANONICAL_ENTITY_CASING = {
  // Apple Ecosystem
  iphone: 'iPhone',
  ipad: 'iPad',
  ipod: 'iPod',
  macbook: 'MacBook',
  imac: 'iMac',
  mac: 'Mac',
  ios: 'iOS',
  macos: 'macOS',
  watchos: 'watchOS',
  visionos: 'visionOS',
  tvos: 'tvOS',
  airpods: 'AirPods',
  airtag: 'AirTag',
  apple: 'Apple',
  facetime: 'FaceTime',
  airdrop: 'AirDrop',
  icloud: 'iCloud',

  // Social Media & Platforms
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  reels: 'Reels',
  facebook: 'Facebook',
  twitter: 'Twitter',
  pinterest: 'Pinterest',
  reddit: 'Reddit',
  snapchat: 'Snapchat',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  spotify: 'Spotify',
  netflix: 'Netflix',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  nintendo: 'Nintendo',

  // AI & Tech Companies
  openai: 'OpenAI',
  chatgpt: 'ChatGPT',
  deepmind: 'DeepMind',
  gemini: 'Gemini',
  claude: 'Claude',
  anthropic: 'Anthropic',
  microsoft: 'Microsoft',
  github: 'GitHub',
  gitlab: 'GitLab',
  nvidia: 'NVIDIA',
  amd: 'AMD',
  intel: 'Intel',
  google: 'Google',
  meta: 'Meta',
  amazon: 'Amazon',
  aws: 'AWS',
  azure: 'Azure',

  // Software & Development
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  react: 'React',
  reactjs: 'React',
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  nextjs: 'Next.js',
  nuxt: 'Nuxt',
  wordpress: 'WordPress',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  salesforce: 'Salesforce',
  hubspot: 'HubSpot',
  zendesk: 'Zendesk',
  notion: 'Notion',
  slack: 'Slack',

  // Common Business / Tech Acronyms
  saas: 'SaaS',
  b2b: 'B2B',
  b2c: 'B2C',
  crm: 'CRM',
  roi: 'ROI',
  seo: 'SEO',
  kpi: 'KPI',
  kpis: 'KPIs',
  api: 'API',
  apis: 'APIs',
  cto: 'CTO',
  cfo: 'CFO',
  ceo: 'CEO',
  eeat: 'E-E-A-T',
  ymyl: 'YMYL',
  serp: 'SERP',
  ctr: 'CTR',
  cpc: 'CPC',
  ai: 'AI',
  ml: 'ML',
  llm: 'LLM',
  llms: 'LLMs',
  ui: 'UI',
  ux: 'UX',
  cms: 'CMS',
  erp: 'ERP',
  arr: 'ARR',
  mrr: 'MRR',
  cac: 'CAC',
  ltv: 'LTV',
  nps: 'NPS',
  '5g': '5G',
  '4g': '4G',
  usb: 'USB',
  oled: 'OLED',
  hdr: 'HDR',
  fps: 'FPS',
  gb: 'GB',
  tb: 'TB',
}

/**
 * Apply canonical casing to any string containing known entity references.
 * Preserves compound names (e.g., "iphone 18 pro max" -> "iPhone 18 Pro Max").
 */
export function applyEntityCasing(text) {
  if (typeof text !== 'string' || !text) return text

  let result = text

  // Sort keys by descending length to prevent partial prefix replacements
  const sortedKeys = Object.keys(CANONICAL_ENTITY_CASING).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    const canonical = CANONICAL_ENTITY_CASING[key]
    // Word boundary regex that avoids matching within already properly cased tokens
    const regex = new RegExp(`(?<![a-zA-Z0-9])${escapeRegex(key)}(?![a-zA-Z0-9])`, 'gi')
    result = result.replace(regex, canonical)
  }

  // Common product suffix capitalizations & Apple Silicon
  result = result
    .replace(/\bpro\s+max\b/gi, 'Pro Max')
    .replace(/\bpro\b/gi, 'Pro')
    .replace(/\bultra\b/gi, 'Ultra')
    .replace(/\bmini\b/gi, 'Mini')
    .replace(/\bplus\b/gi, 'Plus')
    .replace(/\bse\b/g, 'SE')
    .replace(/\bm([1-9])\b/gi, (match, p1) => `M${p1}`)

  return result
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
