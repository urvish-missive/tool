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
 * Case Study Generator PDF — executive snapshot, challenge/solution
 * narrative, metrics, and client quote, in Missive's branded report style.
 */
export function generateCaseStudyPdf(caseStudy) {
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
  const titleLines = doc.splitTextToSize(caseStudy.title || 'Case Study', CW)
  for (const line of titleLines) {
    text(doc, line, M, y, { size: 15, style: 'bold', color: C.dark })
    y += 6
  }
  if (caseStudy.subtitle) {
    const subLines = doc.splitTextToSize(caseStudy.subtitle, CW)
    for (const line of subLines) {
      text(doc, line, M, y, { size: 9.5, color: C.mid })
      y += 4.6
    }
  }
  y += 4

  const snap = caseStudy.executiveSnapshot || {}
  const snapFields = [
    ['Client', snap.client || 'Enterprise Partner'],
    ['Industry', snap.industry || 'B2B'],
    ['Timeframe', snap.timeframe || '90 Days'],
    ['Core Win', snap.coreWin || ''],
  ]
  doc.setFillColor(...C.blueBg)
  doc.setDrawColor(...C.blueBorder)
  doc.roundedRect(M, y, CW, 20, 3, 3, 'FD')
  const colW = CW / 4
  snapFields.forEach(([label, value], i) => {
    const x = M + colW * i + 4
    text(doc, label.toUpperCase(), x, y + 6.5, { size: 6.5, style: 'bold', color: C.gray })
    const lines = doc.splitTextToSize(String(value), colW - 6)
    text(doc, lines[0] || '', x, y + 12.5, { size: 8.5, style: 'bold', color: C.primary })
  })
  y += 26

  const metrics = caseStudy.metrics || []
  if (metrics.length) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'KEY METRICS', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 6
    const mw = CW / Math.min(metrics.length, 3)
    let mx = M
    let rowStartY = y
    let maxRowH = 0
    metrics.forEach((m, i) => {
      if (i > 0 && i % 3 === 0) {
        y += maxRowH + 4
        mx = M
        rowStartY = y
        maxRowH = 0
      }
      doc.setFillColor(...C.white)
      doc.setDrawColor(...C.border)
      const valueLines = doc.splitTextToSize(String(m.value || ''), mw - 10)
      const labelLines = doc.splitTextToSize(m.label || '', mw - 10)
      const boxH = 10 + valueLines.length * 5 + labelLines.length * 4
      doc.roundedRect(mx, rowStartY, mw - 4, boxH, 2.5, 2.5, 'FD')
      let by = rowStartY + 7
      for (const line of valueLines) {
        text(doc, line, mx + 4, by, { size: 11, style: 'bold', color: C.primary })
        by += 5
      }
      for (const line of labelLines) {
        text(doc, line, mx + 4, by, { size: 7, color: C.mid })
        by += 4
      }
      maxRowH = Math.max(maxRowH, boxH)
      mx += mw
    })
    y = rowStartY + maxRowH + 8
  }

  const challenge = caseStudy.theChallenge
  if (challenge?.context) {
    y = ensureSpace(doc, y, 14, W, H)
    text(doc, 'THE CHALLENGE', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 5.5
    const lines = doc.splitTextToSize(challenge.context, CW - 4)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.2, W, H)
      text(doc, line, M, y, { size: 8.5, color: C.mid })
      y += 4.2
    }
    for (const b of (challenge.bottlenecks || [])) {
      const bLines = doc.splitTextToSize(`•  ${b}`, CW - 8)
      for (const line of bLines) {
        y = ensureSpace(doc, y, 4.2, W, H)
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
    y += 4
  }

  const solution = caseStudy.theSolution
  if (solution?.overview) {
    y = ensureSpace(doc, y, 14, W, H)
    text(doc, 'THE SOLUTION', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 5.5
    const lines = doc.splitTextToSize(solution.overview, CW - 4)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.2, W, H)
      text(doc, line, M, y, { size: 8.5, color: C.mid })
      y += 4.2
    }
    for (const s of (solution.implementationSteps || [])) {
      const sLines = doc.splitTextToSize(`•  ${s}`, CW - 8)
      for (const line of sLines) {
        y = ensureSpace(doc, y, 4.2, W, H)
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }
    y += 4
  }

  const quote = caseStudy.clientQuote
  if (quote?.quote) {
    const qLines = doc.splitTextToSize(`"${quote.quote}"`, CW - 12)
    const blockH = qLines.length * 5 + 14
    y = ensureSpace(doc, y, blockH, W, H)
    doc.setFillColor(...C.lightGray)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, blockH, 2.5, 2.5, 'FD')
    let qy = y + 7
    for (const line of qLines) {
      text(doc, line, M + 5, qy, { size: 9, style: 'italic', color: C.dark })
      qy += 5
    }
    text(doc, `— ${quote.author || ''}${quote.role ? `, ${quote.role}` : ''}${quote.company ? `, ${quote.company}` : ''}`, M + 5, qy + 2, {
      size: 7.5, color: C.gray,
    })
    y += blockH + 6
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
