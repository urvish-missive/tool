import { jsPDF } from 'jspdf'

const BRAND = {
  primary: [12, 129, 243],    // #0C81F3
  secondary: [235, 137, 136], // #EB8988
  dark: [17, 24, 39],         // #111827
  gray: [107, 114, 128],      // #6B7280
  lightGray: [243, 244, 246], // #F3F4F6
  white: [255, 255, 255],
  green: [34, 197, 94],
  yellow: [234, 179, 8],
  red: [239, 68, 68],
}

function getStatusColor(status) {
  if (status === 'pass') return BRAND.green
  if (status === 'fail') return BRAND.red
  return BRAND.gray
}

function getStatusIcon(status) {
  if (status === 'pass') return '✓'
  if (status === 'fail') return '✗'
  return '—'
}

function getScoreColor(score) {
  if (score >= 80) return BRAND.green
  if (score >= 60) return BRAND.yellow
  return BRAND.red
}

function drawGradientHeader(doc, width) {
  // Gradient bar at top
  for (let i = 0; i < width; i++) {
    const ratio = i / width
    const r = Math.round(BRAND.primary[0] + (BRAND.secondary[0] - BRAND.primary[0]) * ratio)
    const g = Math.round(BRAND.primary[1] + (BRAND.secondary[1] - BRAND.primary[1]) * ratio)
    const b = Math.round(BRAND.primary[2] + (BRAND.secondary[2] - BRAND.primary[2]) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(i, 0, 1, 8, 'F')
  }
}

function drawScoreCircle(doc, x, y, radius, score, label) {
  const color = getScoreColor(score)

  // Background circle
  doc.setFillColor(...BRAND.lightGray)
  doc.circle(x, y, radius, 'F')

  // Score arc (simplified as filled circle with color)
  doc.setFillColor(...color)
  doc.circle(x, y, radius - 2, 'F')

  // Score text
  doc.setFillColor(...BRAND.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(String(score), x, y + 1, { align: 'center' })

  // Percent sign
  doc.setFontSize(8)
  doc.text('%', x + 8, y - 2)

  // Label
  doc.setFillColor(...BRAND.dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(label, x, y + radius + 5, { align: 'center' })
}

function drawProgressBar(doc, x, y, width, height, score, label) {
  // Label
  doc.setFillColor(...BRAND.dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(label, x, y - 2)

  // Background bar
  doc.setFillColor(...BRAND.lightGray)
  doc.roundedRect(x, y, width, height, 2, 2, 'F')

  // Filled bar
  const fillWidth = (score / 100) * width
  doc.setFillColor(...getScoreColor(score))
  doc.roundedRect(x, y, fillWidth, height, 2, 2, 'F')

  // Score text
  doc.setFillColor(...BRAND.dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(`${score}%`, x + width + 3, y + height - 1)
}

export function generateQaPdf(report, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 15

  // ── Header gradient ──
  drawGradientHeader(doc, pageWidth)

  // ── Title ──
  y = 18
  doc.setFillColor(...BRAND.dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Content QA Report', margin, y)

  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setFillColor(...BRAND.gray)
  doc.text('Based on Himani Kankaria\'s Content QA Checklist — 42 checks across 7 categories', margin, y)

  // ── Meta info ──
  y += 8
  doc.setFillColor(...BRAND.lightGray)
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F')

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setFillColor(...BRAND.gray)

  const metaItems = []
  if (meta.title) metaItems.push(`Title: ${meta.title}`)
  if (meta.keyword) metaItems.push(`Keyword: ${meta.keyword}`)
  if (meta.wordCount) metaItems.push(`Words: ${meta.wordCount}`)
  if (meta.date) metaItems.push(`Date: ${meta.date}`)

  const metaText = metaItems.join('  •  ')
  doc.text(metaText || 'Content QA Analysis', margin + 4, y + 5)

  if (meta.score !== undefined) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setFillColor(...getScoreColor(meta.score))
    doc.text(`${meta.score}%`, pageWidth - margin - 4, y + 8, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setFillColor(...BRAND.gray)
    doc.text('Overall Score', pageWidth - margin - 4, y + 13, { align: 'right' })
  }

  y += 24

  // ── Overall Score Section ──
  doc.setFillColor(...BRAND.white)
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F')
  doc.setDrawColor(...BRAND.lightGray)
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'S')

  drawScoreCircle(doc, margin + 22, y + 15, 12, meta.score || 0, 'Overall')

  // Category mini-bars
  const cats = report.categoryScores || {}
  const catLabels = {
    objective: 'Objective', audience: 'Audience', seo: 'SEO',
    grammar: 'Grammar', ux: 'UX/Format', brand: 'Brand', final: 'Sign-Off'
  }
  let barX = margin + 45
  const barWidth = (contentWidth - 50) / Object.keys(catLabels).length

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setFillColor(...BRAND.dark)
  doc.text('Category Breakdown', barX, y + 5)

  Object.entries(catLabels).forEach(([key, label], i) => {
    const bx = barX + i * barWidth
    const score = cats[key] || 0
    drawProgressBar(doc, bx, y + 9, barWidth - 6, 3, score, label)
  })

  // Summary line
  y += 34
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setFillColor(...BRAND.gray)
  const passed = meta.passed || 0
  const total = meta.total || 0
  doc.text(`${passed}/${total} checks passed • ${total - passed} items need attention`, margin, y)

  y += 10

  // ── Category Sections ──
  const categories = report.categories || {}
  const statuses = report.statuses || {}
  const aiReport = report.ai || {}

  for (const [catId, catDef] of Object.entries(categories)) {
    const catScore = cats[catId] || 0
    const items = catDef.items || []

    // Check if we need a new page
    const estimatedHeight = 12 + items.length * 5 + 10
    if (y + estimatedHeight > pageHeight - 20) {
      doc.addPage()
      y = 15
      drawGradientHeader(doc, pageWidth)
    }

    // Category header
    doc.setFillColor(...BRAND.lightGray)
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setFillColor(...BRAND.dark)
    doc.text(catDef.label, margin + 4, y + 7)

    // Score badge
    const scoreColor = getScoreColor(catScore)
    doc.setFillColor(...scoreColor)
    doc.roundedRect(pageWidth - margin - 18, y + 1.5, 14, 7, 2, 2, 'F')
    doc.setFillColor(...BRAND.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`${catScore}%`, pageWidth - margin - 11, y + 6.5, { align: 'center' })

    y += 13

    // Items
    for (const item of items) {
      const status = statuses[item.id] || 'pending'
      const statusColor = getStatusColor(status)
      const icon = getStatusIcon(status)

      // Status indicator
      doc.setFillColor(...statusColor)
      doc.circle(margin + 4, y, 2, 'F')
      doc.setFillColor(...BRAND.white)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.text(icon, margin + 4, y + 0.8, { align: 'center' })

      // Item label
      doc.setFont('helvetica', item.auto ? 'normal' : 'normal')
      doc.setFontSize(8)
      doc.setFillColor(...BRAND.dark)
      doc.text(item.label, margin + 9, y + 1)

      // Auto badge
      if (item.auto) {
        doc.setFillColor(...BRAND.primary[0], BRAND.primary[1], BRAND.primary[2])
        doc.roundedRect(pageWidth - margin - 14, y - 1.5, 10, 4, 1, 1, 'F')
        doc.setFillColor(...BRAND.white)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.text('AUTO', pageWidth - margin - 9, y + 1, { align: 'center' })
      }

      y += 5
    }

    // AI insights for this category
    const aiCat = aiReport[catId]
    if (aiCat?.issues?.length > 0 || aiCat?.suggestions?.length > 0) {
      y += 2
      doc.setFillColor(254, 249, 195) // light yellow
      const boxHeight = (aiCat.issues?.length || 0) * 4 + (aiCat.suggestions?.length || 0) * 4 + 6
      doc.roundedRect(margin + 4, y, contentWidth - 8, Math.min(boxHeight, 30), 2, 2, 'F')

      let innerY = y + 4
      if (aiCat.issues?.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setFillColor(...BRAND.red)
        doc.text('Issues:', margin + 7, innerY)
        innerY += 3
        for (const issue of aiCat.issues.slice(0, 3)) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setFillColor(...BRAND.dark)
          doc.text(`• ${issue.substring(0, 80)}`, margin + 9, innerY)
          innerY += 3.5
        }
      }
      if (aiCat.suggestions?.length > 0 && innerY < y + 28) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setFillColor(...BRAND.primary[0], BRAND.primary[1], BRAND.primary[2])
        doc.text('Suggestions:', margin + 7, innerY)
        innerY += 3
        for (const sug of aiCat.suggestions.slice(0, 2)) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          doc.setFillColor(...BRAND.dark)
          doc.text(`→ ${sug.substring(0, 80)}`, margin + 9, innerY)
          innerY += 3.5
        }
      }
      y += Math.min(boxHeight, 30) + 3
    }

    y += 5
  }

  // ── AI Summary Section ──
  if (aiReport.summary || aiReport.topIssues?.length > 0) {
    if (y + 40 > pageHeight - 20) {
      doc.addPage()
      y = 15
    }

    y += 5
    doc.setFillColor(...BRAND.primary[0], BRAND.primary[1], BRAND.primary[2])
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')
    doc.setFillColor(...BRAND.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('AI Assessment', margin + 4, y + 6)

    y += 12

    if (aiReport.summary) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setFillColor(...BRAND.dark)
      const lines = doc.splitTextToSize(aiReport.summary, contentWidth - 8)
      doc.text(lines.slice(0, 4), margin + 4, y)
      y += lines.slice(0, 4).length * 4 + 4
    }

    if (aiReport.topIssues?.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setFillColor(...BRAND.red[0], BRAND.red[1], BRAND.red[2])
      doc.text('Top Issues to Fix', margin + 4, y)
      y += 5

      for (const issue of aiReport.topIssues.slice(0, 5)) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setFillColor(...BRAND.dark)
        doc.text(`⚠ ${issue}`, margin + 6, y)
        y += 4
      }
    }
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    // Gradient footer bar
    for (let j = 0; j < pageWidth; j++) {
      const ratio = j / pageWidth
      const r = Math.round(BRAND.primary[0] + (BRAND.secondary[0] - BRAND.primary[0]) * ratio)
      const g = Math.round(BRAND.primary[1] + (BRAND.secondary[1] - BRAND.primary[1]) * ratio)
      const b = Math.round(BRAND.primary[2] + (BRAND.secondary[2] - BRAND.primary[2]) * ratio)
      doc.setFillColor(r, g, b)
      doc.rect(j, pageHeight - 8, 1, 8, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setFillColor(...BRAND.white)
    doc.text('Content QA Report • Generated by Missive Digital', margin, pageHeight - 3)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' })
  }

  return doc
}

export function downloadQaPdf(report, meta = {}) {
  const doc = generateQaPdf(report, meta)
  const filename = `content-qa-report-${meta.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'report'}-${Date.now()}.pdf`
  doc.save(filename)
}
