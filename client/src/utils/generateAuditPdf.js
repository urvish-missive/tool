import { jsPDF } from 'jspdf'

const C = {
  primary: [12, 129, 243], // #0C81F3 (Missive Blue)
  secondary: [235, 137, 136], // #EB8988 (Missive Coral)
  dark: [17, 24, 39], // #111827
  mid: [55, 65, 81], // #374151
  gray: [107, 114, 128], // #6B7280
  lightGray: [243, 244, 246], // #F3F4F6
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
  if (score >= 85) return C.green
  if (score >= 70) return C.primary
  if (score >= 50) return C.amber
  return C.red
}

function getSeverityColor(sev) {
  switch (sev) {
    case 'CRITICAL':
      return { col: C.red, bg: C.redBg }
    case 'HIGH':
      return { col: [194, 65, 12], bg: [255, 237, 213] } // Orange
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

export function generateAuditPdf(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210,
    H = 297,
    M = 16,
    CW = W - M * 2
  let y = 0

  const targetUrl = report.targetUrl || 'Website'
  const overallScore = report.overallScore || 0
  const scoreBreakdown = report.scoreBreakdown || {}
  const issues = report.issues || []
  const ai = report.ai || report.ai_report || {}
  const pageSpeed = report.pageSpeed || {}

  // ════════════ PAGE 1: EXECUTIVE DASHBOARD ════════════
  drawGradientBar(doc, 0, 0, W, 6)

  y = 16
  printText(doc, 'AI SEO Site Audit & Technical Diagnostic Report', M, y, {
    size: 16,
    style: 'bold',
    color: C.dark,
  })
  y += 6
  printText(doc, `Audited Target: ${targetUrl}`, M, y, {
    size: 9,
    style: 'bold',
    color: C.primary,
  })
  y += 4.5
  printText(
    doc,
    `Pages Audited: ${report.totalPages || 1} | Total Issues Identified: ${issues.length} | Date: ${new Date().toLocaleDateString()}`,
    M,
    y,
    { size: 7.5, color: C.gray }
  )

  // Top Scorecard Box
  y = 33
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 36, 3, 3, 'FD')

  // Overall Score Circle
  const scoreCol = getScoreColor(overallScore)
  doc.setFillColor(...scoreCol)
  doc.circle(M + 20, y + 18, 13, 'F')
  doc.setFillColor(...C.white)
  doc.circle(M + 20, y + 18, 11, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...scoreCol)
  doc.text(String(overallScore), M + 20, y + 20, { align: 'center' })

  printText(doc, 'Overall Site Health', M + 20, y + 34, {
    size: 7,
    style: 'bold',
    color: C.dark,
    align: 'center',
  })

  // Severity Counts Summary
  const sev = report.severityCounts || {}
  const startX = M + 42
  printText(doc, 'Action Items Severity Breakdown:', startX, y + 9, {
    size: 8,
    style: 'bold',
    color: C.dark,
  })

  const badges = [
    { label: 'Critical', count: sev.CRITICAL || 0, bg: C.redBg, textCol: C.red },
    { label: 'High', count: sev.HIGH || 0, bg: [255, 237, 213], textCol: [194, 65, 12] },
    { label: 'Medium', count: sev.MEDIUM || 0, bg: C.amberBg, textCol: C.amber },
    { label: 'Low', count: sev.LOW || 0, bg: C.blueBg, textCol: C.primary },
  ]

  let bx = startX
  badges.forEach((b) => {
    doc.setFillColor(...b.bg)
    doc.roundedRect(bx, y + 14, 26, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...b.textCol)
    doc.text(String(b.count), bx + 13, y + 22, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(b.label, bx + 13, y + 26, { align: 'center' })
    bx += 29
  })

  // Category Scores Grid
  y = 74
  printText(doc, 'Category Performance & Scoring Rationale', M, y, {
    size: 11,
    style: 'bold',
    color: C.dark,
  })
  y += 5

  const categories = [
    { key: 'technical', label: 'Technical SEO', val: report.technicalScore },
    { key: 'onPage', label: 'On-Page Metadata', val: report.onPageScore },
    { key: 'performance', label: 'PageSpeed & Performance', val: report.performanceScore },
    { key: 'content', label: 'Content Depth', val: report.contentScore },
    { key: 'mobile', label: 'Mobile Usability', val: report.mobileScore },
    { key: 'structuredData', label: 'Schema.org Data', val: report.structuredDataScore },
    { key: 'links', label: 'Link Equity', val: report.linksScore },
    { key: 'security', label: 'HTTPS & Security', val: report.securityScore },
  ]

  const colW = (CW - 6) / 2
  for (let i = 0; i < categories.length; i += 2) {
    const c1 = categories[i]
    const c2 = categories[i + 1]
    const rowH = 17

    const drawCatCard = (cat, cx) => {
      if (!cat) return
      const detail = scoreBreakdown[cat.key] || {}
      doc.setFillColor(...C.lightGray)
      doc.roundedRect(cx, y, colW, rowH, 2, 2, 'F')

      const cColor = getScoreColor(cat.val || 0)
      doc.setFillColor(...cColor)
      doc.circle(cx + 8, y + 8.5, 5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...C.white)
      doc.text(String(cat.val || 0), cx + 8, y + 10, { align: 'center' })

      printText(doc, cat.label, cx + 16, y + 6.5, { size: 8, style: 'bold', color: C.dark })
      const rationale =
        detail.whyThisScore || `${cat.label} scored ${cat.val}/100 based on standard audits.`
      printText(doc, rationale, cx + 16, y + 11.5, {
        size: 6.5,
        color: C.gray,
        maxW: colW - 18,
      })
    }

    drawCatCard(c1, M)
    drawCatCard(c2, M + colW + 6)
    y += rowH + 3
  }

  // Executive AI Summary Box
  y += 3
  if (ai.executive_summary) {
    doc.setFillColor(...C.blueBg)
    doc.roundedRect(M, y, CW, 26, 2, 2, 'F')
    printText(doc, 'Executive Strategic Summary', M + 5, y + 5.5, {
      size: 8.5,
      style: 'bold',
      color: C.primary,
    })
    printText(doc, ai.executive_summary, M + 5, y + 11, {
      size: 7.5,
      color: C.dark,
      maxW: CW - 10,
    })
    y += 30
  }

  // Strategic Strengths & Opportunities
  if (ai.strengths?.length > 0 || ai.strategic_opportunities?.length > 0) {
    const halfW = (CW - 5) / 2

    // Strengths
    doc.setFillColor(...C.greenBg)
    doc.roundedRect(M, y, halfW, 28, 2, 2, 'F')
    printText(doc, 'Verified Technical Strengths', M + 4, y + 5, {
      size: 8,
      style: 'bold',
      color: C.green,
    })
    let sy = y + 10
    ;(ai.strengths || []).slice(0, 3).forEach((s) => {
      printText(doc, `\u2713 ${s}`, M + 4, sy, { size: 6.5, color: C.dark, maxW: halfW - 8 })
      sy += 5
    })

    // Opportunities
    const ox = M + halfW + 5
    doc.setFillColor(...C.amberBg)
    doc.roundedRect(ox, y, halfW, 28, 2, 2, 'F')
    printText(doc, 'High-Impact Growth Opportunities', ox + 4, y + 5, {
      size: 8,
      style: 'bold',
      color: C.amber,
    })
    let oy = y + 10
    ;(ai.strategic_opportunities || []).slice(0, 3).forEach((o) => {
      printText(doc, `\u2192 ${o}`, ox + 4, oy, { size: 6.5, color: C.dark, maxW: halfW - 8 })
      oy += 5
    })
    y += 32
  }

  // ════════════ PAGE 2+: DETAILED GROUPED ISSUES ════════════
  doc.addPage()
  drawGradientBar(doc, 0, 0, W, 6)
  y = 16

  printText(doc, 'Identified Issues & Developer Action Items', M, y, {
    size: 14,
    style: 'bold',
    color: C.dark,
  })
  y += 5
  printText(
    doc,
    'Grouped by issue category with exact extracted DOM evidence and step-by-step remediation.',
    M,
    y,
    { size: 8, color: C.gray }
  )
  y += 8

  for (let idx = 0; idx < issues.length; idx++) {
    const iss = issues[idx]
    const sevInfo = getSeverityColor(iss.severity)
    const affected = iss.affectedItems || []

    const estHeight = 22 + Math.min(affected.length, 3) * 6 + (iss.recommendation ? 9 : 0)

    if (y + estHeight > H - 20) {
      doc.addPage()
      drawGradientBar(doc, 0, 0, W, 6)
      y = 16
    }

    // Card border box
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, estHeight, 2, 2, 'FD')

    // Severity pill
    doc.setFillColor(...sevInfo.bg)
    doc.roundedRect(M + 3, y + 3, 16, 5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...sevInfo.col)
    doc.text(iss.severity, M + 11, y + 6.5, { align: 'center' })

    // Issue title & category
    printText(doc, iss.title, M + 22, y + 6.8, {
      size: 8.5,
      style: 'bold',
      color: C.dark,
      maxW: CW - 55,
    })

    // Affected count badge
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(W - M - 28, y + 3, 25, 5, 1, 1, 'F')
    printText(doc, `${iss.affectedCount || 1} Page(s)`, W - M - 15.5, y + 6.5, {
      size: 6,
      style: 'bold',
      color: C.mid,
      align: 'center',
    })

    let cy = y + 11
    if (iss.description) {
      printText(doc, `Why it matters: ${iss.description}`, M + 4, cy, {
        size: 7,
        color: C.mid,
        maxW: CW - 8,
      })
      cy += 5
    }

    // Affected URLs and exact extracted evidence
    if (affected.length > 0) {
      affected.slice(0, 3).forEach((item) => {
        const itemUrl = item.url ? item.url.replace(/^https?:\/\/[^/]+/, '') || '/' : ''
        const itemEvidence = item.evidence ? ` - Evidence: ${item.evidence.replace(/\n/g, ' ')}` : ''
        const fullEvidenceLine = `\u2022 ${itemUrl}${itemEvidence}`
        printText(doc, fullEvidenceLine, M + 6, cy, { size: 6.5, color: C.dark, maxW: CW - 12 })
        cy += 4.5
      })
    }

    if (iss.recommendation) {
      doc.setFillColor(...C.greenBg)
      doc.roundedRect(M + 3, cy, CW - 6, 6.5, 1, 1, 'F')
      printText(doc, `Fix: ${iss.recommendation}`, M + 5, cy + 4.5, {
        size: 6.5,
        style: 'bold',
        color: C.green,
        maxW: CW - 12,
      })
    }

    y += estHeight + 4
  }

  // ════════════ PAGE: TECHNICAL, SITEMAPS & PAGESPEED ════════════
  doc.addPage()
  drawGradientBar(doc, 0, 0, W, 6)
  y = 16

  printText(doc, 'Technical Diagnostics & Google PageSpeed Insights', M, y, {
    size: 14,
    style: 'bold',
    color: C.dark,
  })
  y += 8

  // Sitemap & Variations Box
  const sitemapProbe = report.sitemapProbe || {}
  doc.setFillColor(...C.lightGray)
  doc.roundedRect(M, y, CW, 24, 2, 2, 'F')
  printText(doc, 'XML Sitemap Discovery & Index Check', M + 4, y + 5.5, {
    size: 8.5,
    style: 'bold',
    color: C.dark,
  })

  const sitemapStatus = sitemapProbe.found
    ? `Valid Sitemaps Detected: ${sitemapProbe.detectedSitemaps?.join(', ') || 'sitemap.xml'} (${sitemapProbe.totalDiscoveredUrls || 0} total indexed URLs)`
    : 'No standard XML sitemap found across variations (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml).'
  printText(doc, sitemapStatus, M + 4, y + 11, { size: 7.5, color: C.mid, maxW: CW - 8 })

  const robotsStatus = report.robotsTxt
    ? `Robots.txt: Active (${report.robotsSitemapUrls?.length || 0} sitemap directives found)`
    : 'Robots.txt: Missing or empty at /robots.txt'
  printText(doc, robotsStatus, M + 4, y + 17, { size: 7, color: C.gray, maxW: CW - 8 })
  y += 28

  // Google PageSpeed Core Web Vitals Box
  if (pageSpeed.mobile || pageSpeed.desktop) {
    const mob = pageSpeed.mobile || {}
    const dsk = pageSpeed.desktop || {}

    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, 38, 2, 2, 'FD')

    printText(doc, 'Google PageSpeed Insights & Core Web Vitals', M + 4, y + 6, {
      size: 9,
      style: 'bold',
      color: C.dark,
    })

    // Mobile Badge
    const mCol = getScoreColor(mob.score || 70)
    doc.setFillColor(...mCol)
    doc.roundedRect(M + 4, y + 10, 32, 22, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...C.white)
    doc.text(`${mob.score || 0}`, M + 20, y + 21, { align: 'center' })
    doc.setFontSize(6.5)
    doc.text('Mobile Score', M + 20, y + 27, { align: 'center' })

    // Desktop Badge
    const dCol = getScoreColor(dsk.score || 85)
    doc.setFillColor(...dCol)
    doc.roundedRect(M + 40, y + 10, 32, 22, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...C.white)
    doc.text(`${dsk.score || 0}`, M + 56, y + 21, { align: 'center' })
    doc.setFontSize(6.5)
    doc.text('Desktop Score', M + 56, y + 27, { align: 'center' })

    // Metrics list
    const mMetrics = mob.metrics || {}
    const mx = M + 78
    printText(
      doc,
      `LCP (Largest Contentful Paint): ${mMetrics.lcp?.value || 'N/A'}`,
      mx,
      y + 13,
      { size: 7, color: C.dark }
    )
    printText(doc, `FCP (First Contentful Paint): ${mMetrics.fcp?.value || 'N/A'}`, mx, y + 18, {
      size: 7,
      color: C.dark,
    })
    printText(doc, `CLS (Cumulative Layout Shift): ${mMetrics.cls?.value || 'N/A'}`, mx, y + 23, {
      size: 7,
      color: C.dark,
    })
    printText(doc, `TTFB (Server Response Time): ${mMetrics.ttfb?.value || 'N/A'}`, mx, y + 28, {
      size: 7,
      color: C.dark,
    })

    y += 44
  }

  // 30-Day Sprint Roadmap
  const roadmap = ai.thirty_day_plan || []
  if (roadmap.length > 0) {
    printText(doc, '30-Day Sprint Remediation Roadmap', M, y, {
      size: 11,
      style: 'bold',
      color: C.dark,
    })
    y += 6

    const rColW = (CW - 6) / 2
    for (let i = 0; i < roadmap.length; i += 2) {
      const w1 = roadmap[i]
      const w2 = roadmap[i + 1]

      const drawSprintBox = (sp, sx) => {
        if (!sp) return
        doc.setFillColor(...C.lightGray)
        doc.roundedRect(sx, y, rColW, 26, 2, 2, 'F')
        printText(doc, `Week ${sp.week}: ${sp.theme}`, sx + 4, y + 5.5, {
          size: 7.5,
          style: 'bold',
          color: C.primary,
        })
        let ty = y + 10
        ;(sp.tasks || []).slice(0, 3).forEach((task) => {
          printText(doc, `\u2022 ${task}`, sx + 4, ty, {
            size: 6.5,
            color: C.dark,
            maxW: rColW - 8,
          })
          ty += 4.5
        })
      }

      drawSprintBox(w1, M)
      drawSprintBox(w2, M + rColW + 6)
      y += 30
    }
  }

  // Quick-fix Code Snippets
  const snippets = ai.quick_fix_snippets || []
  if (snippets.length > 0) {
    y += 2
    if (y + 40 > H - 20) {
      doc.addPage()
      drawGradientBar(doc, 0, 0, W, 6)
      y = 16
    }

    printText(doc, 'Developer Quick-Fix Code Snippet', M, y, {
      size: 11,
      style: 'bold',
      color: C.dark,
    })
    y += 6

    const snip = snippets[0]
    doc.setFillColor(...C.dark)
    doc.roundedRect(M, y, CW, 28, 2, 2, 'F')
    printText(doc, snip.title || 'Code Fix', M + 4, y + 5, {
      size: 7.5,
      style: 'bold',
      color: [147, 197, 253],
    })
    printText(doc, (snip.code || '').substring(0, 300), M + 4, y + 11, {
      size: 6,
      color: [220, 252, 231],
      maxW: CW - 8,
    })
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawGradientBar(doc, 0, H - 5, W, 5)
    printText(doc, 'AI SEO Site Auditor \u2022 Missive Digital Search Consulting', M, H - 1.5, {
      size: 6,
      color: C.white,
    })
    printText(doc, `Page ${i} of ${totalPages}`, W - M, H - 1.5, {
      size: 6,
      color: C.white,
      align: 'right',
    })
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
  doc.save(`seo-audit-${hostname}-${Date.now()}.pdf`)
}
