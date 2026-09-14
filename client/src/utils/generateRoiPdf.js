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

function fmt(n, currencySymbol) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'N/A'
  return `${currencySymbol}${Math.round(n).toLocaleString()}`
}

const CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€', INR: '₹', AUD: 'A$', CAD: 'C$', AED: 'د.إ' }
const SCENARIO_LABELS = { conservative: 'Conservative', moderate: 'Moderate', aggressive: 'Aggressive' }

/**
 * SEO ROI Calculator PDF — conservative/moderate/aggressive projections and
 * AI narrative, in Missive's branded report style.
 */
export function generateRoiPdf(payload, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 14
  const CW = W - M * 2
  let y = 0
  const sym = CURRENCY_SYMBOLS[meta.currency] || '$'

  gradientBar(doc, 0, 0, W, 4.5)
  y = 11
  drawLogo(doc, M, y, 42)

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(W - M - 38, y, 38, 9, 2, 2, 'FD')
  text(doc, `Date: ${dateStr}`, W - M - 19, y + 5.8, { size: 8, color: C.mid, align: 'center', style: 'bold' })

  y = 27
  text(doc, 'SEO ROI Projection Report', M, y, { size: 17, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, `${meta.campaignMonths || 12}-month projection`, M, y, { size: 10, color: C.primary, style: 'bold' })
  y += 8

  const scenarios = payload.results || {}
  const colW = CW / 3
  const keys = ['conservative', 'moderate', 'aggressive']
  let maxBoxH = 0
  const startY = y
  keys.forEach((key, i) => {
    const s = scenarios[key]?.summary
    if (!s) return
    const x = M + colW * i
    const lines = [
      ['Total Revenue', fmt(s.totalRevenue, sym)],
      ['Net Return', fmt(s.netReturn, sym)],
      ['ROI', s.roi !== undefined ? `${Math.round(s.roi)}%` : 'N/A'],
    ]
    const boxH = 12 + lines.length * 5.5
    doc.setFillColor(key === 'moderate' ? C.blueBg[0] : C.white, key === 'moderate' ? C.blueBg[1] : C.white, key === 'moderate' ? C.blueBg[2] : C.white)
    doc.setDrawColor(...(key === 'moderate' ? C.blueBorder : C.border))
    doc.roundedRect(x, y, colW - 4, boxH, 2.5, 2.5, 'FD')
    text(doc, SCENARIO_LABELS[key].toUpperCase(), x + 4, y + 6, { size: 7, style: 'bold', color: C.primary })
    let ly = y + 12
    for (const [label, value] of lines) {
      text(doc, label, x + 4, ly, { size: 6.5, color: C.gray })
      text(doc, value, x + colW - 8, ly, { size: 8, style: 'bold', color: C.dark, align: 'right' })
      ly += 5.5
    }
    maxBoxH = Math.max(maxBoxH, boxH)
  })
  y = startY + maxBoxH + 8

  const insights = payload.aiInsights
  if (insights) {
    const summaryText = typeof insights === 'string' ? insights : insights.summary || insights.narrative || ''
    if (summaryText) {
      text(doc, 'STRATEGIC INSIGHT', M, y, { size: 9.5, style: 'bold', color: C.primary })
      y += 5.5
      const lines = doc.splitTextToSize(summaryText, CW - 4)
      for (const line of lines) {
        if (y > H - 30) {
          doc.addPage()
          gradientBar(doc, 0, 0, W, 4.5)
          y = 14
        }
        text(doc, line, M, y, { size: 8.5, color: C.mid })
        y += 4.5
      }
      y += 4
    }

    const levers = insights.growthLevers || insights.levers || []
    if (levers.length) {
      if (y > H - 40) {
        doc.addPage()
        gradientBar(doc, 0, 0, W, 4.5)
        y = 14
      }
      text(doc, 'GROWTH LEVERS', M, y, { size: 9.5, style: 'bold', color: C.primary })
      y += 5.5
      for (const lever of levers.slice(0, 8)) {
        const label = typeof lever === 'string' ? lever : `${lever.factor ? `${lever.factor}: ` : ''}${lever.explanation || ''}`
        const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
        for (const line of lines) {
          if (y > H - 24) {
            doc.addPage()
            gradientBar(doc, 0, 0, W, 4.5)
            y = 14
          }
          text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
          y += 4.2
        }
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
