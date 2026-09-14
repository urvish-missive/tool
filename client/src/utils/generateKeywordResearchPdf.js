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

function ensureSpace(doc, y, needed, W, H) {
  if (y + needed > H - 24) {
    doc.addPage()
    gradientBar(doc, 0, 0, W, 4.5)
    return 14
  }
  return y
}

/**
 * Keyword Research PDF — keyword table with intent, type, and opportunity
 * score, in Missive's branded report style.
 */
export function generateKeywordResearchPdf(report) {
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
  text(doc, 'Keyword Research Report', M, y, { size: 17, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, report.seedKeyword || report.websiteUrl || 'Untitled Research', M, y, {
    size: 10, color: C.primary, style: 'bold',
  })
  y += 6

  const keywords = report.keywords || []
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 12, 2.5, 2.5, 'FD')
  text(doc, `Region: ${report.detectedRegion || 'Global'}`, M + 4, y + 7.2, { size: 8, color: C.mid })
  text(doc, `${keywords.length} keyword(s) found`, M + CW - 4, y + 7.2, { size: 8, color: C.mid, align: 'right' })
  y += 18

  const colW = { keyword: CW * 0.42, intent: CW * 0.18, type: CW * 0.2, score: CW * 0.2 }
  y = ensureSpace(doc, y, 10, W, H)
  doc.setFillColor(...C.blueBg)
  doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F')
  text(doc, 'KEYWORD', M + 3, y + 5.5, { size: 7, style: 'bold', color: C.primary })
  text(doc, 'INTENT', M + colW.keyword + 3, y + 5.5, { size: 7, style: 'bold', color: C.primary })
  text(doc, 'TYPE', M + colW.keyword + colW.intent + 3, y + 5.5, { size: 7, style: 'bold', color: C.primary })
  text(doc, 'SCORE', M + CW - 3, y + 5.5, { size: 7, style: 'bold', color: C.primary, align: 'right' })
  y += 8

  for (const kw of keywords.slice(0, 80)) {
    const kwLines = doc.splitTextToSize(kw.keyword || '', colW.keyword - 6)
    const rowH = Math.max(6, kwLines.length * 4.2 + 2)
    y = ensureSpace(doc, y, rowH, W, H)
    doc.setDrawColor(...C.border)
    doc.line(M, y + rowH, M + CW, y + rowH)
    let ky = y + 4.2
    for (const line of kwLines) {
      text(doc, line, M + 3, ky, { size: 7.5, color: C.dark })
      ky += 4.2
    }
    text(doc, kw.intent || '', M + colW.keyword + 3, y + 4.2, { size: 7.5, color: C.mid })
    text(doc, kw.type || '', M + colW.keyword + colW.intent + 3, y + 4.2, { size: 7.5, color: C.mid })
    text(doc, kw.opportunityScore !== undefined ? String(kw.opportunityScore) : '', M + CW - 3, y + 4.2, {
      size: 7.5, style: 'bold', color: C.primary, align: 'right',
    })
    y += rowH
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
