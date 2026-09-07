import { jsPDF } from 'jspdf'
import { MISSIVE_LOGO_PNG } from './missiveLogoBase64.js'

const C = {
  primary: [12, 129, 243], // #0C81F3 (Missive Blue)
  primaryDark: [9, 105, 195],
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
  yellow: [180, 83, 9], // #B45309 Amber
  yellowBg: [255, 251, 235], // #FFFBEB
  yellowBorder: [253, 230, 138],
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
    return lines
  }
  doc.text(String(str || ''), x, y, { align })
  return [String(str || '')]
}

/**
 * Draw Official Missive Digital Logo
 */
function drawMissiveLogo(doc, x, y, targetWidth = 40) {
  const aspect = 430 / 98
  const targetHeight = targetWidth / aspect
  try {
    if (MISSIVE_LOGO_PNG) {
      doc.addImage(MISSIVE_LOGO_PNG, 'PNG', x, y, targetWidth, targetHeight)
      return { w: targetWidth, h: targetHeight }
    }
  } catch (e) {
    console.warn('Logo image render fallback:', e)
  }

  // Fallback crisp vector mark if image fails
  doc.setFillColor(...C.primary)
  doc.roundedRect(x, y, 9, 9, 2, 2, 'F')
  doc.setFillColor(...C.secondary)
  doc.circle(x + 7, y + 2, 1.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.white)
  doc.text('M', x + 4.5, y + 6.5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.dark)
  doc.text('MISSIVE', x + 12, y + 5.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primary)
  doc.text('DIGITAL', x + 31, y + 5.5)
  doc.setFontSize(6.5)
  doc.setTextColor(...C.gray)
  doc.text('Content & SEO Strategy Agency', x + 12, y + 8.5)

  return { w: 45, h: 9.5 }
}

/**
 * Draw Clean Vector Checkmark Badge (Pass)
 */
function drawCheckBadge(doc, cx, cy, r = 2.8) {
  doc.setFillColor(...C.greenBg)
  doc.setDrawColor(...C.greenBorder)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, r, 'FD')

  // Checkmark lines
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.55)
  doc.line(cx - 1.2, cy, cx - 0.3, cy + 1.1)
  doc.line(cx - 0.3, cy + 1.1, cx + 1.3, cy - 1.0)
}

/**
 * Draw Clean Vector Warning Badge (Needs Action / Pending)
 */
function drawWarningBadge(doc, cx, cy, r = 2.8) {
  doc.setFillColor(...C.yellowBg)
  doc.setDrawColor(...C.yellowBorder)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, r, 'FD')

  // Exclamation stem and dot
  doc.setDrawColor(...C.yellow)
  doc.setLineWidth(0.65)
  doc.line(cx, cy - 1.3, cx, cy + 0.3)
  doc.setFillColor(...C.yellow)
  doc.circle(cx, cy + 1.2, 0.38, 'F')
}

/**
 * Draw Clean Vector Fail Badge (Fail)
 */
function drawFailBadge(doc, cx, cy, r = 2.8) {
  doc.setFillColor(...C.redBg)
  doc.setDrawColor(...C.redBorder)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, r, 'FD')

  // X lines
  doc.setDrawColor(...C.red)
  doc.setLineWidth(0.55)
  doc.line(cx - 1.1, cy - 1.1, cx + 1.1, cy + 1.1)
  doc.line(cx + 1.1, cy - 1.1, cx - 1.1, cy + 1.1)
}

/**
 * Draw Clean Score Badge Gauge
 */
function drawScoreBadge(doc, x, y, score, size = 'lg') {
  const r = size === 'lg' ? 16 : size === 'md' ? 10 : 6.5
  const col = scoreColor(score)

  // Outer ring
  doc.setFillColor(...col)
  doc.circle(x, y, r, 'F')

  // Inner white circle
  doc.setFillColor(...C.white)
  doc.circle(x, y, r - 2.2, 'F')

  // Score number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size === 'lg' ? 17 : size === 'md' ? 10 : 7.5)
  doc.setTextColor(...col)
  doc.text(String(score), x, y + (size === 'lg' ? 2.5 : size === 'md' ? 1.5 : 1.2), {
    align: 'center',
  })
}

/**
 * Draw Check Item Row
 */
function drawCheckItem(doc, x, y, w, label, status, isAuto) {
  const isPass = status === 'pass'
  const isFail = status === 'fail'

  // Vector status badge
  if (isPass) {
    drawCheckBadge(doc, x + 4, y, 2.7)
  } else if (isFail) {
    drawFailBadge(doc, x + 4, y, 2.7)
  } else {
    drawWarningBadge(doc, x + 4, y, 2.7)
  }

  // Label text with proper font size (8.5pt)
  doc.setFont('helvetica', isFail ? 'bold' : 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...(isFail ? C.dark : C.mid))
  doc.text(label, x + 9, y + 1.2, { maxWidth: w - 26 })

  // Auto badge
  if (isAuto) {
    doc.setFillColor(...C.purpleBg)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x + w - 17, y - 2.2, 14, 4.6, 1, 1, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(...C.purple)
    doc.text('AUTO', x + w - 10, y + 0.9, { align: 'center' })
  }
}

/**
 * Main Content QA PDF Generator
 */
export function generateQaPdf(report, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 14
  const CW = W - M * 2 // 182mm
  let y = 0

  // ══════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE AUDIT & SCORECARD
  // ══════════════════════════════════════════════════════════════════
  gradientBar(doc, 0, 0, W, 4.5)

  // Top Header: Real Logo (Left) + Date Badge (Right)
  y = 11
  drawMissiveLogo(doc, M, y, 42)

  const dateStr =
    meta.date ||
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(W - M - 38, y, 38, 9, 2, 2, 'FD')
  text(doc, `Date: ${dateStr}`, W - M - 19, y + 5.8, {
    size: 8,
    color: C.mid,
    align: 'center',
    style: 'bold',
  })

  // Title Section
  y = 27
  text(doc, "Himani Kankaria's Content QA Audit", M, y, {
    size: 17,
    style: 'bold',
    color: C.dark,
  })
  y += 5.8
  text(doc, '12-Pillar Editorial Governance, Quality Control & AI Detection Report', M, y, {
    size: 9.5,
    color: C.primary,
    style: 'bold',
  })
  y += 4.5
  text(
    doc,
    'Evaluates tone, E-E-A-T credibility, structure, scannability, zero em-dashes, and conversational cadence.',
    M,
    y,
    {
      size: 8,
      color: C.gray,
    }
  )

  // ── Document Metadata Card ──
  y += 6
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, CW, 15, 2.5, 2.5, 'FD')

  const docTitle = (meta.title || 'Audited Content Piece').substring(0, 52)
  const docKeyword = (meta.keyword || 'Not specified').substring(0, 32)
  const docAudience = (meta.targetAudience || 'General Audience').substring(0, 32)
  const docPlatform = (meta.platform || 'Website / Blog').toUpperCase()

  text(doc, `Title:`, M + 4, y + 5.2, { size: 7.5, style: 'bold', color: C.gray })
  text(doc, docTitle, M + 16, y + 5.2, { size: 8.5, style: 'bold', color: C.dark })

  text(doc, `Keyword:`, M + 4, y + 10.8, { size: 7.5, style: 'bold', color: C.gray })
  text(doc, docKeyword, M + 19, y + 10.8, { size: 8, color: C.mid })

  text(doc, `Platform:`, M + 105, y + 5.2, { size: 7.5, style: 'bold', color: C.gray })
  text(doc, docPlatform, M + 122, y + 5.2, { size: 8.5, color: C.primary, style: 'bold' })

  text(doc, `Audience:`, M + 105, y + 10.8, { size: 7.5, style: 'bold', color: C.gray })
  text(doc, docAudience, M + 122, y + 10.8, { size: 8, color: C.mid })

  // ── Big Executive KPI Scorecard ──
  y += 20
  const kpiCardHeight = 44
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.4)
  doc.roundedRect(M, y, CW, kpiCardHeight, 3, 3, 'FD')

  // Left Score Circle Gauge
  const overallScore = meta.score || report.overall || 75
  drawScoreBadge(doc, M + 22, y + 18, overallScore, 'lg')
  text(doc, 'The Himani Score', M + 22, y + 38, {
    size: 8.5,
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

  const readCol =
    overallScore >= 85
      ? C.green
      : overallScore >= 70
        ? C.primary
        : overallScore >= 50
          ? C.yellow
          : C.red
  const readBg =
    overallScore >= 85
      ? C.greenBg
      : overallScore >= 70
        ? C.blueBg
        : overallScore >= 50
          ? C.yellowBg
          : C.redBg
  const readBorder =
    overallScore >= 85
      ? C.greenBorder
      : overallScore >= 70
        ? C.blueBorder
        : overallScore >= 50
          ? C.yellowBorder
          : C.redBorder

  doc.setFillColor(...readBg)
  doc.setDrawColor(...readBorder)
  doc.setLineWidth(0.3)
  doc.roundedRect(M + 46, y + 7, 64, 7.5, 2, 2, 'FD')
  text(doc, `STATUS: ${readiness}`, M + 78, y + 12, {
    size: 7,
    style: 'bold',
    color: readCol,
    align: 'center',
  })

  // Middle check counters with clean vector icons
  const passed = meta.passed || report.passed || 0
  const total = meta.total || report.total || 34
  const failed = Math.max(0, total - passed)

  // Passed row
  drawCheckBadge(doc, M + 49, y + 20.5, 2.5)
  text(doc, `${passed} Checks Passed`, M + 54, y + 21.8, {
    size: 8.5,
    style: 'bold',
    color: C.green,
  })

  // Action needed row
  drawWarningBadge(doc, M + 49, y + 27.5, 2.5)
  text(doc, `${failed} Items Need Action`, M + 54, y + 28.8, {
    size: 8.5,
    style: 'bold',
    color: failed > 0 ? C.red : C.gray,
  })

  // Total checks row
  doc.setFillColor(...C.gray)
  doc.circle(M + 49, y + 34.5, 1.2, 'F')
  text(doc, `${total} Total Standardized Checks`, M + 54, y + 35.8, { size: 8, color: C.mid })

  // Right Pillar Metrics Cards (Em-dashes, AI clichés, Flesch)
  // Designed with stacked rows to eliminate horizontal text collision
  const quick = report.quickStats || {}
  const qx = M + 116
  const qw = 62

  // Em-dashes Card
  const emCount = quick.emDashesCount || 0
  doc.setFillColor(...(emCount === 0 ? C.greenBg : C.redBg))
  doc.setDrawColor(...(emCount === 0 ? C.greenBorder : C.redBorder))
  doc.setLineWidth(0.3)
  doc.roundedRect(qx, y + 6, qw, 10, 2, 2, 'FD')
  text(doc, `Em Dashes: ${emCount}`, qx + 4, y + 10.8, {
    size: 7.5,
    style: 'bold',
    color: emCount === 0 ? C.green : C.red,
  })
  text(
    doc,
    emCount === 0 ? 'Goal Met (Zero em-dashes)' : 'Action: Remove all and replace with commas',
    qx + 4,
    y + 14.5,
    {
      size: 6.2,
      color: emCount === 0 ? C.green : C.red,
    }
  )

  // AI Clichés Card
  const aiPhrases = quick.aiPhrasesCount || 0
  doc.setFillColor(...(aiPhrases === 0 ? C.greenBg : C.yellowBg))
  doc.setDrawColor(...(aiPhrases === 0 ? C.greenBorder : C.yellowBorder))
  doc.setLineWidth(0.3)
  doc.roundedRect(qx, y + 18, qw, 10, 2, 2, 'FD')
  text(doc, `AI Clichés: ${aiPhrases} Detected`, qx + 4, y + 22.8, {
    size: 7.5,
    style: 'bold',
    color: aiPhrases === 0 ? C.green : C.yellow,
  })
  text(
    doc,
    aiPhrases === 0
      ? 'Clean, authentic human cadence'
      : 'Replace robotic phrases with specific observations',
    qx + 4,
    y + 26.5,
    {
      size: 6.2,
      color: aiPhrases === 0 ? C.green : C.yellow,
    }
  )

  // Flesch Reading Score
  const flesch = quick.fleschScore || 65
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(qx, y + 30, qw, 10, 2, 2, 'FD')
  text(doc, `Flesch Reading Ease: ${flesch}/100`, qx + 4, y + 34.8, {
    size: 7.5,
    style: 'bold',
    color: C.dark,
  })
  text(
    doc,
    flesch >= 60 ? 'Standard / Conversational tone' : 'Dense prose — shorten long sentences',
    qx + 4,
    y + 38.5,
    {
      size: 6.2,
      color: C.gray,
    }
  )

  // ── Executive Assessment & Top Priority Fixes ──
  const ai = report.ai
  y += kpiCardHeight + 5

  // Executive Assessment Box with dynamic text measurement
  if (ai?.summary) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const summaryLines = doc.splitTextToSize(ai.summary, CW - 12)
    const cardH = 7.5 + summaryLines.length * 4.2 + 4

    doc.setFillColor(...C.blueBg)
    doc.setDrawColor(...C.blueBorder)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, cardH, 2.5, 2.5, 'FD')

    text(doc, "HIMANI'S EXECUTIVE ASSESSMENT", M + 5, y + 5.5, {
      size: 8,
      style: 'bold',
      color: C.primary,
    })

    let sy = y + 10
    for (const line of summaryLines) {
      text(doc, line, M + 5, sy, { size: 8, color: C.dark })
      sy += 4.2
    }

    y += cardH + 4
  }

  // Critical Action Items with dynamic text measurement
  if (ai?.topFixes?.length > 0) {
    const fixes = ai.topFixes.slice(0, 3)

    // Pre-calculate wrapped lines for every fix item
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    const measuredFixes = fixes.map((fixText, idx) => {
      return doc.splitTextToSize(`${idx + 1}.  ${fixText}`, CW - 12)
    })

    const totalFixTextLines = measuredFixes.reduce((acc, l) => acc + l.length, 0)
    const fixCardHeight = 7.5 + totalFixTextLines * 4.2 + measuredFixes.length * 1.5 + 4

    // Check if fits on Page 1, else start cleanly on Page 2
    if (y + fixCardHeight > H - 24) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 4.5)
      y = 14
    }

    doc.setFillColor(...C.redBg)
    doc.setDrawColor(...C.redBorder)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, fixCardHeight, 2.5, 2.5, 'FD')

    text(doc, 'CRITICAL ACTION ITEMS BEFORE PUBLISHING', M + 5, y + 5.5, {
      size: 8,
      style: 'bold',
      color: C.red,
    })

    let fy = y + 10.2
    for (const lines of measuredFixes) {
      for (const line of lines) {
        text(doc, line, M + 5, fy, { size: 7.8, color: C.dark })
        fy += 4.2
      }
      fy += 1.8 // Gap between distinct action items
    }

    y += fixCardHeight + 5
  }

  // ══════════════════════════════════════════════════════════════════
  // 12 PILLARS DETAILED BREAKDOWN (Pages 1, 2, 3+)
  // ══════════════════════════════════════════════════════════════════
  const categories = report.categories || {}
  const statuses = report.statuses || {}
  const catScores = report.categoryScores || {}

  for (const [catId, catDef] of Object.entries(categories)) {
    const catScore = catScores[catId] || 75
    const items = catDef.items || []
    const aiCat = ai?.categories?.[catId]

    // Pre-measure Issue and Fix lines to prevent ANY overlap
    let issueLines = []
    let fixLines = []
    if (aiCat?.issues?.[0]) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      issueLines = doc.splitTextToSize(`Issue: ${aiCat.issues[0]}`, CW - 16)
    }
    if (aiCat?.suggestions?.[0]) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      fixLines = doc.splitTextToSize(`Fix: ${aiCat.suggestions[0]}`, CW - 16)
    }

    const hasRemarks = issueLines.length > 0 || fixLines.length > 0
    let remarkBoxHeight = 0
    if (hasRemarks) {
      const lineCount = issueLines.length + fixLines.length
      const gapBetween = issueLines.length > 0 && fixLines.length > 0 ? 2 : 0
      remarkBoxHeight = lineCount * 4.0 + gapBetween + 5
    }

    const itemsHeight = items.length * 5.2
    const neededHeight = 11 + itemsHeight + (hasRemarks ? remarkBoxHeight + 3 : 0) + 3

    // Check page break
    if (y + neededHeight > H - 24) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 4.5)
      y = 14
    }

    // Outer Card Container
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, neededHeight, 2.5, 2.5, 'FD')

    // Header bar inside card
    doc.setFillColor(...C.lightGray)
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, CW, 8.5, 2.5, 2.5, 'FD')

    text(doc, `Pillar ${catDef.number}: ${catDef.label}`, M + 4, y + 5.6, {
      size: 9,
      style: 'bold',
      color: C.dark,
    })

    // Category Score Badge
    drawScoreBadge(doc, W - M - 9, y + 4.25, catScore, 'sm')
    y += 12

    // Check items
    for (const item of items) {
      drawCheckItem(doc, M + 2, y, CW - 4, item.label, statuses[item.id] || 'pending', item.auto)
      y += 5.2
    }

    // AI Pillar remarks (Zero overlap layout)
    if (hasRemarks) {
      y += 1.5
      doc.setFillColor(...C.blueBg)
      doc.setDrawColor(...C.blueBorder)
      doc.setLineWidth(0.3)
      doc.roundedRect(M + 4, y, CW - 8, remarkBoxHeight, 1.5, 1.5, 'FD')

      let ry = y + 3.8

      // Draw issue lines
      if (issueLines.length > 0) {
        for (const line of issueLines) {
          text(doc, line, M + 6, ry, { size: 7.5, color: C.dark })
          ry += 4.0
        }
        if (fixLines.length > 0) {
          ry += 1.8 // Distinct vertical spacing before fix
        }
      }

      // Draw fix lines
      if (fixLines.length > 0) {
        for (const line of fixLines) {
          text(doc, line, M + 6, ry, { size: 7.5, color: C.mid })
          ry += 4.0
        }
      }

      y += remarkBoxHeight + 2
    }

    y += 5
  }

  // ══════════════════════════════════════════════════════════════════
  // MISSIVE DIGITAL MARKETING & AGENCY CONTACT CARD
  // ══════════════════════════════════════════════════════════════════
  const marketingCardHeight = 42
  if (y + marketingCardHeight > H - 24) {
    doc.addPage()
    gradientBar(doc, 0, 0, W, 4.5)
    y = 14
  }

  y += 3
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.primary)
  doc.setLineWidth(0.4)
  doc.roundedRect(M, y, CW, 38, 3, 3, 'FD')

  // Card Header with Real Logo
  drawMissiveLogo(doc, M + 5, y + 4, 36)

  text(doc, 'Scale Your Organic Traffic & Authority with Editorial Precision', M + 5, y + 18, {
    size: 9.5,
    style: 'bold',
    color: C.dark,
  })

  text(
    doc,
    'Missive Digital delivers high-impact SEO, content marketing strategy, and rigorous editorial governance for ambitious brands.',
    M + 5,
    y + 23.5,
    {
      size: 7.8,
      color: C.mid,
      maxW: CW - 10,
    }
  )

  // Contact badges with clean vector icons / labels (no broken emojis)
  const contactY = y + 31

  // Website Pill
  doc.setFillColor(...C.blueBg)
  doc.setDrawColor(...C.blueBorder)
  doc.setLineWidth(0.3)
  doc.roundedRect(M + 5, contactY - 3.5, 48, 6.5, 1.5, 1.5, 'FD')
  text(doc, 'WEB', M + 7.5, contactY + 0.8, { size: 6, style: 'bold', color: C.primary })
  text(doc, 'missivedigital.com', M + 16, contactY + 0.8, {
    size: 7.5,
    style: 'bold',
    color: C.primaryDark,
  })
  doc.link(M + 5, contactY - 3.5, 48, 6.5, { url: 'https://missivedigital.com/' })

  // Email Pill
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M + 58, contactY - 3.5, 58, 6.5, 1.5, 1.5, 'FD')
  text(doc, 'EMAIL', M + 60.5, contactY + 0.8, { size: 6, style: 'bold', color: C.gray })
  text(doc, 'hello@missivedigital.com', M + 72, contactY + 0.8, {
    size: 7.5,
    style: 'bold',
    color: C.dark,
  })
  doc.link(M + 58, contactY - 3.5, 58, 6.5, { url: 'mailto:hello@missivedigital.com' })

  // LinkedIn Pill
  doc.setFillColor(...C.white)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M + 121, contactY - 3.5, 56, 6.5, 1.5, 1.5, 'FD')
  // LinkedIn mini badge
  doc.setFillColor(10, 102, 194)
  doc.roundedRect(M + 123, contactY - 2.2, 4.2, 4.2, 0.8, 0.8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  doc.setTextColor(...C.white)
  doc.text('in', M + 125.1, contactY + 0.8, { align: 'center' })

  text(doc, '/company/missive-digital', M + 129.5, contactY + 0.8, {
    size: 7.5,
    style: 'bold',
    color: C.dark,
  })
  doc.link(M + 121, contactY - 3.5, 56, 6.5, {
    url: 'https://www.linkedin.com/company/missive-digital/',
  })

  // ══════════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ══════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    gradientBar(doc, 0, H - 4.5, W, 4.5)

    text(
      doc,
      "Himani Kankaria's Content QA Checklist  \u2022  Missive Digital (missivedigital.com)",
      M,
      H - 1.5,
      {
        size: 7,
        style: 'bold',
        color: C.white,
      }
    )

    text(doc, `Page ${i} of ${totalPages}`, W - M, H - 1.5, {
      size: 7,
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
