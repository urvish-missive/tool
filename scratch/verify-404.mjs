import { performWebsiteStructureAudit } from '../server/src/services/structureAudit/structureAuditService.js'
const r = await performWebsiteStructureAudit({ websiteUrl: 'https://hodusoft.com' })
const inv = r.currentInventory
const errors = inv.filter((i) => i.statusCode !== null && i.statusCode >= 400)
console.log(`error rows: ${errors.length}`)
errors.slice(0, 12).forEach((i) => console.log(`  ${i.statusCode} ${i.path}  ${i.targetUrl ? '→ ' + i.targetUrl : '(no target)'}`))
console.log('--- %20 variants ---')
inv.filter((i) => i.path.includes('%20')).forEach((i) => console.log(`  ${i.statusCode} ${i.path} → ${i.targetUrl || 'NONE'} [${i.recommendedAction}]`))
console.log('--- redirect statuses ---')
const st = r.redirectMap.reduce((a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a), {})
console.log(JSON.stringify(st))
console.log('--- integration planned rows sample ---')
r.redirectMap.filter((x) => x.status.startsWith('Planned')).slice(0, 4).forEach((x) => console.log(`  ${x.sourceUrl} → ${x.targetUrl}`))
