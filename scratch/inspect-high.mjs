import { performWebsiteStructureAudit } from '../server/src/services/structureAudit/structureAuditService.js'
const r = await performWebsiteStructureAudit({ websiteUrl: 'https://hodusoft.com' })
const inv = r.currentInventory
const byIssue = (list) => {
  const m = new Map()
  list.forEach((i) => {
    const k = (i.issue || '(none)').replace(/\d+/g, 'N').replace(/\(.*?\)/g, '').slice(0, 60)
    m.set(k, (m.get(k) || 0) + 1)
  })
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
console.log('=== HIGH ==='); byIssue(inv.filter((i) => i.priority === 'High')).forEach(([k, v]) => console.log(` ${v}  ${k}`))
console.log('=== MEDIUM (top 8) ==='); byIssue(inv.filter((i) => i.priority === 'Medium')).slice(0, 8).forEach(([k, v]) => console.log(` ${v}  ${k}`))
console.log('=== all flagged ===', inv.filter((i) => i.issue).length)
console.log('=== near-dup priority ===', byIssue(inv.filter((i) => i.issue?.startsWith('Near-dup'))))
console.log('=== deep flagged ===', inv.filter((i) => i.issue?.startsWith('Deep')).length, '| of which blog posts:', inv.filter((i) => i.issue?.startsWith('Deep') && i.contentType === 'Blog post').length)
console.log('=== possible orphan ===', inv.filter((i) => i.issue?.includes('orphan')).length)
console.log('=== redirects by priority ===', JSON.stringify(r.redirectMap.reduce((a, x) => ((a[x.priority] = (a[x.priority] || 0) + 1), a), {})))
console.log('=== pagesToCreate ==='); r.pagesToCreate.forEach((p) => console.log(`  ${p.section} | ${p.pageName} | ${p.why.slice(0, 90)}`))
console.log('=== contentType=Product sample ===')
inv.filter((i) => i.contentType === 'Product').slice(0, 40).forEach((i) => console.log(`  [${i.sitemap}] ${i.path}`))
