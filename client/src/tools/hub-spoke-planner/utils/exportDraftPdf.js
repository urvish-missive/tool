// Builds a PDF of a Markdown draft with jsPDF: headings, paragraphs, lists, quotes, tables,
// inline images and placeholders.
import { jsPDF } from 'jspdf'

const PAGE_H = 841.89
const PAGE_W = 595.28
const M = 56
const INK = [15, 27, 51]

const plain = (t) =>
  t
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, a, u) => (/^https?:/.test(u) ? `${a} (${u})` : a))

export function exportDraftPdf(md, title) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const maxW = PAGE_W - 2 * M
  let y = M
  const need = (h) => {
    if (y + h > PAGE_H - M) {
      doc.addPage()
      y = M
    }
  }
  const text = (t, size, bold, indent = 0, color = INK) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    for (const l of doc.splitTextToSize(plain(t), maxW - indent)) {
      need(size * 1.45)
      doc.text(l, M + indent, y)
      y += size * 1.45
    }
  }
  // Simple grid table: equal columns, wrapped cells, bold shaded header row.
  const table = (rows) => {
    const cols = Math.max(...rows.map((r) => r.length))
    const cw = maxW / cols
    const pad = 5
    const size = 9.5
    doc.setFontSize(size)
    rows.forEach((r, ri) => {
      doc.setFont('helvetica', ri === 0 ? 'bold' : 'normal')
      const wrapped = Array.from({ length: cols }, (_, c) =>
        doc.splitTextToSize(r[c] || '', cw - 2 * pad)
      )
      const h = Math.max(...wrapped.map((w) => w.length)) * size * 1.3 + 2 * pad
      need(h)
      wrapped.forEach((w, c) => {
        const x = M + c * cw
        if (ri === 0) {
          doc.setFillColor(241, 245, 249)
          doc.rect(x, y, cw, h, 'FD')
        } else doc.rect(x, y, cw, h)
        doc.setTextColor(...INK)
        doc.text(w, x + pad, y + pad + size)
      })
      y += h
    })
    y += 12
  }

  const lines = md.split('\n')
  let i = 0
  let para = []
  const flush = () => {
    if (para.length) {
      text(para.join(' '), 11, false)
      y += 6
      para = []
    }
  }
  doc.setDrawColor(203, 213, 225)
  while (i < lines.length) {
    const l = lines[i].trimEnd()
    let m
    if (!l.trim()) {
      flush()
      i++
      continue
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      flush()
      const n = m[1].length
      y += n === 1 ? 0 : 10
      text(m[2], [22, 16, 13, 12][n - 1], true)
      y += 4
      i++
      continue
    }
    if (/^\s*\|/.test(l)) {
      flush()
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|?\s*:?-{2,}/.test(lines[i]))
          rows.push(
            lines[i]
              .trim()
              .replace(/^\||\|$/g, '')
              .split('|')
              .map((c) => plain(c.trim()))
          )
        i++
      }
      if (rows.length) table(rows)
      continue
    }
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      flush()
      text('•  ' + m[1], 11, false, 12)
      i++
      continue
    }
    if ((m = l.match(/^\s*(\d+)[.)]\s+(.*)/))) {
      flush()
      text(m[1] + '.  ' + m[2], 11, false, 12)
      i++
      continue
    }
    if ((m = l.match(/^>\s?(.*)/))) {
      flush()
      text(m[1], 11, false, 14, [90, 106, 133])
      y += 4
      i++
      continue
    }
    if ((m = l.match(/^!\[([^\]]*)\]\((data:image\/[a-z]+;base64,[^)\s]+)\)/))) {
      flush()
      try {
        const props = doc.getImageProperties(m[2])
        const h = (maxW * props.height) / props.width
        need(h + 10)
        doc.addImage(m[2], props.fileType || 'PNG', M, y, maxW, h)
        y += h + 6
        if (m[1]) text(m[1], 9, false, 0, [120, 130, 150])
        y += 6
      } catch {
        text('[Image: ' + m[1] + ']', 10, false, 0, [122, 82, 0])
      }
      i++
      continue
    }
    if (/^\[(STAT|EXAMPLE|QUOTE|IMAGE|INFOGRAPHIC|VIDEO|TABLE):/.test(l)) {
      flush()
      text(l, 10, false, 0, [122, 82, 0])
      y += 4
      i++
      continue
    }
    if (/^\s*[-*_]{3,}\s*$/.test(l)) {
      flush()
      y += 8
      i++
      continue
    }
    para.push(l.trim())
    i++
  }
  flush()
  const n = doc.getNumberOfPages()
  for (let k = 1; k <= n; k++) {
    doc.setPage(k)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 130, 150)
    doc.text(`${plain(title).slice(0, 80)}  ·  ${k}/${n}`, M, PAGE_H - 28)
  }
  return doc.output('blob')
}
