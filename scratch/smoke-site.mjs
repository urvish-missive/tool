import { performWebsiteStructureAudit } from '../server/src/services/structureAudit/structureAuditService.js'
const target = process.argv[2]
const r = await performWebsiteStructureAudit({ websiteUrl: target })
const ci = r.summary.currentInventory
console.log(`\n${target}`)
console.log(`  total: ${ci.totalUrls}, blog: ${ci.blogPosts}, verified: ${r.summary.dataQuality.verifiedUrls}`)
console.log('  CURRENT INVENTORY rows:')
console.log(`    Total URLs audited = ${ci.totalUrls}`)
if (ci.blogPosts > 0) console.log(`    Blog posts = ${ci.blogPosts}`)
ci.categoryCounts.forEach((c) => console.log(`    ${c.label} = ${c.count}`))
const tally = new Map()
r.currentInventory.forEach((i) => tally.set(i.section, (tally.get(i.section) || 0) + 1))
console.log('  sections in inventory:', [...tally.entries()].sort((a,b) => b[1]-a[1]).map(([s,c]) => `${s}(${c})`).join(', '))
console.log(`  recommended sections:`, [...new Set(r.recommendedStructure.map((x) => x.section))].join(', '))
const zeroCats = ci.categoryCounts.filter((c) => !c.count)
console.log(zeroCats.length === 0 && ci.categoryCounts.length >= 2 ? '  DYNAMIC_OK' : '  DYNAMIC_FAIL')
