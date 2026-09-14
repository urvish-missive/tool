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
  amber: [217, 119, 6],
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

function scoreColor(score) {
  if (score === null || score === undefined) return C.gray
  if (score >= 80) return C.green
  if (score >= 50) return C.amber
  return C.red
}

const PILLAR_LABELS = {
  experience: 'Experience',
  expertise: 'Expertise',
  authoritativeness: 'Authoritativeness',
  trustworthiness: 'Trustworthiness',
}

/**
 * E-E-A-T Analyzer PDF — overall score, four-pillar breakdown, and top
 * recommendations, in Missive's branded report style.
 */
export function generateEeatPdf(result) {
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
  text(doc, 'E-E-A-T & AI Search Authority Report', M, y, { size: 16, style: 'bold', color: C.dark })
  y += 5.8
  text(doc, result.title || result.url || 'Untitled Content', M, y, { size: 10, color: C.primary, style: 'bold' })
  y += 8

  const overallScore = result.eeat?.overallScore ?? result.overallScore
  doc.setFillColor(...C.lightGray)
  doc.setDrawColor(...C.border)
  doc.roundedRect(M, y, CW, 20, 3, 3, 'FD')
  text(doc, 'OVERALL SCORE', M + 6, y + 8, { size: 8, style: 'bold', color: C.gray })
  text(doc, overallScore !== null && overallScore !== undefined ? `${overallScore}/100` : 'N/A', M + 6, y + 15.5, {
    size: 13, style: 'bold', color: scoreColor(overallScore),
  })
  text(doc, result.eeat?.grade || '', M + CW - 6, y + 12, { size: 10, style: 'bold', color: C.primary, align: 'right' })
  y += 26

  const pillars = result.eeat?.pillars || result.pillars || {}
  for (const key of ['experience', 'expertise', 'authoritativeness', 'trustworthiness']) {
    const p = pillars[key]
    if (!p) continue
    const strengths = (p.strengths || []).slice(0, 3)
    const gaps = (p.gaps || []).slice(0, 3)
    const lines = [...strengths.map((s) => `+ ${s}`), ...gaps.map((g) => `- ${g}`)]
    const wrapped = lines.flatMap((l) => doc.splitTextToSize(l, CW - 16))
    const blockH = 12 + wrapped.length * 4.2 + 4

    y = ensureSpace(doc, y, blockH, W, H)
    doc.setFillColor(...C.white)
    doc.setDrawColor(...C.border)
    doc.roundedRect(M, y, CW, blockH, 2.5, 2.5, 'FD')
    y += 7
    text(doc, PILLAR_LABELS[key], M + 4, y, { size: 10.5, style: 'bold', color: C.dark })
    const scoreLabel = p.score !== null && p.score !== undefined ? `${p.score}/${p.maxScore || 25}` : 'N/A'
    text(doc, scoreLabel, M + CW - 4, y, { size: 10.5, style: 'bold', color: scoreColor(p.score), align: 'right' })
    y += 5.5
    for (const line of wrapped) {
      text(doc, line, M + 6, y, { size: 8, color: C.mid })
      y += 4.2
    }
    y += 6
  }

  const recommendations = result.recommendations || []
  if (recommendations.length) {
    y = ensureSpace(doc, y, 12, W, H)
    text(doc, 'RECOMMENDATIONS', M, y, { size: 9.5, style: 'bold', color: C.primary })
    y += 5.5
    for (const rec of recommendations.slice(0, 10)) {
      const label = typeof rec === 'string' ? rec : rec.title || rec.recommendation || JSON.stringify(rec)
      const lines = doc.splitTextToSize(`•  ${label}`, CW - 8)
      y = ensureSpace(doc, y, lines.length * 4.2 + 2, W, H)
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
