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
  green: [22, 163, 74],
  red: [220, 38, 38],
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

function bulletList(doc, items, M, CW, y, W, H, color) {
  for (const item of (items || []).slice(0, 8)) {
    const label = typeof item === 'string' ? item : JSON.stringify(item)
    const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.2, W, H)
      text(doc, line, M + 4, y, { size: 8.5, color })
      y += 4.2
    }
  }
  return y
}

/**
 * Business Competitor Analytics PDF — executive summary, company profile,
 * market position, and SWOT highlights, in Missive's branded report style.
 */
export function generateBusinessCompetitorPdf(result) {
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
  text(doc, 'Business Competitor Intelligence Report', M, y, { size: 15, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, result.companyName || result.competitorUrl || 'Unknown Company', M, y, {
    size: 10, color: C.primary, style: 'bold',
  })
  y += 8

  if (result.executiveSummary) {
    const lines = doc.splitTextToSize(result.executiveSummary, CW - 8)
    const boxH = lines.length * 4.2 + 8
    doc.setFillColor(...C.blueBg)
    doc.setDrawColor(...C.blueBorder)
    doc.roundedRect(M, y, CW, boxH, 2.5, 2.5, 'FD')
    let sy = y + 5.5
    for (const line of lines) {
      text(doc, line, M + 4, sy, { size: 8.5, color: C.mid })
      sy += 4.2
    }
    y += boxH + 6
  }

  const profile = result.companyProfile
  if (profile) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'COMPANY PROFILE', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 5.5
    const fields = [
      ['Founded', profile.founded], ['Headquarters', profile.headquarters],
      ['Employees', profile.employeeCount], ['Type', profile.companyType],
    ].filter(([, v]) => v)
    for (const [label, value] of fields) {
      y = ensureSpace(doc, y, 4.2, W, H)
      text(doc, `${label}: `, M + 4, y, { size: 8.5, style: 'bold', color: C.dark })
      text(doc, String(value), M + 4 + doc.getTextWidth(`${label}: `), y, { size: 8.5, color: C.mid })
      y += 4.2
    }
    y += 4
  }

  const market = result.marketPosition
  if (market?.positioning || market?.competitiveAdvantage) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'MARKET POSITION', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 5.5
    for (const val of [market.positioning, market.competitiveAdvantage].filter(Boolean)) {
      const lines = doc.splitTextToSize(val, CW - 4)
      for (const line of lines) {
        y = ensureSpace(doc, y, 4.2, W, H)
        text(doc, line, M, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
    y += 4
  }

  if (result.strengths?.length) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'STRENGTHS', M, y, { size: 9, style: 'bold', color: C.green })
    y += 5.5
    y = bulletList(doc, result.strengths, M, CW, y, W, H, C.mid) + 3
  }

  if (result.weaknesses?.length) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'WEAKNESSES', M, y, { size: 9, style: 'bold', color: C.red })
    y += 5.5
    y = bulletList(doc, result.weaknesses, M, CW, y, W, H, C.mid) + 3
  }

  if (result.opportunities?.length) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'OPPORTUNITIES TO COMPETE', M, y, { size: 9, style: 'bold', color: C.primary })
    y += 5.5
    y = bulletList(doc, result.opportunities, M, CW, y, W, H, C.mid)
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
