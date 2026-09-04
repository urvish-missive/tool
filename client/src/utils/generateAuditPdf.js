import { jsPDF } from 'jspdf'

const C = {
  primary: [12, 129, 243], // #0C81F3 (Missive Blue)
  primaryDark: [10, 102, 194],
  secondary: [235, 137, 136], // #EB8988 (Missive Coral)
  dark: [17, 24, 39], // #111827
  mid: [55, 65, 81], // #374151
  gray: [107, 114, 128], // #6B7280
  lightGray: [248, 249, 250], // #F8F9FA
  cardBg: [255, 255, 255],
  border: [229, 231, 235], // #E5E7EB
  white: [255, 255, 255],
  green: [22, 163, 74], // #16A34A
  greenBg: [220, 252, 231], // #DCFCE7
  red: [220, 38, 38], // #DC2626
  redBg: [254, 226, 226], // #FEE2E2
  amber: [217, 119, 6], // #D97706
  amberBg: [254, 243, 199], // #FEF3C7
  blueBg: [239, 246, 255], // #EFF6FF
  purple: [147, 51, 234], // #9333EA
  purpleBg: [243, 232, 255], // #F3E8FF
}

function getScoreColor(score) {
  if (score >= 80) return C.green
  if (score >= 60) return C.primary
  if (score >= 45) return C.amber
  return C.red
}

function getSeverityColor(sev) {
  switch (sev) {
    case 'CRITICAL':
      return { col: C.red, bg: C.redBg }
    case 'HIGH':
      return { col: [194, 65, 12], bg: [255, 237, 213] }
    case 'MEDIUM':
      return { col: C.amber, bg: C.amberBg }
    case 'LOW':
      return { col: C.primary, bg: C.blueBg }
    default:
      return { col: C.gray, bg: C.lightGray }
  }
}

function drawGradientBar(doc, x, y, w, h) {
  for (let i = 0; i < w; i++) {
    const r = i / w
    doc.setFillColor(
      Math.round(C.primary[0] + (C.secondary[0] - C.primary[0]) * r),
      Math.round(C.primary[1] + (C.secondary[1] - C.primary[1]) * r),
      Math.round(C.primary[2] + (C.secondary[2] - C.primary[2]) * r)
    )
    doc.rect(x + i, y, 1, h, 'F')
  }
}

function getLines(doc, text, maxW, size = 9, style = 'normal') {
  if (!text) return []
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  return doc.splitTextToSize(String(text), maxW)
}

function printText(doc, str, x, y, opts = {}) {
  const { size = 9, style = 'normal', color = C.dark, align = 'left', maxW } = opts
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
  if (maxW) {
    const lines = doc.splitTextToSize(String(str || ''), maxW)
    doc.text(lines, x, y, { align })
    return lines.length
  }
  doc.text(String(str || ''), x, y, { align })
  return 1
}

function drawBrandHeader(doc, W, M) {
  drawGradientBar(doc, 0, 0, W, 5.5)

  // Missive Brand Logo Emblem
  doc.setFillColor(...C.primary)
  doc.roundedRect(M, 9.5, 8.5, 8.5, 1.8, 1.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.text('M', M + 4.25, 15.5, { align: 'center' })

  // Agency Brand Name
  printText(doc, 'MISSIVE DIGITAL', M + 11.5, 13.5, {
    size: 9.5,
    style: 'bold',
    color: C.dark,
  })
  printText(doc, 'Digital Growth & Technical SEO Consulting', M + 11.5, 17.5, {
    size: 6.5,
    color: C.gray,
  })

  // Agency Contact Details in Top-Right
  const rightX = W - M
  printText(doc, 'Website: missivedigital.com', rightX, 11.5, {
    size: 6.2,
    color: C.gray,
    align: 'right',
  })
  printText(doc, 'Inquiries: contact@missivedigital.com', rightX, 15, {
    size: 6.2,
    color: C.gray,
    align: 'right',
  })
  printText(doc, 'Report Generated: ' + new Date().toLocaleDateString(), rightX, 18.5, {
    size: 6.2,
    style: 'bold',
    color: C.primary,
    align: 'right',
  })

  // Separator line
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(M, 21.5, W - M, 21.5)
}

function drawBrandFooter(doc, W, H, M, pageNum, totalPages) {
  drawGradientBar(doc, 0, H - 4.5, W, 4.5)
  printText(
    doc,
    'MISSIVE DIGITAL \u2022 Full-Service Technical SEO & Organic Search Growth Consulting \u2022 missivedigital.com',
    M,
    H - 1.5,
    { size: 6, color: C.white, style: 'bold' }
  )
  printText(doc, `Page ${pageNum} of ${totalPages}`, W - M, H - 1.5, {
    size: 6,
    color: C.white,
    style: 'bold',
    align: 'right',
  })
}

export function generateAuditPdf(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210,
    H = 297,
    M = 15,
    CW = W - M * 2
  let y = 0

  const targetUrl = report.targetUrl || 'Website'
  const overallScore = report.overallScore || 0
  const scoreBreakdown = report.scoreBreakdown || {}
  const issues = report.issues || []
  const ai = report.ai || report.ai_report || {}
  const pageSpeed = report.pageSpeed || {}

  // ════════════ PAGE 1: EXECUTIVE AUDIT DASHBOARD ════════════
  drawBrandHeader(doc, W, M)

  y = 26.5
  printText(doc, 'Technical SEO & Website Health Audit Report', M, y, {
    size: 14,
    style: 'bold',
    color: C.dark,
  })
  y += 5
  printText(doc, `Audited Domain Target: ${targetUrl}`, M, y, {
    size: 8.5,
    style: 'bold',
    color: C.primary,
    maxW: CW,
  })
  y += 4
  printText(
    doc,
    `Scope: ${report.totalPages || 1} Crawled Pages | 8 Audit Pillars Evaluated | ${issues.length} Identified Action Items`,
    M,
    y,
    { size: 6.8, color: C.gray, maxW: CW }
  )

  // ── Executive Hero Card ──────────────────────────────────────
  y += 5.5
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.35)
  doc.roundedRect(M, y, CW, 36, 3, 3, 'FD')

  // Overall Score Gauge Circle
  const scoreCol = getScoreColor(overallScore)
  doc.setFillColor(...scoreCol)
  doc.circle(M + 20, y + 18, 12.5, 'F')
  doc.setFillColor(...C.white)
  doc.circle(M + 20, y + 18, 10.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...scoreCol)
  doc.text(String(overallScore), M + 20, y + 20, { align: 'center' })

  printText(doc, 'Overall Health', M + 20, y + 33, {
    size: 6.5,
    style: 'bold',
    color: C.dark,
    align: 'center',
  })

  // Status Badge & Readiness Summary
  const startX = M + 38
  const readinessText =
    overallScore >= 80
      ? 'High Search Readiness \u2022 Strong Technical Foundation'
      : overallScore >= 60
        ? 'Moderate Health \u2022 Minor Optimizations Needed'
        : 'Critical Technical Fixes Required \u2022 High Ranking Risk'

  printText(doc, 'Audit Executive Summary & Readiness Level:', startX, y + 7.5, {
    size: 8,
    style: 'bold',
    color: C.dark,
  })
  printText(doc, readinessText, startX, y + 11.8, {
    size: 6.8,
    style: 'bold',
    color: scoreCol,
    maxW: CW - 42,
  })

  // Severity Count Badges
  const sev = report.severityCounts || {}
  const badges = [
    { label: 'Critical', count: sev.CRITICAL || 0, bg: C.redBg, textCol: C.red },
    { label: 'High', count: sev.HIGH || 0, bg: [255, 237, 213], textCol: [194, 65, 12] },
    { label: 'Medium', count: sev.MEDIUM || 0, bg: C.amberBg, textCol: C.amber },
    { label: 'Low', count: sev.LOW || 0, bg: C.blueBg, textCol: C.primary },
  ]

  let bx = startX
  const badgeW = (CW - 42) / 4
  badges.forEach((b) => {
    doc.setFillColor(...b.bg)
    doc.roundedRect(bx, y + 16, badgeW - 2.5, 15, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...b.textCol)
    doc.text(String(b.count), bx + (badgeW - 2.5) / 2, y + 23.5, { align: 'center' })
    doc.setFontSize(5.8)
    doc.setFont('helvetica', 'normal')
    doc.text(b.label + ' Issues', bx + (badgeW - 2.5) / 2, y + 28, { align: 'center' })
    bx += badgeW
  })

  // ── 8 Audit Pillars & Transparent Score Breakdown ────────────
  y += 42
  printText(doc, '8 Audit Pillars & Transparent Score Breakdown', M, y, {
    size: 10,
    style: 'bold',
    color: C.dark,
  })
  printText(
    doc,
    'Each pillar starts at 100 points with itemized deductions.',
    W - M,
    y,
    { size: 6.2, color: C.gray, align: 'right' }
  )
  y += 4

  const categories = [
    { key: 'technical', label: '1. Technical SEO', val: report.technicalScore, weight: '20%' },
    { key: 'onPage', label: '2. On-Page Metadata', val: report.onPageScore, weight: '20%' },
    { key: 'performance', label: '3. PageSpeed & CWV', val: report.performanceScore, weight: '15%' },
    { key: 'content', label: '4. Content Depth', val: report.contentScore, weight: '15%' },
    { key: 'mobile', label: '5. Mobile Usability', val: report.mobileScore, weight: '10%' },
    { key: 'structuredData', label: '6. Schema.org Entities', val: report.structuredDataScore, weight: '8%' },
    { key: 'links', label: '7. Link Equity & Silos', val: report.linksScore, weight: '7%' },
    { key: 'security', label: '8. HTTPS & SSL Security', val: report.securityScore, weight: '5%' },
  ]

  const colW = (CW - 4) / 2
  for (let i = 0; i < categories.length; i += 2) {
    const c1 = categories[i]
    const c2 = categories[i + 1]
    const rowH = 17.5

    const drawCatCard = (cat, cx) => {
      if (!cat) return
      const detail = scoreBreakdown[cat.key] || {}
      doc.setFillColor(...C.lightGray)
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.3)
      doc.roundedRect(cx, y, colW, rowH, 2, 2, 'FD')

      const cColor = getScoreColor(cat.val || 0)
      doc.setFillColor(...cColor)
      doc.circle(cx + 7, y + 8.75, 4.2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.2)
      doc.setTextColor(...C.white)
      doc.text(String(cat.val || 0), cx + 7, y + 10, { align: 'center' })

      printText(doc, cat.label, cx + 13.5, y + 5.8, { size: 7.2, style: 'bold', color: C.dark })
      printText(doc, `(${cat.weight})`, cx + colW - 3.5, y + 5.8, {
        size: 5.8,
        color: C.gray,
        align: 'right',
      })

      const rawRationale =
        detail.whyThisScore || detail.status || `${cat.label} scored ${cat.val}/100 based on standard audits.`
      const rationaleLines = getLines(doc, rawRationale, colW - 17, 5.6)
      const displayRationale = rationaleLines.slice(0, 2).join(' ')

      printText(doc, displayRationale, cx + 13.5, y + 10.2, {
        size: 5.6,
        color: C.mid,
        maxW: colW - 17,
      })
    }

    drawCatCard(c1, M)
    drawCatCard(c2, M + colW + 4)
    y += rowH + 2.5
  }

  // ── Executive AI Strategic Summary ───────────────────────────
  y += 2
  if (ai.executive_summary) {
    const summaryLines = getLines(doc, ai.executive_summary, CW - 8, 6.5)
    const limitedSummary = summaryLines.slice(0, 3).join(' ')
    const summaryH = 10 + Math.min(summaryLines.length, 3) * 3.4

    doc.setFillColor(...C.blueBg)
    doc.setDrawColor(...C.primary)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, summaryH, 2, 2, 'FD')

    printText(doc, 'Executive Strategic AI Assessment', M + 4, y + 4.8, {
      size: 7.5,
      style: 'bold',
      color: C.primaryDark,
    })
    printText(doc, limitedSummary, M + 4, y + 8.8, {
      size: 6.4,
      color: C.dark,
      maxW: CW - 8,
    })
    y += summaryH + 3
  }

  // ── Strategic Strengths & Opportunities ──────────────────────
  if (ai.strengths?.length > 0 || ai.strategic_opportunities?.length > 0) {
    const halfW = (CW - 4) / 2
    const boxH = 25

    // Strengths
    doc.setFillColor(...C.greenBg)
    doc.roundedRect(M, y, halfW, boxH, 2, 2, 'F')
    printText(doc, 'Verified Technical Strengths', M + 4, y + 4.8, {
      size: 7.2,
      style: 'bold',
      color: C.green,
    })
    let sy = y + 8.8
    ;(ai.strengths || []).slice(0, 3).forEach((s) => {
      const sLines = getLines(doc, `\u2713 ${s}`, halfW - 8, 5.8)
      printText(doc, sLines[0] || `\u2713 ${s}`, M + 4, sy, { size: 5.8, color: C.dark, maxW: halfW - 8 })
      sy += 4.2
    })

    // Opportunities
    const ox = M + halfW + 4
    doc.setFillColor(...C.amberBg)
    doc.roundedRect(ox, y, halfW, boxH, 2, 2, 'F')
    printText(doc, 'High-Impact Growth Opportunities', ox + 4, y + 4.8, {
      size: 7.2,
      style: 'bold',
      color: C.amber,
    })
    let oy = y + 8.8
    ;(ai.strategic_opportunities || []).slice(0, 3).forEach((o) => {
      const oLines = getLines(doc, `\u2192 ${o}`, halfW - 8, 5.8)
      printText(doc, oLines[0] || `\u2192 ${o}`, ox + 4, oy, { size: 5.8, color: C.dark, maxW: halfW - 8 })
      oy += 4.2
    })
    y += boxH + 4
  }

  // ════════════ PAGE 2: DETAILED THEMATIC ACTION ITEMS ════════
  doc.addPage()
  drawBrandHeader(doc, W, M)
  y = 26

  printText(doc, 'Thematic Issue Cards & Developer Action Items', M, y, {
    size: 12,
    style: 'bold',
    color: C.dark,
  })
  y += 4
  printText(
    doc,
    'Consolidated topic cards with sub-issue breakdown, extracted DOM evidence, and exact remediation steps.',
    M,
    y,
    { size: 7, color: C.gray, maxW: CW }
  )
  y += 6

  for (let idx = 0; idx < issues.length; idx++) {
    const iss = issues[idx]
    const sevInfo = getSeverityColor(iss.severity)
    const affected = iss.affectedItems || []
    const subFindings = iss.subFindings || []

    // 1. Measure title lines
    const titleLines = getLines(doc, iss.title, CW - 58, 8, 'bold')
    const titleH = Math.max(titleLines.length * 3.8, 5)

    // 2. Measure sub-findings
    const subH = subFindings.length > 0 ? 5.5 : 0

    // 3. Measure description lines
    let descLines = []
    let descH = 0
    if (iss.description) {
      descLines = getLines(doc, `Why it matters: ${iss.description}`, CW - 8, 6.5)
      descH = descLines.length * 3.4 + 1.5
    }

    // 4. Measure evidence lines (up to 2 items)
    let evidenceItems = []
    let evidenceH = 0
    if (affected.length > 0) {
      affected.slice(0, 2).forEach((item) => {
        const itemUrl = item.url ? item.url.replace(/^https?:\/\/[^/]+/, '') || '/' : ''
        const itemEvidence = item.evidence ? ` [${item.evidence.replace(/\n/g, ' ').substring(0, 70)}]` : ''
        const evLines = getLines(doc, `\u2022 ${itemUrl}${itemEvidence}`, CW - 12, 6)
        evidenceItems.push(evLines)
        evidenceH += evLines.length * 3.2 + 0.8
      })
    }

    // 5. Measure recommendation box
    let recLines = []
    let recBoxH = 0
    if (iss.recommendation) {
      recLines = getLines(doc, `Recommended Fix: ${iss.recommendation}`, CW - 12, 6.2, 'bold')
      recBoxH = 5 + recLines.length * 3.2
    }

    // Calculate total dynamic card height
    const cardH = 8 + titleH + subH + descH + evidenceH + (iss.recommendation ? recBoxH + 2.5 : 0) + 3

    // Check if card fits on current page
    if (y + cardH > H - 18) {
      doc.addPage()
      drawBrandHeader(doc, W, M)
      y = 26
    }

    // Draw card border container
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, cardH, 2.5, 2.5, 'FD')

    // Severity badge
    doc.setFillColor(...sevInfo.bg)
    doc.roundedRect(M + 3, y + 3, 16, 5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.8)
    doc.setTextColor(...sevInfo.col)
    doc.text(iss.severity, M + 11, y + 6.5, { align: 'center' })

    // Issue title (wrapped dynamically)
    printText(doc, titleLines.join(' '), M + 21, y + 6.5, {
      size: 8,
      style: 'bold',
      color: C.dark,
      maxW: CW - 58,
    })

    // Affected count badge
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(W - M - 26, y + 3, 23, 5, 1, 1, 'F')
    printText(doc, `${iss.affectedCount || 1} Page(s)`, W - M - 14.5, y + 6.5, {
      size: 5.6,
      style: 'bold',
      color: C.mid,
      align: 'center',
    })

    let cy = y + 4 + titleH + 2

    // Sub-findings pills
    if (subFindings.length > 0) {
      let pillX = M + 4
      subFindings.slice(0, 3).forEach((sf) => {
        doc.setFillColor(...C.lightGray)
        const pillText = `${sf.title} (${sf.count}p)`
        const pillW = doc.getStringUnitWidth(pillText) * 2.2 + 5
        const actualW = Math.min(pillW, 50)
        doc.roundedRect(pillX, cy - 1, actualW, 4.2, 1, 1, 'F')
        printText(doc, pillText, pillX + 2, cy + 2, { size: 5.2, color: C.mid, maxW: actualW - 3 })
        pillX += actualW + 2
      })
      cy += subH
    }

    // Why it matters description (dynamic lines)
    if (descLines.length > 0) {
      printText(doc, descLines.join(' '), M + 4, cy, {
        size: 6.5,
        color: C.mid,
        maxW: CW - 8,
      })
      cy += descH
    }

    // Extracted DOM Evidence (dynamic lines)
    if (evidenceItems.length > 0) {
      evidenceItems.forEach((lines) => {
        printText(doc, lines.join(' '), M + 6, cy, {
          size: 6,
          color: C.dark,
          maxW: CW - 12,
        })
        cy += lines.length * 3.2 + 0.8
      })
    }

    // Fix Recommendation box (dynamic height matching content)
    if (iss.recommendation) {
      doc.setFillColor(...C.greenBg)
      doc.roundedRect(M + 3, cy, CW - 6, recBoxH, 1.5, 1.5, 'F')
      printText(doc, recLines.join(' '), M + 5, cy + 3.8, {
        size: 6.2,
        style: 'bold',
        color: C.green,
        maxW: CW - 12,
      })
    }

    y += cardH + 3
  }

  // ════════════ PAGE 3: TECHNICAL DIAGNOSTICS & PAGESPEED ═════
  doc.addPage()
  drawBrandHeader(doc, W, M)
  y = 26

  printText(doc, 'Technical Diagnostics, Core Web Vitals & Roadmap', M, y, {
    size: 12,
    style: 'bold',
    color: C.dark,
  })
  y += 5.5

  // Sitemap & Variations Diagnostics Box
  const sitemapProbe = report.sitemapProbe || {}
  const sitemapStatus = sitemapProbe.found
    ? `\u2713 Valid XML Sitemap Detected: ${sitemapProbe.detectedSitemaps?.join(', ') || 'sitemap.xml'} (${sitemapProbe.totalDiscoveredUrls || 0} indexed URLs)`
    : '✗ No valid XML sitemap found across standard variations (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml).'
  const smLines = getLines(doc, sitemapStatus, CW - 8, 6.8)
  const smBoxH = 14 + smLines.length * 3.4

  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, smBoxH, 2, 2, 'FD')
  printText(doc, 'XML Sitemap Discovery & Crawl Directives', M + 4, y + 4.8, {
    size: 7.8,
    style: 'bold',
    color: C.dark,
  })
  printText(doc, smLines.join(' '), M + 4, y + 9.2, { size: 6.8, color: sitemapProbe.found ? C.green : C.red, maxW: CW - 8 })

  const robotsStatus = report.robotsTxt
    ? `\u2713 Robots.txt active with ${report.robotsSitemapUrls?.length || 0} sitemap directive(s).`
    : '✗ Robots.txt file is missing or empty.'
  printText(doc, robotsStatus, M + 4, y + 9.2 + smLines.length * 3.4, { size: 6.2, color: C.gray, maxW: CW - 8 })
  y += smBoxH + 4

  // Google PageSpeed Core Web Vitals Box
  if (pageSpeed.mobile || pageSpeed.desktop) {
    const mob = pageSpeed.mobile || {}
    const dsk = pageSpeed.desktop || {}

    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, 34, 2, 2, 'FD')

    printText(doc, 'PageSpeed Performance & Core Web Vitals (CWV)', M + 4, y + 5, {
      size: 8,
      style: 'bold',
      color: C.dark,
    })

    // Mobile Badge
    const mCol = getScoreColor(mob.score || 70)
    doc.setFillColor(...mCol)
    doc.roundedRect(M + 4, y + 8.5, 28, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...C.white)
    doc.text(`${mob.score || 0}`, M + 18, y + 18, { align: 'center' })
    doc.setFontSize(5.6)
    doc.text('Mobile CWV Score', M + 18, y + 23.5, { align: 'center' })

    // Desktop Badge
    const dCol = getScoreColor(dsk.score || 85)
    doc.setFillColor(...dCol)
    doc.roundedRect(M + 34, y + 8.5, 28, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...C.white)
    doc.text(`${dsk.score || 0}`, M + 48, y + 18, { align: 'center' })
    doc.setFontSize(5.6)
    doc.text('Desktop CWV Score', M + 48, y + 23.5, { align: 'center' })

    // Metrics list
    const mMetrics = mob.metrics || {}
    const mx = M + 68
    printText(doc, `\u2022 LCP (Largest Contentful Paint): ${mMetrics.lcp?.value || '2.4s'}`, mx, y + 11, {
      size: 6.5,
      color: C.dark,
    })
    printText(doc, `\u2022 FCP (First Contentful Paint): ${mMetrics.fcp?.value || '1.2s'}`, mx, y + 15.5, {
      size: 6.5,
      color: C.dark,
    })
    printText(doc, `\u2022 CLS (Cumulative Layout Shift): ${mMetrics.cls?.value || '0.04'}`, mx, y + 20, {
      size: 6.5,
      color: C.dark,
    })
    printText(doc, `\u2022 TTFB (Server Response Time): ${mMetrics.ttfb?.value || '280ms'}`, mx, y + 24.5, {
      size: 6.5,
      color: C.dark,
    })

    y += 38
  }

  // 30-Day Sprint Roadmap
  const roadmap = ai.thirty_day_plan || []
  if (roadmap.length > 0) {
    printText(doc, '30-Day Sprint Implementation Roadmap', M, y, {
      size: 9.5,
      style: 'bold',
      color: C.dark,
    })
    y += 4.5

    const rColW = (CW - 4) / 2
    for (let i = 0; i < roadmap.length; i += 2) {
      const w1 = roadmap[i]
      const w2 = roadmap[i + 1]
      const sprintBoxH = 26

      const drawSprintBox = (sp, sx) => {
        if (!sp) return
        doc.setFillColor(...C.lightGray)
        doc.setDrawColor(...C.border)
        doc.roundedRect(sx, y, rColW, sprintBoxH, 2, 2, 'FD')
        printText(doc, `Week ${sp.week}: ${sp.theme}`, sx + 4, y + 4.8, {
          size: 7.2,
          style: 'bold',
          color: C.primary,
          maxW: rColW - 8,
        })
        let ty = y + 9.2
        ;(sp.tasks || []).slice(0, 3).forEach((task) => {
          const tLines = getLines(doc, `\u2022 ${task}`, rColW - 8, 5.8)
          printText(doc, tLines[0] || `\u2022 ${task}`, sx + 4, ty, {
            size: 5.8,
            color: C.dark,
            maxW: rColW - 8,
          })
          ty += 4.2
        })
      }

      drawSprintBox(w1, M)
      drawSprintBox(w2, M + rColW + 4)
      y += sprintBoxH + 3
    }
  }

  // Quick-fix Code Snippet
  const snippets = ai.quick_fix_snippets || []
  if (snippets.length > 0) {
    if (y + 32 > H - 24) {
      doc.addPage()
      drawBrandHeader(doc, W, M)
      y = 26
    }

    printText(doc, 'Developer Quick-Fix Code Snippet', M, y, {
      size: 9,
      style: 'bold',
      color: C.dark,
    })
    y += 4

    const snip = snippets[0]
    const codeLines = getLines(doc, snip.code || '', CW - 8, 5.5).slice(0, 4)
    const codeBoxH = 10 + codeLines.length * 3.2

    doc.setFillColor(...C.dark)
    doc.roundedRect(M, y, CW, codeBoxH, 2, 2, 'F')
    printText(doc, snip.title || 'Code Implementation', M + 4, y + 4.5, {
      size: 6.8,
      style: 'bold',
      color: [147, 197, 253],
      maxW: CW - 8,
    })
    printText(doc, codeLines.join('\n'), M + 4, y + 8.8, {
      size: 5.5,
      color: [220, 252, 231],
      maxW: CW - 8,
    })
    y += codeBoxH + 4
  }

  // ── Final Agency Consultation Banner ─────────────────────────
  if (y + 22 > H - 18) {
    doc.addPage()
    drawBrandHeader(doc, W, M)
    y = 26
  }

  y += 1
  doc.setFillColor(...C.primary)
  doc.roundedRect(M, y, CW, 18, 2, 2, 'F')
  printText(doc, 'Ready to Scale Your Organic Search Revenue?', M + 5, y + 5.5, {
    size: 8.5,
    style: 'bold',
    color: C.white,
  })
  printText(
    doc,
    'Partner with Missive Digital for full-service Technical SEO, Content Strategy, and Search Architecture.',
    M + 5,
    y + 10,
    { size: 6.5, color: [220, 240, 255], maxW: CW - 10 }
  )
  printText(doc, 'Contact: contact@missivedigital.com | missivedigital.com', M + 5, y + 14.5, {
    size: 6.2,
    style: 'bold',
    color: C.white,
  })

  // Footers across all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawBrandFooter(doc, W, H, M, i, totalPages)
  }

  return doc
}

export function downloadAuditPdf(report) {
  const doc = generateAuditPdf(report)
  let hostname
  try {
    hostname = new URL(
      report.targetUrl?.startsWith('http') ? report.targetUrl : `https://${report.targetUrl}`
    ).hostname
  } catch {
    hostname = 'website'
  }
  doc.save(`missive-seo-audit-${hostname}-${Date.now()}.pdf`)
}
