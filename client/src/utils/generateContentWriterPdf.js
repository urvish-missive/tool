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
 * AI Content Writer PDF — full generated article with meta tags and FAQ,
 * in Missive's branded report style.
 */
export function generateContentWriterPdf(result) {
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
  const titleLines = doc.splitTextToSize(result.title || 'Generated Content', CW)
  for (const line of titleLines) {
    text(doc, line, M, y, { size: 15, style: 'bold', color: C.dark })
    y += 6
  }
  y += 2

  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 10, 2, 2, 'FD')
  text(doc, `${result.actualWordCount || result.wordCount || 0} words  •  ${result.estimatedReadTime || ''}`, M + 4, y + 6.5, { size: 8, color: C.mid })
  text(doc, result.focusKeyword || '', M + CW - 4, y + 6.5, { size: 8, color: C.primary, style: 'bold', align: 'right' })
  y += 16

  if (result.introduction) {
    const lines = doc.splitTextToSize(result.introduction, CW)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.6, W, H)
      text(doc, line, M, y, { size: 9, style: 'italic', color: C.mid })
      y += 4.6
    }
    y += 4
  }

  for (const h of (result.headings || [])) {
    y = ensureSpace(doc, y, 10, W, H)
    text(doc, h.text || '', M, y, { size: 12, style: 'bold', color: C.primary })
    y += 6
    const lines = doc.splitTextToSize(h.content || '', CW)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.5, W, H)
      text(doc, line, M, y, { size: 8.5, color: C.mid })
      y += 4.5
    }
    y += 3
    for (const sub of (h.subheadings || [])) {
      y = ensureSpace(doc, y, 8, W, H)
      text(doc, sub.text || '', M + 4, y, { size: 10, style: 'bold', color: C.dark })
      y += 5
      const subLines = doc.splitTextToSize(sub.content || '', CW - 4)
      for (const line of subLines) {
        y = ensureSpace(doc, y, 4.2, W, H)
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
      y += 2
    }
    y += 4
  }

  if (result.conclusion) {
    y = ensureSpace(doc, y, 10, W, H)
    text(doc, 'Conclusion', M, y, { size: 12, style: 'bold', color: C.primary })
    y += 6
    const lines = doc.splitTextToSize(result.conclusion, CW)
    for (const line of lines) {
      y = ensureSpace(doc, y, 4.5, W, H)
      text(doc, line, M, y, { size: 8.5, color: C.mid })
      y += 4.5
    }
    y += 4
  }

  const faqs = result.faqSection || []
  if (faqs.length) {
    y = ensureSpace(doc, y, 10, W, H)
    text(doc, 'FAQ', M, y, { size: 12, style: 'bold', color: C.primary })
    y += 6
    for (const faq of faqs) {
      const qLines = doc.splitTextToSize(faq.question || '', CW)
      const aLines = doc.splitTextToSize(faq.answer || '', CW)
      y = ensureSpace(doc, y, (qLines.length + aLines.length) * 4.4 + 4, W, H)
      for (const line of qLines) {
        text(doc, line, M, y, { size: 9, style: 'bold', color: C.dark })
        y += 4.4
      }
      for (const line of aLines) {
        text(doc, line, M, y, { size: 8.5, color: C.mid })
        y += 4.4
      }
      y += 3
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
