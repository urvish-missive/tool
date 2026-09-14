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

/**
 * FAQ Generator PDF — Q&A list with search-intent tags, in Missive's
 * branded report style.
 */
export function generateFaqPdf(result, meta = {}) {
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
  text(doc, 'FAQ & Schema Report', M, y, { size: 17, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, meta.topic || result.topic || 'Untitled Topic', M, y, { size: 10, color: C.primary, style: 'bold' })
  y += 6

  const faqs = result.faqs || []
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  const summaryLines = doc.splitTextToSize(result.summary || '', CW - 8)
  const summaryBoxH = Math.max(12, summaryLines.length * 4 + 6)
  doc.roundedRect(M, y, CW, summaryBoxH, 2.5, 2.5, 'FD')
  let sy = y + 5.5
  for (const line of summaryLines) {
    text(doc, line, M + 4, sy, { size: 8, color: C.mid })
    sy += 4
  }
  y += summaryBoxH + 6

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const qLines = doc.splitTextToSize(faq.question || 'Untitled Question', CW - 12)
    const aLines = doc.splitTextToSize(faq.answer || '', CW - 12)
    const bulletLines = (faq.bulletPoints || []).flatMap((b) => doc.splitTextToSize(`•  ${b}`, CW - 16))

    const blockHeight =
      6 + qLines.length * 5.2 + 3 + aLines.length * 4.2 + (bulletLines.length ? bulletLines.length * 4.2 + 2 : 0) + 8

    if (y + blockHeight > H - 24) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 4.5)
      y = 14
    }

    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, blockHeight, 2.5, 2.5, 'FD')
    y += 5

    if (faq.type) {
      const label = faq.type.toUpperCase()
      doc.setFillColor(...C.blueBg)
      doc.setDrawColor(...C.blueBorder)
      doc.roundedRect(M + 4, y - 3.5, doc.getTextWidth(label) + 8, 5.5, 1.2, 1.2, 'FD')
      text(doc, label, M + 8, y, { size: 6.5, style: 'bold', color: C.primary })
      y += 6
    }

    for (const line of qLines) {
      text(doc, `Q${i + 1}. ${line}`, M + 4, y, { size: 10, style: 'bold', color: C.dark })
      y += 5.2
    }
    y += 1

    for (const line of aLines) {
      text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
      y += 4.2
    }

    if (bulletLines.length) {
      y += 2
      for (const line of bulletLines) {
        text(doc, line, M + 4, y, { size: 8.5, color: C.mid })
        y += 4.2
      }
    }

    y += 8
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
