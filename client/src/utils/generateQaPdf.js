import { jsPDF } from 'jspdf'

const C = {
  primary: [12, 129, 243], // #0C81F3 (Missive Blue)
  secondary: [235, 137, 136], // #EB8988 (Missive Coral)
  dark: [15, 23, 42], // #0F172A
  mid: [51, 65, 85], // #334155
  gray: [100, 116, 139], // #64748B
  lightGray: [248, 250, 252], // #F8FAFC
  cardBg: [255, 255, 255],
  border: [226, 232, 240], // #E2E8F0
  borderDark: [203, 213, 225],
  white: [255, 255, 255],
  green: [22, 163, 74], // #16A34A
  greenBg: [240, 253, 244], // #F0FDF4
  greenBorder: [187, 247, 208],
  red: [220, 38, 38], // #DC2626
  redBg: [254, 242, 242], // #FEF2F2
  redBorder: [254, 202, 202],
  yellow: [202, 138, 4], // #CA8A04
  yellowBg: [254, 252, 232], // #FEFCE8
  yellowBorder: [254, 240, 138],
  blueBg: [239, 246, 255], // #EFF6FF
  blueBorder: [191, 219, 254],
  purple: [124, 58, 237], // #7C3AED
  purpleBg: [245, 243, 255], // #F5F3FF
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

/**
 * Draw Missive Logo & Branding Header
 */
function drawMissiveLogo(doc, x, y) {
  // Rounded Icon background
  doc.setFillColor(...C.primary)
  doc.roundedRect(x, y, 9, 9, 2, 2, 'F')

  // Coral accent dot
  doc.setFillColor(...C.secondary)
  doc.circle(x + 7, y + 2, 1.3, 'F')

  // 'M' letter in white
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.white)
  doc.text('M', x + 4.5, y + 6.5, { align: 'center' })

  // Brand Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.dark)
  doc.text('MISSIVE', x + 12, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...C.primary)
  doc.text('DIGITAL', x + 31, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.gray)
  doc.text('Content & SEO Strategy Agency', x + 12, y + 8.5)
}

function drawScoreBadge(doc, x, y, score, size = 'lg') {
  const r = size === 'lg' ? 15 : size === 'md' ? 10 : 6
  const col = scoreColor(score)

  // Outer ring
  doc.setFillColor(...col)
  doc.circle(x, y, r, 'F')

  // Inner circle
  doc.setFillColor(...C.white)
  doc.circle(x, y, r - 2, 'F')

  // Score number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size === 'lg' ? 16 : size === 'md' ? 10 : 7)
  doc.setTextColor(...col)
  doc.text(String(score), x, y + (size === 'lg' ? 2.5 : size === 'md' ? 1.5 : 1), { align: 'center' })
}

function drawCheckItem(doc, x, y, w, label, status, isAuto) {
  const isPass = status === 'pass'
  const isFail = status === 'fail'
  const col = isPass ? C.green : isFail ? C.red : C.yellow
  const bg = isPass ? C.greenBg : isFail ? C.redBg : C.yellowBg
  const borderCol = isPass ? C.greenBorder : isFail ? C.redBorder : C.yellowBorder
  const icon = isPass ? '\u2713' : isFail ? '\u2717' : '!'

  // Status icon circle
  doc.setFillColor(...bg)
  doc.setDrawColor(...borderCol)
  doc.circle(x + 4, y, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...col)
  doc.text(icon, x + 4, y + 1.2, { align: 'center' })

  // Label text
  doc.setFont('helvetica', isFail ? 'bold' : 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...(isFail ? C.dark : C.mid))
  doc.text(label, x + 9, y + 1.2, { maxWidth: w - 24 })

  // Auto badge
  if (isAuto) {
    doc.setFillColor(...C.purpleBg)
    doc.setDrawColor(...C.border)
    doc.roundedRect(x + w - 16, y - 2.2, 13, 4.4, 1, 1, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5)
    doc.setTextColor(...C.purple)
    doc.text('AUTO', x + w - 9.5, y + 0.8, { align: 'center' })
  }
}

export function generateQaPdf(report, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 15
  const CW = W - M * 2
  let y = 0

  // ══════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE AUDIT & SCORECARD
  // ══════════════════════════════════════════════════════════════════
  gradientBar(doc, 0, 0, W, 4.5)

  // Header: Logo (left) + Date/Meta (right)
  y = 12
  drawMissiveLogo(doc, M, y)

  // Right Date Badge
  const dateStr = meta.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(W - M - 36, y, 36, 8, 2, 2, 'FD')
  text(doc, `Date: ${dateStr}`, W - M - 18, y + 5.2, { size: 7.5, color: C.mid, align: 'center', style: 'bold' })

  // Title Section
  y = 26
  text(doc, "Himani Kankaria's Content QA Audit", M, y, {
    size: 17,
    style: 'bold',
    color: C.dark,
  })
  y += 5.5
  text(doc, '12-Pillar Editorial Governance, Quality Control & AI Detection Report', M, y, {
    size: 8.5,
    color: C.primary,
    style: 'bold',
  })
  y += 4
  text(doc, 'Evaluates tone, E-E-A-T credibility, structure, scannability, zero em-dashes, and conversational cadence.', M, y, {
    size: 7.5,
    color: C.gray,
  })

  // ── Document Metadata Card ──
  y += 6
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 14, 2.5, 2.5, 'FD')

  const docTitle = (meta.title || 'Audited Content Piece').substring(0, 48)
  const docKeyword = (meta.keyword || 'Not specified').substring(0, 30)
  const docAudience = (meta.targetAudience || 'General Audience').substring(0, 30)
  const docPlatform = (meta.platform || 'Website / Blog').toUpperCase()

  text(doc, `Title:`, M + 4, y + 5, { size: 7, style: 'bold', color: C.gray })
  text(doc, docTitle, M + 14, y + 5, { size: 7.5, style: 'bold', color: C.dark })

  text(doc, `Keyword:`, M + 4, y + 10, { size: 7, style: 'bold', color: C.gray })
  text(doc, docKeyword, M + 18, y + 10, { size: 7.5, color: C.mid })

  text(doc, `Platform:`, M + 95, y + 5, { size: 7, style: 'bold', color: C.gray })
  text(doc, docPlatform, M + 110, y + 5, { size: 7.5, color: C.primary, style: 'bold' })

  text(doc, `Audience:`, M + 95, y + 10, { size: 7, style: 'bold', color: C.gray })
  text(doc, docAudience, M + 110, y + 10, { size: 7.5, color: C.mid })

  // ── Big Executive KPI Scorecard ──
  y += 18
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 42, 3, 3, 'FD')

  // Left Score Circle
  const overallScore = meta.score || report.overall || 75
  drawScoreBadge(doc, M + 22, y + 18, overallScore, 'lg')
  text(doc, 'The Himani Score', M + 22, y + 36, {
    size: 7.5,
    style: 'bold',
    color: C.dark,
    align: 'center',
  })

  // Publication Readiness Badge
  const readiness =
    overallScore >= 85
      ? 'READY TO PUBLISH'
      : overallScore >= 70
        ? 'MINOR POLISH NEEDED'
        : overallScore >= 50
          ? 'NEEDS EDITORIAL REVISION'
          : 'MAJOR QA OVERHAUL'

  const readCol = overallScore >= 85 ? C.green : overallScore >= 70 ? C.primary : overallScore >= 50 ? C.yellow : C.red
  const readBg = overallScore >= 85 ? C.greenBg : overallScore >= 70 ? C.blueBg : overallScore >= 50 ? C.yellowBg : C.redBg
  const readBorder = overallScore >= 85 ? C.greenBorder : overallScore >= 70 ? C.blueBorder : overallScore >= 50 ? C.yellowBorder : C.redBorder

  doc.setFillColor(...readBg)
  doc.setDrawColor(...readBorder)
  doc.roundedRect(M + 46, y + 8, 62, 7, 2, 2, 'FD')
  text(doc, `STATUS: ${readiness}`, M + 77, y + 12.8, { size: 6.5, style: 'bold', color: readCol, align: 'center' })

  // Middle check counters
  const passed = meta.passed || report.passed || 0
  const total = meta.total || report.total || 34
  const failed = Math.max(0, total - passed)

  text(doc, `\u2713  ${passed} Checks Passed`, M + 46, y + 21, { size: 8, style: 'bold', color: C.green })
  text(doc, `\u26A0  ${failed} Items Need Action`, M + 46, y + 27, { size: 8, style: 'bold', color: failed > 0 ? C.red : C.gray })
  text(doc, `\u2022  ${total} Total Standardized Checks`, M + 46, y + 33, { size: 7.5, color: C.gray })

  // Right Pillar Metrics Cards (Em-dashes, AI cliches, Flesch)
  const quick = report.quickStats || {}
  const qx = M + 115

  // Em-dashes Card
  const emCount = quick.emDashesCount || 0
  doc.setFillColor(...(emCount === 0 ? C.greenBg : C.redBg))
  doc.setDrawColor(...(emCount === 0 ? C.greenBorder : C.redBorder))
  doc.roundedRect(qx, y + 6, 58, 9, 2, 2, 'FD')
  text(doc, `Em Dashes ("\u2014"): ${emCount}`, qx + 4, y + 11.8, {
    size: 7.5,
    style: 'bold',
    color: emCount === 0 ? C.green : C.red,
  })
  text(doc, emCount === 0 ? 'Flawless (Goal: 0)' : 'Action: Remove all', qx + 54, y + 11.8, {
    size: 6,
    color: emCount === 0 ? C.green : C.red,
    align: 'right',
  })

  // AI Cliches Card
  const aiPhrases = quick.aiPhrasesCount || 0
  doc.setFillColor(...(aiPhrases === 0 ? C.greenBg : C.yellowBg))
  doc.setDrawColor(...(aiPhrases === 0 ? C.greenBorder : C.yellowBorder))
  doc.roundedRect(qx, y + 17, 58, 9, 2, 2, 'FD')
  text(doc, `AI Clichés: ${aiPhrases} Detected`, qx + 4, y + 22.8, {
    size: 7.5,
    style: 'bold',
    color: aiPhrases === 0 ? C.green : C.yellow,
  })
  text(doc, aiPhrases === 0 ? 'Clean Voice' : 'Replace robotic phrases', qx + 54, y + 22.8, {
    size: 6,
    color: aiPhrases === 0 ? C.green : C.yellow,
    align: 'right',
  })

  // Flesch Reading Score
  const flesch = quick.fleschScore || 65
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(qx, y + 28, 58, 9, 2, 2, 'FD')
  text(doc, `Flesch Reading Ease: ${flesch}/100`, qx + 4, y + 33.8, { size: 7.5, style: 'bold', color: C.dark })
  text(doc, flesch >= 60 ? 'Standard / Conversational' : 'Dense prose', qx + 54, y + 33.8, {
    size: 6,
    color: C.gray,
    align: 'right',
  })

  // ── Executive Assessment & Top Priority Fixes ──
  const ai = report.ai
  y += 46

  if (ai?.summary) {
    doc.setFillColor(...C.blueBg)
    doc.setDrawColor(...C.blueBorder)
    doc.roundedRect(M, y, CW, 20, 2.5, 2.5, 'FD')

    text(doc, "HIMANI'S EXECUTIVE ASSESSMENT", M + 5, y + 5, {
      size: 7.5,
      style: 'bold',
      color: C.primary,
    })
    text(doc, ai.summary, M + 5, y + 9.5, { size: 7.5, color: C.dark, maxW: CW - 10 })
    y += 24
  }

  if (ai?.topFixes?.length > 0) {
    const fixes = ai.topFixes.slice(0, 3)
    const fixCardHeight = fixes.length * 5 + 8
    doc.setFillColor(...C.redBg)
    doc.setDrawColor(...C.redBorder)
    doc.roundedRect(M, y, CW, fixCardHeight, 2.5, 2.5, 'FD')

    text(doc, 'CRITICAL ACTION ITEMS BEFORE PUBLISHING', M + 5, y + 5, {
      size: 7.5,
      style: 'bold',
      color: C.red,
    })

    let fy = y + 9.5
    fixes.forEach((fix, idx) => {
      text(doc, `${idx + 1}.  ${fix}`, M + 5, fy, { size: 7, color: C.dark, maxW: CW - 10 })
      fy += 5
    })
    y += fixCardHeight + 4
  }

  // ══════════════════════════════════════════════════════════════════
  // PAGE 2+: 12 PILLARS DETAILED BREAKDOWN
  // ══════════════════════════════════════════════════════════════════
  const categories = report.categories || {}
  const statuses = report.statuses || {}
  const catScores = report.categoryScores || {}

  for (const [catId, catDef] of Object.entries(categories)) {
    const catScore = catScores[catId] || 75
    const items = catDef.items || []
    const aiCat = ai?.categories?.[catId]

    const neededHeight = 15 + items.length * 5 + (aiCat?.issues?.length || aiCat?.suggestions?.length ? 14 : 0)

    // Check page break
    if (y + neededHeight > H - 28) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 4.5)
      y = 15
    }

    // Category Card Container
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, neededHeight - 2, 2.5, 2.5, 'FD')

    // Header bar inside card
    doc.setFillColor(...C.lightGray)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, 8, 2.5, 2.5, 'FD')

    text(doc, `Pillar ${catDef.number}: ${catDef.label}`, M + 4, y + 5.2, {
      size: 8.5,
      style: 'bold',
      color: C.dark,
    })

    // Category score badge
    drawScoreBadge(doc, W - M - 8, y + 4, catScore, 'sm')
    y += 11

    // Checks
    for (const item of items) {
      drawCheckItem(doc, M + 2, y, CW - 4, item.label, statuses[item.id] || 'pending', item.auto)
      y += 5
    }

    // AI Pillar remarks
    if (aiCat && (aiCat.issues?.length > 0 || aiCat.suggestions?.length > 0)) {
      y += 1
      const issues = aiCat.issues?.[0] ? `Issue: ${aiCat.issues[0]}` : null
      const fix = aiCat.suggestions?.[0] ? `Fix: ${aiCat.suggestions[0]}` : null
      const lines = [issues, fix].filter(Boolean)

      if (lines.length > 0) {
        doc.setFillColor(...C.blueBg)
        doc.setDrawColor(...C.blueBorder)
        const rh = lines.length * 3.8 + 3.5
        doc.roundedRect(M + 4, y, CW - 8, rh, 1.5, 1.5, 'FD')

        let ry = y + 3
        for (const line of lines) {
          text(doc, line, M + 6, ry, { size: 6.8, color: C.mid, maxW: CW - 14 })
          ry += 3.8
        }
        y += rh + 2
      }
    }

    y += 4
  }

  // ══════════════════════════════════════════════════════════════════
  // MISSIVE DIGITAL MARKETING & AGENCY CONTACT CARD
  // ══════════════════════════════════════════════════════════════════
  const marketingCardHeight = 44
  if (y + marketingCardHeight > H - 24) {
    doc.addPage()
    gradientBar(doc, 0, 0, W, 4.5)
    y = 15
  }

  y += 4
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.primary)
  doc.roundedRect(M, y, CW, 38, 3, 3, 'FD')

  // Card Header with Logo
  drawMissiveLogo(doc, M + 5, y + 4)

  text(doc, 'Scale Your Organic Traffic & Authority with Editorial Precision', M + 5, y + 18, {
    size: 8.5,
    style: 'bold',
    color: C.dark,
  })

  text(doc, 'Missive Digital delivers high-impact SEO, content marketing strategy, and rigorous editorial governance for ambitious brands.', M + 5, y + 23, {
    size: 7,
    color: C.mid,
    maxW: CW - 10,
  })

  // Contact links
  const contactY = y + 30
  text(doc, '🌐 Website: missivedigital.com', M + 5, contactY, { size: 7, style: 'bold', color: C.primary })
  doc.link(M + 5, contactY - 3, 40, 5, { url: 'https://missivedigital.com/' })

  text(doc, '✉️ Email: contact@missivedigital.com', M + 60, contactY, { size: 7, style: 'bold', color: C.dark })
  doc.link(M + 60, contactY - 3, 50, 5, { url: 'mailto:contact@missivedigital.com' })

  text(doc, '📱 LinkedIn: /company/missive-digital', M + 120, contactY, { size: 7, style: 'bold', color: C.dark })
  doc.link(M + 120, contactY - 3, 50, 5, { url: 'https://www.linkedin.com/company/missive-digital/' })

  // ══════════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ══════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    gradientBar(doc, 0, H - 4.5, W, 4.5)

    text(doc, "Himani Kankaria's Content QA Checklist  \u2022  Missive Digital (missivedigital.com)", M, H - 1.5, {
      size: 6.5,
      style: 'bold',
      color: C.white,
    })

    text(doc, `Page ${i} of ${totalPages}`, W - M, H - 1.5, {
      size: 6.5,
      style: 'bold',
      color: C.white,
      align: 'right',
    })
  }

  return doc
}

export function downloadQaPdf(report, meta = {}) {
  const doc = generateQaPdf(report, meta)
  const name = (meta.title || 'himani-qa-report').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
  doc.save(`himani-content-qa-${name}-${Date.now()}.pdf`)
}
