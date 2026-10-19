// Small Markdown renderer for draft previews and HTML export (headings, lists, bold, links, tables,
// images, blockquotes and [STAT: ...] style placeholders). All text is escaped.

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

export const PLACEHOLDER_RE = /\[(STAT|EXAMPLE|QUOTE|IMAGE|INFOGRAPHIC|VIDEO|TABLE):/g

const inline = (t) =>
  esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) =>
      /^(https?:\/\/|data:image\/|\/uploads\/)/.test(u)
        ? `<figure><img src="${u}" alt="${a}" loading="lazy">${a ? `<figcaption>${a}</figcaption>` : ''}</figure>`
        : m
    )
    .replace(
      /\[(STAT|EXAMPLE|QUOTE|IMAGE|INFOGRAPHIC|VIDEO|TABLE):\s*([^\]]+)\]/g,
      '<span class="ph ph-$1"><b>$1</b> $2</span>'
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, a, u) =>
      /^https?:\/\//i.test(u)
        ? `<a href="${u}" target="_blank" rel="noopener">${a}</a>`
        : `<a class="todo" title="${u}">${a}</a>`
    )

export function mdToHtml(md) {
  const out = []
  let listTag = null
  let para = []
  let tableOpen = false
  const flush = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }
  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`)
      listTag = null
    }
  }
  const cells = (r) =>
    r
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())
  for (const raw of md.split('\n')) {
    const l = raw.trimEnd()
    let m
    if (!l.trim()) {
      flush()
      closeList()
      continue
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      flush()
      closeList()
      const n = m[1].length
      out.push(`<h${n}>${inline(m[2])}</h${n}>`)
      continue
    }
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      flush()
      if (listTag !== 'ul') {
        closeList()
        listTag = 'ul'
        out.push('<ul>')
      }
      out.push(`<li>${inline(m[1])}</li>`)
      continue
    }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) {
      flush()
      if (listTag !== 'ol') {
        closeList()
        listTag = 'ol'
        out.push('<ol>')
      }
      out.push(`<li>${inline(m[1])}</li>`)
      continue
    }
    if ((m = l.match(/^>\s?(.*)/))) {
      flush()
      closeList()
      out.push(`<blockquote>${inline(m[1])}</blockquote>`)
      continue
    }
    if (/^\s*\|/.test(l)) {
      flush()
      closeList()
      if (/^\s*\|?\s*:?-{2,}/.test(l)) continue // separator row
      if (!tableOpen) {
        out.push(
          `<div class="tablewrap mdt"><table><thead><tr>${cells(l)
            .map((c) => `<th>${inline(c)}</th>`)
            .join('')}</tr></thead><tbody>`
        )
        tableOpen = true
      } else
        out.push(
          `<tr>${cells(l)
            .map((c) => `<td>${inline(c)}</td>`)
            .join('')}</tr>`
        )
      continue
    } else if (tableOpen) {
      out.push('</tbody></table></div>')
      tableOpen = false
    }
    if (/^\s*[-*_]{3,}\s*$/.test(l)) {
      flush()
      closeList()
      out.push('<hr>')
      continue
    }
    if (/^\[(STAT|EXAMPLE|QUOTE|IMAGE|INFOGRAPHIC|VIDEO|TABLE):/.test(l)) {
      flush()
      closeList()
      out.push(`<div class="phblock">${inline(l)}</div>`)
      continue
    }
    para.push(l.trim())
  }
  flush()
  closeList()
  if (tableOpen) out.push('</tbody></table></div>')
  return out.join('\n')
}

// Same renderer as the preview, with placeholders turned into visible bracketed notes.
// forWp: only the body, for the WordPress REST API.
export function exportHtml(md, forWp) {
  let h = mdToHtml(md)
    .replace(
      /<span class="ph ph-([A-Z]+)"><b>[A-Z]+<\/b> ([^<]*)<\/span>/g,
      (m, t, x) => `<mark style="background:#fff3c4">[${t}: ${x}]</mark>`
    )
    .replace(/<div class="phblock">(.*?)<\/div>/g, '<p>$1</p>')
    .replace(/<a class="todo" title="([^"]*)">([^<]*)<\/a>/g, '$2 <em>($1)</em>')
    .replace(/<div class="tablewrap mdt">/g, '<div>')
  h = h.replace(/<table>/g, '<table border="1" cellpadding="6" style="border-collapse:collapse">')
  return forWp
    ? h
    : `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:40px auto;line-height:1.55}h1{font-size:28px}h2{font-size:21px;margin-top:28px}h3{font-size:17px}th{text-align:left;background:#f1f5f9}</style></head><body>${h}</body></html>`
}
