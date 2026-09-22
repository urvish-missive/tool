import * as XLSX from 'xlsx'

/**
 * Calculates optimal column widths based on maximum string length
 */
function calculateColumnWidths(rows, headers) {
  const colWidths = headers.map((h) => ({ wch: Math.max(String(h).length, 12) }))
  rows.forEach((row) => {
    headers.forEach((h, idx) => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : ''
      if (val.length > colWidths[idx].wch) {
        colWidths[idx].wch = Math.min(val.length + 3, 60)
      }
    })
  })
  return colWidths
}

/**
 * Exports the Website Structure Audit to a .xlsx workbook whose tabs and
 * columns match the reference sheet exactly:
 *   Summary | Current Inventory | Redirect Map | Recommended Structure | Pages to Create
 *
 * Every value comes from the audit payload (live crawl data) — no hardcoded
 * or fallback numbers.
 */
// Summary category rows: canonical sheet labels when the site actually has those concepts,
// otherwise filled from the site's own largest sections — identical logic everywhere.
export function buildInventoryCategoryRows(invStats = {}, inventory = []) {
  if (Array.isArray(invStats.categoryCounts) && invStats.categoryCounts.length) {
    return invStats.categoryCounts
  }
  const inv = Array.isArray(inventory) ? inventory : []
  const count = (pred) => inv.filter(pred).length
  const canonical = [
    { label: 'Feature pages', count: invStats.featurePages ?? count((p) => p.section === 'Features' || p.contentType === 'Feature') },
    { label: 'Industry pages', count: invStats.industryPages ?? count((p) => p.section === 'Industries' || p.contentType === 'Industry') },
    { label: 'Country pages', count: invStats.countryPages ?? count((p) => p.section === 'Locations' || p.contentType === 'Location') },
    { label: 'Product pages', count: invStats.productPages ?? count((p) => p.section === 'Products' || p.contentType === 'Product') },
  ].filter((c) => c.count > 0)
  const skip = new Set([
    'feature', 'features', 'industry', 'industries', 'country', 'countries',
    'location', 'locations', 'product', 'products',
  ])
  const tally = new Map()
  inv.forEach((p) => {
    if (!p.section || p.section === 'Core' || p.section === 'Other') return
    const t = tally.get(p.section) || { count: 0, posts: 0 }
    t.count++
    if (p.contentType === 'Blog post') t.posts++
    tally.set(p.section, t)
  })
  const rows = [...canonical]
  ;[...tally.entries()]
    .filter(([name, t]) => t.posts / t.count < 0.7 && !skip.has(name.toLowerCase()))
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([name, t]) => {
      if (rows.length >= 4) return
      const label = `${name} pages`
      if (rows.some((r) => r.label === label)) return
      rows.push({ label, count: t.count })
    })
  return rows
}

export function exportStructureAuditToExcel(auditData) {
  if (!auditData) return

  const {
    domain = 'website',
    summary = {},
    currentInventory = [],
    redirectMap = [],
    recommendedStructure = [],
    pagesToCreate = [],
  } = auditData

  const wb = XLSX.utils.book_new()

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: Summary (2-column KPI layout, identical to reference)
  // ─────────────────────────────────────────────────────────────
  const hostName = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : 'Website'
  const titleText = summary.title || `${hostName} – Website Structure Audit`
  const sourceText = summary.sourceDescription || ''

  const invStats = summary.currentInventory || {
    totalUrls: currentInventory.length,
    blogPosts: currentInventory.filter((p) => p.contentType === 'Blog post').length,
    featurePages: currentInventory.filter((p) => p.section === 'Features' || p.contentType === 'Feature').length,
    industryPages: currentInventory.filter((p) => p.section === 'Industries' || p.contentType === 'Industry').length,
    countryPages: currentInventory.filter((p) => p.section === 'Locations' || p.contentType === 'Location').length,
    productPages: currentInventory.filter((p) => p.section === 'Products' || p.contentType === 'Product').length,
  }

  const issueStats = summary.issues || {
    missingFromSitemap: currentInventory.filter((p) => p.sitemap === 'MISSING' && (p.inHeaderNav !== 'No' || p.inFooter !== 'No')).length,
    notInHeaderNav: currentInventory.filter((p) => p.inHeaderNav === 'No' && p.contentType !== 'Blog post').length,
    flaggedWithIssue: currentInventory.filter((p) => p.issue && p.issue.trim() !== '').length,
    highPriority: currentInventory.filter((p) => p.priority === 'High').length,
    mediumPriority: currentInventory.filter((p) => p.priority === 'Medium').length,
    urlsToRedirect: redirectMap.length,
  }

  const recStats = summary.recommendedStructure || {
    pagesInRecommended: recommendedStructure.length,
    keptAsIs: recommendedStructure.filter((r) => r.status === 'Keep').length,
    renamedMovedRebuilt: recommendedStructure.filter((r) => r.status === 'Rebuild').length,
    newPagesToCreate: pagesToCreate.length,
  }

  const howToUseItems = summary.howToUse || []
  const summaryAoa = [
    [titleText, ''],
    [sourceText, ''],
    ['CURRENT INVENTORY', ''],
    ['Total URLs audited', invStats.totalUrls],
    ['Blog posts', invStats.blogPosts],
    ...buildInventoryCategoryRows(invStats, currentInventory).map((r) => [r.label, r.count]),
    ['ISSUES', ''],
    ['Live/linked pages missing from sitemap', issueStats.missingFromSitemap],
    ['Pages not in header navigation (non-blog)', issueStats.notInHeaderNav],
    ['Pages flagged with an issue', issueStats.flaggedWithIssue],
    ['High-priority actions', issueStats.highPriority],
    ['Medium-priority actions', issueStats.mediumPriority],
    ['URLs to 301 redirect / move', issueStats.urlsToRedirect],
    ['RECOMMENDED STRUCTURE', ''],
    ['Pages in recommended structure', recStats.pagesInRecommended],
    ['Kept as-is', recStats.keptAsIs],
    ['Renamed / moved / rebuilt', recStats.renamedMovedRebuilt],
    ['New pages to create', recStats.newPagesToCreate],
  ]

  if (howToUseItems.length > 0) {
    summaryAoa.push(['How to use', ''])
    howToUseItems.forEach((item) => {
      summaryAoa.push([`${item.title}: ${item.description}`, ''])
    })
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
  wsSummary['!cols'] = [{ wch: 60 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: Current Inventory (10 columns, identical to reference)
  // ─────────────────────────────────────────────────────────────
  const inventoryHeaders = [
    'URL',
    'Section',
    'Content Type',
    'Sitemap',
    'In Header Nav',
    'In Footer',
    'Issue',
    'Recommended Action',
    'Target URL',
    'Priority',
  ]

  const inventoryRows = currentInventory.map((item) => ({
    URL: item.url || '',
    Section: item.section || '',
    'Content Type': item.contentType || 'Page',
    Sitemap: item.sitemap || 'MISSING',
    'In Header Nav': item.inHeaderNav || 'No',
    'In Footer': item.inFooter || 'No',
    Issue: item.issue || '',
    'Recommended Action': item.recommendedAction || item.action || 'Keep',
    'Target URL': item.targetUrl || '',
    Priority: item.priority || 'Low',
  }))

  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows, { header: inventoryHeaders })
  wsInventory['!cols'] = calculateColumnWidths(inventoryRows, inventoryHeaders)
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Current Inventory')

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: Redirect Map (4 columns, identical to reference)
  // ─────────────────────────────────────────────────────────────
  const redirectHeaders = ['From URL', 'To URL (301)', 'Reason', 'Priority']

  const redirectRows = redirectMap.map((item) => ({
    'From URL': item.sourceUrl || '',
    'To URL (301)': item.targetUrl || '',
    Reason: item.reason || '',
    Priority: item.priority || '',
  }))

  const wsRedirect = XLSX.utils.json_to_sheet(redirectRows, { header: redirectHeaders })
  wsRedirect['!cols'] = calculateColumnWidths(redirectRows, redirectHeaders)
  XLSX.utils.book_append_sheet(wb, wsRedirect, 'Redirect Map')

  // ─────────────────────────────────────────────────────────────
  // SHEET 4: Recommended Structure (7 columns, identical to reference)
  // ─────────────────────────────────────────────────────────────
  const structureHeaders = [
    'Level',
    'Section',
    'Page',
    'Recommended URL',
    'Current URL (source)',
    'Status',
    'Notes',
  ]

  const structureRows = recommendedStructure.map((item) => ({
    Level: item.level || '',
    Section: item.section || '',
    Page: item.page || '',
    'Recommended URL': item.recommendedUrl || '',
    'Current URL (source)': item.currentUrl || '',
    Status: item.status || '',
    Notes: item.notes || '',
  }))

  const wsStructure = XLSX.utils.json_to_sheet(structureRows, { header: structureHeaders })
  wsStructure['!cols'] = calculateColumnWidths(structureRows, structureHeaders)
  XLSX.utils.book_append_sheet(wb, wsStructure, 'Recommended Structure')

  // ─────────────────────────────────────────────────────────────
  // SHEET 5: Pages to Create (6 columns, identical to reference)
  // ─────────────────────────────────────────────────────────────
  const pagesHeaders = ['Section', 'Page', 'Recommended URL', 'Why', 'Owner', 'Status']

  const pagesRows = pagesToCreate.map((item) => ({
    Section: item.section || '',
    Page: item.pageName || '',
    'Recommended URL': item.proposedUrl || '',
    Why: item.why || '',
    Owner: item.owner || '',
    Status: item.status || 'Not started',
  }))

  const wsPages = XLSX.utils.json_to_sheet(pagesRows, { header: pagesHeaders })
  wsPages['!cols'] = calculateColumnWidths(pagesRows, pagesHeaders)
  XLSX.utils.book_append_sheet(wb, wsPages, 'Pages to Create')

  // ─────────────────────────────────────────────────────────────
  // Generate & Download File
  // ─────────────────────────────────────────────────────────────
  const safeHost = domain.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/^https?_*/, '')
  const fileName = `website-structure-audit-${safeHost || 'report'}.xlsx`

  XLSX.writeFile(wb, fileName)
}
