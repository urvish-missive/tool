import { jsPDF } from 'jspdf'

const C = {
  primary: [12, 129, 243],
  secondary: [235, 137, 136],
  dark: [17, 24, 39],
  mid: [55, 65, 81],
  gray: [107, 114, 128],
  lightGray: [243, 244, 246],
  border: [229, 231, 235],
  white: [255, 255, 255],
  green: [22, 163, 74],
  greenBg: [220, 252, 231],
  red: [220, 38, 38],
  redBg: [254, 226, 226],
  yellow: [202, 138, 4],
  yellowBg: [254, 249, 195],
  blue: [37, 99, 235],
  blueBg: [219, 234, 254],
}

function scoreColor(s) { return s >= 80 ? C.green : s >= 60 ? C.yellow : C.red }
function scoreBg(s) { return s >= 80 ? C.greenBg : s >= 60 ? C.yellowBg : C.redBg }

function gradientBar(doc, x, y, w, h) {
  for (let i = 0; i < w; i++) {
    const r = i / w
    doc.setFillColor(
      Math.round(C.primary[0] + (C.secondary[0] - C.primary[0]) * r),
      Math.round(C.primary[1] + (C.secondary[1] - C.primary[1]) * r),
      Math.round(C.primary[2] + (C.secondary[2] - C.primary[2]) * r),
    )
    doc.rect(x + i, y, 1, h, 'F')
  }
}

function text(doc, str, x, y, opts = {}) {
  const { size = 9, style = 'normal', color = C.dark, align = 'left', maxW } = opts
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
  if (maxW) {
    const lines = doc.splitTextToSize(String(str), maxW)
    doc.text(lines, x, y, { align })
    return lines.length
  }
  doc.text(String(str), x, y, { align })
  return 1
}

function drawScoreBadge(doc, x, y, score, label, size = 'lg') {
  const r = size === 'lg' ? 14 : size === 'md' ? 10 : 7
  const col = scoreColor(score)
  const bg = scoreBg(score)

  // Outer circle
  doc.setFillColor(...col)
  doc.circle(x, y, r, 'F')

  // White inner
  doc.setFillColor(...C.white)
  doc.circle(x, y, r - 2, 'F')

  // Score
  doc.setFillColor(...col)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size === 'lg' ? 16 : size === 'md' ? 11 : 8)
  doc.text(String(score), x, y + (size === 'lg' ? 2 : 1.5), { align: 'center' })

  // Label below
  if (label) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.gray)
    doc.text(label, x, y + r + 4, { align: 'center' })
  }
}

function drawProgress(doc, x, y, w, h, score) {
  doc.setFillColor(...C.lightGray)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
  doc.setFillColor(...scoreColor(score))
  doc.roundedRect(x, y, Math.max(2, (score / 100) * w), h, 2, 2, 'F')
}

function drawCheckItem(doc, x, y, w, label, status, isAuto) {
  const col = status === 'pass' ? C.green : status === 'fail' ? C.red : C.gray
  const bg = status === 'pass' ? C.greenBg : status === 'fail' ? C.redBg : C.lightGray
  const icon = status === 'pass' ? '\u2713' : status === 'fail' ? '\u2717' : '\u2014'

  // Status dot
  doc.setFillColor(...bg)
  doc.circle(x + 4, y, 3.5, 'F')
  doc.setFillColor(...col)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(icon, x + 4, y + 1, { align: 'center' })

  // Label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.dark)
  doc.text(label, x + 10, y + 1.2, { maxWidth: w - 30 })

  // Auto badge
  if (isAuto) {
    doc.setFillColor(...C.blueBg)
    doc.roundedRect(x + w - 16, y - 2.5, 12, 5, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5)
    doc.setTextColor(...C.blue)
    doc.text('AUTO', x + w - 10, y + 0.5, { align: 'center' })
  }
}

export function generateQaPdf(report, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, M = 20, CW = W - M * 2
  let y = 0

  // ══════ PAGE 1: HEADER + SCORE ══════

  // Gradient top bar
  gradientBar(doc, 0, 0, W, 6)

  // Title block
  y = 16
  text(doc, 'Content QA Report', M, y, { size: 22, style: 'bold', color: C.dark })
  y += 7
  text(doc, 'Based on Himani Kankaria\'s Content QA Checklist', M, y, { size: 9, color: C.gray })
  y += 4
  text(doc, '42 quality checks across 7 categories', M, y, { size: 8, color: C.gray })

  // Date badge (top right)
  if (meta.date) {
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(W - M - 32, 14, 32, 8, 3, 3, 'F')
    text(doc, meta.date, W - M - 16, 19.5, { size: 8, color: C.gray, align: 'center' })
  }

  // ── Score Card ──
  y = 36
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 50, 4, 4, 'FD')

  // Left side: Overall score
  drawScoreBadge(doc, M + 28, y + 22, meta.score || 0, null, 'lg')
  text(doc, 'Overall Score', M + 28, y + 44, { size: 8, color: C.gray, align: 'center' })

  // Passed / Failed summary
  const passed = meta.passed || 0
  const total = meta.total || 0
  const failed = total - passed
  text(doc, `${passed} passed`, M + 52, y + 15, { size: 9, style: 'bold', color: C.green })
  text(doc, `${failed} failed`, M + 52, y + 22, { size: 9, style: 'bold', color: C.red })
  text(doc, `${total} total checks`, M + 52, y + 29, { size: 8, color: C.gray })

  // Meta info
  if (meta.title) text(doc, `Title: ${meta.title}`, M + 52, y + 36, { size: 8, color: C.mid })
  if (meta.keyword) text(doc, `Keyword: ${meta.keyword}`, M + 52, y + 42, { size: 8, color: C.mid })

  // Right side: Category scores
  const cats = report.categoryScores || {}
  const catDefs = [
    { id: 'objective', label: 'Objective' },
    { id: 'audience', label: 'Audience' },
    { id: 'seo', label: 'SEO' },
    { id: 'grammar', label: 'Grammar' },
    { id: 'ux', label: 'UX/Format' },
    { id: 'brand', label: 'Brand' },
    { id: 'final', label: 'Sign-Off' },
  ]

  let catY = y + 10
  const catX = M + 100
  const barW = CW - 110

  text(doc, 'Category Scores', catX, catY - 3, { size: 9, style: 'bold', color: C.dark })
  catY += 4

  for (const cat of catDefs) {
    const s = cats[cat.id] || 0
    text(doc, cat.label, catX, catY + 1, { size: 7, color: C.mid })
    drawProgress(doc, catX + 24, catY - 0.5, barW - 28, 3, s)
    text(doc, `${s}%`, catX + barW + 1, catY + 1, { size: 7, style: 'bold', color: scoreColor(s) })
    catY += 7
  }

  // ── Meta info bar ──
  y = 90
  doc.setFillColor(...C.lightGray)
  doc.roundedRect(M, y, CW, 8, 2, 2, 'F')
  const metaParts = []
  if (meta.title) metaParts.push(`Title: ${meta.title}`)
  if (meta.keyword) metaParts.push(`Keyword: ${meta.keyword}`)
  if (meta.wordCount) metaParts.push(`Words: ${meta.wordCount}`)
  text(doc, metaParts.join('  |  ') || 'Content QA Analysis', M + 4, y + 5.5, { size: 7, color: C.gray })

  // ── AI Summary ──
  const ai = report.ai
  if (ai?.summary) {
    y = 104
    doc.setFillColor(...C.primary)
    doc.roundedRect(M, y, CW, 7, 2, 2, 'F')
    text(doc, 'AI Assessment', M + 4, y + 5, { size: 9, style: 'bold', color: C.white })

    y += 10
    doc.setFillColor(...C.blueBg)
    const summaryLines = doc.splitTextToSize(ai.summary, CW - 8)
    const boxH = Math.min(summaryLines.length * 4 + 4, 28)
    doc.roundedRect(M, y, CW, boxH, 2, 2, 'F')
    text(doc, summaryLines.slice(0, 6).join(' '), M + 4, y + 4, { size: 8, color: C.dark, maxW: CW - 8 })
    y += boxH + 4
  }

  // ── Top Issues ──
  if (ai?.topIssues?.length > 0) {
    doc.setFillColor(...C.redBg)
    const issueH = Math.min(ai.topIssues.length * 4.5 + 6, 30)
    doc.roundedRect(M, y, CW, issueH, 2, 2, 'F')
    text(doc, 'Top Issues to Fix', M + 4, y + 4.5, { size: 8, style: 'bold', color: C.red })
    let iy = y + 9
    for (const issue of ai.topIssues.slice(0, 5)) {
      text(doc, `\u26A0  ${issue}`, M + 6, iy, { size: 7, color: C.dark })
      iy += 4.5
    }
    y += issueH + 4
  }

  // ══════ CATEGORY PAGES ══════

  const categories = report.categories || {}
  const statuses = report.statuses || {}

  for (const [catId, catDef] of Object.entries(categories)) {
    const catScore = cats[catId] || 0
    const items = catDef.items || []
    const aiCat = ai?.[catId]

    // Check page space (header + items + possible AI box)
    const needed = 20 + items.length * 5.5 + (aiCat ? 25 : 0)
    if (y + needed > H - 25) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 6)
      y = 16
    }

    // Category header bar
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F')

    text(doc, catDef.label, M + 4, y + 7, { size: 10, style: 'bold', color: C.dark })

    // Score badge in header
    drawScoreBadge(doc, W - M - 12, y + 5, catScore, null, 'sm')
    y += 14

    // Items
    for (const item of items) {
      if (y > H - 25) {
        doc.addPage()
        gradientBar(doc, 0, 0, W, 6)
        y = 16
      }
      drawCheckItem(doc, M, y, CW, item.label, statuses[item.id] || 'pending', item.auto)
      y += 5.5
    }

    // AI insights box
    if (aiCat && (aiCat.issues?.length > 0 || aiCat.suggestions?.length > 0)) {
      y += 2
      const lines = []
      if (aiCat.issues?.length > 0) lines.push(...aiCat.issues.slice(0, 3).map(i => `\u2022 ${i}`))
      if (aiCat.suggestions?.length > 0) lines.push(...aiCat.suggestions.slice(0, 2).map(s => `\u2192 ${s}`))
      const boxH = Math.min(lines.length * 4 + 5, 28)

      doc.setFillColor(...C.yellowBg)
      doc.roundedRect(M + 4, y, CW - 8, boxH, 2, 2, 'F')

      let iy = y + 4
      for (const line of lines.slice(0, 5)) {
        text(doc, line, M + 7, iy, { size: 7, color: C.mid, maxW: CW - 14 })
        iy += 4
      }
      y += boxH + 2
    }

    y += 6
  }

  // ══════ FOOTER ON ALL PAGES ══════
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    gradientBar(doc, 0, H - 6, W, 6)
    text(doc, 'Content QA Report \u2022 Generated by Missive Digital', M, H - 2, { size: 6, color: C.white })
    text(doc, `Page ${i} / ${pages}`, W - M, H - 2, { size: 6, color: C.white, align: 'right' })
  }

  return doc
}

export function downloadQaPdf(report, meta = {}) {
  const doc = generateQaPdf(report, meta)
  const name = (meta.title || 'report').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
  doc.save(`content-qa-${name}-${Date.now()}.pdf`)
}
