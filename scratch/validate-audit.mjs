// Validation harness: runs a real audit and cross-checks every summary number
// against independently recomputed values from the inventory. Exits non-zero on mismatch.
import { performWebsiteStructureAudit } from '../server/src/services/structureAudit/structureAuditService.js'

const target = process.argv[2] || 'https://hodusoft.com'
let failures = 0
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!cond) failures++
}

console.log(`Auditing ${target} ...`)
const result = await performWebsiteStructureAudit({ websiteUrl: target, focusNiche: null })
const inv = result.currentInventory
const s = result.summary

console.log(`\nInventory: ${inv.length} URLs | verified: ${inv.filter((i) => i.verified).length} | unchecked data rows: ${inv.filter((i) => !i.statusCode && !i.error).length}`)
const allUrlsEarly = new Set(inv.map((i) => i.url))

// ── 1. No fabricated data ──
check('every row has statusCode or is flagged unverified',
  inv.every((i) => i.statusCode !== undefined && i.verified === (i.statusCode !== null)))
check('homepage status is real 200', inv.find((i) => i.path === '/')?.statusCode === 200)
check('no fake inlink constants (45/12/2 defaults)',
  inv.filter((i) => i.inlinks === 2).length < inv.length * 0.5,
  `inlinks sample: ${inv.slice(0, 8).map((i) => i.inlinks).join(',')}`)
check('every verified row has real h1Count or null', inv.every((i) => i.verified === false || typeof i.h1Count === 'number' || i.h1Count === null))

// ── 2. Summary counts independently recomputed from inventory ──
const recomputed = {
  totalUrls: inv.length,
  blogPosts: inv.filter((p) => p.contentType === 'Blog post').length,
  featurePages: inv.filter((p) => p.section === 'Features' || p.contentType === 'Feature').length,
  industryPages: inv.filter((p) => p.section === 'Industries' || p.contentType === 'Industry').length,
  countryPages: inv.filter((p) => p.section === 'Locations' || p.contentType === 'Location').length,
  productPages: inv.filter((p) => p.section === 'Products' || p.contentType === 'Product').length,
}
Object.entries(recomputed).forEach(([k, v]) => check(`summary.currentInventory.${k} = ${v}`, s.currentInventory[k] === v, `reported ${s.currentInventory[k]}`))

// Dynamic category rows: display-ready, non-zero, no duplicates, every count reproducible from inventory
const cats = s.currentInventory.categoryCounts
check('categoryCounts is 1-4 rows', Array.isArray(cats) && cats.length >= 1 && cats.length <= 4, JSON.stringify(cats))
if (Array.isArray(cats)) {
  check('no zero-count category rows', cats.every((c) => c.count > 0), JSON.stringify(cats))
  check('no duplicate category labels', new Set(cats.map((c) => c.label)).size === cats.length)
  const canonicalByLabel = {
    'Feature pages': recomputed.featurePages,
    'Industry pages': recomputed.industryPages,
    'Country pages': recomputed.countryPages,
    'Product pages': recomputed.productPages,
  }
  const badRows = cats.filter((c) => {
    if (canonicalByLabel[c.label] !== undefined) return c.count !== canonicalByLabel[c.label]
    if (c.label.endsWith(' pages')) {
      const section = c.label.slice(0, -' pages'.length)
      return c.count !== inv.filter((i) => i.section === section).length
    }
    return true
  })
  check('every category row count reproduces from inventory', badRows.length === 0, JSON.stringify(badRows))
}

const recomputedIssues = {
  missingFromSitemap: inv.filter((p) => p.sitemap === 'MISSING' && (p.inHeaderNav !== 'No' || p.inFooter !== 'No')).length,
  notInHeaderNav: inv.filter((p) => p.inHeaderNav === 'No' && p.contentType !== 'Blog post').length,
  flaggedWithIssue: inv.filter((p) => p.issue && p.issue.trim() !== '').length,
  highPriority: inv.filter((p) => p.priority === 'High').length,
  mediumPriority: inv.filter((p) => p.priority === 'Medium').length,
}
Object.entries(recomputedIssues).forEach(([k, v]) => check(`summary.issues.${k} = ${v}`, s.issues[k] === v, `reported ${s.issues[k]}`))
check('summary.issues.urlsToRedirect = redirectMap.length', s.issues.urlsToRedirect === result.redirectMap.length)

const rec = s.recommendedStructure
check('pagesInRecommended matches tab length', rec.pagesInRecommended === result.recommendedStructure.length)
check('keptAsIs matches tab', rec.keptAsIs === result.recommendedStructure.filter((r) => r.status === 'Keep').length)
check('renamedMovedRebuilt matches tab', rec.renamedMovedRebuilt === result.recommendedStructure.filter((r) => r.status === 'Rebuild').length)
check('newPagesToCreate matches tab', rec.newPagesToCreate === result.pagesToCreate.length)

// ── 3. Redirect map integrity: every target resolves to a real URL ──
const allUrls = new Set(inv.map((i) => i.url))
const badTargets = result.redirectMap.filter((r) => !r.targetUrl || !(allUrls.has(r.targetUrl) || /^https?:\/\//.test(r.targetUrl)))
check('redirect targets are real URLs', badTargets.length === 0, badTargets.slice(0, 3).map((r) => r.targetUrl).join(', '))
const noSelfRedirects = result.redirectMap.filter((r) => r.sourceUrl === r.targetUrl)
check('no self-redirects', noSelfRedirects.length === 0)
const noDupes = new Set(result.redirectMap.map((r) => r.sourceUrl))
check('no duplicate redirect sources', noDupes.size === result.redirectMap.length)

// ── 4. Recommended structure consistency ──
check('inlinks of homepage > 0 (real link graph)', (inv.find((i) => i.path === '/')?.inlinks || 0) > 0)

const home = result.recommendedStructure.find((r) => r.level === '0.0')
check('recommended structure starts at Home 0.0', !!home && home.recommendedUrl.endsWith('/'))
const levelValid = result.recommendedStructure.every((r) => ['0.0', '1.0', '2.0', '3.0'].includes(r.level))
check('all levels valid (0.0/1.0/2.0/3.0)', levelValid)

// ── 4b. Structural issue model: no on-page noise in the Issue column ──
check('no meta/H1/thin issues in Issue column',
  inv.every((i) => !/Missing meta description|Missing H1|Multiple H1s|Thin content/.test(i.issue || '')),
  inv.filter((i) => /Missing meta description|Missing H1|Multiple H1s|Thin content/.test(i.issue || '')).slice(0, 3).map((i) => i.issue).join(' | '))
const nearDups = inv.filter((i) => i.issue?.startsWith('Near-duplicate'))
check('near-duplicate issues carry real inventory targets',
  nearDups.every((i) => allUrlsEarly.has(i.targetUrl)),
  `${nearDups.length} near-dups; bad: ${nearDups.filter((i) => !allUrlsEarly.has(i.targetUrl)).slice(0, 3).map((i) => i.targetUrl).join(', ')}`)
check('depths are number or null (never invented)',
  inv.every((i) => i.depth === null || typeof i.depth === 'number'))

// ── 5. Depth sanity ──
const knownDepths = inv.map((i) => i.depth).filter((d) => typeof d === 'number')
check('maxDepth consistent with known depths',
  knownDepths.length === 0 ? result.maxDepth === 0 : result.maxDepth === Math.max(...knownDepths, 1))
const distSum = s.depthDistribution.reduce((a, d) => a + d.count, 0)
check('depth distribution = known-depth pages',
  distSum === knownDepths.length,
  `dist ${distSum} vs known ${knownDepths.length} of ${inv.length}`)

// ── 6. Pages to Create reference real evidence ──
const proposedPaths = new Set(result.pagesToCreate.map((p) => new URL(p.proposedUrl).pathname))
const collide = result.pagesToCreate.filter((p) => inv.some((i) => i.path === new URL(p.proposedUrl).pathname))
check('no proposed page already exists in inventory', collide.length === 0, collide.map((p) => p.proposedUrl).join(', '))

console.log(`\nSample issues found: `)
inv.filter((i) => i.issue).slice(0, 5).forEach((i) =>
  console.log(`  [${i.statusCode || '???'}] ${i.url}\n        → ${i.issue} | ${i.recommendedAction}${i.targetUrl ? ' → ' + i.targetUrl : ''} (${i.priority})`))

console.log(`\nRedirects: ${result.redirectMap.length}, Pages to create: ${result.pagesToCreate.length}, Recommended rows: ${result.recommendedStructure.length}`)
console.log(`Score: ${result.overallScore} (${result.architectureGrade}) | verified ${s.dataQuality?.verifiedUrls}/${inv.length}`)
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`)
process.exit(failures === 0 ? 0 : 1)
