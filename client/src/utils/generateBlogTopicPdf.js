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
 * Blog Topic Generator PDF — pillar topic + clustered topic list with
 * intent/content-type/difficulty tags, in Missive's branded report style.
 */
export function generateBlogTopicPdf(result, meta = {}) {
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
  text(doc, 'Blog Topic Strategy', M, y, { size: 17, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, meta.niche || 'Untitled Niche', M, y, { size: 10, color: C.primary, style: 'bold' })
  y += 6

  const topics = result.topics || []
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 12, 2.5, 2.5, 'FD')
  text(doc, `Content Goal: ${meta.contentGoal || 'Educational'}`, M + 4, y + 7.2, { size: 8, color: C.mid })
  text(doc, `${topics.length} topic(s) generated`, M + CW - 4, y + 7.2, { size: 8, color: C.mid, align: 'right' })
  y += 18

  if (result.pillarTopic?.title) {
    const pillarLines = doc.splitTextToSize(result.pillarTopic.title, CW - 12)
    const blockH = 8 + pillarLines.length * 5.2 + 4
    doc.setFillColor(...C.blueBg)
    doc.setDrawColor(...C.blueBorder)
    doc.roundedRect(M, y, CW, blockH, 2.5, 2.5, 'FD')
    text(doc, 'PILLAR PAGE', M + 4, y + 6, { size: 6.5, style: 'bold', color: C.primary })
    let py = y + 12
    for (const line of pillarLines) {
      text(doc, line, M + 4, py, { size: 10.5, style: 'bold', color: C.dark })
      py += 5.2
    }
    y += blockH + 6
  }

  for (const topic of topics) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    const titleLines = doc.splitTextToSize(topic.title || 'Untitled Topic', CW - 12)
    const blockHeight = 6 + titleLines.length * 5.2 + 10

    if (y + blockHeight > H - 24) {
      doc.addPage()
      gradientBar(doc, 0, 0, W, 4.5)
      y = 14
    }

    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, blockHeight, 2.5, 2.5, 'FD')
    y += 5

    const tags = [topic.contentType, topic.searchIntent, topic.difficulty].filter(Boolean)
    let tagX = M + 4
    for (const tag of tags) {
      const label = String(tag).toUpperCase()
      const w = doc.getTextWidth(label) + 6
      doc.setFillColor(...C.blueBg)
      doc.setDrawColor(...C.blueBorder)
      doc.roundedRect(tagX, y - 3.5, w, 5.5, 1.2, 1.2, 'FD')
      text(doc, label, tagX + 3, y, { size: 6, style: 'bold', color: C.primary })
      tagX += w + 3
    }
    if (topic.cluster) {
      text(doc, topic.cluster, M + CW - 4, y, { size: 6.5, color: C.gray, align: 'right' })
    }
    y += 7

    for (const line of titleLines) {
      text(doc, line, M + 4, y, { size: 10, style: 'bold', color: C.dark })
      y += 5.2
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
