import { jsPDF } from 'jspdf'
import { MISSIVE_LOGO_PNG } from './missiveLogoBase64.js'

const C = {
  primary: [12, 129, 243],
  secondary: [235, 137, 136],
  dark: [15, 23, 42],
  mid: [51, 65, 85],
  gray: [100, 116, 139],
  lightGray: [248, 250, 252],
  border: [226, 232, 240],
  white: [255, 255, 255],
  blueBg: [239, 246, 255],
  blueBorder: [191, 219, 254],
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

function drawLogo(doc, x, y, targetWidth = 40) {
  const aspect = 430 / 98
  const targetHeight = targetWidth / aspect
  try {
    if (MISSIVE_LOGO_PNG) {
      doc.addImage(MISSIVE_LOGO_PNG, 'PNG', x, y, targetWidth, targetHeight)
      return
    }
  } catch (e) {
    console.warn('Logo image render fallback:', e)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.dark)
  doc.text('MISSIVE', x, y + 5.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.primary)
  doc.text('DIGITAL', x + 19, y + 5.5)
}

function sectionHeader(doc, label, M, y) {
  text(doc, label.toUpperCase(), M, y, { size: 9.5, style: 'bold', color: C.primary })
  return y + 5.5
}

function ensureSpace(doc, y, needed, M, W, H) {
  if (y + needed > H - 24) {
    doc.addPage()
    gradientBar(doc, 0, 0, W, 4.5)
    return 14
  }
  return y
}

/**
 * Competitor Analysis PDF — outrank playbook, content gaps, keyword
 * opportunities, and backlink angles, in Missive's branded report style.
 */
export function generateCompetitorAnalysisPdf(result) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 14
  const CW = W - M * 2
  let y = 0

  gradientBar(doc, 0, 0, W, 4.5)
  y = 11
  drawLogo(doc, M, y, 42)

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(W - M - 38, y, 38, 9, 2, 2, 'FD')
  text(doc, `Date: ${dateStr}`, W - M - 19, y + 5.8, { size: 8, color: C.mid, align: 'center', style: 'bold' })

  y = 27
  text(doc, 'Competitor Analysis Report', M, y, { size: 17, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, result.competitorUrl || 'Unknown competitor', M, y, { size: 10, color: C.primary, style: 'bold' })
  y += 6

  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 12, 2.5, 2.5, 'FD')
  text(doc, `Your site: ${result.yourUrl || 'Not provided'}`, M + 4, y + 7.2, { size: 8, color: C.mid })
  text(doc, result.targetKeywords ? `Keywords: ${result.targetKeywords}` : '', M + CW - 4, y + 7.2, {
    size: 8, color: C.mid, align: 'right',
  })
  y += 18

  const playbook = result.outrankPlaybook || []
  if (playbook.length) {
    y = sectionHeader(doc, `10x Outrank Playbook (${playbook.length})`, M, y)
    for (const item of playbook.slice(0, 8)) {
      const titleLines = doc.splitTextToSize(item.title || item.action || 'Action item', CW - 12)
      const descLines = doc.splitTextToSize(item.description || item.detail || '', CW - 12)
      const blockH = 6 + titleLines.length * 5 + descLines.length * 4 + 6
      y = ensureSpace(doc, y, blockH, M, W, H)
      doc.setFillColor(...C.white)
      doc.setDrawColor(...C.border)
      doc.roundedRect(M, y, CW, blockH, 2.5, 2.5, 'FD')
      y += 5
      for (const line of titleLines) {
        text(doc, line, M + 4, y, { size: 9.5, style: 'bold', color: C.dark })
        y += 5
      }
      for (const line of descLines) {
        text(doc, line, M + 4, y, { size: 8, color: C.mid })
        y += 4
      }
      y += 6
    }
    y += 3
  }

  const gaps = result.contentGaps || []
  if (gaps.length) {
    y = ensureSpace(doc, y, 12, M, W, H)
    y = sectionHeader(doc, `Content Gaps (${gaps.length})`, M, y)
    for (const gap of gaps.slice(0, 10)) {
      const label = typeof gap === 'string' ? gap : gap.title || gap.gap || JSON.stringify(gap)
      const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
      y = ensureSpace(doc, y, lines.length * 4.2 + 2, M, W, H)
      for (const line of lines) {
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
    y += 6
  }

  const keywordOpps = result.keywordOpportunities || []
  if (keywordOpps.length) {
    y = ensureSpace(doc, y, 12, M, W, H)
    y = sectionHeader(doc, `Keyword Opportunities (${keywordOpps.length})`, M, y)
    for (const kw of keywordOpps.slice(0, 12)) {
      const label = typeof kw === 'string' ? kw : kw.keyword || kw.title || JSON.stringify(kw)
      const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
      y = ensureSpace(doc, y, lines.length * 4.2 + 2, M, W, H)
      for (const line of lines) {
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
    y += 6
  }

  const backlinks = result.backlinkAngles || []
  if (backlinks.length) {
    y = ensureSpace(doc, y, 12, M, W, H)
    y = sectionHeader(doc, `Backlink Angles (${backlinks.length})`, M, y)
    for (const angle of backlinks.slice(0, 8)) {
      const label = typeof angle === 'string' ? angle : angle.title || angle.angle || JSON.stringify(angle)
      const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
      y = ensureSpace(doc, y, lines.length * 4.2 + 2, M, W, H)
      for (const line of lines) {
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    gradientBar(doc, 0, H - 4.5, W, 4.5)
    text(doc, 'Missive Digital  •  missivedigital.com', M, H - 1.5, { size: 7, style: 'bold', color: C.white })
    text(doc, `Page ${i} of ${totalPages}`, W - M, H - 1.5, { size: 7, style: 'bold', color: C.white, align: 'right' })
  }

  return doc
}
