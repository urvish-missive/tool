import { jsPDF } from 'jspdf'

const C = {
  primary: [12, 129, 243],    // #0C81F3 (Missive Blue)
  secondary: [235, 137, 136], // #EB8988 (Missive Coral)
  dark: [17, 24, 39],         // #111827
  mid: [55, 65, 81],          // #374151
  gray: [107, 114, 128],      // #6B7280
  lightGray: [243, 244, 246], // #F3F4F6
  border: [229, 231, 235],    // #E5E7EB
  white: [255, 255, 255],
  green: [22, 163, 74],       // #16A34A
  greenBg: [220, 252, 231],   // #DCFCE7
  red: [220, 38, 38],         // #DC2626
  redBg: [254, 226, 226],     // #FEE2E2
  yellow: [202, 138, 4],      // #CA8A04
  yellowBg: [254, 249, 195],  // #FEF9C3
  blueBg: [239, 246, 255],    // #EFF6FF
  purple: [147, 51, 234],     // #9333EA
  purpleBg: [243, 232, 255],  // #F3E8FF
}

function scoreColor(s) {
  return s >= 80 ? C.green : s >= 60 ? C.yellow : C.red
}

function scoreBg(s) {
  return s >= 80 ? C.greenBg : s >= 60 ? C.yellowBg : C.redBg
}

function gradientBar(doc, x, y, w, h) {
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

function text(doc, str, x, y, opts = {}) {
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

function drawScoreBadge(doc, x, y, score, label, size = 'lg') {
  const r = size === 'lg' ? 14 : size === 'md' ? 10 : 7
  const col = scoreColor(score)

  // Outer circle
  doc.setFillColor(...col)
  doc.circle(x, y, r, 'F')

  // White inner
  doc.setFillColor(...C.white)
  doc.circle(x, y, r - 2, 'F')

  // Score
  doc.setFillColor(...col)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size === 'lg' ? 15 : size === 'md' ? 11 : 8)
  doc.text(String(score), x, y + (size === 'lg' ? 2 : 1.5), { align: 'center' })

  if (label) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.gray)
    doc.text(label, x, y + r + 4, { align: 'center' })
  }
}

function drawCheckItem(doc, x, y, w, label, status, isAuto) {
  const col = status === 'pass' ? C.green : status === 'fail' ? C.red : C.yellow
  const bg = status === 'pass' ? C.greenBg : status === 'fail' ? C.redBg : C.yellowBg
  const icon = status === 'pass' ? '\u2713' : status === 'fail' ? '\u2717' : '!'

  // Status indicator
  doc.setFillColor(...bg)
  doc.circle(x + 4, y, 3, 'F')
  doc.setFillColor(...col)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(icon, x + 4, y + 1, { align: 'center' })

  // Label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.dark)
  doc.text(label, x + 9, y + 1, { maxWidth: w - 24 })

  // Auto badge
  if (isAuto) {
    doc.setFillColor(...C.purpleBg)
    doc.roundedRect(x + w - 14, y - 2, 11, 4, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(4.5)
    doc.setTextColor(...C.purple)
    doc.text('AUTO', x + w - 8.5, y + 0.8, { align: 'center' })
  }
}

export function generateQaPdf(report, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, M = 16, CW = W - M * 2
  let y = 0

  // ══════ PAGE 1: HEADER & SCORECARD ══════
  gradientBar(doc, 0, 0, W, 6)

  // Header Title
  y = 15
  text(doc, "Himani Kankaria's Content QA Checklist", M, y, { size: 18, style: 'bold', color: C.dark })
  y += 6
  text(doc, "that helps you QA every content written for your brand the way Himani does.", M, y, { size: 8.5, color: C.primary })
  y += 4
  text(doc, '12 Pillars \u2022 34 Quality & AI Checks \u2022 Deep Editorial Assessment', M, y, { size: 7.5, color: C.gray })

  // Date Tag
  if (meta.date) {
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(W - M - 30, 12, 30, 7, 2, 2, 'F')
    text(doc, meta.date, W - M - 15, 16.5, { size: 7, color: C.gray, align: 'center' })
  }

  // ── Overall Score Card ──
  y = 30
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 44, 3, 3, 'FD')

  // Left circle badge
  drawScoreBadge(doc, M + 24, y + 18, meta.score || 0, null, 'lg')
  text(doc, 'The Himani Score', M + 24, y + 37, { size: 7.5, style: 'bold', color: C.dark, align: 'center' })

  // Middle metrics
  const passed = meta.passed || 0
  const total = meta.total || 0
  const failed = total - passed
  text(doc, `${passed} Passed`, M + 46, y + 12, { size: 8.5, style: 'bold', color: C.green })
  text(doc, `${failed} Need Action`, M + 46, y + 18, { size: 8.5, style: 'bold', color: C.red })
  text(doc, `${total} Total Checks`, M + 46, y + 24, { size: 7.5, color: C.gray })
  if (meta.title) text(doc, `Title: ${meta.title.substring(0, 35)}`, M + 46, y + 31, { size: 7.5, color: C.mid })
  if (meta.keyword) text(doc, `Target Keyword: ${meta.keyword}`, M + 46, y + 37, { size: 7.5, color: C.mid })

  // Right quick badges (Em dashes, AI cliches, Flesch)
  const quick = report.quickStats || {}
  const qx = M + 115
  doc.setFillColor(...(quick.emDashesCount === 0 ? C.greenBg : C.redBg))
  doc.roundedRect(qx, y + 8, 55, 8, 2, 2, 'F')
  text(doc, `Em Dashes: ${quick.emDashesCount || 0} (Goal: 0)`, qx + 4, y + 13.5, { size: 7, style: 'bold', color: quick.emDashesCount === 0 ? C.green : C.red })

  doc.setFillColor(...(quick.aiPhrasesCount === 0 ? C.greenBg : C.yellowBg))
  doc.roundedRect(qx, y + 18, 55, 8, 2, 2, 'F')
  text(doc, `AI Clichés: ${quick.aiPhrasesCount || 0} detected`, qx + 4, y + 23.5, { size: 7, style: 'bold', color: quick.aiPhrasesCount === 0 ? C.green : C.yellow })

  doc.setFillColor(...C.lightGray)
  doc.roundedRect(qx, y + 28, 55, 8, 2, 2, 'F')
  text(doc, `Flesch Reading Ease: ${quick.fleschScore || 0}/100`, qx + 4, y + 33.5, { size: 7, color: C.mid })

  // ── AI Summary & Top Fixes ──
  const ai = report.ai
  y = 78
  if (ai?.summary) {
    doc.setFillColor(...C.blueBg)
    doc.roundedRect(M, y, CW, 22, 2, 2, 'F')
    text(doc, "Himani's Executive Assessment", M + 4, y + 5, { size: 8, style: 'bold', color: C.primary })
    text(doc, ai.summary, M + 4, y + 10, { size: 7.5, color: C.dark, maxW: CW - 8 })
    y += 26
  }

  if (ai?.topFixes?.length > 0) {
    const fixH = Math.min(ai.topFixes.length * 4.5 + 7, 30)
    doc.setFillColor(...C.redBg)
    doc.roundedRect(M, y, CW, fixH, 2, 2, 'F')
    text(doc, 'Top Action Items to Fix', M + 4, y + 4.5, { size: 8, style: 'bold', color: C.red })
    let fy = y + 9
    for (const fix of ai.topFixes.slice(0, 4)) {
      text(doc, `\u26A0  ${fix}`, M + 5, fy, { size: 7, color: C.dark, maxW: CW - 10 })
      fy += 4.5
    }
    y += fixH + 4
  }

  // ══════ 12 PILLARS GRID ══════
  const categories = report.categories || {}
  const statuses = report.statuses || {}
  const catScores = report.categoryScores || {}

  for (const [catId, catDef] of Object.entries(categories)) {
    const catScore = catScores[catId] || 0
    const items = catDef.items || []
    const aiCat = ai?.categories?.[catId]

    const neededHeight = 16 + items.length * 5 + (aiCat?.issues?.length ? 12 : 0)
    if (y + neededHeight > H - 22) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 6)
      y = 15
    }

    // Category Header Box
    doc.setFillColor(...C.lightGray)
    doc.roundedRect(M, y, CW, 8, 2, 2, 'F')
    text(doc, `${catDef.number}. ${catDef.label}`, M + 4, y + 5.5, { size: 8.5, style: 'bold', color: C.dark })
    drawScoreBadge(doc, W - M - 8, y + 4, catScore, null, 'sm')
    y += 11

    // Checks
    for (const item of items) {
      if (y > H - 20) {
        doc.addPage()
        gradientBar(doc, 0, 0, W, 6)
        y = 15
      }
      drawCheckItem(doc, M, y, CW, item.label, statuses[item.id] || 'pending', item.auto)
      y += 5
    }

    // AI Pillar remarks
    if (aiCat && (aiCat.issues?.length > 0 || aiCat.suggestions?.length > 0)) {
      const remarkLines = []
      if (aiCat.issues?.length > 0) remarkLines.push(`Issue: ${aiCat.issues[0]}`)
      if (aiCat.suggestions?.length > 0) remarkLines.push(`Fix: ${aiCat.suggestions[0]}`)

      if (remarkLines.length > 0) {
        y += 1
        doc.setFillColor(...C.blueBg)
        const rh = remarkLines.length * 3.5 + 4
        doc.roundedRect(M + 3, y, CW - 6, rh, 1.5, 1.5, 'F')
        let ry = y + 3
        for (const r of remarkLines) {
          text(doc, r, M + 5, ry, { size: 6.5, color: C.dark, maxW: CW - 12 })
          ry += 3.5
        }
        y += rh + 2
      }
    }

    y += 3
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    gradientBar(doc, 0, H - 5, W, 5)
    text(doc, "Himani Kankaria's Content QA Checklist \u2022 Missive Digital", M, H - 1.5, { size: 6, color: C.white })
    text(doc, `Page ${i} of ${totalPages}`, W - M, H - 1.5, { size: 6, color: C.white, align: 'right' })
  }

  return doc
}

export function downloadQaPdf(report, meta = {}) {
  const doc = generateQaPdf(report, meta)
  const name = (meta.title || 'himani-qa-report').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
  doc.save(`himani-content-qa-${name}-${Date.now()}.pdf`)
}
